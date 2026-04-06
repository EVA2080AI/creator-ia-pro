import { useState, useRef } from 'react';
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
      className="shrink-0 p-4 border-t border-black/[0.06] bg-white/[0.85] backdrop-blur-[40px] saturate-[1.2]"
      role="contentinfo"
    >
      {/* ── Attachment Previews ── */}
      <div className="max-w-4xl mx-auto w-full space-y-2 mb-3 px-2">
        {pendingImage && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-bottom-1" role="status">
            <img src={pendingImage} alt="Vista previa adjunta" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
            <span className="text-[11px] font-bold text-zinc-500 flex-1 truncate">Imagen procesada lista</span>
            <button 
              onClick={onRemoveImage} 
              aria-label="Quitar imagen"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {pendingUrl && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/50 animate-in fade-in slide-in-from-bottom-1" role="status">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-200/20">
              <Globe className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 flex-1 truncate font-mono">
              {(() => {try { return JSON.parse(pendingUrl).url; } catch(e) { return pendingUrl; }})()}
            </span>
            <button 
              onClick={onRemoveUrl} 
              aria-label="Quitar URL"
              className="p-1.5 rounded-lg text-emerald-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {pendingContext && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-primary/[0.03] border border-primary/20 animate-in fade-in slide-in-from-bottom-1" role="status">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
              <FileCode2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex-1 truncate">
               Contexto: {pendingContext.name}
            </span>
            <button 
              onClick={onRemoveContext} 
              aria-label="Quitar contexto"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {activeFile && (
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white w-fit shadow-lg shadow-zinc-200" role="status">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Editando: {activeFile.split('/').pop()}
            </span>
          </div>
        )}
      </div>

      {/* ── URL Input Bar ── */}
      {showUrlInput && (
        <div className="max-w-4xl mx-auto w-full mb-3 flex items-center gap-2 px-2 animate-in slide-in-from-bottom-2 duration-300">
           <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-primary/30 shadow-[0_10px_30px_-10px_rgba(var(--primary-rgb),0.1)] transition-all focus-within:ring-2 focus-within:ring-primary/10">
              <Link2 className="h-4 w-4 text-primary/50" />
              <input 
                autoFocus type="url" value={urlInput} 
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }
                  if (e.key === 'Escape') setShowUrlInput(false);
                }}
                placeholder="Pega la URL de un sitio que quieras clonar..."
                className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-zinc-400"
                aria-label="URL del sitio a clonar"
              />
           </div>
           <button 
              onClick={() => { onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }} 
              disabled={isScraping || !urlInput.trim()}
              className="h-11 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
             {isScraping ? 'Scraping...' : 'Adjuntar'}
           </button>
           <button 
              onClick={() => setShowUrlInput(false)} 
              aria-label="Cancelar"
              className="h-11 w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
            >
             <X className="h-5 w-5" />
           </button>
        </div>
      )}

      {/* ── Main Input Container ── */}
      <div className="max-w-4xl mx-auto w-full relative">
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
