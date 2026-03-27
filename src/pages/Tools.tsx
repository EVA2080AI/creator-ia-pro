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
  Upload, Loader2, Download, Coins, MessageSquare,
  PenTool, Hash, Image, FileText, Megaphone, Copy, X, Zap,
  ClipboardCopy
} from "lucide-react";
import { ModelSelector, AVAILABLE_MODELS } from "@/components/ModelSelector";
import { cn } from "@/lib/utils";

type ToolId =
  | "enhance" | "upscale" | "eraser" | "background" | "restore" | "generate"
  | "logo"
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
}

const tools: Tool[] = [
  // ── Imagen ──────────────────────────────────────────────────────────────────
  { id: "generate",   name: "Crear imagen",         desc: "Genera imágenes desde texto con IA.",                  icon: Image,       credits: 2, category: "image", needsUpload: false, placeholder: "Ej. Un gato astronauta en Marte al atardecer, estilo fotorrealista, luz dramática...", color: "text-white" },
  { id: "logo",       name: "Diseñar logo",          desc: "Genera logos e identidades de marca con IA.",          icon: PenTool,     credits: 3, category: "image", needsUpload: false, placeholder: "Ej. Logo minimalista para una cafetería llamada Origen, tonos cálidos, fondo blanco...", color: "text-aether-blue" },
  { id: "enhance",    name: "Mejorar imagen",        desc: "Mejora iluminación y detalles automáticamente.",       icon: Wand2,       credits: 2, category: "image", needsUpload: true,  color: "text-aether-purple" },
  { id: "upscale",    name: "Aumentar resolución",   desc: "Escala imágenes hasta 4K sin perder calidad.",         icon: ZoomIn,      credits: 3, category: "image", needsUpload: true,  color: "text-aether-blue" },
  { id: "eraser",     name: "Borrar objeto",         desc: "Elimina cualquier objeto de la imagen sin rastros.",   icon: X,           credits: 2, category: "image", needsUpload: true,  color: "text-rose-400" },
  { id: "background", name: "Quitar fondo",          desc: "Extrae el fondo con bordes perfectos.",                icon: ImagePlus,   credits: 1, category: "image", needsUpload: true,  color: "text-emerald-400" },
  { id: "restore",    name: "Restaurar foto",        desc: "Restaura fotos antiguas o dañadas.",                   icon: RotateCcw,   credits: 3, category: "image", needsUpload: true,  color: "text-amber-400" },
  // ── Texto ───────────────────────────────────────────────────────────────────
  { id: "copywriter", name: "Crear texto",           desc: "Genera textos y copy para marketing.",                 icon: MessageSquare, credits: 1, category: "text", needsUpload: false, placeholder: "Ej. Escribe un mensaje persuasivo para vender zapatos deportivos en Instagram...", color: "text-aether-purple" },
  { id: "social",     name: "Contenido para redes",  desc: "Crea posts y estrategias para redes sociales.",        icon: Hash,          credits: 2, category: "text", needsUpload: false, placeholder: "Ej. 5 ideas de contenido para Instagram de una marca de ropa sostenible...", color: "text-rose-400" },
  { id: "blog",       name: "Escribir artículo",     desc: "Artículos largos optimizados para SEO.",               icon: FileText,      credits: 1, category: "text", needsUpload: false, placeholder: "Ej. Artículo completo sobre los beneficios del café de especialidad en 2025...", color: "text-emerald-400" },
  { id: "ads",        name: "Crear anuncio",         desc: "Anuncios para Google, Meta y más.",                    icon: Megaphone,     credits: 1, category: "text", needsUpload: false, placeholder: "Ej. Anuncio de Google Ads para un servicio de consultoría de marketing digital...", color: "text-white" },
];

const IMAGE_STYLES = ["Fotorrealista", "Minimalista", "Anime", "Acuarela", "Cyberpunk", "Bauhaus", "3D", "Vintage"];
const LOGO_STYLES  = ["Minimalista", "Tipográfico", "Vintage", "Geométrico", "Moderno", "Playful", "Lujo", "Tech"];

const appIdToToolId: Record<string, ToolId> = {
  copywriter: "copywriter", logo: "logo", social: "social", blog: "blog", ads: "ads",
};

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^---+$/gm, "<hr />")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^\s*[-*•] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/(.+)(?<!\>)$/gm, (line) =>
      !line.match(/^<[h1-6ul]|^<li|^<hr|^<blockquote/) ? `<p>${line}</p>` : line
    );
}

const categories = [
  { id: "image" as const, label: "Imagen", icon: Image },
  { id: "text"  as const, label: "Texto",  icon: FileText },
];

const Tools = () => {
  const { user, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const navigate = useNavigate();
  const { appId } = useParams();

  const [activeTool, setActiveTool]         = useState<ToolId>("generate");
  const [category, setCategory]             = useState<"image" | "text">("image");
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [resultImage, setResultImage]       = useState<string | null>(null);
  const [resultText, setResultText]         = useState<string | null>(null);
  const [processing, setProcessing]         = useState(false);
  const [copyingImage, setCopyingImage]     = useState(false);
  const [textPrompt, setTextPrompt]         = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState("nano-banana-2");
  const [selectedTextModel,  setSelectedTextModel]  = useState("deepseek-chat");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (appId && appIdToToolId[appId]) {
      const tool = tools.find((t) => t.id === appIdToToolId[appId])!;
      setActiveTool(tool.id);
      setCategory(tool.category);
    }
  }, [appId]);

  const currentTool    = tools.find((t) => t.id === activeTool)!;
  const filteredTools  = tools.filter((t) => t.category === category);
  const activeModel    = category === "image" ? selectedImageModel : selectedTextModel;
  const modelObj       = AVAILABLE_MODELS.find((m) => m.id === activeModel) || AVAILABLE_MODELS[0];
  const requiredCredits = category === "image"
    ? currentTool.credits
    : modelObj.tokenCost;

  const switchTool = (tool: Tool) => {
    setActiveTool(tool.id);
    setResultImage(null);
    setResultText(null);
    setImagePreview(null);
    setTextPrompt("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const switchCategory = (cat: "image" | "text") => {
    setCategory(cat);
    const first = tools.find((t) => t.category === cat);
    if (first) switchTool(first);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Tipo de archivo no soportado"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
    setResultText(null);
  };

  const handleProcess = async () => {
    if (!user) return;
    if (currentTool.needsUpload && !imagePreview) { toast.error("Sube una imagen primero"); return; }
    if (!currentTool.needsUpload && !textPrompt.trim()) { toast.error("Escribe una descripción para continuar"); return; }

    const credits = profile?.credits_balance ?? 0;
    if (credits < requiredCredits) {
      toast.error(`Sin créditos. Necesitas ${requiredCredits} y tienes ${credits}.`);
      navigate("/pricing");
      return;
    }

    setProcessing(true);
    setResultImage(null);
    setResultText(null);

    try {
      const data = await aiService.processAction({
        action: category === "text" ? "chat" : "image",
        tool: activeTool,
        prompt: textPrompt,
        model: activeModel,
        image: imagePreview || undefined,
      });

      if (data?.url) {
        setResultImage(data.url);
        toast.success("¡Imagen generada!");
      } else if (data?.text) {
        setResultText(data.text);
        toast.success("¡Listo!");
      } else {
        throw new Error("La IA no devolvió resultado. Intenta de nuevo.");
      }
      await refreshProfile();
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar. Intenta de nuevo.", { duration: 5000 });
    } finally {
      setProcessing(false);
    }
  };

  // Copy image blob to clipboard
  const handleCopyImage = useCallback(async (url: string) => {
    setCopyingImage(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast.success("Imagen copiada al portapapeles");
    } catch {
      // Fallback: copy URL
      navigator.clipboard.writeText(url);
      toast.success("URL de imagen copiada");
    } finally {
      setCopyingImage(false);
    }
  }, []);

  const styleList = activeTool === "logo" ? LOGO_STYLES : IMAGE_STYLES;

  return (
    <div className="h-screen flex flex-col bg-[#050506] text-white font-sans overflow-hidden selection:bg-aether-purple/30">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <div className="flex flex-1 overflow-hidden" style={{ marginTop: "64px" }}>

        {/* ── Left Sidebar ──────────────────────────────────────── */}
        <aside className="w-60 shrink-0 border-r border-white/[0.05] bg-[#070708] flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="p-3 border-b border-white/[0.05]">
            <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.05] gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => switchCategory(cat.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all font-display",
                    category === cat.id ? "bg-white text-black shadow" : "text-white/30 hover:text-white/60"
                  )}
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tool list */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredTools.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => switchTool(tool)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                    isActive
                      ? "bg-white/[0.07] border border-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive ? cn("bg-white/10", tool.color) : "bg-white/[0.04] text-white/20"
                  )}>
                    <tool.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-none">{tool.name}</p>
                    <p className="text-[10px] text-white/25 mt-0.5 truncate">
                      {tool.credits} crédito{tool.credits > 1 ? "s" : ""}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-aether-purple shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Credits */}
          <div className="p-3 border-t border-white/[0.05]">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-all group"
            >
              <Coins className="h-4 w-4 text-aether-purple shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12px] font-bold text-white/50 leading-none">
                  {profile?.credits_balance?.toLocaleString() ?? "0"} créditos
                </p>
                <p className="text-[10px] text-white/20 mt-0.5">Recargar →</p>
              </div>
            </button>
          </div>
        </aside>

        {/* ── Main: Input + Result ──────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Input Panel */}
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto p-6 border-r border-white/[0.04]">
            {/* Tool header */}
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/[0.08] shrink-0", currentTool.color)}>
                <currentTool.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">{currentTool.name}</h2>
                <p className="text-xs text-white/30 mt-0.5">{currentTool.desc}</p>
              </div>
            </div>

            {/* Model selector */}
            {category === "text" && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-aether-purple" /> Modelo de IA
                </p>
                <ModelSelector
                  selectedModelId={selectedTextModel}
                  onModelChange={setSelectedTextModel}
                  filterType="text"
                />
              </div>
            )}

            {/* Image model selector */}
            {category === "image" && !currentTool.needsUpload && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-aether-purple" /> Motor de imagen
                </p>
                <ModelSelector
                  selectedModelId={selectedImageModel}
                  onModelChange={setSelectedImageModel}
                  filterType="image"
                />
              </div>
            )}

            {/* Upload or Textarea */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {currentTool.needsUpload ? (
              !imagePreview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 min-h-[200px] flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] hover:border-aether-purple/30 hover:bg-aether-purple/[0.04] transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="h-6 w-6 text-white/20 group-hover:text-white/40 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/30 group-hover:text-white/50 transition-colors">
                      Sube tu imagen aquí
                    </p>
                    <p className="text-xs text-white/15 mt-1">PNG, JPG, WEBP · Máx 10MB</p>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black flex-1 min-h-[200px]">
                  <img src={imagePreview} alt="Imagen subida" className="w-full h-full object-contain max-h-72" />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setResultImage(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute right-3 top-3 rounded-xl bg-black/70 p-2 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 transition-all text-white/40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-3 right-3 text-[11px] font-bold text-white/30 bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                  >
                    Cambiar imagen
                  </button>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder={currentTool.placeholder}
                  rows={7}
                  className="flex-1 w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-aether-purple/30 focus:bg-white/[0.03] transition-all leading-relaxed"
                />
                {/* Style pills */}
                {(activeTool === "generate" || activeTool === "logo") && (
                  <div className="flex flex-wrap gap-2">
                    {styleList.map((style) => (
                      <button
                        key={style}
                        onClick={() =>
                          setTextPrompt((prev) => (prev ? `${prev}, estilo ${style}` : `Estilo ${style}: `))
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] font-medium text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Process button */}
            <Button
              onClick={handleProcess}
              disabled={processing || (currentTool.needsUpload ? !imagePreview : !textPrompt.trim())}
              className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-sm shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 mt-auto flex items-center gap-2"
            >
              {processing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generar · {requiredCredits} crédito{requiredCredits > 1 ? "s" : ""}</>
              )}
            </Button>
          </div>

          {/* Result Panel */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-white/25 uppercase tracking-widest">Resultado</p>
              {(resultImage || resultText) && (
                <button
                  onClick={() => { setResultImage(null); setResultText(null); }}
                  className="text-[11px] font-medium text-white/20 hover:text-white/50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {processing ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center min-h-[300px]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-aether-purple/20 blur-2xl animate-pulse rounded-full" />
                    <Loader2 className="h-12 w-12 text-aether-purple animate-spin relative z-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white/40">Generando con IA...</p>
                    <p className="text-xs text-white/20">Puede tomar unos segundos</p>
                  </div>
                </div>

              ) : resultImage ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-500">
                  <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black relative group">
                    <img
                      src={resultImage}
                      alt="Imagen generada"
                      className="w-full object-contain max-h-[480px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23111' width='400' height='300'/%3E%3Ctext fill='%23555' font-size='14' x='50%25' y='50%25' text-anchor='middle'%3EError al cargar imagen%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {/* Download */}
                    <a
                      href={resultImage}
                      download={`creator-ia-${activeTool}-${Date.now()}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                    >
                      <button className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-2">
                        <Download className="h-4 w-4" /> Descargar
                      </button>
                    </a>
                    {/* Copy image */}
                    <button
                      onClick={() => handleCopyImage(resultImage)}
                      disabled={copyingImage}
                      title="Copiar imagen"
                      className="h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.10] transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {copyingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCopy className="h-4 w-4" />}
                      Copiar
                    </button>
                    {/* Copy URL */}
                    <button
                      onClick={() => { navigator.clipboard.writeText(resultImage); toast.success("URL copiada"); }}
                      title="Copiar URL"
                      className="h-11 w-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/20 hover:text-white/60 transition-all flex items-center justify-center"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              ) : resultText ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-500 flex-1">
                  <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 overflow-y-auto min-h-[280px]">
                    <div
                      className="result-prose text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(resultText) }}
                    />
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(resultText); toast.success("Texto copiado"); }}
                    className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all"
                  >
                    <Copy className="h-4 w-4" /> Copiar texto
                  </button>
                </div>

              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center rounded-2xl border border-dashed border-white/[0.05] min-h-[300px] p-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white/[0.10]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/20">Listo para generar</p>
                    <p className="text-xs text-white/10 mt-1">El resultado aparece aquí</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
