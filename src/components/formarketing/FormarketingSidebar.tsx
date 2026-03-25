import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { 
  Search, Clock, LayoutGrid, LayoutTemplate, Image, Video, 
  Music, Type, PenTool, Sparkles, Maximize, List, Upload, Folder
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function FormarketingSidebar() {
  const [search, setSearch] = useState('');
  const { addNodes, project } = useReactFlow();

  const handleAddNode = (type: string, title: string) => {
    // Generate a slightly random drop position in the center
    const x = Math.random() * 200 + 100;
    const y = Math.random() * 200 + 100;
    
    // In xyflow/react v12, project() converts screen to flow coords
    const position = project({ x, y });
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
      type,
      position,
      data: defaultData,
    });
  };

  const menuItems = [
    { label: 'Texto', icon: Type, type: 'characterBreakdown', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Generar imagen', icon: Image, type: 'modelView', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Generar vídeo', icon: Video, type: 'videoModel', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Asistente', icon: Sparkles, type: 'characterBreakdown', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Mejorar imagen', icon: Maximize, type: 'modelView', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Lista', icon: List, type: 'characterBreakdown', color: 'text-muted-foreground', bg: 'bg-muted' }
  ];

  const contentItems = [
    { label: 'Subir', icon: Upload },
    { label: 'Recursos', icon: Folder },
    { label: 'Stock', icon: Search }
  ];

  const topIcons = [Clock, LayoutGrid, LayoutTemplate, Image, Video, Music, Type, PenTool];

  return (
    <div className="absolute left-6 top-24 z-10 w-72 rounded-2xl border border-white/10 bg-[#161616]/95 p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-4 animate-fade-in">
      
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
        {topIcons.map((Icon, idx) => (
          <button key={idx} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Basic Menu */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">Básicos</h3>
        {menuItems.map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => handleAddNode(item.type, item.label)}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <div className={`p-1.5 rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Content Menu */}
      <div className="flex flex-col gap-1 mt-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">Contenido</h3>
        {contentItems.map((item, idx) => (
          <button 
            key={idx} 
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
  );
}
