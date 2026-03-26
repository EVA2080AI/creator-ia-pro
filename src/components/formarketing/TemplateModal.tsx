import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutGrid, Zap, Video, Image as ImageIcon, Rocket } from "lucide-react";

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
  },
  {
    id: 'videoPack',
    title: 'Master Video Sequence',
    description: 'Secuencia de video industrial para anuncios de alto impacto. Tres escenas coordinadas por un guion central.',
    icon: Video,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    previewUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop',
    nodes: [
        { type: 'characterBreakdown', data: { title: 'Video Script', description: 'Guion base de la secuencia...' } },
        { type: 'videoModel', data: { title: 'Escena 1', status: 'pending' } },
        { type: 'videoModel', data: { title: 'Escena 2', status: 'pending' } },
        { type: 'videoModel', data: { title: 'Escena 3', status: 'pending' } }
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
      <DialogContent className="sm:max-w-[800px] bg-white border border-slate-100 backdrop-blur-3xl text-slate-800 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-4 mb-2">
             <div className="p-3 bg-[#ff0071]/10 rounded-2xl">
                <Rocket className="w-6 h-6 text-[#ff0071]" />
             </div>
             <div className="flex flex-col">
                <DialogTitle className="text-2xl font-bold lowercase tracking-tight text-slate-800">biblioteca de plantillas</DialogTitle>
                <DialogDescription className="text-[11px] font-bold text-slate-400 lowercase tracking-tight">pulse v6.2 elite workspaces</DialogDescription>
             </div>
          </div>
        </DialogHeader>
        
        <div className="p-10 max-h-[600px] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="group relative flex flex-col gap-5 p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-[#ff0071]/20 transition-all hover:shadow-2xl hover:shadow-[#ff0071]/5 overflow-hidden"
              >
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-2">
                   <img src={template.previewUrl} alt={template.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                   <div className={`absolute top-5 left-5 p-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg`}>
                      <template.icon className={`w-5 h-5 text-[#ff0071]`} />
                   </div>
                </div>

                <div className="flex flex-col gap-2 px-1">
                  <h3 className="text-xl font-bold lowercase tracking-tight text-slate-800 group-hover:text-[#ff0071] transition-colors line-clamp-1">
                    {template.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-slate-400 font-medium line-clamp-2 lowercase italic">
                    {template.description}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between px-1">
                   <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                      <Zap className="w-3.5 h-3.5 text-[#ff0071]" />
                      <span className="text-[10px] font-bold lowercase tracking-tight text-slate-500">{template.nodes.length} nodos ia</span>
                   </div>
                   <Button 
                     onClick={() => onSelect(template)}
                     className="bg-[#ff0071] hover:bg-[#e60066] text-white rounded-2xl text-[11px] font-bold lowercase tracking-tight h-11 px-6 gap-3 shadow-lg shadow-[#ff0071]/20 active:scale-95 transition-all"
                   >
                     inyectar
                     <Sparkles className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-center">
            <p className="text-[11px] font-bold text-slate-300 lowercase tracking-tight">formarketing pulse engine v6.2</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
