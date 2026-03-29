import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Search, LayoutGrid, LayoutTemplate, Image, Video,
  Type, Sparkles, Upload,
  X, Play, Hand, Scissors, Square, MessageSquare, Undo, Redo, Settings, Share2, Rocket
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TemplateModal, Template } from './TemplateModal';

export function FormarketingSidebar({ onAddNode }: { onAddNode: (type: string, label: string, assetUrl?: string) => void }) {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(true);
  const { screenToFlowPosition } = useReactFlow();

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onAddNode('modelView', 'imagen_subida', reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSelectTemplate = (template: Template) => {
    toast.success(`Plantilla aplicada: ${template.title}`);
    window.dispatchEvent(new CustomEvent('add-template', { detail: { title: template.title, nodes: template.nodes } }));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.dropEffect = 'move';
  };

  const menuItems = [
    { label: 'Texto / Persona', icon: Type, type: 'characterBreakdown', color: 'text-aether-purple', bg: 'bg-aether-purple/5', description: 'Persona de IA y narrativa' },
    { label: 'Generar imagen', icon: Image, type: 'modelView', color: 'text-white', bg: 'bg-white/10', description: 'Imágenes de alta calidad' },
    { label: 'Generar video', icon: Video, type: 'videoModel', color: 'text-aether-blue', bg: 'bg-aether-blue/5', description: 'Producción de video con IA' },
    { label: 'Diseño / Layout', icon: LayoutTemplate, type: 'layoutBuilder', color: 'text-white/40', bg: 'bg-white/5', description: 'Estructura y diseño digital' },
    { label: 'Gestor de campaña', icon: Share2, type: 'campaignManager', color: 'text-rose-400', bg: 'bg-rose-400/5', description: 'Distribución omnicanal' },
    { label: 'Conector de nodos', icon: Rocket, type: 'antigravityBridge', color: 'text-white', bg: 'bg-white/20', description: 'Sincronización de módulos' },
  ].filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const toolbarIcons = [
    { icon: Hand, id: 'hand', label: 'Mover' },
    { icon: Scissors, id: 'scissors', label: 'Cortar' },
    { icon: Square, id: 'square', label: 'Seleccionar' },
    { icon: MessageSquare, id: 'message', label: 'Notas' },
    { icon: Undo, id: 'undo', label: 'Deshacer' },
    { icon: Redo, id: 'redo', label: 'Rehacer' },
    { icon: Settings, id: 'settings', label: 'Configuración' }
  ];

  return (
    <div className="flex h-full shrink-0 border-r border-white/[0.04] z-20">

      {/* Aether Vertical Toolbar */}
      <div className="flex flex-col items-center gap-2 w-14 py-4 bg-[#222228]/90 backdrop-blur-xl">
        {/* Menu Toggle */}
        <button
           onClick={() => setMenuOpen(!menuOpen)}
           className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 mb-1 ${menuOpen ? 'bg-white text-black shadow-xl shadow-white/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'}`}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </button>

        <div className="w-8 h-px bg-white/10 my-1" />

        {/* Action Button */}
        <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-2xl bg-aether-purple/20 text-aether-purple hover:bg-aether-purple/30 transition-all group/play border border-aether-purple/20">
              <Play className="h-4 w-4 fill-current ml-0.5 group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Ejecutar flujo</TooltipContent>
        </Tooltip>

        {/* Toolset */}
        {toolbarIcons.map((tool, i) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-white/20 hover:bg-white/5 hover:text-white transition-all group ${tool.id === 'settings' ? 'mt-auto border-t border-white/5 pt-3 rounded-none w-8' : ''}`}
              >
                <tool.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}
        </TooltipProvider>
      </div>

      {/* Aether Navigation Menu Panel */}
      {menuOpen && (
        <div className="w-72 flex flex-col gap-6 p-5 bg-[#050506] border-l border-white/[0.04] overflow-y-auto no-scrollbar animate-in slide-in-from-left duration-200">

          {/* Search */}
          <div className="relative mb-0 font-display">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
            <Input
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Buscar nodos..."
               className="pl-12 pr-10 bg-sidebar-accent/50 border-sidebar-border focus:border-sidebar-primary/40 rounded-2xl h-12 text-xs font-medium text-white placeholder:text-white/10 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Módulos de generación</h3>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <span className="text-[10px] text-white/20 font-bold tabular-nums">/{menuItems.length}</span>
            </div>

            {/* Templates button */}
            <TemplateModal
              onSelect={handleSelectTemplate}
              trigger={
                <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-aether-purple/30 hover:bg-aether-purple/5 transition-all group/btn shadow-inner w-full">
                  <div className="p-3 rounded-2xl bg-white/5 group-hover/btn:scale-110 group-hover/btn:bg-aether-purple/20 transition-all">
                    <Sparkles className="h-5 w-5 text-aether-purple fill-current opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-bold text-center text-white/40 group-hover/btn:text-white/80 uppercase tracking-widest leading-none font-display">Ver plantillas</span>
                </button>
              }
            />
          </div>

          {/* Node Selector */}
          <div className="flex flex-col gap-3">
             {menuItems.length === 0 && (
               <div className="flex flex-col items-center gap-3 py-8 text-center">
                 <Search className="h-6 w-6 text-white/10" />
                 <span className="text-[11px] text-white/20 font-medium">Sin resultados para <span className="text-white/40">"{search}"</span></span>
                 <button onClick={() => setSearch('')} className="text-[10px] text-aether-purple/60 hover:text-aether-purple transition-colors font-bold uppercase tracking-widest">Limpiar</button>
               </div>
             )}
             {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type, item.label)}
                  onClick={() => onAddNode(item.type, item.label)}
                  className="flex w-full gap-4 rounded-3xl border border-sidebar-border bg-sidebar-accent/20 items-center p-4 cursor-pointer hover:bg-sidebar-accent/50 hover:border-white/10 hover:scale-[1.02] transition-all group/item overflow-hidden relative"
                >
                    <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 bg-sidebar-accent/50 border border-white/5 group-hover/item:border-white/20 transition-all shadow-inner`}>
                    <item.icon className={`h-5 w-5 text-sidebar-foreground group-hover/item:text-white transition-colors`} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white/90 group-hover/item:text-white transition-colors font-display tracking-tight uppercase">{item.label}</span>
                    <span className="text-[10px] font-medium text-white/20 transition-colors group-hover/item:text-white/40">{item.description}</span>
                  </div>

                  {/* Subtle hover glow */}
                  <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </button>
             ))}
           </div>

           <div className="pt-4 border-t border-white/5">
              <button
                onClick={handleFileUpload}
                className="flex items-center gap-4 w-full p-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-white/20 hover:bg-white/[0.04] transition-all group text-left"
              >
                <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] group-hover:bg-white/5 transition-colors">
                  <Upload className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/60 group-hover:text-white uppercase tracking-widest font-display">Subir imagen</span>
                  <span className="text-[9px] text-white/20">Desde tu dispositivo</span>
                </div>
              </button>
           </div>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-white/10 tracking-[0.3em] font-display">
            <span>Creator IA Pro · Studio</span>
            <div className="flex gap-4">
               <span className="hover:text-white/40 transition-colors cursor-pointer">INFO</span>
               <span className="hover:text-white/40 transition-colors cursor-pointer">LOGS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
