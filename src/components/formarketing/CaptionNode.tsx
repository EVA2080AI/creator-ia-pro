import { memo, useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { MessageSquare, Copy, Check, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

const NETWORKS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', maxChars: 2200 },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', maxChars: 2200 },
  { id: 'twitter', label: 'X/Twitter', emoji: '🐦', maxChars: 280 },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', maxChars: 3000 },
  { id: 'facebook', label: 'Facebook', emoji: '👥', maxChars: 63206 },
];

const TONES = ['Viral 🔥', 'Profesional 💼', 'Casual 😊', 'Urgente ⚡', 'Inspirador ✨'];

interface CaptionNodeData {
  title?: string;
  topic?: string;
  network?: string;
  tone?: string;
  output?: string;
  status?: 'idle' | 'generating' | 'done' | 'error' | 'bypassed';
  collapsed?: boolean;
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

  const handleToggleBypass = () => {
    const newStatus = data.status === 'bypassed' ? 'idle' : 'bypassed';
    update({ status: newStatus });
    toast.success(newStatus === 'bypassed' ? 'Nodo desactivado (bypass)' : 'Nodo reactivado');
  };

  const handleToggleCollapsed = () => {
    update({ collapsed: !data.collapsed });
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

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
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

  const status: 'idle' | 'generating' | 'done' | 'error' | 'running' = data.status || 'idle';

  return (
    <BaseNode
      nodeId={id}
      type="captionNode"
      title={data.title || 'Caption IA'}
      status={status}
      onDelete={deleteNode}
      onExecute={handleGenerate}
      minWidth="300px"
      outputData={data.output}
      outputType="text"
      defaultCollapsed={data.collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      onToggleBypass={handleToggleBypass}
    >
      <div className="space-y-3">
        {/* Network selector */}
        <div className="relative">
          <button
            onClick={() => setNetworkOpen(!networkOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-[11px] text-zinc-700 hover:border-amber-300 transition-all"
          >
            <span className="font-medium">{currentNetwork.emoji} {currentNetwork.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${networkOpen ? 'rotate-180' : ''}`} />
          </button>
          {networkOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 overflow-hidden z-50 bg-white shadow-lg">
              {NETWORKS.map(n => (
                <button key={n.id} onClick={() => { update({ network: n.id }); setNetworkOpen(false); }}
                  className="w-full px-3 py-2.5 text-left text-[11px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center justify-between">
                  <span>{n.emoji} {n.label}</span>
                  <span className="text-zinc-400 text-[10px]">{n.maxChars < 1000 ? `${n.maxChars} chars` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tone selector */}
        <div className="flex flex-wrap gap-1">
          {TONES.map(t => (
            <button key={t} onClick={() => update({ tone: t })}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                data.tone === t || (!data.tone && t === TONES[0])
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}>
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
          className="w-full text-xs leading-relaxed text-zinc-900 bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none min-h-[56px] placeholder:text-zinc-400"
        />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-amber-600 shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
            : <><Sparkles className="w-4 h-4" />Generar Caption</>
          }
        </button>
      </div>
    </BaseNode>
  );
};

export default memo(CaptionNode);
