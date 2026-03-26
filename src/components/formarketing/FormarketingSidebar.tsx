import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { 
  Search, Clock, LayoutGrid, LayoutTemplate, Image, Video, 
  Music, Type, PenTool, Sparkles, Maximize, List, Upload, Folder,
  X, Play, Hand, Scissors, Square, MessageSquare, Undo, Redo, Settings, Share2, Zap, Rocket
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TemplateModal } from './TemplateModal';

export function FormarketingSidebar() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const { addNodes, screenToFlowPosition } = useReactFlow();
  const fileInputRef = useState<HTMLInputElement | null>(null)[0]; // Simplified for logic check
  
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          handleAddNode('modelView', 'Imagen Subida', reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAddTemplate = (templateType: string) => {
    const centerX = 400;
    const centerY = 300;
    
    if (templateType === 'metaPack') {
       toast.info("Inyectando Plantilla: Meta Ads Social Pack...");
       const charId = crypto.randomUUID();
       const imgId = crypto.randomUUID();
       const vidId = crypto.randomUUID();
       const campId = crypto.randomUUID();
       
       const newNodes = [
         { id: charId, type: 'characterBreakdown', position: { x: centerX - 450, y: centerY }, data: { title: 'Target Persona', description: 'Describe tu audiencia para Meta Ads...' } },
         { id: imgId, type: 'modelView', position: { x: centerX - 150, y: centerY }, data: { title: 'Imagen de Campaña', prompt: 'Visual cinemático para redes sociales...' } },
         { id: vidId, type: 'videoModel', position: { x: centerX + 150, y: centerY }, data: { title: 'Reel de Ventas', status: 'pending' } },
         { id: campId, type: 'campaignManager', position: { x: centerX + 450, y: centerY }, data: { title: 'Gestor Meta Ads' } }
       ];
       
       addNodes(newNodes as any);
    } else if (templateType === 'landingPack') {
       toast.info("Inyectando Plantilla: App Landing Structure...");
       addNodes([
         { id: crypto.randomUUID(), type: 'characterBreakdown', position: { x: centerX - 350, y: centerY }, data: { title: 'Value Prop', description: 'Define la propuesta de valor...' } },
         { id: crypto.randomUUID(), type: 'layoutBuilder', position: { x: centerX, y: centerY }, data: { title: 'Wireframe Layout', platform: 'web' } }
       ] as any);
    }
  };

  const handleAddNode = (type: string, title: string, assetUrl?: string) => {
    const x = Math.random() * 200 + 100;
    const y = Math.random() * 200 + 100;
    const position = screenToFlowPosition({ x, y });
    const newNodeId = crypto.randomUUID();

    let defaultData = {};
    if (type === 'characterBreakdown') {
      defaultData = { title: title || 'Nuevo Personaje', description: 'Describe tu personaje aquí...' };
    } else if (type === 'modelView') {
      defaultData = { title: title || 'Nueva Imagen', prompt: 'Describe la escena...' };
    } else if (type === 'videoModel') {
      defaultData = { title: title || 'Nuevo Video', status: 'pending', duration: '00:00' };
    } else if (type === 'layoutBuilder') {
      defaultData = { title: title || 'Nueva Interfaz', platform: 'web', structure: 'Define el layout...' };
    } else if (type === 'campaignManager') {
      defaultData = { title: title || 'Nueva Campaña' };
    }

    addNodes({
      id: newNodeId,
      type: type,
      position,
      data: {
        ...defaultData,
        assetUrl: assetUrl || null,
        status: assetUrl ? 'ready' : 'idle',
        prompt: title || 'Elemento'
      },
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.dropEffect = 'move';
  };

  const menuItems = [
    { label: 'Copywriting AI', icon: Type, type: 'characterBreakdown', color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Genera textos persuasivos para tus anuncios' },
    { label: 'Imagen Flux HQ', icon: Image, type: 'modelView', color: 'text-indigo-500', bg: 'bg-indigo-500/10', description: 'Generación industrial de alta calidad' },
    { label: 'Avatar de Marca', icon: Video, type: 'videoModel', color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Video con IA para campañas de video' },
    { label: 'Web/App Builder', icon: LayoutTemplate, type: 'layoutBuilder', color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'Diseña interfaces y estructuras web' },
    { label: 'Campaña Social', icon: Share2, type: 'campaignManager', color: 'text-orange-500', bg: 'bg-orange-500/10', description: 'Gestiona la distribución en redes sociales' },
  ].filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) && 
    (activeCategory === null || (activeCategory === 6 && item.icon === Type) || (activeCategory === 3 && item.icon === Image) || (activeCategory === 4 && item.icon === Video))
  );

  const plantillas = [
    { label: 'Meta Ads Pack', icon: Sparkles, type: 'metaPack', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Landing App Structure', icon: LayoutGrid, type: 'landingPack', color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
  ];

  const contentItems = [
    { label: 'Subir', icon: Upload, action: handleFileUpload },
    { label: 'Recursos', icon: Folder },
    { label: 'Stock', icon: Search }
  ].filter(item => item.label.toLowerCase().includes(search.toLowerCase()));

  const topIcons = [
    { icon: Clock, id: 0, title: 'Historial' }, 
    { icon: LayoutGrid, id: 1, title: 'Lienzo' }, 
    { icon: LayoutTemplate, id: 2, title: 'Plantillas' }, 
    { icon: Image, id: 3, title: 'Imágenes' }, 
    { icon: Video, id: 4, title: 'Videos' }, 
    { icon: Music, id: 5, title: 'Música' }, 
    { icon: Type, id: 6, title: 'Texto' }, 
    { icon: PenTool, id: 7, title: 'Diseño' }
  ];

  const toolbarIcons = [
    { icon: Hand, id: 'hand' },
    { icon: Scissors, id: 'scissors' },
    { icon: Square, id: 'square' },
    { icon: MessageSquare, id: 'message' },
    { icon: Undo, id: 'undo' },
    { icon: Redo, id: 'redo' },
    { icon: Settings, id: 'settings' }
  ];

  return (
    <div className="absolute left-6 top-24 z-10 flex gap-4 animate-fade-in items-start h-[calc(100vh-140px)] pointer-events-none">
      
      {/* Vertical Pill Toolbar (High-Performance UI) */}
      <div className="flex flex-col items-center gap-3 rounded-[2.5rem] border border-white/10 bg-[#0a0a0b]/90 w-[64px] py-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl shrink-0 h-fit pointer-events-auto ring-1 ring-white/5">
        {/* Close/Menu Toggle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ${menuOpen ? 'bg-primary text-primary-foreground rotate-90 shadow-lg shadow-primary/20' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
        
        <div className="w-8 h-px bg-white/5 my-1" />

        {/* Play (Active/Industrial Run) */}
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-2xl hover:scale-105 active:scale-95 transition-all group/play">
          <Play className="h-5 w-5 fill-current ml-0.5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Other Tools */}
        {toolbarIcons.map((Tool, i) => (
          <button 
            key={i} 
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground/60 hover:bg-white/5 hover:text-foreground transition-all group ${Tool.id === 'settings' ? 'mt-6' : ''}`}
          >
            <Tool.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>

      {/* Expanded Context Menu */}
      {menuOpen && (
        <div className="w-64 rounded-xl border border-white/10 bg-[#161616]/95 p-3 shadow-2xl backdrop-blur-xl flex flex-col gap-3 max-h-full overflow-y-auto scrollbar-none animate-in slide-in-from-left-4 fade-in duration-200 pointer-events-auto">
          
          {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar" 
          className="pl-9 bg-white/5 border-transparent focus:border-white/10 rounded-xl h-10 text-sm"
        />
      </div>

      {/* Top Icons Row */}
      <TooltipProvider>
        <div className="flex items-center justify-between px-1 overflow-x-auto pb-2 scrollbar-none gap-2">
          {topIcons.map((item, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeCategory === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'}`}
                >
                  <item.icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black border-white/10 text-[10px] uppercase font-bold tracking-widest px-2 py-1">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Plantillas Menu (V5.2 Industrial) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Plantillas Pro</h3>
            <Sparkles className="w-2.5 h-2.5 text-primary/40" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-1 text-foreground">
          <TemplateModal 
            onSelect={(template) => {
              toast.success(`Inyectando pack: ${template.title}`);
              const event = new CustomEvent('add-template', { detail: template });
              window.dispatchEvent(event);
            }} 
            trigger={
                <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br from-white/10 to-transparent hover:from-primary/20 hover:to-primary/5 border border-white/5 hover:border-primary/30 transition-all duration-300 group/btn shadow-xl backdrop-blur-md">
                    <div className="p-1.5 rounded-lg bg-primary/20 group-hover/btn:scale-110 transition-all">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-[8px] font-black text-center text-foreground uppercase tracking-widest leading-none">Elite Packs</span>
                </button>
            }
          />
          {plantillas.filter(p => p.type === 'landingPack').map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => handleAddTemplate(item.type)}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all duration-300 group/btn shadow-lg backdrop-blur-md"
            >
              <div className={`p-1.5 rounded-lg ${item.bg.replace('/10', '/20')} group-hover/btn:scale-110 transition-transform`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <span className="text-[8px] font-black text-center text-foreground/80 uppercase tracking-widest leading-none">L-Page Pack</span>
            </button>
          ))}
        </div>
      </div>

      {/* Basics Menu */}
      <TooltipProvider>
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">Básicos</h3>
          {menuItems.map((item, idx) => (
            <div key={idx} className="group/item relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.label)}
                    onClick={() => handleAddNode(item.type, item.label)}
                    className="flex flex-col gap-1 w-full p-2 rounded-lg hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5 active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${item.bg} group-hover:scale-110 transition-transform`}>
                        <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-foreground/90 group-hover:text-foreground">{item.label}</span>
                        <span className="text-[9px] text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80 lowercase">{item.description}</span>
                      </div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-black border-white/10 text-[10px] font-bold max-w-[200px] p-2">
                  {item.description}
                </TooltipContent>
              </Tooltip>
              
              {/* Preview on Hover */}
              <div className="absolute left-[calc(100%+8px)] top-0 w-48 h-32 rounded-2xl border border-white/10 bg-black/95 shadow-2xl opacity-0 translate-x-4 pointer-events-none group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all z-20 overflow-hidden flex flex-col">
                 <div className="h-full w-full bg-white/5 relative">
                    {item.type === 'modelView' && <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" />}
                    {item.type === 'videoModel' && (
                        <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-amber-500/40 animate-pulse" />
                        </div>
                    )}
                    {item.type === 'characterBreakdown' && (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <Type className="w-8 h-8 text-emerald-500/40" />
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Vista Previa Pro</p>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Content Menu */}
      <div className="flex flex-col gap-1 mt-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">Contenido</h3>
        {contentItems.map((item, idx) => (
          <button 
            key={idx} 
            onClick={item.action}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <div className="p-1.5 rounded-lg border border-white/10 bg-black/20">
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground/80 transition-colors" />
            </div>
            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom Footer Actions */}
      <div className="mt-2 flex items-center justify-between pt-3 border-t border-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
        <span className="px-2 font-mono opacity-50">Imagen</span>
        <div className="flex gap-2">
           <span className="bg-white/5 px-2 py-1 rounded">Navegar</span>
           <span className="bg-white/5 px-2 py-1 rounded">Insertar</span>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
