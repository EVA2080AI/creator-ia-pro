import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { aiService } from '@/services/ai-service';
import { genesisOrchestrator } from '@/services/genesis-orchestrator';
import { GitHubService } from '@/services/github-service';
import { mcpService } from '@/services/mcp-service';
import { generateAutonomousProject } from '@/services/scaffold-service';
import {
  detectIntent,
  processRawResponse,
  applyPatchToFiles,
  isResponseTruncated,
  extractPatchBlocks,
  processFileOperations,
  wantsProjectReset,
  detectMissingDependencies,
  extractDeleteCommands
} from '@/components/studio/chat/utils';

import {
  CODE_GEN_SYSTEM,
  GENESIS_CHAT_SYSTEM,
  ANTIGRAVITY_CHAT_SYSTEM,
  ARCHITECT_SYSTEM_PROMPT,
  CLONE_SYSTEM_PROMPT,
  IMAGE_TO_CODE_SYSTEM
} from '@/prompts';
import { MODELS } from '@/components/studio/chat/constants';

import { 
  AgentPhase, 
  AgentSpecialist, 
  CodeGenResult, 
  DeepBuildResult,
  Message,
  AgentPreference
} from '@/components/studio/chat/types';

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
  const [genPhase, setGenPhase] = useState<'idle' | 'thinking' | 'streaming' | 'done'>('idle');
  const [genSpecialist, setGenSpecialist] = useState<AgentSpecialist>('none');
  const [currentGenIntent, setCurrentGenIntent] = useState<'codegen' | 'chat' | null>(null);

  // ─── TIER-BASED BUDGET LIMITS ──────────────────────────────────────────────
  const isPro = subscriptionTier && subscriptionTier !== 'free' && subscriptionTier !== 'null';
  const BUDGET = {
    maxHistory: isPro ? 15 : 6,
    maxSnapshotFiles: isPro ? 8 : 3,
    maxSnapshotChars: isPro ? 4000 : 1500,
    maxCodeTokens: isPro ? 16000 : 4000,
    maxChatTokens: isPro ? 8000 : 2500,
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

  // ─── PROJECT CONTEXT SNAPSHOT — makes Genesis "see" the full project ────────
  // This is the key that bridges the gap between Genesis and Antigravity:
  // Genesis now gets an intelligent structural + content snapshot of the project
  // before generating anything, just like Antigravity reads files before editing.
  const buildProjectSnapshot = useCallback((files: Record<string, StudioFile>, activeFile?: string | null): string => {
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) return '';

    // 1. Detect tech stack from package.json
    let detectedStack = 'React + TypeScript + Tailwind CSS';
    const pkg = files['package.json']?.content;
    if (pkg) {
      try {
        const json = JSON.parse(pkg);
        const deps = { ...json.dependencies, ...json.devDependencies };
        const libs = Object.keys(deps).filter(d =>
          ['react-router-dom', 'zustand', 'framer-motion', 'recharts', 'react-hook-form',
           'zod', 'supabase', 'react-query', 'tanstack', 'three', 'phaser'].some(k => d.includes(k))
        );
        if (libs.length > 0) detectedStack += `\n- Librerías detectadas: ${libs.join(', ')}`;
      } catch { /* ignore */ }
    }

    // 2. Build file tree grouped by folder
    const grouped: Record<string, string[]> = {};
    for (const f of fileKeys) {
      const parts = f.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '(raíz)';
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(parts[parts.length - 1]);
    }
    const fileTree = Object.entries(grouped)
      .map(([folder, names]) => `  ${folder}/\n${names.map(n => `    └ ${n}`).join('\n')}`)
      .join('\n');

    // 3. Identify architecture type
    const hasRouter = fileKeys.some(f => f.includes('App.tsx') && files[f]?.content.includes('Route'));
    const hasSidebar = fileKeys.some(f => f.toLowerCase().includes('sidebar'));
    const hasPages = fileKeys.some(f => f.startsWith('src/pages/'));
    const hasContext = fileKeys.some(f => f.includes('context') || f.includes('Context'));
    const archType = hasSidebar ? 'Dashboard / Web App' : hasPages ? 'Multi-página' : hasRouter ? 'SPA con Router' : 'Single Page';

    // 4. Curated content snapshot: PRIORITIZE THE ACTIVE FILE AND RELATED CONTEXT
    // We must ensure the AI sees the file it is actually working on.
    const toShow = new Set<string>();
    
    // Always include active file if it exists
    if (activeFile && files[activeFile]) toShow.add(activeFile);
    
    // Include App.tsx as it's the core orchestrator
    if (files['src/App.tsx']) toShow.add('src/App.tsx');

    // Add priority structural files
    ['src/main.tsx', 'index.html', 'package.json'].forEach(f => {
      if (files[f] && toShow.size < BUDGET.maxSnapshotFiles) toShow.add(f);
    });

    // Fill remaining slots with types, hooks or alphabetically
    fileKeys.forEach(f => {
      if (toShow.size < BUDGET.maxSnapshotFiles && (f.includes('types') || f.includes('hooks') || f.includes('service'))) {
        toShow.add(f);
      }
    });

    // Final fallback: just add files until budget is reached
    fileKeys.forEach(f => {
      if (toShow.size < BUDGET.maxSnapshotFiles) toShow.add(f);
    });

    const contentSnapshots = Array.from(toShow)
      .map(f => `\n// ── ${f} ──\n${files[f].content.slice(0, BUDGET.maxSnapshotChars)}${files[f].content.length > BUDGET.maxSnapshotChars ? '\n// ... (truncado)' : ''}`)
      .join('\n');

    return `
=== GENESIS PROJECT CONTEXT SNAPSHOT ===
Arquitectura: ${archType}
Stack: ${detectedStack}
Total archivos: ${fileKeys.length}
Archivo activo: ${activeFile || 'ninguno'}

Árbol de archivos:
${fileTree}

Secciones detectadas:
${hasRouter ? '✓ Router (multi-página)' : ''}
${hasSidebar ? '✓ Sidebar (dashboard)' : ''}
${hasContext ? '✓ Context / Estado global' : ''}

Contenido de archivos clave:
${contentSnapshots}
=== FIN SNAPSHOT ===
`;
  }, []);


  const generateCode = useCallback(async (
    prompt: string,
    options?: { pendingImage?: string | null; pendingUrl?: string | null; preferences?: AgentPreference[] }
  ): Promise<CodeGenResult | DeepBuildResult | null> => {
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

    const hasImage = !!(options?.pendingImage);
    const intent = hasImage && !prompt.trim() ? 'codegen' : detectIntent(prompt);
    const prefContext = (options?.preferences || []).map(p => `[MEMORIA ${p.agent_id.toUpperCase()}]: ${p.instructions}`).join('\n');

    // Special intents
    const isHtmlImport = intent === 'html-import';
    const isVanillaHtml = intent === 'vanilla-html';
    const isImageToCode = hasImage && (intent === 'codegen' || !prompt.trim());

    // ─── RESET DETECTION: Check if user wants to clear the project ───────
    const shouldResetProject = wantsProjectReset(prompt);
    if (shouldResetProject) {
      setIsGenerating(false);
      onGeneratingChange?.(false);
      onPhaseChange?.('idle');
      setGenPhase('idle');

      return {
        files: {}, // Empty project
        explanation: '🗑️ **Proyecto limpiado.**\n\nHe eliminado todos los archivos del proyecto actual. Puedes empezar desde cero con un nuevo prompt.',
        isChatOnly: false,
        stack: [],
        deps: [],
        suggestions: ['Crear un nuevo proyecto', 'Generar una landing page', 'Crear un dashboard']
      };
    }

    // ─── DELETE DETECTION: Check for explicit delete commands ─────────────
    const deleteCommands = extractDeleteCommands(prompt);
    if (deleteCommands.length > 0 && Object.keys(projectFiles).length > 0) {
      const updatedFiles = { ...projectFiles };
      const deletedFiles: string[] = [];

      for (const filename of deleteCommands) {
        if (updatedFiles[filename]) {
          delete updatedFiles[filename];
          deletedFiles.push(filename);
        }
      }

      if (deletedFiles.length > 0) {
        setIsGenerating(false);
        onGeneratingChange?.(false);
        onPhaseChange?.('idle');
        setGenPhase('idle');

        return {
          files: updatedFiles,
          explanation: `🗑️ **Archivos eliminados:** ${deletedFiles.join(', ')}`,
          isChatOnly: false,
          stack: [],
          deps: [],
          suggestions: []
        };
      }
    }

    // ─── DIRECT HTML OPEN: Complete HTML documents are opened as-is ──────
    // If the user pastes a complete HTML document (has <!DOCTYPE or <html>),
    // save it directly as project files without sending to AI.
    if (isHtmlImport && (prompt.includes('<!DOCTYPE') || prompt.includes('<html'))) {
      const isCompleteDoc = prompt.includes('<head') && prompt.includes('<body');
      if (isCompleteDoc) {
        // Extract inline <style> to separate CSS file
        const styleMatch = prompt.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        const scriptMatch = prompt.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);

        const files: Record<string, StudioFile> = {
          'index.html': { language: 'html', content: prompt }
        };

        // Optionally extract CSS for editing convenience
        if (styleMatch && styleMatch.length > 0) {
          const allCss = styleMatch.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n\n');
          if (allCss.length > 200) {
            files['style.css'] = { language: 'css', content: allCss.trim() };
          }
        }

        // Optionally extract JS for editing convenience
        if (scriptMatch && scriptMatch.length > 0) {
          const allJs = scriptMatch.map(s => s.replace(/<\/?script[^>]*>/gi, '')).join('\n\n');
          if (allJs.length > 100) {
            files['script.js'] = { language: 'javascript', content: allJs.trim() };
          }
        }

        setIsGenerating(false);
        onGeneratingChange?.(false);
        onPhaseChange?.('idle');
        setGenPhase('idle');

        return {
          files,
          explanation: `📄 **HTML abierto directamente** — ${Object.keys(files).length} archivo(s) importados.\n\nEl proyecto está listo para previsualizar. Puedes pedirme que modifique secciones, agregue funcionalidades, o mejore el diseño.`,
          isChatOnly: false,
          stack: ['HTML', 'CSS', 'JavaScript'],
          deps: [],
          suggestions: ['Agregar responsive design', 'Mejorar accesibilidad', 'Optimizar para SEO'],
        };
      }
    }

    // Auto-trigger Architect Mode for fullstack creation intents
    const isChatModeActive = intent === 'chat';
    const isArchitectRequest = (isArchitectMode || intent === 'fullstack') && !isChatModeActive && !isHtmlImport && !isVanillaHtml;

    setCurrentGenIntent(isChatModeActive ? 'chat' : 'codegen');

    try {
      const fileKeys = Object.keys(projectFiles);
      const mentionMatches = [...prompt.matchAll(/@([\w./\-]+)/g)];
      const mentionedFiles = mentionMatches.map(m => m[1]).filter(f => projectFiles[f]);
      
      let contextBlock = mentionedFiles.length > 0
        ? '\n\n[ARCHIVOS MENCIONADOS]\n' + mentionedFiles.map(f => `// @${f}\n${projectFiles[f].content.slice(0, 10000)}`).join('\n\n')
        : '';

      // ─── BUILD PROJECT CONTEXT SNAPSHOT ──────────────────────────
      // When the project has files, always inject a rich structural snapshot.
      // This gives Genesis the same "see the full codebase" advantage Antigravity has.
      const projectSnapshot = fileKeys.length > 0 ? buildProjectSnapshot(projectFiles, activeFile) : '';

      if (fileKeys.length > 0 && !contextBlock) {
        const pLower = prompt.toLowerCase();

        // Find explicitly @mentioned files
        let importantFiles: string[] = [];

        if (pLower.includes('db') || pLower.includes('base de datos') || pLower.includes('supabase')) {
          importantFiles = fileKeys.filter(f => f.includes('sql') || f.includes('service') || f.includes('integration'));
        } else if (pLower.includes('ui') || pLower.includes('estética') || pLower.includes('diseño') || pLower.includes('css')) {
          importantFiles = fileKeys.filter(f => f.includes('css') || f.includes('components') || f.includes('App.tsx'));
        } else if (pLower.includes('nav') || pLower.includes('sidebar') || pLower.includes('route')) {
          importantFiles = fileKeys.filter(f => f.includes('sidebar') || f.includes('Navbar') || f.includes('App.tsx'));
        }

        // Include active file + important matches
        const finalSelection = [...new Set([activeFile, ...importantFiles].filter(Boolean) as string[])].slice(0, 4);
        if (finalSelection.length > 0) {
          contextBlock = `\n\n[ARCHIVOS RELEVANTES PARA ESTA TAREA]:\n` +
            finalSelection.map(f => `// ${f}\n${projectFiles[f].content.slice(0, 6000)}`).join('\n\n');
        }
      }


      const supabaseContext = supabaseConfig ? `\n\nSUPABASE: URL: ${supabaseConfig.url} | Key: ${supabaseConfig.anonKey}. Usa window.supabaseClient.` : '';
      
      // MCP Context Enrichment
      const mcpServers = mcpService.getServers().filter(s => s.status === 'connected' && s.tools && s.tools.length > 0);
      let mcpContext = '';
      if (mcpServers.length > 0) {
         mcpContext = `\n\n### 🔌 HERRAMIENTAS MCP (Model Context Protocol) DISPONIBLES:\n`;
         mcpContext += `Cuentas con las siguientes herramientas remotas. Para usarlas, responde EXACTAMENTE con una etiqueta <mcp> que contenga un JSON: \`<mcp>{"serverId": "ID", "tool": "nombre", "args": {}}</mcp>\`\n`;
         mcpServers.forEach(server => {
            mcpContext += `\nServidor: ${server.name} (ID: ${server.id})\nHerramientas:\n`;
            server.tools!.forEach(tool => {
               mcpContext += `- ${tool.name}: ${tool.description || ''} (Esquema: ${JSON.stringify(tool.inputSchema || tool.schema || {})})\n`;
            });
         });
      }

      let effectiveSystemPrompt = isArchitectRequest ? ARCHITECT_SYSTEM_PROMPT : (isChatModeActive ? (persona === 'antigravity' ? ANTIGRAVITY_CHAT_SYSTEM : GENESIS_CHAT_SYSTEM) : CODE_GEN_SYSTEM);
      effectiveSystemPrompt += mcpContext;
      
      let userContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }> = prompt + contextBlock;

      // Image-to-Code: user uploaded an image to replicate as code
      if (isImageToCode) {
        effectiveSystemPrompt = IMAGE_TO_CODE_SYSTEM;
        userContent = prompt || 'Replica este diseño fielmente en código. Detecta si debe ser HTML puro o React según la complejidad.';
      }

      // HTML Import: user pasted raw HTML in the chat
      if (isHtmlImport) {
        effectiveSystemPrompt = CLONE_SYSTEM_PROMPT;
        userContent = `[HTML PROPORCIONADO POR EL USUARIO — Conviértelo a un proyecto web funcional. Si es simple, mantén HTML puro. Si es complejo, usa React]:\n\n${prompt}`;
      }

      // Vanilla HTML: user explicitly wants HTML without React
      if (isVanillaHtml) {
        effectiveSystemPrompt = CODE_GEN_SYSTEM;
        userContent = `[MODO HTML PURO — Genera SOLO index.html + style.css + script.js. SIN React, SIN JSX, SIN imports. Usa Tailwind via CDN o CSS puro.]\n\n${prompt}`;
      }

      if (options?.pendingUrl) {
         const parsedClone = JSON.parse(options.pendingUrl);
         effectiveSystemPrompt = CLONE_SYSTEM_PROMPT + (parsedClone.content || '');
         userContent = `[URL]: ${parsedClone.url}\n[PROMPT]: ${prompt}`;
      }

      const freshStartNote = isArchitectRequest ? "\n\n[IMPORTANTE: El usuario solicita un nuevo proyecto o arquitectura. SI los archivos actuales en el snapshot son irrelevantes para esta nueva visión, IGNÓRALOS y empieza de cero con una arquitectura limpia. No intentes fusionar lógica incompatible.]" : "";
      
      // ─── OPTIMIZED HISTORY SLICE ───────────────────────────────────────────
      // 1. Limit based on tier budget
      // 2. Remove base64 images from history (keep only the text) to save massive tokens
      const historySlice = convHistory.slice(-BUDGET.maxHistory).map(msg => {
         if (Array.isArray(msg.content)) {
            // If the message has an image (usually the very first one), we prune the image for future turns
            // unless it's the very last user message (which is handled separately below)
            return {
               ...msg,
               content: msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n') || '[Imagen procesada]'
            };
         }
         return msg;
      });

      const messages = [
        // Inject the project snapshot directly into the system prompt
        // so Genesis "sees" the full project architecture before generating
        { role: 'system', content: effectiveSystemPrompt + (isChatModeActive ? '' : supabaseContext) + `\n\n${prefContext}` + (projectSnapshot ? `\n\n${projectSnapshot}` : '') + freshStartNote },
        ...historySlice,
        { role: 'user', content: options?.pendingImage ? [{ type: 'image_url', image_url: { url: options.pendingImage } }, { type: 'text', text: userContent }] : userContent }
      ];

      // Logic to detect if we need a "PRO" model or a vision model
      const complexTask = prompt.length > 500 || prompt.toLowerCase().includes('refactor') || prompt.toLowerCase().includes('arquitectura') || isArchitectRequest || isHtmlImport || isVanillaHtml;
      // Force vision-capable model for image-to-code
      const needsVision = isImageToCode || !!options?.pendingImage;
      const visionModel = selectedModel === 'deepseek/deepseek-chat' || selectedModel === 'deepseek/deepseek-r1'
        ? 'google/gemini-2.0-flash-001' // DeepSeek has no vision, fallback to Gemini
        : selectedModel;
      const targetModel = needsVision
        ? visionModel
        : (isChatModeActive && !options?.pendingUrl && !complexTask)
          ? 'google/gemini-2.0-flash-001'
          : (selectedModel === 'google/gemini-2.0-flash-001' && complexTask ? 'google/gemini-2.5-pro-preview-03-25' : selectedModel);

      // DeepBuild: activate for ANY architect+genesis request
      // Now allowed for Antigravity persona too as requested by user ("debe ser como tu")
      const isDeepBuildIntent = isArchitectRequest && (persona === 'genesis' || persona === 'antigravity');
      
      if (isDeepBuildIntent) {
        onPhaseChange?.('architecting', 'architect');
        setGenPhase('thinking');
        
        // This is a blocking but logged operation
        const result = await generateAutonomousProject(prompt, 'react');
        
        onPhaseChange?.('idle', 'none');
        setIsGenerating(false);
        onGeneratingChange?.(false);
        
        const finalFiles: Record<string, StudioFile> = {};
        result.files.forEach((content, path) => {
          finalFiles[path] = { 
            language: path.split('.').pop()?.toLowerCase() || 'tsx', 
            content 
          };
        });

        return {
          explanation: `🚀 **¡Proyecto V16.0 Finalizado!**\n\nHe orquestado la arquitectura completa de **${result.projectType.toUpperCase()}** siguiendo el protocolo **Swarm Autonomy**. \n\n- **Archivos generados**: ${result.fileCount}\n- **Estado**: Workspace actualizado y listo.\n\nPuedes ver los archivos en el panel lateral y probar el preview ahora mismo.`,
          files: finalFiles,
          isChatOnly: false,
          stack: [],
          deps: [],
          suggestions: [],
          blob: result.blob
        };
      }


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
            max_tokens: isChatModeActive ? BUDGET.maxChatTokens : BUDGET.maxCodeTokens, // Tier-based token limits

          },
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';
      let isDone = false;
      let lastUpdateTime = 0;

      outerLoop: while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { isDone = true; break outerLoop; } // Exits both loops cleanly
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') {
              accumulated += delta;
              streamBufferRef.current = accumulated;
              
              const now = Date.now();
              if (!lastUpdateTime || now - lastUpdateTime > 50) {
                 setStreamChars(accumulated.length);
                 onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
                 setGenPhase('streaming');
                 lastUpdateTime = now;
                 
                 // Specialist detection from stream markers (check only recent tail)
                 const tail = accumulated.slice(-200);
                 if (tail.includes('[UX_ENGINE]') || tail.includes('🧭 UX')) { setGenSpecialist('ux'); onPhaseChange?.('generating', 'ux'); }
                 else if (tail.includes('[FRONTEND_DEV]') || tail.includes('🎨 UI')) { setGenSpecialist('frontend'); onPhaseChange?.('generating', 'frontend'); }
                 else if (tail.includes('[BACKEND_DEV]') || tail.includes('⚙️ BE')) { setGenSpecialist('backend'); onPhaseChange?.('generating', 'backend'); }
                 else if (tail.includes('[ARCHITECT]') || tail.includes('🏗️ ESTRATEGA')) { setGenSpecialist('architect'); onPhaseChange?.('generating', 'architect'); }
                 else if (tail.includes('[ENGINEER]') || tail.includes('🧠 GENESIS')) { setGenSpecialist('engineer'); onPhaseChange?.('generating', 'engineer'); }
              }
            }
          } catch { /* malformed SSE chunk — skip silently */ }
        }
      }

      // ─── PUNTO 2.5: SEARCH DETECTION & EXECUTION ───────────────
      // If the AI requested a search, intercept it, perform the search, and auto-continue.
      const searchMatch = accumulated.match(/<search>(.*?)<\/search>/);
      if (searchMatch && !signal.aborted) {
        const query = searchMatch[1];
        setGenSpecialist('engineer');
        onPhaseChange?.('generating', 'engineer');
        
        // Show indicator in UI
        accumulated += `\n\n> 🔍 **Investigando en vivo:** "${query}"...\n\n`;
        setStreamChars(accumulated.length);
        onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));

        try {
           const results = await aiService.callSearch(query);
           const searchContext = `[SISTEMA - RESULTADOS DE TAVILY SEARCH PARA '${query}']: \n${JSON.stringify(results).slice(0, 4000)}\n\nUsa esta información para completar tu respuesta. No vuelvas a buscar lo mismo.`;
           
           const searchMessages = [
             { role: 'system', content: effectiveSystemPrompt },
             ...historySlice,
             { role: 'user', content: userContent },
             { role: 'assistant', content: accumulated },
             { role: 'user', content: searchContext }
           ];

           const sRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
             method: 'POST',
             signal,
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
             body: JSON.stringify({ provider: 'openrouter', path: 'chat/completions', body: { model: targetModel, messages: searchMessages, stream: true, temperature: 0.3, max_tokens: 15000 } })
           });

           if (sRes.ok) {
             const sReader = sRes.body!.getReader();
             let sBuffer = '';
             let sDone = false;
             outerSearch: while (!sDone) {
               const { done, value } = await sReader.read();
               if (done) break;
               sBuffer += decoder.decode(value, { stream: true });
               const lines = sBuffer.split('\n');
               sBuffer = lines.pop() ?? '';
               for (const line of lines) {
                 if (!line.startsWith('data: ')) continue;
                 const payload = line.slice(6).trim();
                 if (payload === '[DONE]') { sDone = true; break outerSearch; }
                 try {
                   const parsed = JSON.parse(payload);
                   const delta = parsed?.choices?.[0]?.delta?.content;
                   if (typeof delta === 'string') {
                     accumulated += delta;
                     streamBufferRef.current = accumulated;
                     const now = Date.now();
                     if (now - lastUpdateTime > 50) {
                        setStreamChars(accumulated.length);
                        onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
                        lastUpdateTime = now;
                     }
                   }
                 } catch { /* skip */ }
               }
             }
           }
        } catch (searchErr) {
           console.error("Search failed:", searchErr);
           accumulated += `\n\n*(Error en la búsqueda: no se encontraron resultados)*\n\n`;
        }
      }

      // ─── PUNTO 2.6: GITHUB DETECTION & EXECUTION ───────────────
      const githubMatch = accumulated.match(/<github>(.*?)<\/github>/s);
      if (githubMatch && !signal.aborted) {
        setGenSpecialist('engineer');
        onPhaseChange?.('generating', 'engineer');
        
        let operationResult = "";
        let parsedOp: { action: string; path: string; message?: string; content?: string } | null = null;

        try {
          parsedOp = JSON.parse(githubMatch[1].trim());
          accumulated += `\n\n> 🐙 **Ejecutando acción en GitHub:** \`${parsedOp.action}\` en \`${parsedOp.path}\`...\n\n`;
          setStreamChars(accumulated.length);
          onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));

          const token = localStorage.getItem('STUDIO_GITHUB_PAT');
          const repoPath = localStorage.getItem('STUDIO_GITHUB_REPO');

          if (!token || !repoPath) {
             throw new Error("No hay token o repositorio configurado. Usa la pestaña Cloud > GitHub Sync.");
          }

          const gh = new GitHubService({ token });
          const [owner, repo] = repoPath.split('/');

          if (parsedOp.action === 'read_dir' || parsedOp.action === 'read_file') {
             const data = await gh.getRepoContents(owner, repo, parsedOp.path);
             operationResult = JSON.stringify(data);
          } else if (parsedOp.action === 'commit') {
             // For simplicity, we create without SHA unless it exists (which requires a prior read to get SHA).
             // A true implementation needs to fetch the SHA first if the file exists.
             try {
                const existing = await gh.getRepoContents(owner, repo, parsedOp.path);
                const sha = (existing as any)?.sha;
                const data = await gh.writeFile(owner, repo, parsedOp.path, parsedOp.message || "Update via Genesis", parsedOp.content, "main", sha);
                operationResult = "Commit exitoso: " + (data as any)?.commit?.html_url;
             } catch (e: any) {
                if (e.message.includes('404')) {
                  const data = await gh.writeFile(owner, repo, parsedOp.path, parsedOp.message || "Create via Genesis", parsedOp.content, "main");
                  operationResult = "Archivo creado: " + (data as any)?.commit?.html_url;
                } else throw e;
             }
          }
        } catch (ghErr: any) {
           console.error("GitHub Action failed:", ghErr);
           operationResult = `Error ejecutando acción de GitHub: ${ghErr.message}`;
        }

        try {
           const ghContext = `[SISTEMA - RESULTADO DE GITHUB API]: \n${operationResult.slice(0, 5000)}\n\nUsa este resultado para continuar tu respuesta.`;
           const ghMessages = [
             { role: 'system', content: effectiveSystemPrompt },
             ...historySlice,
             { role: 'user', content: userContent },
             { role: 'assistant', content: accumulated },
             { role: 'user', content: ghContext }
           ];

           const sRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
             method: 'POST',
             signal,
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
             body: JSON.stringify({ provider: 'openrouter', path: 'chat/completions', body: { model: targetModel, messages: ghMessages, stream: true, temperature: 0.3, max_tokens: 15000 } })
           });

           if (sRes.ok) {
             const sReader = sRes.body!.getReader();
             let sBuffer = '';
             let sDone = false;
             outerGh: while (!sDone) {
               const { done, value } = await sReader.read();
               if (done) break;
               sBuffer += decoder.decode(value, { stream: true });
               const lines = sBuffer.split('\n');
               sBuffer = lines.pop() ?? '';
               for (const line of lines) {
                 if (!line.startsWith('data: ')) continue;
                 const payload = line.slice(6).trim();
                 if (payload === '[DONE]') { sDone = true; break outerGh; }
                 try {
                   const parsed = JSON.parse(payload);
                   const delta = parsed?.choices?.[0]?.delta?.content;
                   if (typeof delta === 'string') {
                     accumulated += delta;
                     setStreamChars(accumulated.length);
                     onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
                     streamBufferRef.current = accumulated;
                   }
                 } catch { /* skip */ }
               }
             }
           }
        } catch (continuationErr) {
           console.error("GH continuation failed:", continuationErr);
           accumulated += `\n\n*(Error al continuar después de GitHub)*\n\n`;
        }
      }

      // ─── PUNTO 2.7: MCP EXTENSION DETECTION ───────────────
      const mcpMatch = accumulated.match(/<mcp>(.*?)<\/mcp>/s);
      if (mcpMatch && !signal.aborted) {
        setGenSpecialist('engineer');
        onPhaseChange?.('generating', 'engineer');
        
        let mcpResult = "";
        let parsedMcp: { serverId: string; tool: string; args?: Record<string, unknown> } | null = null;

        try {
          parsedMcp = JSON.parse(mcpMatch[1].trim());
          accumulated += `\n\n> 🔌 **Llamando herramienta MCP remota:** \`${parsedMcp.tool}\`...\n\n`;
          setStreamChars(accumulated.length);
          onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));

          const res = await mcpService.callTool(parsedMcp.serverId, parsedMcp.tool, parsedMcp.args || {});
          mcpResult = JSON.stringify(res);
        } catch (mcpErr: any) {
           console.error("MCP call failed:", mcpErr);
           mcpResult = `Error MCP: ${mcpErr.message}`;
        }

        try {
           const mcpCtx = `[SISTEMA - RESULTADO DE HERRAMIENTA MCP]: \n${mcpResult.slice(0, 5000)}\n\nUsa este resultado para continuar tu respuesta.`;
           const mcpMsgs = [
             { role: 'system', content: effectiveSystemPrompt },
             ...historySlice,
             { role: 'user', content: userContent },
             { role: 'assistant', content: accumulated },
             { role: 'user', content: mcpCtx }
           ];

           const sRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
             method: 'POST',
             signal,
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
             body: JSON.stringify({ provider: 'openrouter', path: 'chat/completions', body: { model: targetModel, messages: mcpMsgs, stream: true, temperature: 0.3, max_tokens: 15000 } })
           });

           if (sRes.ok) {
             const sReader = sRes.body!.getReader();
             let sBuffer = '';
             let sDone = false;
             while (!sDone) {
               const { done, value } = await sReader.read();
               if (done) break;
               sBuffer += decoder.decode(value, { stream: true });
               const lines = sBuffer.split('\n');
               sBuffer = lines.pop() ?? '';
               for (const line of lines) {
                 if (!line.startsWith('data: ')) continue;
                 const payload = line.slice(6).trim();
                 if (payload === '[DONE]') { sDone = true; break; }
                 try {
                   const parsed = JSON.parse(payload);
                   const delta = parsed?.choices?.[0]?.delta?.content;
                   if (typeof delta === 'string') {
                     accumulated += delta;
                     setStreamChars(accumulated.length);
                     onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
                     streamBufferRef.current = accumulated;
                   }
                 } catch { /* skip */ }
               }
             }
           }
        } catch (continuationErr) {
           console.error("MCP continuation failed:", continuationErr);
           accumulated += `\n\n*(Error al continuar después de MCP)*\n\n`;
        }
      }

      // ─── PUNTO 3: TRUNCATION DETECTION + AUTO-CONTINUATION ───────────────
      // If Genesis was cut off mid-code, automatically request continuation
      // — mimicking Antigravity’s ability to work file-by-file without pressure.
      if (isResponseTruncated(accumulated) && !signal.aborted) {
        setGenPhase('streaming');
        const continueMessages = [
          { role: 'system', content: effectiveSystemPrompt },
          ...historySlice,
          { role: 'user', content: userContent },
          { role: 'assistant', content: accumulated },
          { role: 'user', content: '[AUTO-CONTINUE] La respuesta fue cortada. Continua exactamente desde donde quedaste, sin repetir nada de lo ya escrito. Completa los archivos faltantes.' }
        ];

        const conRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ 
            provider: 'openrouter', 
            path: 'chat/completions', 
            body: { 
              model: targetModel, 
              messages: continueMessages, 
              stream: true, 
              temperature: 0.2, 
              max_tokens: BUDGET.maxCodeTokens // Use budget for continuation 
            } 
          })
        });

        if (conRes.ok) {
          const conReader = conRes.body!.getReader();
          let conBuffer = '';
          let conDone = false;
          outerContinue: while (!conDone) {
            const { done, value } = await conReader.read();
            if (done) break;
            conBuffer += decoder.decode(value, { stream: true });
            const lines = conBuffer.split('\n');
            conBuffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') { conDone = true; break outerContinue; }
              try {
                const parsed = JSON.parse(payload);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string') {
                  accumulated += delta;
                  streamBufferRef.current = accumulated;
                  const now = Date.now();
                  if (now - lastUpdateTime > 50) {
                     setStreamChars(accumulated.length);
                     onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
                     lastUpdateTime = now;
                  }
                }
              } catch { /* skip */ }
            }
          }
        }
      }

      // ─── PUNTO 2: SURGICAL PATCH DETECTION + MERGE ───────────────────────
      // If Genesis used PATCH blocks, apply them surgically to existing files
      // instead of full rewrites — same as Antigravity's replace_file_content.
      // Also handles DELETE commands and new file extraction in one operation.
      const fileOps = processFileOperations(accumulated, projectFiles);

      // Check if there were any operations performed
      const hasOperations =
        fileOps.deletedFiles.length > 0 ||
        fileOps.patchedFiles.length > 0 ||
        fileOps.newFiles.length > 0;

      if (hasOperations) {
        // Detect missing dependencies from the new/updated files
        const detectedDeps = detectMissingDependencies(fileOps.files);

        const opsSummary = [
          fileOps.deletedFiles.length > 0 ? `🗑️ Eliminados: ${fileOps.deletedFiles.join(', ')}` : '',
          fileOps.patchedFiles.length > 0 ? `🔧 Modificados: ${fileOps.patchedFiles.join(', ')}` : '',
          fileOps.newFiles.length > 0 ? `📄 Nuevos: ${fileOps.newFiles.join(', ')}` : ''
        ].filter(Boolean).join('\n');

        return {
          files: fileOps.files,
          explanation: opsSummary || accumulated.replace(/```[a-z]*[\s\S]*?```/g, '').trim() || 'Cambios aplicados.',
          isChatOnly: false,
          stack: ['React', 'TypeScript'],
          deps: detectedDeps,
          suggestions: detectedDeps.length > 0
            ? [`Instalar dependencias: ${detectedDeps.join(', ')}`]
            : []
        };
      }

      // G-1 FIX: Pass only isChatModeActive (not || isArchitectRequest)
      const finalResult = processRawResponse(accumulated, prompt, isChatModeActive);

      // Detect missing dependencies from generated files
      if (finalResult && finalResult.files && Object.keys(finalResult.files).length > 0) {
        const detectedDeps = detectMissingDependencies(finalResult.files);
        if (detectedDeps.length > 0) {
          return {
            ...finalResult,
            deps: detectedDeps,
            suggestions: [
              ...(finalResult.suggestions || []),
              `📦 Instalar dependencias detectadas: ${detectedDeps.join(', ')}`
            ]
          };
        }
      }

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
