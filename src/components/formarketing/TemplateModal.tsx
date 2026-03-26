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
    title: 'Antigravity Ecosystem',
    description: 'Motor de clonación de interfaces. Conecta una URL de referencia y genera el Brand Context completo para Antigravity.',
    icon: Rocket,
    color: 'text-[#ff0071]',
    bg: 'bg-[#ff0071]/10',
    previewUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'antigravityBridge', data: { title: 'Reference Hub', status: 'idle' } },
        { type: 'characterBreakdown', data: { title: 'Brand Identity', flavor: 'derived_from_url', description: 'Contexto visual extraído...' } },
        { type: 'modelView', data: { title: 'Site Visuals', prompt: 'Hero vision based on brand context' } },
        { type: 'layoutBuilder', data: { title: 'UI Skeleton', platform: 'web' } }
    ]
  },
  {
    id: 'metaPack',
    title: 'Meta Ads Pack',
    description: 'Pack completo para campañas en Facebook e Instagram. Incluye Personaje, Imagen HQ, Video Reel y Gestor de Campaña.',
    icon: Sparkles,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    previewUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'characterBreakdown', data: { title: 'Target Persona', description: 'Describe tu audiencia para Meta Ads...' } },
        { type: 'modelView', data: { title: 'Imagen de Campaña', prompt: 'Visual cinemático para redes sociales...' } },
        { type: 'videoModel', data: { title: 'Reel de Ventas', status: 'pending' } },
        { type: 'campaignManager', data: { title: 'Gestor Meta Ads' } }
    ]
  },
  {
    id: 'landingPack',
    title: 'Landing App Structure',
    description: 'Estructura optimizada para Landing Pages de aplicaciones móviles. Enfoque en conversión y UX.',
    icon: LayoutGrid,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    previewUrl: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'characterBreakdown', data: { title: 'Value Prop', description: 'Define la propuesta de valor...' } },
        { type: 'layoutBuilder', data: { title: 'Wireframe Layout', platform: 'web' } }
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
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group">
                <Sparkles className="h-4 w-4 text-pink-500" />
                <span className="text-[9px] font-black text-center text-foreground/70 uppercase tracking-tighter leading-none">Abrir Plantillas</span>
            </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] bg-[#050506] border border-white/5 backdrop-blur-3xl text-white rounded-[3rem] p-0 overflow-hidden shadow-3xl">
        <DialogHeader className="p-12 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-6 mb-2">
             <div className="p-4 bg-[#ff0071]/10 rounded-2xl shadow-xl shadow-[#ff0071]/10">
                <Rocket className="w-8 h-8 text-[#ff0071]" />
             </div>
             <div className="flex flex-col">
                <DialogTitle className="text-3xl font-black lowercase tracking-tighter text-white">biblioteca_nexo</DialogTitle>
                <DialogDescription className="text-[12px] font-black text-slate-500 lowercase tracking-[0.2em] mt-2">Pulse V7.0 Industrial Templates</DialogDescription>
             </div>
          </div>
        </DialogHeader>
        
        <div className="p-10 max-h-[650px] overflow-y-auto scrollbar-hide bg-[#050506]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="group relative flex flex-col gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-[#ff0071]/30 transition-all hover:shadow-3xl hover:shadow-[#ff0071]/5 overflow-hidden active:scale-[0.99] duration-500"
              >
                <div className="relative aspect-video rounded-[2rem] overflow-hidden mb-2">
                   <img src={template.previewUrl} alt={template.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#050506]/80 to-transparent" />
                   <div className={`absolute top-6 left-6 p-3 rounded-2xl bg-[#050506]/80 backdrop-blur-md border border-white/10 shadow-2xl`}>
                      <template.icon className={`w-5 h-5 text-[#ff0071]`} />
                   </div>
                </div>

                <div className="flex flex-col gap-3 px-1">
                  <h3 className="text-2xl font-black lowercase tracking-tighter text-white group-hover:text-[#ff0071] transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-slate-500 font-bold lowercase tracking-tight">
                    {template.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between px-1">
                   <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/5">
                      <Zap className="w-4 h-4 text-[#ff0071]" />
                      <span className="text-[10px] font-black lowercase tracking-widest text-slate-400">{template.nodes.length} nexus_nodes</span>
                   </div>
                   <Button 
                     onClick={() => onSelect(template)}
                     className="bg-[#ff0071] hover:bg-[#e60066] text-white rounded-[1.5rem] text-[11px] font-black lowercase tracking-widest h-12 px-8 gap-3 shadow-2xl shadow-[#ff0071]/20 transition-all"
                   >
                     inject_pack
                     <ChevronRight className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-center">
            <p className="text-[10px] font-black text-slate-600 lowercase tracking-[0.3em]">nexus_orchestrator v7.0 industrial</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
