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
    { label: 'copywriting_ai', icon: Type, type: 'characterBreakdown', color: 'text-white/50', bg: 'bg-white/5', description: 'persuasive neural copy' },
    { label: 'imagen_flux_hq', icon: Image, type: 'modelView', color: 'text-white', bg: 'bg-white/10', description: 'industrial hq generation' },
    { label: 'avatar_engine', icon: Video, type: 'videoModel', color: 'text-white/70', bg: 'bg-white/5', description: 'neural video campaign' },
    { label: 'web_structure', icon: LayoutTemplate, type: 'layoutBuilder', color: 'text-white/40', bg: 'bg-white/5', description: 'design web structures' },
    { label: 'social_distrib', icon: Share2, type: 'campaignManager', color: 'text-slate-500', bg: 'bg-white/[0.02]', description: 'distribution engine' },
    { label: 'nexus_bridge', icon: Rocket, type: 'antigravityBridge', color: 'text-white', bg: 'bg-white/20', description: 'ecosystem cloning' },
  ].filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) && 
    (activeCategory === null || (activeCategory === 6 && item.icon === Type) || (activeCategory === 3 && item.icon === Image) || (activeCategory === 4 && item.icon === Video))
  );

  const plantillas = [
    { label: 'Meta Ads Pack', icon: Sparkles, type: 'metaPack', color: 'text-white/50', bg: 'bg-white/5' },
    { label: 'Landing App Structure', icon: LayoutGrid, type: 'landingPack', color: 'text-white/50', bg: 'bg-white/5' }
  ];

  const contentItems = [
    { label: 'Upload', icon: Upload, action: handleFileUpload },
    { label: 'Assets', icon: Folder },
    { label: 'Search', icon: Search }
  ].filter(item => item.label.toLowerCase().includes(search.toLowerCase()));

  const topIcons = [
    { icon: Clock, id: 0, title: 'History' }, 
    { icon: LayoutGrid, id: 1, title: 'Canvas' }, 
    { icon: LayoutTemplate, id: 2, title: 'Templates' }, 
    { icon: Image, id: 3, title: 'Images' }, 
    { icon: Video, id: 4, title: 'Videos' }, 
    { icon: Music, id: 5, title: 'Audio' }, 
    { icon: Type, id: 6, title: 'Text' }, 
    { icon: PenTool, id: 7, title: 'Design' }
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
      
      {/* Industrial Monochrome Toolbar */}
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-[#0a0a0b]/95 w-[48px] py-4 shadow-3xl backdrop-blur-xl shrink-0 h-fit pointer-events-auto">
        {/* Menu Toggle */}
        <button 
           onClick={() => setMenuOpen(!menuOpen)}
           className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${menuOpen ? 'bg-white text-black shadow-xl shadow-white/5' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
        
        <div className="w-8 h-px bg-white/5 my-2" />

        {/* Action Button */}
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50 shadow-xl hover:bg-white/10 hover:text-white transition-all group/play border border-white/5">
          <Play className="h-4 w-4 fill-white/20 text-white/40 ml-0.5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Toolset */}
        {toolbarIcons.map((Tool, i) => (
          <button 
            key={i} 
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-white/20 hover:bg-white/5 hover:text-white transition-all group ${Tool.id === 'settings' ? 'mt-4 border-t border-white/5 pt-4' : ''}`}
          >
            <Tool.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>

      {/* Industrial Navigation Menu */}
      {menuOpen && (
        <div className="w-72 rounded-[2rem] border border-white/5 bg-[#0a0a0b]/95 p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col gap-6 max-h-[85vh] overflow-y-auto no-scrollbar animate-in slide-in-from-left-4 duration-500 pointer-events-auto border-t border-white/10">
          
          {/* Neural Search */}
          <div className="relative mb-0 border-b border-white/5 pb-4">
            <Search className="absolute left-4 top-4 h-4 w-4 text-white/10" />
            <Input 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="search_neural_tools..." 
               className="pl-12 bg-white/[0.02] border-white/5 focus:border-white/20 rounded-xl h-11 text-[11px] font-bold text-white placeholder:text-white/10 transition-all uppercase tracking-tighter"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Flow_Nodes</h3>
                <span className="text-[10px] text-white/10 font-medium">[{menuItems.length}]</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <TemplateModal 
                 onSelect={(template) => {
                   toast.success(`Injected_Pack: ${template.title}`);
                   const event = new CustomEvent('add-template', { detail: template });
                   window.dispatchEvent(event);
                 }} 
                 trigger={
                     <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group/btn shadow-sm">
                        <div className="p-2 rounded-xl bg-white/10 group-hover/btn:scale-110 transition-all">
                           <Zap className="h-4 w-4 text-white/70" />
                        </div>
                        <span className="text-[9px] font-black text-center text-white/40 uppercase tracking-widest leading-none">ads_packs</span>
                     </button>
                 }
               />
               <button 
                  onClick={() => handleAddTemplate('landingPack')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/btn shadow-sm"
               >
                  <div className="p-2 rounded-xl bg-white/10 group-hover/btn:scale-110 transition-all">
                    <Rocket className="h-4 w-4 text-white/70" />
                  </div>
                  <span className="text-[9px] font-black text-center text-white/40 uppercase tracking-widest leading-none">landing_v1</span>
               </button>
            </div>
          </div>

          {/* Core Logic Selector */}
          <TooltipProvider>
            <div className="flex flex-col gap-2">
              <p className="text-center text-[8px] font-black text-white/5 tracking-[0.4em] uppercase mt-2 mb-4">
                Nexus_System_V3.1
              </p>
             {menuItems.map((item, idx) => (
               <div key={idx} className="group/item relative">
                 <Tooltip>
                   <TooltipTrigger asChild>
                       <button 
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type, item.label)}
                        onClick={() => onAddNode(item.type, item.label)}
                        className="flex w-full gap-4 rounded-2xl border border-white/5 bg-white/[0.01] items-center p-3 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all text-white/40 hover:text-white"
                      >
                          <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/5 group-hover/item:border-white/20 transition-colors`}>
                          <item.icon className={`h-4 w-4 text-white/50 group-hover/item:text-white transition-colors`} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors uppercase tracking-tight">{item.label}</span>
                          <span className="text-[9px] font-medium text-white/10 leading-tight group-hover:text-white/30 transition-colors">{item.description}</span>
                        </div>
                      </button>
                   </TooltipTrigger>
                   <TooltipContent side="right" className="bg-black border border-white/10 text-[10px] font-bold max-w-[200px] p-3 text-white rounded-xl shadow-3xl">
                     {item.description.toUpperCase()}
                   </TooltipContent>
                 </Tooltip>
               </div>
             ))}
           </div>
         </TooltipProvider>

         {/* Industrial Content */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] px-2 mb-2">neural_assets</h3>
            {contentItems.map((item, idx) => (
              <button 
                key={idx} 
                onClick={item.action}
                className="flex items-center gap-4 w-full p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
              >
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] group-hover:bg-white/5 transition-colors">
                  <item.icon className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
                <span className="text-[10px] font-bold text-white/30 group-hover:text-white/80 lowercase uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Industrial Metric Footer */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5 text-[9px] uppercase font-black text-white/5 tracking-[0.3em] px-2">
            <span className="">ENGINE_V3</span>
            <div className="flex gap-4">
               <span className="hover:text-white transition-colors cursor-pointer">INFO</span>
               <span className="hover:text-white transition-colors cursor-pointer">AUDIT</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
