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
        "shrink-0 p-4 md:p-8 border-t transition-all duration-1000 relative z-40 pb-6 md:pb-10",
        "bg-white/80 border-zinc-100 backdrop-blur-[40px] saturate-[1.8]"
      )}
      role="contentinfo"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-30" />
      <div className="absolute inset-0 scanline-overlay opacity-[0.01] pointer-events-none" />
      
      {/* ── Mode Selector: Industrial Sovereign ── */}
      <div className="max-w-5xl mx-auto mb-4 md:mb-6 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
         <div className="flex bg-zinc-50 p-1 rounded-2xl border border-zinc-200 relative overflow-hidden group shadow-sm backdrop-blur-3xl w-full md:w-auto">
            <button 
              onClick={() => !isArchitectMode && onArchitectToggle()}
              className={cn(
                "relative z-10 flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 flex items-center justify-center gap-2 italic",
                isArchitectMode ? "text-white" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {isArchitectMode && (
                <motion.div 
                  layoutId="mode-bg-sov" 
                  className="absolute inset-0 bg-primary/90 rounded-xl shadow-lg z-[-1]" 
                  transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                />
              )}
              <Shield className={cn("w-3.5 h-3.5", isArchitectMode ? "text-white" : "text-zinc-400")} />
              PLAN
            </button>
            <button 
              onClick={() => isArchitectMode && onArchitectToggle()}
              className={cn(
                "relative z-10 flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 flex items-center justify-center gap-2 italic",
                !isArchitectMode ? "text-white" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {!isArchitectMode && (
                <motion.div 
                  layoutId="mode-bg-sov" 
                  className="absolute inset-0 bg-zinc-950 rounded-xl shadow-lg z-[-1]" 
                  transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                />
              )}
              <ArrowUp className={cn("w-3.5 h-3.5", !isArchitectMode ? "text-white" : "text-zinc-400")} />
              BUILD
            </button>
         </div>

         <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] italic leading-none hidden xs:inline">NEURAL_LINK</span>
            </div>
            <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} />
         </div>
      </div>

      {/* ── Attachment Previews ── */}
      <div className="max-w-5xl mx-auto w-full space-y-4 mb-8 px-4">
        {pendingImage && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 animate-in fade-in slide-in-from-bottom-3 duration-300" role="status">
            <img src={pendingImage} alt="Imagen adjunta" className="h-12 w-12 rounded-xl object-cover border border-zinc-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-zinc-900 leading-none mb-1">Imagen adjunta</p>
              <p className="text-[10px] text-zinc-400 font-medium truncate">Referencia visual para el contexto</p>
            </div>
            <button onClick={onRemoveImage} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {pendingUrl && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 animate-in fade-in slide-in-from-bottom-3 duration-300" role="status">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 shrink-0">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-zinc-900 leading-none mb-1">URL adjunta</p>
              <p className="text-[10px] text-zinc-400 font-medium truncate">
                {(() => { try { return JSON.parse(pendingUrl).url; } catch { return pendingUrl; } })()}
              </p>
            </div>
            <button onClick={onRemoveUrl} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {pendingContext && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 animate-in fade-in slide-in-from-bottom-3 duration-300" role="status">
            <div className="h-10 w-10 rounded-xl bg-primary/8 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <FileCode2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-zinc-900 leading-none mb-1">Contexto adjunto</p>
              <p className="text-[10px] text-zinc-400 font-medium truncate">{pendingContext.name}</p>
            </div>
            <button onClick={onRemoveContext} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeFile && (
          <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary w-fit flex items-center gap-2 animate-in fade-in zoom-in duration-300" role="status">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[11px] font-bold tracking-wide">
               {activeFile.split('/').pop()}
             </span>
          </div>
        )}
      </div>

      {/* ── URL Input Bar (Industrial) ── */}
      {showUrlInput && (
        <div className="max-w-5xl mx-auto w-full mb-6 flex items-center gap-4 px-4 animate-in slide-in-from-bottom-6 duration-700">
       <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border-2 border-primary/30 shadow-sm focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              <Link2 className="h-4.5 w-4.5 text-primary shrink-0" />
              <input 
                autoFocus type="url" value={urlInput} 
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }
                  if (e.key === 'Escape') setShowUrlInput(false);
                }}
                placeholder="Pega la URL a analizar..."
                className="flex-1 bg-transparent text-[14px] font-medium outline-none placeholder:text-zinc-300 text-zinc-900"
                aria-label="URL del sitio a adjuntar"
              />
           </div>
           <button 
              onClick={() => { onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }} 
              disabled={isScraping || !urlInput.trim()}
              className="h-11 px-5 bg-zinc-900 text-white rounded-2xl text-[12px] font-bold tracking-wide shadow-sm hover:bg-black active:scale-95 transition-all disabled:opacity-50"
            >
              {isScraping ? 'Analizando...' : 'Adjuntar'}
           </button>
           <button 
              onClick={() => setShowUrlInput(false)} 
              className="h-11 w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-all border border-zinc-200 rounded-2xl bg-white hover:bg-zinc-50"
            >
             <X className="h-4 w-4" />
           </button>
        </div>
      )}

      {/* ── Main Input Container (Command Console Selector) ── */}
      <div className="max-w-5xl mx-auto w-full relative group px-2">
        <div className={cn(
          "flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-[1.5rem] md:rounded-[3rem] transition-all duration-700 relative shadow-sm",
          "bg-white border border-zinc-200 focus-within:ring-8 focus-within:ring-primary/5 focus-within:border-primary/30",
          isArchitectMode && "ring-8 ring-primary/5 border-primary/30",
          isGenerating && "animate-pulse border-primary/50"
        )}>
          <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
          {/* Iridescent background for active state */}
          {(isArchitectMode || isGenerating) && (
            <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-r from-primary/5 via-violet-500/10 to-primary/5 animate-pulse pointer-events-none opacity-80" />
          )}
          {/* Plus Menu */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} 
              className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center transition-all duration-500 border border-transparent shadow-sm relative z-20 overflow-hidden group/plus", 
                isPlusMenuOpen ? "bg-zinc-900 text-white rotate-45" : "text-zinc-500 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-950"
              )}
            >
              <Plus className="h-5 w-5 relative z-10" />
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

          <div className="flex items-center gap-1.5 md:gap-2 pr-2 md:pr-3">
            <button 
               onClick={toggleListening}
               className={cn(
                 "h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all active:scale-90 border border-transparent",
                 isListening ? "bg-rose-50 text-rose-600 animate-pulse ring-4 ring-rose-100 border-rose-200" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
               )}
            >
              <Mic className="h-5 w-5" />
            </button>
            
            <div className="w-px h-5 bg-zinc-200 mx-1 md:mx-2 hidden xs:block" />

            {isGenerating ? (
              <button 
                onClick={onStop} 
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-rose-500 text-white shadow-lg shadow-rose-200 hover:brightness-110 transition-all active:scale-95 group/stop"
              >
                <X className="h-5 w-5 group-hover/stop:rotate-90 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={() => onSend()} 
                disabled={!input.trim() && !pendingImage && !pendingUrl && !pendingContext} 
                className={cn(
                  "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg relative overflow-hidden group/send",
                  isArchitectMode 
                    ? "bg-primary text-white hover:brightness-110 shadow-primary/20" 
                    : "bg-zinc-900 text-white hover:bg-zinc-950 shadow-zinc-200"
                )}
              >
                <ArrowUp className="h-5 w-5 relative z-10 group-hover/send:-translate-y-0.5 transition-transform" />
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
