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
      <DialogContent className="sm:max-w-[800px] bg-[#0f0f0f]/95 border-white/10 backdrop-blur-2xl text-foreground rounded-3xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2.5 bg-primary/20 rounded-2xl">
                <LayoutGrid className="w-6 h-6 text-primary" />
             </div>
             <div className="flex flex-col">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Biblioteca de Plantillas</DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">V5.3 Elite Workspaces</DialogDescription>
             </div>
          </div>
        </DialogHeader>
        
        <div className="p-8 max-h-[600px] overflow-y-auto scrollbar-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="group relative flex flex-col gap-4 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/30 transition-all hover:bg-white/[0.07] overflow-hidden"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-2">
                   <img src={template.previewUrl} alt={template.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                   <div className={`absolute top-4 left-4 p-2 rounded-xl ${template.bg}`}>
                      <template.icon className={`w-5 h-5 ${template.color}`} />
                   </div>
                </div>

                <div className="flex flex-col gap-1 px-1">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium line-clamp-2 italic">
                    {template.description}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between px-1">
                   <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <Zap className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">{template.nodes.length} Nodos IA</span>
                   </div>
                   <Button 
                     onClick={() => onSelect(template)}
                     className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-5 gap-2 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                   >
                     Usar Pack
                     <Rocket className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-center">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Industrial Content Production Engine v5.3</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
