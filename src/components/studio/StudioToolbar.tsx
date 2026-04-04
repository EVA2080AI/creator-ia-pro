import {
  Undo2, Redo2, Grid3X3, LayoutDashboard, Trash2, 
  Download, Play, Plus, Sparkles, Monitor, Magnet,
  ChevronDown, Search, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudioToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleSnap: () => void;
  snapEnabled: boolean;
  onLayout: () => void;
  onClear: () => void;
  onExport: () => void;
  onExecute: () => void;
  execStatus: 'idle' | 'running' | 'success' | 'error';
  onAddNode: () => void; // Opens command palette
  onOpenTemplates: () => void;
  spaceName?: string;
  onBack?: () => void;
}

export function StudioToolbar({
  onUndo, onRedo, canUndo, canRedo,
  onToggleSnap, snapEnabled,
  onLayout, onClear,
  onExport, onExecute, execStatus,
  onAddNode, onOpenTemplates,
  spaceName = "Proyecto sin nombre",
  onBack
}: StudioToolbarProps) {

  const ButtonGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex items-center gap-1 px-1", className)}>
      {children}
    </div>
  );

  const Divider = () => <div className="w-px h-6 bg-zinc-200/60 mx-1" />;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center bg-white/80 backdrop-blur-2xl border border-zinc-200/80 rounded-2xl p-1.5 shadow-2xl shadow-zinc-200/40 animate-in fade-in zoom-in-95 duration-500 ring-1 ring-black/5">
        
        {/* Section 1: Navigation & Title */}
        <div className="flex items-center gap-3 pl-3 pr-4 border-r border-zinc-100">
          <button 
            onClick={onBack}
            className="group flex h-8 w-8 items-center justify-center rounded-xl hover:bg-zinc-100 transition-all active:scale-95 border border-transparent hover:border-zinc-200/60"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-500 group-hover:text-zinc-900" />
          </button>
          
          <div className="flex flex-col -space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] font-display">Studio Flow</span>
            </div>
            <span className="text-[12px] font-bold text-zinc-900 truncate max-w-[120px] font-display">{spaceName}</span>
          </div>
        </div>

        {/* Section 2: Creation */}
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onAddNode}
                className="flex h-9 px-3 items-center gap-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 font-display text-[11px] font-black uppercase tracking-widest"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Nodo</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-display font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 bg-zinc-900 border-zinc-800 text-white translate-y-2">Nuevo Módulo (Space)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onOpenTemplates}
                className="group flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-primary transition-all border border-transparent hover:border-zinc-200/60"
              >
                <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-display font-medium text-[11px] translate-y-2">Plantillas Pro</TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <Divider />

        {/* Section 3: History */}
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                disabled={!canUndo}
                onClick={onUndo}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all border border-transparent",
                  canUndo ? "text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200/60 hover:text-zinc-900" : "text-zinc-200 cursor-not-allowed"
                )}
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium text-[11px] translate-y-2">Deshacer (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                disabled={!canRedo}
                onClick={onRedo}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all border border-transparent",
                  canRedo ? "text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200/60 hover:text-zinc-900" : "text-zinc-200 cursor-not-allowed"
                )}
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium text-[11px] translate-y-2">Rehacer (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <Divider />

        {/* Section 4: Tools */}
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onToggleSnap}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all border",
                  snapEnabled 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "text-zinc-500 hover:bg-zinc-100 border-transparent hover:border-zinc-200/60 hover:text-zinc-900"
                )}
              >
                <Magnet className={cn("h-4 w-4 transition-transform", snapEnabled && "scale-110")} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium text-[11px] translate-y-2">Snap Grid (Ajustar Rejilla)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onLayout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-200/60"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium text-[11px] translate-y-2">Organizar Nodos (Auto-Layout)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onClear}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-200/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium text-[11px] translate-y-2 text-rose-500">Limpiar Todo</TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <Divider />

        {/* Section 5: Export & RUN */}
        <ButtonGroup className="pr-1 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onExport}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-200/60"
              >
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium text-[11px] translate-y-2">Exportar Resultados</TooltipContent>
          </Tooltip>

          <button 
            onClick={onExecute}
            disabled={execStatus === 'running'}
            className={cn(
              "flex items-center gap-2.5 h-9 px-4 rounded-xl transition-all active:scale-95 shadow-lg font-display text-[11px] font-black uppercase tracking-widest",
              execStatus === 'running' 
                ? "bg-primary/20 text-primary cursor-wait animate-pulse" 
                : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
            )}
          >
             {execStatus === 'running' ? (
                <div className="h-3 w-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
             ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
             )}
             <span>EJECUTAR</span>
          </button>
        </ButtonGroup>

      </div>
    </TooltipProvider>
  );
}
