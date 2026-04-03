import { memo, useCallback, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageSquare, Trash2, Sparkles, Copy, Check, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const NETWORKS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', maxChars: 2200 },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵', maxChars: 2200 },
  { id: 'twitter',   label: 'X/Twitter', emoji: '🐦', maxChars: 280  },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼', maxChars: 3000 },
  { id: 'facebook',  label: 'Facebook',  emoji: '👥', maxChars: 63206},
];

const TONES = ['Viral 🔥', 'Profesional 💼', 'Casual 😊', 'Urgente ⚡', 'Inspirador ✨'];

interface CaptionNodeData {
  title?: string;
  topic?: string;
  network?: string;
  tone?: string;
  output?: string;
  status?: 'idle' | 'generating' | 'done' | 'error';
  onAddConnected?: (sourceId: string, targetType: string) => void;
}

const CaptionNode = ({ id, data }: { id: string; data: CaptionNodeData }) => {
  const { setNodes } = useReactFlow();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [networkOpen, setNetworkOpen] = useState(false);

  const update = useCallback((patch: Partial<CaptionNodeData>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  const deleteNode = async () => {
    await supabase.from('canvas_nodes').delete().eq('id', id);
    setNodes(nds => nds.filter(n => n.id !== id));
    toast.success('Nodo eliminado');
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    const network = NETWORKS.find(n => n.id === (data.network || 'instagram')) || NETWORKS[0];
    const tone = data.tone || TONES[0];
    const topic = data.topic || data.title || 'marketing digital';

    setIsGenerating(true);
    setStreamedText('');
    update({ status: 'generating' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const prompt = `Genera un caption optimizado para ${network.label} sobre: "${topic}".
Tono: ${tone}.
Máximo ${network.maxChars} caracteres.
Incluye emojis relevantes, hashtags populares al final, y un call-to-action claro.
Devuelve SOLO el caption, sin explicaciones.`;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
            max_tokens: 400,
          },
        }),
      });

      if (!res.ok) { toast.error('Error generando caption'); return; }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
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
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') {
              accumulated += delta;
              setStreamedText(accumulated);
            }
          } catch { /* skip */ }
        }
      }

      update({ output: accumulated, status: 'done' });
    } catch {
      update({ status: 'error' });
      toast.error('Error generando caption');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const text = streamedText || data.output || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Caption copiado');
  };

  const currentNetwork = NETWORKS.find(n => n.id === (data.network || 'instagram')) || NETWORKS[0];
  const displayText = streamedText || data.output || '';

  return (
    <div className="group relative rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-xl border border-zinc-200/60 hover:border-zinc-300 hover:bg-white transition-all w-[280px] shadow-sm hover:shadow-xl duration-500">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-5 border-b border-zinc-100/80 bg-zinc-50/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-[10px] font-bold text-zinc-900 tracking-[0.15em] font-sans uppercase">
            {data.title || 'Caption IA'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 bg-white">
        {/* Network selector */}
        <div className="relative">
          <button
            onClick={() => setNetworkOpen(!networkOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-[10px] text-zinc-600 hover:border-emerald-300 transition-all font-medium"
          >
            <span>{currentNetwork.emoji} {currentNetwork.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${networkOpen ? 'rotate-180' : ''}`} />
          </button>
          {networkOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 overflow-hidden z-50 bg-white shadow-lg">
              {NETWORKS.map(n => (
                <button key={n.id} onClick={() => { update({ network: n.id }); setNetworkOpen(false); }}
                  className="w-full px-3 py-2 text-left text-[10px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center justify-between">
                  <span>{n.emoji} {n.label}</span>
                  <span className="text-zinc-400 text-[9px]">{n.maxChars < 1000 ? `${n.maxChars} chars` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tone selector */}
        <div className="flex flex-wrap gap-1">
          {TONES.map(t => (
            <button key={t} onClick={() => update({ tone: t })}
              className="px-2 py-1 rounded-lg text-[9px] font-semibold transition-all"
              style={data.tone === t || (!data.tone && t === TONES[0])
                ? { background: 'var(--emerald-50, #ecfdf5)', border: '1px solid var(--emerald-200, #a7f3d0)', color: 'var(--emerald-600, #059669)' }
                : { background: '#ffffff', border: '1px solid #e4e4e7', color: '#71717a' }
              }>
              {t}
            </button>
          ))}
        </div>

        {/* Topic input */}
        <textarea
          value={data.topic || ''}
          onChange={e => update({ topic: e.target.value })}
          onKeyDown={e => e.stopPropagation()}
          placeholder="Tema del caption (ej: nuevo producto, oferta, lifestyle…)"
          className="w-full text-xs leading-relaxed text-zinc-900 bg-white border shadow-sm border-zinc-200 p-3 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none min-h-[48px] placeholder:text-zinc-400"
        />

        {/* Output */}
        {displayText && (
          <div className="relative rounded-xl bg-zinc-50 border border-zinc-200 shadow-sm p-3 max-h-[100px] overflow-y-auto">
            <p className="text-[10px] leading-relaxed whitespace-pre-wrap pr-5"
               style={{ color: isGenerating ? 'var(--emerald-600, #059669)' : '#52525b' }}>
              {displayText}{isGenerating ? <span className="animate-pulse">|</span> : null}
            </p>
            {!isGenerating && (
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 transition-all hover:bg-white border border-transparent hover:border-zinc-200 shadow-sm">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 shadow-md text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando…</>
            : <><Sparkles className="w-3.5 h-3.5" />Generar Caption</>
          }
        </button>

        {/* Port labels */}
        <div className="flex items-center justify-between text-[9px] text-zinc-400 uppercase tracking-widest font-sans">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm" />Contexto</span>
          <span className="flex items-center gap-1">Copy salida<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-sm" /></span>
        </div>
      </div>

      <NodeConnectionDropdown nodeType="captionNode" nodeId={id} onAddConnected={data.onAddConnected ?? (() => {})} />

      <Handle type="target" position={Position.Left} id="text-in" className="!w-4 !h-4 !-left-2 !bg-amber-400 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
      <Handle type="source" position={Position.Right} id="text-out" className="!w-4 !h-4 !-right-2 !bg-emerald-500 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
    </div>
  );
};

export default memo(CaptionNode);
