import { useState, useRef, useCallback } from 'react';
import type { StudioFile } from '@/hooks/useStudioProjects';
import {
  detectIntent,
  processRawResponse,
  wantsProjectReset,
  extractDeleteCommands,
  detectMissingDependencies,
  injectDependenciesIntoPackageJson,
  isResponseTruncated,
  extractCompleteXmlFiles
} from '@/components/studio/chat/utils';
import { CODE_GEN_SYSTEM, GENESIS_CHAT_SYSTEM, IMAGE_TO_CODE_SYSTEM, REASONING_SYSTEM_PROMPT } from '@/prompts';
import type { AgentPhase, AgentSpecialist, CodeGenResult, Message, AgentPreference } from '@/components/studio/chat/types';

export type { AgentPhase, AgentSpecialist };

interface UseStudioChatAIProps {
  projectFiles: Record<string, StudioFile>;
  selectedModel: string;
  convHistory: Message[];
  isArchitectMode: boolean;
  activeFile?: string | null;
  supabaseConfig?: { url: string; anonKey: string } | null;
  subscriptionTier?: 'free' | 'pro' | 'admin' | null;
  /** Proyecto de Genesis + conversación activa — el servidor persiste el historial. */
  projectId?: string | null;
  conversationId?: string | null;
  onPhaseChange?: (phase: AgentPhase, specialist?: AgentSpecialist) => void;
  onStreamCharsChange?: (chars: number, preview: string) => void;
  onGeneratingChange?: (v: boolean) => void;
  /** Llamado cada vez que un nuevo <file> se cierra durante el stream (UX en vivo) */
  onFileStream?: (path: string, totalCompleted: number) => void;
}

export function useStudioChatAI({
  projectFiles,
  selectedModel,
  convHistory,
  isArchitectMode,
  activeFile,
  supabaseConfig,
  subscriptionTier = 'free',
  projectId,
  conversationId,
  onPhaseChange,
  onStreamCharsChange,
  onGeneratingChange,
  onFileStream
}: UseStudioChatAIProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamChars, setStreamChars] = useState(0);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [genPhase, setGenPhase] = useState<AgentPhase>('idle');
  const [genSpecialist, setGenSpecialist] = useState<AgentSpecialist>('none');
  const [currentGenIntent, setCurrentGenIntent] = useState<'codegen' | 'chat' | 'reasoning' | null>(null);

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
    setCurrentGenIntent(intent === 'chat' ? 'chat' : intent === 'reasoning' ? 'reasoning' : 'codegen');

    // Generación de imagen — corta el flujo de codegen por completo, ver api/ai/image.ts.
    if (intent === 'image') {
      setGenPhase('streaming');
      setGenSpecialist('none');
      onPhaseChange?.('generating', 'none');
      try {
        const res = await fetch('/api/ai/image', {
          method: 'POST',
          signal,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, imagePrompt: options?.pendingImage || undefined }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Error ${res.status} generando la imagen`);
        }
        setGenPhase('done');
        setTimeout(() => {
          setIsGenerating(false);
          onGeneratingChange?.(false);
          setGenPhase('idle');
          setGenSpecialist('none');
          onPhaseChange?.('idle', 'none');
        }, 100);
        return {
          files: {},
          explanation: `Imagen generada: "${prompt}"`,
          isChatOnly: true,
          stack: [],
          deps: [],
          suggestions: [],
          generatedImageUrl: data.imageUrl,
        };
      } catch (err: any) {
        setIsGenerating(false);
        onGeneratingChange?.(false);
        setGenPhase('idle');
        if (err?.name === 'AbortError') return null;
        throw err;
      }
    }

    // Generación de video — no hay proveedor conectado todavía (Replicate sin
    // saldo, OpenRouter sin ningún modelo de salida de video — verificado en
    // vivo). Sin este branch, pedir un video caía en 'chat' o 'codegen' sin
    // aviso: el usuario no se enteraba de que la función no existe. Responde
    // directo, sin gastar créditos ni tirar un error feo en el chat.
    if (intent === 'video') {
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenPhase('idle');
      onPhaseChange?.('idle', 'none');
      return {
        files: {},
        explanation: 'La generación de video todavía no está disponible — no tengo un proveedor conectado para eso ahora mismo. Puedo generar imágenes o construir la app mientras tanto, avisame qué necesitás.',
        isChatOnly: true,
        stack: [],
        deps: [],
        suggestions: [],
      };
    }

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

    // HTML import - extract HTML content from prompt if it contains context markers
    const htmlContentMatch = prompt.match(/\[CONTEXTO:.*?\]\n```(?:html)?\n([\s\S]*?)\n```/i);
    const htmlContent = htmlContentMatch ? htmlContentMatch[1] : prompt;

    const isHtmlImport = intent === 'html-import' && (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html'));
    if (isHtmlImport) {
      const files: Record<string, StudioFile> = {
        'index.html': { language: 'html', content: htmlContent }
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

    // Vanilla HTML mode - when user explicitly wants plain HTML
    const wantsVanillaHtml = intent === 'vanilla-html' ||
      (prompt.toLowerCase().includes('solo html') || prompt.toLowerCase().includes('sin react') ||
       prompt.toLowerCase().includes('html puro') || prompt.toLowerCase().includes('vanilla html'));

    if (wantsVanillaHtml && intent !== 'chat') {
      // For vanilla HTML requests, we'll generate a single HTML file
      // This is handled by the AI response, but we mark it for special processing
      console.log('[useStudioChatAI] Vanilla HTML mode detected');
    }

    try {
      const isChatMode = intent === 'chat';
      const isReasoningMode = intent === 'reasoning';
      const projectContext = buildContext(projectFiles, activeFile);

      // Build system prompt
      let systemPrompt;
      if (isReasoningMode) {
        systemPrompt = REASONING_SYSTEM_PROMPT;
      } else if (isChatMode) {
        // GENESIS_CHAT_SYSTEM es explícito: "si el usuario solo saluda...
        // NO generes código — solo conversa" (bug real que existió acá:
        // ver commit "Fix Genesis chat" de esta semana).
        systemPrompt = GENESIS_CHAT_SYSTEM;
      } else if (hasImage) {
        systemPrompt = IMAGE_TO_CODE_SYSTEM;
      } else {
        systemPrompt = CODE_GEN_SYSTEM;
      }

      // El contexto del proyecto (nombres de archivo + contenido del archivo
      // activo, ya acotado por BUDGET.maxSnapshotChars) se suma también en
      // modo conversación: GENESIS_CHAT_SYSTEM le pide explícitamente
      // "sugerí mejoras al proyecto actual si hay uno abierto", pero antes
      // solo llegaba en modo codegen — el chat literalmente no podía ver los
      // archivos sobre los que se supone que opina. Reasoning mode queda
      // afuera a propósito: es la fase de planificación pura antes de tocar
      // código real.
      if (!isReasoningMode && projectContext) {
        systemPrompt += `\n\n${projectContext}`;
      }

      if (supabaseConfig && !isReasoningMode) {
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

      // Special instructions for vanilla HTML mode
      if (wantsVanillaHtml && !isChatMode) {
        systemPrompt += `

IMPORTANTE: El usuario solicita HTML VANILLA (sin React).
- Genera UN SOLO archivo index.html con HTML, CSS y JavaScript inline.
- NO uses JSX, componentes de React, ni imports de React.
- Usa HTML5 semántico, CSS en <style> y JavaScript en <script>.
- El código debe funcionar al abrir el archivo directamente en un navegador.`;
      }

      // Special instructions for landing pages
      if (intent === 'fullstack' || intent === 'codegen') {
        if (prompt.toLowerCase().includes('landing') && !wantsVanillaHtml) {
          systemPrompt += '\n\nCREA UNA LANDING PAGE COMPLETA con Hero, Features, CTA y Footer.';
        }
      }

      // Instrucciones personalizadas del usuario (antes se recibían y se
      // descartaban sin usarse — ver docs/INVENTARIO_FUNCIONALIDADES.md G-32).
      const customInstructions = (options?.preferences ?? [])
        .map((p) => p.instructions?.trim())
        .filter((s): s is string => !!s);
      if (customInstructions.length) {
        systemPrompt += `\n\n=== INSTRUCCIONES PERSONALIZADAS DEL USUARIO ===\n${customInstructions.join('\n\n')}`;
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
        targetModel = 'google/gemini-2.5-flash-lite'; // gratis y con visión — ver src/lib/ai/models.ts
      }

      setGenPhase('streaming');
      setGenSpecialist(isReasoningMode ? 'architect' : 'frontend');
      onPhaseChange?.('generating', isReasoningMode ? 'architect' : 'frontend');

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        signal,
        credentials: 'include', // sesión de better-auth vía cookie httpOnly
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature: isChatMode ? 0.7 : 0.3,
          maxTokens: isChatMode ? BUDGET.maxChatTokens : BUDGET.maxCodeTokens,
          ...(projectId ? { projectId } : {}),
          ...(conversationId ? { conversationId } : {})
        })
      });

      if (!res.ok || res.headers.get('content-type')?.includes('application/json')) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status}`);
      }

      // Read stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';
      let lastUpdate = 0;
      const emittedFiles = new Set<string>();

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

              // Incremental file streaming — FUERA del throttle: cada </file>
              // se emite inmediatamente para feedback UX en vivo
              if (onFileStream && delta.includes('</file>')) {
                const completed = extractCompleteXmlFiles(accumulated);
                for (const path of Object.keys(completed)) {
                  if (!emittedFiles.has(path)) {
                    emittedFiles.add(path);
                    onFileStream(path, emittedFiles.size);
                  }
                }
              }

              // Text content / stream stats — sí throttleado a 50ms para
              // no saturar React
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

      // Process response - for reasoning mode, always treat as chat only
      const result = processRawResponse(accumulated, prompt, isChatMode || isReasoningMode);

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
  }, [projectFiles, selectedModel, convHistory, isArchitectMode, activeFile, supabaseConfig, BUDGET, buildContext, onGeneratingChange, onPhaseChange, onStreamCharsChange]);

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
