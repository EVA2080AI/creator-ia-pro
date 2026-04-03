import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import {
  Plus, Search, Loader2, FolderOpen, MoreVertical,
  Trash2, Pencil, BookOpen, LayoutGrid, ChevronRight,
  List, Clock, Star, Folder, HardDrive, Wand2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Space {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  settings?: { brand_context?: string; primary_color?: string; theme?: string };
}

const Spaces = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated');

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("spaces").select("*").eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) toast.error("Error loading spaces");
    else setSpaces(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) fetchSpaces(); }, [user, fetchSpaces]);

  const handleOpenCreate = () => {
    setEditingSpace(null);
    setFormData({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (space: Space) => {
    setEditingSpace(space);
    setFormData({ name: space.name, description: space.description || "" });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name) return;
    setCreating(true);
    try {
      if (editingSpace) {
        const { error } = await supabase.from("spaces").update({
          name: formData.name,
          description: formData.description,
          settings: { ...editingSpace.settings, brand_context: formData.description },
        }).eq("id", editingSpace.id);
        if (error) throw error;
        toast.success("Space updated");
      } else {
        const { error } = await supabase.from("spaces").insert({
          user_id: user.id, name: formData.name, description: formData.description,
          settings: { brand_context: formData.description },
        });
        if (error) throw error;
        toast.success("Space created");
      }
      setIsDialogOpen(false);
      fetchSpaces();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("spaces").delete().eq("id", id);
    setDeleting(false);
    setDeleteTargetId(null);
    if (error) toast.error(error.message);
    else { toast.success("Espacio eliminado"); fetchSpaces(); }
  };

  const filtered = spaces
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-white/[0.02] text-zinc-900">
      <Helmet><title>Spaces | Creator IA Pro</title></Helmet>
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Drive-like Left Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 py-4 px-3 gap-1 overflow-y-auto">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-primary text-white text-[12px] font-black hover:bg-primary/90 transition-all active:scale-95 shadow-sm mb-3 uppercase tracking-widest"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nuevo Space
          </button>

          <div className="space-y-0.5">
            {[
              { label: 'Mis Spaces', icon: HardDrive, active: true },
              { label: 'Recientes',  icon: Clock,     active: false },
              { label: 'Destacados', icon: Star,      active: false },
              { label: 'Compartidos', icon: Folder,   active: false },
            ].map((item) => (
              <button key={item.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all ${
                  item.active ? 'bg-zinc-100 text-zinc-900 border border-zinc-200' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${item.active ? 'text-primary' : 'text-zinc-300'}`} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.3em] font-display px-3 mb-2">Herramientas</p>
            {[
              { label: 'Studio',  icon: Wand2,    path: '/studio' },
              { label: 'Genesis', icon: FolderOpen, path: '/chat' },
            ].map((item) => (
              <button key={item.label} onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
                <item.icon className="h-4 w-4 shrink-0 text-zinc-400" />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-6 py-6">
            {/* Top bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary/60 transition-colors pointer-events-none" />
                <Input
                  placeholder="Buscar en Spaces..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 pl-11 h-10 rounded-xl text-[13px] text-zinc-900 placeholder:text-zinc-300 focus:border-primary/30 focus:ring-0 transition-all"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[11px] text-zinc-500 outline-none hover:border-zinc-300 transition-all cursor-pointer"
              >
                <option value="updated">Modificado</option>
                <option value="created">Creado</option>
                <option value="name">Nombre</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-200 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-300 hover:text-zinc-900'}`}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-300 hover:text-zinc-900'}`}>
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Section label */}
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-4 w-4 text-zinc-300" />
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.25em] font-display">Mis Spaces</span>
              <span className="text-[10px] text-zinc-300 ml-1">— {filtered.length}</span>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
              </div>
            ) : filtered.length === 0 ? (
              <div
                onClick={handleOpenCreate}
                className="flex h-64 flex-col items-center justify-center border border-dashed border-zinc-200 rounded-3xl bg-zinc-50 cursor-pointer hover:border-primary/20 hover:bg-primary/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                  <Plus className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-[14px] font-bold text-zinc-400 font-display mb-1">
                  {search ? "Sin resultados" : "Crea tu primer Space"}
                </p>
                <p className="text-[12px] text-zinc-300">
                  {search ? "Prueba con otro término" : "Organiza proyectos y activos creativos"}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((space) => (
                  <div
                    key={space.id}
                    className="group cursor-pointer rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-200 hover:bg-zinc-50 transition-all relative overflow-hidden"
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                  >
                    {/* Color accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Thumbnail */}
                    <div className="flex h-32 items-center justify-center bg-zinc-50 border-b border-zinc-200 overflow-hidden">
                      {space.thumbnail_url ? (
                        <img src={space.thumbnail_url} alt={space.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="h-7 w-7 text-zinc-900/8 group-hover:text-primary/30 transition-colors" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors font-display truncate">{space.name}</h3>
                          <p className="text-[10px] text-zinc-300 mt-0.5">{new Date(space.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                          {space.description && (
                            <p className="text-[11px] text-zinc-300 mt-1.5 line-clamp-2 leading-relaxed">{space.description}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 relative group/menu"
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0c0c0f]/95 backdrop-blur-xl border-zinc-200 rounded-xl p-1.5 min-w-[140px] shadow-2xl">
                              <DropdownMenuItem className="rounded-lg text-[11px] font-medium focus:bg-primary/10 focus:text-primary text-zinc-400 py-2 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTargetId(space.id); }}
                                className="rounded-lg text-[11px] font-medium text-rose-400/60 focus:bg-rose-500/10 focus:text-rose-400 py-2 cursor-pointer">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest font-display">Abrir Canvas</span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List view — Google Drive-like */
              <div className="flex flex-col gap-0.5">
                <div className="grid grid-cols-[1fr_140px_120px_40px] px-4 py-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-display border-b border-zinc-200">
                  <span>Nombre</span><span>Modificado</span><span>Descripción</span><span />
                </div>
                {filtered.map((space) => (
                  <div key={space.id}
                    className="group grid grid-cols-[1fr_140px_120px_40px] items-center px-4 py-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-all border border-transparent hover:border-zinc-200"
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
                        {space.thumbnail_url
                          ? <img src={space.thumbnail_url} className="w-full h-full object-cover rounded-xl" />
                          : <BookOpen className="h-3.5 w-3.5 text-zinc-300 group-hover:text-primary transition-colors" />
                        }
                      </div>
                      <span className="text-[13px] font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors truncate">{space.name}</span>
                    </div>
                    <span className="text-[11px] text-zinc-300">{new Date(space.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-[11px] text-zinc-300 truncate pr-4">{space.description || '—'}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0c0c0f]/95 backdrop-blur-xl border-zinc-200 rounded-xl p-1.5 min-w-[140px] shadow-2xl">
                        <DropdownMenuItem className="rounded-lg text-[11px] font-medium focus:bg-primary/10 focus:text-primary text-zinc-400 py-2 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTargetId(space.id); }}
                          className="rounded-lg text-[11px] font-medium text-rose-400/60 focus:bg-rose-500/10 focus:text-rose-400 py-2 cursor-pointer">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <Trash2 className="h-7 w-7 text-rose-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight font-display">Eliminar espacio</DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium leading-relaxed mt-2">
              Se eliminará este espacio y todos sus nodos del canvas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-8">
            <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-6 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all font-display">
              Cancelar
            </button>
            <button
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-400 active:scale-95 transition-all disabled:opacity-50 font-display"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Space Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-12">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
              <LayoutGrid className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-bold text-zinc-900 tracking-tight font-display">
              {editingSpace ? "Editar Space" : "Nuevo Nexus Space"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium leading-relaxed mt-2">
              Define el núcleo de tu proyecto generativo. La IA usará este contexto para cada activo producido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-7 py-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1 font-display">
                Nombre del Space
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Nebula Marketing Campaign"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="rounded-2xl border-zinc-200 bg-zinc-50 h-14 text-zinc-900 placeholder:text-zinc-200 focus:border-primary/30 focus:ring-0 transition-all font-medium px-5"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1 font-display">
                Brand Context (opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ej: Estética minimalista, tonos oscuros, tipografía geométrica..."
                className="rounded-2xl border-zinc-200 bg-zinc-50 min-h-[120px] focus:border-primary/30 focus:ring-0 p-5 text-zinc-900 placeholder:text-zinc-200 leading-relaxed font-medium resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-4 mt-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 px-8 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 transition-all font-display"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={creating || !formData.name}
              className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-display"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editingSpace ? "Guardar Cambios" : "Crear Space"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Spaces;
