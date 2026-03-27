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
  ClipboardCopy, BookmarkPlus, CheckCircle2, Lock, Palette, ShoppingBag, User
} from "lucide-react";
import { ModelSelector, AVAILABLE_MODELS } from "@/components/ModelSelector";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

const tools: Tool[] = [
  // ── Imagen ──────────────────────────────────────────────────────────────────
  { id: "generate",   name: "Crear imagen",         desc: "Genera imágenes desde texto con IA.",                  icon: Image,         credits: 2, category: "image", needsUpload: false, placeholder: "Un gato astronauta en Marte al atardecer, estilo fotorrealista, luz dramática...", color: "text-white" },
  { id: "logo",       name: "Diseñar logo",          desc: "Genera logos e identidades de marca con IA.",          icon: PenTool,       credits: 3, category: "image", needsUpload: false, placeholder: "Logo minimalista para una cafetería llamada Origen, tonos cálidos, fondo blanco...", color: "text-aether-blue" },
  { id: "enhance",    name: "Mejorar imagen",        desc: "Mejora iluminación y detalles automáticamente.",       icon: Wand2,         credits: 2, category: "image", needsUpload: true,  color: "text-aether-purple" },
  { id: "upscale",    name: "Aumentar resolución",   desc: "Escala imágenes hasta 4K sin perder calidad.",         icon: ZoomIn,        credits: 3, category: "image", needsUpload: true,  color: "text-aether-blue" },
  { id: "background", name: "Quitar fondo",          desc: "Extrae el fondo con bordes perfectos.",                icon: ImagePlus,     credits: 1, category: "image", needsUpload: true,  color: "text-emerald-400" },
  { id: "style",      name: "Transferir estilo",     desc: "Aplica el estilo de una imagen a otra.",               icon: Palette,       credits: 2, category: "image", needsUpload: true,  color: "text-aether-purple" },
  { id: "product",    name: "Mockup de producto",    desc: "Crea renders profesionales de producto.",              icon: ShoppingBag,   credits: 3, category: "image", needsUpload: true,  color: "text-amber-400" },
  { id: "restore",    name: "Restaurar foto",        desc: "Restaura fotos antiguas o dañadas.",                   icon: RotateCcw,     credits: 3, category: "image", needsUpload: true,  color: "text-amber-400" },
  { id: "eraser",     name: "Borrar objeto",         desc: "Elimina objetos de la imagen. Próximamente.",          icon: X,             credits: 2, category: "image", needsUpload: true,  color: "text-rose-400/40", disabled: true, disabledReason: "Próximamente" },
  // ── Texto ───────────────────────────────────────────────────────────────────
  { id: "copywriter", name: "Crear texto",           desc: "Copy persuasivo para marketing y ventas.",             icon: MessageSquare, credits: 1, category: "text", needsUpload: false, placeholder: "Escribe un mensaje persuasivo para vender zapatos deportivos en Instagram...", color: "text-aether-purple" },
  { id: "social",     name: "Contenido para redes",  desc: "Posts y estrategias para redes sociales.",             icon: Hash,          credits: 2, category: "text", needsUpload: false, placeholder: "5 ideas de contenido para Instagram de una marca de ropa sostenible...", color: "text-rose-400" },
  { id: "blog",       name: "Escribir artículo",     desc: "Artículos largos optimizados para SEO.",               icon: FileText,      credits: 1, category: "text", needsUpload: false, placeholder: "Artículo completo sobre los beneficios del café de especialidad en 2025...", color: "text-emerald-400" },
  { id: "ads",        name: "Crear anuncio",         desc: "Anuncios para Google, Meta y más.",                    icon: Megaphone,     credits: 1, category: "text", needsUpload: false, placeholder: "Anuncio de Google Ads para un servicio de consultoría de marketing digital...", color: "text-white" },
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
  copywriter: "copywriter", 
  logo: "logo", 
  social: "social", 
  blog: "blog", 
  ads: "ads",
  enhance: "enhance",
  "remove-bg": "background",
  style: "style",
  upscale: "upscale",
  product: "product"
};

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm,  '<h1 class="text-lg font-bold text-white mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em class="italic text-white/80">$1</em>')
    .replace(/`([^`\n]+)`/g,   '<code class="bg-white/[0.08] text-sky-300 px-1.5 py-0.5 rounded text-[12px] font-mono">$1</code>')
    .replace(/^---+$/gm,       '<hr class="border-white/10 my-4" />')
    .replace(/^> (.+)$/gm,     '<blockquote class="border-l-2 border-aether-purple/50 pl-4 my-3 text-white/60 italic">$1</blockquote>')
    .replace(/^\s*[-*•] (.+)$/gm, '<li class="flex gap-2 my-1"><span class="text-aether-purple mt-1 shrink-0">›</span><span class="text-white/80">$1</span></li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul class="my-3 space-y-0.5">${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li class="flex gap-2 my-1"><span class="text-white/30 shrink-0 tabular-nums">·</span><span class="text-white/80">$1</span></li>')
    .replace(/\n\n/g, '</p><p class="mt-3 text-white/75 leading-relaxed">')
    .replace(/^(?!<[hublpei])(.+)$/gm, line =>
      line.trim() ? `<p class="text-white/75 leading-relaxed">${line}</p>` : ''
    );
}

const categories = [
  { id: "image" as const, label: "Imagen", icon: Image },
  { id: "text"  as const, label: "Texto",  icon: FileText },
];

function ImageWithFallback({ src, onRetry }: { src: string; onRetry: () => void }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  return (
    <div className="relative w-full min-h-[200px]">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
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
            <p className="text-xs text-white/25 mt-1">El motor de imagen puede estar saturado</p>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Intentar de nuevo
          </button>
        </div>
      ) : (
        <img
          src={src}
          alt="Imagen generada"
          className="w-full object-contain max-h-[420px]"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          style={{ display: status === "loading" ? "none" : "block" }}
        />
      )}
    </div>
  );
}

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
  const [copyingImage, setCopyingImage]       = useState(false);
  const [savingAsset, setSavingAsset]         = useState(false);
  const [savedAsset, setSavedAsset]           = useState(false);
  const [textPrompt, setTextPrompt]           = useState("");
  const [aspectRatio, setAspectRatio]         = useState(ASPECT_RATIOS[0]);
  const [selectedImageModel, setSelectedImageModel] = useState("flux-schnell");
  const [selectedTextModel,  setSelectedTextModel]  = useState("deepseek-chat");
  const fileRef    = useRef<HTMLInputElement>(null);
  const resultRef  = useRef<HTMLDivElement>(null);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050506]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-white/5 border-t-aether-purple animate-spin" />
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">Sincronizando Nexus...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (appId && appIdToToolId[appId]) {
      const tool = tools.find((t) => t.id === appIdToToolId[appId])!;
      setActiveTool(tool.id);
      setCategory(tool.category);
    }
  }, [appId]);

  // Auto-scroll result panel while streaming
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

  const handleProcess = async () => {
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

    // ── TEXT: use streaming ───────────────────────────────────────────────────
    if (category === "text") {
      setStreaming(true);
      // Optimistic credit deduct
      try {
        // Spend credits first
        await (supabase.rpc as any)("spend_credits", {
          _amount: requiredCredits,
          _action: activeTool,
          _model: activeModel,
          _node_id: null,
        });
      } catch (err: any) {
        setStreaming(false);
        toast.error(err?.message || "Créditos insuficientes");
        return;
      }

      let fullText = "";
      try {
        await aiService.streamTextGen(
          activeTool,
          textPrompt,
          activeModel,
          profile,
          (chunk) => {
            fullText += chunk;
            setResultText(fullText);
          },
        );
        await refreshProfile();
      } catch (err: any) {
        // Refund on error
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)("refund_credits", { _amount: requiredCredits, _user_id: u.id });
        if (!fullText) {
          // Streaming failed — fallback to regular
          setStreaming(false);
          setProcessing(true);
          try {
            const data = await aiService.processAction({
              action: "chat", tool: activeTool, prompt: textPrompt, model: activeModel,
            });
            if (data?.text) setResultText(data.text);
            await refreshProfile();
          } catch (fallbackErr: any) {
            toast.error(fallbackErr?.message || "Error al generar texto.");
          } finally {
            setProcessing(false);
          }
          return;
        }
      } finally {
        setStreaming(false);
      }
      return;
    }

    // ── IMAGE: regular async ──────────────────────────────────────────────────
    setProcessing(true);
    try {
      const data = await aiService.processAction({
        action: "image",
        tool: activeTool,
        prompt: textPrompt,
        model: activeModel,
        image: imagePreview || undefined,
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
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveToAssets = async () => {
    if (!resultImage || !user) return;
    setSavingAsset(true);
    try {
      const { error } = await supabase.from("saved_assets").insert({
        user_id: user.id,
        type: "image",
        asset_url: resultImage,
        prompt: `${currentTool.name} — ${textPrompt.slice(0, 40) || "generado"}`,
        tags: [activeTool, "ai-generated"],
      } as any);
      if (error) throw error;
      setSavedAsset(true);
      toast.success("Guardado en Mis Activos");
    } catch (err: any) {
      toast.error("No se pudo guardar el activo");
    } finally {
      setSavingAsset(false);
    }
  };

  const handleCopyImage = useCallback(async (url: string) => {
    setCopyingImage(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success("Imagen copiada al portapapeles");
    } catch {
      navigator.clipboard.writeText(url);
      toast.success("URL copiada");
    } finally {
      setCopyingImage(false);
    }
  }, []);

  const styleList = activeTool === "logo" ? LOGO_STYLES : IMAGE_STYLES;

  return (
    <div className="h-screen flex flex-col bg-[#050506] text-white font-sans overflow-hidden selection:bg-aether-purple/30">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <div className="flex flex-1 flex-col overflow-hidden" style={{ marginTop: "64px" }}>

        {/* ── Mobile tool selector (visible only on small screens) ── */}
        <div className="md:hidden flex flex-col bg-[#070708] border-b border-white/[0.05] shrink-0">
          <div className="flex border-b border-white/[0.05]">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => switchCategory(cat.id)} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all", category === cat.id ? "bg-white text-black" : "text-white/30 hover:text-white/60")}>
                <cat.icon className="h-3 w-3" />{cat.label}
              </button>
            ))}
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-1 p-2">
            {filteredTools.map((tool) => (
              <button key={tool.id} onClick={() => switchTool(tool)} disabled={tool.disabled} className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl shrink-0 transition-all text-center", tool.disabled ? "opacity-40 cursor-not-allowed" : activeTool === tool.id ? "bg-white/[0.08] border border-white/[0.10] text-white" : "text-white/30 hover:text-white/60")}>
                <tool.icon className="h-4 w-4" />
                <span className="text-[9px] font-bold whitespace-nowrap">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop: sidebar + main content ── */}
        <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ──────────────────────────────────── */}
        <aside className="hidden md:flex w-64 shrink-0 border-r border-sidebar bg-sidebar flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5 gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => switchCategory(cat.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-display",
                    category === cat.id 
                      ? "bg-white text-black shadow-lg" 
                      : "text-sidebar-foreground hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  <cat.icon className="h-3.5 w-3.5" />
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
                  disabled={tool.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group outline-none",
                    tool.disabled
                      ? "opacity-30 cursor-not-allowed"
                      : isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-inner"
                        : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive ? cn("bg-white/10", tool.color) : "bg-white/[0.04] text-white/20"
                  )}>
                    {tool.disabled ? <Lock className="h-3 w-3" /> : <tool.icon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-none">{tool.name}</p>
                    <p className="text-[10px] text-white/25 mt-0.5 truncate">
                      {tool.disabled ? tool.disabledReason : `${tool.credits} crédito${tool.credits > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {isActive && !tool.disabled && (
                    <div className="w-1.5 h-1.5 rounded-full bg-aether-purple shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Profile snippet footer (Tailwind UI pattern) */}
          <div className="mt-auto p-4 border-t border-sidebar-border bg-white/[0.01]">
            <button
               onClick={() => navigate("/profile")}
               className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-all group"
            >
               <div className="w-8 h-8 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center overflow-hidden shrink-0 group-hover:border-white/20">
                 {profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-4 h-4 text-sidebar-foreground group-hover:text-white" />
                 )}
               </div>
               <div className="flex-1 min-w-0 text-left">
                 <p className="text-[12px] font-bold text-white truncate leading-none">{profile?.display_name?.split(' ')[0] || 'Mi Perfil'}</p>
                 <p className="text-[10px] text-sidebar-foreground truncate mt-1">Ver perfil →</p>
               </div>
            </button>
          </div>
        </aside>

        {/* ── Main: Input + Result ──────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Input Panel */}
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto p-6 border-r border-white/[0.04]">
            {/* Tool header */}
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/[0.08] shrink-0", currentTool.color)}>
                <currentTool.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight font-display">{currentTool.name}</h2>
                <p className="text-[11px] text-white/30 mt-0.5">{currentTool.desc}</p>
              </div>
            </div>

            {/* Model selector */}
            {category === "text" && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-aether-purple" /> Modelo de IA
                </p>
                <ModelSelector selectedModelId={selectedTextModel} onModelChange={setSelectedTextModel} filterType="text" />
              </div>
            )}

            {category === "image" && !currentTool.needsUpload && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-aether-purple" /> Motor de imagen
                </p>
                <ModelSelector selectedModelId={selectedImageModel} onModelChange={setSelectedImageModel} filterType="image" />
              </div>
            )}

            {/* Aspect ratio (image gen only) */}
            {category === "image" && !currentTool.needsUpload && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Proporción</p>
                <div className="flex gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.label}
                      onClick={() => setAspectRatio(ar)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all",
                        aspectRatio.label === ar.label
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-white/[0.02] border-white/5 text-white/25 hover:text-white/50 hover:bg-white/[0.05]"
                      )}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
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
                    <p className="text-sm font-medium text-white/30 group-hover:text-white/50 transition-colors">Sube tu imagen aquí</p>
                    <p className="text-xs text-white/15 mt-1">PNG, JPG, WEBP · Máx 10MB</p>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black flex-1 min-h-[200px]">
                  <img src={imagePreview} alt="Imagen subida" className="w-full h-full object-contain max-h-72" />
                  <button
                    onClick={() => { setImagePreview(null); setResultImage(null); if (fileRef.current) fileRef.current.value = ""; }}
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
                <div className="relative flex-1">
                  <textarea
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder={currentTool.placeholder}
                    rows={7}
                    maxLength={1000}
                    className="flex-1 w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-aether-purple/30 focus:bg-white/[0.03] transition-all leading-relaxed"
                  />
                  <span className="absolute bottom-3 right-4 text-[10px] text-white/15 pointer-events-none">
                    {textPrompt.length}/1000
                  </span>
                </div>
                {/* Style pills */}
                {(activeTool === "generate" || activeTool === "logo") && (
                  <div className="flex flex-wrap gap-2">
                    {styleList.map((style) => (
                      <button
                        key={style}
                        onClick={() => setTextPrompt((prev) => prev ? `${prev}, estilo ${style}` : `Estilo ${style}: `)}
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
              disabled={isRunning || currentTool.disabled || (currentTool.needsUpload ? !imagePreview : !textPrompt.trim())}
              className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-sm shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 mt-auto flex items-center gap-2"
            >
              {isRunning ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {streaming ? "Escribiendo..." : "Generando..."}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generar · {requiredCredits} crédito{requiredCredits > 1 ? "s" : ""}</>
              )}
            </Button>
          </div>

          {/* Result Panel */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden p-6">
            <div className="flex items-center justify-between shrink-0">
              <p className="text-[11px] font-bold text-white/25 uppercase tracking-widest">Resultado</p>
              {(resultImage || resultText) && !isRunning && (
                <button
                  onClick={() => { setResultImage(null); setResultText(""); setSavedAsset(false); }}
                  className="text-[11px] font-medium text-white/20 hover:text-white/50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                <div className="flex flex-col gap-4 animate-in fade-in duration-500 overflow-y-auto">
                  <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black relative">
                    <ImageWithFallback src={resultImage} onRetry={handleProcess} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={resultImage} download={`creator-ia-${activeTool}-${Date.now()}.png`} target="_blank" rel="noreferrer" className="flex-1">
                      <button className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center gap-2">
                        <Download className="h-4 w-4" /> Descargar
                      </button>
                    </a>
                    <button
                      onClick={handleSaveToAssets}
                      disabled={savingAsset || savedAsset}
                      className={cn(
                        "h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all",
                        savedAsset
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.10]"
                      )}
                    >
                      {savingAsset ? <Loader2 className="h-4 w-4 animate-spin" /> : savedAsset ? <CheckCircle2 className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                      {savedAsset ? "Guardado" : "Activos"}
                    </button>
                    <button
                      onClick={() => handleCopyImage(resultImage)}
                      disabled={copyingImage}
                      className="h-11 w-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/30 hover:text-white hover:bg-white/[0.10] transition-all flex items-center justify-center"
                    >
                      {copyingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCopy className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(resultImage); toast.success("URL copiada"); }}
                      className="h-11 w-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/20 hover:text-white/60 transition-all flex items-center justify-center"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              ) : (resultText || streaming) ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300 flex-1 overflow-hidden">
                  <div
                    ref={resultRef}
                    className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 overflow-y-auto min-h-[280px] relative"
                  >
                    {streaming && !resultText && (
                      <div className="flex items-center gap-2 text-white/30 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-aether-purple" />
                        <span>Escribiendo...</span>
                      </div>
                    )}
                    <div
                      className="result-prose text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(resultText) }}
                    />
                    {streaming && resultText && (
                      <span className="inline-block w-2 h-4 bg-aether-purple/70 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                  {!streaming && resultText && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(resultText); toast.success("Texto copiado"); }}
                      className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shrink-0"
                    >
                      <Copy className="h-4 w-4" /> Copiar texto
                    </button>
                  )}
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
    </div>
  );
};

export default Tools;
