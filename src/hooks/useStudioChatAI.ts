import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { aiService } from '@/services/ai-service';
import { detectIntent, processRawResponse } from '@/components/studio/chat/utils';
import { 
  CODE_GEN_SYSTEM, 
  GENESIS_CHAT_SYSTEM, 
  ANTIGRAVITY_CHAT_SYSTEM, 
  ARCHITECT_SYSTEM_PROMPT, 
  CLONE_SYSTEM_PROMPT 
} from '@/prompts';
import { MODELS } from '@/components/studio/chat/constants';

export type AgentPhase = 'idle' | 'thinking' | 'generating' | 'architecting' | 'fixing';
export type AgentSpecialist = 'ux' | 'frontend' | 'backend' | 'devops' | 'game' | 'architect' | 'engineer' | 'none';

interface UseStudioChatAIProps {
  projectFiles: Record<string, StudioFile>;
  selectedModel: string;
  convHistory: any[];
  persona: 'genesis' | 'antigravity';
  isArchitectMode: boolean;
  activeFile?: string | null;
  supabaseConfig?: { url: string; anonKey: string } | null;
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
  onPhaseChange,
  onStreamCharsChange,
  onGeneratingChange
}: UseStudioChatAIProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamChars, setStreamChars] = useState(0);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [genPhase, setGenPhase] = useState<'idle' | 'thinking' | 'streaming' | 'done'>('idle');
  const [genSpecialist, setGenSpecialist] = useState<AgentSpecialist>('none');
  const [currentGenIntent, setCurrentGenIntent] = useState<'codegen' | 'chat' | null>(null);
  
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

  const generateCode = useCallback(async (
    prompt: string,
    options?: { pendingImage?: string | null; pendingUrl?: string | null; preferences?: any[] }
  ) => {
    setIsGenerating(true);
    onGeneratingChange?.(true);
    onPhaseChange?.('thinking');
    setStreamChars(0);
    setGenPhase('thinking');
    streamBufferRef.current = '';
    setStreamingContent(null);
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const intent = detectIntent(prompt);
    const prefContext = (options?.preferences || []).map(p => `[MEMORIA ${p.agent_id.toUpperCase()}]: ${p.instructions}`).join('\n');
    
    // Auto-trigger Architect Mode for fullstack creation intents
    const isChatModeActive = intent === 'chat';
    const isArchitectRequest = (isArchitectMode || intent === 'fullstack') && !isChatModeActive;
    
    setCurrentGenIntent(isArchitectRequest ? 'chat' : (isChatModeActive ? 'chat' : 'codegen'));

    try {
      const fileKeys = Object.keys(projectFiles);
      const mentionMatches = [...prompt.matchAll(/@([\w./\-]+)/g)];
      const mentionedFiles = mentionMatches.map(m => m[1]).filter(f => projectFiles[f]);
      
      let contextBlock = mentionedFiles.length > 0
        ? '\n\n[ARCHIVOS MENCIONADOS]\n' + mentionedFiles.map(f => `// @${f}\n${projectFiles[f].content.slice(0, 10000)}`).join('\n\n')
        : '';

      // Smart Context: If no mentions, find high-relevance files based on intent
      if (fileKeys.length > 0 && !contextBlock) {
        const pLower = prompt.toLowerCase();
        let importantFiles = [];
        
        if (pLower.includes('db') || pLower.includes('base de datos') || pLower.includes('supabase')) {
          importantFiles = fileKeys.filter(f => f.includes('sql') || f.includes('service') || f.includes('integration'));
        } else if (pLower.includes('ui') || pLower.includes('estética') || pLower.includes('diseño') || pLower.includes('css')) {
          importantFiles = fileKeys.filter(f => f.includes('css') || f.includes('components') || f.includes('App.tsx'));
        } else if (pLower.includes('nav') || pLower.includes('sidebar') || pLower.includes('route')) {
          importantFiles = fileKeys.filter(f => f.includes('sidebar') || f.includes('Navbar') || f.includes('App.tsx'));
        }
        
        const finalSelection = [...new Set([...importantFiles, activeFile].filter(Boolean) as string[])].slice(0, 6);
        
        if (finalSelection.length > 0) {
          contextBlock = `\n\n[CONTEXTO RELEVANTE]:\n` +
            finalSelection.map(f => `// ${f}\n${projectFiles[f].content.slice(0, 8000)}`).join('\n\n');
        } else {
          // Fallback to basic overview
          contextBlock = `\n\n[PROYECTO ACTIVO]:\nArchivos: ${fileKeys.join(', ')}\n${activeFile ? `\n[ARCHIVO ACTUALMENTE ABIERTO]: ${activeFile}\nCONTENIDO: ${projectFiles[activeFile]?.content || ''}\n` : ''}\n`;
        }
      }

      const supabaseContext = supabaseConfig ? `\n\nSUPABASE: URL: ${supabaseConfig.url} | Key: ${supabaseConfig.anonKey}. Usa window.supabaseClient.` : '';
      
      let effectiveSystemPrompt = isArchitectRequest ? ARCHITECT_SYSTEM_PROMPT : (isChatModeActive ? (persona === 'antigravity' ? ANTIGRAVITY_CHAT_SYSTEM : GENESIS_CHAT_SYSTEM) : CODE_GEN_SYSTEM);
      let userContent: any = prompt + contextBlock;

      if (options?.pendingUrl) {
         const parsedClone = JSON.parse(options.pendingUrl);
         effectiveSystemPrompt = CLONE_SYSTEM_PROMPT + (parsedClone.content || '');
         userContent = `[URL]: ${parsedClone.url}\n[PROMPT]: ${prompt}`;
      }

      const historySlice = convHistory.slice(-12); // Slightly more history
      const messages = [
        { role: 'system', content: effectiveSystemPrompt + (isChatModeActive ? '' : supabaseContext) + `\n\n${prefContext}` },
        ...historySlice,
        { role: 'user', content: options?.pendingImage ? [{ type: 'image_url', image_url: { url: options.pendingImage } }, { type: 'text', text: userContent }] : userContent }
      ];

      // Logic to detect if we need a "PRO" model for complex tasks
      const complexTask = prompt.length > 500 || prompt.toLowerCase().includes('refactor') || prompt.toLowerCase().includes('arquitectura') || isArchitectRequest;
      const targetModel = (isChatModeActive && !options?.pendingUrl && !options?.pendingImage && !complexTask) 
        ? 'google/gemini-2.0-flash-001' 
        : (selectedModel === 'google/gemini-2.0-flash-001' && complexTask ? 'google/gemini-2.5-pro-preview-03-25' : selectedModel);


      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: targetModel,
            messages,
            stream: true,
            temperature: isChatModeActive ? 0.7 : 0.2, // Slightly more creative in chat
            max_tokens: isChatModeActive ? 8192 : 25000, // More tokens for complex code/architecture

          },
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') {
              accumulated += delta;
              setStreamChars(accumulated.length);
              onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
              setGenPhase('streaming');
              streamBufferRef.current = accumulated;
              
              // Specialist detection
              if (accumulated.includes('[UX_ENGINE]')) { setGenSpecialist('ux'); onPhaseChange?.('generating', 'ux'); }
              else if (accumulated.includes('[FRONTEND_DEV]')) { setGenSpecialist('frontend'); onPhaseChange?.('generating', 'frontend'); }
              else if (accumulated.includes('[BACKEND_DEV]')) { setGenSpecialist('backend'); onPhaseChange?.('generating', 'backend'); }
              else if (accumulated.includes('[ARCHITECT]')) { setGenSpecialist('architect'); onPhaseChange?.('generating', 'architect'); }
              else if (accumulated.includes('[ENGINEER]')) { setGenSpecialist('engineer'); onPhaseChange?.('generating', 'engineer'); }
            }
          } catch {}
        }
      }

      const finalResult = processRawResponse(accumulated, prompt, isChatModeActive || isArchitectRequest);
      return finalResult;

    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Error en generación');
      return null;
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setStreamingContent(streamBufferRef.current);
      setGenPhase('done');
      onPhaseChange?.('idle');
      setTimeout(() => { setGenPhase('idle'); setStreamingContent(null); streamBufferRef.current = ''; }, 400);
    }
  }, [projectFiles, selectedModel, convHistory, persona, isArchitectMode, activeFile, supabaseConfig, onPhaseChange, onStreamCharsChange, onGeneratingChange]);

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
