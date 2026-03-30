import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Sparkles, Plus, MessageSquare, Copy, Check,
  Code2, Trash2, ChevronDown, Zap, Megaphone, PenTool,
  Search, Palette, User, CreditCard, ArrowUpRight,
  Monitor, Loader2, Bot, Eye, EyeOff, X, ArrowLeft,
  Paperclip, SquarePen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Models ──────────────────────────────────────────────────────────────────
const CHAT_MODELS = [
  { id: 'gemini-3-flash',      name: 'Gemini 2.0 Flash',  badge: 'Rápido',     cost: 1, color: '#00C2FF', openrouter: 'google/gemini-2.0-flash-001' },
  { id: 'deepseek-chat',       name: 'DeepSeek V3',       badge: 'Código',     cost: 1, color: '#8AB4F8', openrouter: 'deepseek/deepseek-chat-v3-0324' },
  { id: 'mistral-small',       name: 'Mistral Small',     badge: 'Privacidad', cost: 1, color: '#FF6B6B', openrouter: 'mistralai/mistral-small-3.1-24b-instruct' },
  { id: 'gemini-3.1-pro-low',  name: 'Gemini 2.5 Pro',    badge: 'Análisis',   cost: 1, color: '#00E5A0', openrouter: 'google/gemini-2.5-pro-preview-03-25' },
  { id: 'mistral-large',       name: 'Mistral Large',     badge: 'EU',         cost: 2, color: '#FF9500', openrouter: 'mistralai/mistral-large' },
  { id: 'claude-3.5-sonnet',   name: 'Claude Sonnet 4.6', badge: 'Creativo',   cost: 4, color: '#8AB4F8', openrouter: 'anthropic/claude-sonnet-4-6' },
  { id: 'claude-3-opus',       name: 'Claude Opus 4.6',   badge: 'Máximo',     cost: 5, color: '#F59E0B', openrouter: 'anthropic/claude-opus-4-6' },
  { id: 'gpt-oss-120b',        name: 'Llama 4 Maverick',  badge: 'Open',       cost: 2, color: '#EC4899', openrouter: 'meta-llama/llama-4-maverick' },
];

// ─── Personalities ────────────────────────────────────────────────────────────
const PERSONALITIES = [
  { id: 'assistant',  name: 'Antigravity',          icon: Bot,       color: 'text-white/60',    bg: 'bg-white/5',
    prompt: 'Eres Antigravity, un asistente de IA de alto rendimiento. Responde con precisión, claridad y valor. Usa markdown cuando sea útil.' },
  { id: 'code',       name: 'Code Assistant',       icon: Code2,     color: 'text-sky-400',     bg: 'bg-sky-400/10',
    prompt: 'Eres un desarrollador Full-Stack Senior experto. Generas código limpio, moderno con TypeScript, React y Tailwind CSS. SIEMPRE envuelves código en bloques con lenguaje especificado (```tsx, ```html, etc).' },
  { id: 'marketing',  name: 'Marketing Expert',     icon: Megaphone, color: 'text-rose-400',    bg: 'bg-rose-400/10',
    prompt: 'Eres un Especialista en Marketing Digital Senior con 10+ años de experiencia. Dominas Meta Ads, Google Ads, SEO y copywriting. Hablas en español.' },
  { id: 'copywriter', name: 'Copywriter',           icon: PenTool,   color: 'text-[#8AB4F8]',  bg: 'bg-[#8AB4F8]/10',
    prompt: 'Eres un Copywriter creativo experto. Usas AIDA, PAS, FAB. Tu copy es persuasivo y orientado a conversión. Hablas en español.' },
  { id: 'seo',        name: 'SEO Strategist',       icon: Search,    color: 'text-emerald-400', bg: 'bg-emerald-400/10',
    prompt: 'Eres un Estratega SEO experto. Conoces el algoritmo de Google, E-E-A-T, keyword research y SEO técnico. Hablas en español.' },
  { id: 'director',   name: 'Director Creativo',    icon: Palette,   color: 'text-amber-400',   bg: 'bg-amber-400/10',
    prompt: 'Eres un Director Creativo de agencia global. Combinas estrategia con creatividad para campañas memorables. Hablas en español.' },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aether_chat_v2';
const loadConvs = (): Conversation[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const saveConvs = (c: Conversation[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c.slice(0, 50)));

// ─── Markdown ─────────────────────────────────────────────────────────────────
function md(text: string): string {
  return text
    .replace(/^### (.+)$/gm,   '<h3 class="text-[15px] font-semibold text-white mt-5 mb-1.5 leading-snug">$1</h3>')
    .replace(/^## (.+)$/gm,    '<h2 class="text-base font-bold text-white mt-6 mb-2 leading-snug">$1</h2>')
    .replace(/^# (.+)$/gm,     '<h1 class="text-lg font-bold text-white mt-7 mb-2 leading-snug">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em class="italic text-white/75">$1</em>')
    .replace(/`([^`\n]+)`/g,   '<code class="bg-white/[0.08] border border-white/[0.07] text-sky-300 px-1.5 py-0.5 rounded-md text-[12.5px] font-mono">$1</code>')
    .replace(/^---+$/gm,       '<hr class="border-white/[0.08] my-5"/>')
    .replace(/^\s*[-*•] (.+)$/gm, '<li class="flex gap-2.5 my-1"><span class="text-white/30 shrink-0 mt-[3px] text-[10px]">▸</span><span class="text-white/80">$1</span></li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="my-3 space-y-0.5 ml-1">${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li class="flex gap-2.5 my-1"><span class="text-white/25 shrink-0 font-mono text-[11px] mt-[2px]">·</span><span class="text-white/80">$1</span></li>')
    .replace(/\n\n/g,          '</p><p class="mt-3 text-white/75 leading-[1.75]">')
    .replace(/^(?!<[hublpei])(.+)$/gm, line => line.trim() ? `<p class="text-white/75 leading-[1.75]">${line}</p>` : '');
}

function extractCode(text: string) {
  const re = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks: { lang: string; code: string }[] = [];
  let m;
  while ((m = re.exec(text)) !== null) blocks.push({ lang: m[1] || 'text', code: m[2].trim() });
  return blocks;
}
function stripCode(text: string) { return text.replace(/```(\w+)?\n?[\s\S]*?```/g, '').trim(); }
const previewable = (l: string) => ['html', 'jsx', 'tsx', 'javascript', 'js'].includes(l);

// ─── CodeBlock ────────────────────────────────────────────────────────────────
function CodeBlock({ lang, code, onCanvas }: { lang: string; code: string; onCanvas?: (c: string, l: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const isPrev = previewable(lang);

  const iframeSrc = lang === 'html'
    ? `data:text/html;charset=utf-8,${encodeURIComponent(code)}`
    : `data:text/html;charset=utf-8,${encodeURIComponent(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"><\/script><style>body{background:#191a1f;color:#e5e7eb;font-family:ui-sans-serif,system-ui,sans-serif;padding:1.5rem;margin:0}</style></head><body>${code}</body></html>`,
      )}`;

  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/[0.07] bg-[#191a1f]">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.025] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
          </div>
          <span className="text-[11px] font-medium text-white/25 select-none">{lang}</span>
        </div>
        <div className="flex items-center gap-2">
          {isPrev && onCanvas && (
            <button onClick={() => onCanvas(code, lang)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/30 hover:text-[#8AB4F8] transition-colors px-2 py-1 rounded-lg hover:bg-[#8AB4F8]/10">
              <Monitor className="h-3.5 w-3.5" /> Canvas
            </button>
          )}
          {isPrev && (
            <button onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/30 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? 'Código' : 'Preview'}
            </button>
          )}
          <button onClick={copy}
            className="flex items-center gap-1.5 text-[11px] font-medium text-white/30 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
      {showPreview ? (
        <div className="h-72 bg-[#191a1f]">
          <iframe src={iframeSrc} className="w-full h-full border-0" sandbox="allow-scripts" title="code-preview" />
        </div>
      ) : (
        <pre className="p-5 overflow-x-auto text-[13px] font-mono text-white/55 leading-relaxed max-h-80 overflow-y-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

// ─── Thinking indicator ───────────────────────────────────────────────────────
function Thinking({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: color + '80', animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  );
}

// ─── Canvas Panel ─────────────────────────────────────────────────────────────
function CanvasPanel({ code, lang, onClose }: { code: string; lang: string; onClose: () => void }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const src = lang === 'html'
    ? `data:text/html;charset=utf-8,${encodeURIComponent(code)}`
    : `data:text/html;charset=utf-8,${encodeURIComponent(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"><\/script><style>body{background:#191a1f;color:#e5e7eb;font-family:ui-sans-serif,system-ui,sans-serif;padding:2rem;margin:0}</style></head><body>${code}</body></html>`,
      )}`;

  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="w-[520px] shrink-0 flex flex-col border-l border-white/[0.06] bg-[#191a1f] animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.06] shrink-0">
        <div className="flex border border-white/[0.07] rounded-lg overflow-hidden bg-white/[0.03]">
          {(['preview', 'code'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-1.5 text-[12px] font-semibold transition-all',
                tab === t ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/60')}>
              {t === 'preview' ? 'Vista previa' : 'Código'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white/30 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/[0.05] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'preview'
          ? <iframe src={src} className="w-full h-full border-0" sandbox="allow-scripts" title="canvas" />
          : <pre className="p-5 h-full overflow-auto text-[12.5px] font-mono text-white/50 leading-relaxed"><code>{code}</code></pre>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface GeniusAssistantProps {
  onAction?: (action: string, data: any) => void;
  embedded?: boolean;   // true = panel inside Studio; false (default) = fullscreen /chat page
  onClose?: () => void; // only used in embedded mode
}

export const GeniusAssistant = ({ onAction, embedded = false, onClose }: GeniusAssistantProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [conversations, setConvs]       = useState<Conversation[]>(loadConvs);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [model, setModel]               = useState('gemini-3-flash');
  const [personality, setPersonality]   = useState('assistant');
  const [input, setInput]               = useState('');
  const [streaming, setStreaming]       = useState(false);
  const [streamText, setStreamText]     = useState('');
  const [modelOpen, setModelOpen]       = useState(false);
  const [persOpen, setPersOpen]         = useState(false);
  const [canvas, setCanvas]             = useState<{ code: string; lang: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const activeConv  = conversations.find(c => c.id === activeId) ?? null;
  const curModel    = CHAT_MODELS.find(m => m.id === model) ?? CHAT_MODELS[0];
  const curPers     = PERSONALITIES.find(p => p.id === personality) ?? PERSONALITIES[0];
  const planTier    = (profile?.subscription_tier ?? 'free').toUpperCase();
  const isPro       = planTier !== 'FREE';

  useEffect(() => { saveConvs(conversations); }, [conversations]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeConv?.messages, streamText]);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const newConv = useCallback(() => {
    const c: Conversation = {
      id: crypto.randomUUID(), title: 'Nueva conversación',
      model, personality, messages: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    setConvs(p => [c, ...p]);
    setActiveId(c.id);
    setCanvas(null);
  }, [model, personality]);

  const delConv = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConvs(p => p.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const openCanvas = useCallback((code: string, lang: string) => setCanvas({ code, lang }), []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;
    if (!user) { toast.error('Inicia sesión para continuar'); return; }

    const text = input.trim();
    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    // Ensure active conversation
    let cId = activeId;
    let prev: Message[] = [];
    if (!cId) {
      const c: Conversation = {
        id: crypto.randomUUID(), title: text.slice(0, 50),
        model, personality, messages: [], createdAt: Date.now(), updatedAt: Date.now(),
      };
      setConvs(p => [c, ...p]);
      setActiveId(c.id);
      cId = c.id;
    } else {
      prev = activeConv?.messages ?? [];
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: Date.now() };
    setConvs(p => p.map(c => c.id === cId
      ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? text.slice(0, 50) : c.title, updatedAt: Date.now() }
      : c));

    setStreaming(true);
    setStreamText('');

    // Deduct credits
    try {
      await (supabase.rpc as any)('spend_credits', { _amount: curModel.cost, _action: 'chat', _model: model, _node_id: null });
    } catch (e: unknown) {
      setStreaming(false);
      toast.error(e instanceof Error ? e.message : 'Créditos insuficientes');
      return;
    }

    const msgs = [
      { role: 'system', content: curPers.prompt },
      ...prev.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    let full = '';

    // Attempt 1: OpenRouter
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { provider: 'openrouter', path: 'chat/completions',
          body: { model: curModel.openrouter, messages: msgs, temperature: 0.85, max_tokens: 4096, stream: false } },
      });
      if (error) throw new Error(error.message);
      const t = data?.choices?.[0]?.message?.content;
      if (t) { full = t; setStreamText(t); }
    } catch { /* fallback */ }

    // Attempt 2: Gemini
    if (!full) {
      try {
        const geminiMsgs = msgs.filter(m => m.role !== 'system')
          .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
          body: { provider: 'gemini', path: 'models/gemini-1.5-flash:generateContent',
            body: { contents: geminiMsgs, systemInstruction: { parts: [{ text: msgs[0]?.content ?? '' }] } } },
        });
        if (error) throw new Error(error.message);
        const t = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) { full = t; setStreamText(t); }
      } catch { /* both failed */ }
    }

    // Refund if both failed
    if (!full) {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)('refund_credits', { _amount: curModel.cost, _user_id: u.id });
      } catch { /* silent */ }
      full = '❌ No se pudo conectar con el motor de IA. Verifica tu conexión.';
      setStreamText(full);
    }

    // Auto-open canvas if code detected
    const blocks = extractCode(full);
    const first = blocks.find(b => previewable(b.lang));
    if (first && !canvas) setCanvas({ code: first.code, lang: first.lang });

    const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: full, createdAt: Date.now() };
    setConvs(p => p.map(c => c.id === cId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: Date.now() } : c));
    setStreamText('');
    setStreaming(false);
  }, [input, streaming, user, activeId, activeConv, model, personality, curModel, curPers, canvas]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickPrompts: Record<string, string[]> = {
    code:       ['Landing page hero en HTML', 'Botón animado con Tailwind', 'Navbar responsive', 'Formulario con validación'],
    marketing:  ['Estrategia Meta Ads', 'Copy de lanzamiento de producto', 'Plan de contenidos 30 días', 'Campaña email'],
    seo:        ['Auditoría SEO completa', 'Keyword research para mi nicho', 'Estrategia de linkbuilding', 'SEO técnico'],
    copywriter: ['Headline viral para mi app', 'Fórmula AIDA para producto', 'Email de bienvenida', 'Copy para Instagram'],
    director:   ['Concepto de campaña de marca', 'Brief creativo completo', 'Estrategia narrativa', 'Naming para campaña'],
    assistant:  ['Explícame cómo funciona esto', 'Dame ideas creativas', 'Resume este concepto', 'Analiza esta estrategia'],
  };

  const msgs   = activeConv?.messages ?? [];
  const isEmpty = msgs.length === 0 && !streaming;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={embedded
      ? "flex flex-col h-full bg-[#1e2028]"
      : "fixed top-16 left-0 right-0 bottom-0 z-[9000] flex bg-[#191a1f]"
    }>

      {/* ── Sidebar — only in fullscreen page mode ───────────────────────────── */}
      {!embedded && <aside className={cn(
        'flex-col bg-[#191a1f] border-r border-white/[0.06] transition-all duration-200 overflow-hidden shrink-0',
        sidebarOpen ? 'flex w-[260px]' : 'hidden',
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.06] shrink-0">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25">Conversaciones</span>
          <button onClick={newConv}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all" title="Nueva conversación">
            <SquarePen className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 gap-2">
              <MessageSquare className="h-5 w-5 text-white/10" />
              <p className="text-[11px] text-white/20">Sin conversaciones</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => { setActiveId(conv.id); setCanvas(null); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left group transition-all',
                    activeId === conv.id
                      ? 'bg-white/[0.07] text-white'
                      : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70',
                  )}>
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="flex-1 text-[13px] truncate">{conv.title}</span>
                  <button onClick={e => delConv(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-500/20 hover:text-rose-400 transition-all shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Credits + profile */}
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] space-y-1.5 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03]">
            <Zap className="h-3.5 w-3.5 text-[#8AB4F8] shrink-0" />
            <span className="text-[12px] text-white/50">
              <span className="font-bold text-white/70">{(profile?.credits_balance ?? 0).toLocaleString()}</span> créditos
            </span>
          </div>
          {!isPro && (
            <button onClick={() => navigate('/pricing')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#8AB4F8]/10 to-transparent border border-[#8AB4F8]/15 hover:border-[#8AB4F8]/30 transition-all group">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-[#8AB4F8]" />
                <span className="text-[12px] text-white/50 group-hover:text-white/80">Upgrade a Pro</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#8AB4F8]/50" />
            </button>
          )}
          <button onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all group">
            <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                : <User className="h-3 w-3 text-white/40" />}
            </div>
            <span className="text-[12px] text-white/40 group-hover:text-white/70 truncate">
              {profile?.display_name?.split(' ')[0] || 'Perfil'}
            </span>
          </button>
        </div>
      </aside>}

      {/* ── Chat + Canvas ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-w-0">

        {/* ── Chat column ───────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 h-12 border-b border-white/[0.06] shrink-0">
            {/* Sidebar toggle — only in page mode */}
            {!embedded && (
              <button onClick={() => setSidebarOpen(v => !v)}
                className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/[0.06] transition-all">
                <ArrowLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
              </button>
            )}

            {/* Model picker */}
            <div className="relative">
              <button onClick={() => { setModelOpen(v => !v); setPersOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all text-[12px] font-medium text-white/60 hover:text-white">
                <span className="w-2 h-2 rounded-full" style={{ background: curModel.color }} />
                {curModel.name}
                <ChevronDown className="h-3 w-3 text-white/25" />
              </button>
              {modelOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#111115] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1">
                    {CHAT_MODELS.map(m => (
                      <button key={m.id} onClick={() => { setModel(m.id); setModelOpen(false); }}
                        className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.05] transition-all', model === m.id && 'bg-white/[0.07]')}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-white/80">{m.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{m.badge} · {m.cost} cr/msg</p>
                        </div>
                        {model === m.id && <Check className="h-3.5 w-3.5 text-[#8AB4F8] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Personality picker */}
            <div className="relative">
              <button onClick={() => { setPersOpen(v => !v); setModelOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all text-[12px] font-medium text-white/60 hover:text-white">
                <curPers.icon className={cn('h-3.5 w-3.5 shrink-0', curPers.color)} />
                {curPers.name}
                <ChevronDown className="h-3 w-3 text-white/25" />
              </button>
              {persOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#111115] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1">
                    {PERSONALITIES.map(p => (
                      <button key={p.id} onClick={() => { setPersonality(p.id); setPersOpen(false); }}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.05] transition-all', personality === p.id && 'bg-white/[0.07]')}>
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', p.bg)}>
                          <p.icon className={cn('h-3.5 w-3.5', p.color)} />
                        </div>
                        <span className="text-[13px] font-medium text-white/75 flex-1">{p.name}</span>
                        {personality === p.id && <Check className="h-3 w-3 text-[#8AB4F8]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* New chat */}
            <button onClick={newConv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] text-[12px] font-medium text-white/50 hover:text-white transition-all">
              <Plus className="h-3.5 w-3.5" /> Nuevo
            </button>

            {/* Close: embedded → close panel; page → go to dashboard */}
            <button
              onClick={() => embedded ? onClose?.() : navigate('/dashboard')}
              className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/[0.06] transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {isEmpty ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center min-h-full px-8 py-16 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 blur-[60px] rounded-full opacity-40"
                    style={{ background: curModel.color }} />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <curPers.icon className={cn('h-6 w-6', curPers.color)} />
                  </div>
                </div>
                <h1 className="text-[22px] font-bold text-white tracking-tight mb-2">
                  {personality === 'assistant'
                    ? <>Hola, soy <span style={{ color: curModel.color }}>Antigravity</span></>
                    : curPers.name}
                </h1>
                <p className="text-[14px] text-white/35 max-w-sm leading-relaxed mb-10">
                  {personality === 'code'       ? 'Cuéntame qué quieres construir. Generaré el código con preview en vivo.' :
                   personality === 'marketing'  ? 'Pregúntame sobre campañas, ads, copywriting o estrategia digital.' :
                   personality === 'seo'        ? 'Ayudo con keyword research, auditorías SEO y estrategia de contenido.' :
                   personality === 'copywriter' ? 'Creo copy persuasivo con AIDA, PAS y más. ¿Qué quieres vender?' :
                   personality === 'director'   ? 'Pensemos en grandes conceptos. ¿Qué historia quieres contar?' :
                   '¿En qué puedo ayudarte hoy? Código, marketing, estrategia, diseño…'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {(quickPrompts[personality] ?? quickPrompts.assistant).map(q => (
                    <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="px-4 py-2 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[13px] text-white/45 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.11] transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Message thread ── */
              <div className="max-w-[720px] mx-auto px-6 py-8 space-y-1">
                {msgs.map(msg => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end py-2">
                        <div className="max-w-[75%] bg-white/[0.07] border border-white/[0.07] text-white/90 rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }
                  const blocks = extractCode(msg.content);
                  const text   = stripCode(msg.content);
                  return (
                    <div key={msg.id} className="py-4">
                      {/* AI avatar + name */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.07] flex items-center justify-center shrink-0"
                          style={{ boxShadow: `0 0 12px ${curModel.color}30` }}>
                          <Sparkles className="h-3 w-3" style={{ color: curModel.color }} />
                        </div>
                        <span className="text-[12px] font-semibold text-white/40">{curPers.name}</span>
                      </div>
                      {/* Text */}
                      {text && (
                        <div className="text-[14px] text-white/75 leading-[1.75] pl-[34px]"
                          dangerouslySetInnerHTML={{ __html: md(text) }} />
                      )}
                      {/* Code blocks */}
                      {blocks.length > 0 && (
                        <div className="pl-[34px]">
                          {blocks.map((b, i) => (
                            <CodeBlock key={i} lang={b.lang} code={b.code} onCanvas={openCanvas} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Streaming — text arriving */}
                {streaming && streamText && (
                  <div className="py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.07] flex items-center justify-center shrink-0">
                        <Sparkles className="h-3 w-3 animate-pulse" style={{ color: curModel.color }} />
                      </div>
                      <span className="text-[12px] font-semibold text-white/40">{curPers.name}</span>
                    </div>
                    <div className="pl-[34px] text-[14px] text-white/75 leading-[1.75] whitespace-pre-wrap">
                      {streamText}
                      <span className="inline-block w-[2px] h-[18px] animate-pulse ml-0.5 rounded-sm align-middle"
                        style={{ background: curModel.color + '80' }} />
                    </div>
                  </div>
                )}

                {/* Streaming — thinking (waiting for first token) */}
                {streaming && !streamText && (
                  <div className="py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.07] flex items-center justify-center shrink-0">
                        <Loader2 className="h-3 w-3 animate-spin" style={{ color: curModel.color }} />
                      </div>
                      <span className="text-[12px] font-semibold text-white/40">{curModel.name}</span>
                      <span className="text-[11px] text-white/20">está procesando</span>
                    </div>
                    <div className="pl-[34px]">
                      <Thinking color={curModel.color} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Input ───────────────────────────────────────────────────────── */}
          <div className="px-4 pb-5 pt-3 shrink-0 border-t border-white/[0.05]">
            <div className="max-w-[720px] mx-auto">
              <div className="relative flex items-end gap-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 focus-within:border-white/[0.13] focus-within:bg-white/[0.05] transition-all">
                {/* Paperclip */}
                <button className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors p-0.5 mb-0.5">
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); resize(e.target); }}
                  onKeyDown={handleKey}
                  placeholder={`Mensaje a ${curPers.name}…`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[14px] text-white/90 placeholder:text-white/20 focus:outline-none leading-relaxed"
                  style={{ minHeight: '22px', maxHeight: '140px', overflowY: 'auto' }}
                />
                {/* Send button */}
                <button onClick={sendMessage} disabled={!input.trim() || streaming}
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                    input.trim() && !streaming
                      ? 'bg-white text-black hover:bg-white/90 active:scale-95 shadow-md'
                      : 'bg-white/[0.06] text-white/20 cursor-not-allowed',
                  )}>
                  {streaming
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-center text-[10px] text-white/12 mt-2 tracking-widest">
                Enter · enviar &nbsp;·&nbsp; Shift+Enter · nueva línea
              </p>
            </div>
          </div>
        </div>

        {/* ── Canvas panel — only in fullscreen page mode ─────────────────── */}
        {!embedded && canvas && (
          <CanvasPanel code={canvas.code} lang={canvas.lang} onClose={() => setCanvas(null)} />
        )}
      </div>
    </div>
  );
};
