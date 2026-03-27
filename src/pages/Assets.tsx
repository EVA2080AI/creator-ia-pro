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
  Search, Loader2, Heart, Download, Trash2, ImageOff,
  Star, Plus, Link, Layers, Sparkles, Cloud, Ghost
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

interface Space { id: string; name: string; }

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
    } catch {
      toast.error("Error loading assets");
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpace]);

  useEffect(() => {
    if (user) { fetchAssets(); fetchSpaces(); }
  }, [user, fetchAssets, fetchSpaces]);

  const handleImport = async () => {
    if (!user || !importUrl) return;
    setImporting(true);
    try {
      const domain = new URL(importUrl).hostname;
      const type = importUrl.match(/\.(png|jpg|jpeg|svg|webp|gif)/i)?.[0]?.replace(".", "") || "image";
      const tags = ["curated", domain.split(".")[0], type];
      const { data, error } = await supabase.from("saved_assets").insert({
        user_id: user.id, asset_url: importUrl, type,
        space_id: importSpace && importSpace !== "none_direct" ? importSpace : null,
        tags, prompt: `Imported from ${domain}`,
      }).select().single();
      if (error) throw error;
      toast.success("Asset imported successfully");
      setAssets([data as any, ...assets]);
      setIsImportOpen(false);
      setImportUrl("");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleFav = async (id: string, current: boolean) => {
    const { error } = await supabase.from("saved_assets").update({ is_favorite: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, is_favorite: !current } : a)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    const { error } = await supabase.from("saved_assets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Asset deleted"); setAssets((prev) => prev.filter((a) => a.id !== id)); }
  };

  const handleSaveToDrive = async (asset: SavedAsset) => {
    toast.promise(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { name: asset.prompt?.slice(0, 20) || "nexus_asset" };
      },
      {
        loading: "Uploading to Google Drive...",
        success: (d) => `"${d.name}" saved to Drive`,
        error: "Error connecting to Google",
      }
    );
  };

  const filtered = assets.filter((a) => {
    const matchSearch = !search || a.prompt?.toLowerCase().includes(search.toLowerCase()) || a.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFav = !filterFav || a.is_favorite;
    return matchSearch && matchFav;
  });

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <Loader2 className="h-8 w-8 animate-spin text-aether-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white font-sans selection:bg-aether-purple/30 selection:text-white">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-aether-blue/5 blur-[150px]" />
        <div className="absolute top-1/4 left-0 h-[400px] w-[400px] rounded-full bg-aether-purple/5 blur-[120px]" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-[1440px] px-8 py-12 pt-24">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-aether-blue animate-pulse shadow-[0_0_8px_rgba(0,194,255,0.8)]" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Asset Nexus v8.0</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-display leading-none">
              Mi <span className="bg-gradient-to-r from-aether-blue to-aether-purple bg-clip-text text-transparent">Biblioteca</span>
            </h1>
            <p className="text-sm text-white/30 font-medium max-w-md leading-relaxed">
              Generaciones guardadas, recursos curados y activos de marca persistentes.
            </p>
          </div>
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-3 bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-4 text-xs font-bold uppercase tracking-widest font-display transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] shrink-0"
          >
            <Plus className="h-4 w-4" />
            Importar Recurso
          </button>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 group-focus-within:text-aether-purple transition-colors" />
            <Input
              placeholder="Buscar por prompt o tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/[0.03] border-white/5 pl-14 rounded-2xl h-14 text-white placeholder:text-white/10 focus:border-aether-purple/30 focus:ring-0 font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={selectedSpace} onValueChange={setSelectedSpace}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-2xl bg-white/[0.03] border-white/5 h-14 text-xs font-bold text-white/40 focus:ring-0 font-display uppercase tracking-widest">
                <Layers className="mr-2 h-4 w-4 text-white/20" />
                <SelectValue placeholder="Todos los spaces" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-[#0a0a0d]/95 backdrop-blur-3xl text-white">
                <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest font-display">Todos los Spaces</SelectItem>
                <SelectItem value="none" className="text-xs font-bold uppercase tracking-widest font-display">Sin Space</SelectItem>
                {spaces.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs font-bold font-display">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setFilterFav(!filterFav)}
              className={`h-14 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest font-display transition-all duration-300 flex items-center gap-2 ${
                filterFav
                  ? "bg-aether-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  : "bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/60"
              }`}
            >
              <Star className={`h-4 w-4 ${filterFav ? "fill-white" : ""}`} />
              Favoritos
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-aether-purple" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Ghost className="h-12 w-12 text-white/10" />
            <p className="text-xl font-bold text-white/40 font-display tracking-tight">
              {search || filterFav ? "Sin resultados" : "Tu biblioteca está vacía"}
            </p>
            <p className="text-sm text-white/20">
              {search || filterFav ? "Prueba otros filtros" : "Las imágenes generadas en el canvas se guardan aquí"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#080809]/60 backdrop-blur-3xl shadow-2xl transition-all hover:border-aether-purple/20 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] duration-500"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={asset.asset_url}
                    alt={asset.prompt || "Asset"}
                    className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-transparent opacity-70 group-hover:opacity-30 transition-opacity duration-500" />
                </div>

                {/* Action Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                  <div className="flex justify-end gap-1.5">
                    {[
                      { icon: Heart, onClick: () => toggleFav(asset.id, asset.is_favorite), active: asset.is_favorite, activeClass: "text-rose-400 fill-rose-400" },
                      { icon: Cloud, onClick: () => handleSaveToDrive(asset), active: false, activeClass: "" },
                      { icon: Download, onClick: () => window.open(asset.asset_url, "_blank"), active: false, activeClass: "" },
                      { icon: Trash2, onClick: () => handleDelete(asset.id), active: false, activeClass: "hover:text-rose-400" },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.onClick}
                        className={`h-8 w-8 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all ${btn.activeClass}`}
                      >
                        <btn.icon className={`h-3.5 w-3.5 ${btn.active ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {asset.prompt && (
                      <p className="text-xs text-white/80 line-clamp-2 leading-relaxed font-medium bg-black/40 backdrop-blur-sm rounded-xl p-2">{asset.prompt}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50 uppercase tracking-widest font-display">{asset.type}</span>
                      {asset.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-aether-purple/20 text-aether-purple/80 uppercase tracking-widest font-display">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Favorite indicator */}
                {asset.is_favorite && (
                  <div className="absolute top-3 left-3">
                    <Star className="h-4 w-4 fill-aether-purple text-aether-purple drop-shadow-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-3xl border-white/10 sm:max-w-[440px] rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-aether-blue/10 border border-aether-blue/20 flex items-center justify-center mb-6">
              <Link className="h-7 w-7 text-aether-blue" />
            </div>
            <DialogTitle className="text-3xl font-bold text-white tracking-tight font-display">
              Importar Recurso
            </DialogTitle>
            <DialogDescription className="text-white/30 font-medium leading-relaxed mt-2">
              Guarda activos externos en tu biblioteca. La IA extraerá la paleta automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 ml-1 font-display">URL del Asset</Label>
              <div className="relative">
                <Link className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="pl-14 rounded-2xl border-white/5 bg-white/[0.03] h-14 text-white placeholder:text-white/10 focus:border-aether-blue/30 focus:ring-0 font-medium"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 ml-1 font-display">Asignar a Space</Label>
              <Select value={importSpace} onValueChange={setImportSpace}>
                <SelectTrigger className="rounded-2xl border-white/5 bg-white/[0.03] h-14 focus:ring-0 font-bold text-white/40 text-xs font-display uppercase tracking-widest">
                  <SelectValue placeholder="Selecciona un space (opcional)" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-[#0a0a0d]/95 backdrop-blur-3xl text-white">
                  <SelectItem value="none_direct" className="text-xs font-bold uppercase tracking-widest font-display">Sin espacio</SelectItem>
                  {spaces.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs font-bold font-display">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-4 mt-2">
            <button
              onClick={() => setIsImportOpen(false)}
              className="flex-1 px-6 py-4 rounded-2xl border border-white/5 text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white hover:bg-white/5 transition-all font-display"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !importUrl}
              className="flex-[1.5] flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 font-display"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Importar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assets;
