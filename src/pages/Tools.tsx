import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Sparkles,
  Upload, Loader2, Download, Coins, Type, MessageSquare,
  PenTool, Hash, Image, Palette, ArrowLeft,
} from "lucide-react";

type ToolId = "enhance" | "upscale" | "eraser" | "background" | "restore" | "generate" | "copywriter" | "logo" | "social";

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
  // Image tools
  { id: "enhance", name: "Mejorar Imagen", desc: "Mejora calidad, iluminación y nitidez con IA.", icon: Wand2, credits: 2, category: "image", needsUpload: true },
  { id: "upscale", name: "Ampliar 4x", desc: "Escala imágenes hasta 4x sin perder detalles.", icon: ZoomIn, credits: 3, category: "image", needsUpload: true },
  { id: "eraser", name: "Borrar Objetos", desc: "Elimina objetos no deseados de cualquier imagen.", icon: Eraser, credits: 2, category: "image", needsUpload: true },
  { id: "background", name: "Quitar Fondo", desc: "Elimina fondos automáticamente con IA.", icon: ImagePlus, credits: 1, category: "image", needsUpload: true },
  { id: "restore", name: "Restaurar Foto", desc: "Restaura fotos antiguas o dañadas.", icon: RotateCcw, credits: 3, category: "image", needsUpload: true },
  { id: "generate", name: "Texto a Imagen", desc: "Genera imágenes profesionales desde una descripción.", icon: Image, credits: 1, category: "image", needsUpload: false, placeholder: "Describe la imagen que quieres crear..." },
  // AI Apps
  { id: "copywriter", name: "AI Copywriter", desc: "Genera textos de marketing, ads y contenido social.", icon: MessageSquare, credits: 1, category: "ai-app", needsUpload: false, placeholder: "Ej: Escribe un copy para un anuncio de zapatillas deportivas..." },
  { id: "logo", name: "Logo Maker", desc: "Diseña logos profesionales con IA generativa.", icon: PenTool, credits: 2, category: "ai-app", needsUpload: false, placeholder: "Ej: Logo minimalista para una cafetería llamada 'Aroma'..." },
  { id: "social", name: "Social Media Kit", desc: "Genera contenido visual optimizado para redes.", icon: Hash, credits: 2, category: "ai-app", needsUpload: false, placeholder: "Ej: Post de Instagram para lanzamiento de producto de skincare..." },
];

const Tools = () => {
  const { user, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolId>("enhance");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
  const [category, setCategory] = useState<"image" | "ai-app">("image");
  const fileRef = useRef<HTMLInputElement>(null);

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

    const credits = profile?.credits_balance ?? 0;
    if (credits < currentTool.credits) {
      toast.error(`Necesitas ${currentTool.credits} créditos. Tienes ${credits}.`);
      return;
    }

    setProcessing(true);
    setResultImage(null);
    setResultText(null);

    try {
      if (currentTool.category === "ai-app" && currentTool.id === "copywriter") {
        // Text generation via AI chat
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: { type: "copywriter", prompt: textPrompt },
        });
        if (error) throw error;
        if (data?.text) {
          setResultText(data.text);
          toast.success("¡Texto generado!");
          await refreshProfile();
        } else if (data?.error) throw new Error(data.error);
      } else {
        // Image tools
        const { data, error } = await supabase.functions.invoke("ai-tool", {
          body: {
            tool: activeTool,
            image: imagePreview || undefined,
            prompt: textPrompt || undefined,
          },
        });
        if (error) throw error;
        if (data?.result_url) {
          setResultImage(data.result_url);
          toast.success("¡Procesado con éxito!");
          await refreshProfile();
        } else if (data?.error) throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Back + Title */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Herramientas <span className="gradient-text">IA</span>
            </h1>
            <p className="text-sm text-muted-foreground">12+ herramientas profesionales de IA</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
          <button
            onClick={() => { setCategory("image"); setActiveTool("enhance"); setResultImage(null); setResultText(null); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              category === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Image className="h-4 w-4" />
            Herramientas de Imagen
          </button>
          <button
            onClick={() => { setCategory("ai-app"); setActiveTool("copywriter"); setResultImage(null); setResultText(null); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              category === "ai-app" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Apps de IA
          </button>
        </div>

        {/* Tool selector */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResultImage(null); setResultText(null); }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                activeTool === tool.id
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <tool.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground text-center">{tool.name}</span>
              <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                <Coins className="mr-1 h-2.5 w-2.5" />{tool.credits}
              </Badge>
            </button>
          ))}
        </div>

        {/* Workspace */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{currentTool.name}</h2>
              <Badge variant="outline" className="border-border text-muted-foreground">{currentTool.credits} créditos</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{currentTool.desc}</p>

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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {processing ? "Procesando..." : `Aplicar ${currentTool.name}`}
            </Button>
          </div>

          {/* Result area */}
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
                  Copiar Texto
                </Button>
              </div>
            ) : (
              <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card/30">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {processing ? "Procesando con IA..." : "El resultado aparecerá aquí"}
                  </p>
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
