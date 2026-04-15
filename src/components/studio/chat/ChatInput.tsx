import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, ArrowUp, X, Globe, Link2, FileCode2, Paperclip, Shield, Square } from 'lucide-react';
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
  onNewConversation?: () => void;
  projectFiles?: Record<string, { content: string; language?: string }>;
  onMentionFile?: (filename: string) => void;
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
  isScraping,
  onNewConversation,
  projectFiles,
  onMentionFile
}: ChatInputProps) {
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [showFileMentions, setShowFileMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 280) + 'px';

    // Check for @ mention
    const cursorPos = ta.selectionStart;
    setCursorPosition(cursorPos);
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // User just typed @
      setShowFileMentions(true);
      setMentionQuery('');
    } else if (lastAtIndex !== -1 && !textBeforeCursor.slice(lastAtIndex).includes(' ')) {
      // User is typing after @
      setMentionQuery(textBeforeCursor.slice(lastAtIndex + 1));
      setShowFileMentions(true);
    } else {
      setShowFileMentions(false);
      setMentionQuery('');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Tu navegador no soporta dictado por voz."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) setInput(input + (input.endsWith(' ') || !input ? '' : ' ') + transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter = Send
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (input.trim() || pendingImage || pendingUrl || pendingContext) onSend();
      return;
    }
    // Regular Enter (without shift) = Send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || pendingImage || pendingUrl || pendingContext) onSend();
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K = New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onNewConversation?.();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onNewConversation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedExtensions = ['.txt', '.js', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.sql'];
    const extension = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    if (file.size > 2 * 1024 * 1024) { toast.error(`"${file.name}" es demasiado grande (máx 2MB)`); return; }
    if (extension && !allowedExtensions.includes(`.${extension}`)) { toast.error('Tipo de archivo no permitido.'); return; }
    onAttachFile(file);
    e.target.value = '';
  };

  const hasContent = !!(input.trim() || pendingImage || pendingUrl || pendingContext);

  return (
    <footer
      className="shrink-0 relative z-40"
      style={{
        background: 'linear-gradient(to top, white 85%, rgba(255,255,255,0))',
        padding: '12px 20px 20px',
      }}
      role="contentinfo"
    >
      {/* Subtle top separator */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

      {/* ── Attachment Previews (compact pills) ── */}
      <AnimatePresence>
        {(pendingImage || pendingUrl || pendingContext || activeFile) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="max-w-4xl mx-auto w-full flex flex-wrap gap-2 mb-3 px-1"
          >
            {pendingImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 animate-in fade-in duration-200">
                <img src={pendingImage} alt="" className="h-5 w-5 rounded object-cover" />
                <span className="text-[11px] font-semibold text-zinc-600">Imagen</span>
                <button onClick={onRemoveImage} className="text-zinc-400 hover:text-zinc-700 transition-colors ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {pendingUrl && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 animate-in fade-in duration-200">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] font-semibold text-blue-600 max-w-[140px] truncate">
                  {(() => { try { return JSON.parse(pendingUrl).url; } catch { return pendingUrl; } })()}
                </span>
                <button onClick={onRemoveUrl} className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {pendingContext && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 animate-in fade-in duration-200">
                <FileCode2 className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-[11px] font-semibold text-violet-600 max-w-[140px] truncate">{pendingContext.name}</span>
                <button onClick={onRemoveContext} className="text-violet-400 hover:text-violet-700 transition-colors ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {activeFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 animate-in fade-in duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-600 max-w-[120px] truncate">{activeFile.split('/').pop()}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── URL Input Bar ── */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="max-w-4xl mx-auto w-full mb-3 flex items-center gap-2 px-1"
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-primary/40 shadow-sm focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              <Link2 className="h-4 w-4 text-primary shrink-0" />
              <input
                autoFocus type="url" value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }
                  if (e.key === 'Escape') setShowUrlInput(false);
                }}
                placeholder="Pega la URL a analizar..."
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-300 text-zinc-900"
                aria-label="URL del sitio a adjuntar"
              />
            </div>
            <button
              onClick={() => { onAttachUrl(urlInput); setShowUrlInput(false); setUrlInput(''); }}
              disabled={isScraping || !urlInput.trim()}
              className="h-10 px-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-black active:scale-95 transition-all disabled:opacity-50"
            >
              {isScraping ? 'Analizando...' : 'Adjuntar'}
            </button>
            <button
              onClick={() => setShowUrlInput(false)}
              className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-all border border-zinc-200 rounded-2xl bg-white hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Input Card ── */}
      <div className="max-w-4xl mx-auto w-full relative">
        <motion.div
          animate={{
            boxShadow: isGenerating
              ? '0 0 0 2px rgba(var(--primary-rgb), 0.3), 0 8px 32px rgba(0,0,0,0.08)'
              : isArchitectMode
              ? '0 0 0 2px rgba(var(--primary-rgb), 0.15), 0 4px 20px rgba(0,0,0,0.06)'
              : '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            "rounded-2xl bg-white relative z-20 outline-none transition-colors duration-300",
            isArchitectMode ? "border border-primary/20" : "border border-zinc-200"
          )}
        >
          {/* Generating progress bar */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ opacity: 0 }}
                className="h-0.5 w-full origin-left bg-gradient-to-r from-primary via-violet-500 to-primary rounded-t-2xl absolute top-0 left-0"
                style={{ backgroundSize: '200% 100%' }}
              />
            )}
          </AnimatePresence>

          {/* Textarea row */}
          <div className="flex items-end gap-3 px-4 pt-4 pb-3">
            {/* Plus / Attach button */}
            <div className="relative shrink-0 self-end mb-1">
              <button
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 border",
                  isPlusMenuOpen
                    ? "bg-zinc-900 text-white border-zinc-900 rotate-45"
                    : "text-zinc-400 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700 hover:border-zinc-300"
                )}
                aria-label="Adjuntar archivo o URL"
              >
                <Plus className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {isPlusMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsPlusMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                      className="absolute left-0 bottom-full mb-3 w-64 rounded-2xl bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-zinc-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Adjuntar</span>
                      </div>
                      <button
                        onClick={() => { setIsPlusMenuOpen(false); fileInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-800">Archivo</p>
                          <p className="text-[11px] text-zinc-400">txt, js, ts, css, json...</p>
                        </div>
                      </button>
                      <button
                        onClick={() => { setIsPlusMenuOpen(false); setShowUrlInput(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-800">URL</p>
                          <p className="text-[11px] text-zinc-400">Importar sitio web</p>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Textarea with @ mentions */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isArchitectMode
                    ? "Describe la arquitectura a planificar..."
                    : "Describe lo que quieres construir..."
                }
                className="w-full bg-transparent py-2.5 px-1 text-[14px] font-medium text-zinc-900 outline-none resize-none min-h-[44px] max-h-[280px] placeholder:text-zinc-400/80 leading-relaxed selection:bg-primary/20 custom-scrollbar block mb-0"
                disabled={isGenerating}
                rows={1}
              />

              {/* File Mention Menu */}
              <AnimatePresence>
                {showFileMentions && projectFiles && Object.keys(projectFiles).length > 0 && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 8 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.25 }}
                      className="absolute left-0 bottom-full mb-2 w-64 max-h-60 rounded-xl bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Archivos</span>
                      </div>
                      <div className="overflow-y-auto max-h-48 custom-scrollbar">
                        {Object.keys(projectFiles)
                          .filter(f => f.toLowerCase().includes(mentionQuery.toLowerCase()))
                          .slice(0, 5)
                          .map((filename) => (
                            <button
                              key={filename}
                              onClick={() => {
                                const beforeAt = input.slice(0, input.lastIndexOf('@', cursorPosition));
                                const afterQuery = input.slice(cursorPosition);
                                const newInput = beforeAt + '@' + filename + ' ' + afterQuery;
                                setInput(newInput);
                                setShowFileMentions(false);
                                onMentionFile?.(filename);
                                inputRef.current?.focus();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                            >
                              <FileCode2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <span className="text-[12px] font-medium text-zinc-700 truncate">{filename}</span>
                            </button>
                          ))}
                      </div>
                      <div className="px-3 py-1.5 border-t border-zinc-100 bg-zinc-50">
                        <span className="text-[9px] text-zinc-400">Escribe para filtrar archivos</span>
                      </div>
                    </motion.div>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFileMentions(false)}
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Right action buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end mb-1">
              {/* Mic */}
              <button
                onClick={toggleListening}
                aria-label="Dictado por voz"
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 border",
                  isListening
                    ? "bg-rose-50 text-rose-500 border-rose-200 animate-pulse ring-2 ring-rose-100"
                    : "text-zinc-400 hover:text-zinc-700 border-transparent hover:bg-zinc-50 hover:border-zinc-200"
                )}
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Send / Stop */}
              {isGenerating ? (
                <button
                  onClick={onStop}
                  aria-label="Detener generación"
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 active:scale-95 transition-all"
                >
                  <Square className="h-3.5 w-3.5 fill-white" />
                </button>
              ) : (
                <motion.button
                  onClick={() => onSend()}
                  disabled={!hasContent}
                  whileTap={{ scale: 0.92 }}
                  aria-label="Enviar mensaje"
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md relative overflow-hidden",
                    hasContent
                      ? isArchitectMode
                        ? "bg-primary text-white shadow-primary/25 hover:brightness-110"
                        : "bg-zinc-900 text-white shadow-zinc-300 hover:bg-zinc-700"
                      : "bg-zinc-100 text-zinc-300 shadow-none cursor-not-allowed"
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Bottom toolbar row */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-100/80">
            {/* Mode selector (PLAN / BUILD) */}
            <div className="flex items-center p-0.5 bg-zinc-100/80 rounded-[10px]">
              <button
                onClick={() => !isArchitectMode && onArchitectToggle()}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  isArchitectMode
                    ? "bg-white text-primary shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <Shield className={cn("h-3 w-3", isArchitectMode ? "text-primary" : "text-zinc-400")} />
                PLAN
              </button>
              <button
                onClick={() => isArchitectMode && onArchitectToggle()}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  !isArchitectMode
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <ArrowUp className={cn("h-3 w-3", !isArchitectMode ? "text-zinc-900" : "text-zinc-400")} />
                BUILD
              </button>
            </div>

            {/* Right: Model selector */}
            <div className="flex items-center pr-1">
              <ModelSelector selectedModel={selectedModel} onSelect={onModelSelect} />
            </div>
          </div>
        </motion.div>

        {/* Hint */}
        <p className="text-center text-[10px] text-zinc-400 mt-2 font-medium flex items-center justify-center gap-2">
          <span>Cmd+Enter para enviar</span>
          <span>·</span>
          <span>Shift+Enter nueva línea</span>
          <span>·</span>
          <span>Cmd+K nueva conversación</span>
        </p>
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
