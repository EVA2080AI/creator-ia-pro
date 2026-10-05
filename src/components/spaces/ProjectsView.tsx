import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import { CANVAS_ENABLED } from "@/lib/features";
import { useStudioProjects } from "@/hooks/useStudioProjects";
import { listSpaces, updateSpace, deleteSpace } from "@/lib/spaces";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, Loader2, FolderOpen, MoreVertical,
  Trash2, Pencil, BookOpen, LayoutGrid, ChevronRight,
  List, HardDrive, LayoutTemplate, Code2, Sparkles,
  Square, CheckSquare, X, Check, ArrowDownWideNarrow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UnifiedProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  type: 'flow' | 'code';
  settings?: any;
}

export const ProjectsView = ({ onOpenCreate }: { onOpenCreate: () => void }) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin(user?.id);
  const navigate = useNavigate();

  // Mismo toast que ya usa el sidebar de Basalt para Canvas IA (apagado por
  // flag) en vez de navegar a un callejón sin salida (auditoría UX 2026-09-29).
  const goToCanvas = () => {
    if (!CANVAS_ENABLED && !isAdmin) {
      toast("Canvas IA — Próximamente", { description: "Estamos terminando esta función. Te avisaremos cuando esté lista." });
      return;
    }
    navigate("/studio-flow");
  };
  const {
    projects: codeProjects, loading: codeLoading, loadError: codeError, deleteProject: deleteCodeProject,
    updateProjectMeta, refetch: refetchCodeProjects,
  } = useStudioProjects();

  const [flowSpaces, setFlowSpaces] = useState<UnifiedProject[]>([]);
  const [flowError, setFlowError] = useState(false);
  const [flowLoading, setFlowLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<UnifiedProject | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'flow' | 'code' } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const fetchFlowSpaces = useCallback(async () => {
    if (!user) return;
    setFlowLoading(true);
    const rows = await listSpaces();
    // null = la petición falló. Sin esto, la pantalla mostraba "Tu Hub de Proyectos —
    // inicia un Flujo visual o un Desarrollo de Código": a alguien con diez proyectos
    // y sin señal se le decía que no tiene ninguno.
    setFlowError(rows === null);
    if (rows) {
      setFlowSpaces(rows.map((s): UnifiedProject => ({
        id: s.id, name: s.name, description: s.description, thumbnail_url: s.thumbnailUrl,
        created_at: s.createdAt, updated_at: s.updatedAt, type: 'flow', settings: s.settings,
      })));
    }
    setFlowLoading(false);
  }, [user]);

  useEffect(() => { if (user) fetchFlowSpaces(); }, [user, fetchFlowSpaces]);

  const spaces: UnifiedProject[] = [
    ...flowSpaces,
    ...codeProjects.map((c): UnifiedProject => ({
      id: c.id, name: c.name, description: c.description, thumbnail_url: null,
      created_at: c.created_at, updated_at: c.updated_at, type: 'code', settings: {},
    })),
  ];
  const loading = flowLoading || codeLoading;
  const loadError = flowError || codeError;
  const fetchSpaces = useCallback(() => { fetchFlowSpaces(); refetchCodeProjects(); }, [fetchFlowSpaces, refetchCodeProjects]);

  const handleOpenEdit = (space: UnifiedProject) => {
    setEditingSpace(space);
    setFormData({ name: space.name, description: space.description || "" });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name) return;
    setCreating(true);

    try {
      if (editingSpace) {
        // Edit mode
        if (editingSpace.type === 'flow') {
          const updated = await updateSpace(editingSpace.id, {
            name: formData.name,
            description: formData.description,
            settings: { ...editingSpace.settings, brand_context: formData.description },
          });
          if (!updated) throw new Error("No se pudo actualizar el flujo");
        } else {
          const ok = await updateProjectMeta(editingSpace.id, { name: formData.name, description: formData.description });
          if (!ok) throw new Error("No se pudo actualizar el proyecto");
        }
        toast.success("Proyecto actualizado");
      }
      setIsDialogOpen(false);
      fetchSpaces();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (target: { id: string, type: 'flow' | 'code' }) => {
    setDeleting(true);
    const ok = target.type === 'flow' ? await deleteSpace(target.id) : await (async () => { await deleteCodeProject(target.id); return true; })();

    setDeleting(false);
    setDeleteTarget(null);

    if (!ok) {
      toast.error("No se pudo eliminar el proyecto");
    } else {
      if (target.type === 'flow') { toast.success("Proyecto eliminado"); fetchSpaces(); }
    }
  };

  const handleProjectClick = (space: UnifiedProject) => {
    if (selectedIds.size > 0) {
      toggleSelect(space.id);
      return;
    }

    if (space.type === 'flow') {
      navigate(`/studio-flow?spaceId=${space.id}`);
    } else {
      // "Code Editor" ya no existe como interfaz separada — se fusionó
      // dentro de Basalt IA (Fase 5 de la restructuración), que hoy vive
      // directo en /a/basalt (el propio /chat solo redirige para allá).
      navigate(`/a/basalt?project=${space.id}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const selected = spaces.filter(s => selectedIds.has(s.id));
    
    const flowIds = selected.filter(s => s.type === 'flow').map(s => s.id);
    const codeIds = selected.filter(s => s.type === 'code').map(s => s.id);

    try {
      if (flowIds.length > 0) {
        const results = await Promise.all(flowIds.map((id) => deleteSpace(id)));
        if (results.some((ok) => !ok)) throw new Error("Algunos flujos no se pudieron eliminar");
      }
      if (codeIds.length > 0) {
        await Promise.all(codeIds.map((id) => deleteCodeProject(id)));
      }

      toast.success(`${selectedIds.size} proyectos eliminados correctamente`);
      setSelectedIds(new Set());
      fetchSpaces();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar múltiples proyectos");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkConfirm(false);
    }
  };

  const filtered = spaces
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  return (
    <>


      {/* Medido en un iPhone 13: el nombre del primer proyecto quedaba a 603px de 664,
          o sea al borde inferior de la pantalla. Esta barra se llevaba 112px en DOS
          filas (buscar arriba, ordenar y vista abajo); en móvil va en una sola. */}
      <div className="flex flex-row items-center gap-2 md:gap-4 mb-4 md:mb-10 p-1.5 bg-muted/50 backdrop-blur-xl border border-border/60 rounded-[2rem] shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
        <div className="relative flex-1 min-w-0 group">
          <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar proyectos, flujos o archivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-[1.5rem] py-2.5 md:py-3.5 pl-11 md:pl-14 pr-4 md:pr-6 text-sm font-medium transition-all outline-none shadow-sm"
          />
        </div>
        
        <div className="flex w-auto shrink-0 items-center gap-2 md:pr-2">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            {/* En móvil el valor ("MODIFICADO") ocupaba media fila para decir algo que
                se ve igual al abrirlo: queda el icono, con su nombre accesible. No se
                esconde con `hidden`: SelectTrigger le mete `[&>span]:line-clamp-1` a sus
                hijos, que vuelve a ponerles display y gana. */}
            <SelectTrigger
              aria-label="Ordenar los proyectos"
              className="w-10 justify-center md:w-[160px] h-10 md:h-12 px-0 md:px-3 bg-card border-border rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground shadow-sm transition-all focus:ring-4 focus:ring-primary/5 [&>svg:last-child]:hidden md:[&>svg:last-child]:block"
            >
              {isMobile ? <ArrowDownWideNarrow className="h-4 w-4" aria-hidden /> : <SelectValue placeholder="Ordenar" />}
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border shadow-2xl">
              <SelectItem value="updated" className="text-[11px] font-bold">MODIFICADO</SelectItem>
              <SelectItem value="name" className="text-[11px] font-bold">NOMBRE</SelectItem>
              <SelectItem value="created" className="text-[11px] font-bold">RECIENTE</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex p-1 bg-card border border-border rounded-[1.2rem] shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Ver en cuadrícula"
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all",
                viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Ver en lista"
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all",
                viewMode === 'list' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* "Seleccionar todo" es una acción secundaria y estaba por ENCIMA de los
          proyectos, sumando otra fila antes del contenido en un teléfono. */}
      <div className={cn("items-center gap-4 mb-3 md:mb-6 md:flex", selectedIds.size > 0 ? "flex" : "hidden")}>
        <button 
          onClick={toggleSelectAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground transition-all font-display shadow-sm"
        >
          {selectedIds.size === filtered.length && filtered.length > 0 ? (
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          {selectedIds.size === filtered.length && filtered.length > 0 ? 'Desmarcar Todo' : 'Seleccionar Todo'}
        </button>

        {selectedIds.size === filtered.length && filtered.length > 0 && (
          <button 
            onClick={() => setShowBulkConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-[11px] font-bold transition-all font-display shadow-lg shadow-rose-100 animate-in zoom-in duration-300"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar Todo el Contenido
          </button>
        )}

        {selectedIds.size > 0 && (
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
          >
            <X className="h-3 w-3" /> Limpiar Selección
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
        </div>
      ) : loadError && spaces.length === 0 ? (
        // Mismo trato (y misma pinta) que la biblioteca: decir qué pasó y dejar reintentar.
        <div role="alert" className="flex h-64 flex-col items-center justify-center gap-3 border border-dashed border-rose-200 dark:border-rose-500/30 rounded-3xl bg-rose-50/60 dark:bg-rose-500/10">
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300 font-display tracking-tight">No se pudieron cargar tus proyectos</p>
          <p className="text-[13px] text-rose-700 dark:text-rose-300 font-medium">Revisa tu conexión e inténtalo otra vez.</p>
          <button type="button" onClick={fetchSpaces} className="mt-1 rounded-xl bg-foreground px-4 py-2 text-[12px] font-bold text-background">
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center border border-dashed border-border rounded-3xl bg-muted/50">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-[14px] font-bold text-muted-foreground font-display mb-1">
            {search ? "Sin resultados" : "Tu Hub de Proyectos"}
          </p>
          <p className="text-[12px] text-muted-foreground mb-6 px-10 text-center max-w-sm">
            {search ? "Prueba con otro término." : "Inicia un Flujo visual o un Desarrollo de Código."}
          </p>
          
          {!search && (
            <div className="flex items-center gap-3">
              <button onClick={onOpenCreate} className="flex items-center gap-2 px-4 py-2 border border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary transition-all font-display shadow-sm">
                <LayoutTemplate className="h-3.5 w-3.5" /> Explorar Hub (Plantillas)
              </button>
              <button onClick={goToCanvas} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl bg-card hover:bg-muted text-xs font-bold text-foreground transition-all font-display shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Lienzo en Blanco
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((space) => {
            const isCode = space.type === 'code';
            return (
              <div
                key={space.id}
                className={`group cursor-pointer rounded-[2.5rem] border ${selectedIds.has(space.id) ? 'border-primary ring-2 ring-primary/10 shadow-[0_30px_90px_rgba(0,0,0,0.15)]' : 'border-border/60 shadow-sm'} bg-card/70 backdrop-blur-sm hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}
                onClick={() => handleProjectClick(space)}
              >
                {/* Selection Checkbox Overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(space.id); }}
                  className={`absolute top-3 right-3 z-20 h-7 w-7 rounded-lg border flex items-center justify-center transition-all 
                    ${selectedIds.has(space.id) 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                      // En un teléfono NO hay hover: la casilla no aparecía nunca y la única
                      // forma de seleccionar era "Seleccionar Todo" (o sea, no se podía
                      // elegir UN proyecto con el dedo). Solo se esconde donde hay cursor.
                      : 'bg-card/80 border-border text-muted-foreground [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100'}`}
                >
                  {selectedIds.has(space.id) ? <Check className="h-4 w-4" /> : <Plus className="h-3 w-3" />}
                </button>
                {/* Color accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity ${isCode ? 'bg-gradient-to-r from-emerald-500/60 to-transparent' : 'bg-gradient-to-r from-primary/60 to-transparent'}`} />

                {/* Thumbnail / Headers space */}
                <div className="flex h-20 sm:h-32 items-center justify-center bg-muted/50 border-b border-border overflow-hidden relative">
                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest bg-card/90 backdrop-blur ${isCode ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'text-primary/80 border-primary/20'}`}>
                      {isCode ? <Code2 className="h-3 w-3" /> : <LayoutTemplate className="h-3 w-3" />}
                      {isCode ? 'Código' : 'Flujo'}
                    </div>
                  </div>

                  {space.thumbnail_url ? (
                    <img src={space.thumbnail_url} alt={space.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm ${isCode ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-primary/5 border-primary/10'}`}>
                          {isCode ? (
                            <Code2 className={`h-6 w-6 transition-colors ${isCode ? 'text-emerald-600/40 group-hover:text-emerald-500' : ''}`} />  
                          ) : (
                            <BookOpen className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors" />
                          )}
                       </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold text-foreground group-hover:text-foreground transition-colors font-display truncate">{space.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{new Date(space.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                      {space.description && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed font-medium">{space.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className={`shrink-0 relative group/menu ${selectedIds.has(space.id) ? 'pointer-events-none opacity-0' : ''}`}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border rounded-xl p-1.5 min-w-[140px] shadow-2xl">
                          <DropdownMenuItem className="rounded-lg text-[11px] font-medium focus:bg-primary/10 focus:text-primary text-muted-foreground py-2 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: space.id, type: space.type }); }}
                            className="rounded-lg text-[11px] font-medium text-rose-400/60 focus:bg-rose-500/10 focus:text-rose-400 py-2 cursor-pointer">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest font-display transition-colors ${isCode ? 'text-muted-foreground group-hover:text-emerald-600' : 'text-muted-foreground group-hover:text-primary'}`}>
                      Abrir Proyecto
                    </span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isCode ? 'bg-muted group-hover:bg-emerald-500 group-hover:text-white' : 'bg-muted group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                       <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="flex flex-col gap-0.5">
          <div className="grid grid-cols-[40px_1fr_120px_140px_120px_40px] px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-display border-b border-border">
            <span /><span>Nombre</span><span>Tipo</span><span>Modificado</span><span>Descripción</span><span />
          </div>
          {filtered.map((space) => {
            const isCode = space.type === 'code';
            const isSelected = selectedIds.has(space.id);
            return (
              <div key={space.id}
                className={`group grid grid-cols-[40px_1fr_120px_140px_120px_40px] items-center px-4 py-3 rounded-xl cursor-pointer transition-all border 
                  ${isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted border-transparent hover:border-border'}`}
                onClick={() => handleProjectClick(space)}
              >
                <div onClick={(e) => { e.stopPropagation(); toggleSelect(space.id); }} className="flex items-center justify-center">
                   {isSelected ? (
                     <div className="h-5 w-5 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-all animate-in zoom-in duration-300">
                        <Check className="h-3.5 w-3.5" />
                     </div>
                   ) : (
                     <div className="h-5 w-5 rounded-md border border-border bg-card group-hover:border-muted-foreground/40 transition-all" />
                   )}
                </div>
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/50 border border-border transition-colors ${isCode ? 'group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10' : 'group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                    {space.thumbnail_url
                      ? <img src={space.thumbnail_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : isCode ? <Code2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600" /> : <BookOpen className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    }
                  </div>
                  <span className="text-[13px] font-medium text-foreground group-hover:text-foreground transition-colors truncate">{space.name}</span>
                </div>
                
                <span className="pr-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest bg-card ${isCode ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'text-primary/80 border-primary/20'}`}>
                     {isCode ? <Code2 className="h-3 w-3" /> : <LayoutTemplate className="h-3 w-3" />}
                     {isCode ? 'Código' : 'Flujo'}
                  </div>
                </span>

                <span className="text-[11px] font-medium text-muted-foreground">{new Date(space.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                
                <span className="text-[11px] font-medium text-muted-foreground truncate pr-4">{space.description || '—'}</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button aria-label={`Acciones de ${space.name}`} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border rounded-xl p-1.5 min-w-[140px] shadow-2xl">
                    <DropdownMenuItem className="rounded-lg text-[11px] font-medium focus:bg-primary/10 focus:text-primary text-muted-foreground py-2 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: space.id, type: space.type }); }}
                      className="rounded-lg text-[11px] font-medium text-rose-400/60 focus:bg-rose-500/10 focus:text-rose-400 py-2 cursor-pointer">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bulk Actions Floating Toolbar ──────────────────────────────────────── */}
      {/* Centrada respecto al viewport completo en mobile (el sidebar de
          Basalt es un drawer off-canvas ahí), pero en desktop el sidebar
          ocupa 264px reales de layout — sin el offset queda descentrada
          hacia la izquierda (auditoría UX 2026-09-29, ya no colapsa como el
          sidebar viejo, así que el desfase es constante y corregible). */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-[calc(50%+132px)] z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-6 px-8 py-5 bg-card border border-border rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.15)] backdrop-blur-3xl">
            <div className="flex items-center gap-4 border-r border-border pr-6 mr-1">
              <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                <span className="text-[14px] font-black">{selectedIds.size}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-foreground tracking-tight leading-none mb-1">Seleccionados</span>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Listo para procesar</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={isBulkDeleting}
                className="flex items-center gap-3 px-8 py-3.5 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 active:scale-95 disabled:opacity-50"
              >
                {isBulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Eliminar Selección
              </button>
              
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-6 py-3.5 bg-muted/50 text-muted-foreground hover:text-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] p-12 bg-card border-border shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-8">
              <Trash2 className="h-8 w-8 text-rose-500" />
            </div>
            <DialogTitle className="text-3xl font-bold text-foreground tracking-tight font-display">Borrado Masivo</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium leading-relaxed mt-4">
              Estás a punto de eliminar <span className="font-black text-rose-500">{selectedIds.size}</span> proyectos permanentemente. Esta acción es definitiva y no puede deshacerse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-10">
             <button onClick={() => setShowBulkConfirm(false)} className="flex-1 px-8 py-4 rounded-2xl border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all font-display">
                Cancelar
             </button>
             <button
               onClick={handleBulkDelete}
               disabled={isBulkDeleting}
               className="flex-[1.5] flex items-center justify-center gap-3 px-8 py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-600 active:scale-95 transition-all shadow-xl shadow-rose-100 font-display disabled:opacity-50"
             >
               {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Eliminación"}
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[2rem] p-10 bg-card border-border shadow-xl shadow-black/5">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <Trash2 className="h-7 w-7 text-rose-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground tracking-tight font-display">Eliminar espacio</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium leading-relaxed mt-2">
              Se eliminará este proyecto permanentemente. Esta acción no se puede revertir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-8">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-6 py-4 rounded-2xl border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-display">
              Cancelar
            </button>
            <button
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-400 active:scale-95 transition-all disabled:opacity-50 font-display"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-12 bg-card border-border rounded-[3rem] shadow-xl shadow-black/5">
          <DialogHeader>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 
              ${editingSpace?.type === 'code' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-primary/10 border-primary/20 text-primary'}`}>
              <LayoutGrid className="h-7 w-7" />
            </div>
            <DialogTitle className="text-3xl font-bold text-foreground tracking-tight font-display">
              {editingSpace ? (editingSpace.type === 'code' ? 'Editar Desarrollo' : 'Editar Flujo') : "Nuevo Proyecto"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium leading-relaxed mt-2">
              Da un nombre identificable a tu proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-7 py-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 font-display">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Nebula UI"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="rounded-2xl border-border bg-muted/50 h-14 text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-0 transition-all font-medium px-5"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 font-display">
                Descripción (opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ej: Creación de interfaz usando Tailwind..."
                className="rounded-2xl border-border bg-muted/50 min-h-[120px] focus:border-primary/40 focus:ring-0 p-5 text-foreground placeholder:text-muted-foreground leading-relaxed font-medium resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-4 mt-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 px-8 py-4 rounded-2xl border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-display"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={creating || !formData.name}
              className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-display"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </>
  );
};
