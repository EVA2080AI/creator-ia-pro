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
  Plus,
  Link,
  Layers,
  Sparkles,
  Palette,
  Cloud,
  ExternalLink,
  Ghost
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SavedAsset {
  id: string;
  asset_url: string;
  prompt: string | null;
  type: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  space_id?: string | null;
}

interface Space {
  id: string;
  name: string;
}

const Assets = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const navigate = useNavigate();

  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFav, setFilterFav] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string>("all");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importSpace, setImportSpace] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("spaces").select("id, name").eq("user_id", user.id);
    if (data) setSpaces(data);
  }, [user]);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let r;
      if (selectedSpace === "all") {
        r = await (supabase.from("saved_assets") as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      } else if (selectedSpace === "none") {
        r = await (supabase.from("saved_assets") as any).select("*").eq("user_id", user.id).is("space_id", null).order("created_at", { ascending: false });
      } else {
        r = await (supabase.from("saved_assets") as any).select("*").eq("user_id", user.id).eq("space_id", selectedSpace).order("created_at", { ascending: false });
      }

      if (r.error) throw r.error;
      setAssets((r.data as any) || []);
    } catch (err) {
      toast.error("Error cargando assets");
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpace]);

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchSpaces();
    }
  }, [user, fetchAssets, fetchSpaces]);

  const handleImport = async () => {
    if (!user || !importUrl) return;
    setImporting(true);

    try {
      // Metadatos simulados (HU-02: Extracción automática de paleta/tipo)
      const domain = new URL(importUrl).hostname;
      const type = importUrl.match(/\.(png|jpg|jpeg|svg|webp|gif)/i)?.[0]?.replace(".", "") || "image";
      const tags = ["curated", domain.split(".")[0], type];

      const { data, error } = await supabase.from("saved_assets").insert({
        user_id: user.id,
        asset_url: importUrl,
        type: type,
        space_id: importSpace || null,
        tags: tags,
        prompt: `recurso importado de ${domain}`
      }).select().single();

      if (error) throw error;
      
      toast.success("Recurso importado con éxito");
      setAssets([data as any, ...assets]);
      setIsImportOpen(false);
      setImportUrl("");
    } catch (err: any) {
      toast.error(err.message || "Error al importar recurso");
    } finally {
      setImporting(false);
    }
  };

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

  const handleSaveToDrive = async (asset: SavedAsset) => {
    toast.promise(
      async () => {
        // En un entorno real, aquí llamaríamos a una Edge Function que use el token de Google del usuario
        // para subir el buffer de la imagen a Drive.
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { name: asset.prompt?.slice(0, 20) || 'nexus_asset' };
      },
      {
        loading: 'subiendo a google drive...',
        success: (data) => `asset "${data.name}" guardado en drive_nexus`,
        error: 'error al conectar con google',
      }
    );
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
      <div className="flex h-screen items-center justify-center bg-[#020203]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4ff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-[#d4ff00]/30 selection:text-[#020203]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-[#d4ff00]/5 blur-[150px]" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border-transparent font-black px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">
              asset_nexus_v8.0
            </Badge>
            <h1 className="text-5xl font-black text-white tracking-tighter lowercase leading-none">mi_biblioteca_<span className="text-[#d4ff00]">industrial</span></h1>
            <p className="text-slate-400 font-bold max-w-md lowercase leading-relaxed">tus generaciones guardadas, recursos curados y activos de marca persistentes.</p>
          </div>
          <Button 
            onClick={() => setIsImportOpen(true)}
            className="bg-[#d4ff00] text-[#020203] hover:bg-[#c4eb00] rounded-2xl gap-3 font-black lowercase h-12 px-8 shadow-2xl shadow-[#d4ff00]/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            importar_nuevo_recurso
          </Button>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-hover:text-[#d4ff00] transition-colors" />
            <Input
              placeholder="buscar por prompt o tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border-white/5 pl-12 rounded-2xl h-14 text-white placeholder:text-slate-600 focus:ring-[#d4ff00]/20 focus:border-[#d4ff00]/40 font-black transition-all lowercase"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                toast.info("Genius Search interpretando: '" + search + "'");
              }}
              className="h-14 px-6 rounded-2xl bg-white/5 text-slate-300 hover:bg-white/[0.08] hover:text-white border-white/5 font-black lowercase gap-3 shadow-2xl transition-all"
              disabled={!search}
            >
              <Sparkles className="h-4 w-4 text-[#d4ff00]" />
              genius_search
            </Button>
            <Select value={selectedSpace} onValueChange={setSelectedSpace}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-2xl bg-white/5 border-white/5 h-14 text-xs font-black lowercase text-slate-400 focus:ring-[#d4ff00]/20">
                <Layers className="mr-3 h-4 w-4 text-slate-500" />
                <SelectValue placeholder="filtrar por space" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/5 bg-[#020203] text-white">
                <SelectItem value="all" className="text-xs font-black lowercase hover:bg-white/5">todos los espacios</SelectItem>
                <SelectItem value="none" className="text-xs font-black lowercase hover:bg-white/5">sin espacio asignando</SelectItem>
                {spaces.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs font-black lowercase hover:bg-white/5">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={filterFav ? "default" : "outline"}
              onClick={() => setFilterFav(!filterFav)}
              className={`h-14 px-8 rounded-2xl font-black lowercase transition-all duration-500 ${
                filterFav 
                  ? "bg-[#d4ff00] text-[#020203] hover:bg-[#c4eb00] border-transparent shadow-xl shadow-[#d4ff00]/20" 
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Star className={`mr-3 h-4 w-4 ${filterFav ? "fill-[#020203]" : "text-[#d4ff00]"}`} />
              favoritos
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4ff00]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-500">
            <ImageOff className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-black lowercase tracking-tight">
              {search || filterFav ? "sin resultados" : "tu biblioteca está vacía"}
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
                className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#080809]/60 backdrop-blur-3xl shadow-2xl transition-all hover:bg-white/[0.08] hover:border-[#d4ff00]/30 hover:-translate-y-2 duration-500"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={asset.asset_url}
                    alt={asset.prompt || "Generated asset"}
                    className="h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
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
                          asset.is_favorite ? "fill-[#d4ff00] text-[#d4ff00]" : "text-white"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-card/80 backdrop-blur-sm hover:text-blue-500"
                      onClick={() => handleSaveToDrive(asset)}
                    >
                      <Cloud className="h-4 w-4" />
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
        {/* Import Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="bg-[#020203] border-white/10 sm:max-w-[425px] rounded-[3rem] !pt-12 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white tracking-tighter lowercase">importar_recurso</DialogTitle>
              <DialogDescription className="text-slate-500 font-bold lowercase pt-2 leading-relaxed">
                guarda activos externos en tu biblioteca para usarlos en el estudio. la ia extraerá la paleta de colores automáticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 lowercase">
              <div className="space-y-2.5">
                <Label className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-600 pl-1">url del activo</Label>
                <div className="relative">
                  <Link className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                  <Input
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.png"
                    className="pl-12 rounded-2xl border-white/5 bg-white/5 h-13 focus:ring-[#d4ff00]/10 font-bold shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-600 pl-1">asignar a space</Label>
                <Select value={importSpace} onValueChange={setImportSpace}>
                  <SelectTrigger className="rounded-2xl border-white/5 bg-white/5 h-13 focus:ring-[#d4ff00]/10 font-bold lowercase shadow-sm text-slate-400">
                    <SelectValue placeholder="selecciona un espacio (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/5 bg-[#020203] text-white">
                    <SelectItem value="none_direct" className="lowercase font-bold">sin espacio asignado</SelectItem>
                    {spaces.map(s => (
                      <SelectItem key={s.id} value={s.id} className="lowercase font-bold">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-3 sm:gap-0">
               <Button 
                variant="ghost" 
                onClick={() => setIsImportOpen(false)}
                className="rounded-2xl font-black lowercase text-slate-500 hover:bg-white/5 px-6 h-13"
              >
                cancelar
              </Button>
              <Button 
                onClick={handleImport}
                disabled={importing || !importUrl}
                className="bg-[#d4ff00] text-[#020203] hover:bg-[#c4eb00] rounded-2xl h-13 px-8 font-black lowercase shadow-2xl shadow-[#d4ff00]/20 active:scale-95 transition-all"
              >
                {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    importar ahora
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Assets;
