import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Wand2, ImagePlus, RotateCcw, Sparkles, 
  Upload, Loader2, Download, Coins,
  PenTool, Hash, Image as ImageIcon, FileText, Megaphone, Copy, X, Zap,
  CheckCircle2, Palette, ShoppingBag, ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { aiService } from "@/services/ai-service";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

// --- Types & Constants ---
type ToolId =
  | "enhance" | "upscale" | "eraser" | "background" | "restore" | "generate"
  | "logo" | "style" | "product"
  | "copywriter" | "social" | "blog" | "ads";

interface Tool {
  id: ToolId;
  name: string;
  desc: string;
  icon: any;
  credits: number;
  category: "image" | "text";
  needsUpload: boolean;
  placeholder?: string;
  color: string;
}

const TOOLS: Tool[] = [
  { id: "generate",   name: "Crear imagen",        desc: "Genera imágenes desde texto.", icon: ImageIcon,    credits: 2, category: "image", needsUpload: false, placeholder: "Un gato astronauta...", color: "text-white" },
  { id: "logo",       name: "Diseñar logo",         desc: "Logos profesionales con IA.", icon: PenTool,      credits: 3, category: "image", needsUpload: false, placeholder: "Logo minimalista...", color: "text-blue-400" },
  { id: "copywriter", name: "Crear texto",          desc: "Copy persuasivo para ventas.", icon: Megaphone,    credits: 1, category: "text",  needsUpload: false, placeholder: "Escribe un mensaje...", color: "text-purple-400" },
  { id: "enhance",    name: "Mejorar imagen",       desc: "Mejora iluminación y detalles.", icon: Wand2,        credits: 2, category: "image", needsUpload: true,  color: "text-green-400" },
  { id: "background", name: "Quitar fondo",         desc: "Extrae el fondo con IA.", icon: ImagePlus,    credits: 1, category: "image", needsUpload: true,  color: "text-emerald-400" },
];

const ASPECT_RATIOS = [
  { label: "1:1",  value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

export function StudioAITools() {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile(user?.id);
  
  const [activeTool, setActiveTool] = useState<ToolId>("generate");
  const [textPrompt, setTextPrompt] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTool = TOOLS.find(t => t.id === activeTool) || TOOLS[0];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
  };

  const handleProcess = async () => {
    if (!user) return;
    if (currentTool.needsUpload && !imagePreview) { toast.error("Sube una imagen"); return; }
    if (!currentTool.needsUpload && !textPrompt.trim()) { toast.error("Escribe un prompt"); return; }

    const cost = currentTool.category === "image" ? currentTool.credits : 1;
    if ((profile?.credits_balance || 0) < cost) {
      toast.error("Créditos insuficientes");
      return;
    }

    setIsProcessing(true);
    setResultImage(null);
    setResultText("");

    try {
      if (currentTool.category === "text") {
        await aiService.streamTextGen(activeTool, textPrompt, "deepseek-chat", profile, (chunk) => {
          setResultText(prev => prev + chunk);
        });
      } else {
        const data = await aiService.processAction({
          action: "image",
          tool: activeTool,
          prompt: textPrompt,
          model: "flux-schnell",
          image: imagePreview || undefined
        });
        if (data?.url) setResultImage(data.url);
      }
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Estudio de Generación
            </h2>
            <p className="text-sm text-white/40 mt-1">Genera activos para tu proyecto en segundos</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs font-bold text-white/60">
            <Coins className="h-3.5 w-3.5 text-primary" />
            {profile?.credits_balance || 0} créditos
          </div>
        </div>

        {/* Tools Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setResultImage(null);
                setResultText("");
              }}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 group",
                activeTool === tool.id 
                  ? "bg-primary/10 border-primary/30 text-white shadow-[0_0_20px_rgba(74,222,128,0.1)]"
                  : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                activeTool === tool.id ? "bg-primary text-black" : "bg-white/[0.05] text-white/30"
              )}>
                <tool.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold block">{tool.name}</span>
                <span className="text-[10px] text-white/20 mt-0.5">{tool.credits} cr</span>
              </div>
            </button>
          ))}
        </div>

        {/* Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          
          {/* Input Panel */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-white/30">Configuración</label>
              
              {currentTool.needsUpload && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/10 hover:border-primary/30 bg-white/[0.01] hover:bg-primary/[0.02] transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group"
                >
                  <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*" />
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-white/30" />
                      </div>
                      <p className="text-sm text-white/40">Sube una imagen base</p>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder={currentTool.placeholder}
                  className="w-full h-32 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/30 transition-all resize-none"
                />
                
                {currentTool.category === "image" && !currentTool.needsUpload && (
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map(ar => (
                      <button
                        key={ar.value}
                        onClick={() => setAspectRatio(ar)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                          aspectRatio.value === ar.value ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/10 text-white/40"
                        )}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full h-12 bg-white hover:bg-white/90 text-black font-bold rounded-2xl gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generar ahora
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="relative min-h-[400px] rounded-3xl border border-white/[0.08] bg-black/40 overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Resultado</span>
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(74,222,128,0.05)_0%,transparent_70%)]">
              {isProcessing ? (
                <div className="text-center space-y-4 animate-pulse">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-white/40">Imaginando contenido...</p>
                </div>
              ) : resultImage ? (
                <div className="space-y-4 w-full">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/[0.02]">
                    <img src={resultImage} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-white/10 h-11 rounded-xl" onClick={() => window.open(resultImage)}>
                      <Download className="h-4 w-4 mr-2" /> Descargar
                    </Button>
                    <Button variant="outline" className="border-white/10 h-11 w-11 p-0 rounded-xl" onClick={() => {
                       navigator.clipboard.writeText(resultImage);
                       toast.success("URL copiada");
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : resultText ? (
                <div className="w-full h-full overflow-y-auto space-y-4">
                  <div className="p-6 bg-white/[0.01] rounded-2xl border border-white/5 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {resultText}
                  </div>
                  <Button variant="outline" className="w-full border-white/10 h-11 rounded-xl" onClick={() => {
                    navigator.clipboard.writeText(resultText);
                    toast.success("Texto copiado");
                  }}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar Texto
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto border border-white/5">
                    <ImageIcon className="h-8 w-8 text-white/10" />
                  </div>
                  <p className="text-xs text-white/20 uppercase tracking-widest">Esperando generación</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
