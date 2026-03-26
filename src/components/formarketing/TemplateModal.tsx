import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutGrid, Zap, Video, Image as ImageIcon, Rocket, ChevronRight } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
  previewUrl: string;
  nodes: any[];
}

const templates: Template[] = [
  {
    id: 'antigravityPack',
    title: 'Nexus_Ecosystem_V3',
    description: 'Interface cloning engine. Connect reference URL and generate full branch brand context.',
    icon: Rocket,
    color: 'text-white/40',
    bg: 'bg-white/5',
    previewUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'antigravityBridge', data: { title: 'Reference_Hub', status: 'idle' } },
        { type: 'characterBreakdown', data: { title: 'Brand_Identity', flavor: 'derived_from_url', description: 'Visual context extracted...' } },
        { type: 'modelView', data: { title: 'Site_Visuals', prompt: 'Hero vision based on brand context' } },
        { type: 'layoutBuilder', data: { title: 'UI_Skeleton', platform: 'web' } }
    ]
  },
  {
    id: 'metaPack',
    title: 'Social_Ads_Pack',
    description: 'Full campaign pack for social distribution. Includes Persona, HQ Image, and Reel Engine.',
    icon: Sparkles,
    color: 'text-white/30',
    bg: 'bg-white/5',
    previewUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'characterBreakdown', data: { title: 'Target_Persona', description: 'Describe target audience...' } },
        { type: 'modelView', data: { title: 'Campaign_Visual', prompt: 'Cinematic visual for social...' } },
        { type: 'videoModel', data: { title: 'Sales_Reel', status: 'pending' } },
        { type: 'campaignManager', data: { title: 'Meta_Distributor' } }
    ]
  },
  {
    id: 'landingPack',
    title: 'Structure_Web_V1',
    description: 'Optimized landing page structures for mobile applications. Conversion and neural focus.',
    icon: LayoutGrid,
    color: 'text-white/20',
    bg: 'bg-white/5',
    previewUrl: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'characterBreakdown', data: { title: 'Value_Prop', description: 'Define value core...' } },
        { type: 'layoutBuilder', data: { title: 'Neural_Wireframe', platform: 'web' } }
    ]
  }
];

interface TemplateModalProps {
  onSelect: (template: Template) => void;
  trigger?: React.ReactNode;
}

export function TemplateModal({ onSelect, trigger }: TemplateModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group">
                <Sparkles className="h-4 w-4 text-white/40" />
                <span className="text-[9px] font-black text-center text-white/20 uppercase tracking-tighter leading-none">open_library</span>
            </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[950px] bg-[#050506] border border-white/10 backdrop-blur-3xl text-white rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        <DialogHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-6 mb-0">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-2xl">
                <Rocket className="w-8 h-8 text-white/50" />
             </div>
             <div className="flex flex-col">
                <DialogTitle className="text-3xl font-black lowercase tracking-tighter text-white">nexus_orchestrator</DialogTitle>
                <DialogDescription className="text-[12px] font-black text-white/10 lowercase tracking-[0.3em] mt-1">ENGINE_V7_INDUSTRIAL_TEMPLATES</DialogDescription>
             </div>
          </div>
        </DialogHeader>
        
        <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar bg-[#050506]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="group relative flex flex-col gap-6 p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.02] overflow-hidden duration-500"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-0">
                   <img src={template.previewUrl} alt={template.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#050506] to-transparent" />
                   <div className={`absolute top-4 left-4 p-2.5 rounded-xl bg-[#050506]/90 backdrop-blur-md border border-white/5 shadow-2xl`}>
                      <template.icon className={`w-4 h-4 text-white/40`} />
                   </div>
                </div>

                <div className="flex flex-col gap-2 px-1">
                  <h3 className="text-xl font-black lowercase tracking-tighter text-white/90 group-hover:text-white transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-[10px] leading-relaxed text-white/20 font-bold lowercase tracking-tight">
                    {template.description}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between px-1">
                   <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                      <Zap className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-[9px] font-black lowercase tracking-widest text-white/10">{template.nodes.length} nodes_ready</span>
                   </div>
                   <Button 
                     onClick={() => onSelect(template)}
                     className="bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-black lowercase tracking-widest h-11 px-6 gap-2 transition-all transition-all"
                   >
                     inject_pack
                     <ChevronRight className="w-3.5 h-3.5" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <p className="text-[9px] font-black text-white/5 lowercase tracking-[0.4em]">system_v7.0_industrial_audit_ready</p>
            <div className="flex gap-4 opacity-10 grayscale hover:opacity-100 transition-all">
               {/* Neural logos/icons if any */}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
