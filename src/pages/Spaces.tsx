import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import {
  Plus, Search, Loader2, FolderOpen, MoreVertical,
  Trash2, Pencil, BookOpen, LayoutGrid, ChevronRight, ArrowRight,
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

  const filtered = spaces.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <Loader2 className="h-8 w-8 animate-spin text-aether-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white font-sans selection:bg-aether-purple/30 selection:text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-aether-purple/5 blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-aether-blue/5 blur-[120px]" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-[1440px] px-8 py-12 pt-24">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Workspace Nexus</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-display">
              Mis <span className="bg-gradient-to-r from-aether-purple to-aether-blue bg-clip-text text-transparent">Espacios</span>
            </h1>
            <p className="text-sm text-white/30 font-medium max-w-md">
              Organiza tus proyectos generativos en contenedores creativos persistentes.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            disabled={creating}
            className="flex items-center gap-3 bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-4 text-xs font-bold uppercase tracking-widest font-display transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] shrink-0"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nuevo Space
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-10 group">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 group-focus-within:text-aether-purple transition-colors" />
          <Input
            placeholder="Buscar espacios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/[0.03] border-white/5 pl-14 h-14 rounded-2xl text-white placeholder:text-white/10 focus:border-aether-purple/30 focus:ring-0 transition-all font-medium"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-aether-purple" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            onClick={handleOpenCreate}
            className="flex h-80 flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01] cursor-pointer hover:border-aether-purple/20 hover:bg-aether-purple/5 transition-all duration-500 group"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-white text-black flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl">
              <LayoutGrid className="h-10 w-10" />
            </div>
            <p className="text-2xl font-bold text-white font-display tracking-tight mb-2">
              {search ? "Sin resultados" : "Inicializa tu primer Space"}
            </p>
            <p className="text-sm text-white/20 font-medium">
              {search ? "Prueba con otro término" : "Organiza activos y campañas en clusters creativos"}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((space) => (
              <div
                key={space.id}
                className="group cursor-pointer aether-card rounded-[2.5rem] border border-white/5 p-6 hover:border-aether-purple/20 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden"
                onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
              >
                {/* Thumbnail */}
                <div className="mb-5 flex h-36 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden group-hover:border-aether-purple/10 transition-colors">
                  {space.thumbnail_url ? (
                    <img src={space.thumbnail_url} alt={space.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 text-white/10 group-hover:text-aether-purple/40 transition-colors duration-500" />
                      <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest font-display">empty_core</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-start justify-between px-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-aether-purple transition-colors duration-300 tracking-tight font-display truncate">
                      {space.name}
                    </h3>
                    <p className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest font-display">
                      {new Date(space.updated_at).toLocaleDateString()}
                    </p>
                    {space.description && (
                      <p className="text-[11px] text-white/30 mt-2 line-clamp-2 leading-relaxed">{space.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="h-8 w-8 rounded-xl text-white/20 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all flex-shrink-0 ml-2">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0a0a0d]/95 backdrop-blur-3xl border-white/10 rounded-2xl p-2 min-w-[160px] shadow-2xl">
                      <DropdownMenuItem
                        className="rounded-xl text-[11px] font-bold focus:bg-aether-purple/10 focus:text-aether-purple text-white/40 py-2.5 cursor-pointer uppercase tracking-widest font-display"
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setDeleteTargetId(space.id); }}
                        className="rounded-xl text-[11px] font-bold text-rose-500/60 focus:bg-rose-500/10 focus:text-rose-400 py-2.5 cursor-pointer uppercase tracking-widest font-display"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Open arrow */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white/15 uppercase tracking-widest font-display">Abrir Studio</span>
                  <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-aether-purple group-hover:translate-x-1 transition-all" />
                </div>

                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-aether-purple/5 blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-3xl border-white/10 sm:max-w-[380px] rounded-[3rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <Trash2 className="h-7 w-7 text-rose-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white tracking-tight font-display">Eliminar espacio</DialogTitle>
            <DialogDescription className="text-white/30 font-medium leading-relaxed mt-2">
              Se eliminará este espacio y todos sus nodos del canvas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-8">
            <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-6 py-4 rounded-2xl border border-white/5 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-all font-display">
              Cancelar
            </button>
            <button
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-400 active:scale-95 transition-all disabled:opacity-50 font-display"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Space Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-3xl border-white/10 sm:max-w-[480px] rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-aether-purple/10 border border-aether-purple/20 flex items-center justify-center mb-6">
              <LayoutGrid className="h-7 w-7 text-aether-purple" />
            </div>
            <DialogTitle className="text-3xl font-bold text-white tracking-tight font-display">
              {editingSpace ? "Editar Space" : "Nuevo Nexus Space"}
            </DialogTitle>
            <DialogDescription className="text-white/30 font-medium leading-relaxed mt-2">
              Define el núcleo de tu proyecto generativo. La IA usará este contexto para cada activo producido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-7 py-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1 font-display">
                Nombre del Space
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Nebula Marketing Campaign"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="rounded-2xl border-white/5 bg-white/[0.03] h-14 text-white placeholder:text-white/10 focus:border-aether-purple/30 focus:ring-0 transition-all font-medium px-5"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1 font-display">
                Brand Context (opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ej: Estética minimalista, tonos oscuros, tipografía geométrica..."
                className="rounded-2xl border-white/5 bg-white/[0.03] min-h-[120px] focus:border-aether-purple/30 focus:ring-0 p-5 text-white placeholder:text-white/10 leading-relaxed font-medium resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-4 mt-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 px-8 py-4 rounded-2xl border border-white/5 text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white hover:bg-white/5 transition-all font-display"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={creating || !formData.name}
              className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-4 bg-white text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed font-display"
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
