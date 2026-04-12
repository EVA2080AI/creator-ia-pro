import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDown, ChevronLeft, Share2, Globe, Activity, Sparkles, Loader2, Zap, Brain, LayoutGrid, Code2, BookOpen, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Types & Config
import type { StudioFile } from '@/hooks/useStudioProjects';
import type { Message } from './chat/types';
import type { UIPlanTask, UIArtifact, UILog } from './StudioArtifactsPanel';
import { MODEL_COSTS, aiService } from '@/services/ai-service';
import { useAgentPreferences } from '@/hooks/useAgentPreferences';

// Logic Hooks & Utilities
import { useStudioChatAI } from '@/hooks/useStudioChatAI';
import type { AgentPhase, AgentSpecialist } from '@/hooks/useStudioChatAI';
import { useStudioChatMessages } from '@/hooks/useStudioChatMessages';

export type { AgentPhase, AgentSpecialist };
import { detectIntent, extractChatCodeFiles } from './chat/utils';
import { renderMarkdown } from './chat/renderer';

// Modular UI Components
import { MessageItem } from './chat/MessageItem';
import { ChatInput } from './chat/ChatInput';
import { AutoFixAlert } from './chat/AutoFixAlert';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface StudioChatProps {
  projectId: string | null;
  projectFiles: Record<string, StudioFile>;
  onCodeGenerated: (files: Record<string, StudioFile>) => void;
  onNewConversation?: () => void;
  initialPrompt?: string | null;
  onInitialPromptUsed?: () => void;
  onAutoName?: (name: string) => void;
  onGeneratingChange?: (v: boolean) => void;
  onStreamCharsChange?: (chars: number, preview: string) => void;
  supabaseConfig?: { url: string; anonKey: string } | null;
  persona?: 'genesis' | 'antigravity';
  activeFile?: string | null;
  previewError?: string | null;
  
  // Project Header Props
  projectName?: string;
  isSaving?: boolean;
  onShare?: () => void;
  onPublish?: () => void;
  onBack?: () => void;
  onToggleArtifacts?: () => void;
  onSelectFile?: (filename: string) => void;

  // Engineering State
  artifacts?: UIArtifact[];
  setArtifacts?: React.Dispatch<React.SetStateAction<UIArtifact[]>>;
  tasks?: UIPlanTask[];
  setTasks?: React.Dispatch<React.SetStateAction<UIPlanTask[]>>;
  logs?: UILog[];
  setLogs?: React.Dispatch<React.SetStateAction<UILog[]>>;
  runtimeError?: string | null;
  onClearError?: () => void;
  onPhaseChange?: (phase: AgentPhase, specialist?: AgentSpecialist) => void;
}

interface StudioProjectHeaderProps {
  name: string;
  isSaving?: boolean;
  onShare?: () => void;
  onPublish?: () => void;
  onBack?: () => void;
  onToggleArtifacts?: () => void;
  agentPhase: AgentPhase;
  activeSpecialist: AgentSpecialist;
}

function StudioProjectHeader({ 
  name = 'Proyecto Sin Nombre', 
  isSaving, 
  onShare, 
  onPublish, 
  onBack, 
  onToggleArtifacts,
  agentPhase, 
  activeSpecialist
}: StudioProjectHeaderProps) {
  const isSovereign = true; 

  return (
    <header 
      className="shrink-0 h-14 border-b px-4 flex items-center justify-between z-30 sticky top-0 bg-white/70 border-zinc-100 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <button 
          onClick={onBack} 
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all border border-zinc-200/60"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
             {agentPhase !== 'idle' && (
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
             )}
             <h2 className="text-[12px] font-bold text-zinc-800 truncate tracking-tight">{name}</h2>
             {isSaving && <RefreshCw className="w-3 h-3 text-primary animate-spin shrink-0" />}
        </div>
      </div>

      <div className="flex items-center">
        <button 
          onClick={onToggleArtifacts} 
          className="h-8 px-3 rounded-lg border border-zinc-200/60 bg-white flex items-center gap-1.5 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
        >
          <Activity className={cn("h-3.5 w-3.5", agentPhase !== 'idle' ? "text-primary animate-pulse" : "text-zinc-400")} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Console</span>
        </button>
      </div>
    </header>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function StudioChat(props: StudioChatProps) {
  const { user } = useAuth();
  const { preferences } = useAgentPreferences();
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<{ name: string; content: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoFixCountRef = useRef(0);
  const lastAutoFixError = useRef('');
  const errorHistoryRef = useRef<string[]>([]);
  const initialPromptTriggered = useRef(false);

  // Fallback internal states if not provided as props
  const [internalArtifacts, setInternalArtifacts] = useState<UIArtifact[]>([]);
  const [internalTasks, setInternalTasks] = useState<UIPlanTask[]>([]);
  const [internalLogs, setInternalLogs] = useState<UILog[]>([]);

  const activeArtifacts = props.artifacts || internalArtifacts;
  const setArtifactsState = props.setArtifacts || setInternalArtifacts;
  const activeTasks = props.tasks || internalTasks;
  const setTasksState = props.setTasks || setInternalTasks;
  const activeLogs = props.logs || internalLogs;
  const setLogsState = props.setLogs || setInternalLogs;

  const { 
    messages, setMessages, convHistory, setConvHistory, saveToSupabase, addLog 
  } = useStudioChatMessages({
    projectId: props.projectId,
    user,
    setArtifacts: setArtifactsState,
    setTasks: setTasksState,
    setLogs: setLogsState as any
  });

  const {
    isGenerating, streamChars, streamingContent, genPhase, genSpecialist, currentGenIntent, generateCode, stopGeneration
  } = useStudioChatAI({
    projectFiles: props.projectFiles,
    selectedModel,
    convHistory,
    persona: props.persona || 'genesis',
    isArchitectMode,
    activeFile: props.activeFile,
    supabaseConfig: props.supabaseConfig,
    onPhaseChange: props.onPhaseChange,
    onStreamCharsChange: props.onStreamCharsChange,
    onGeneratingChange: props.onGeneratingChange
  });

  // ─── PERSISTENCE Helper ───────────────────────────────────────────────────
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    saveToSupabase(role, content);
  }, [user, saveToSupabase]);

  // ─── ACTION: Auto-name project ───────────────────────────────────────────
  const autoNameProject = useCallback(async (p: string) => {
    if (!props.onAutoName) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: `Give a short 2-4 word project title for: "${p.slice(0, 100)}". Return ONLY the title, no quotes.` }],
            max_tokens: 30
          },
        }),
      });
      const data = await res.json();
      const name = (data?.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
      if (name) props.onAutoName(name);
    } catch { /* auto-naming is non-critical, silently fail */ }
  }, [props.onAutoName]);

  // ─── ACTION: Send message ────────────────────────────────────────────────
  const handleSend = useCallback(async (override?: string) => {
    let text = (override || input).trim();
    if (isGenerating || !user) return;

    // Early Navigation Intent
    const navMatch = text.toLowerCase().match(/(?:abre|abrir|open|show|view|file|archivo|ver)\s+([\w./\-]+(?:\.\w+)?)/i);
    if (navMatch && props.onSelectFile) {
      const target = navMatch[1].trim();
      const targetFile = Object.keys(props.projectFiles).find(f => f.toLowerCase().includes(target.toLowerCase()));
      if (targetFile) {
        props.onSelectFile(targetFile);
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
        const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: `He abierto **${targetFile}** para ti.`, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setInput('');
        saveMessage('user', text);
        saveMessage('assistant', assistantMsg.content);
        return;
      }
    }

    if (pendingContext) {
      text = `[CONTEXTO: ${pendingContext.name}]\n\`\`\`\n${pendingContext.content}\n\`\`\`\n\n${text || "Analiza esto."}`;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date(), imagePreview: pendingImage ?? undefined };
    setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), userMsg]);
    setInput('');
    setPendingImage(null);
    saveMessage('user', text);
    
    // Reset auto-fix counters on new user message
    if (!text.includes('[AUTO-FIX]')) {
      autoFixCountRef.current = 0;
      lastAutoFixError.current = '';
    }

    const intent = detectIntent(text, !!(pendingImage || pendingContext || pendingUrl));
    const cost = MODEL_COSTS[selectedModel] || 1;
    const shouldPlan = (isArchitectMode && intent === 'codegen') || intent === 'fullstack';

    try {
      addLog(`Iniciando ciclo: ${intent}...`);
      
      const result = await generateCode(text, { pendingImage, pendingUrl, preferences }) as any;
      if (!result) { addLog("Error en el motor.", "error"); return; }

      let assistantMsg: Message;

      if ((shouldPlan || isArchitectMode) && result.isChatOnly && !result.blob) {
        assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: result.explanation || result.text, timestamp: new Date(), type: 'plan', planStatus: 'pending', originalPrompt: text };
      } else if (result.isChatOnly) {
        const content = result.text || result.explanation;
        const chatFiles = extractChatCodeFiles(content);
        if (chatFiles) props.onCodeGenerated({ ...props.projectFiles, ...chatFiles });
        
        assistantMsg = { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          content: content, 
          timestamp: new Date(), 
          ...(chatFiles ? { files: Object.keys(chatFiles), type: 'code' } : {}),
          blob: result.blob, 
          projectFilesMap: result.files instanceof Map ? result.files : undefined
        };
      } else {
        props.onCodeGenerated({ ...props.projectFiles, ...result.files });
        assistantMsg = { 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          content: result.explanation || 'Código actualizado.', 
          timestamp: new Date(), 
          type: 'code', 
          files: Object.keys(result.files || {}), 
          stack: result.stack, 
          deps: result.deps, 
          suggestions: result.suggestions 
        };
        if (messages.length <= 1) autoNameProject(text);
      }

      setMessages(prev => [...prev, assistantMsg]);
      setPendingContext(null);
      saveMessage('assistant', assistantMsg.content);
      addLog("Ciclo completado con éxito.", "success");

    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  }, [input, isGenerating, user, generateCode, props, pendingImage, pendingContext, pendingUrl, selectedModel, isArchitectMode, preferences, saveMessage, addLog, setMessages, autoNameProject, messages.length]);

  // ─── INITIAL PROMPT TRIGGER ──────────────────────────────────────────────
  useEffect(() => {
    if (props.initialPrompt && !initialPromptTriggered.current && messages.length > 0 && !isGenerating) {
      // Only fire when chat only has the welcome message (all messages have id 'welcome')
      if (messages.every(m => m.id === 'welcome')) {
        initialPromptTriggered.current = true;
        handleSend(props.initialPrompt);
        props.onInitialPromptUsed?.();
      }
    }
  }, [props.initialPrompt, messages, isGenerating, handleSend, props]);

  // ─── AUTO-FIX Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    const error = props.runtimeError || props.previewError;
    if (!error || isGenerating || !user) return;
    if (error === lastAutoFixError.current) return;
    if (autoFixCountRef.current >= 3) return;

    // Skip auto-fix if the error is caused by raw JSON saved as code
    // (happens when AI responds with JSON format instead of markdown blocks)
    if (error.includes('"explanation"') || error.includes('"files"') || error.includes('"deps"')) {
      console.warn('[AutoFix] Skipping — error caused by raw JSON in file, not a code bug');
      return;
    }

    // Helper to find the first existing file mentioned in the error string
    const extractErrorFile = (err: string) => {
      // Regex matches common file paths: src/App.tsx, ./components/Header.tsx, main.tsx
      const pathRegex = /(?:src\/|[\w.-]+\/)*[\w.-]+\.(?:tsx?|jsx?|css|html|json)/gi;
      const matches = [...err.matchAll(pathRegex)];
      for (const m of matches) {
        const path = m[0].replace(/^\/|^\.\//, ''); // Clean leading / or ./
        if (props.projectFiles[path]) return path;
        // Try without src/ if not found
        const noSrc = path.replace(/^src\//, '');
        if (props.projectFiles[noSrc]) return noSrc;
      }
      return null;
    };

    const timer = setTimeout(async () => {
      lastAutoFixError.current = error;
      autoFixCountRef.current += 1;
      setIsAutoFixing(true);
      
      // Auto-trigger artifacts panel to show the "Fixing" state
      props.onToggleArtifacts?.();
      
      const probFile = extractErrorFile(error);
      addLog(`🤖 PROTOCOLO FIX #${autoFixCountRef.current}/3: ${probFile ? `Analizando ${probFile}...` : 'Analizando error...'}`, "info");
      
      // Enriched Fix Prompt
      let fixPrompt = `[AUTO-FIX] Error detectado en el preview:
\`\`\`
${error}
\`\`\`

POR FAVOR, corrige este error analizando el estado actual de los archivos críticos:
${probFile ? `- Archivo detectado como origen: @${probFile}` : ''}
- Archivo activo: @${props.activeFile || 'App.tsx'}
- Punto de entrada: @App.tsx

Analiza si hay imports rotos, typos o variables no definidas. Devuelve los archivos corregidos como bloques markdown.`;

      if (error.toLowerCase().includes('could not find module') || error.toLowerCase().includes('cannot find module')) {
        fixPrompt += `\n\nIMPORTANTE: El error indica que falta un módulo o archivo local. REVISA los imports en @App.tsx y ASEGÚRATE de crear cualquier archivo que falte.`;
      }

      await handleSend(fixPrompt);
      setIsAutoFixing(false);
    }, 2500); // Slightly longer delay to let the UI stabilize
    return () => clearTimeout(timer);
  }, [props.runtimeError, props.previewError, isGenerating, user, handleSend, addLog, props.activeFile, props.projectFiles]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const onAttachUrl = async (url: string) => {
    setIsScraping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setPendingContext({ name: data.title || url, content: data.content });
      toast.success('Contenido web adjuntado');
    } catch { toast.error('Error al leer URL'); } finally { setIsScraping(false); }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
       const reader = new FileReader();
       reader.onload = (e) => setPendingImage(e.target?.result as string);
       reader.readAsDataURL(file);
    } else {
       const reader = new FileReader();
       reader.onload = (e) => setPendingContext({ name: file.name, content: e.target?.result as string });
       reader.readAsText(file);
    }
  };

  return (
    <aside 
      className="flex flex-1 min-h-0 h-full w-full flex-col relative bg-white selection:bg-primary/20 overflow-hidden"
      aria-label="Panel de Chat Génesis"
    >
      {/* Structural Neural Overlays */}
      <div className="absolute inset-0 neural-mesh opacity-[0.06] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] opacity-40 pointer-events-none" />
      <StudioProjectHeader 
        name={props.projectName} 
        isSaving={props.isSaving} 
        agentPhase={genPhase} 
        activeSpecialist={genSpecialist}
        onShare={props.onShare} 
        onPublish={props.onPublish} 
        onBack={props.onBack} 
        onToggleArtifacts={props.onToggleArtifacts} 
      />

      <div ref={containerRef} onScroll={() => setShowScrollBtn((containerRef.current?.scrollTop || 0) > 400)}
        className="flex-1 min-h-0 overflow-y-auto pt-8 pb-32 px-6 space-y-8 custom-scrollbar scroll-smooth"
        onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            msg={msg} 
            persona={props.persona || 'genesis'} 
            copiedId={copiedId}
            onCopy={handleCopy}
            onRetry={() => { const idx = messages.indexOf(msg); if (idx > 0) handleSend(messages[idx-1].content); }}
            onApprovePlan={async () => {
              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, planStatus: 'approved' } : m));
              const orig = isArchitectMode; setIsArchitectMode(false);
              await handleSend(msg.originalPrompt);
              setIsArchitectMode(orig);
            }}
            onRejectPlan={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, planStatus: 'rejected' } : m))}
            onSuggestionClick={(s) => handleSend(s)}
          />
        ))}

        {genPhase === 'thinking' && (
          <div className="flex flex-col items-start gap-4 mb-8 pl-1 animate-in fade-in slide-in-from-left-4 duration-700">
             <div className="flex items-center gap-4 py-4 px-6 rounded-[2rem] bg-white text-zinc-900 border border-zinc-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden group">
                <div className="absolute inset-0 scanline-overlay opacity-[0.02] group-hover:opacity-[0.04] transition-opacity" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center relative overflow-hidden ring-1 ring-zinc-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <Loader2 className="h-5 w-5 text-primary animate-spin relative z-10" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] italic leading-none mb-1">
                      {isAutoFixing ? 'NEURAL_PROTOCOL_FIX' : `GENESIS_${genSpecialist?.toUpperCase() || 'CORE'}_AI`}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.1em] italic">
                      {isAutoFixing ? '🔧 Analizando discrepancia...' : (
                        <>
                          {genSpecialist === 'architect' && '🏗️ Planificando trayectoria...'}
                          {genSpecialist === 'ux' && '🎨 Sintetizando experiencia...'}
                          {genSpecialist === 'frontend' && '💻 Compilando interfaz...'}
                          {genSpecialist === 'backend' && '⚙️ Orquestando lógica...'}
                          {genSpecialist === 'engineer' && '🛠️ Refinando código...'}
                          {genSpecialist === 'none' && '🧠 Sincronizando redes...'}
                        </>
                      )}
                    </span>
                  </div>
                </div>
             </div>
          </div>
        )}

        {(genPhase === 'streaming' || genPhase === 'done') && streamingContent && (
          <div className="flex flex-col items-start gap-5 mb-10 group/stream">
            <div className="aether-glass border border-zinc-100 px-6 md:px-10 py-6 md:py-10 rounded-[2.5rem] md:rounded-[4rem] rounded-tl-none shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] min-w-[240px] md:min-w-[280px] relative overflow-hidden">
              <div className="absolute inset-0 scanline-overlay opacity-[0.01] pointer-events-none" />
              <div className="absolute inset-0 neural-mesh opacity-[0.02] pointer-events-none" />
              <div className="prose prose-sm max-w-none font-medium prose-zinc prose-p:text-zinc-700 prose-headings:text-zinc-950 relative z-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }} />
              {genPhase === 'streaming' && <span className="inline-block h-4 w-1.5 ml-2 align-baseline rounded-full animate-pulse bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)]" />}
            </div>
            {isGenerating && currentGenIntent === 'codegen' && (
              <div className="w-full max-w-xs mt-2 pl-2">
                <div className="h-1 w-full rounded-full bg-zinc-100 border overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min((streamChars / 10000) * 100, 95)}%` }} /></div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {props.runtimeError && <AutoFixAlert runtimeError={props.runtimeError} isGenerating={isGenerating} onClear={() => props.onClearError?.()} onApply={() => handleSend(`[FIX] ${props.runtimeError}`)} />}

      {showScrollBtn && (
        <button 
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} 
          aria-label="Desplazarse al final"
          className="absolute bottom-24 right-4 z-10 h-8 w-8 rounded-full bg-white border border-black/5 text-zinc-500 shadow-xl flex items-center justify-center hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-90"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      <ChatInput 
        input={input} setInput={setInput} isGenerating={isGenerating} onSend={handleSend} onStop={stopGeneration}
        selectedModel={selectedModel} onModelSelect={setSelectedModel} isArchitectMode={isArchitectMode} onArchitectToggle={() => setIsArchitectMode(!isArchitectMode)}
        pendingImage={pendingImage} onRemoveImage={() => setPendingImage(null)}
        pendingUrl={pendingUrl} onRemoveUrl={() => setPendingUrl(null)}
        pendingContext={pendingContext} onRemoveContext={() => setPendingContext(null)}
        activeFile={props.activeFile || null}
        onAttachFile={(f) => {if(f.type.startsWith('image/')){const r=new FileReader();r.onload=(e)=>setPendingImage(e.target?.result as string);r.readAsDataURL(f);}else{const r=new FileReader();r.onload=(e)=>setPendingContext({name:f.name,content:e.target?.result as string});r.readAsText(f);}}}
        onAttachUrl={onAttachUrl} isScraping={isScraping}
      />
    </aside>
  );
}
