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

export function FormarketingSidebar({ onAddNode }: { onAddNode: (type: string, label: string, assetUrl?: string) => void }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
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

  const handleAddTemplate = (templateType: string) => {
    if (templateType === 'landingPack') {
       toast.info("inyectando estructura: landing app...");
       const template = {
         title: 'Landing App',
         nodes: [
           { type: 'characterBreakdown', data: { title: 'Propuesta de Valor', description: 'Define el núcleo de tu producto...' } },
           { type: 'layoutBuilder', data: { title: 'Wireframe Web', platform: 'web' } }
         ]
       };
       window.dispatchEvent(new CustomEvent('add-template', { detail: template }));
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.dropEffect = 'move';
  };

  const menuItems = [
    { label: 'copywriting ai', icon: Type, type: 'characterBreakdown', color: 'text-[#ff0071]', bg: 'bg-[#ff0071]/10', description: 'genera textos persuasivos' },
    { label: 'imagen flux hq', icon: Image, type: 'modelView', color: 'text-[#ff0071]', bg: 'bg-[#ff0071]/10', description: 'generación industrial hq' },
    { label: 'avatar de marca', icon: Video, type: 'videoModel', color: 'text-[#ff0071]', bg: 'bg-[#ff0071]/10', description: 'video con ia para campañas' },
    { label: 'web/app builder', icon: LayoutTemplate, type: 'layoutBuilder', color: 'text-[#ff0071]', bg: 'bg-[#ff0071]/10', description: 'diseña estructuras web' },
    { label: 'campaña social', icon: Share2, type: 'campaignManager', color: 'text-[#ff0071]', bg: 'bg-[#ff0071]/10', description: 'gestiona distribución' },
    { label: 'antigravity bridge', icon: Rocket, type: 'antigravityBridge', color: 'text-white', bg: 'bg-[#ff0071]', description: 'clonación de ecosistemas' },
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
    <div className="absolute left-4 top-20 z-10 flex gap-3 animate-fade-in items-start h-[calc(100vh-120px)] pointer-events-none">
      
      {/* Vertical Pulse Toolbar */}
      <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-white/5 bg-[#0a0a0b]/80 w-[56px] py-6 shadow-2xl backdrop-blur-2xl shrink-0 h-fit pointer-events-auto">
        {/* Menu Toggle */}
        <button 
           onClick={() => setMenuOpen(!menuOpen)}
           className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-500 ${menuOpen ? 'bg-[#ff0071] text-white rotate-90 shadow-xl shadow-[#ff0071]/30' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'}`}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
        
        <div className="w-8 h-px bg-white/5 my-2" />

        {/* Play Button */}
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl hover:scale-105 active:scale-95 transition-all group/play">
          <Play className="h-5 w-5 fill-[#ff0071] text-[#ff0071] ml-0.5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Other Tools */}
        {toolbarIcons.map((Tool, i) => (
          <button 
            key={i} 
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-slate-500 hover:bg-white/5 hover:text-[#ff0071] transition-all group ${Tool.id === 'settings' ? 'mt-8' : ''}`}
          >
            <Tool.icon className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>

      {/* Expanded Pulse Menu */}
      {menuOpen && (
        <div className="w-64 rounded-[2.5rem] border border-white/5 bg-[#0a0a0b]/90 p-5 shadow-3xl backdrop-blur-3xl flex flex-col gap-6 max-h-full overflow-y-auto scrollbar-hide animate-in slide-in-from-left-4 duration-500 pointer-events-auto">
          
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <Input 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="buscar herramientas..." 
               className="pl-11 bg-white/5 border-transparent focus:border-[#ff0071]/30 rounded-2xl h-12 text-xs lowercase font-bold text-white placeholder:text-slate-700"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">plantillas elite</h3>
                <Sparkles className="w-3.5 h-3.5 text-[#ff0071]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <TemplateModal 
                 onSelect={(template) => {
                   toast.success(`Inyectando pack: ${template.title}`);
                   const event = new CustomEvent('add-template', { detail: template });
                   window.dispatchEvent(event);
                 }} 
                 trigger={
                     <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#ff0071]/[0.02] border border-[#ff0071]/10 hover:bg-[#ff0071]/[0.05] transition-all group/btn shadow-sm">
                        <div className="p-1.5 rounded-lg bg-[#ff0071]/10 group-hover/btn:scale-110 transition-all">
                           <Zap className="h-3.5 w-3.5 text-[#ff0071]" />
                        </div>
                        <span className="text-[8px] font-bold text-center text-slate-800 uppercase tracking-tighter leading-none">ads packs</span>
                     </button>
                 }
               />
               <button 
                  onClick={() => handleAddTemplate('landingPack')}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group/btn shadow-sm"
               >
                  <div className="p-1.5 rounded-lg bg-slate-100 group-hover/btn:scale-110 transition-all">
                    <Rocket className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#ff0071]" />
                  </div>
                  <span className="text-[8px] font-bold text-center text-slate-400 uppercase tracking-tighter leading-none group-hover:text-slate-800">landing base</span>
               </button>
            </div>
          </div>

        {/* Basics Menu */}
        <TooltipProvider>
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-2">herramientas nexus</h3>
           {menuItems.map((item, idx) => (
             <div key={idx} className="group/item relative">
               <Tooltip>
                 <TooltipTrigger asChild>
                    <button 
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type, item.label)}
                      onClick={() => onAddNode(item.type, item.label)}
                      className="flex flex-col gap-1 w-full p-3 rounded-2xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5 active:scale-[0.98] duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${item.bg} group-hover:scale-110 transition-transform shadow-lg`}>
                          <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-white group-hover:text-[#ff0071] transition-colors">{item.label}</span>
                          <span className="text-[9px] text-slate-500 line-clamp-1 lowercase font-medium">{item.description}</span>
                        </div>
                      </div>
                    </button>
                 </TooltipTrigger>
                 <TooltipContent side="right" className="bg-slate-900 border-none text-[10px] font-bold max-w-[200px] p-2 text-white rounded-xl">
                   {item.description}
                 </TooltipContent>
               </Tooltip>
             </div>
           ))}
         </div>
       </TooltipProvider>

       {/* Content Menu */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-2">contenido</h3>
            {contentItems.map((item, idx) => (
              <button 
                key={idx} 
                onClick={item.action}
                className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
              >
                <div className="p-2 rounded-xl border border-white/5 bg-white/5 group-hover:bg-[#ff0071]/10 transition-colors">
                  <item.icon className="h-4 w-4 text-slate-500 group-hover:text-[#ff0071] transition-colors" />
                </div>
                <span className="text-[11px] font-black text-slate-300 group-hover:text-white lowercase">{item.label}</span>
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
