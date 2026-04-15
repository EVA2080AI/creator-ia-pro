import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, ChevronLeft, Code, Eye, Trash2, Terminal, Zap, Copy, Download, Check, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface StudioChatLiteProps {
  projectName: string;
  projectFiles: Record<string, StudioFile>;
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  isGenerating: boolean;
  streamContent: string;
  viewMode: 'preview' | 'code';
  selectedModel: string;
  onSendMessage: (prompt: string) => void;
  onViewModeChange: (mode: 'preview' | 'code') => void;
  onBack: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

const MODELS = [
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini Flash', fast: true },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3', fast: false },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude Sonnet', fast: false },
];

// Simple syntax highlighting for TypeScript/React
function highlightCode(line: string): string {
  let highlighted = line
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Keywords
    .replace(/\b(import|export|from|return|function|const|let|var|if|else|for|while|switch|case|break|default|class|interface|type|extends|implements|async|await|new|this|typeof|as)\b/g, '<span class="text-[#c586c0]">$1</span>')
    // React hooks and common functions
    .replace(/\b(useState|useEffect|useCallback|useMemo|useRef|React|useNavigate|useSearchParams)\b/g, '<span class="text-[#4ec9b0]">$1</span>')
    // JSX tags
    .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span class="text-[#569cd6]">$2</span>')
    // Strings
    .replace(/"([^"]*)"/g, '<span class="text-[#ce9178]">"$1"</span>')
    .replace(/'([^']*)'/g, '<span class="text-[#ce9178]">\'$1\'</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>')
    // Comments
    .replace(/(\/\/.*$)/g, '<span class="text-[#6a9955]">$1</span>');

  return highlighted;
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
}: StudioChatLiteProps) {
  const [input, setInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameEdit, setNameEdit] = useState(projectName);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input);
    setInput('');
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
      toast.success('Código copiado');
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="h-14 border-b border-zinc-100 flex items-center justify-between px-4 shrink-0"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          {isEditingName ? (
            <motion.input
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              className="text-sm font-semibold text-zinc-900 border-b-2 border-primary outline-none bg-transparent"
            />
          ) : (
            <motion.h2
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsEditingName(true)}
              className="text-sm font-semibold text-zinc-900 cursor-pointer hover:text-primary transition-colors"
            >
              {projectName}
            </motion.h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <motion.div
            layout
            className="flex bg-zinc-100 rounded-lg p-0.5"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewModeChange('preview')}
              className={cn(
                "px-3 py-1.5 text-[10px] font-medium rounded-md transition-all flex items-center gap-1.5",
                viewMode === 'preview'
                  ? "bg-white text-zinc-900 shadow-sm"
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
                  ? "bg-white text-zinc-900 shadow-sm"
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
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="text-center py-12 text-zinc-400"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-zinc-300" />
              </motion.div>
              <p className="text-sm">Describe lo que quieres construir</p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-zinc-400 mt-1"
              >
                Ej: "Crea una landing page para una agencia de diseño"
              </motion.p>
            </motion.div>
          )}

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
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  msg.role === 'user'
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-900"
                )}
              >
                {msg.content}
              </motion.div>
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
              className="flex justify-start"
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
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer"
                    />
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 rounded-full bg-yellow-500/80 cursor-pointer"
                    />
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 rounded-full bg-green-500/80 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-400 font-mono">App.tsx</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Expand/Collapse Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500"
                    >
                      {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </motion.button>
                    {/* Action Buttons */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopyCode}
                      className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDownloadCode}
                      className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500"
                    >
                      <Download className="h-3 w-3" />
                    </motion.button>
                    {/* Loading dots */}
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
                      isExpanded ? "max-h-[600px]" : "max-h-[400px]"
                    )}
                  >
                    <code className="text-zinc-300">
                      <AnimatePresence>
                        {streamContent.split('\n').map((line, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.01 }}
                            className="flex"
                          >
                            <motion.span
                              whileHover={{ color: '#fff' }}
                              className="text-zinc-600 select-none w-8 text-right mr-4 text-[10px] font-mono"
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
        className="border-t border-zinc-100 p-4"
      >
        <div className="flex gap-2">
          <motion.div
            className="flex-1 relative"
            whileFocus={{ scale: 1.01 }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Pide una página web..."
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="h-11 w-11 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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
          className="flex gap-2 mt-3"
        >
          {MODELS.map((model, index) => (
            <motion.button
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {/* Model change handled by parent */}}
              className={cn(
                "px-2 py-1 text-[10px] rounded-md transition-all",
                selectedModel === model.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              )}
            >
              {model.label}
              {model.fast && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-1 text-[8px] text-emerald-500"
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
