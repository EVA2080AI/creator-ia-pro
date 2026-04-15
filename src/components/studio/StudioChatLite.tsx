import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Loader2, Sparkles, ChevronLeft, Code, Eye, Trash2,
  Terminal, Zap, Copy, Download, Check, Maximize2, Minimize2,
  Bot, User, AlertCircle, X, RefreshCw, Wand2, Layout, Palette,
  ChevronRight, FileCode, Type, Image as ImageIcon, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface StudioChatLiteProps {
  projectName: string;
  projectFiles: Record<string, StudioFile>;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
  }>;
  isGenerating: boolean;
  streamContent: string;
  viewMode: 'preview' | 'code';
  selectedModel: string;
  onSendMessage: (prompt: string) => void;
  onViewModeChange: (mode: 'preview' | 'code') => void;
  onBack: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onRetry?: () => void;
  onImportHtml?: (htmlContent: string, fileName: string) => void;
}

const MODELS = [
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini Flash', fast: true, description: 'Rápido y eficiente' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3', fast: false, description: 'Más preciso' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude Sonnet', fast: false, description: 'Mejor para código complejo' },
];

const SUGGESTED_PROMPTS = [
  { icon: Layout, text: 'Landing page moderna', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: FileCode, text: 'Dashboard con gráficas', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Palette, text: 'Portafolio creativo', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: Type, text: 'Formulario de contacto', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: ImageIcon, text: 'Galería de imágenes', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: FileText, text: 'Blog minimalista', color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

// Simple syntax highlighting for TypeScript/React
function highlightCode(line: string): string {
  let highlighted = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\b(import|export|from|return|function|const|let|var|if|else|for|while|switch|case|break|default|class|interface|type|extends|implements|async|await|new|this|typeof|as)\b/g, '<span class="text-[#c586c0]">$1</span>')
    .replace(/\b(useState|useEffect|useCallback|useMemo|useRef|React|useNavigate|useSearchParams)\b/g, '<span class="text-[#4ec9b0]">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span class="text-[#569cd6]">$2</span>')
    .replace(/"([^"]*)"/g, '<span class="text-[#ce9178]">"$1"</span>')
    .replace(/'([^']*)'/g, '<span class="text-[#ce9178]">\'$1\'</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>')
    .replace(/(\/\/.*$)/g, '<span class="text-[#6a9955]">$1</span>');

  return highlighted;
}

// Format code blocks in message content
function formatMessage(content: string): JSX.Element {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```[\w]*\n?/, '').replace(/```$/, '');
          return (
            <div key={i} className="my-3 bg-zinc-900 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border-b border-zinc-700">
                <FileCode className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400">Código</span>
              </div>
              <pre className="p-3 text-[11px] font-mono overflow-x-auto">
                <code className="text-zinc-300">{code}</code>
              </pre>
            </div>
          );
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </>
  );
}

export function StudioChatLite({
  projectName,
  projectFiles,
  messages,
  isGenerating,
  streamContent,
  viewMode,
  selectedModel,
  onSendMessage,
  onViewModeChange,
  onBack,
  onRename,
  onDelete,
  onRetry,
  onImportHtml,
}: StudioChatLiteProps) {
  const [input, setInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameEdit, setNameEdit] = useState(projectName);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart scroll - only auto-scroll if user is near bottom
  const shouldAutoScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100; // px from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (shouldAutoScroll()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamContent, shouldAutoScroll]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input);
    setInput('');
    setShowSuggestions(false);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(`Crea una ${text.toLowerCase()}`);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const handleRename = () => {
    if (nameEdit.trim() && nameEdit !== projectName) {
      onRename(nameEdit);
    }
    setIsEditingName(false);
  };

  const handleCopyCode = async () => {
    const code = streamContent || Object.values(projectFiles)[0]?.content;
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    const code = streamContent || Object.values(projectFiles)[0]?.content;
    if (code) {
      const blob = new Blob([code], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'App.tsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Archivo descargado');
    }
  };

  // Handle file drop for HTML
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content && onImportHtml) {
          onImportHtml(content, file.name);
          toast.success(`HTML importado: ${file.name}`);
        }
      };
      reader.readAsText(file);
    } else {
      toast.error('Por favor arrastra un archivo HTML (.html)');
    }
  };

  const hasError = messages.some(m => m.isError);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="h-14 border-b border-zinc-100 flex items-center justify-between px-4 shrink-0 bg-white/80 backdrop-blur-sm z-10"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all"
            title="Volver"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            {isEditingName ? (
              <motion.input
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
                className="text-sm font-semibold text-zinc-900 border-b-2 border-primary outline-none bg-transparent w-40"
              />
            ) : (
              <motion.h2
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsEditingName(true)}
                className="text-sm font-semibold text-zinc-900 cursor-pointer hover:text-primary transition-colors truncate max-w-[150px]"
                title="Clic para renombrar"
              >
                {projectName}
              </motion.h2>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <motion.div
            layout
            className="flex bg-zinc-100/80 rounded-lg p-0.5"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewModeChange('preview')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-medium rounded-md transition-all flex items-center gap-1.5",
                viewMode === 'preview'
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Eye className="h-3 w-3" />
              Preview
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewModeChange('code')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-medium rounded-md transition-all flex items-center gap-1.5",
                viewMode === 'code'
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Code className="h-3 w-3" />
              Code
            </motion.button>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgb(254 242 242)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all"
            title="Eliminar proyecto"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative",
          isDragging && "bg-primary/5"
        )}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg m-4 flex flex-col items-center justify-center z-20 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <FileCode className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-zinc-900">Suelta el archivo HTML aquí</p>
                <p className="text-xs text-zinc-500 mt-1">Genesis lo importará automáticamente</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {/* Empty State with Suggestions */}
          {messages.length === 0 && showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 mb-4"
              >
                <Wand2 className="h-8 w-8 text-primary" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-semibold text-zinc-900 mb-2"
              >
                ¿Qué quieres crear hoy?
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-zinc-500 mb-6"
              >
                Selecciona una sugerencia o escribe tu propia idea
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-2 max-w-sm mx-auto"
              >
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={prompt.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(prompt.text)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all",
                      "border border-zinc-100 hover:border-zinc-200 hover:shadow-sm",
                      prompt.bg
                    )}
                  >
                    <prompt.icon className={cn("h-4 w-4 shrink-0", prompt.color)} />
                    <span className="text-xs font-medium text-zinc-700">{prompt.text}</span>
                    <ChevronRight className="h-3 w-3 ml-auto text-zinc-400" />
                  </motion.button>
                ))}
              </motion.div>

              {/* Import HTML option */}
              {onImportHtml && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 pt-6 border-t border-zinc-100"
                >
                  <p className="text-xs text-zinc-400 mb-3">¿Ya tienes un diseño HTML?</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg border border-dashed border-zinc-300 hover:border-primary hover:bg-primary/5 transition-all text-zinc-600 hover:text-primary"
                  >
                    <FileCode className="h-4 w-4" />
                    <span className="text-xs font-medium">Importar archivo HTML</span>
                  </motion.button>
                  <p className="text-[10px] text-zinc-400 mt-2">O arrastra un archivo .html aquí</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.23, 1, 0.32, 1]
              }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {/* Avatar for assistant */}
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[85%]">
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    msg.role === 'user'
                      ? "bg-zinc-900 text-white rounded-br-sm"
                      : msg.isError
                      ? "bg-red-50 border border-red-100 text-red-900 rounded-bl-sm"
                      : "bg-zinc-100 text-zinc-900 rounded-bl-sm"
                  )}
                >
                  {msg.isError ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700 mb-1">Ocurrió un error</p>
                        <p className="text-red-600">{msg.content}</p>
                        {onRetry && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onRetry}
                            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-800"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Reintentar
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ) : (
                    formatMessage(msg.content)
                  )}
                </motion.div>

                {/* Timestamp */}
                <span className="text-[10px] text-zinc-400 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Avatar for user */}
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Generating Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-start"
            >
              <motion.div
                animate={{
                  boxShadow: ["0 0 0 0 rgba(99, 102, 241, 0)", "0 0 20px 5px rgba(99, 102, 241, 0.3)", "0 0 0 0 rgba(99, 102, 241, 0)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-3 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white px-5 py-3 rounded-full shadow-lg"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-primary/50 rounded-full"
                  />
                  <div className="relative h-2.5 w-2.5 bg-primary rounded-full" />
                </div>
                <span className="text-xs font-medium">Genesis está creando...</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Code Streaming Display */}
          {isGenerating && streamContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex justify-start pl-10"
            >
              <motion.div
                layout
                className={cn(
                  "w-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-zinc-800 transition-all duration-300",
                  isExpanded ? "max-w-full" : "max-w-[95%]"
                )}
              >
                {/* Window Header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-3 py-2 bg-[#252526] border-b border-zinc-800"
                >
                  <div className="flex gap-1.5">
                    <motion.div
                      whileHover={{ scale: 1.2, backgroundColor: 'rgba(239, 68, 68, 1)' }}
                      className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer transition-colors"
                      onClick={() => setIsExpanded(false)}
                    />
                    <motion.div
                      whileHover={{ scale: 1.2, backgroundColor: 'rgba(234, 179, 8, 1)' }}
                      className="w-3 h-3 rounded-full bg-yellow-500/80 cursor-pointer transition-colors"
                    />
                    <motion.div
                      whileHover={{ scale: 1.2, backgroundColor: 'rgba(34, 197, 94, 1)' }}
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-3 h-3 rounded-full bg-green-500/80 cursor-pointer transition-colors"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-400 font-mono">App.tsx</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1.5 rounded text-zinc-500 transition-colors"
                      title={isExpanded ? "Colapsar" : "Expandir"}
                    >
                      {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopyCode}
                      className="p-1.5 rounded text-zinc-500 transition-colors"
                      title="Copiar código"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDownloadCode}
                      className="p-1.5 rounded text-zinc-500 transition-colors"
                      title="Descargar archivo"
                    >
                      <Download className="h-3 w-3" />
                    </motion.button>
                    <div className="flex gap-0.5 ml-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 h-1 bg-zinc-500 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Code Content */}
                <div className="relative">
                  <motion.pre
                    layout
                    className={cn(
                      "p-4 text-xs font-mono leading-relaxed overflow-x-auto overflow-y-auto transition-all duration-300",
                      isExpanded ? "max-h-[500px]" : "max-h-[350px]"
                    )}
                  >
                    <code className="text-zinc-300">
                      <AnimatePresence>
                        {streamContent.split('\n').map((line, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.5) }}
                            className="flex group"
                          >
                            <motion.span
                              className="text-zinc-600 select-none w-8 text-right mr-4 text-[10px] font-mono group-hover:text-zinc-500 transition-colors"
                            >
                              {i + 1}
                            </motion.span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightCode(line)
                              }}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </code>
                  </motion.pre>

                  {/* Cursor */}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute bottom-4 right-4 h-5 w-0.5 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-t border-zinc-100 p-4 bg-white"
      >
        <div className="flex gap-2 items-end">
          <motion.div
            className="flex-1 relative"
            whileFocus={{ scale: 1.005 }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isGenerating ? "Generando código..." : "Describe lo que quieres crear..."}
              disabled={isGenerating}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 resize-none min-h-[44px] max-h-[150px]"
            />
            {/* Character count */}
            {input.length > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-2 right-3 text-[10px] text-zinc-400"
              >
                {input.length}
              </motion.span>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className={cn(
              "h-11 w-11 flex items-center justify-center rounded-xl transition-all shadow-lg",
              isGenerating || !input.trim()
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
          >
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 10, opacity: 0 }}
                >
                  <Send className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Model selector */}
        <motion.div
          layout
          className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {MODELS.map((model, index) => (
            <motion.button
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {/* Model change handled by parent */}}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-lg transition-all whitespace-nowrap",
                selectedModel === model.id
                  ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/20"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
              )}
              title={model.description}
            >
              {model.label}
              {model.fast && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[8px]"
                >
                  ⚡
                </motion.span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
