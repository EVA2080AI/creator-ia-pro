import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, ChevronLeft, Code, Eye, Trash2 } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-14 border-b border-zinc-100 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {isEditingName ? (
            <input
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              className="text-sm font-semibold text-zinc-900 border-b border-primary outline-none bg-transparent"
            />
          ) : (
            <h2
              onClick={() => setIsEditingName(true)}
              className="text-sm font-semibold text-zinc-900 cursor-pointer hover:text-primary transition-colors"
            >
              {projectName}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-zinc-100 rounded-lg p-0.5">
            <button
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
            </button>
            <button
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
            </button>
          </div>

          <button
            onClick={onDelete}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm">Describe lo que quieres construir</p>
            <p className="text-xs text-zinc-400 mt-1">Ej: "Crea una landing page para una agencia de diseño"</p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                msg.role === 'user'
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-900"
              )}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Streaming */}
        {isGenerating && streamContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start gap-3"
          >
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-zinc-100 text-zinc-900">
              <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                {streamContent}
              </pre>
            </div>
          </motion.div>
        )}

        {isGenerating && !streamContent && (
          <div className="flex justify-start gap-3">
            <div className="bg-zinc-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500">Generando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Pide una página web..."
            disabled={isGenerating}
            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="h-11 w-11 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Model selector */}
        <div className="flex gap-2 mt-3">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {/* Model change handled by parent */}}
              className={cn(
                "px-2 py-1 text-[10px] rounded-md transition-colors",
                selectedModel === model.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {model.label}
              {model.fast && (
                <span className="ml-1 text-[8px] text-emerald-500">⚡</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
