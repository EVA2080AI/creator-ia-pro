import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/ai-service";
import {
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Sparkles,
  Upload, Loader2, Download, Coins, Type, MessageSquare,
  PenTool, Hash, Image, ArrowLeft, FileText, Megaphone, Copy,
} from "lucide-react";
import { ModelSelector, AVAILABLE_MODELS } from "@/components/ModelSelector";

type ToolId = "enhance" | "upscale" | "eraser" | "background" | "restore" | "generate" | "copywriter" | "logo" | "social" | "blog" | "ads";

interface Tool {
  id: ToolId;
  name: string;
  desc: string;
  icon: typeof Wand2;
  credits: number;
  category: "image" | "ai-app";
  needsUpload: boolean;
  placeholder?: string;
}

const tools: Tool[] = [
  { id: "enhance", name: "Mejorar Imagen", desc: "Mejora calidad, iluminación y nitidez con IA.", icon: Wand2, credits: 2, category: "image", needsUpload: true },
  { id: "upscale", name: "Ampliar 4x", desc: "Escala imágenes hasta 4x sin perder detalles.", icon: ZoomIn, credits: 3, category: "image", needsUpload: true },
  { id: "eraser", name: "Borrar Objetos", desc: "Elimina objetos no deseados de cualquier imagen.", icon: Eraser, credits: 2, category: "image", needsUpload: true },
  { id: "background", name: "Quitar Fondo", desc: "Elimina fondos automáticamente con IA.", icon: ImagePlus, credits: 1, category: "image", needsUpload: true },
  { id: "restore", name: "Restaurar Foto", desc: "Restaura fotos antiguas o dañadas.", icon: RotateCcw, credits: 3, category: "image", needsUpload: true },
  { id: "generate", name: "Texto a Imagen", desc: "Genera imágenes profesionales desde una descripción.", icon: Image, credits: 1, category: "image", needsUpload: false, placeholder: "Describe la imagen que quieres crear..." },
  { id: "copywriter", name: "AI Copywriter", desc: "Genera textos de marketing, ads y contenido social.", icon: MessageSquare, credits: 1, category: "ai-app", needsUpload: false, placeholder: "Ej: Escribe un copy para un anuncio de zapatillas deportivas..." },
  { id: "logo", name: "Logo Maker", desc: "Diseña logos profesionales con IA generativa.", icon: PenTool, credits: 2, category: "ai-app", needsUpload: false, placeholder: "Ej: Logo minimalista para una cafetería llamada 'Aroma'..." },
  { id: "social", name: "Social Media Kit", desc: "Genera contenido visual optimizado para redes.", icon: Hash, credits: 2, category: "ai-app", needsUpload: false, placeholder: "Ej: Post de Instagram para lanzamiento de producto de skincare..." },
  { id: "blog", name: "AI Blog Writer", desc: "Artículos SEO completos generados con IA.", icon: FileText, credits: 1, category: "ai-app", needsUpload: false, placeholder: "Ej: Artículo sobre tendencias de marketing digital 2026..." },
  { id: "ads", name: "Ad Generator", desc: "Crea textos de anuncios para Google y Meta Ads.", icon: Megaphone, credits: 1, category: "ai-app", needsUpload: false, placeholder: "Ej: Anuncio de Google Ads para una tienda de ropa online..." },
];

const appIdToToolId: Record<string, ToolId> = {
  copywriter: "copywriter",
  logo: "logo",
  social: "social",
  blog: "blog",
  ads: "ads",
};

const categories = [
  { id: "image", label: "Herramientas de Imagen", icon: Image },
  { id: "ai-app", label: "Apps de IA", icon: Sparkles },
];

const Tools = () => {
  const { user, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const navigate = useNavigate();
  const { appId } = useParams();
  const [activeTool, setActiveTool] = useState<ToolId>("enhance");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
  const [category, setCategory] = useState<"image" | "ai-app">("image");
  const [selectedModelId, setSelectedModelId] = useState("deepseek-chat");
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle /apps/:appId route
  useEffect(() => {
    if (appId && appIdToToolId[appId]) {
      const toolId = appIdToToolId[appId];
      setActiveTool(toolId);
      setCategory("ai-app");
    }
  }, [appId]);

  const currentTool = tools.find((t) => t.id === activeTool)!;
  const filteredTools = tools.filter((t) => t.category === category);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
    setResultText(null);
  };

  const handleProcess = async () => {
    if (!user) return;
    if (currentTool.needsUpload && !imagePreview) { toast.error("Sube una imagen primero"); return; }
    if (!currentTool.needsUpload && !textPrompt.trim()) { toast.error("Escribe un prompt"); return; }

    const modelObj = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
    const requiredCredits = category === "ai-app" ? modelObj.tokenCost : currentTool.credits;

    const credits = profile?.credits_balance ?? 0;
    if (credits < requiredCredits) {
      toast.error(`Necesitas ${requiredCredits} créditos. Tienes ${credits}.`);
      return;
    }

    setProcessing(true);
    setResultImage(null);
    setResultText(null);

    try {
      const data = await aiService.processAction({ 
        action: category === "ai-app" ? "chat" : "image",
        tool: activeTool,
        prompt: textPrompt,
        model: selectedModelId,
        image: imagePreview || undefined,
      });

      if (data?.text) {
        setResultText(data.text);
        toast.success("¡Texto generado!");
      } else if (data?.url) {
        setResultImage(data.url);
        toast.success("Imagen generada con éxito");
      } else {
        console.error("Payload inesperado:", data);
        throw new Error("Respuesta inválida del servidor");
      }
      await refreshProfile();
    } catch (err: any) {
      console.error("Tool Error:", err);
      toast.error(`${err.message} (Tools V3.4)` || "Error al procesar (V3.4)", { duration: 5000 });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Herramientas <span className="gradient-text">IA</span>
            </h1>
            <p className="text-sm text-muted-foreground">{tools.length} herramientas profesionales de IA</p>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              onClick={() => { setCategory(cat.id as any); setResultImage(null); setResultText(null); }}
              className={`rounded-2xl px-6 h-11 transition-all duration-300 gap-2 shrink-0 ${
                category === cat.id 
                ? "bg-primary shadow-lg shadow-primary/20 glow-primary border-none" 
                : "border-white/5 glass hover:bg-white/10"
              }`}
            >
              <cat.icon className={`h-4 w-4 ${category === cat.id ? "text-primary-foreground" : "text-primary"}`} />
              <span className="font-medium">{cat.label}</span>
            </Button>
          ))}
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool, idx) => (
                <button
                  key={tool.id}
                  onClick={() => { setActiveTool(tool.id); setResultImage(null); setResultText(null); }}
                  className={`group relative flex items-start gap-4 rounded-[2rem] border p-5 text-left transition-all duration-300 animate-fade-in ${
                    activeTool === tool.id
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                      : "border-white/5 glass hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl"
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    activeTool === tool.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors"
                  }`}>
                    {<tool.icon className="h-6 w-6" />}
                  </div>
                  <div className="pr-4">
                    <h3 className="font-bold text-foreground font-display tracking-tight">{tool.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-80">{tool.desc}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                         <Coins className="h-2.5 w-2.5" />
                         {tool.credits} Créditos
                      </span>
                    </div>
                  </div>
                  {activeTool === tool.id && (
                     <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              ))}
            </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{currentTool.name}</h2>
                <Badge variant="outline" className="border-border text-muted-foreground">{category === "ai-app" ? "Precio Dinámico" : `${currentTool.credits} créditos`}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{currentTool.desc}</p>

              {(category === "ai-app" || activeTool === "generate") && (
                <div className="space-y-2 mt-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {activeTool === "generate" ? "🍌 Modelo de Imagen" : "🤖 Cerebro de la IA"}
                  </span>
                  <ModelSelector selectedModelId={selectedModelId} onModelChange={setSelectedModelId} />
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {currentTool.needsUpload ? (
              !imagePreview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-all"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Arrastra o haz clic para subir</span>
                  <span className="text-xs text-muted-foreground/50">JPG, PNG, WEBP hasta 10MB</span>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
                  <img src={imagePreview} alt="Original" className="h-56 w-full object-contain bg-muted/20" />
                  <button
                    onClick={() => { setImagePreview(null); setResultImage(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute right-3 top-3 rounded-lg border border-border bg-card/80 p-1.5 backdrop-blur-sm hover:bg-card"
                  >
                    <Eraser className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Tu prompt</Label>
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder={currentTool.placeholder}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {currentTool.needsUpload && currentTool.id === "eraser" && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">¿Qué quieres borrar? (opcional)</Label>
                <Input value={textPrompt} onChange={(e) => setTextPrompt(e.target.value)} placeholder="Ej: La persona del fondo" className="bg-card border-border" />
              </div>
            )}

            <Button
              onClick={handleProcess}
              disabled={processing || (currentTool.needsUpload ? !imagePreview : !textPrompt.trim())}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 rounded-xl text-md"
            >
              {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {processing ? "Procesando con IA..." : `Generar (${category === "ai-app" ? (AVAILABLE_MODELS.find(m => m.id === selectedModelId)?.tokenCost || 1) : currentTool.credits} Créditos)`}
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Resultado</h2>
            {resultImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <img src={resultImage} alt="Resultado" className="h-56 w-full object-contain bg-muted/20" />
                </div>
                <a href={resultImage} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-border gap-2">
                    <Download className="h-4 w-4" />Descargar
                  </Button>
                </a>
              </div>
            ) : resultText ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5 max-h-80 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{resultText}</pre>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border gap-2"
                  onClick={() => { navigator.clipboard.writeText(resultText); toast.success("Copiado al portapapeles"); }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Texto
                </Button>
              </div>
            ) : (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <Sparkles className="relative h-10 w-10 text-primary/40 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground opacity-60">
                    {processing ? "Procesando con IA..." : "Esperando prompt..."}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest opacity-40">Listo para crear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tools;
