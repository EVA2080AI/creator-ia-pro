import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, X, Send, Sparkles, Plus, ChevronRight, Maximize2, Minimize2,
  MessageSquare, Copy, Check, Code2, Eye, EyeOff, Trash2, ChevronDown,
  Zap, Brain, Megaphone, PenTool, Search, Palette, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  personality: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

type ChatMode = 'collapsed' | 'panel' | 'fullscreen';

// ─── Models ──────────────────────────────────────────────────────────────────
const CHAT_MODELS = [
  { id: 'gemini-3-flash',      name: 'Gemini Flash',      badge: 'Rápido',    cost: 1, color: '#00C2FF',  openrouter: 'google/gemini-2.0-flash-001' },
  { id: 'deepseek-chat',       name: 'DeepSeek V3',       badge: 'Código',    cost: 1, color: '#4ADE80',  openrouter: 'deepseek/deepseek-chat-v3-0324' },
  { id: 'mistral-small',       name: 'Mistral Small',     badge: 'Privacidad',cost: 1, color: '#FF6B6B',  openrouter: 'mistralai/mistral-small-3.1-24b-instruct' },
  { id: 'gemini-3.1-pro-low',  name: 'Gemini Pro',        badge: 'Análisis',  cost: 1, color: '#00E5A0',  openrouter: 'google/gemini-2.5-pro-preview-03-25' },
  { id: 'mistral-large',       name: 'Mistral Large',     badge: 'EU',        cost: 2, color: '#FF9500',  openrouter: 'mistralai/mistral-large' },
  { id: 'claude-3.5-sonnet',   name: 'Claude Sonnet',     badge: 'Creativo',  cost: 4, color: '#A855F7',  openrouter: 'anthropic/claude-sonnet-4-5' },
  { id: 'claude-3-opus',       name: 'Claude Opus',       badge: 'Máximo',    cost: 5, color: '#F59E0B',  openrouter: 'anthropic/claude-opus-4-5' },
  { id: 'gpt-oss-120b',        name: 'Llama 4 Maverick',  badge: 'Open',      cost: 2, color: '#EC4899',  openrouter: 'meta-llama/llama-4-maverick' },
];

// ─── Personalities ────────────────────────────────────────────────────────────
const PERSONALITIES = [
  {
    id: 'assistant', name: 'Asistente IA', icon: Bot,
    color: 'text-white', bg: 'bg-white/5',
    prompt: 'Eres un asistente de IA de alto rendimiento. Responde con precisión, claridad y valor. Usa markdown cuando sea útil.',
  },
  {
    id: 'marketing', name: 'Marketing Specialist', icon: Megaphone,
    color: 'text-rose-400', bg: 'bg-rose-400/10',
    prompt: 'Eres un Especialista en Marketing Digital Senior con 10+ años de experiencia. Dominas Meta Ads, Google Ads, SEO, email marketing, copywriting y estrategia de contenidos. Orientas todas tus respuestas a resultados, ROI y crecimiento de negocio. Hablas en español.',
  },
  {
    id: 'copywriter', name: 'Copywriter Creativo', icon: PenTool,
    color: 'text-aether-purple', bg: 'bg-aether-purple/10',
    prompt: 'Eres un Copywriter creativo experto. Usas las fórmulas AIDA, PAS, FAB y Before-After-Bridge. Tu copy es persuasivo, emocional y orientado a conversión. Siempre entregas opciones y variaciones. Hablas en español.',
  },
  {
    id: 'code', name: 'Code Assistant', icon: Code2,
    color: 'text-aether-blue', bg: 'bg-aether-blue/10',
    prompt: 'Eres un desarrollador Full-Stack Senior. Generas código limpio, moderno y bien estructurado. Prefieres TypeScript, React, Tailwind CSS y Node.js. SIEMPRE envuelves el código en bloques de código con el lenguaje especificado (```tsx, ```html, ```css, etc). Explicas brevemente lo que hace el código.',
  },
  {
    id: 'seo', name: 'SEO Strategist', icon: Search,
    color: 'text-emerald-400', bg: 'bg-emerald-400/10',
    prompt: 'Eres un Estratega SEO experto con amplia experiencia en posicionamiento orgánico. Conoces el algoritmo de Google, E-E-A-T, keyword research, linkbuilding, SEO técnico y contenido semántico. Siempre orientas tus respuestas a resultados medibles y estrategias accionables. Hablas en español.',
  },
  {
    id: 'director', name: 'Director Creativo', icon: Palette,
    color: 'text-amber-400', bg: 'bg-amber-400/10',
    prompt: 'Eres un Director Creativo de agencia de nivel global. Piensas en conceptos, narrativas visuales y experiencias memorables. Combinas estrategia con creatividad para crear campañas que conectan emocionalmente y generan impacto cultural. Hablas en español.',
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aether_chat_conversations';

function loadConversations(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function parseMarkdownLight(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-aether-blue">$1</code>')
    .replace(/^---+$/gm, '<hr class="border-white/10 my-3"/>')
    .replace(/^\s*[-*•] (.+)$/gm, '<li class="flex gap-2"><span class="text-white/40 mt-1">·</span><span>$1</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-2">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/^(?!<[hul]|<hr|<p)(.+)$/gm, (line) => `<p>${line}</p>`);
}

// Detect code blocks in a message
function extractCodeBlocks(text: string): Array<{ lang: string; code: string; full: string }> {
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks: Array<{ lang: string; code: string; full: string }> = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ lang: match[1] || 'text', code: match[2].trim(), full: match[0] });
  }
  return blocks;
}

function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w+)?\n?[\s\S]*?```/g, '').trim();
}

function hasPreviewableCode(text: string): boolean {
  return /```(html|jsx|tsx|css|javascript|js)\n?[\s\S]*?```/.test(text);
}

// ─── CodeBlock component ──────────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const isPreviewable = ['html', 'jsx', 'tsx', 'javascript', 'js'].includes(lang);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPreviewSrc = () => {
    if (lang === 'html') return `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
    // For React/JSX, wrap in a basic HTML structure
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://unpkg.com/react@18/umd/react.development.js"><\/script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-gray-900 text-white p-4"><div id="root"></div><script>
// ${code}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('div', {className:'text-white'}, 'Preview en desarrollo'))</script></body></html>`;
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.05]">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">{lang}</span>
        <div className="flex items-center gap-2">
          {isPreviewable && (
            <button onClick={() => setPreview(v => !v)} className="flex items-center gap-1.5 text-[10px] font-bold text-aether-blue/60 hover:text-aether-blue transition-colors uppercase tracking-widest">
              {preview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {preview ? 'Código' : 'Preview'}
            </button>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest">
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="h-64 bg-white">
          <iframe
            src={getPreviewSrc()}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="Code preview"
          />
        </div>
      ) : (
        <pre className="p-4 overflow-x-auto text-[11px] font-mono text-white/70 leading-relaxed bg-[#0a0a0d] max-h-64 overflow-y-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

// ─── Message component ────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const codeBlocks = extractCodeBlocks(msg.content);
  const textWithoutCode = stripCodeBlocks(msg.content);

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-white text-black rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] font-medium leading-relaxed shadow-lg">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-aether-purple" />
      </div>
      <div className="flex-1 min-w-0">
        {textWithoutCode && (
          <div
            className="text-[13px] text-white/80 leading-relaxed prose-aether"
            dangerouslySetInnerHTML={{ __html: parseMarkdownLight(textWithoutCode) }}
          />
        )}
        {codeBlocks.map((block, i) => (
          <CodeBlock key={i} lang={block.lang} code={block.code} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const GeniusAssistant = ({ onAction }: { onAction?: (action: string, data: any) => void }) => {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const [mode, setMode] = useState<ChatMode>('collapsed');
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash');
  const [selectedPersonality, setSelectedPersonality] = useState('assistant');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showModels, setShowModels] = useState(false);
  const [showPersonalities, setShowPersonalities] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;
  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) || CHAT_MODELS[0];
  const currentPersonality = PERSONALITIES.find(p => p.id === selectedPersonality) || PERSONALITIES[0];

  // Listen for fullscreen open event (dispatched by /chat page)
  useEffect(() => {
    const handler = () => setMode('fullscreen');
    window.addEventListener('aether-chat-open-fullscreen', handler);
    return () => window.removeEventListener('aether-chat-open-fullscreen', handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamingText]);

  // Save when conversations change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Create new conversation
  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nueva conversación',
      model: selectedModel,
      personality: selectedPersonality,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
  }, [selectedModel, selectedPersonality]);

  // Delete conversation
  const deleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }, [activeConvId]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;
    if (!user) { toast.error('Inicia sesión para usar el chat'); return; }

    const userContent = input.trim();
    setInput('');

    // Ensure we have an active conversation
    let convId = activeConvId;
    if (!convId) {
      const conv: Conversation = {
        id: crypto.randomUUID(),
        title: userContent.slice(0, 40) || 'Nueva conversación',
        model: selectedModel,
        personality: selectedPersonality,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      convId = conv.id;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      createdAt: Date.now(),
    };

    // Add user message
    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      messages: [...c.messages, userMsg],
      title: c.messages.length === 0 ? userContent.slice(0, 40) : c.title,
      updatedAt: Date.now(),
    } : c));

    setStreaming(true);
    setStreamingText('');

    // Deduct credits
    const cost = (CHAT_MODELS.find(m => m.id === selectedModel)?.cost || 1);
    try {
      await (supabase.rpc as any)('spend_credits', {
        _amount: cost, _action: 'chat', _model: selectedModel, _node_id: null,
      });
    } catch (err: any) {
      setStreaming(false);
      toast.error(err?.message || 'Créditos insuficientes');
      return;
    }

    // Stream response
    const messages = [
      { role: 'system', content: currentPersonality.prompt },
      ...(conversations.find(c => c.id === convId)?.messages || []).map(m => ({
        role: m.role, content: m.content,
      })),
      { role: 'user', content: userContent },
    ];

    let fullText = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: { model: currentModel.openrouter, messages, temperature: 0.85, max_tokens: 4096, stream: true },
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream no disponible');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const json = JSON.parse(payload);
            const chunk = json.choices?.[0]?.delta?.content;
            if (chunk) { fullText += chunk; setStreamingText(fullText); }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      // Refund on error
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)('refund_credits', { _amount: cost, _user_id: u.id });
      } catch { /* silent */ }
      // Fallback to processAction
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res2 = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ provider: 'gemini', path: 'models/gemini-1.5-flash:generateContent', body: { contents: messages.map(m => ({ parts: [{ text: m.content }] })) } }),
        });
        const d2 = await res2.json();
        fullText = d2.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta.';
        setStreamingText(fullText);
      } catch { fullText = 'Error de conexión. Intenta de nuevo.'; setStreamingText(fullText); }
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fullText || 'Sin respuesta.',
      createdAt: Date.now(),
    };

    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      messages: [...c.messages, assistantMsg],
      updatedAt: Date.now(),
    } : c));

    setStreamingText('');
    setStreaming(false);
  }, [input, streaming, user, activeConvId, selectedModel, selectedPersonality, currentModel, currentPersonality, conversations]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Collapsed button ──────────────────────────────────────────────────────
  if (mode === 'collapsed') {
    return (
      <div className="fixed bottom-20 left-6 z-[99999]">
        <button
          onClick={() => setMode('panel')}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="absolute inset-0 rounded-2xl bg-aether-purple/20 animate-ping opacity-20" />
          <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-aether-purple border-2 border-[#050506] shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
        </button>
      </div>
    );
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const Header = () => (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-white tracking-wide font-display uppercase">Aether Chat</p>
          <p className="text-[9px] text-white/25 uppercase tracking-[0.3em] font-bold font-display">{currentModel.name} · {currentPersonality.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMode(mode === 'panel' ? 'fullscreen' : 'panel')}
          className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all"
          title={mode === 'panel' ? 'Expandir' : 'Reducir'}
        >
          {mode === 'panel' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => setMode('collapsed')} className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // ── Conversation sidebar (fullscreen only) ────────────────────────────────
  const ConvSidebar = () => (
    <div className="w-56 shrink-0 border-r border-white/[0.05] flex flex-col bg-[#060608] h-full">
      <div className="p-3 border-b border-white/[0.05]">
        <button
          onClick={newConversation}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-white/90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo chat
        </button>
      </div>

      {/* Model selector */}
      <div className="p-3 border-b border-white/[0.05]">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2 ml-1">Motor de IA</p>
        <div className="relative">
          <button
            onClick={() => { setShowModels(v => !v); setShowPersonalities(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] transition-all text-left"
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: currentModel.color }} />
            <span className="flex-1 text-[11px] font-bold text-white/70 truncate">{currentModel.name}</span>
            <ChevronDown className="h-3 w-3 text-white/20 shrink-0" />
          </button>
          {showModels && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0d]/98 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl backdrop-blur-xl">
              {CHAT_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); setShowModels(false); }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-all", selectedModel === m.id && "bg-white/[0.07]")}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white/80 truncate">{m.name}</p>
                    <p className="text-[9px] text-white/30">{m.badge} · {m.cost} cr</p>
                  </div>
                  {selectedModel === m.id && <Check className="h-3 w-3 text-aether-purple shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personality selector */}
      <div className="p-3 border-b border-white/[0.05]">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2 ml-1">Personalidad</p>
        <div className="relative">
          <button
            onClick={() => { setShowPersonalities(v => !v); setShowModels(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] transition-all text-left"
          >
            <currentPersonality.icon className={cn("h-3.5 w-3.5 shrink-0", currentPersonality.color)} />
            <span className="flex-1 text-[11px] font-bold text-white/70 truncate">{currentPersonality.name}</span>
            <ChevronDown className="h-3 w-3 text-white/20 shrink-0" />
          </button>
          {showPersonalities && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0d]/98 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl backdrop-blur-xl">
              {PERSONALITIES.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPersonality(p.id); setShowPersonalities(false); }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-all", selectedPersonality === p.id && "bg-white/[0.07]")}
                >
                  <p.icon className={cn("h-3.5 w-3.5 shrink-0", p.color)} />
                  <p className="text-[11px] font-bold text-white/80 truncate">{p.name}</p>
                  {selectedPersonality === p.id && <Check className="h-3 w-3 text-aether-purple shrink-0 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare className="h-6 w-6 text-white/10 mb-2" />
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Sin conversaciones</p>
          </div>
        ) : conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setActiveConvId(conv.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left group transition-all",
              activeConvId === conv.id ? "bg-white/[0.08] border border-white/[0.08]" : "hover:bg-white/[0.04]"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 text-white/20 shrink-0" />
            <span className="flex-1 text-[11px] text-white/60 font-medium truncate">{conv.title}</span>
            <button
              onClick={(e) => deleteConversation(conv.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 text-white/20 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>

      {/* Credits */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <Zap className="h-3.5 w-3.5 text-aether-purple shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-white/50">{profile?.credits_balance?.toLocaleString() ?? '0'} créditos</p>
            <p className="text-[9px] text-white/20">{currentModel.cost} por mensaje</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Chat area (shared between panel and fullscreen) ───────────────────────
  const ChatArea = () => {
    const messages = activeConv?.messages || [];
    const isEmpty = messages.length === 0 && !streaming;

    return (
      <div className="flex flex-1 flex-col min-w-0 h-full">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center mb-5">
                <currentPersonality.icon className={cn("h-6 w-6", currentPersonality.color)} />
              </div>
              <p className="text-base font-bold text-white font-display mb-2">{currentPersonality.name}</p>
              <p className="text-[12px] text-white/30 max-w-xs leading-relaxed">
                {selectedPersonality === 'code' ? 'Escribe qué quieres construir y te generaré el código con preview.' :
                 selectedPersonality === 'marketing' ? 'Pregúntame sobre campañas, ads, copywriting o estrategia digital.' :
                 'Empieza una conversación. Soy tu asistente de IA de alta performance.'}
              </p>
              {/* Quick prompts */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
                {(selectedPersonality === 'code' ? [
                  'Crea un botón animado con Tailwind', 'Landing page hero section en HTML', 'Navbar responsive con React'
                ] : selectedPersonality === 'marketing' ? [
                  'Estrategia Meta Ads para e-commerce', 'Copy para lanzar un producto', 'Plan de contenidos 30 días'
                ] : [
                  'Explícame cómo funciona', 'Dame ideas creativas', 'Resume este concepto'
                ]).map(q => (
                  <button key={q} onClick={() => setInput(q)} className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/[0.08] transition-all uppercase tracking-wider">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {streaming && streamingText && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-aether-purple animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">{streamingText}</div>
                    <span className="inline-block w-2 h-4 bg-aether-purple/70 animate-pulse ml-0.5 rounded-sm" />
                  </div>
                </div>
              )}
              {streaming && !streamingText && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-aether-purple animate-spin" />
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.05] shrink-0">
          {/* Model + personality quick selector (panel mode) */}
          {mode === 'panel' && (
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
              <div className="relative">
                <button onClick={() => { setShowModels(v => !v); setShowPersonalities(false); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.08] transition-all text-[10px] font-bold text-white/40 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentModel.color }} />
                  {currentModel.name} <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {showModels && (
                  <div className="absolute bottom-full left-0 mb-1 bg-[#0a0a0d]/98 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl backdrop-blur-xl w-48">
                    {CHAT_MODELS.map(m => (
                      <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModels(false); }} className={cn("w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-all", selectedModel === m.id && "bg-white/[0.07]")}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                        <span className="text-[11px] font-bold text-white/70">{m.name}</span>
                        <span className="ml-auto text-[9px] text-white/25">{m.cost}cr</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => { setShowPersonalities(v => !v); setShowModels(false); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.08] transition-all text-[10px] font-bold text-white/40 whitespace-nowrap">
                  <currentPersonality.icon className={cn("h-3 w-3", currentPersonality.color)} />
                  {currentPersonality.name} <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {showPersonalities && (
                  <div className="absolute bottom-full left-0 mb-1 bg-[#0a0a0d]/98 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl backdrop-blur-xl w-48">
                    {PERSONALITIES.map(p => (
                      <button key={p.id} onClick={() => { setSelectedPersonality(p.id); setShowPersonalities(false); }} className={cn("w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-all", selectedPersonality === p.id && "bg-white/[0.07]")}>
                        <p.icon className={cn("h-3.5 w-3.5 shrink-0", p.color)} />
                        <span className="text-[11px] font-bold text-white/70">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={newConversation} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.08] transition-all text-[10px] font-bold text-white/25 whitespace-nowrap">
                <Plus className="h-3 w-3" /> Nuevo
              </button>
            </div>
          )}
          <div className="relative flex items-end gap-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 focus-within:border-aether-purple/30 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mensaje para ${currentPersonality.name}...`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[13px] text-white placeholder:text-white/20 focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
              style={{ fieldSizing: 'content' } as any}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
            >
              {streaming ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[9px] text-white/15 text-center mt-2 font-bold uppercase tracking-widest">
            Enter para enviar · Shift+Enter nueva línea · {currentModel.cost} crédito/mensaje
          </p>
        </div>
      </div>
    );
  };

  // ── Panel mode ────────────────────────────────────────────────────────────
  if (mode === 'panel') {
    return (
      <div className="fixed bottom-20 left-6 z-[99999] w-[400px] h-[560px] bg-[#08080b]/98 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        <Header />
        <ChatArea />
      </div>
    );
  }

  // ── Fullscreen mode ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[99999] bg-[#050506]/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ConvSidebar />
        <ChatArea />
      </div>
    </div>
  );
};
