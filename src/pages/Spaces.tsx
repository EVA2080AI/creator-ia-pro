import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import {
  Plus,
  Search,
  Loader2,
  FolderOpen,
  MoreVertical,
  Trash2,
  Pencil,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  settings?: {
    brand_context?: string;
    primary_color?: string;
    theme?: string;
  };
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

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) toast.error("Error cargando spaces");
    else setSpaces(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchSpaces();
  }, [user, fetchSpaces]);

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
        const { error } = await supabase
          .from("spaces")
          .update({ 
            name: formData.name, 
            description: formData.description,
            settings: { ...editingSpace.settings, brand_context: formData.description }
          })
          .eq("id", editingSpace.id);
        if (error) throw error;
        toast.success("Space actualizado");
      } else {
        const { error } = await supabase
          .from("spaces")
          .insert({ 
            user_id: user.id, 
            name: formData.name, 
            description: formData.description,
            settings: { brand_context: formData.description }
          });
        if (error) throw error;
        toast.success("Space creado");
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
    if (!confirm("¿Eliminar este space?")) return;
    const { error } = await supabase.from("spaces").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Space eliminado");
      fetchSpaces();
    }
  };


  const filtered = spaces.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020203]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4ff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-[#d4ff00]/30 selection:text-[#020203]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-[#d4ff00]/5 blur-[150px] animate-pulse" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8 lowercase">
        <div className="mb-10 flex items-end justify-between">
          <div className="space-y-1">
            <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border-transparent font-black px-3 py-0.5 rounded-full text-[9px] tracking-widest uppercase mb-1">workspace_nexus_v8.0</Badge>
            <h1 className="text-4xl font-black tracking-tighter text-white">mis_<span className="text-[#d4ff00]">espacios</span></h1>
            <p className="text-sm font-bold text-slate-500">organiza tus proyectos generativos industriales</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            disabled={creating}
            className="bg-[#d4ff00] text-[#020203] hover:bg-[#c4eb00] gap-2 rounded-2xl shadow-2xl shadow-[#d4ff00]/10 px-8 h-14 font-black lowercase transition-all active:scale-95"
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            nuevo_space
          </Button>
        </div>

        <div className="relative mb-10 group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d4ff00] transition-colors" />
          <Input
            placeholder="buscar_espacios_de_trabajo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/5 pl-12 h-14 rounded-2xl text-white placeholder:text-slate-600 focus:ring-[#d4ff00]/20 transition-all font-bold"
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#d4ff00]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-slate-500 border border-white/5 border-dashed rounded-[3rem] bg-white/[0.02]">
            <FolderOpen className="mb-6 h-16 w-16 opacity-10 text-[#d4ff00]" />
            <p className="text-xl font-black text-white">
              {search ? "sin_resultados" : "sin_espacios_activos"}
            </p>
            <p className="text-sm font-bold mt-2">
              {search ? "prueba con otro término de búsqueda" : "inicializa tu primer contenedor creativo"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((space) => (
              <div
                key={space.id}
                className="group cursor-pointer rounded-[2.5rem] border border-white/5 bg-[#080809]/60 backdrop-blur-2xl p-6 shadow-2xl hover:border-[#d4ff00]/20 hover:shadow-[#d4ff00]/5 transition-all duration-500"
                onClick={() => navigate(`/canvas?spaceId=${space.id}`)}
              >
                <div className="mb-6 flex h-40 items-center justify-center rounded-3xl bg-white/5 border border-white/5 overflow-hidden group-hover:border-[#d4ff00]/10 transition-colors">
                  {space.thumbnail_url ? (
                    <img src={space.thumbnail_url} alt={space.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <BookOpen className="h-10 w-10 text-slate-700 group-hover:text-[#d4ff00] transition-colors duration-500" />
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">empty_core</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between px-1">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-[#d4ff00] transition-colors duration-300 tracking-tight">
                      {space.name}
                    </h3>
                    <p className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-widest">
                      upraded_{new Date(space.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-600 hover:text-white hover:bg-white/5">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#080809] border-white/10 rounded-2xl p-2 min-w-[160px] shadow-2xl">
                      <DropdownMenuItem className="rounded-xl font-black lowercase text-[11px] focus:bg-[#d4ff00] focus:text-[#020203] text-slate-400 py-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        configuración_pro
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDelete(space.id); }}
                        className="rounded-xl font-black lowercase text-[11px] text-red-500 focus:bg-red-500 focus:text-white py-2.5 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        eliminar_contenedor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Space Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-[#080809]/95 backdrop-blur-3xl border-white/5 sm:max-w-[480px] rounded-[3rem] !pt-12 p-10 shadow-2xl">
            <DialogHeader>
              <div className="h-14 w-14 rounded-2xl bg-[#d4ff00]/10 flex items-center justify-center mb-6">
                 <FolderOpen className="h-7 w-7 text-[#d4ff00]" />
              </div>
              <DialogTitle className="text-3xl font-black text-white lowercase tracking-tighter">
                {editingSpace ? "editar_configuración" : "crear_nuevo_ecosistema"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 lowercase font-bold text-sm leading-relaxed">
                define el núcleo de tu proyecto generativo. la ia utilizará este contexto para cada activo producido.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-8 py-6 lowercase">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] pl-1">nombre_del_ecosistema</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: nebula_marketing_campaign"
                  className="rounded-2xl border-white/5 bg-white/5 h-14 text-white placeholder:text-slate-700 focus:ring-[#d4ff00]/20 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] pl-1">brand_intelligence (core context)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ej: estética midnight graphite, acentos neon, tipografía geométrica, alto contraste..."
                  className="rounded-2xl border-white/5 bg-white/5 min-h-[140px] focus:ring-[#d4ff00]/20 p-5 text-white placeholder:text-slate-700 leading-relaxed font-bold"
                />
              </div>
            </div>
            <DialogFooter className="gap-3 mt-6">
              <Button 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-2xl font-black lowercase hover:bg-white/5 text-slate-500 h-14 px-8"
              >
                abortar
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-[#d4ff00] text-[#020203] hover:bg-[#c4eb00] rounded-2xl font-black lowercase px-10 h-14 shadow-2xl shadow-[#d4ff00]/10 transition-all active:scale-95"
                disabled={creating}
              >
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : editingSpace ? "sincronizar_cambios" : "inicializar_ecosistema"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Spaces;
