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
    <div className="group relative bg-[#0f0f0f]/95 border border-white/5 rounded-[1.5rem] p-0 w-[300px] shadow-2xl backdrop-blur-3xl overflow-hidden animate-in zoom-in duration-300 isolation-auto">
      {/* V5.3 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <div className="bg-orange-500/20 p-2 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
               <Share2 className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-tighter text-foreground/90 leading-none">
                {data.title || "CAMPAIGN MANAGER"}
              </h3>
              <span className="text-[8px] font-black text-orange-500/40 uppercase tracking-[0.2em] mt-1">V5.4 COMPACT ENGINE</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
           <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest px-1 font-mono">Multi-Platform Sync</span>
        
        <div className="space-y-2">
           {[
             { id: 'instagram', icon: Instagram, label: 'Instagram Ads' },
             { id: 'facebook', icon: Facebook, label: 'Meta Campaign' },
             { id: 'twitter', icon: Twitter, label: 'X (Twitter)' }
           ].map((plt) => (
             <button 
               key={plt.id}
               onClick={() => togglePlatform(plt.id)}
               className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${platforms[plt.id] === 'ready' ? 'bg-orange-500/10 border-orange-500/10 text-foreground' : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'}`}
             >
               <div className="flex items-center gap-2.5">
                  <plt.icon className={`w-3.5 h-3.5 ${platforms[plt.id] === 'ready' ? 'text-orange-400' : ''}`} />
                  <span className="text-[10px] font-bold tracking-tight">{plt.label}</span>
               </div>
               {platforms[plt.id] === 'ready' ? (
                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-xl" />
               ) : (
                 <Clock className="w-3.5 h-3.5 opacity-20" />
               )}
             </button>
           ))}
        </div>

        <div className="flex items-center justify-center pt-1">
            <button className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-500/70 bg-orange-500/5 px-5 py-2 rounded-full border border-orange-500/10 hover:bg-orange-500/10 transition-colors">
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
