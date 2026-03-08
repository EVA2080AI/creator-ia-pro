import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Loader2,
  Sparkles,
  FolderOpen,
  Coins,
  MoreVertical,
  Trash2,
  Pencil,
  Image,
  LayoutGrid,
  BookOpen,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdmin } from "@/hooks/useAdmin";

interface Space {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

const Spaces = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    const name = prompt("Nombre del Space:", "Mi Espacio");
    if (!name) {
      setCreating(false);
      return;
    }
    const { error } = await supabase
      .from("spaces")
      .insert({ user_id: user.id, name });
    if (error) toast.error(error.message);
    else {
      toast.success("Space creado");
      fetchSpaces();
    }
    setCreating(false);
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

  const handleRename = async (id: string, currentName: string) => {
    const name = prompt("Nuevo nombre:", currentName);
    if (!name) return;
    const { error } = await supabase.from("spaces").update({ name }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Renombrado");
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
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card glow-primary">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Canvas</span>
              <span className="text-foreground">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/spaces")}
              className="text-foreground"
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Spaces
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/canvas")}
              className="text-muted-foreground"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              Canvas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/assets")}
              className="text-muted-foreground"
            >
              <Image className="mr-1.5 h-4 w-4" />
              Assets
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pricing")}
              className="text-muted-foreground"
            >
              <Coins className="mr-1.5 h-4 w-4" />
              Planes
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-muted-foreground"
              >
                <Shield className="mr-1.5 h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
              <Coins className="h-3.5 w-3.5 text-gold" />
              <span className="text-gold font-semibold">{profile?.credits_balance ?? 0}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Spaces</h1>
            <p className="mt-1 text-muted-foreground">Organiza tus proyectos generativos</p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nuevo Space
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar spaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border pl-10"
          />
        </div>

        {/* Grid */}
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
                onClick={() => navigate("/canvas")}
              >
                {/* Thumbnail placeholder */}
                <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-muted/50 border border-border">
                  {space.thumbnail_url ? (
                    <img
                      src={space.thumbnail_url}
                      alt={space.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
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
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRename(space.id, space.name); }}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Renombrar
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
      </main>
    </div>
  );
};

export default Spaces;
