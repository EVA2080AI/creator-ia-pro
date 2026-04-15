import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { StudioFile } from '@/hooks/useStudioProjects';
import {
  detectIntent,
  processRawResponse,
  wantsProjectReset,
  extractDeleteCommands,
  detectMissingDependencies,
  injectDependenciesIntoPackageJson,
  isResponseTruncated
} from '@/components/studio/chat/utils';
import { CODE_GEN_SYSTEM, GENESIS_CHAT_SYSTEM, IMAGE_TO_CODE_SYSTEM } from '@/prompts';
import type { AgentPhase, AgentSpecialist, CodeGenResult, Message, AgentPreference } from '@/components/studio/chat/types';

export type { AgentPhase, AgentSpecialist };

interface UseStudioChatAIProps {
  projectFiles: Record<string, StudioFile>;
  selectedModel: string;
  convHistory: Message[];
  persona: 'genesis' | 'antigravity';
  isArchitectMode: boolean;
  activeFile?: string | null;
  supabaseConfig?: { url: string; anonKey: string } | null;
  subscriptionTier?: 'free' | 'pro' | 'admin' | null;
  onPhaseChange?: (phase: AgentPhase, specialist?: AgentSpecialist) => void;
  onStreamCharsChange?: (chars: number, preview: string) => void;
  onGeneratingChange?: (v: boolean) => void;
}

export function useStudioChatAI({
  projectFiles,
  selectedModel,
  convHistory,
  persona,
  isArchitectMode,
  activeFile,
  supabaseConfig,
  subscriptionTier = 'free',
  onPhaseChange,
  onStreamCharsChange,
  onGeneratingChange
}: UseStudioChatAIProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamChars, setStreamChars] = useState(0);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [genPhase, setGenPhase] = useState<AgentPhase>('idle');
  const [genSpecialist, setGenSpecialist] = useState<AgentSpecialist>('none');
  const [currentGenIntent, setCurrentGenIntent] = useState<'codegen' | 'chat' | null>(null);

  // Budget limits segun tier
  const isPro = subscriptionTier && subscriptionTier !== 'free';
  const BUDGET = {
    maxHistory: isPro ? 15 : 6,
    maxSnapshotChars: isPro ? 4000 : 2000,
    maxCodeTokens: isPro ? 16000 : 8000,
    maxChatTokens: isPro ? 8000 : 3000,
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef('');

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    onGeneratingChange?.(false);
    setGenPhase('idle');
    setGenSpecialist('none');
    onPhaseChange?.('idle', 'none');
    setStreamingContent(null);
  }, [onGeneratingChange, onPhaseChange]);

  // Build simple project context
  const buildContext = useCallback((files: Record<string, StudioFile>, active?: string | null): string => {
    const keys = Object.keys(files);
    if (keys.length === 0) return '';

    // File tree
    const tree = keys.slice(0, 10).map(k => `  - ${k}`).join('\n');

    // Active file content
    let activeContent = '';
    if (active && files[active]) {
      activeContent = `\n\n// Archivo activo: ${active}\n${files[active].content.slice(0, BUDGET.maxSnapshotChars)}`;
    }

    return `=== CONTEXTO DEL PROYECTO ===\nArchivos: ${keys.length}\n${tree}${activeContent}\n=== FIN CONTEXTO ===`;
  }, [BUDGET.maxSnapshotChars]);

  const generateCode = useCallback(async (
    prompt: string,
    options?: { pendingImage?: string | null; pendingUrl?: string | null; preferences?: AgentPreference[] }
  ): Promise<CodeGenResult | null> => {
    setIsGenerating(true);
    onGeneratingChange?.(true);
    onPhaseChange?.('thinking');
    setGenPhase('thinking');
    setGenSpecialist('none');
    setStreamChars(0);
    streamBufferRef.current = '';
    setStreamingContent(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const hasImage = !!(options?.pendingImage);
    const intent = hasImage && !prompt.trim() ? 'codegen' : detectIntent(prompt);
    setCurrentGenIntent(intent === 'chat' ? 'chat' : 'codegen');

    // Handle reset
    if (wantsProjectReset(prompt)) {
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenPhase('idle');
      return {
        files: {},
        explanation: 'Proyecto limpiado. Puedes empezar de cero.',
        isChatOnly: false,
        stack: [],
        deps: [],
        suggestions: ['Crear landing page', 'Crear componente', 'Crear dashboard']
      };
    }

    // Handle deletes
    const deletes = extractDeleteCommands(prompt);
    if (deletes.length > 0 && Object.keys(projectFiles).length > 0) {
      const updatedFiles = { ...projectFiles };
      for (const filename of deletes) {
        delete updatedFiles[filename];
      }
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenPhase('idle');
      return {
        files: updatedFiles,
        explanation: `Archivos eliminados: ${deletes.join(', ')}`,
        isChatOnly: false,
        stack: [],
        deps: [],
        suggestions: []
      };
    }

    // HTML import
    const isHtmlImport = intent === 'html-import' && (prompt.includes('<!DOCTYPE') || prompt.includes('<html'));
    if (isHtmlImport) {
      const files: Record<string, StudioFile> = {
        'index.html': { language: 'html', content: prompt }
      };
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenPhase('idle');
      return {
        files,
        explanation: 'HTML importado directamente.',
        isChatOnly: false,
        stack: ['HTML', 'CSS'],
        deps: [],
        suggestions: ['Convertir a React', 'Agregar interactividad']
      };
    }

    try {
      const isChatMode = intent === 'chat';
      const projectContext = buildContext(projectFiles, activeFile);

      // Build system prompt
      let systemPrompt = isChatMode
        ? (persona === 'antigravity' ? GENESIS_CHAT_SYSTEM : CODE_GEN_SYSTEM)
        : CODE_GEN_SYSTEM;

      if (hasImage) {
        systemPrompt = IMAGE_TO_CODE_SYSTEM;
      }

      // Add context for code generation
      if (!isChatMode && projectContext) {
        systemPrompt += `\n\n${projectContext}`;
      }

      if (supabaseConfig) {
        systemPrompt += `\n\nSupabase: URL=${supabaseConfig.url}`;
      }

      // User content
      let userContent: any = prompt;
      if (hasImage) {
        userContent = [
          { type: 'image_url', image_url: { url: options!.pendingImage } },
          { type: 'text', text: prompt || 'Replica este diseno en codigo React.' }
        ];
      }

      // Special instructions for landing pages
      if (intent === 'fullstack' || intent === 'codegen') {
        if (prompt.toLowerCase().includes('landing')) {
          systemPrompt += '\n\nCREA UNA LANDING PAGE COMPLETA con Hero, Features, CTA y Footer.';
        }
      }

      // History slice
      const historySlice = convHistory.slice(-BUDGET.maxHistory);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...historySlice,
        { role: 'user', content: userContent }
      ];

      // Select model
      let targetModel = selectedModel;
      if (hasImage && (selectedModel.includes('deepseek'))) {
        targetModel = 'google/gemini-2.0-flash-001';
      }

      setGenPhase('streaming');
      setGenSpecialist('frontend');
      onPhaseChange?.('generating', 'frontend');

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: targetModel,
            messages,
            stream: true,
            temperature: isChatMode ? 0.7 : 0.3,
            max_tokens: isChatMode ? BUDGET.maxChatTokens : BUDGET.maxCodeTokens
          }
        })
      });

      if (!res.ok) throw new Error(await res.text());

      // Read stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';
      let lastUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') {
              accumulated += delta;
              streamBufferRef.current = accumulated;

              const now = Date.now();
              if (now - lastUpdate > 50) {
                setStreamChars(accumulated.length);
                setStreamingContent(accumulated);
                onStreamCharsChange?.(accumulated.length, accumulated.slice(-500));
                lastUpdate = now;
              }
            }
          } catch { /* skip */ }
        }
      }

      // Process response
      const result = processRawResponse(accumulated, prompt, isChatMode);

      // Check if response was truncated
      const wasTruncated = isResponseTruncated(accumulated);
      if (wasTruncated) {
        console.warn('[useStudioChatAI] Response appears truncated - code may be incomplete');
        // Add warning to explanation
        if (result && !isChatMode) {
          result.explanation = '⚠️ **Atención**: La respuesta parece haber sido truncada por límite de tokens. El código puede estar incompleto.\n\n' + (result.explanation || '');
        }
      }

      // Inject missing dependencies
      if (result?.files && Object.keys(result.files).length > 0) {
        const missingDeps = detectMissingDependencies(result.files);
        if (missingDeps.length > 0) {
          result.files = injectDependenciesIntoPackageJson(result.files, missingDeps);
        }
      }

      setGenPhase('done');
      setTimeout(() => {
        setIsGenerating(false);
        onGeneratingChange?.(false);
        setGenPhase('idle');
        setGenSpecialist('none');
        onPhaseChange?.('idle', 'none');
      }, 100);

      return result;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.error('[useStudioChatAI] Error:', err);
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenPhase('idle');
      throw err;
    }
  }, [projectFiles, selectedModel, convHistory, persona, isArchitectMode, activeFile, supabaseConfig, BUDGET, buildContext, onGeneratingChange, onPhaseChange, onStreamCharsChange]);

  return {
    isGenerating,
    streamChars,
    streamingContent,
    genPhase,
    genSpecialist,
    currentGenIntent,
    generateCode,
    stopGeneration
  };
}
