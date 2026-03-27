import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { aiService } from "@/services/ai-service";
import {
  Wand2, ZoomIn, ImagePlus, RotateCcw, Sparkles,
  Upload, Loader2, Download, Coins,
  PenTool, Hash, Image, FileText, Megaphone, Copy, X, Zap,
  BookmarkPlus, CheckCircle2, Lock, Palette, ShoppingBag, User,
  ChevronDown, Check, SlidersHorizontal,
} from "lucide-react";
import { ModelSelector, AVAILABLE_MODELS } from "@/components/ModelSelector";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolId =
  | "enhance" | "upscale" | "eraser" | "background" | "restore" | "generate"
  | "logo" | "style" | "product"
  | "copywriter" | "social" | "blog" | "ads";

interface Tool {
  id: ToolId;
  name: string;
  desc: string;
  icon: typeof Wand2;
  credits: number;
  category: "image" | "text";
  needsUpload: boolean;
  placeholder?: string;
  color: string;
  disabled?: boolean;
  disabledReason?: string;
}

// ─── Tool list ────────────────────────────────────────────────────────────────
const tools: Tool[] = [
  { id: "generate",   name: "Crear imagen",        desc: "Genera imágenes desde texto con IA.",            icon: Image,       credits: 2, category: "image", needsUpload: false, placeholder: "Un gato astronauta en Marte al atardecer, estilo fotorrealista, luz dramática...", color: "text-white" },
  { id: "logo",       name: "Diseñar logo",         desc: "Logos e identidades de marca con IA.",           icon: PenTool,     credits: 3, category: "image", needsUpload: false, placeholder: "Logo minimalista para una cafetería llamada Origen, tonos cálidos, fondo blanco...", color: "text-aether-blue" },
  { id: "enhance",    name: "Mejorar imagen",       desc: "Mejora iluminación y detalles.",                 icon: Wand2,       credits: 2, category: "image", needsUpload: true,  color: "text-aether-purple" },
  { id: "upscale",    name: "Aumentar resolución",  desc: "Escala hasta 4K sin perder calidad.",            icon: ZoomIn,      credits: 3, category: "image", needsUpload: true,  color: "text-aether-blue" },
  { id: "background", name: "Quitar fondo",         desc: "Extrae el fondo con bordes perfectos.",          icon: ImagePlus,   credits: 1, category: "image", needsUpload: true,  color: "text-emerald-400" },
  { id: "style",      name: "Transferir estilo",    desc: "Aplica el estilo de una imagen a otra.",         icon: Palette,     credits: 2, category: "image", needsUpload: true,  color: "text-aether-purple" },
  { id: "product",    name: "Mockup de producto",   desc: "Renders profesionales de producto.",             icon: ShoppingBag, credits: 3, category: "image", needsUpload: true,  color: "text-amber-400" },
  { id: "restore",    name: "Restaurar foto",       desc: "Restaura fotos antiguas o dañadas.",             icon: RotateCcw,   credits: 3, category: "image", needsUpload: true,  color: "text-amber-400" },
  { id: "eraser",     name: "Borrar objeto",        desc: "Elimina objetos de la imagen.",                  icon: X,           credits: 2, category: "image", needsUpload: true,  color: "text-rose-400/40", disabled: true, disabledReason: "Próximamente" },
  { id: "copywriter", name: "Crear texto",          desc: "Copy persuasivo para marketing y ventas.",       icon: Megaphone,   credits: 1, category: "text",  needsUpload: false, placeholder: "Escribe un mensaje persuasivo para vender zapatos deportivos en Instagram...", color: "text-aether-purple" },
  { id: "social",     name: "Contenido para redes", desc: "Posts y estrategias para redes sociales.",       icon: Hash,        credits: 2, category: "text",  needsUpload: false, placeholder: "5 ideas de contenido para Instagram de una marca de ropa sostenible...", color: "text-rose-400" },
  { id: "blog",       name: "Escribir artículo",    desc: "Artículos optimizados para SEO.",                icon: FileText,    credits: 1, category: "text",  needsUpload: false, placeholder: "Artículo completo sobre los beneficios del café de especialidad en 2025...", color: "text-emerald-400" },
  { id: "ads",        name: "Crear anuncio",        desc: "Anuncios para Google, Meta y más.",              icon: Megaphone,   credits: 1, category: "text",  needsUpload: false, placeholder: "Anuncio de Google Ads para un servicio de consultoría de marketing digital...", color: "text-white" },
];

const IMAGE_STYLES  = ["Fotorrealista", "Minimalista", "Anime", "Acuarela", "Cyberpunk", "Bauhaus", "3D", "Vintage"];
const LOGO_STYLES   = ["Minimalista", "Tipográfico", "Vintage", "Geométrico", "Moderno", "Playful", "Lujo", "Tech"];
const ASPECT_RATIOS = [
  { label: "1:1",  w: 1024, h: 1024 },
  { label: "16:9", w: 1280, h: 720  },
  { label: "9:16", w: 720,  h: 1280 },
  { label: "4:5",  w: 820,  h: 1024 },
];

const appIdToToolId: Record<string, ToolId> = {
  copywriter: "copywriter", logo: "logo", social: "social",
  blog: "blog", ads: "ads", enhance: "enhance",
  "remove-bg": "background", style: "style", upscale: "upscale", product: "product",
};

// ─── Markdown ─────────────────────────────────────────────────────────────────
function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm,  '<h1 class="text-lg font-bold text-white mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em class="italic text-white/80">$1</em>')
    .replace(/`([^`\n]+)`/g,   '<code class="bg-white/[0.08] text-sky-300 px-1.5 py-0.5 rounded text-[12px] font-mono">$1</code>')
    .replace(/^---+$/gm,       '<hr class="border-white/10 my-4" />')
    .replace(/^\s*[-*•] (.+)$/gm, '<li class="flex gap-2 my-1"><span class="text-aether-purple mt-1 shrink-0">›</span><span class="text-white/80">$1</span></li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="my-3 space-y-0.5">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="mt-3 text-white/75 leading-relaxed">')
    .replace(/^(?!<[hublpei])(.+)$/gm, line =>
      line.trim() ? `<p class="text-white/75 leading-relaxed">${line}</p>` : ''
    );
}

// ─── Processing state display ─────────────────────────────────────────────────
function ProcessingCanvas({ modelName, modelColor, category }: {
  modelName: string; modelColor: string; category: "image" | "text";
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-10">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ background: modelColor }} />
        <div className="relative w-20 h-20 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: modelColor }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: modelColor }} />
          <span className="text-[13px] font-bold uppercase tracking-widest text-white/60">{modelName}</span>
        </div>
        <p className="text-sm text-white/30">
          {category === "image" ? "Generando imagen con IA..." : "Generando contenido..."}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: modelColor + '60', animationDelay: `${i * 180}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Image with fallback ──────────────────────────────────────────────────────
function ImageWithFallback({ src, onRetry }: { src: string; onRetry: () => void }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] rounded-2xl">
          <Loader2 className="h-8 w-8 text-aether-purple animate-spin" />
        </div>
      )}
      {status === "error" ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <X className="h-7 w-7 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/60">La imagen no se pudo cargar</p>
            <p className="text-xs text-white/25 mt-1">El motor puede estar saturado</p>
          </div>
          <button onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition-all">
            <RotateCcw className="h-4 w-4" /> Intentar de nuevo
          </button>
        </div>
      ) : (
        <img
          src={src}
          alt="Imagen generada"
          className="w-full h-full object-contain max-h-full rounded-2xl"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          style={{ display: status === "loading" ? "none" : "block" }}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const Tools = () => {
  const { user, signOut, loading: authLoading } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const navigate = useNavigate();
  const { appId } = useParams();

  const [activeTool, setActiveTool]           = useState<ToolId>("generate");
  const [category, setCategory]               = useState<"image" | "text">("image");
  const [imagePreview, setImagePreview]       = useState<string | null>(null);
  const [resultImage, setResultImage]         = useState<string | null>(null);
  const [resultText, setResultText]           = useState<string>("");
  const [streaming, setStreaming]             = useState(false);
  const [processing, setProcessing]           = useState(false);
  const [savingAsset, setSavingAsset]         = useState(false);
  const [savedAsset, setSavedAsset]           = useState(false);
  const [textPrompt, setTextPrompt]           = useState("");
  const [aspectRatio, setAspectRatio]         = useState(ASPECT_RATIOS[0]);
  const [selectedImageModel, setSelectedImageModel] = useState("flux-schnell");
  const [selectedTextModel,  setSelectedTextModel]  = useState("deepseek-chat");
  const [showSettings, setShowSettings]       = useState(false);
  const resultRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (appId && appIdToToolId[appId]) {
      const tool = tools.find((t) => t.id === appIdToToolId[appId])!;
      setActiveTool(tool.id);
      setCategory(tool.category);
    }
  }, [appId]);

  // Auto-scroll result while streaming
  useEffect(() => {
    if (streaming && resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [resultText, streaming]);

  const currentTool     = tools.find((t) => t.id === activeTool)!;
  const filteredTools   = tools.filter((t) => t.category === category);
  const activeModel     = category === "image" ? selectedImageModel : selectedTextModel;
  const modelObj        = AVAILABLE_MODELS.find((m) => m.id === activeModel) || AVAILABLE_MODELS[0];
  const requiredCredits = category === "image" ? currentTool.credits : modelObj.tokenCost;
  const isRunning       = processing || streaming;
  const styleList       = activeTool === "logo" ? LOGO_STYLES : IMAGE_STYLES;

  const imageModelObj = AVAILABLE_MODELS.find(m => m.id === selectedImageModel) ?? AVAILABLE_MODELS[0];
  const textModelObj  = AVAILABLE_MODELS.find(m => m.id === selectedTextModel) ?? AVAILABLE_MODELS[0];
  const activeModelObj = category === "image" ? imageModelObj : textModelObj;

  const switchTool = (tool: Tool) => {
    if (tool.disabled) return;
    setActiveTool(tool.id);
    setResultImage(null);
    setResultText("");
    setImagePreview(null);
    setSavedAsset(false);
    setTextPrompt("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const switchCategory = (cat: "image" | "text") => {
    setCategory(cat);
    const first = tools.find((t) => t.category === cat && !t.disabled);
    if (first) switchTool(first);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Tipo de archivo no soportado"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagen demasiado grande. Máx 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
    setResultText("");
    setSavedAsset(false);
  };

  const handleProcess = useCallback(async () => {
    if (!user) return;
    if (currentTool.disabled) return;
    if (currentTool.needsUpload && !imagePreview) { toast.error("Sube una imagen primero"); return; }
    if (!currentTool.needsUpload && !textPrompt.trim()) { toast.error("Escribe una descripción para continuar"); return; }

    const credits = profile?.credits_balance ?? 0;
    if (credits < requiredCredits) {
      toast.error(`Sin créditos. Necesitas ${requiredCredits} y tienes ${credits}.`);
      navigate("/pricing");
      return;
    }

    setResultImage(null);
    setResultText("");
    setSavedAsset(false);

    // ── TEXT: streaming ───────────────────────────────────────────────────────
    if (category === "text") {
      setStreaming(true);
      try {
        await (supabase.rpc as any)("spend_credits", {
          _amount: requiredCredits, _action: activeTool, _model: activeModel, _node_id: null,
        });
      } catch (err: any) {
        setStreaming(false);
        toast.error(err?.message || "Créditos insuficientes");
        return;
      }

      let fullText = "";
      try {
        await aiService.streamTextGen(activeTool, textPrompt, activeModel, profile, (chunk) => {
          fullText += chunk;
          setResultText(fullText);
        });
        await refreshProfile();
      } catch (err: any) {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)("refund_credits", { _amount: requiredCredits, _user_id: u.id });
        if (!fullText) {
          setStreaming(false);
          setProcessing(true);
          try {
            const data = await aiService.processAction({ action: "chat", tool: activeTool, prompt: textPrompt, model: activeModel });
            if (data?.text) setResultText(data.text);
            await refreshProfile();
          } catch (fallbackErr: any) {
            toast.error(fallbackErr?.message || "Error al generar texto.");
          } finally { setProcessing(false); }
          return;
        }
      } finally { setStreaming(false); }
      return;
    }

    // ── IMAGE: async ──────────────────────────────────────────────────────────
    setProcessing(true);
    try {
      const data = await aiService.processAction({
        action: "image", tool: activeTool, prompt: textPrompt,
        model: activeModel, image: imagePreview || undefined,
      });
      if (data?.url) {
        setResultImage(data.url);
        toast.success("¡Imagen generada!");
      } else {
        throw new Error("La IA no devolvió resultado. Intenta de nuevo.");
      }
      await refreshProfile();
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar. Intenta de nuevo.", { duration: 5000 });
    } finally { setProcessing(false); }
  }, [user, currentTool, imagePreview, textPrompt, profile, requiredCredits, category, activeTool, activeModel, navigate, refreshProfile]);

  const handleSaveToAssets = async () => {
    if (!resultImage || !user) return;
    setSavingAsset(true);
    try {
      const { error } = await supabase.from("saved_assets").insert({
        user_id: user.id, type: "image", asset_url: resultImage,
        prompt: `${currentTool.name} — ${textPrompt.slice(0, 40) || "generado"}`,
        tags: [activeTool, "ai-generated"],
      } as any);
      if (error) throw error;
      setSavedAsset(true);
      toast.success("Guardado en Mis Activos");
    } catch {
      toast.error("No se pudo guardar el activo");
    } finally { setSavingAsset(false); }
  };

  const handleCopyImage = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success("Imagen copiada al portapapeles");
    } catch {
      navigator.clipboard.writeText(url);
      toast.success("URL copiada");
    }
  };

  // ─── Canvas content ─────────────────────────────────────────────────────────
  const renderCanvas = () => {
    if (processing) {
      return (
        <ProcessingCanvas
          modelName={activeModelObj.name}
          modelColor={category === "image" ? "#A855F7" : "#00C2FF"}
          category={category}
        />
      );
    }

    if (resultImage) {
      return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500 p-4">
          <div className="flex-1 relative min-h-0">
            <ImageWithFallback src={resultImage} onRetry={handleProcess} />
          </div>
          {/* Action bar */}
          <div className="flex items-center gap-2 shrink-0">
            <a href={resultImage} download={`creator-ia-${activeTool}-${Date.now()}.png`} target="_blank" rel="noreferrer" className="flex-1">
              <button className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Descargar
              </button>
            </a>
            <button onClick={handleSaveToAssets} disabled={savingAsset || savedAsset}
              className={cn("h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all",
                savedAsset ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                           : "border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.10]")}>
              {savingAsset ? <Loader2 className="h-4 w-4 animate-spin" /> : savedAsset ? <CheckCircle2 className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              {savedAsset ? "Guardado" : "Guardar"}
            </button>
            <button onClick={() => handleCopyImage(resultImage)}
              className="h-11 w-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/30 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={() => { setResultImage(null); setSavedAsset(false); }}
              className="h-11 w-11 rounded-xl border border-white/[0.06] text-white/20 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    if (resultText || streaming) {
      return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-300 p-4">
          <div ref={resultRef} className="flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 relative min-h-0">
            {streaming && !resultText && (
              <div className="flex items-center gap-3 text-white/30 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-aether-purple" />
                <span>Escribiendo...</span>
              </div>
            )}
            <div className="result-prose text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(resultText) }} />
            {streaming && resultText && (
              <span className="inline-block w-2 h-4 bg-aether-purple/70 animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
          {!streaming && resultText && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(resultText); toast.success("Texto copiado"); }}
                className="flex-1 h-11 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all">
                <Copy className="h-4 w-4" /> Copiar texto
              </button>
              <button onClick={() => { setResultText(""); setSavedAsset(false); }}
                className="h-11 w-11 rounded-xl border border-white/[0.06] text-white/20 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Empty state — upload or visual cue
    if (currentTool.needsUpload) {
      return imagePreview ? (
        <div className="relative flex-1 m-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
          <img src={imagePreview} alt="Imagen subida" className="w-full h-full object-contain" />
          <button onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-3 right-3 rounded-xl bg-black/70 p-2 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white/40 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="flex-1 m-4 flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-white/[0.07] bg-white/[0.01] hover:border-aether-purple/30 hover:bg-aether-purple/[0.03] transition-all group">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Upload className="h-7 w-7 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/30 group-hover:text-white/50 transition-colors">
              Arrastra o haz clic para subir
            </p>
            <p className="text-xs text-white/15 mt-1">PNG, JPG, WEBP · Máx 10MB</p>
          </div>
        </button>
      );
    }

    // Empty state — text tool or image gen
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-10">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl rounded-full bg-aether-purple/10" />
          <div className="relative w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <currentTool.icon className={cn("h-7 w-7", currentTool.color)} />
          </div>
        </div>
        <div>
          <h3 className="text-base font-bold text-white/40 font-display tracking-tight">{currentTool.name}</h3>
          <p className="text-sm text-white/20 mt-1 max-w-xs leading-relaxed">{currentTool.desc}</p>
        </div>
        <p className="text-[11px] text-white/12 uppercase tracking-widest">
          Escribe un prompt y presiona Generar
        </p>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050506]">
        <div className="w-12 h-12 rounded-2xl border-2 border-white/5 border-t-aether-purple animate-spin" />
      </div>
    );
  }

  const imageTools = tools.filter(t => t.category === "image");
  const textTools  = tools.filter(t => t.category === "text");

  return (
    <div className="fixed inset-0 flex bg-[#0a0a0b] text-white font-sans overflow-hidden" style={{ top: "64px" }}>
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080809] overflow-hidden">

        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 font-display">Herramientas IA</p>
        </div>

        {/* Tool list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">

          {/* Image section */}
          <div className="px-2 pt-3 pb-1.5">
            <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
              <Image className="h-3 w-3" /> Imagen
            </span>
          </div>
          {imageTools.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button key={tool.id} onClick={() => switchTool(tool)} disabled={tool.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                  tool.disabled ? "opacity-25 cursor-not-allowed" :
                  isActive
                    ? "bg-white/[0.07] border border-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                )}>
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  isActive ? "bg-aether-purple/20 text-aether-purple" : "bg-white/[0.04] text-white/20"
                )}>
                  {tool.disabled ? <Lock className="h-3.5 w-3.5" /> : <tool.icon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate leading-none">{tool.name}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {tool.disabled ? tool.disabledReason : `${tool.credits} crédito${tool.credits !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {isActive && <div className="w-1 h-4 rounded-full bg-aether-purple shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />}
              </button>
            );
          })}

          {/* Text section */}
          <div className="px-2 pt-4 pb-1.5">
            <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
              <FileText className="h-3 w-3" /> Texto & Copy
            </span>
          </div>
          {textTools.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button key={tool.id} onClick={() => switchTool(tool)} disabled={tool.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                  tool.disabled ? "opacity-25 cursor-not-allowed" :
                  isActive
                    ? "bg-white/[0.07] border border-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                )}>
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  isActive ? "bg-aether-purple/20 text-aether-purple" : "bg-white/[0.04] text-white/20"
                )}>
                  {tool.disabled ? <Lock className="h-3.5 w-3.5" /> : <tool.icon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate leading-none">{tool.name}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{tool.credits} crédito{tool.credits !== 1 ? "s" : ""}</p>
                </div>
                {isActive && <div className="w-1 h-4 rounded-full bg-aether-purple shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />}
              </button>
            );
          })}
        </nav>

        {/* Credits footer */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          <button onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all">
            <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-3.5 h-3.5 text-white/30" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11px] font-bold text-white/60 truncate leading-none">
                {profile?.display_name?.split(" ")[0] || "Mi perfil"}
              </p>
              <p className="text-[10px] text-white/25 mt-0.5 flex items-center gap-1">
                <Coins className="h-2.5 w-2.5 text-aether-purple" />
                {(profile?.credits_balance ?? 0).toLocaleString()} créditos
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {/* Result / Canvas — fills all space */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderCanvas()}
        </div>

        {/* ── Input bar (same pattern as Chat IA) ─────────────────────────── */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0b] px-5 py-4">

          {/* Contextual settings row — always visible, compact */}
          <div className="flex flex-wrap items-center gap-2 mb-3">

            {/* Model chip */}
            {category === "image" && !currentTool.needsUpload ? (
              <div className="relative">
                <button onClick={() => setShowSettings(v => !v)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all",
                    showSettings
                      ? "border-aether-purple/40 bg-aether-purple/10 text-aether-purple"
                      : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/15"
                  )}>
                  <Sparkles className="h-3 w-3" />
                  {imageModelObj.name}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showSettings && "rotate-180")} />
                </button>
              </div>
            ) : category === "text" ? (
              <button onClick={() => setShowSettings(v => !v)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all",
                  showSettings
                    ? "border-aether-purple/40 bg-aether-purple/10 text-aether-purple"
                    : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/15"
                )}>
                <Sparkles className="h-3 w-3" />
                {textModelObj.name}
                <ChevronDown className={cn("h-3 w-3 transition-transform", showSettings && "rotate-180")} />
              </button>
            ) : null}

            {/* Aspect ratio chips (always visible for image tools) */}
            {category === "image" && !currentTool.needsUpload && (
              <div className="flex gap-1">
                {ASPECT_RATIOS.map((ar) => (
                  <button key={ar.label} onClick={() => setAspectRatio(ar)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                      aspectRatio.label === ar.label
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/[0.02] border-white/[0.06] text-white/25 hover:text-white/50"
                    )}>
                    {ar.label}
                  </button>
                ))}
              </div>
            )}

            {/* Credits cost badge */}
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Zap className="h-3 w-3 text-aether-purple" />
              <span className="text-[10px] font-bold text-white/30">{requiredCredits} cr</span>
            </div>
          </div>

          {/* Expandable model selector */}
          {showSettings && (
            <div className="mb-3 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-3">
              {category === "image" && !currentTool.needsUpload && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Motor de imagen</p>
                  <ModelSelector selectedModelId={selectedImageModel} onModelChange={setSelectedImageModel} filterType="image" />
                </div>
              )}
              {category === "text" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Modelo de IA</p>
                  <ModelSelector selectedModelId={selectedTextModel} onModelChange={setSelectedTextModel} filterType="text" />
                </div>
              )}
              {(activeTool === "generate" || activeTool === "logo") && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Estilo rápido</p>
                  <div className="flex flex-wrap gap-1.5">
                    {styleList.map((style) => (
                      <button key={style}
                        onClick={() => setTextPrompt(p => p ? `${p}, estilo ${style}` : `Estilo ${style}: `)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] font-medium text-white/30 hover:text-white hover:bg-white/[0.07] transition-all">
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompt bar */}
          <div className="flex items-end gap-2">
            {/* Upload button (if tool needs image) */}
            {currentTool.needsUpload && (
              <button onClick={() => fileRef.current?.click()}
                className={cn(
                  "h-12 px-3.5 rounded-2xl border transition-all flex items-center justify-center shrink-0",
                  imagePreview
                    ? "border-aether-purple/40 bg-aether-purple/10 text-aether-purple"
                    : "border-white/[0.08] bg-white/[0.04] text-white/30 hover:text-white hover:bg-white/[0.08]"
                )}>
                <Upload className="h-4 w-4" />
              </button>
            )}

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !currentTool.needsUpload) {
                    e.preventDefault();
                    handleProcess();
                  }
                }}
                placeholder={
                  currentTool.needsUpload
                    ? imagePreview ? "Describe qué quieres hacer con esta imagen..." : "Sube una imagen primero..."
                    : (currentTool.placeholder || "Describe lo que quieres generar...")
                }
                rows={1}
                maxLength={1000}
                className="w-full resize-none rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-aether-purple/30 focus:bg-white/[0.05] transition-all leading-relaxed"
                style={{ minHeight: "48px", maxHeight: "140px", overflowY: "auto" }}
              />
            </div>

            {/* Generate button */}
            <Button
              onClick={handleProcess}
              disabled={isRunning || currentTool.disabled || (currentTool.needsUpload ? !imagePreview : !textPrompt.trim())}
              className="h-12 w-12 rounded-2xl bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.08)] hover:bg-white/90 active:scale-[0.97] transition-all disabled:opacity-30 shrink-0 flex items-center justify-center p-0"
            >
              {isRunning
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile tool scroll */}
          <div className="md:hidden flex overflow-x-auto no-scrollbar gap-1.5 pt-3 mt-3 border-t border-white/[0.06]">
            {tools.filter(t => !t.disabled).map(tool => (
              <button key={tool.id} onClick={() => switchTool(tool)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl shrink-0 transition-all",
                  activeTool === tool.id
                    ? "bg-white/[0.08] border border-white/[0.10] text-white"
                    : "text-white/30 hover:text-white/60"
                )}>
                <tool.icon className="h-4 w-4" />
                <span className="text-[9px] font-bold whitespace-nowrap">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
