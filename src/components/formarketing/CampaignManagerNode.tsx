import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Share2, Trash2, Instagram, Facebook, Twitter, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignNodeData {
  title?: string;
  platforms?: Record<string, 'pending' | 'ready' | 'error'>;
}

const CampaignManagerNode = ({ id, data }: { id: string, data: CampaignNodeData }) => {
  const { setNodes } = useReactFlow();
  const platforms = data.platforms || {
    instagram: 'pending',
    facebook: 'pending',
    twitter: 'pending'
  };

  const togglePlatform = async (p: string) => {
    const current = platforms[p];
    const next = current === 'pending' ? 'ready' : 'pending';
    const updatedPlatforms = { ...platforms, [p]: next };
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, platforms: updatedPlatforms }
          };
        }
        return node;
      })
    );

    // Sync to DB
    await supabase
      .from('canvas_nodes')
      .update({ data_payload: { ...data, platforms: updatedPlatforms } as any })
      .eq('id', id);
  };

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Gestor de campaña eliminado");
    }
  };

  return (
    <div className="group relative bg-[#0f0f0f]/90 border border-white/10 rounded-[2.5rem] p-0 w-80 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in zoom-in duration-500 isolation-auto">
      {/* V5.3 Industrial Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2.5 rounded-2xl shadow-inner group-hover:rotate-6 transition-transform">
               <Share2 className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[11px] font-black uppercase tracking-tighter text-foreground">
                {data.title || "CAMPAIGN MANAGER"}
              </h3>
              <span className="text-[9px] font-black text-orange-500/50 uppercase tracking-[0.2em] mt-0.5">V5.3 Industrial Maestro</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
           <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest px-1">Distribución Multi-Plataforma</span>
        
        <div className="space-y-3">
           {[
             { id: 'instagram', icon: Instagram, label: 'Instagram Ads/Post' },
             { id: 'facebook', icon: Facebook, label: 'Facebook Campaign' },
             { id: 'twitter', icon: Twitter, label: 'X (Twitter) Feed' }
           ].map((plt) => (
             <button 
               key={plt.id}
               onClick={() => togglePlatform(plt.id)}
               className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${platforms[plt.id] === 'ready' ? 'bg-orange-500/10 border-orange-500/20 text-foreground' : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'}`}
             >
               <div className="flex items-center gap-3">
                  <plt.icon className={`w-4 h-4 ${platforms[plt.id] === 'ready' ? 'text-orange-400' : ''}`} />
                  <span className="text-[11px] font-bold tracking-tight">{plt.label}</span>
               </div>
               {platforms[plt.id] === 'ready' ? (
                 <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-xl" />
               ) : (
                 <Clock className="w-4 h-4 opacity-30" />
               )}
             </button>
           ))}
        </div>

        <div className="flex items-center justify-center pt-2">
            <button className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500/60 bg-orange-500/5 px-6 py-2.5 rounded-full border border-orange-500/10 hover:bg-orange-500/10 transition-colors">
               Programar Publicación AI
            </button>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-5 h-5 -left-2.5 bg-orange-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
      <Handle type="source" position={Position.Right} className="w-5 h-5 -right-2.5 bg-orange-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
    </div>
  );
};

export default memo(CampaignManagerNode);
