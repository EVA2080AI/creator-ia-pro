import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Bot, User, Plus, Loader2, Code, Zap, FileCode, ChevronDown, ThumbsUp, ThumbsDown, Copy, RotateCcw, Check } from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col" style={{ background: '#141417' }}>
      {/* Header — Lovable-style */}
      <div className="flex items-center gap-2.5 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Sparkles className="h-3.5 w-3.5 text-aether-purple" />
          <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#141417]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white leading-none">Genesis AI</p>
          <p className="text-[10px] text-white/30 mt-0.5">Claude Sonnet 4.6</p>
        </div>
        <button
          onClick={() => { setMessages([WELCOME]); onNewConversation?.(); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/35 hover:text-white hover:bg-white/[0.05] transition-all"
          title="Nueva conversación"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Nuevo</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`group ${msg.role === 'user' ? 'flex justify-end mb-3' : 'mb-4'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[88%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            ) : (
              <div>
                {/* Assistant message — no bubble, inline like Lovable */}
                <div className="flex items-start gap-2 px-1">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md mt-0.5"
                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <Bot className="h-3 w-3 text-aether-purple" />
                  </div>
                  <div className={`flex-1 text-[13px] leading-relaxed text-white/75 ${msg.type === 'code' ? 'text-white/90' : ''}`}>
                    <div
                      className="prose-custom"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  </div>
                </div>
                {/* Reactions bar — Lovable-style */}
                <div className="flex items-center gap-0.5 ml-8 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyMessage(msg.content, msg.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-all text-[10px]">
                    {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <button className="px-2 py-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-all">
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button className="px-2 py-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-all">
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleSend(messages[messages.indexOf(msg) - 1]?.content)}
                    className="px-2 py-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-all">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <span className="ml-1 text-[10px] text-white/15">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-start gap-2 px-1 mb-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Loader2 className="h-3 w-3 text-aether-purple animate-spin" />
            </div>
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-aether-purple/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-aether-purple/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-aether-purple/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] text-white/35">{genProgress || 'Generando…'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll button */}
      {showScrollBtn && (
        <button
          onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-24 right-3 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-aether-purple text-white shadow-lg hover:bg-aether-purple/80 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s.prompt)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] text-white/50 hover:text-white transition-all text-left"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >
              <s.icon className="h-3.5 w-3.5 text-aether-purple/60 shrink-0" />
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input — Lovable-style */}
      <div className="shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="rounded-xl overflow-hidden transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Genesis…"
            className="w-full bg-transparent px-3.5 pt-3 pb-2 text-[13px] text-white placeholder:text-white/25 outline-none resize-none min-h-[20px] max-h-[120px] leading-relaxed"
            disabled={isGenerating}
            rows={1}
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <span className="text-[10px] text-white/20">↵ enviar · ⇧↵ nueva línea</span>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isGenerating}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-30 transition-all active:scale-95"
              style={{ background: input.trim() && !isGenerating ? '#8b5cf6' : 'rgba(139,92,246,0.3)' }}
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
