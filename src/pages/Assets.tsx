import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/AppHeader";
import {
  Search,
  Loader2,
  Heart,
  Download,
  Trash2,
  ImageOff,
  Star,
} from "lucide-react";

interface SavedAsset {
  id: string;
  asset_url: string;
  prompt: string | null;
  type: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
}

const Assets = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const navigate = useNavigate();

  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFav, setFilterFav] = useState(false);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Error cargando assets");
    else setAssets(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchAssets();
  }, [user, fetchAssets]);

  const toggleFav = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("saved_assets")
      .update({ is_favorite: !current })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_favorite: !current } : a))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este asset?")) return;
    const { error } = await supabase.from("saved_assets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Asset eliminado");
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const filtered = assets.filter((a) => {
    const matchSearch =
      !search ||
      a.prompt?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFav = !filterFav || a.is_favorite;
    return matchSearch && matchFav;
  });

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
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[150px]" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mi Biblioteca</h1>
          <p className="mt-1 text-muted-foreground">Tus generaciones guardadas, prompts favoritos y variaciones</p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por prompt o tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border-border pl-10"
            />
          </div>
          <Button
            variant={filterFav ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterFav(!filterFav)}
            className={filterFav ? "bg-gold text-primary-foreground hover:bg-gold/90" : "border-border"}
          >
            <Star className={`mr-1.5 h-4 w-4 ${filterFav ? "" : "text-gold"}`} />
            Favoritos
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <ImageOff className="mb-4 h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">
              {search || filterFav ? "Sin resultados" : "Tu biblioteca está vacía"}
            </p>
            <p className="text-sm">
              {search || filterFav
                ? "Prueba con otros filtros"
                : "Las imágenes generadas en el canvas se guardan aquí automáticamente"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card node-shadow"
              >
                <div className="aspect-square">
                  <img
                    src={asset.asset_url}
                    alt={asset.prompt || "Generated asset"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-card/80 backdrop-blur-sm"
                      onClick={() => toggleFav(asset.id, asset.is_favorite)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          asset.is_favorite ? "fill-gold text-gold" : "text-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-card/80 backdrop-blur-sm"
                      onClick={() => window.open(asset.asset_url, "_blank")}
                    >
                      <Download className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-card/80 backdrop-blur-sm"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div>
                    {asset.prompt && (
                      <p className="text-xs text-foreground line-clamp-2">{asset.prompt}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="border-border text-xs">
                        {asset.type}
                      </Badge>
                      {asset.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-primary/30 text-primary text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {asset.is_favorite && (
                  <div className="absolute top-2 left-2">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Assets;
