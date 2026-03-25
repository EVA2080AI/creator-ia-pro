import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { 
  Search, Clock, LayoutGrid, LayoutTemplate, Image, Video, 
  Music, Type, PenTool, Sparkles, Maximize, List, Upload, Folder,
  X, Play, Hand, Scissors, Square, MessageSquare, Undo, Redo, Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const handleAddNode = (type: string, title: string, assetUrl?: string) => {
    // Generate a slightly random drop position in the center
    const x = Math.random() * 200 + 100;
    const y = Math.random() * 200 + 100;
    
    // In xyflow/react v12, project() was replaced by screenToFlowPosition
    const position = screenToFlowPosition({ x, y });
    const newNodeId = `${type}-${Date.now()}`;

    let defaultData = {};
    if (type === 'characterBreakdown') {
      defaultData = { title: title || 'Nuevo Personaje', description: 'Describe tu personaje aquí...' };
    } else if (type === 'modelView') {
      defaultData = { title: title || 'Nueva Imagen', prompt: 'Describe la escena...' };
    } else if (type === 'videoModel') {
      defaultData = { title: title || 'Nuevo Video', status: 'pending', duration: '00:00' };
    }

    addNodes({
      id: newNodeId,
      type: type === 'uiNode' ? 'uiNode' : 'aiNode', // Consistency with Canvas.tsx
      position,
      data: {
        ...defaultData,
        assetUrl: assetUrl || null,
        status: assetUrl ? 'ready' : 'loading',
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
    { label: 'Copywriting AI', icon: Type, type: 'characterBreakdown', color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Genera textos persuasivos' },
    { label: 'Imagen Flux HQ', icon: Image, type: 'modelView', color: 'text-indigo-500', bg: 'bg-indigo-500/10', description: 'Generación industrial' },
    { label: 'Avatar de Marca', icon: Video, type: 'videoModel', color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Video con IA' },
    { label: 'Asistente Estratégico', icon: Sparkles, type: 'characterBreakdown', color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Análisis de mercado' },
    { label: 'Upscale & Finish', icon: Maximize, type: 'modelView', color: 'text-indigo-500', bg: 'bg-indigo-500/10', description: 'Alta resolución' },
    { label: 'Guión de Venta', icon: List, type: 'characterBreakdown', color: 'text-muted-foreground', bg: 'bg-muted', description: 'Estructura de video' }
  ].filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) && 
    (activeCategory === null || (activeCategory === 6 && item.icon === Type) || (activeCategory === 3 && item.icon === Image) || (activeCategory === 4 && item.icon === Video))
  );

  const contentItems = [
    { label: 'Subir', icon: Upload, action: handleFileUpload },
    { label: 'Recursos', icon: Folder },
    { label: 'Stock', icon: Search }
  ].filter(item => item.label.toLowerCase().includes(search.toLowerCase()));

  const topIcons = [
    { icon: Clock, id: 0 }, 
    { icon: LayoutGrid, id: 1 }, 
    { icon: LayoutTemplate, id: 2 }, 
    { icon: Image, id: 3 }, 
    { icon: Video, id: 4 }, 
    { icon: Music, id: 5 }, 
    { icon: Type, id: 6 }, 
    { icon: PenTool, id: 7 }
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
      
      {/* Vertical Pill Toolbar */}
      <div className="flex flex-col items-center gap-2 rounded-[2rem] border border-white/10 bg-[#161616]/95 w-[56px] py-4 shadow-2xl backdrop-blur-xl shrink-0 h-fit pointer-events-auto">
        {/* Close/Menu Toggle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground transition-all mb-2"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </button>
        
        {/* Play (Active) */}
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-2 hover:scale-105 transition-transform">
          <Play className="h-5 w-5 fill-current ml-1" />
        </button>

        {/* Other Tools */}
        {toolbarIcons.map((Tool, i) => (
          <button 
            key={i} 
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors ${Tool.id === 'settings' ? 'mt-4' : ''}`}
          >
            <Tool.icon className="h-[18px] w-[18px]" />
          </button>
        ))}
      </div>

      {/* Expanded Context Menu */}
      {menuOpen && (
        <div className="w-76 rounded-2xl border border-white/10 bg-[#161616]/95 p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-4 max-h-full overflow-y-auto scrollbar-none animate-in slide-in-from-left-4 fade-in duration-200 pointer-events-auto">
          
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
      <div className="flex items-center justify-between px-1 overflow-x-auto pb-2 scrollbar-none gap-2">
        {topIcons.map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeCategory === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'}`}
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Basic Menu */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">Básicos</h3>
        {menuItems.map((item, idx) => (
          <button 
            key={idx} 
            draggable
            onDragStart={(e) => onDragStart(e, item.type, item.label)}
            onClick={() => handleAddNode(item.type, item.label)}
            className="flex flex-col gap-1 w-full p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bg} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground/90 group-hover:text-foreground">{item.label}</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80 lowercase">{item.description}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

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
