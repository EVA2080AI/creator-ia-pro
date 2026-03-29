import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Bot, User, Plus, Loader2, Code, Zap, FileCode, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'chat' | 'code';
  files?: string[];
}

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/studio-generate`;

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy **BuilderAI**. Puedo crear apps React completas.\n\n- Describe lo que quieres construir\n- Pide modificaciones al código existente\n- Pregúntame sobre el código generado\n\n**¿Qué construimos hoy?**',
  timestamp: new Date(),
};

const SUGGESTIONS = [
  { icon: FileCode, text: 'Landing page moderna', prompt: 'Crea una landing page moderna con hero section, features y footer con Tailwind CSS oscuro' },
  { icon: Zap, text: 'Formulario de contacto', prompt: 'Crea un formulario de contacto con validación, estados de loading y diseño moderno' },
  { icon: Code, text: 'Dashboard de métricas', prompt: 'Crea un dashboard con tarjetas de estadísticas, gráficos simples con CSS y tabla de datos' },
];

// Simple markdown to HTML converter (no external lib)
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-aether-blue font-mono text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-1.5 text-white/70"><span class="text-aether-purple mt-1 shrink-0">▪</span><span>$1</span></li>')
    .replace(/\n/g, '<br/>');
}

interface StudioChatProps {
  projectId: string | null;
  projectFiles: Record<string, StudioFile>;
  onCodeGenerated: (files: Record<string, StudioFile>) => void;
  onNewConversation?: () => void;
  initialPrompt?: string | null;
  onInitialPromptUsed?: () => void;
}

export function StudioChat({ projectId, projectFiles, onCodeGenerated, onNewConversation, initialPrompt, onInitialPromptUsed }: StudioChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showScrollBtn) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-trigger initial prompt (from Welcome screen)
  useEffect(() => {
    if (initialPrompt && !isGenerating && user) {
      onInitialPromptUsed?.();
      handleSend(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, user]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  const generateCode = useCallback(async (prompt: string): Promise<{ files: Record<string, StudioFile>; explanation: string } | null> => {
    setIsGenerating(true);
    setGenProgress('Analizando solicitud…');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, currentFiles: projectFiles }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('Demasiadas solicitudes. Espera un momento.');
        else toast.error('Error al generar código');
        return null;
      }

      setGenProgress('Generando código…');

      const reader = resp.body?.getReader();
      if (!reader) return null;

      const decoder = new TextDecoder();
      let full = '';
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              full += chunk;
              if (full.includes('files')) setGenProgress('Creando archivos…');
            }
          } catch { /* skip */ }
        }
      }

      setGenProgress('Procesando resultado…');

      const jsonMatch = full.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.files) return { files: parsed.files, explanation: parsed.explanation || '' };
        } catch { /* fallthrough */ }
      }
      try {
        const parsed = JSON.parse(full);
        if (parsed.files) return { files: parsed.files, explanation: parsed.explanation || '' };
      } catch { /* not JSON */ }

      return null;
    } catch (e) {
      console.error('Studio generate error:', e);
      toast.error('Error al generar código');
      return null;
    } finally {
      setIsGenerating(false);
      setGenProgress('');
    }
  }, [projectFiles]);

  const handleSend = useCallback(async (override?: string) => {
    const text = (override || input).trim();
    if (!text || isGenerating || !user) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev.filter((m) => m.id !== 'welcome'), userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const result = await generateCode(text);

    let assistantMsg: Message;
    if (result?.files) {
      onCodeGenerated(result.files);
      const fileList = Object.keys(result.files).map((f) => `• \`${f}\``).join('\n');
      assistantMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ **¡Código generado!**\n\n${fileList}\n\n${result.explanation}`,
        timestamp: new Date(),
        type: 'code',
        files: Object.keys(result.files),
      };
    } else {
      assistantMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'No pude generar código para esa solicitud. ¿Puedes ser más específico?',
        timestamp: new Date(),
      };
    }

    setMessages((prev) => [...prev, assistantMsg]);
  }, [input, isGenerating, user, generateCode, onCodeGenerated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const showSuggestions = messages.length === 1 && messages[0].id === 'welcome';

  return (
    <div className="flex h-full flex-col bg-[#030304]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] bg-[#030304]">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-aether-purple/30 to-aether-blue/30 border border-white/10">
            <Sparkles className="h-4 w-4 text-aether-purple" />
          </div>
          <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#030304]" />
        </div>
        <div>
          <span className="text-[13px] font-bold text-white block leading-tight font-display">BuilderAI</span>
          <span className="text-[10px] text-white/30">Claude Sonnet 4.6</span>
        </div>
        <button
          onClick={() => { setMessages([WELCOME]); onNewConversation?.(); }}
          className="ml-auto p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all"
          title="Nueva conversación"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
              msg.role === 'assistant' ? 'bg-gradient-to-br from-aether-purple/20 to-aether-blue/20 border border-white/10' : 'bg-white/10'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="h-3.5 w-3.5 text-aether-purple" />
                : <User className="h-3.5 w-3.5 text-white/50" />
              }
            </div>

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? `bg-white/[0.04] border text-white/80 ${msg.type === 'code' ? 'border-green-500/20 bg-green-500/5' : 'border-white/[0.06]'}`
                : 'bg-aether-purple/20 border border-aether-purple/30 text-white'
            }`}>
              {msg.role === 'assistant' ? (
                <div
                  className="prose-custom"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
              <span className="block mt-2 text-[10px] opacity-30">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-aether-purple/20 to-aether-blue/20 border border-white/10">
              <Bot className="h-3.5 w-3.5 text-aether-purple" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
              <Loader2 className="h-3.5 w-3.5 text-aether-purple animate-spin" />
              <span className="text-[12px] text-white/50">{genProgress || 'Generando…'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll button */}
      {showScrollBtn && (
        <button
          onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-28 right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-aether-purple/80 text-white shadow-lg hover:bg-aether-purple transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s.prompt)}
              className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40 hover:text-white hover:border-aether-purple/40 hover:bg-aether-purple/5 transition-all"
            >
              <s.icon className="h-3 w-3" />
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/[0.05] p-4">
        <div className="flex items-end gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 focus-within:border-aether-purple/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe lo que quieres crear…"
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 outline-none resize-none min-h-[22px] max-h-[140px]"
            disabled={isGenerating}
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isGenerating}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-aether-purple text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-aether-purple/80 transition-all active:scale-95"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[9px] text-white/15 text-center mt-2 font-display tracking-widest uppercase">BuilderAI · Verifica el código generado</p>
      </div>
    </div>
  );
}
