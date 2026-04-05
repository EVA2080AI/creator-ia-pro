import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDown, ChevronLeft, Share2, Globe, Activity, Sparkles, Loader2, Zap, Brain, LayoutGrid, Code2, BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

// ─── Header Component (Internal) ───────────────────────────────────────────────
function StudioProjectHeader({ 
  name = 'Proyecto Sin Nombre', isSaving, onShare, onPublish, onBack, onToggleArtifacts
}: any) {
  return (
    <header 
      className="shrink-0 h-[48px] border-b border-black/[0.08] bg-white/[0.85] backdrop-blur-[40px] saturate-[1.2] px-4 flex items-center justify-between z-30 sticky top-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]"
      role="banner"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <button 
          onClick={onBack} 
          aria-label="Volver al Dashboard"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-black/[0.04] hover:text-zinc-900 transition-all active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col min-w-0">
          <h2 className="text-[11px] font-black text-zinc-900 truncate leading-none mb-0.5 tracking-tight uppercase font-display">{name}</h2>
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 text-primary animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/80">Sincronizando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600/80">Conectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <button 
          onClick={onShare} 
          aria-label="Compartir proyecto"
          className="h-8 px-2.5 rounded-lg flex items-center gap-2 text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900 transition-all font-bold text-[9px] uppercase tracking-widest active:scale-95"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Compartir</span>
        </button>
        <button 
          onClick={onPublish} 
          aria-label="Publicar proyecto"
          className="h-8 px-3 rounded-lg bg-zinc-900 text-white flex items-center gap-2 hover:bg-black transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-zinc-900/10 active:scale-95"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Publicar</span>
        </button>
        <div className="w-px h-4 bg-black/[0.08] mx-1" />
        <button 
          onClick={onToggleArtifacts} 
          aria-label="Ver Artefactos"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-black/[0.04] hover:text-primary transition-all relative group active:scale-90"
        >
          <Activity className="h-3.5 w-3.5" />
          <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-primary rounded-full animate-pulse ring-2 ring-white" />
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
            messages: [{ role: 'user', content: `Give a short 2-4 word project title for: "${p.slice(0, 100)}". Return ONLY the title.` }],
            max_tokens: 1
          },
        }),
      });
      const data = await res.json();
      const name = (data?.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
      if (name) props.onAutoName(name);
    } catch {}
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

    const intent = detectIntent(text, !!(pendingImage || pendingContext || pendingUrl));
    const cost = MODEL_COSTS[selectedModel] || 1;
    const shouldPlan = isArchitectMode && intent === 'codegen';

    try {
      addLog(`Iniciando ciclo: ${intent}...`);
      await aiService.spendCredits(cost, intent, selectedModel, null);
      
      const result = await generateCode(text, { pendingImage, pendingUrl, preferences });
      if (!result) { addLog("Error en el motor.", "error"); await aiService.refundCredits(cost); return; }

      let assistantMsg: Message;

      if (shouldPlan && result.isChatOnly) {
        assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: result.explanation, timestamp: new Date(), type: 'plan', planStatus: 'pending', originalPrompt: text };
      } else if (result.isChatOnly) {
        const chatFiles = extractChatCodeFiles(result.explanation);
        if (chatFiles) props.onCodeGenerated({ ...props.projectFiles, ...chatFiles });
        assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: result.explanation, timestamp: new Date(), ...(chatFiles ? { files: Object.keys(chatFiles), type: 'code' } : {}) };
      } else {
        props.onCodeGenerated({ ...props.projectFiles, ...result.files });
        assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: result.explanation || 'Código actualizado.', timestamp: new Date(), type: 'code', files: Object.keys(result.files), stack: result.stack, deps: result.deps, suggestions: result.suggestions };
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
      if (!messages.some(m => m.id !== 'welcome')) {
        initialPromptTriggered.current = true;
        handleSend(props.initialPrompt);
        props.onInitialPromptUsed?.();
      }
    }
  }, [props.initialPrompt, messages, isGenerating, handleSend, props]);

  // ─── AUTO-FIX Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!props.previewError || isGenerating || !user) return;
    if (props.previewError === lastAutoFixError.current) return;
    if (autoFixCountRef.current >= 3) return;

    const timer = setTimeout(async () => {
      lastAutoFixError.current = props.previewError!;
      autoFixCountRef.current += 1;
      setIsAutoFixing(true);
      props.onToggleArtifacts?.();
      
      addLog(`🤖 Auto-corrección #${autoFixCountRef.current}/3...`, "info");
      await handleSend(`[AUTO-FIX] Error detectado: ${props.previewError}`);
      setIsAutoFixing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [props.previewError, isGenerating, user, handleSend, addLog, props]);

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
      className="flex flex-1 min-h-0 h-full w-full flex-col relative bg-[#F8F9FA]/50 selection:bg-primary/20"
      aria-label="Panel de Chat Génesis"
    >
      <StudioProjectHeader 
        name={props.projectName} 
        isSaving={props.isSaving} 
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
          <div className="flex flex-col items-start gap-4 mb-8 pl-1 animate-in fade-in duration-500">
             <div className="flex items-center gap-3 py-3 px-6 rounded-3xl bg-zinc-50 border border-zinc-200/60 shadow-sm transition-all">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  {isAutoFixing ? '🔧 Corrigiendo error...' : (
                    <>
                      {genSpecialist === 'architect' && '🏗️ Arquitecto planificando...'}
                      {genSpecialist === 'ux' && '🎨 Diseñando experiencia...'}
                      {genSpecialist === 'frontend' && '💻 Desarrollando interfaz...'}
                      {genSpecialist === 'backend' && '⚙️ Configurando sistemas...'}
                      {genSpecialist === 'engineer' && '🛠️ Ingeniería en proceso...'}
                      {genSpecialist === 'none' && '🧠 Analizando estrategia...'}
                    </>
                  )}
                </span>
             </div>
          </div>
        )}

        {(genPhase === 'streaming' || genPhase === 'done') && streamingContent && (
          <div className="flex flex-col items-start gap-4 mb-8">
            <div className="bg-white border border-zinc-200/80 px-7 py-6 rounded-[32px] rounded-tl-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-w-[200px]">
              <div className="prose prose-zinc max-w-none prose-sm font-medium" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }} />
              {genPhase === 'streaming' && <span className="inline-block h-3.5 w-1 ml-1 align-text-bottom rounded-full animate-pulse bg-primary" />}
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
