import { useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Search, LayoutGrid, Image, Video,
  Type, Sparkles, Upload,
  X, Hand, MessageSquare, Settings, Share2, Rocket,
  Braces, Brain, FileOutput, ChevronDown,
  Text, Wand2, Download, Layers, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TemplateModal } from './TemplateModal';
import { type Template } from '@/lib/templates';
import { NODE_META, getNodesByCategory } from './nodeConnections';

interface FormarketingSidebarProps {
  onAddNode: (type: string, label: string, assetUrl?: string) => void;
}

// Map node types to icons
const NODE_ICONS: Record<string, React.ElementType> = {
  textInput: Type,
  characterBreakdown: Braces,
  promptBuilder: Wand2,
  llmNode: Brain,
  modelView: Image,
  videoModel: Video,
  captionNode: MessageSquare,
  layoutBuilder: LayoutGrid,
  campaignManager: Share2,
  exportNode: FileOutput,
  antigravityBridge: Rocket,
};

// Category labels
const CATEGORY_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  input: { label: 'Entrada de Datos', emoji: '📝', description: 'Fuentes de texto, contexto y prompts' },
  process: { label: 'Procesamiento IA', emoji: '🤖', description: 'Transforman datos usando IA' },
  output: { label: 'Salida', emoji: '📤', description: 'Exportación y distribución final' },
  bridge: { label: 'Conectores', emoji: '🔗', description: 'Integración con sistemas externos' },
};

export function FormarketingSidebar({ onAddNode }: FormarketingSidebarProps) {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ output: true, bridge: true });
  const [templateOpen, setTemplateOpen] = useState(false);

  // Global listener to open templates
  useEffect(() => {
    const handleOpen = () => setTemplateOpen(true);
    window.addEventListener('open-template-modal', handleOpen);
    return () => window.removeEventListener('open-template-modal', handleOpen);
  }, []);

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
    window.dispatchEvent(new CustomEvent('add-template', { detail: template }));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.dropEffect = 'move';
  };

  const toggleCategory = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  // Get nodes organized by category
  const nodesByCategory = getNodesByCategory('input')
    .concat(getNodesByCategory('process'))
    .concat(getNodesByCategory('output'))
    .concat(getNodesByCategory('bridge'));

  // Group by category
  const groupedNodes = nodesByCategory.reduce((acc, [type, meta]) => {
    if (!acc[meta.category]) acc[meta.category] = [];
    acc[meta.category].push({ type, meta });
    return acc;
  }, {} as Record<string, Array<{ type: string; meta: typeof NODE_META[string] }>>);

  // Filter by search
  const filteredCategories = Object.entries(groupedNodes)
    .map(([category, nodes]) => ({
      category,
      nodes: nodes.filter(({ meta }) =>
        meta.label.toLowerCase().includes(search.toLowerCase()) ||
        meta.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(({ nodes }) => nodes.length > 0);

  const totalNodes = Object.values(groupedNodes).flat().length;

  return (
    <div className="flex h-full shrink-0 border-r border-zinc-200 z-20">
      {/* Vertical Toolbar */}
      <div className="flex flex-col items-center gap-2 w-14 py-4 bg-white/95 backdrop-blur-xl border-r border-zinc-200/60">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 mb-1 ${
            menuOpen
              ? 'bg-zinc-900 text-white shadow-md'
              : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200'
          }`}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </button>

        <div className="w-8 h-px bg-zinc-100 my-1" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all group">
                <Hand className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Mover canvas</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all group mt-auto border-t border-zinc-100 pt-3 rounded-none w-8">
                <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Configuración</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Slide-in Panel */}
      {menuOpen && (
        <div className="w-80 flex flex-col bg-zinc-50/50 border-l border-zinc-200/60 overflow-y-auto no-scrollbar animate-in slide-in-from-left duration-200">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">Canvas IA</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold tabular-nums bg-zinc-100 px-2 py-0.5 rounded-full">
                {totalNodes} nodos
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar nodos..."
                className="pl-9 pr-8 bg-zinc-50/80 border-zinc-200/60 focus:border-primary/30 rounded-xl h-9 text-[11px] text-zinc-900 placeholder:text-zinc-400 transition-all shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Templates CTA */}
          <div className="px-4 pt-3 pb-2">
            <TemplateModal
              open={templateOpen}
              onOpenChange={setTemplateOpen}
              onSelect={handleSelectTemplate}
              trigger={
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all group/tpl shadow-sm active:scale-95">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md group-hover/tpl:bg-primary group-hover/tpl:text-white transition-all shrink-0">
                    <Sparkles className="h-4 w-4 text-primary group-hover/tpl:text-white transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-[12px] font-bold text-primary group-hover/tpl:text-primary transition-colors">Plantillas</p>
                    <p className="text-[10px] text-zinc-500">Acelera tu flujo creativo</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 ml-auto group-hover/tpl:translate-x-0.5 transition-transform" />
                </button>
              }
            />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2 px-3 pb-3">
            {filteredCategories.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Search className="h-5 w-5 text-zinc-300" />
                <span className="text-[11px] text-zinc-400">
                  Sin resultados para <span className="text-zinc-600 font-medium">"{search}"</span>
                </span>
                <button
                  onClick={() => setSearch('')}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}

            {filteredCategories.map(({ category, nodes }) => {
              const isCollapsed = collapsed[category];
              const catInfo = CATEGORY_LABELS[category];
              if (!catInfo) return null;

              return (
                <div key={category} className="mt-1">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-2 py-2 mb-1 group/cat hover:bg-zinc-100/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{catInfo.emoji}</span>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider block">
                          {catInfo.label}
                        </span>
                        <span className="text-[9px] text-zinc-400">{catInfo.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400 font-medium">{nodes.length}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Nodes grid */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-1.5 pl-2">
                      {nodes.map(({ type, meta }) => {
                        const Icon = NODE_ICONS[type] || Layers;
                        return (
                          <button
                            key={type}
                            draggable
                            onDragStart={e => onDragStart(e, type, meta.label)}
                            onClick={() => onAddNode(type, meta.label)}
                            className="flex w-full gap-3 rounded-xl border border-zinc-200 bg-white items-center px-3 py-2.5 cursor-pointer hover:border-primary/30 hover:shadow-md hover:-translate-y-px transition-all group/item shadow-sm active:scale-95"
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-transform group-hover/item:scale-110"
                              style={{
                                backgroundColor: `${meta.color}15`,
                                border: `1px solid ${meta.color}30`,
                              }}
                            >
                              <Icon className="h-4 w-4" style={{ color: meta.color }} />
                            </div>
                            <div className="flex flex-col text-left min-w-0 flex-1">
                              <span className="text-[12px] font-semibold text-zinc-800 group-hover/item:text-primary transition-colors truncate">
                                {meta.emoji} {meta.label}
                              </span>
                              <span className="text-[10px] text-zinc-400 truncate">
                                {meta.description}
                              </span>
                              {/* Connection indicators */}
                              <div className="flex items-center gap-2 mt-1">
                                {meta.inputHandles.length > 0 && (
                                  <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                    {meta.inputHandles.length} entrada{meta.inputHandles.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {meta.outputHandles.length > 0 && (
                                  <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                    {meta.outputHandles.length} salida{meta.outputHandles.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {meta.inputHandles.length === 0 && meta.outputHandles.length === 0 && (
                                  <span className="text-[9px] text-zinc-400">Sin conexiones</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload + Footer */}
          <div className="mt-auto px-3 pb-4 pt-2 border-t border-zinc-200 bg-white">
            <button
              onClick={handleFileUpload}
              className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 transition-all group shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white group-hover:bg-zinc-50 transition-colors shrink-0">
                <Upload className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold text-zinc-700 group-hover:text-zinc-900">
                  Subir imagen
                </span>
                <span className="text-[10px] text-zinc-400">Drag & drop o clic aquí</span>
              </div>
            </button>

            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[9px] font-medium text-zinc-400">
                Creator IA Pro v21.0
              </span>
              <span className="text-[9px] text-primary font-medium cursor-pointer hover:underline">
                Ver logs
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
