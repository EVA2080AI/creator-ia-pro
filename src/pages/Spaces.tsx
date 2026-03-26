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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Espacios</h1>
            <p className="mt-1 text-muted-foreground">Organiza tus proyectos generativos</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            disabled={creating}
            className="bg-[#ff0071] text-white hover:bg-[#e60066] gap-2 rounded-2xl shadow-lg shadow-[#ff0071]/10 px-6"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            nuevo_space
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar spaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border pl-10"
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <FolderOpen className="mb-4 h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">
              {search ? "Sin resultados" : "No tienes spaces todavía"}
            </p>
            <p className="text-sm">
              {search ? "Prueba con otro término" : "Crea uno para empezar a organizar tus generaciones"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((space) => (
              <div
                key={space.id}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-5 node-shadow hover:border-primary/30 transition-all"
                onClick={() => navigate(`/canvas?spaceId=${space.id}`)}
              >
                <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-muted/50 border border-border">
                  {space.thumbnail_url ? (
                    <img src={space.thumbnail_url} alt={space.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {space.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizado {new Date(space.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(space); }}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        configuración
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDelete(space.id); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Eliminar
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
          <DialogContent className="bg-white border-slate-50 sm:max-w-[425px] rounded-[2.5rem] !pt-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold lowercase tracking-tight">
                {editingSpace ? "editar_space" : "crear_nuevo_space"}
              </DialogTitle>
              <DialogDescription className="text-slate-400 lowercase font-medium">
                define el contexto creativo para que la ia entienda tu visión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4 lowercase font-sans">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 opacity-60 uppercase tracking-widest pl-1">nombre del proyecto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: marca x - campaña 2026"
                  className="rounded-2xl border-slate-50 bg-slate-50/50 focus:ring-[#ff0071]/20 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[11px] font-bold text-slate-400 opacity-60 uppercase tracking-widest pl-1">brand context (guía para ia)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ej: estética futurista, alto contraste, bordes redondeados (12px), colores neón..."
                  className="rounded-2xl border-slate-50 bg-slate-50/50 min-h-[120px] focus:ring-[#ff0071]/20 p-4 leading-relaxed"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-2xl font-bold lowercase hover:bg-slate-50 text-slate-400"
              >
                cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-[#ff0071] text-white hover:bg-[#e60066] rounded-2xl font-bold lowercase px-8 shadow-lg shadow-[#ff0071]/10"
                disabled={creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSpace ? "guardar_cambios" : "crear_space"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Spaces;
