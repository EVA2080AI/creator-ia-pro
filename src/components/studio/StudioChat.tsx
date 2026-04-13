import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDown, ChevronLeft, Activity, Sparkles, Loader2, RefreshCw, Zap
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
  initialModel?: string;
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
  onHardReset?: () => void;
  subscriptionTier?: 'free' | 'pro' | 'admin' | null;
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
  onBack, 
  onToggleArtifacts,
  agentPhase, 
  activeSpecialist
}: StudioProjectHeaderProps) {
  const isActive = agentPhase !== 'idle';

  return (
    <header className="shrink-0 h-[52px] border-b border-zinc-100 px-3 flex items-center justify-between z-30 sticky top-0 bg-white/80 backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <button
          onClick={onBack}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all shrink-0"
          aria-label="Volver"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          {isActive ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-zinc-200 shrink-0" />
          )}
          <h2 className="text-[12.5px] font-bold text-zinc-800 truncate tracking-tight">{name}</h2>
          {isSaving && <RefreshCw className="w-3 h-3 text-primary animate-spin shrink-0 ml-1" />}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {isActive && activeSpecialist && activeSpecialist !== 'none' && (
          <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/8 border border-primary/15 text-[9px] font-bold text-primary uppercase tracking-wider">
            <Zap className="h-2.5 w-2.5" />
            {activeSpecialist}
          </span>
        )}
        <button
          onClick={onToggleArtifacts}
          className={cn(
            "h-8 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
            isActive
              ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          )}
        >
          <Activity className={cn("h-3 w-3", isActive ? "animate-pulse" : "")} />
          Console
        </button>
      </div>
    </header>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function StudioChat({
  projectId,
  projectFiles,
  onCodeGenerated,
  onNewConversation,
  initialPrompt,
  initialModel,
  onInitialPromptUsed,
  onAutoName,
  onGeneratingChange,
  onStreamCharsChange,
  supabaseConfig,
  persona = 'genesis',
  activeFile,
  previewError,
  projectName = 'Proyecto',
  isSaving,
  onShare,
  onPublish,
  onBack,
  onToggleArtifacts,
  onSelectFile,
  artifacts,
  setArtifacts,
  tasks,
  setTasks,
  logs,
  setLogs,
  runtimeError,
  onClearError,
  onPhaseChange,
  onHardReset,
  subscriptionTier = 'free'
}: StudioChatProps) {
  const { user } = useAuth();
  const { preferences } = useAgentPreferences();
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<{ name: string; content: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(initialModel || 'google/gemini-2.0-flash-001');
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

  const activeArtifacts = artifacts || internalArtifacts;
  const setArtifactsState = setArtifacts || setInternalArtifacts;
  const activeTasks = tasks || internalTasks;
  const setTasksState = setTasks || setInternalTasks;
  const activeLogs = logs || internalLogs;
  const setLogsState = setLogs || setInternalLogs;

  const {
    messages,
    setMessages,
    convHistory,
    setConvHistory,
    saveToSupabase,
    addLog,
    resetConversation
  } = useStudioChatMessages({
    projectId,
    user,
    setArtifacts: setArtifactsState,
    setTasks: setTasksState,
    setLogs: setLogsState
  });

  // Reset conversation if project becomes empty (when hard reset clears all files)
  const prevFileCountRef = useRef(Object.keys(projectFiles).length);
  useEffect(() => {
    const currentCount = Object.keys(projectFiles).length;
    // Only reset if we went from >0 files to 0 files (i.e., hard reset just happened)
    if (prevFileCountRef.current > 0 && currentCount === 0) {
      resetConversation();
    }
    prevFileCountRef.current = currentCount;
  }, [projectFiles, resetConversation]);

  useEffect(() => {
    if (initialModel) setSelectedModel(initialModel);
  }, [initialModel]);

  const {
    isGenerating, streamChars, streamingContent, genPhase, genSpecialist, currentGenIntent, generateCode, stopGeneration
  } = useStudioChatAI({
    projectFiles,
    selectedModel,
    convHistory,
    persona,
    isArchitectMode,
    activeFile,
    supabaseConfig,
    subscriptionTier,
    onPhaseChange,
    onStreamCharsChange,
    onGeneratingChange
  });

  // ─── PERSISTENCE Helper ───────────────────────────────────────────────────
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    saveToSupabase(role, content);
  }, [user, saveToSupabase]);

  // ─── ACTION: Auto-name project ───────────────────────────────────────────
  const autoNameProject = useCallback(async (p: string) => {
    if (!onAutoName) return;
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
      if (name) onAutoName(name);
    } catch { /* auto-naming is non-critical, silently fail */ }
  }, [onAutoName]);

  // ─── ACTION: Send message ────────────────────────────────────────────────
  const handleSend = useCallback(async (override?: string) => {
    let text = (override || input).trim();
    if (isGenerating || !user) return;

    // Early Navigation Intent
    const navMatch = text.toLowerCase().match(/(?:abre|abrir|open|show|view|file|archivo|ver)\s+([\w./\-]+(?:\.\w+)?)/i);
    if (navMatch && onSelectFile) {
      const target = navMatch[1].trim();
      const targetFile = Object.keys(projectFiles).find(f => f.toLowerCase().includes(target.toLowerCase()));
      if (targetFile) {
        onSelectFile(targetFile);
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
    
    // logic: Plan if in Architect mode OR if it's a very high-level vision request without "has/haz/crea"
    const shouldPlan = isArchitectMode && (intent === 'codegen' || intent === 'fullstack');

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
        if (chatFiles) onCodeGenerated({ ...projectFiles, ...chatFiles });
        
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
        onCodeGenerated({ ...projectFiles, ...result.files });
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
  }, [input, isGenerating, user, generateCode, onSelectFile, projectFiles, onCodeGenerated, pendingImage, pendingContext, pendingUrl, selectedModel, isArchitectMode, preferences, saveMessage, addLog, setMessages, autoNameProject, messages.length]);

  // ─── INITIAL PROMPT TRIGGER ──────────────────────────────────────────────
  useEffect(() => {
    if (initialPrompt && !initialPromptTriggered.current && messages.length > 0 && !isGenerating) {
      // Only fire when chat only has the welcome message (all messages have id 'welcome')
      if (messages.every(m => m.id === 'welcome')) {
        initialPromptTriggered.current = true;
        handleSend(initialPrompt);
        onInitialPromptUsed?.();
      }
    }
  }, [initialPrompt, messages, isGenerating, handleSend, onInitialPromptUsed]);

  // ─── AUTO-FIX Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    const error = runtimeError || previewError;
    if (!error || isGenerating || !user) return;
    if (error === lastAutoFixError.current) return;
    if (autoFixCountRef.current >= 3) return;

    // Skip auto-fix if the error is caused by raw JSON saved as code
    if (error.includes('"explanation"') || error.includes('"files"') || error.includes('"deps"')) {
      return;
    }

    const extractErrorFile = (err: string) => {
      const pathRegex = /(?:src\/|[\w.-]+\/)*[\w.-]+\.(?:tsx?|jsx?|css|html|json)/gi;
      const matches = [...err.matchAll(pathRegex)];
      for (const m of matches) {
        const path = m[0].replace(/^\/|^\.\//, '');
        if (projectFiles[path]) return path;
        const noSrc = path.replace(/^src\//, '');
        if (projectFiles[noSrc]) return noSrc;
      }
      return null;
    };

    const timer = setTimeout(async () => {
      lastAutoFixError.current = error;
      autoFixCountRef.current += 1;
      setIsAutoFixing(true);
      
      onToggleArtifacts?.();
      
      const probFile = extractErrorFile(error);
      addLog(`🤖 PROTOCOLO FIX #${autoFixCountRef.current}/3: ${probFile ? `Analizando ${probFile}...` : 'Analizando error...'}`, "info");
      
      let fixPrompt = `[AUTO-FIX] Error detectado en el preview:
\`\`\`
${error}
\`\`\`

POR FAVOR, corrige este error analizando el estado actual de los archivos críticos:
${probFile ? `- Archivo detectado como origen: @${probFile}` : ''}
- Archivo activo: @${activeFile || 'App.tsx'}
- Punto de entrada: @App.tsx

Analiza si hay imports rotos, typos o variables no definidas. Devuelve los archivos corregidos como bloques markdown.`;

      if (error.toLowerCase().includes('could not find module') || error.toLowerCase().includes('cannot find module')) {
        fixPrompt += `\n\nIMPORTANTE: El error indica que falta un módulo o archivo local. REVISA los imports en @App.tsx y ASEGÚRATE de crear cualquier archivo que falte.`;
      }

      await handleSend(fixPrompt);
      setIsAutoFixing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [runtimeError, previewError, isGenerating, user, handleSend, addLog, activeFile, projectFiles, onToggleArtifacts]);

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
        name={projectName} 
        isSaving={isSaving} 
        agentPhase={genPhase} 
        activeSpecialist={genSpecialist}
        onShare={onShare} 
        onPublish={onPublish} 
        onBack={onBack} 
        onToggleArtifacts={onToggleArtifacts} 
      />

      <div ref={containerRef} onScroll={() => setShowScrollBtn((containerRef.current?.scrollTop || 0) > 400)}
        className="flex-1 min-h-0 overflow-y-auto pt-8 pb-32 px-6 space-y-8 custom-scrollbar scroll-smooth"
        onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            msg={msg} 
            persona={persona || 'genesis'} 
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

        {/* ── Thinking indicator (The three dots) ── */}
        {genPhase === 'thinking' && (
          <div className="flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 relative">
               <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-xl" />
               <Sparkles className="h-3.5 w-3.5 text-primary relative z-10" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-zinc-100 shadow-sm">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                      className="h-2 w-2 rounded-full bg-primary/40"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest italic">
                  {isAutoFixing ? 'Analizando error' : (
                    <>
                      {genSpecialist === 'architect' && 'Planificando'}
                      {genSpecialist === 'ux' && 'Diseñando'}
                      {genSpecialist === 'frontend' && 'Compilando'}
                      {genSpecialist === 'backend' && 'Orquestando'}
                      {genSpecialist === 'engineer' && 'Refinando'}
                      {(genSpecialist === 'none' || !genSpecialist) && 'Iniciando Núcleo'}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Streaming bubble ── */}
        {(genPhase === 'streaming' || genPhase === 'done') && streamingContent && (
          <div className="flex flex-col items-start gap-3 mb-8">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2 pl-0.5">
                <div className="h-6 w-6 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-[11.5px] font-black text-zinc-900 uppercase italic tracking-tighter">Génesis Engine</span>
                {genPhase === 'streaming' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">Streaming</span>
                  </div>
                )}
              </div>
              {genPhase === 'streaming' && (
                <span className="font-mono text-[9px] text-zinc-300 font-bold uppercase tracking-widest">
                  {streamChars.toLocaleString()} b processed
                </span>
              )}
            </div>

            <div className="w-full max-w-[97%] bg-white border border-zinc-100 shadow-xl shadow-black/[0.02] rounded-[1.5rem] rounded-tl-sm px-4 md:px-5 py-5 relative overflow-hidden group">
              {/* PROGRESS BAR (CYBER INDUSTRIAL) */}
              {genPhase === 'streaming' && (
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-zinc-50 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                    style={{ width: `${Math.min((streamChars / 6000) * 100, 98)}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  />
                </div>
              )}

              <div className="result-prose text-[13px] text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }} />
              
              {genPhase === 'streaming' && (
                <motion.span 
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block h-3.5 w-1.5 ml-1 align-baseline rounded-sm bg-primary/40 shadow-[0_0_5px_rgba(var(--primary-rgb),0.3)]" 
                />
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {runtimeError && <AutoFixAlert runtimeError={runtimeError} isGenerating={isGenerating} onClear={() => onClearError?.()} onApply={() => handleSend(`[FIX] ${runtimeError}`)} />}

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
        activeFile={activeFile || null}
        onAttachFile={(f) => {if(f.type.startsWith('image/')){const r=new FileReader();r.onload=(e)=>setPendingImage(e.target?.result as string);r.readAsDataURL(f);}else{const r=new FileReader();r.onload=(e)=>setPendingContext({name:f.name,content:e.target?.result as string});r.readAsText(f);}}}
        onAttachUrl={onAttachUrl} isScraping={isScraping}
      />
    </aside>
  );
}
