import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, Loader2, FolderOpen, MoreVertical,
  Trash2, Pencil, BookOpen, LayoutGrid, ChevronRight,
  List, HardDrive, LayoutTemplate, Code2
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

interface UnifiedProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  type: 'flow' | 'code';
  settings?: { brand_context?: string; primary_color?: string; theme?: string };
}

export const ProjectsView = ({ onOpenCreate }: { onOpenCreate: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<UnifiedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<UnifiedProject | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'flow' | 'code' } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated');

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch both spaces (Flows) and studio_projects (CodeIDE)
    const [spacesRes, codeRes] = await Promise.all([
      supabase.from("spaces").select("*").eq("user_id", user.id),
      supabase.from("studio_projects").select("*").eq("user_id", user.id)
    ]);
    
    if (spacesRes.error) toast.error("Error al cargar flujos");
    if (codeRes.error) toast.error("Error al cargar desarrollos IDE");
    
    const combined: UnifiedProject[] = [
      ...(spacesRes.data || []).map((s) => ({ ...s, type: 'flow' as const })),
      ...(codeRes.data || []).map((c) => ({
         ...c, 
         type: 'code' as const, 
         thumbnail_url: null,
         settings: {}
      }))
    ];
    
    setSpaces(combined);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) fetchSpaces(); }, [user, fetchSpaces]);

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
          const { error } = await supabase.from("spaces").update({
            name: formData.name,
            description: formData.description,
            settings: { ...editingSpace.settings, brand_context: formData.description },
          }).eq("id", editingSpace.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("studio_projects").update({
            name: formData.name,
            description: formData.description,
          }).eq("id", editingSpace.id);
          if (error) throw error;
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
    let error;
    if (target.type === 'flow') {
      const res = await supabase.from("spaces").delete().eq("id", target.id);
      error = res.error;
    } else {
      const res = await supabase.from("studio_projects").delete().eq("id", target.id);
      error = res.error;
    }
    
    setDeleting(false);
    setDeleteTarget(null);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Proyecto eliminado");
      fetchSpaces();
    }
  };

  const handleProjectClick = (space: UnifiedProject) => {
    if (space.type === 'flow') {
      navigate(`/studio-flow?spaceId=${space.id}`);
    } else {
      navigate(`/code?project=${space.id}`);
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
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary/60 transition-colors pointer-events-none" />
          <Input
            placeholder="Buscar proyectos y flujos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-50 border-zinc-200 pl-11 h-10 rounded-xl text-[13px] text-zinc-900 placeholder:text-zinc-500 focus:border-primary/30 focus:ring-0 transition-all font-medium"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 font-display outline-none hover:border-zinc-300 transition-all cursor-pointer"
        >
          <option value="updated">Modificado</option>
          <option value="created">Creado</option>
          <option value="name">Nombre</option>
        </select>

        <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-200 rounded-xl p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="h-4 w-4 text-zinc-500" />
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.25em] font-display">Mis Activos Locales</span>
        <span className="text-[10px] text-zinc-500 ml-1">— {filtered.length} total</span>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center border border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-[14px] font-bold text-zinc-400 font-display mb-1">
            {search ? "Sin resultados" : "Tu Hub de Proyectos"}
          </p>
          <p className="text-[12px] text-zinc-500 mb-6 px-10 text-center max-w-sm">
            {search ? "Prueba con otro término." : "Inicia un Flujo visual o un Desarrollo de Código."}
          </p>
          
          {!search && (
            <div className="flex items-center gap-3">
              <button onClick={onOpenCreate} className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-all font-display shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Crear Proyecto
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
                className="group cursor-pointer rounded-3xl border border-zinc-200/60 bg-white/70 backdrop-blur-sm hover:border-zinc-300 hover:shadow-xl transition-all duration-500 relative overflow-hidden shadow-sm"
                onClick={() => handleProjectClick(space)}
              >
                {/* Color accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity ${isCode ? 'bg-gradient-to-r from-emerald-500/60 to-transparent' : 'bg-gradient-to-r from-primary/60 to-transparent'}`} />

                {/* Thumbnail / Headers space */}
                <div className="flex h-32 items-center justify-center bg-zinc-50/50 border-b border-zinc-100 overflow-hidden relative">
                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest bg-white/90 backdrop-blur ${isCode ? 'text-emerald-600 border-emerald-500/20' : 'text-primary/80 border-primary/20'}`}>
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
                      <h3 className="text-[13px] font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors font-display truncate">{space.name}</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{new Date(space.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                      {space.description && (
                        <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed font-medium">{space.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 relative group/menu"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-zinc-200 rounded-xl p-1.5 min-w-[140px] shadow-2xl">
                          <DropdownMenuItem className="rounded-lg text-[11px] font-medium focus:bg-primary/10 focus:text-primary text-zinc-400 py-2 cursor-pointer"
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
                  <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest font-display transition-colors ${isCode ? 'text-zinc-400 group-hover:text-emerald-600' : 'text-zinc-400 group-hover:text-primary'}`}>
                      Abrir Proyecto
                    </span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isCode ? 'bg-zinc-100 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-zinc-100 group-hover:bg-primary group-hover:text-white'}`}>
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
          <div className="grid grid-cols-[1fr_120px_140px_120px_40px] px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-display border-b border-zinc-200">
            <span>Nombre</span><span>Tipo</span><span>Modificado</span><span>Descripción</span><span />
          </div>
          {filtered.map((space) => {
            const isCode = space.type === 'code';
            return (
              <div key={space.id}
                className="group grid grid-cols-[1fr_120px_140px_120px_40px] items-center px-4 py-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-all border border-transparent hover:border-zinc-200"
                onClick={() => handleProjectClick(space)}
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 transition-colors ${isCode ? 'group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10' : 'group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                    {space.thumbnail_url
                      ? <img src={space.thumbnail_url} className="w-full h-full object-cover rounded-xl" />
                      : isCode ? <Code2 className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-600" /> : <BookOpen className="h-3.5 w-3.5 text-zinc-500 group-hover:text-primary" />
                    }
                  </div>
                  <span className="text-[13px] font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors truncate">{space.name}</span>
                </div>
                
                <span className="pr-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest bg-white ${isCode ? 'text-emerald-600 border-emerald-500/20' : 'text-primary/80 border-primary/20'}`}>
                     {isCode ? <Code2 className="h-3 w-3" /> : <LayoutTemplate className="h-3 w-3" />}
                     {isCode ? 'Código' : 'Flujo'}
                  </div>
                </span>

                <span className="text-[11px] font-medium text-zinc-500">{new Date(space.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                
                <span className="text-[11px] font-medium text-zinc-500 truncate pr-4">{space.description || '—'}</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-zinc-200 rounded-xl p-1.5 min-w-[140px] shadow-2xl">
                    <DropdownMenuItem className="rounded-lg text-[11px] font-medium focus:bg-primary/10 focus:text-primary text-zinc-400 py-2 cursor-pointer"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[2rem] p-10 bg-white border-zinc-200 shadow-xl shadow-zinc-200/50">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <Trash2 className="h-7 w-7 text-rose-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight font-display">Eliminar espacio</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
              Se eliminará este proyecto permanentemente. Esta acción no se puede revertir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-8">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-6 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all font-display">
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
        <DialogContent className="sm:max-w-[480px] p-12 bg-white border-zinc-200 rounded-[3rem] shadow-xl shadow-zinc-200/50">
          <DialogHeader>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 
              ${editingSpace?.type === 'code' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-primary/10 border-primary/20 text-primary'}`}>
              <LayoutGrid className="h-7 w-7" />
            </div>
            <DialogTitle className="text-3xl font-bold text-zinc-900 tracking-tight font-display">
              {editingSpace ? (editingSpace.type === 'code' ? 'Editar Desarrollo' : 'Editar Flujo') : "Nuevo Proyecto"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
              Da un nombre identificable a tu proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-7 py-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1 font-display">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Nebula UI"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="rounded-2xl border-zinc-200 bg-zinc-50 h-14 text-zinc-900 placeholder:text-zinc-400 focus:border-primary/40 focus:ring-0 transition-all font-medium px-5"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1 font-display">
                Descripción (opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ej: Creación de interfaz usando Tailwind..."
                className="rounded-2xl border-zinc-200 bg-zinc-50 min-h-[120px] focus:border-primary/40 focus:ring-0 p-5 text-zinc-900 placeholder:text-zinc-400 leading-relaxed font-medium resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-4 mt-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 px-8 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all font-display"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={creating || !formData.name}
              className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-display"
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
