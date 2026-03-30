import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Share2, Trash2, Instagram, Facebook, Twitter, CheckCircle2, Clock, ChevronDown, ChevronUp, Users, MousePointer2, Zap, Megaphone, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface CampaignNodeData {
  title?: string;
  model?: string;
  status?: 'pending' | 'processing' | 'ready' | 'error';
  platforms?: Record<string, 'pending' | 'ready' | 'error'>;
  platformCopy?: Record<string, string>;
  generatingCopy?: Record<string, boolean>;
}

const CampaignManagerNode = ({ id, data }: { id: string, data: CampaignNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const platforms = data.platforms || {
    instagram: 'pending',
    facebook: 'pending',
    twitter: 'pending'
  };

  const update = useCallback((patch: Partial<CampaignNodeData>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [id, setNodes]);

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Gestor de campaña eliminado");
    }
  };

  const generateCopyForPlatform = async (platform: string) => {
    update({ generatingCopy: { ...(data.generatingCopy || {}), [platform]: true } });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const prompt = `Genera un caption optimizado para ${platform} sobre: ${data.title || 'campaña de marketing'}. Máx 150 caracteres. Incluye emojis y hashtags relevantes.`;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: data.model || 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
            max_tokens: 200,
          },
        }),
      });

      if (!res.ok) { toast.error(`Error generando copy para ${platform}`); return; }

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
            if (typeof delta === 'string') accumulated += delta;
          } catch { /* skip */ }
        }
      }

      update({
        platformCopy: { ...(data.platformCopy || {}), [platform]: accumulated },
        generatingCopy: { ...(data.generatingCopy || {}), [platform]: false },
      });
    } catch {
      update({ generatingCopy: { ...(data.generatingCopy || {}), [platform]: false } });
      toast.error(`Error generando copy para ${platform}`);
    }
  };

  const handleCopyToClipboard = (platform: string) => {
    const text = (data.platformCopy || {})[platform];
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
    toast.success('Copy copiado');
  };

  const handleDeploy = async () => {
    (data as any).onExecute?.();
    // Generate copy for all platforms
    for (const platform of Object.keys(platforms)) {
      generateCopyForPlatform(platform);
    }
  };

  return (
    <div className={`group relative rounded-2xl border border-white/5 bg-[#0a0a0b] backdrop-blur-xl w-[270px] shadow-2xl transition-all duration-300 hover:border-white/20
      ${data.status === 'processing' ? 'border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)] animate-pulse' : ''}
    `}>
      {/* Nexus V3 Industrial Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded-lg bg-white/5 border border-white/10">
              <Megaphone className="w-3.5 h-3.5 text-white/50 shrink-0" />
            </div>
            <h3 className="text-[10px] font-bold text-white/90 tracking-tight truncate uppercase">
               {data.title || "CAMPAIGN_ENGINE_V3"}
            </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/5 text-white/30 rounded-lg transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1.5 hover:bg-destructive/5 text-destructive/30 hover:text-destructive rounded-xl transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 bg-white/[0.01]">
          <div className="flex items-center justify-between">
             <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Strategy Core</span>
              <button
                onClick={handleDeploy}
                disabled={data.status === 'processing'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-black transition-all shadow-xl disabled:opacity-50 active:scale-95 group/exec"
              >
                <Zap className={`w-3 h-3 ${data.status === 'processing' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform font-bold'}`} />
                <span className="text-[8px] font-bold lowercase tracking-widest">Deploy</span>
              </button>
          </div>

          {/* Platform copy display */}
          {Object.keys(platforms).length > 0 && (
            <div className="space-y-2">
              {Object.keys(platforms).map(platform => {
                const isGen = (data.generatingCopy || {})[platform];
                const copy = (data.platformCopy || {})[platform];
                return (
                  <div key={platform} className="rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{platform}</span>
                      {isGen && <Loader2 className="w-2.5 h-2.5 text-white/30 animate-spin" />}
                      {copy && !isGen && (
                        <button onClick={() => handleCopyToClipboard(platform)} className="p-0.5 rounded text-white/20 hover:text-white transition-all">
                          {copiedPlatform === platform ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      )}
                    </div>
                    {isGen && <p className="text-[8px] text-white/20 italic">Generando copy…</p>}
                    {copy && !isGen && (
                      <p className="text-[9px] text-white/50 leading-relaxed line-clamp-2">{copy}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-3">
               <div className="space-y-1.5">
                   <div className="flex justify-between px-1">
                      <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Performance</span>
                      <span className="text-[8px] font-bold text-white">84%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div className={`h-full bg-white transition-all duration-1000 ${data.status === 'processing' ? 'animate-shimmer w-full' : 'w-[84%]'}`} />
                   </div>
               </div>

                <div className="grid grid-cols-2 gap-2">
                   {[
                     { label: 'reach', val: '12.4k', icon: Users },
                     { label: 'clicks', val: '842', icon: MousePointer2 }
                   ].map((stat) => (
                      <div key={stat.label} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex flex-col gap-1 hover:border-white/20 transition-all shadow-2xl">
                         <div className="flex items-center gap-2">
                            <stat.icon className="w-3 h-3 text-white/20" />
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{stat.label}</span>
                         </div>
                         <span className="text-[10px] font-bold text-white">{stat.val}</span>
                      </div>
                   ))}
                </div>
            </div>

            {/* Industrial Fallback Selector */}
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] px-1 text-center block">Strategy Engine</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'deepseek-chat', name: 'strategy_v3' },
                  { id: 'gemini-3.1-pro-low', name: 'gemini_pro_v8' },
                  { id: 'claude-3.5-sonnet', name: 'claude_lead' },
                  { id: 'gpt-oss-120b', name: 'llama_oss' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={async () => {
                      setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, model: m.id } } : n));
                      await supabase.from('canvas_nodes').update({ data_payload: { ...data, model: m.id } as any }).eq('id', id);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[8px] font-bold lowercase tracking-wider transition-all ${
                      (data.model || 'deepseek-chat') === m.id 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    <Handle type="target" position={Position.Left} className="!w-2 !h-2 !-left-1 !bg-white/40 !border-2 !border-[#050506]" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#050506]" />
    </div>
  );
};

export default memo(CampaignManagerNode);
