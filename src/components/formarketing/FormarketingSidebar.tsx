import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Search, LayoutGrid, Image, Video,
  Type, Sparkles, Upload,
  X, Play, Hand, Scissors, Square, MessageSquare, Undo, Redo, Settings, Share2, Rocket,
  Braces, Brain, Download, FileOutput, ChevronDown,
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

interface NodeDef {
  label: string;
  icon: React.ElementType;
  type: string;
  color: string;
  description: string;
}

interface Category {
  id: string;
  label: string;
  nodes: NodeDef[];
}

const CATEGORIES: Category[] = [
  {
    id: 'entrada',
    label: 'Entrada',
    nodes: [
      { label: 'Texto libre',     icon: Type,          type: 'textInput',          color: '#facc15', description: 'Entrada de texto libre' },
      { label: 'Personaje',       icon: Braces,         type: 'characterBreakdown', color: '#a78bfa', description: 'Identidad de persona / marca' },
      { label: 'Prompt Builder',  icon: Braces,         type: 'promptBuilder',      color: '#fb923c', description: 'Prompts con variables {{var}}' },
    ],
  },
  {
    id: 'ia',
    label: 'IA Generativa',
    nodes: [
      { label: 'LLM · Texto IA',  icon: Brain,          type: 'llmNode',            color: '#60a5fa', description: 'Genera texto con modelos de IA' },
      { label: 'Imagen IA',       icon: Image,          type: 'modelView',          color: '#8AB4F8', description: 'Imágenes con modelos de difusión' },
      { label: 'Video IA',        icon: Video,          type: 'videoModel',         color: '#f472b6', description: 'Videos generados con IA' },
      { label: 'Caption IA',      icon: MessageSquare,  type: 'captionNode',        color: '#34d399', description: 'Captions para redes sociales' },
    ],
  },
  {
    id: 'flujo',
    label: 'Flujo & Distribución',
    nodes: [
      { label: 'Layout Builder',  icon: LayoutGrid,     type: 'layoutBuilder',      color: 'rgba(255,255,255,0.5)', description: 'Estructura visual del diseño' },
      { label: 'Campaign Mgr',    icon: Share2,         type: 'campaignManager',    color: '#f87171', description: 'Distribución omnicanal' },
      { label: 'Exportar',        icon: FileOutput,     type: 'exportNode',         color: '#34d399', description: 'Exporta resultados del flujo' },
      { label: 'Conector',        icon: Rocket,         type: 'antigravityBridge',  color: 'rgba(255,255,255,0.6)', description: 'Sincroniza módulos' },
    ],
  },
];

export function FormarketingSidebar({ onAddNode }: { onAddNode: (type: string, label: string, assetUrl?: string) => void }) {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => { onAddNode('modelView', 'imagen_subida', reader.result as string); };
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

  const toggleCategory = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter nodes by search
  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.nodes.length > 0);

  const totalNodes = CATEGORIES.reduce((s, c) => s + c.nodes.length, 0);

  const toolbarIcons = [
    { icon: Hand,        id: 'hand',     label: 'Mover' },
    { icon: Scissors,    id: 'scissors', label: 'Cortar' },
    { icon: Square,      id: 'square',   label: 'Seleccionar' },
    { icon: MessageSquare, id: 'message', label: 'Notas' },
    { icon: Undo,        id: 'undo',     label: 'Deshacer' },
    { icon: Redo,        id: 'redo',     label: 'Rehacer' },
    { icon: Settings,    id: 'settings', label: 'Configuración' },
  ];

  return (
    <div className="flex h-full shrink-0 border-r border-white/[0.04] z-20">

      {/* Vertical Toolbar */}
      <div className="flex flex-col items-center gap-2 w-14 py-4 bg-[#222228]/90 backdrop-blur-xl">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 mb-1 ${menuOpen ? 'bg-white text-black shadow-xl shadow-white/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'}`}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </button>

        <div className="w-8 h-px bg-white/10 my-1" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-2xl bg-aether-purple/20 text-aether-purple hover:bg-aether-purple/30 transition-all group/play border border-aether-purple/20">
                <Play className="h-4 w-4 fill-current ml-0.5 group-hover:scale-110 transition-transform" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Ejecutar flujo</TooltipContent>
          </Tooltip>

          {toolbarIcons.map(tool => (
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

      {/* Slide-in Panel */}
      {menuOpen && (
        <div className="w-72 flex flex-col bg-[#050506] border-l border-white/[0.04] overflow-y-auto no-scrollbar animate-in slide-in-from-left duration-200">

          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Módulos</span>
              <span className="text-[10px] text-white/20 font-bold tabular-nums">{totalNodes} nodos</span>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar nodos..."
                className="pl-9 pr-8 bg-white/[0.04] border-white/[0.07] focus:border-white/20 rounded-xl h-9 text-[11px] text-white placeholder:text-white/20 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Templates CTA */}
          <div className="px-4 pt-3 pb-2">
            <TemplateModal
              onSelect={handleSelectTemplate}
              trigger={
                <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-aether-purple/30 hover:bg-aether-purple/[0.06] transition-all group/tpl">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.05] group-hover/tpl:bg-aether-purple/20 transition-colors shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-aether-purple" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-white/60 group-hover/tpl:text-white/90 transition-colors">Ver plantillas</p>
                    <p className="text-[9px] text-white/20">Flujos pre-armados</p>
                  </div>
                </button>
              }
            />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-1 px-3 pb-3">
            {filteredCategories.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Search className="h-5 w-5 text-white/10" />
                <span className="text-[11px] text-white/20">Sin resultados para <span className="text-white/40">"{search}"</span></span>
                <button onClick={() => setSearch('')} className="text-[10px] text-aether-purple/60 hover:text-aether-purple font-bold uppercase tracking-widest">Limpiar</button>
              </div>
            )}

            {filteredCategories.map(cat => {
              const isCollapsed = collapsed[cat.id];
              return (
                <div key={cat.id} className="mt-2">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 mb-1.5 group/cat"
                  >
                    <span className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em] group-hover/cat:text-white/50 transition-colors">{cat.label}</span>
                    <ChevronDown className={`h-3 w-3 text-white/20 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>

                  {/* Nodes grid */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-1.5">
                      {cat.nodes.map((node, idx) => (
                        <button
                          key={idx}
                          draggable
                          onDragStart={e => onDragStart(e, node.type, node.label)}
                          onClick={() => onAddNode(node.type, node.label)}
                          className="flex w-full gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] items-center px-3.5 py-3 cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.12] hover:scale-[1.01] transition-all group/item"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-all group-hover/item:scale-105"
                            style={{ background: `${node.color}15`, border: `1px solid ${node.color}30` }}>
                            <node.icon className="h-4 w-4" style={{ color: node.color }} />
                          </div>
                          <div className="flex flex-col text-left min-w-0">
                            <span className="text-[11px] font-bold text-white/80 group-hover/item:text-white transition-colors truncate">{node.label}</span>
                            <span className="text-[9px] text-white/25 group-hover/item:text-white/40 transition-colors truncate">{node.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload + Footer */}
          <div className="mt-auto px-3 pb-4 pt-2 border-t border-white/[0.05]">
            <button
              onClick={handleFileUpload}
              className="flex items-center gap-3 w-full px-3.5 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] group-hover:bg-white/[0.07] transition-colors shrink-0">
                <Upload className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-white/50 group-hover:text-white uppercase tracking-widest">Subir imagen</span>
                <span className="text-[9px] text-white/20">Drag & drop o clic aquí</span>
              </div>
            </button>

            <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-white/10 tracking-[0.2em]">
              <span>Creator IA Pro</span>
              <span className="hover:text-white/40 transition-colors cursor-pointer">LOGS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
