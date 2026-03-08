import { useState, useRef } from "react";
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
  Wand2,
  ZoomIn,
  Eraser,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Upload,
  Loader2,
  Download,
  Coins,
} from "lucide-react";

type ToolId = "enhance" | "upscale" | "eraser" | "background" | "restore";

interface Tool {
  id: ToolId;
  name: string;
  desc: string;
  icon: typeof Wand2;
  credits: number;
  prompt: string;
  accent: string;
}

const tools: Tool[] = [
  {
    id: "enhance",
    name: "Mejorar Imagen",
    desc: "Mejora la calidad, iluminación y nitidez de cualquier foto con IA.",
    icon: Wand2,
    credits: 2,
    prompt: "Enhance this image: improve quality, lighting, sharpness and colors while keeping the original composition",
    accent: "text-primary bg-primary/10",
  },
  {
    id: "upscale",
    name: "Ampliar con IA",
    desc: "Escala imágenes hasta 4x sin perder detalles ni nitidez.",
    icon: ZoomIn,
    credits: 3,
    prompt: "Upscale this image to higher resolution, enhance details and sharpness while maintaining the original style",
    accent: "text-accent bg-accent/10",
  },
  {
    id: "eraser",
    name: "Borrar Objetos",
    desc: "Elimina objetos, personas o marcas de agua de cualquier imagen.",
    icon: Eraser,
    credits: 2,
    prompt: "Remove unwanted objects from this image, fill in the background naturally",
    accent: "text-warning bg-warning/10",
  },
  {
    id: "background",
    name: "Quitar Fondo",
    desc: "Elimina el fondo de cualquier imagen automáticamente con IA.",
    icon: ImagePlus,
    credits: 1,
    prompt: "Remove the background from this image, make it transparent or white, keep the main subject perfectly cut out",
    accent: "text-gold bg-gold/10",
  },
  {
    id: "restore",
    name: "Restaurar Foto",
    desc: "Restaura fotos antiguas o dañadas devolviendo vida y color.",
    icon: RotateCcw,
    credits: 3,
    prompt: "Restore this old or damaged photo: fix scratches, improve colors, sharpen details, and make it look new",
    accent: "text-destructive bg-destructive/10",
  },
];

const Tools = () => {
  const { user, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const [activeTool, setActiveTool] = useState<ToolId>("enhance");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const currentTool = tools.find((t) => t.id === activeTool)!;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
  };

  const handleProcess = async () => {
    if (!imagePreview || !user) return;

    const credits = profile?.credits_balance ?? 0;
    if (credits < currentTool.credits) {
      toast.error(`Necesitas ${currentTool.credits} créditos. Tienes ${credits}.`);
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tool", {
        body: {
          tool: activeTool,
          image: imagePreview,
          prompt: customPrompt || currentTool.prompt,
        },
      });

      if (error) throw error;
      if (data?.result_url) {
        setResultImage(data.result_url);
        toast.success("¡Procesado con éxito!");
        await refreshProfile();
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar imagen");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Herramientas <span className="gradient-text">IA</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Mejora, escala, restaura y edita imágenes con inteligencia artificial.
          </p>
        </div>

        {/* Tool selector */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setResultImage(null);
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                activeTool === tool.id
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.accent}`}>
                <tool.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground text-center">{tool.name}</span>
              <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                <Coins className="mr-1 h-2.5 w-2.5" />
                {tool.credits}
              </Badge>
            </button>
          ))}
        </div>

        {/* Workspace */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{currentTool.name}</h2>
              <Badge variant="outline" className="border-border text-muted-foreground">
                {currentTool.credits} créditos
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{currentTool.desc}</p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!imagePreview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-all"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arrastra o haz clic para subir
                </span>
                <span className="text-xs text-muted-foreground/50">
                  JPG, PNG, WEBP hasta 10MB
                </span>
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
                <img
                  src={imagePreview}
                  alt="Imagen original"
                  className="h-64 w-full object-contain bg-muted/20"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setResultImage(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute right-3 top-3 rounded-lg border border-border bg-card/80 p-1.5 backdrop-blur-sm hover:bg-card"
                >
                  <Eraser className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {(activeTool === "eraser") && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">
                  Describe qué quieres borrar (opcional)
                </Label>
                <Input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ej: Borrar la persona del fondo"
                  className="bg-card border-border"
                />
              </div>
            )}

            <Button
              onClick={handleProcess}
              disabled={!imagePreview || processing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {processing ? "Procesando..." : `Aplicar ${currentTool.name}`}
            </Button>
          </div>

          {/* Result area */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Resultado</h2>
            {resultImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <img
                    src={resultImage}
                    alt="Resultado"
                    className="h-64 w-full object-contain bg-muted/20"
                  />
                </div>
                <a
                  href={resultImage}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full border-border gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Resultado
                  </Button>
                </a>
              </div>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card/30">
                <p className="text-sm text-muted-foreground">
                  {processing
                    ? "Procesando tu imagen con IA..."
                    : "Sube una imagen y aplica una herramienta"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tools;
