import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, ArrowUp, X, Globe, Link2, FileCode2, Paperclip, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ModelSelector } from './ModelSelector';

interface ChatInputProps {
  input: string;
  setInput: (s: string) => void;
  isGenerating: boolean;
  onSend: (override?: string) => void;
  onStop: () => void;
  selectedModel: string;
  onModelSelect: (id: string) => void;
  isArchitectMode: boolean;
  onArchitectToggle: () => void;
  pendingImage: string | null;
  onRemoveImage: () => void;
  pendingUrl: string | null;
  onRemoveUrl: () => void;
  pendingContext: { name: string; content: string } | null;
  onRemoveContext: () => void;
  activeFile: string | null;
  onAttachFile: (file: File) => void;
  onAttachUrl: (url: string) => Promise<void>;
  isScraping: boolean;
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  onSend,
  onStop,
  selectedModel,
  onModelSelect,
  isArchitectMode,
  onArchitectToggle,
  pendingImage,
  onRemoveImage,
  pendingUrl,
  onRemoveUrl,
  pendingContext,
  onRemoveContext,
  activeFile,
  onAttachFile,
  onAttachUrl,
  isScraping
}: ChatInputProps) {
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 350) + 'px';
  };

  const toggleListening = () => {
    if (isListening) {
       recognitionRef.current?.stop();
       setIsListening(false);
       return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setInput(input + (input.endsWith(' ') || !input ? '' : ' ') + transcript);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      if (input.trim() || pendingImage || pendingUrl || pendingContext) {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Q-8: Validation logic
    const allowedExtensions = ['.txt', '.js', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.sql'];
    const extension = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`"${file.name}" es demasiado grande (máx 2MB)`);
      return;
    }

    if (extension && !allowedExtensions.includes(`.${extension}`)) {
      toast.error('Tipo de archivo no permitido para análisis.');
      return;
    }

    onAttachFile(file);
    e.target.value = '';
  };

  return (
    <footer 
      className="shrink-0 p-6 border-t border-black/[0.04] bg-white/40 backdrop-blur-3xl saturate-[1.5] relative z-40 panorama-transition"
      role="contentinfo"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* ── Mode Selector: Industrial Sovereign ── */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between px-2">
         <div className="flex bg-black/[0.03] p-1 rounded-2xl border border-black/[0.05] relative overflow-hidden group shadow-inner">
            <button 
              onClick={() => !isArchitectMode && onArchitectToggle()}
              className={cn(
                "relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2.5",
                isArchitectMode ? "text-white" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {isArchitectMode && (
                <motion.div layoutId="mode-bg" className="absolute inset-0 bg-zinc-900 rounded-xl shadow-xl z-[-1]" />
              )}
              <Shield className={cn("w-3.5 h-3.5", isArchitectMode ? "text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "text-zinc-400")} />
              Plan_Architect
            </button>
            <button 
              onClick={() => isArchitectMode && onArchitectToggle()}
              className={cn(
                "relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2.5",
                !isArchitectMode ? "text-white" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {!isArchitectMode && (
                <motion.div layoutId="mode-bg" className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20 z-[-1]" />
              )}
              <ArrowUp className={cn("w-3.5 h-3.5", !isArchitectMode ? "text-white" : "text-zinc-400")} />
              Agent_Build
            </button>
         </div>

         <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-black/[0.03] shadow-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic leading-none">Sync_Stable</span>
            </div>
            <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} />
         </div>
      </div>

      {/* ── Attachment Previews ── */}
      <div className="max-w-4xl mx-auto w-full space-y-2 mb-4 px-2">
        {pendingImage && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-bottom-2 overflow-hidden relative group" role="status">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <img src={pendingImage} alt="Referencia visual adjunta" className="h-10 w-10 rounded-xl object-cover shadow-2xl border border-white/20" />
            <div className="flex-1 min-w-0">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-0.5">IMAGE_ATTACHED</span>
               <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate block">Reference acquired for context injection</span>
            </div>
            <button 
              onClick={onRemoveImage} 
              aria-label="Quitar imagen"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90 border border-transparent hover:border-rose-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {pendingUrl && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden" role="status">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
             <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Globe className="h-5 w-5" />
             </div>
             <div className="flex-1 min-w-0 font-mono">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">CONTENT_SCRAPED</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate block">
                   {(() => {try { return JSON.parse(pendingUrl).url; } catch(e) { return pendingUrl; }})()}
                </span>
             </div>
             <button 
              onClick={onRemoveUrl} 
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"
             >
               <X className="h-4 w-4" />
             </button>
          </div>
        )}

        {pendingContext && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/[0.03] border border-primary/20 animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden" role="status">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileCode2 className="h-5 w-5" />
             </div>
             <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-0.5">CONTEXT_ACQUIRED</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate block">{pendingContext.name}</span>
             </div>
             <button 
              onClick={onRemoveContext} 
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"
             >
               <X className="h-4 w-4" />
             </button>
          </div>
        )}

        {activeFile && (
          <div className="px-4 py-2 rounded-xl bg-zinc-900 text-white w-fit shadow-2xl flex items-center gap-3 border border-white/10" role="status">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
             <span className="text-[10px] font-black uppercase tracking-widest italic">
               ACTIVE_SCOPE: {activeFile.split('/').pop()}
             </span>
          </div>
        )}
      </div>

      {/* ── URL Input Bar (Industrial) ── */}
      {showUrlInput && (
        <div className="max-w-4xl mx-auto w-full mb-4 flex items-center gap-3 px-2 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex-1 flex items-center gap-4 px-5 py-4 rounded-[1.5rem] bg-white border border-primary/30 shadow-2xl transition-all focus-within:ring-8 focus-within:ring-primary/5 aether-iridescent">
              <Link2 className="h-5 w-5 text-primary" />
              <input 
                autoFocus type="url" value={urlInput} 
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }
                  if (e.key === 'Escape') setShowUrlInput(false);
                }}
                placeholder="Pega la URL de un sistema para ingeniería inversa..."
                className="flex-1 bg-transparent text-sm font-black italic outline-none placeholder:text-zinc-300 uppercase tracking-tight"
                aria-label="URL del sitio a clonar"
              />
           </div>
           <button 
              onClick={() => { onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }} 
              disabled={isScraping || !urlInput.trim()}
              className="h-14 px-8 bg-zinc-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-125 active:scale-95 transition-all disabled:opacity-50 border border-white/10"
            >
             {isScraping ? 'SCRAPING...' : 'VINCULAR_URI'}
           </button>
           <button 
              onClick={() => setShowUrlInput(false)} 
              className="h-14 w-14 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all border border-black/5 rounded-[1.5rem] bg-white hover:shadow-xl"
            >
             <X className="h-5 w-5" />
           </button>
        </div>
      )}

      {/* ── Main Input Container (Command Console Selector) ── */}
      <div className="max-w-4xl mx-auto w-full relative group">
        <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} />

        <div className={cn(
          "flex items-center gap-2 p-2 rounded-[32px] bg-white border shadow-[0_10px_50px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 relative",
          isArchitectMode 
            ? "border-indigo-400/30 ring-4 ring-indigo-50 shadow-indigo-100/50 scale-[1.01]" 
            : "border-black/[0.1] focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5",
          isGenerating && "neural-pulse ring-4 ring-primary/10 border-primary/30"
        )}>
          {/* Iridescent background for active state */}
          {(isArchitectMode || isGenerating) && (
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-primary/5 via-violet-500/5 to-primary/5 animate-pulse pointer-events-none opacity-50" />
          )}
          {/* Plus Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} 
              aria-label="Menú de adjuntos"
              aria-expanded={isPlusMenuOpen}
              className={cn(
                "h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300", 
                isPlusMenuOpen ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-50 hover:scale-105 active:scale-90"
              )}
            >
              <Plus className={cn("h-5 w-5 transition-transform duration-300", isPlusMenuOpen && "rotate-45")} />
            </button>

            {isPlusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
                <div className="absolute left-0 bottom-full mb-4 w-60 rounded-[24px] bg-white border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <header className="px-4 py-3 bg-zinc-50 border-b border-black/[0.04]">
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contexto & Recursos</span>
                  </header>
                  <button 
                    onClick={() => { setIsPlusMenuOpen(false); fileInputRef.current?.click(); }} 
                    className="w-full flex items-center gap-3.5 px-4 py-4 text-left hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-bold text-zinc-600 group-hover:text-zinc-900">Adjuntar Archivo</span>
                  </button>
                  <button 
                    onClick={() => { setIsPlusMenuOpen(false); setShowUrlInput(true); }} 
                    className="w-full flex items-center gap-3.5 px-4 py-4 text-left hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                      <Globe className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-bold text-zinc-600 group-hover:text-zinc-900">Clonar URL</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <textarea
            ref={inputRef}
            id="genesis-chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isArchitectMode ? "Describe el flujo o funcionalidad que quieres arquitectar..." : "Pregunta cualquier cosa o describe qué quieres construir..."}
            className="flex-1 bg-transparent px-3 py-3.5 text-[14px] font-medium text-zinc-800 outline-none resize-none min-h-[48px] max-h-[350px] placeholder:text-zinc-400 leading-relaxed"
            disabled={isGenerating}
            aria-label="Mensaje para Génesis"
          />

          <div className="flex items-center gap-1.5 pr-2">
            <div className="flex items-center gap-1 p-1 rounded-[20px] bg-zinc-50 border border-black/[0.05] shadow-inner mr-1">
              <button 
                type="button"
                onClick={() => !isArchitectMode && onArchitectToggle()}
                className={cn(
                  "px-3 py-1.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all",
                  isArchitectMode ? "bg-white text-indigo-600 shadow-sm border border-black/[0.03]" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Plan
              </button>
              <button 
                type="button"
                onClick={() => isArchitectMode && onArchitectToggle()}
                className={cn(
                  "px-3 py-1.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all",
                  !isArchitectMode ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Build
              </button>
            </div>
            
            <button 
               onClick={toggleListening}
               aria-label={isListening ? "Detener dictado" : "Dictado por voz"}
               className={cn(
                 "h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                 isListening ? "bg-rose-50 text-rose-600 animate-pulse ring-4 ring-rose-100" : "text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50"
               )}
            >
              <Mic className="h-4 w-4" />
            </button>
            
            <div className="w-px h-5 bg-black/[0.06] mx-1" />

            {isGenerating ? (
              <button 
                onClick={onStop} 
                aria-label="Detener generación"
                className="h-10 w-10 rounded-full flex items-center justify-center bg-rose-50 text-rose-600 shadow-sm hover:bg-rose-100 transition-all active:scale-95"
              >
                <div className="h-3 w-3 bg-rose-600 animate-pulse rounded-sm" />
              </button>
            ) : (
              <button 
                onClick={() => onSend()} 
                disabled={!input.trim() && !pendingImage && !pendingUrl && !pendingContext} 
                aria-label="Enviar mensaje"
                className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-900 text-white shadow-xl shadow-zinc-200 hover:bg-black transition-all active:scale-90 disabled:opacity-30 disabled:grayscale disabled:scale-100"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        className="hidden" 
        accept=".txt,.js,.ts,.tsx,.css,.html,.json,.md,.sql"
        onChange={handleFileChange} 
        aria-hidden="true"
      />
    </footer>
  );
}
