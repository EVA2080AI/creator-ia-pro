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
      className={cn(
        "shrink-0 p-12 border-t transition-all duration-1000 relative z-40 panorama-transition pb-14",
        "bg-[#08080A]/95 border-white/5 backdrop-blur-[80px] saturate-[2.2]"
      )}
      role="contentinfo"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-40" />
      <div className="absolute inset-0 scanline-overlay opacity-[0.015] pointer-events-none" />
      
      {/* ── Mode Selector: Industrial Sovereign ── */}
      <div className="max-w-5xl mx-auto mb-10 flex items-center justify-between px-4">
         <div className="flex bg-white/5 p-2 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
            <button 
              onClick={() => !isArchitectMode && onArchitectToggle()}
              className={cn(
                "relative z-10 px-12 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-1000 flex items-center gap-5 italic",
                isArchitectMode ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isArchitectMode && (
                <motion.div 
                  layoutId="mode-bg-sov" 
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-900 to-primary/30 rounded-[1.8rem] shadow-[0_0_40px_rgba(79,70,229,0.5)] z-[-1] aether-iridescent" 
                  transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
                />
              )}
              <Shield className={cn("w-5 h-5 transition-all duration-700", isArchitectMode ? "text-white animate-pulse" : "text-zinc-600")} />
              ARCHITECT_STRATEGY
            </button>
            <button 
              onClick={() => isArchitectMode && onArchitectToggle()}
              className={cn(
                "relative z-10 px-12 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-1000 flex items-center gap-5 italic",
                !isArchitectMode ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {!isArchitectMode && (
                <motion.div 
                  layoutId="mode-bg-sov" 
                  className="absolute inset-0 bg-gradient-to-br from-primary via-purple-900 to-indigo-900 rounded-[1.8rem] shadow-[0_0_40px_rgba(168,85,247,0.5)] z-[-1] aether-iridescent" 
                  transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
                />
              )}
              <ArrowUp className={cn("w-5 h-5 transition-all duration-700", !isArchitectMode ? "text-white animate-pulse" : "text-zinc-600")} />
              ENGINE_CONSTRUCT
            </button>
         </div>

         <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic leading-none">NEURAL_SYNC_ACTIVE</span>
            </div>
            <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} />
         </div>
      </div>

      {/* ── Attachment Previews ── */}
      <div className="max-w-5xl mx-auto w-full space-y-4 mb-8 px-4">
        {pendingImage && (
          <div className="flex items-center gap-5 px-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-5 overflow-hidden relative group shadow-2xl backdrop-blur-2xl" role="status">
             <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <img src={pendingImage} alt="Referencia visual adjunta" className="h-16 w-16 rounded-2xl object-cover shadow-2xl border border-white/20 relative z-10 hover:scale-110 transition-transform duration-700" />
            <div className="flex-1 min-w-0 relative z-10">
               <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em] block mb-1.5 italic">IMAGE_RECON_INITIALIZED</span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate block italic opacity-60">Visual matrix acquired for cross-neural mapping</span>
            </div>
            <button 
              onClick={onRemoveImage} 
              className="p-4 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-transparent hover:border-white/10 relative z-10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {pendingUrl && (
          <div className="flex items-center gap-5 px-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-5 relative overflow-hidden shadow-2xl backdrop-blur-2xl" role="status">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
             <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 relative z-10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Globe className="h-8 w-8 animate-pulse" />
             </div>
             <div className="flex-1 min-w-0 font-mono relative z-10">
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] block mb-1.5 italic">NETWORK_URI_LINKED</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate block italic opacity-60">
                   {(() => {try { return JSON.parse(pendingUrl).url; } catch(e) { return pendingUrl; }})()}
                </span>
             </div>
             <button 
              onClick={onRemoveUrl} 
              className="p-4 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all relative z-10"
             >
               <X className="h-5 w-5" />
             </button>
          </div>
        )}

        {pendingContext && (
          <div className="flex items-center gap-5 px-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-5 relative overflow-hidden shadow-2xl backdrop-blur-2xl" role="status">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
             <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative z-10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
                <FileCode2 className="h-8 w-8" />
             </div>
             <div className="flex-1 min-w-0 relative z-10">
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em] block mb-1.5 italic">CONTEXT_PAYLOAD_MAPPED</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate block italic opacity-60">{pendingContext.name}</span>
             </div>
             <button 
              onClick={onRemoveContext} 
              className="p-4 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all relative z-10"
             >
               <X className="h-5 w-5" />
             </button>
          </div>
        )}

        {activeFile && (
          <div className="px-6 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white w-fit shadow-2xl flex items-center gap-5 animate-in fade-in zoom-in duration-700" role="status">
             <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),1)]" />
             <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">
               ACTIVE_SCOPE: {activeFile.split('/').pop()}
             </span>
          </div>
        )}
      </div>

      {/* ── URL Input Bar (Industrial) ── */}
      {showUrlInput && (
        <div className="max-w-5xl mx-auto w-full mb-6 flex items-center gap-4 px-4 animate-in slide-in-from-bottom-6 duration-700">
           <div className="flex-1 flex items-center gap-5 px-8 py-5 rounded-[2rem] bg-white border-2 border-primary/40 shadow-[0_30px_60px_-15px_rgba(var(--primary-rgb),0.2)] transition-all focus-within:ring-[15px] focus-within:ring-primary/10 aether-iridescent">
              <Link2 className="h-6 w-6 text-primary" />
              <input 
                autoFocus type="url" value={urlInput} 
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }
                  if (e.key === 'Escape') setShowUrlInput(false);
                }}
                placeholder="Pega la URL para ingeniería inversa..."
                className="flex-1 bg-transparent text-[15px] font-black italic outline-none placeholder:text-zinc-300 uppercase tracking-tight text-zinc-900"
                aria-label="URL del sitio a clonar"
              />
           </div>
           <button 
              onClick={() => { onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }} 
              disabled={isScraping || !urlInput.trim()}
              className="h-16 px-10 bg-zinc-950 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl hover:brightness-125 active:scale-95 transition-all disabled:opacity-50 border border-white/10 italic"
            >
              {isScraping ? 'MAPPING...' : 'ORCHESTRATE_URI'}
           </button>
           <button 
              onClick={() => setShowUrlInput(false)} 
              className="h-16 w-16 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all border border-black/5 rounded-[2rem] bg-white hover:shadow-2xl"
            >
             <X className="h-6 w-6" />
           </button>
        </div>
      )}

      {/* ── Main Input Container (Command Console Selector) ── */}
      <div className="max-w-5xl mx-auto w-full relative group px-4">
        <div className={cn(
          "flex items-center gap-5 p-5 rounded-[4rem] transition-all duration-1000 relative shadow-[0_50px_100px_-30px_rgba(0,0,0,0.7)] panorama-transition",
          "bg-white border-2 border-white/10 focus-within:ring-[25px] focus-within:ring-primary/5",
          isArchitectMode 
            ? "border-indigo-500/50 ring-15 ring-indigo-500/10 bg-white" 
            : "border-white/30 focus-within:border-primary/60",
          isGenerating && "ring-20 ring-primary/20 animate-pulse border-primary/70"
        )}>
          <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
          {/* Iridescent background for active state */}
          {(isArchitectMode || isGenerating) && (
            <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-r from-primary/5 via-violet-500/10 to-primary/5 animate-pulse pointer-events-none opacity-80" />
          )}
          {/* Plus Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} 
              className={cn(
                "h-14 w-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 border border-transparent shadow-xl relative z-20 overflow-hidden group/plus", 
                isPlusMenuOpen ? "bg-zinc-950 text-primary border-primary/40 rotate-45" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-200"
              )}
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/plus:opacity-100 transition-opacity" />
              <Plus className="h-6 w-6 relative z-10" />
            </button>

            <AnimatePresence>
              {isPlusMenuOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsPlusMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
                    className="absolute left-0 bottom-full mb-6 w-72 rounded-[2.5rem] bg-white border-2 border-black/[0.08] shadow-[0_30px_70px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
                  >
                    <header className="px-6 py-4 bg-zinc-50 border-b border-black/[0.04]">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 italic">SYSTEM_PAYLOADS</span>
                    </header>
                    <button 
                      onClick={() => { setIsPlusMenuOpen(false); fileInputRef.current?.click(); }} 
                      className="w-full flex items-center gap-5 px-6 py-5 text-left hover:bg-zinc-50 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] transition-all">
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <span className="text-[14px] font-black text-zinc-600 group-hover:text-zinc-950 uppercase tracking-tight italic">Attach_Resource</span>
                    </button>
                    <button 
                      onClick={() => { setIsPlusMenuOpen(false); setShowUrlInput(true); }} 
                      className="w-full flex items-center gap-5 px-6 py-5 text-left hover:bg-zinc-50 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 group-hover:bg-blue-50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                        <Globe className="h-5 w-5" />
                      </div>
                      <span className="text-[14px] font-black text-zinc-600 group-hover:text-zinc-950 uppercase tracking-tight italic">Reverse_Engineer_URI</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isArchitectMode ? "Defina la lógica de arquitectura o el flujo sistémico..." : "Ingrese directivas de construcción o consultas técnicas..."}
            className="flex-1 bg-transparent px-2 py-4 text-[17px] font-semibold text-zinc-900 outline-none resize-none min-h-[56px] max-h-[450px] placeholder:text-zinc-300 leading-relaxed selection:bg-primary/20 custom-scrollbar"
            disabled={isGenerating}
          />

          <div className="flex items-center gap-2 pr-4">
            <div className="flex items-center gap-1.5 p-1.5 rounded-[2rem] bg-zinc-50 border border-black/[0.06] shadow-inner mr-3 backdrop-blur-xl">
              <button 
                type="button"
                onClick={() => !isArchitectMode && onArchitectToggle()}
                className={cn(
                  "px-4 py-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-700 italic",
                  isArchitectMode ? "bg-white text-indigo-600 shadow-xl border border-black/[0.04]" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Plan
              </button>
              <button 
                type="button"
                onClick={() => isArchitectMode && onArchitectToggle()}
                className={cn(
                  "px-4 py-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-700 italic",
                  !isArchitectMode ? "bg-zinc-950 text-white shadow-xl" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Build
              </button>
            </div>
            
            <button 
               onClick={toggleListening}
               className={cn(
                 "h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-90 border border-transparent shadow-sm hover:shadow-md",
                 isListening ? "bg-rose-50 text-rose-600 animate-pulse ring-8 ring-rose-100 border-rose-200" : "text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-200"
               )}
            >
              <Mic className="h-5 w-5" />
            </button>
            
            <div className="w-px h-6 bg-black/[0.08] mx-2" />

            {isGenerating ? (
              <button 
                onClick={onStop} 
                className="h-14 w-14 rounded-[1.5rem] flex items-center justify-center bg-rose-500 text-white shadow-[0_15px_40px_rgba(244,63,94,0.5)] hover:brightness-110 hover:scale-105 transition-all active:scale-95 group/stop"
              >
                <X className="h-6 w-6 group-hover/stop:rotate-90 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={() => onSend()} 
                disabled={!input.trim() && !pendingImage && !pendingUrl && !pendingContext} 
                className={cn(
                  "h-14 w-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 shadow-2xl relative overflow-hidden group/send",
                  isArchitectMode 
                    ? "bg-indigo-600 text-primary hover:bg-indigo-700 shadow-indigo-300/40" 
                    : "bg-zinc-950 text-white hover:bg-black"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/send:opacity-100 transition-opacity" />
                <ArrowUp className="h-6 w-6 relative z-10 group-hover/send:-translate-y-1 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
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
