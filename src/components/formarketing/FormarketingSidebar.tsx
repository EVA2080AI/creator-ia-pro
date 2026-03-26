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
       toast.info("Injecting Landing App Structure...");
       const template = {
         title: 'Landing App',
         nodes: [
           { type: 'characterBreakdown', data: { title: 'Value Prop', description: 'Core product definition...' } },
           { type: 'layoutBuilder', data: { title: 'Web Wireframe', platform: 'web' } }
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
    { label: 'Creative Copy', icon: Type, type: 'characterBreakdown', color: 'text-aether-purple', bg: 'bg-aether-purple/5', description: 'AI persona & narrative' },
    { label: 'Flux Vision', icon: Image, type: 'modelView', color: 'text-white', bg: 'bg-white/10', description: 'HQ image generation' },
    { label: 'Cinema Motion', icon: Video, type: 'videoModel', color: 'text-aether-blue', bg: 'bg-aether-blue/5', description: 'Neural video production' },
    { label: 'Layout Arch', icon: LayoutTemplate, type: 'layoutBuilder', color: 'text-white/40', bg: 'bg-white/5', description: 'Digital structure design' },
    { label: 'Campaign Hub', icon: Share2, type: 'campaignManager', color: 'text-rose-400', bg: 'bg-rose-400/5', description: 'Omnichannel distribution' },
    { label: 'System Bridge', icon: Rocket, type: 'antigravityBridge', color: 'text-white', bg: 'bg-white/20', description: 'Quantum node sync' },
  ].filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const toolbarIcons = [
    { icon: Hand, id: 'hand', label: 'Pan' },
    { icon: Scissors, id: 'scissors', label: 'Cut' },
    { icon: Square, id: 'square', label: 'Selection' },
    { icon: MessageSquare, id: 'message', label: 'Notes' },
    { icon: Undo, id: 'undo', label: 'Undo' },
    { icon: Redo, id: 'redo', label: 'Redo' },
    { icon: Settings, id: 'settings', label: 'Core Config' }
  ];

  return (
    <div className="absolute left-6 top-28 z-10 flex gap-6 animate-fade-in items-start h-[calc(100vh-160px)] pointer-events-none">
      
      {/* Aether Vertical Toolbar */}
      <div className="flex flex-col items-center gap-2 aether-card w-14 py-6 shadow-2xl backdrop-blur-3xl shrink-0 h-fit pointer-events-auto rounded-[2rem] border border-white/[0.08]">
        {/* Menu Toggle */}
        <button 
           onClick={() => setMenuOpen(!menuOpen)}
           className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-500 scale-110 mb-2 ${menuOpen ? 'bg-white text-black shadow-xl shadow-white/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'}`}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
        
        <div className="w-8 h-px bg-white/10 my-3" />

        {/* Action Button */}
        <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aether-purple/20 text-aether-purple shadow-xl hover:bg-aether-purple/30 transition-all group/play border border-aether-purple/20">
              <Play className="h-5 w-5 fill-current ml-0.5 group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Execute Flow</TooltipContent>
        </Tooltip>

        {/* Toolset */}
        {toolbarIcons.map((tool, i) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <button 
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-white/20 hover:bg-white/5 hover:text-white transition-all group ${tool.id === 'settings' ? 'mt-4 border-t border-white/5 pt-4 rounded-none w-8' : ''}`}
              >
                <tool.icon className={`h-4.5 w-4.5 group-hover:scale-110 transition-transform ${tool.id === 'settings' ? 'mt-4' : ''}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}
        </TooltipProvider>
      </div>

      {/* Aether Navigation Menu */}
      {menuOpen && (
        <div className="w-80 rounded-[2.5rem] aether-card p-7 shadow-4xl backdrop-blur-3xl flex flex-col gap-8 max-h-[85vh] overflow-y-auto no-scrollbar animate-in slide-in-from-left-6 duration-700 pointer-events-auto border border-white/[0.08]">
          
          {/* Neural Search */}
          <div className="relative mb-0 font-display">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
            <Input 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search nodes..." 
               className="pl-12 bg-white/[0.03] border-white/10 focus:border-aether-purple/40 rounded-2xl h-12 text-xs font-medium text-white placeholder:text-white/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Generation Modules</h3>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <span className="text-[10px] text-white/20 font-bold tabular-nums">/{menuItems.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <TemplateModal 
                 onSelect={(template) => {
                   toast.success(`Active_Pack: ${template.title}`);
                   const event = new CustomEvent('add-template', { detail: template });
                   window.dispatchEvent(event);
                 }} 
                 trigger={
                     <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-aether-purple/30 hover:bg-aether-purple/5 transition-all group/btn shadow-inner">
                        <div className="p-3 rounded-2xl bg-white/5 group-hover/btn:scale-110 group-hover/btn:bg-aether-purple/20 transition-all">
                           <Zap className="h-5 w-5 text-aether-purple fill-current opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-bold text-center text-white/40 group-hover/btn:text-white/80 uppercase tracking-widest leading-none font-display">Ads Packs</span>
                     </button>
                 }
               />
               <button 
                  onClick={() => handleAddTemplate('landingPack')}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-aether-blue/30 hover:bg-aether-blue/5 transition-all group/btn shadow-inner"
               >
                  <div className="p-3 rounded-2xl bg-white/5 group-hover/btn:scale-110 group-hover/btn:bg-aether-blue/20 transition-all">
                    <Rocket className="h-5 w-5 text-aether-blue fill-current opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-bold text-center text-white/40 group-hover/btn:text-white/80 uppercase tracking-widest leading-none font-display">Landing V1</span>
               </button>
            </div>
          </div>

          {/* Node Selector */}
          <div className="flex flex-col gap-3">
             {menuItems.map((item, idx) => (
                <button 
                  key={idx}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type, item.label)}
                  onClick={() => onAddNode(item.type, item.label)}
                  className="flex w-full gap-4 rounded-3xl border border-white/[0.03] bg-white/[0.01] items-center p-4 cursor-pointer hover:bg-white/[0.05] hover:border-white/10 hover:scale-[1.02] transition-all group/item overflow-hidden relative"
                >
                    <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 bg-white/5 border border-white/5 group-hover/item:border-white/20 transition-all shadow-inner`}>
                    <item.icon className={`h-5 w-5 text-white/40 group-hover/item:text-white transition-colors`} />
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
                  <span className="text-[10px] font-bold text-white/60 group-hover:text-white uppercase tracking-widest font-display">Local Asset</span>
                  <span className="text-[9px] text-white/20">Upload from device</span>
                </div>
              </button>
           </div>

          {/* Footer Metrics */}
          <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-white/10 tracking-[0.3em] font-display">
            <span>AETHER_SYSTEM_SYNC</span>
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
