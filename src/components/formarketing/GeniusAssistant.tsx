import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot, X, Send, Sparkles, Plus, Maximize2, Minimize2,
  MessageSquare, Copy, Check, Code2, Eye, EyeOff, Trash2, ChevronDown,
  Zap, Megaphone, PenTool, Search, Palette, User, CreditCard,
  ArrowUpRight, Menu,
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
  { id: 'gemini-3-flash',      name: 'Gemini Flash',     badge: 'Rápido',     cost: 1, color: '#00C2FF', openrouter: 'google/gemini-2.0-flash-001' },
  { id: 'deepseek-chat',       name: 'DeepSeek V3',      badge: 'Código',     cost: 1, color: '#4ADE80', openrouter: 'deepseek/deepseek-chat-v3-0324' },
  { id: 'mistral-small',       name: 'Mistral Small',    badge: 'Privacidad', cost: 1, color: '#FF6B6B', openrouter: 'mistralai/mistral-small-3.1-24b-instruct' },
  { id: 'gemini-3.1-pro-low',  name: 'Gemini Pro',       badge: 'Análisis',   cost: 1, color: '#00E5A0', openrouter: 'google/gemini-2.5-pro-preview-03-25' },
  { id: 'mistral-large',       name: 'Mistral Large',    badge: 'EU',         cost: 2, color: '#FF9500', openrouter: 'mistralai/mistral-large' },
  { id: 'claude-3.5-sonnet',   name: 'Claude Sonnet',    badge: 'Creativo',   cost: 4, color: '#A855F7', openrouter: 'anthropic/claude-sonnet-4-5' },
  { id: 'claude-3-opus',       name: 'Claude Opus',      badge: 'Máximo',     cost: 5, color: '#F59E0B', openrouter: 'anthropic/claude-opus-4-5' },
  { id: 'gpt-oss-120b',        name: 'Llama 4 Maverick', badge: 'Open',       cost: 2, color: '#EC4899', openrouter: 'meta-llama/llama-4-maverick' },
];

// ─── Personalities ────────────────────────────────────────────────────────────
const PERSONALITIES = [
  {
    id: 'assistant', name: 'Asistente IA', icon: Bot,
    color: 'text-white/70', bg: 'bg-white/5',
    prompt: 'Eres un asistente de IA de alto rendimiento llamado Antigravity. Responde con precisión, claridad y valor. Usa markdown cuando sea útil.',
  },
  {
    id: 'marketing', name: 'Marketing Specialist', icon: Megaphone,
    color: 'text-rose-400', bg: 'bg-rose-400/10',
    prompt: 'Eres un Especialista en Marketing Digital Senior con 10+ años de experiencia. Dominas Meta Ads, Google Ads, SEO, email marketing, copywriting y estrategia de contenidos. Hablas en español.',
  },
  {
    id: 'copywriter', name: 'Copywriter Creativo', icon: PenTool,
    color: 'text-violet-400', bg: 'bg-violet-400/10',
    prompt: 'Eres un Copywriter creativo experto. Usas las fórmulas AIDA, PAS, FAB y Before-After-Bridge. Tu copy es persuasivo, emocional y orientado a conversión. Hablas en español.',
  },
  {
    id: 'code', name: 'Code Assistant', icon: Code2,
    color: 'text-sky-400', bg: 'bg-sky-400/10',
    prompt: 'Eres un desarrollador Full-Stack Senior. Generas código limpio, moderno y bien estructurado con TypeScript, React y Tailwind CSS. SIEMPRE envuelves código en bloques con el lenguaje especificado (```tsx, ```html, etc).',
  },
  {
    id: 'seo', name: 'SEO Strategist', icon: Search,
    color: 'text-emerald-400', bg: 'bg-emerald-400/10',
    prompt: 'Eres un Estratega SEO experto. Conoces el algoritmo de Google, E-E-A-T, keyword research, linkbuilding y SEO técnico. Hablas en español.',
  },
  {
    id: 'director', name: 'Director Creativo', icon: Palette,
    color: 'text-amber-400', bg: 'bg-amber-400/10',
    prompt: 'Eres un Director Creativo de agencia global. Combinas estrategia con creatividad para crear campañas memorables. Hablas en español.',
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aether_chat_v2';
function loadConversations(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 50)));
}

// ─── Markdown ─────────────────────────────────────────────────────────────────
function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-white mt-5 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-white/80">$1</em>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-sky-300">$1</code>')
    .replace(/^---+$/gm, '<hr class="border-white/10 my-4"/>')
    .replace(/^\s*[-*•] (.+)$/gm, '<li class="flex gap-2 my-0.5"><span class="text-white/30 shrink-0 mt-1">›</span><span>$1</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, m => `<ul class="my-2 space-y-0.5">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/^(?!<[hul]|<hr|<p)(.+)$/gm, line => line.trim() ? `<p>${line}</p>` : '');
}

function extractCodeBlocks(text: string): Array<{ lang: string; code: string }> {
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks: Array<{ lang: string; code: string }> = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ lang: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
}
function stripCodeBlocks(text: string) {
  return text.replace(/```(\w+)?\n?[\s\S]*?```/g, '').trim();
}

// ─── CodeBlock (module-level component — stable reference, no remount issues) ─
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const isPreviewable = ['html', 'jsx', 'tsx', 'javascript', 'js'].includes(lang);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewSrc = lang === 'html'
    ? `data:text/html;charset=utf-8,${encodeURIComponent(code)}`
    : `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"><\/script><style>body{background:#0f0f12;color:#fff;font-family:sans-serif;padding:1.5rem}</style></head><body><p style="color:#555;font-size:11px;margin-bottom:1rem">JSX preview — copia y pega en tu proyecto</p></body></html>`)}`;

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] my-4 bg-[#0c0c10]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
          </div>
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest ml-1">{lang}</span>
        </div>
        <div className="flex items-center gap-3">
          {isPreviewable && (
            <button onClick={() => setPreview(v => !v)} className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400/60 hover:text-sky-400 transition-colors uppercase tracking-wider">
              {preview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {preview ? 'Código' : 'Preview'}
            </button>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] font-bold text-white/25 hover:text-white transition-colors uppercase tracking-wider">
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="h-60 bg-[#0f0f12]">
          <iframe src={previewSrc} className="w-full h-full border-0" sandbox="allow-scripts" title="preview" />
        </div>
      ) : (
        <pre className="p-4 overflow-x-auto text-[12px] font-mono text-white/60 leading-relaxed max-h-72 overflow-y-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

// ─── MessageBubble (module-level — stable) ────────────────────────────────────
function MessageBubble({ msg, modelColor }: { msg: Message; modelColor: string }) {
  const codeBlocks = extractCodeBlocks(msg.content);
  const text = stripCodeBlocks(msg.content);

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[78%] bg-white/[0.07] border border-white/[0.08] text-white/90 rounded-2xl rounded-tr-md px-5 py-3.5 text-[13.5px] leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5"
        style={{ boxShadow: `0 0 10px ${modelColor}20` }}>
        <Sparkles className="h-3.5 w-3.5" style={{ color: modelColor }} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {text && (
          <div className="text-[13.5px] text-white/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }} />
        )}
        {codeBlocks.map((b, i) => <CodeBlock key={i} lang={b.lang} code={b.code} />)}
      </div>
    </div>
  );
}

// ─── Main GeniusAssistant ─────────────────────────────────────────────────────
export const GeniusAssistant = ({ onAction }: { onAction?: (action: string, data: unknown) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const [mode, setMode] = useState<ChatMode>('collapsed');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) ?? CHAT_MODELS[0];
  const currentPersonality = PERSONALITIES.find(p => p.id === selectedPersonality) ?? PERSONALITIES[0];
  const planTier = (profile?.subscription_tier ?? 'free').toUpperCase();
  const isPro = planTier !== 'FREE';
  const isOnChatPage = location.pathname === '/chat';

  // Listen for fullscreen open event (dispatched by /chat page and AppHeader)
  useEffect(() => {
    const handler = () => { setMode('fullscreen'); setSidebarOpen(true); };
    window.addEventListener('aether-chat-open-fullscreen', handler);
    return () => window.removeEventListener('aether-chat-open-fullscreen', handler);
  }, []);

  // Auto-scroll on new messages or streaming text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamingText]);

  // Persist conversations
  useEffect(() => { saveConversations(conversations); }, [conversations]);

  // Resize textarea
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize(e.target);
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────
  // When on /chat page, minimizing should navigate back to dashboard
  const closeChat = useCallback(() => {
    if (isOnChatPage) navigate('/dashboard');
    setMode('collapsed');
  }, [isOnChatPage, navigate]);

  const minimizeChat = useCallback(() => {
    if (isOnChatPage) navigate('/dashboard');
    setMode('panel');
  }, [isOnChatPage, navigate]);

  // ── Conversation helpers ───────────────────────────────────────────────────
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

  const deleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }, [activeConvId]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;
    if (!user) { toast.error('Inicia sesión para usar el chat'); return; }

    const userContent = input.trim();
    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    // Ensure active conversation
    let convId = activeConvId;
    let existingMessages: Message[] = [];
    if (!convId) {
      const conv: Conversation = {
        id: crypto.randomUUID(),
        title: userContent.slice(0, 45),
        model: selectedModel,
        personality: selectedPersonality,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      convId = conv.id;
    } else {
      existingMessages = activeConv?.messages ?? [];
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      createdAt: Date.now(),
    };

    // Add user message to UI
    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      messages: [...c.messages, userMsg],
      title: c.messages.length === 0 ? userContent.slice(0, 45) : c.title,
      updatedAt: Date.now(),
    } : c));

    setStreaming(true);
    setStreamingText('');

    // Deduct credits
    const cost = currentModel.cost;
    try {
      await (supabase.rpc as any)('spend_credits', {
        _amount: cost, _action: 'chat', _model: selectedModel, _node_id: null,
      });
    } catch (err: unknown) {
      setStreaming(false);
      toast.error(err instanceof Error ? err.message : 'Créditos insuficientes');
      return;
    }

    // Build context (use captured existingMessages to avoid stale closure)
    const contextMessages = [
      { role: 'system', content: currentPersonality.prompt },
      ...existingMessages.map(m => ({ role: m.role, content: m.content })),
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
          body: {
            model: currentModel.openrouter,
            messages: contextMessages,
            temperature: 0.85,
            max_tokens: 4096,
            stream: true,
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const json = JSON.parse(payload);
            const chunk = json.choices?.[0]?.delta?.content;
            if (chunk) { fullText += chunk; setStreamingText(ft => ft + chunk); }
          } catch { /* malformed SSE line */ }
        }
      }

      // Handle non-streaming response (some proxy configs)
      if (!fullText) {
        const json = await res.clone().json().catch(() => null);
        fullText = json?.choices?.[0]?.message?.content ?? '';
      }

    } catch (streamErr) {
      console.warn('[Chat] Stream falló, intentando fallback Gemini:', streamErr);
      // Refund on stream error
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)('refund_credits', { _amount: cost, _user_id: u.id });
      } catch { /* silent */ }
      // Fallback: Gemini via proxy (non-streaming)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res2 = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            provider: 'gemini',
            path: 'models/gemini-1.5-flash:generateContent',
            body: { contents: contextMessages.map(m => ({ parts: [{ text: m.content }] })) },
          }),
        });
        const d2 = await res2.json();
        fullText = d2.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (fullText) setStreamingText(fullText);
      } catch (fallbackErr) {
        console.error('[Chat] Fallback Gemini también falló:', fallbackErr);
        fullText = 'Error de conexión. Verifica tu red e intenta de nuevo.';
        setStreamingText(fullText);
      }
    }

    // Persist assistant message
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fullText || 'Sin respuesta. Intenta de nuevo.',
      createdAt: Date.now(),
    };
    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      messages: [...c.messages, assistantMsg],
      updatedAt: Date.now(),
    } : c));
    setStreamingText('');
    setStreaming(false);
  }, [input, streaming, user, activeConvId, activeConv, selectedModel, selectedPersonality, currentModel, currentPersonality]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Quick prompts per personality ──────────────────────────────────────────
  const quickPrompts: Record<string, string[]> = {
    code:       ['Botón animado con Tailwind', 'Landing page hero en HTML', 'Navbar responsive React', 'Formulario con validación'],
    marketing:  ['Estrategia Meta Ads e-commerce', 'Copy de lanzamiento', 'Plan de contenidos 30 días', 'Campaña email marketing'],
    seo:        ['Auditoría SEO básica', 'Keywords para mi nicho', 'Estructura de silos', 'Estrategia linkbuilding'],
    copywriter: ['Headline para mi app', 'Fórmula AIDA para producto', 'Email de bienvenida', 'Copy para Instagram'],
    director:   ['Concepto campaña de marca', 'Narrativa visual producto', 'Nombre para campaña', 'Brief creativo'],
    assistant:  ['Explícame cómo funciona', 'Dame ideas creativas', 'Resume este concepto', 'Analiza esta estrategia'],
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLAPSED BUTTON (bottom-right)
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === 'collapsed') {
    return (
      <div className="fixed bottom-6 right-6 z-[9000]">
        <button
          onClick={() => setMode('panel')}
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d0d12] border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-all hover:border-aether-purple/40"
        >
          <div className="absolute inset-0 rounded-2xl bg-aether-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="h-5 w-5 text-white/60 group-hover:text-aether-purple transition-colors" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-aether-purple border-2 border-[#050506] shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL MODE (floating 420×580, bottom-right)
  // ═══════════════════════════════════════════════════════════════════════════
  if (mode === 'panel') {
    const msgs = activeConv?.messages ?? [];
    const isEmpty = msgs.length === 0 && !streaming;

    return (
      <div className="fixed bottom-6 right-6 z-[9000] w-[420px] h-[580px] bg-[#09090c]/98 backdrop-blur-3xl border border-white/[0.08] rounded-[1.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"
              style={{ boxShadow: `0 0 14px ${currentModel.color}25` }}>
              <Sparkles className="h-4 w-4" style={{ color: currentModel.color }} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-white uppercase tracking-wide font-display">Aether Chat</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">{currentModel.name} · {currentPersonality.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setMode('fullscreen'); setSidebarOpen(true); }}
              className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/5 transition-all" title="Expandir">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={closeChat} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/5 transition-all">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center mb-4">
                <currentPersonality.icon className={cn("h-5 w-5", currentPersonality.color)} />
              </div>
              <p className="text-sm font-bold text-white/70 mb-1 font-display">{currentPersonality.name}</p>
              <p className="text-[11px] text-white/25 mb-5 max-w-[260px]">¿En qué puedo ayudarte hoy?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {(quickPrompts[selectedPersonality] ?? quickPrompts.assistant).slice(0, 3).map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {msgs.map(msg => <MessageBubble key={msg.id} msg={msg} modelColor={currentModel.color} />)}
              {streaming && streamingText && (
                <div className="flex gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" style={{ color: currentModel.color }} />
                  </div>
                  <div className="flex-1 pt-1 text-[13.5px] text-white/80 leading-relaxed whitespace-pre-wrap">
                    {streamingText}
                    <span className="inline-block w-1.5 h-4 animate-pulse rounded-sm ml-0.5 align-middle" style={{ background: currentModel.color + '80' }} />
                  </div>
                </div>
              )}
              {streaming && !streamingText && (
                <div className="flex gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ color: currentModel.color }} />
                  </div>
                  <div className="flex items-center gap-1.5 pt-3">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/[0.05] shrink-0">
          {/* Quick selectors */}
          <div className="flex gap-2 mb-2.5 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0">
              <button onClick={() => { setShowModels(v => !v); setShowPersonalities(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-[10px] font-bold text-white/50 whitespace-nowrap transition-all">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentModel.color }} />
                {currentModel.name} <ChevronDown className="h-2.5 w-2.5 text-white/20" />
              </button>
              {showModels && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl w-52">
                  {CHAT_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModels(false); }}
                      className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 transition-all", selectedModel === m.id && "bg-white/[0.07]")}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                      <div className="flex-1"><p className="text-[11px] font-bold text-white/80">{m.name}</p><p className="text-[9px] text-white/30">{m.badge} · {m.cost}cr</p></div>
                      {selectedModel === m.id && <Check className="h-3 w-3 text-aether-purple" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <button onClick={() => { setShowPersonalities(v => !v); setShowModels(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-[10px] font-bold text-white/50 whitespace-nowrap transition-all">
                <currentPersonality.icon className={cn("h-3 w-3", currentPersonality.color)} />
                {currentPersonality.name} <ChevronDown className="h-2.5 w-2.5 text-white/20" />
              </button>
              {showPersonalities && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl w-52">
                  {PERSONALITIES.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPersonality(p.id); setShowPersonalities(false); }}
                      className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 transition-all", selectedPersonality === p.id && "bg-white/[0.07]")}>
                      <p.icon className={cn("h-3.5 w-3.5 shrink-0", p.color)} />
                      <span className="text-[11px] font-bold text-white/80 flex-1">{p.name}</span>
                      {selectedPersonality === p.id && <Check className="h-3 w-3 text-aether-purple" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={newConversation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-[10px] font-bold text-white/30 whitespace-nowrap shrink-0 transition-all">
              <Plus className="h-3 w-3" /> Nuevo
            </button>
          </div>
          {/* Textarea */}
          <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 focus-within:border-aether-purple/25 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Mensaje para ${currentPersonality.name}...`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[13px] text-white/90 placeholder:text-white/20 focus:outline-none leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '130px', overflowY: 'auto' }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
              {streaming ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[9px] text-white/10 text-center mt-1.5 tracking-widest uppercase font-bold">
            Enter · enviar &nbsp;·&nbsp; Shift+Enter · nueva línea
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULLSCREEN MODE — starts at top-16 so AppHeader stays visible
  // ═══════════════════════════════════════════════════════════════════════════
  const msgs = activeConv?.messages ?? [];
  const isEmpty = msgs.length === 0 && !streaming;

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 z-[9000] bg-[#060609] flex flex-col animate-in fade-in duration-200">

      {/* Top bar */}
      <div className="flex items-center justify-between h-13 px-4 py-2 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: currentModel.color }} />
            <span className="text-[13px] font-bold text-white font-display">Aether Chat</span>
          </div>
        </div>

        {/* Center: model + personality selectors */}
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <div className="relative">
            <button onClick={() => { setShowModels(v => !v); setShowPersonalities(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.08] transition-all text-[11px] font-bold text-white/60">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: currentModel.color }} />
              {currentModel.name}
              <span className="text-[9px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded">{currentModel.badge}</span>
              <ChevronDown className="h-3 w-3 text-white/25" />
            </button>
            {showModels && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl w-64">
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-4 pt-3 pb-1">Motor de IA</p>
                <div className="p-2">
                  {CHAT_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModels(false); }}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-all", selectedModel === m.id && "bg-white/[0.08]")}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                      <div className="flex-1"><p className="text-[12px] font-bold text-white/85">{m.name}</p><p className="text-[10px] text-white/30">{m.badge} · {m.cost} cr/msg</p></div>
                      {selectedModel === m.id && <Check className="h-3.5 w-3.5 text-aether-purple shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Personality selector */}
          <div className="relative">
            <button onClick={() => { setShowPersonalities(v => !v); setShowModels(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.08] transition-all text-[11px] font-bold text-white/60">
              <currentPersonality.icon className={cn("h-3.5 w-3.5 shrink-0", currentPersonality.color)} />
              {currentPersonality.name}
              <ChevronDown className="h-3 w-3 text-white/25" />
            </button>
            {showPersonalities && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl w-60">
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-4 pt-3 pb-1">Personalidad</p>
                <div className="p-2">
                  {PERSONALITIES.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPersonality(p.id); setShowPersonalities(false); }}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-all", selectedPersonality === p.id && "bg-white/[0.08]")}>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", p.bg)}>
                        <p.icon className={cn("h-3.5 w-3.5", p.color)} />
                      </div>
                      <span className="text-[12px] font-bold text-white/80 flex-1">{p.name}</span>
                      {selectedPersonality === p.id && <Check className="h-3.5 w-3.5 text-aether-purple shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={newConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.08] transition-all text-[11px] font-bold text-white/50">
            <Plus className="h-3.5 w-3.5" /> Nuevo
          </button>
          <button onClick={minimizeChat}
            className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/5 transition-all" title="Minimizar">
            <Minimize2 className="h-4 w-4" />
          </button>
          <button onClick={closeChat} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/5 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        {sidebarOpen && (
          <div className="w-64 shrink-0 border-r border-white/[0.05] flex flex-col bg-[#060609]">
            <div className="p-3 border-b border-white/[0.05]">
              <button onClick={newConversation}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.08] transition-all text-[12px] font-bold text-white/60 hover:text-white">
                <Plus className="h-4 w-4" /> Nueva conversación
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageSquare className="h-6 w-6 text-white/10 mb-2" />
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Sin conversaciones</p>
                </div>
              ) : (
                <>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-3 py-2">Recientes</p>
                  {conversations.map(conv => (
                    <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left group transition-all",
                        activeConvId === conv.id
                          ? "bg-white/[0.08] border border-white/[0.08] text-white"
                          : "text-white/45 hover:bg-white/[0.04] hover:text-white/70"
                      )}>
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/20" />
                      <span className="flex-1 text-[12px] font-medium truncate">{conv.title}</span>
                      <button onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 text-white/20 transition-all shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Subscription info */}
            <div className="p-3 border-t border-white/[0.05] space-y-2">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Zap className="h-4 w-4 text-aether-purple shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white/60">
                    {(profile?.credits_balance ?? 0).toLocaleString()} créditos
                  </p>
                  <p className="text-[9px] text-white/25">{currentModel.cost} cr por mensaje</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <User className="h-3.5 w-3.5 text-white/25 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Plan <span className={isPro ? 'text-aether-purple' : 'text-white/40'}>{planTier}</span>
                  </p>
                  <p className="text-[9px] text-white/20">{isPro ? 'Acceso completo' : 'Modelos básicos'}</p>
                </div>
              </div>
              {!isPro && (
                <button onClick={() => navigate('/pricing')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-aether-purple/15 to-aether-blue/10 border border-aether-purple/20 hover:border-aether-purple/40 transition-all group">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-aether-purple" />
                    <span className="text-[11px] font-bold text-white/65 group-hover:text-white transition-colors">Upgrade a Pro</span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-aether-purple/60" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* Messages — inline, NOT a sub-component */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
                  <div className="relative mb-7">
                    <div className="absolute inset-0 blur-3xl rounded-full"
                      style={{ background: `radial-gradient(circle, ${currentModel.color}25, transparent 70%)` }} />
                    <div className="relative w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                      <currentPersonality.icon className={cn("h-7 w-7", currentPersonality.color)} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 font-display tracking-tight">
                    {selectedPersonality === 'assistant'
                      ? <span>Hola, soy <span style={{ color: currentModel.color }}>Antigravity</span></span>
                      : currentPersonality.name}
                  </h2>
                  <p className="text-[13px] text-white/30 max-w-md leading-relaxed mb-8">
                    {selectedPersonality === 'code'      ? 'Dime qué quieres construir y te generaré el código con preview en vivo.' :
                     selectedPersonality === 'marketing' ? 'Pregúntame sobre campañas, ads, copywriting o estrategia digital.' :
                     selectedPersonality === 'seo'       ? 'Ayudo con keyword research, auditorías SEO y estrategia de contenido.' :
                     selectedPersonality === 'copywriter'? 'Creo copy persuasivo con AIDA, PAS y más. ¿Qué quieres vender?' :
                     selectedPersonality === 'director'  ? 'Pensemos en grandes conceptos. ¿Qué historia quieres contar?' :
                     'Puedo ayudarte con código, marketing, estrategia, diseño y mucho más.'}
                  </p>
                  <div className="flex flex-wrap gap-2.5 justify-center max-w-lg">
                    {(quickPrompts[selectedPersonality] ?? quickPrompts.assistant).map(q => (
                      <button key={q} onClick={() => setInput(q)}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-[12px] font-medium text-white/45 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {msgs.map(msg => <MessageBubble key={msg.id} msg={msg} modelColor={currentModel.color} />)}
                  {streaming && streamingText && (
                    <div className="flex gap-4 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 animate-pulse" style={{ color: currentModel.color }} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1 text-[13.5px] text-white/80 leading-relaxed whitespace-pre-wrap">
                        {streamingText}
                        <span className="inline-block w-2 h-4 animate-pulse rounded-sm ml-0.5 align-middle"
                          style={{ background: currentModel.color + '70' }} />
                      </div>
                    </div>
                  )}
                  {streaming && !streamingText && (
                    <div className="flex gap-4 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 animate-spin" style={{ color: currentModel.color }} />
                      </div>
                      <div className="flex items-center gap-1.5 pt-3">
                        {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Input — inline, NOT a sub-component */}
          <div className="px-4 pb-5 pt-2 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 focus-within:border-aether-purple/25 focus-within:bg-white/[0.05] transition-all shadow-lg">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Pregúntale a ${currentPersonality.name}...`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[14px] text-white/90 placeholder:text-white/25 focus:outline-none leading-relaxed"
                  style={{ minHeight: '22px', maxHeight: '130px', overflowY: 'auto' }}
                />
                <button onClick={sendMessage} disabled={!input.trim() || streaming}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-md">
                  {streaming ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[9px] text-white/12 text-center mt-2.5 tracking-widest uppercase font-bold">
                Aether puede cometer errores · Verifica información importante
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
