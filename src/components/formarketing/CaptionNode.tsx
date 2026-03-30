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
    <div className="group relative rounded-3xl overflow-hidden bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors w-[280px] shadow-2xl">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20">
            <MessageSquare className="w-4 h-4 text-[#34d399]" />
          </div>
          <h3 className="text-[11px] font-bold text-white/90 tracking-wide font-sans uppercase">
            {data.title || 'Caption IA'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 bg-black/20">
        {/* Network selector */}
        <div className="relative">
          <button
            onClick={() => setNetworkOpen(!networkOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/60 hover:border-[#34d399]/30 transition-all"
          >
            <span>{currentNetwork.emoji} {currentNetwork.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${networkOpen ? 'rotate-180' : ''}`} />
          </button>
          {networkOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden z-50" style={{ background: '#1e2028' }}>
              {NETWORKS.map(n => (
                <button key={n.id} onClick={() => { update({ network: n.id }); setNetworkOpen(false); }}
                  className="w-full px-3 py-2 text-left text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white transition-all flex items-center justify-between">
                  <span>{n.emoji} {n.label}</span>
                  <span className="text-white/20 text-[9px]">{n.maxChars < 1000 ? `${n.maxChars} chars` : ''}</span>
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
                ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }
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
          className="w-full text-xs leading-relaxed text-white/60 bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl focus:outline-none focus:border-[#34d399]/40 transition-all resize-none min-h-[48px] placeholder:text-white/15"
        />

        {/* Output */}
        {displayText && (
          <div className="relative rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 max-h-[100px] overflow-y-auto">
            <p className="text-[10px] leading-relaxed whitespace-pre-wrap pr-5"
              style={{ color: isGenerating ? '#34d399' : 'rgba(255,255,255,0.6)' }}>
              {displayText}{isGenerating ? <span className="animate-pulse">|</span> : null}
            </p>
            {!isGenerating && (
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded-lg text-white/20 hover:text-white transition-all hover:bg-white/10">
                {copied ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#34d399] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#34d399]/90 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando…</>
            : <><Sparkles className="w-3.5 h-3.5" />Generar Caption</>
          }
        </button>

        {/* Port labels */}
        <div className="flex items-center justify-between text-[9px] text-white/15 uppercase tracking-widest font-sans">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Contexto</span>
          <span className="flex items-center gap-1">Copy salida<span className="w-1.5 h-1.5 rounded-full bg-[#34d399] inline-block" /></span>
        </div>
      </div>

      <NodeConnectionDropdown nodeType="captionNode" nodeId={id} onAddConnected={data.onAddConnected ?? (() => {})} />

      <Handle type="target" position={Position.Left} id="text-in" className="!w-3 !h-3 !-left-1.5 !bg-yellow-400 !border-2 !border-[#191a1f] hover:scale-125 transition-transform" />
      <Handle type="source" position={Position.Right} id="text-out" className="!w-3 !h-3 !-right-1.5 !bg-[#34d399] !border-2 !border-[#191a1f] hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(CaptionNode);
