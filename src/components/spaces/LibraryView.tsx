import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Search, Loader2, Heart, Download, Trash2,
  Star, Plus, Link, Layers, Sparkles, Copy, Ghost, FileText, Maximize2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DocumentEditor } from "@/components/studio/DocumentEditor";

interface SavedAsset {
  id: string;
  asset_url: string;
  prompt: string | null;
  type: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  space_id?: string | null;
  content?: string | null;
}

interface Space { id: string; name: string; }

export const LibraryView = () => {
  const { user } = useAuth();
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<SavedAsset | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  const PAGE_SIZE = 24;

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("spaces").select("id, name").eq("user_id", user.id);
    if (data) setSpaces(data);
  }, [user]);

  const fetchAssets = useCallback(async (reset = false) => {
    if (!user) return;
    setLoading(true);
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    try {
      let q = (supabase.from("saved_assets") as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).range(from, to);
      if (selectedSpace === "none") q = q.is("space_id", null);
      else if (selectedSpace !== "all") q = q.eq("space_id", selectedSpace);
      const r = await q;
      if (r.error) throw r.error;
      const newData = (r.data as any) || [];
      setAssets(prev => reset || currentPage === 0 ? newData : [...prev, ...newData]);
      setHasMore(newData.length === PAGE_SIZE);
      if (reset) setPage(0);
    } catch {
      toast.error("Error al cargar activos");
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpace, page]); // Removed PAGE_SIZE because it's a constant

  useEffect(() => {
    if (user) { fetchAssets(true); fetchSpaces(); }
  }, [user, selectedSpace, fetchAssets, fetchSpaces]);

  useEffect(() => {
    if (user && page > 0) fetchAssets(false);
  }, [page, user, fetchAssets]);

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
        tags, prompt: `Importado de ${domain}`,
      }).select().single();
      if (error) throw error;
      toast.success("Recurso importado exitosamente");
      setAssets([data as any, ...assets]);
      setIsImportOpen(false);
      setImportUrl("");
    } catch (err: any) {
      toast.error(err.message || "Error al importar");
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
    const { error } = await supabase.from("saved_assets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Activo eliminado"); setAssets((prev) => prev.filter((a) => a.id !== id)); }
    setDeleteTargetId(null);
  };

  const handleCopyUrl = async (asset: SavedAsset) => {
    try {
      await navigator.clipboard.writeText(asset.asset_url || "");
      toast.success("URL copiada al portapapeles");
    } catch {
      toast.error("No se pudo copiar la URL");
    }
  };

  const handleSaveDocument = async (content: string) => {
    if (!editingAsset) return;
    setSavingDoc(true);
    try {
      const { error } = await supabase.from("saved_assets").update({ content }).eq("id", editingAsset.id);
      if (error) throw error;
      setAssets((prev) => prev.map((a) => (a.id === editingAsset.id ? { ...a, content } : a)));
      toast.success("Documento guardado");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el documento");
    } finally {
      setSavingDoc(false);
    }
  };

  const filtered = assets.filter((a) => {
    const matchSearch = !search || a.prompt?.toLowerCase().includes(search.toLowerCase()) || a.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFav = !filterFav || a.is_favorite;
    return matchSearch && matchFav;
  });

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por prompt, estilo o tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-50 border-zinc-200 pl-14 rounded-2xl h-14 text-zinc-900 placeholder:text-zinc-400 focus:border-primary/40 focus:ring-0 font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedSpace} onValueChange={setSelectedSpace}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-2xl bg-zinc-50 border-zinc-200 h-14 text-xs font-bold text-zinc-500 focus:ring-0 font-display uppercase tracking-widest">
              <Layers className="mr-2 h-4 w-4 text-zinc-400" />
              <SelectValue placeholder="Todos los spaces" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-zinc-200 bg-white text-zinc-900">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest font-display">Todos</SelectItem>
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
                ? "bg-primary text-white shadow-sm"
                : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <Star className={`h-4 w-4 ${filterFav ? "fill-white" : ""}`} />
            Favoritos
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="h-14 w-14 flex items-center justify-center rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm ml-2"
            title="Importar un recurso manual"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading && assets.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 border border-dashed border-zinc-200/60 rounded-3xl bg-zinc-50/50">
          <Ghost className="h-10 w-10 text-zinc-300" />
          <p className="text-lg font-bold text-zinc-400 font-display tracking-tight">
            {search || filterFav ? "Sin resultados" : "Tu biblioteca está vacía"}
          </p>
          <p className="text-[13px] text-zinc-400 font-medium">
            {search || filterFav ? "Prueba otros filtros" : "Las imágenes generadas en el canvas se guardan aquí"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm transition-all hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-md duration-300"
            >
              <div className="aspect-square relative overflow-hidden bg-zinc-50 border-b border-zinc-100 flex items-center justify-center p-6">
                {asset.type === "document" ? (
                  <div className="w-full h-full bg-white rounded-xl shadow-sm border border-zinc-200 p-4 overflow-hidden relative">
                    <div className="text-[10px] text-zinc-400 font-mono leading-relaxed line-clamp-6 opacity-70">
                      {asset.content ? asset.content.replace(/<[^>]*>?/gm, '') : "Documento vacío"}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                    <FileText className="absolute bottom-4 right-4 h-6 w-6 text-zinc-200" />
                  </div>
                ) : (
                  <img
                    src={asset.asset_url}
                    alt={asset.prompt || "Asset"}
                    className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                <div className="flex justify-end gap-1.5 z-10">
                  <button onClick={() => toggleFav(asset.id, asset.is_favorite)} className={`h-8 w-8 rounded-xl bg-white/90 backdrop-blur-xl border border-zinc-200 flex items-center justify-center transition-all ${asset.is_favorite ? 'text-rose-400 fill-rose-400' : 'text-zinc-500 hover:text-zinc-900'}`}>
                    <Heart className={`h-3.5 w-3.5 ${asset.is_favorite ? "fill-current" : ""}`} />
                  </button>
                  
                  {asset.type === "document" ? (
                    <button onClick={() => setEditingAsset(asset)} className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-primary transition-all">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleCopyUrl(asset)} className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => window.open(asset.asset_url, "_blank")} className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  <button onClick={() => setDeleteTargetId(asset.id)} className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {asset.prompt && (
                    <p className="text-xs text-white line-clamp-2 leading-relaxed font-medium bg-black/60 backdrop-blur-sm rounded-xl p-2">{asset.prompt}</p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-widest font-display">{asset.type}</span>
                    {asset.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary/80 uppercase tracking-widest font-display">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {asset.is_favorite && (
                <div className="absolute top-3 left-3">
                  <Star className="h-4 w-4 fill-primary text-primary drop-shadow-lg" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && filtered.length >= PAGE_SIZE && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-10 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all font-display bg-white shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cargar más"}
          </button>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <DialogContent className="bg-white border-zinc-200 sm:max-w-[380px] rounded-[3rem] p-10 shadow-xl shadow-zinc-200">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <Trash2 className="h-7 w-7 text-rose-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight font-display">Eliminar activo</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
              Esta acción no se puede deshacer. Se eliminará permanentemente de tu biblioteca.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-8">
            <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-6 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-all font-display bg-white">
              Cancelar
            </button>
            <button onClick={() => deleteTargetId && handleDelete(deleteTargetId)} className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-400 active:scale-95 transition-all font-display">
              Eliminar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="bg-white border-zinc-200 sm:max-w-[440px] rounded-[3rem] p-12 shadow-xl shadow-zinc-200">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
              <Link className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-3xl font-bold text-zinc-900 tracking-tight font-display">
              Importar Activo
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed mt-2">
              Pega una URL externa para guardarla en tu biblioteca y usarla más tarde en tus flujos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 ml-1 font-display">URL directa</Label>
              <div className="relative">
                <Link className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://.../img.png"
                  className="pl-14 rounded-2xl border-zinc-200 bg-zinc-50 h-14 text-zinc-900 placeholder:text-zinc-400 focus:border-primary/40 focus:ring-0 font-medium"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 ml-1 font-display">Etiquetar Space (Opcional)</Label>
              <Select value={importSpace} onValueChange={setImportSpace}>
                <SelectTrigger className="rounded-2xl border-zinc-200 bg-zinc-50 h-14 focus:ring-0 font-bold text-zinc-500 text-xs font-display uppercase tracking-widest">
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 bg-white text-zinc-900">
                  <SelectItem value="none_direct" className="text-xs font-bold uppercase tracking-widest font-display">Ninguno</SelectItem>
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
              className="flex-1 px-6 py-4 rounded-2xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all font-display bg-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !importUrl}
              className="flex-[1.5] flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-40 font-display"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Editor Fullscreen Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-full shadow-2xl animate-in zoom-in-95 duration-200">
            <DocumentEditor
              initialContent={editingAsset.content || ""}
              title={
                editingAsset.prompt 
                  ? editingAsset.prompt.length > 50 
                    ? editingAsset.prompt.substring(0, 50) + "..." 
                    : editingAsset.prompt 
                  : "Documento Nuevo"
              }
              onSave={handleSaveDocument}
              onClose={() => setEditingAsset(null)}
              isSaving={savingDoc}
            />
          </div>
        </div>
      )}
    </>
  );
};
