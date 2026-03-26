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
  Rocket, ChevronRight, Zap
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
  color: string;
}

const tools: Tool[] = [
  { id: "enhance", name: "Neural Enhancer", desc: "Optimize lighting, clarity and details with high-fidelity AI.", icon: Wand2, credits: 2, category: "image", needsUpload: true, color: "text-aether-purple" },
  { id: "upscale", name: "Quantum Upscale", desc: "Scale images up to 4K resolution without losing a single pixel.", icon: ZoomIn, credits: 3, category: "image", needsUpload: true, color: "text-aether-blue" },
  { id: "eraser", name: "Neural Eraser", desc: "Seamlessly remove any object or distraction from your assets.", icon: Eraser, credits: 2, category: "image", needsUpload: true, color: "text-rose-400" },
  { id: "background", name: "Alpha Matte", desc: "Instant background removal with perfect edges for any object.", icon: ImagePlus, credits: 1, category: "image", needsUpload: true, color: "text-emerald-400" },
  { id: "restore", name: "Photo Recovery", desc: "Breathe new life into old or damaged photographic records.", icon: RotateCcw, credits: 3, category: "image", needsUpload: true, color: "text-amber-400" },
  { id: "generate", name: "Vision Morph", desc: "Generate professional-grade visuals from natural language.", icon: Image, credits: 1, category: "image", needsUpload: false, placeholder: "Describe the vision you want to manifest...", color: "text-white" },
  { id: "copywriter", name: "Copy Orchestrator", desc: "Generate high-converting marketing narratives and social copy.", icon: MessageSquare, credits: 1, category: "ai-app", needsUpload: false, placeholder: "e.g. Write a persuasive ad copy for a luxury watch brand...", color: "text-aether-purple" },
  { id: "logo", name: "Identity Forge", desc: "Design minimalist, high-impact brand identities from scratch.", icon: PenTool, credits: 2, category: "ai-app", needsUpload: false, placeholder: "e.g. Minimalist logo for a quantum computing startup called 'Nova'...", color: "text-aether-blue" },
  { id: "social", name: "Social Pulse", desc: "Optimized visual content sequences for global social distribution.", icon: Hash, credits: 2, category: "ai-app", needsUpload: false, placeholder: "e.g. 5-post carousel strategy for a high-end streetwear launch...", color: "text-rose-400" },
  { id: "blog", name: "Semantic Writer", desc: "Full-length, SEO-optimized articles and industrial whitepapers.", icon: FileText, credits: 1, category: "ai-app", needsUpload: false, placeholder: "e.g. Deep dive into the future of decentralized AI in 2027...", color: "text-emerald-400" },
  { id: "ads", name: "Ad Synthesizer", desc: "Targeted ad copy generation for Meta, Google, and beyond.", icon: Megaphone, credits: 1, category: "ai-app", needsUpload: false, placeholder: "e.g. High-CTR Google Search ad for a SaaS project management tool...", color: "text-white" },
];

const appIdToToolId: Record<string, ToolId> = {
  copywriter: "copywriter",
  logo: "logo",
  social: "social",
  blog: "blog",
  ads: "ads",
};

const categories = [
  { id: "image", label: "Visual Processing", icon: Image },
  { id: "ai-app", label: "Creative Apps", icon: Sparkles },
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
    if (!file.type.startsWith("image/")) { toast.error("File type not supported"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
    setResultText(null);
  };

  const handleProcess = async () => {
    if (!user) return;
    if (currentTool.needsUpload && !imagePreview) { toast.error("Please upload an image first"); return; }
    if (!currentTool.needsUpload && !textPrompt.trim()) { toast.error("Mission requires a prompt"); return; }

    const modelObj = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
    const requiredCredits = category === "ai-app" ? modelObj.tokenCost : currentTool.credits;

    const credits = profile?.credits_balance ?? 0;
    if (credits < requiredCredits) {
      toast.error(`Neural deficiency: Need ${requiredCredits} credits. Found ${credits}.`);
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
        toast.success("Content Manifested");
      } else if (data?.url) {
        setResultImage(data.url);
        toast.success("Visual Manifested");
      } else {
        throw new Error("Invalid nexus response");
      }
      await refreshProfile();
    } catch (err: any) {
      console.error("Tool Error:", err);
      toast.error(err?.message || "Quantum error during processing", { duration: 5000 });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-aether-purple/30 selection:text-white font-sans">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="mx-auto max-w-7xl px-8 py-24">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-[10px] font-bold text-white/20 hover:text-white transition-all uppercase tracking-[0.2em] font-display"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Nexus
            </button>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-display">
              Neural <span className="bg-gradient-to-r from-aether-purple to-aether-blue bg-clip-text text-transparent">Arsenal</span>
            </h1>
            <p className="text-sm text-white/30 font-medium max-w-md">Equipping creators with production-grade AI modules for high-fidelity asset manifestation.</p>
          </div>
          
          <div className="flex bg-white/[0.03] p-1.5 rounded-2.5xl border border-white/5 backdrop-blur-xl">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id as any); setResultImage(null); setResultText(null); }}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl transition-all duration-500 font-display text-xs font-bold uppercase tracking-widest ${
                  category === cat.id 
                  ? "bg-white text-black shadow-2xl shadow-white/10" 
                  : "text-white/30 hover:text-white/60"
                }`}
              >
                <cat.icon className={`h-4 w-4 ${category === cat.id ? "text-black" : "text-white/20"}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Navigator */}
        <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTools.map((tool, idx) => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResultImage(null); setResultText(null); }}
              className={`group relative flex flex-col p-8 aether-card rounded-[2.5rem] border transition-all duration-500 text-left active:scale-95 ${
                activeTool === tool.id
                  ? "border-aether-purple/40 bg-aether-purple/5 shadow-3xl shadow-aether-purple/10"
                  : "border-white/5 hover:border-white/10"
              }`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-8 bg-white/5 border border-white/5 shadow-inner transition-all group-hover:scale-110 group-hover:rotate-3 ${tool.color}`}>
                <tool.icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight font-display">{tool.name}</h3>
                <p className="text-[11px] text-white/20 font-medium line-clamp-2 leading-relaxed">{tool.desc}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                   <Coins className="h-3 w-3" />
                   {tool.credits} credits
                </span>
                {activeTool === tool.id && (
                   <div className="h-2 w-2 rounded-full bg-aether-purple shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Execution Engine */}
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div className="space-y-8 aether-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h2 className="text-xl font-bold text-white font-display tracking-tight">{currentTool.name}</h2>
                   <p className="text-xs text-white/20 font-medium uppercase tracking-[0.1em]">{currentTool.id} protocol</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <Badge className="bg-white/5 text-white/40 border-none px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                     {category === "ai-app" ? "Dynamic Sync" : "Static Charge"}
                   </Badge>
                </div>
              </div>

              {(category === "ai-app" || activeTool === "generate") && (
                <div className="space-y-4 p-6 rounded-2.5xl bg-white/[0.02] border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-aether-purple" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] font-display">
                      Neural Model Selector
                    </span>
                  </div>
                  <ModelSelector selectedModelId={selectedModelId} onModelChange={setSelectedModelId} />
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <div className="relative z-10">
              {currentTool.needsUpload ? (
                !imagePreview ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-72 w-full flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.01] hover:border-aether-purple/30 hover:bg-aether-purple/5 transition-all group"
                  >
                    <div className="p-5 rounded-3xl bg-white/5 group-hover:scale-110 transition-all border border-white/5">
                      <Upload className="h-8 w-8 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                       <span className="text-sm font-bold text-white/40 group-hover:text-white transition-colors block">Manifest Primary Asset</span>
                       <span className="text-[10px] text-white/10 uppercase font-black tracking-widest mt-2 block">PNG, JPG, WEBP | MAX 10MB</span>
                    </div>
                  </button>
                ) : (
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#050506]">
                    <img src={imagePreview} alt="Original" className="h-72 w-full object-contain p-6" />
                    <button
                      onClick={() => { setImagePreview(null); setResultImage(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute right-6 top-6 rounded-2xl bg-black/60 p-3 backdrop-blur-xl border border-white/10 hover:bg-rose-500/20 hover:text-rose-500 transition-all text-white/40"
                    >
                      <Eraser className="h-5 h-5" />
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] ml-2 font-display">Input Narrative</Label>
                    <textarea
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      placeholder={currentTool.placeholder}
                      rows={6}
                      className="w-full resize-none rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-aether-purple/30 focus:shadow-3xl shadow-inner transition-all font-display leading-relaxed"
                    />
                  </div>
                  
                  {activeTool === "generate" && (
                    <div className="space-y-4">
                      <Label className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] ml-2 font-display">Neural Archetypes</Label>
                      <div className="flex flex-wrap gap-2 px-2">
                        {["Photorealistic", "Cinema 4D", "Surrealist", "Anime V3", "Hyper-Minimal", "Cybernetic"].map(style => (
                          <button 
                             key={style}
                             onClick={() => setTextPrompt(prev => prev ? `${prev}, style: ${style}` : `Style: ${style} - `)}
                             className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-white/30 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all uppercase tracking-widest"
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleProcess}
              disabled={processing || (currentTool.needsUpload ? !imagePreview : !textPrompt.trim())}
              className="w-full h-16 rounded-[2rem] bg-white text-black text-xs font-bold uppercase tracking-widest shadow-4xl hover:bg-white/90 active:scale-[0.98] transition-all relative z-10"
            >
              {processing ? (
                 <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Manifesting Neural Sequence...
                 </div>
              ) : (
                 <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 fill-current" />
                    Execute Protocol ({category === "ai-app" ? (AVAILABLE_MODELS.find(m => m.id === selectedModelId)?.tokenCost || 1) : currentTool.credits} credits)
                 </div>
              )}
            </Button>
            
            {/* Visual noise background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </div>

          <div className="space-y-8">
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.5em] font-display ml-4">Manifested Output</h2>
            
            <div className="aether-card rounded-[3rem] border border-white/5 min-h-[460px] flex flex-col relative overflow-hidden group">
              {processing ? (
                <div className="flex flex-1 flex-col items-center justify-center p-12 gap-6 text-center">
                  <div className="relative">
                    <div className="absolute inset-x-0 top-0 h-20 w-20 bg-aether-purple/20 blur-3xl animate-pulse" />
                    <Loader2 className="h-12 w-12 text-aether-purple animate-spin relative z-10" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-lg font-bold text-white tracking-tight font-display italic">Synthesizing multidimensional data...</p>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Latency compensation active</p>
                  </div>
                </div>
              ) : resultImage ? (
                <div className="flex-1 flex flex-col p-8 gap-8 animate-in fade-in zoom-in duration-700">
                  <div className="flex-1 rounded-2.5xl overflow-hidden border border-white/10 bg-[#050506]">
                    <img src={resultImage} alt="Manifestation" className="h-full w-full object-contain p-4" />
                  </div>
                  <div className="flex gap-4">
                     <a href={resultImage} download className="flex-1">
                        <Button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-display font-bold uppercase tracking-widest text-[10px] gap-3">
                           <Download className="h-4 w-4" /> Export Asset
                        </Button>
                     </a>
                     <Button 
                       variant="ghost" 
                       onClick={() => { navigator.clipboard.writeText(resultImage); toast.success("URL copied to clipboard"); }}
                       className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white"
                     >
                        <Copy className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
              ) : resultText ? (
                <div className="flex-1 flex flex-col p-8 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex-1 rounded-2.5xl border border-white/10 bg-white/[0.01] p-10 overflow-y-auto custom-scrollbar shadow-inner">
                    <div className="whitespace-pre-wrap text-[15px] text-white/80 font-sans leading-relaxed tracking-tight">{resultText}</div>
                  </div>
                  <Button
                    onClick={() => { navigator.clipboard.writeText(resultText); toast.success("Copied to clipboard"); }}
                    className="h-16 rounded-2xl bg-white text-black font-display font-bold uppercase tracking-widest text-[10px] gap-3 shadow-3xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Copy className="h-4 w-4" /> Synchronize Context
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 gap-8 text-center opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-aether-purple/20 to-aether-blue/20 blur-2xl" />
                    <Rocket className="h-10 w-10 text-white/20 relative z-10" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-bold text-white tracking-tight font-display">Awaiting Evolution Command</p>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold max-w-[200px] leading-relaxed mx-auto">execute a protocol to manifest industrial assets</p>
                  </div>
                </div>
              )}
              
              {/* Card visual accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-aether-purple/5 blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-aether-blue/5 blur-[100px] pointer-events-none" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tools;
