import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, ArrowRight, Check, Wand2, ZoomIn, Eraser,
  ImagePlus, RotateCcw, Image, MessageSquare, PenTool,
  Hash, FileText, Megaphone, Palette, Zap,
  Play, Upload, Loader2, Lock, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { aiService } from "@/services/ai-service";
import { Logo } from "@/components/Logo";

// Demo images
import demoEnhance from "@/assets/demo-enhance.jpg";
import demoUpscale from "@/assets/demo-upscale.jpg";
import demoGenerate from "@/assets/demo-generate.jpg";
import demoBackground from "@/assets/demo-background.jpg";
import demoLogo from "@/assets/demo-logo.jpg";
import demoRestore from "@/assets/demo-restore.jpg";
import demoSocial from "@/assets/demo-social.jpg";

interface ToolInfo {
  id: string;
  name: string;
  headline: string;
  description: string;
  icon: typeof Wand2;
  features: string[];
  useCases: string[];
  credits: number;
  category: "image" | "marketing" | "studio";
  demoImage: string;
  demoLabel: string;
  tryItType: "image-upload" | "text-prompt";
  tryItPlaceholder: string;
  tryItExamples: string[];
}

const toolsData: Record<string, ToolInfo> = {
  "mejorar-imagen": {
    id: "enhance", name: "Mejorar Imagen",
    headline: "Mejora tus fotos con IA en segundos",
    description: "Aumenta la calidad, nitidez e iluminación de cualquier imagen automáticamente.",
    icon: Wand2,
    features: ["Mejora automática de iluminación y color", "Reducción de ruido inteligente", "Aumento de nitidez sin artefactos", "Procesamiento batch disponible", "Formatos JPG, PNG, WEBP"],
    useCases: ["Fotos de productos para e-commerce", "Fotos de redes sociales", "Imágenes para presentaciones", "Restauración de capturas de pantalla"],
    credits: 2, category: "image",
    demoImage: demoEnhance, demoLabel: "Antes y después — Mejora de foto con IA",
    tryItType: "image-upload", tryItPlaceholder: "Sube una imagen para mejorarla",
    tryItExamples: [],
  },
  "ampliar-4x": {
    id: "upscale", name: "Ampliar 4x",
    headline: "Escala imágenes hasta 4x sin perder calidad",
    description: "Amplía cualquier imagen hasta 4 veces su tamaño original manteniendo la nitidez.",
    icon: ZoomIn,
    features: ["Ampliación hasta 4x resolución", "Preservación de detalles con IA", "Ideal para impresión", "Sin pérdida de calidad", "GPU acelerado"],
    useCases: ["Preparar fotos para impresión", "Ampliar logos y gráficos", "Fotos antiguas de baja resolución", "Wallpapers HD"],
    credits: 3, category: "image",
    demoImage: demoUpscale, demoLabel: "Comparación — Imagen pixelada vs 4x con IA",
    tryItType: "image-upload", tryItPlaceholder: "Sube una imagen para ampliarla 4x",
    tryItExamples: [],
  },
  "borrar-objetos": {
    id: "eraser", name: "Borrar Objetos",
    headline: "Elimina lo que sobra con un solo clic",
    description: "Selecciona cualquier objeto no deseado y nuestra IA lo eliminará de forma inteligente.",
    icon: Eraser,
    features: ["Borrado inteligente con relleno", "Detección de objetos con IA", "Resultados naturales", "Múltiples objetos", "Sin marca de agua"],
    useCases: ["Eliminar personas del fondo", "Quitar textos y logos", "Limpiar fotos de productos", "Eliminar elementos distractores"],
    credits: 2, category: "image",
    demoImage: demoEnhance, demoLabel: "Demo — Borrado inteligente de objetos",
    tryItType: "image-upload", tryItPlaceholder: "Sube una imagen y describe qué borrar",
    tryItExamples: [],
  },
  "quitar-fondo": {
    id: "background", name: "Quitar Fondo",
    headline: "Fondos eliminados automáticamente con IA",
    description: "Elimina el fondo de cualquier imagen en segundos. Perfecto para productos y retratos.",
    icon: ImagePlus,
    features: ["Recorte perfecto de bordes", "Fondo transparente PNG", "Detección de cabello fino", "Menos de 5 segundos", "E-commerce ready"],
    useCases: ["Fotos de producto sin fondo", "Retratos profesionales", "Stickers personalizados", "Composiciones de diseño"],
    credits: 1, category: "image",
    demoImage: demoBackground, demoLabel: "Antes y después — Fondo eliminado con IA",
    tryItType: "image-upload", tryItPlaceholder: "Sube una imagen para quitar el fondo",
    tryItExamples: [],
  },
  "restaurar-foto": {
    id: "restore", name: "Restaurar Foto",
    headline: "Revive tus fotos antiguas con IA",
    description: "Restaura fotos antiguas, dañadas o borrosas. Corrige arañazos, manchas y decoloración.",
    icon: RotateCcw,
    features: ["Reparación de arañazos", "Corrección de color", "Aumento de nitidez", "Restauración facial", "Colorización B&N"],
    useCases: ["Fotos familiares antiguas", "Documentos históricos", "Fotos escaneadas", "Imágenes con daño"],
    credits: 3, category: "image",
    demoImage: demoRestore, demoLabel: "Antes y después — Foto de 1950 restaurada y colorizada",
    tryItType: "image-upload", tryItPlaceholder: "Sube una foto antigua para restaurarla",
    tryItExamples: [],
  },
  "texto-a-imagen": {
    id: "generate", name: "Texto a Imagen",
    headline: "Crea imágenes únicas desde texto",
    description: "Describe lo que imaginas y nuestra IA lo convierte en una imagen profesional.",
    icon: Image,
    features: ["Múltiples estilos artísticos", "Resolución hasta 4K", "Menos de 30 segundos", "Prompts en español", "Sin derechos de autor"],
    useCases: ["Contenido para redes", "Ilustraciones para blogs", "Conceptos de diseño", "Arte digital"],
    credits: 1, category: "image",
    demoImage: demoGenerate, demoLabel: "Ejemplo — 'Atardecer sobre montañas, fotorrealista'",
    tryItType: "text-prompt", tryItPlaceholder: "Describe la imagen que quieres crear...",
    tryItExamples: ["Un gato astronauta en el espacio, estilo cartoon", "Paisaje futurista con rascacielos de cristal", "Logo minimalista de un café con una taza humeante"],
  },
  "ai-copywriter": {
    id: "copywriter", name: "AI Copywriter",
    headline: "Textos de marketing que convierten",
    description: "Genera textos persuasivos para anuncios, landing pages, emails y redes sociales.",
    icon: MessageSquare,
    features: ["Google Ads y Meta Ads", "Copy para landing pages", "Emails automatizados", "Múltiples tonos", "Optimizado para conversión"],
    useCases: ["Campañas publicitarias", "Emails de ventas", "Descripciones de productos", "Posts sociales"],
    credits: 1, category: "marketing",
    demoImage: demoSocial, demoLabel: "Ejemplo — Copy generado para campaña de marketing",
    tryItType: "text-prompt", tryItPlaceholder: "Describe tu producto o servicio para generar copy...",
    tryItExamples: ["Copy para un anuncio de zapatillas deportivas premium", "Email de bienvenida para una app de meditación", "Descripción de producto para crema hidratante natural"],
  },
  "logo-maker": {
    id: "logo", name: "Logo Maker",
    headline: "Logos profesionales creados con IA",
    description: "Diseña logos únicos y profesionales en minutos. Describe tu marca y estilo.",
    icon: PenTool,
    features: ["Múltiples variaciones", "Estilos variados", "Alta calidad", "Adaptable", "Branding consistente"],
    useCases: ["Nuevos emprendimientos", "Rebranding", "Proyectos personales", "Identidad visual"],
    credits: 2, category: "marketing",
    demoImage: demoLogo, demoLabel: "Ejemplo — Logo 'Aroma Coffee Shop' generado con IA",
    tryItType: "text-prompt", tryItPlaceholder: "Describe tu marca y el estilo de logo que quieres...",
    tryItExamples: ["Logo minimalista para una startup tech llamada 'Nexo'", "Logo vintage para una barbería 'El Bigote'", "Logo moderno para una tienda de ropa 'URBAN'"],
  },
  "social-media-kit": {
    id: "social", name: "Social Media Kit",
    headline: "Contenido social optimizado con IA",
    description: "Genera kits completos de contenido para redes sociales optimizados para cada plataforma.",
    icon: Hash,
    features: ["Instagram, TikTok, LinkedIn", "Hashtags automáticos", "Calendarios de contenido", "Textos para stories", "Tendencias actuales"],
    useCases: ["Community managers", "Marcas digitales", "Influencers", "Agencias de marketing"],
    credits: 2, category: "marketing",
    demoImage: demoSocial, demoLabel: "Ejemplo — Kit de contenido para lanzamiento de producto",
    tryItType: "text-prompt", tryItPlaceholder: "Describe tu marca o producto para generar contenido social...",
    tryItExamples: ["Kit de Instagram para lanzamiento de skincare orgánico", "Contenido de TikTok para restaurante mexicano", "Post de LinkedIn para empresa de software B2B"],
  },
  "ai-blog-writer": {
    id: "blog", name: "AI Blog Writer",
    headline: "Artículos SEO completos en minutos",
    description: "Genera artículos de blog optimizados para SEO con estructura profesional.",
    icon: FileText,
    features: ["Estructura H1-H3", "Meta descriptions", "Keywords integradas", "Longitud personalizable", "Múltiples idiomas"],
    useCases: ["Blogs corporativos", "Marketing de contenidos", "SEO", "Newsletters"],
    credits: 1, category: "marketing",
    demoImage: demoSocial, demoLabel: "Ejemplo — Artículo SEO generado con estructura completa",
    tryItType: "text-prompt", tryItPlaceholder: "¿Sobre qué tema quieres un artículo?",
    tryItExamples: ["10 tendencias de marketing digital para 2026", "Guía completa de e-commerce para principiantes", "Beneficios de la inteligencia artificial en la educación"],
  },
  "ad-generator": {
    id: "ads", name: "Ad Generator",
    headline: "Anuncios que generan resultados",
    description: "Crea textos de anuncios optimizados para Google Ads, Meta Ads y más.",
    icon: Megaphone,
    features: ["Google Ads headlines", "Meta Ads copy", "A/B testing", "CTAs optimizados", "Compliance"],
    useCases: ["Google Ads", "Facebook e IG Ads", "LinkedIn Ads", "Remarketing"],
    credits: 1, category: "marketing",
    demoImage: demoSocial, demoLabel: "Ejemplo — Anuncios generados para Google y Meta Ads",
    tryItType: "text-prompt", tryItPlaceholder: "Describe tu producto/servicio para generar anuncios...",
    tryItExamples: ["Anuncio de Google Ads para tienda de ropa online", "Facebook Ad para app de delivery de comida", "LinkedIn Ad para servicio de consultoría empresarial"],
  },
  "formaketing-studio": {
    id: "formaketing", name: "Canvas IA Studio",
    headline: "Marketing visual con lienzo infinito",
    description: "El estudio de marketing visual más potente. Crea flows, genera assets y construye funnels con IA.",
    icon: Palette,
    features: ["Lienzo infinito", "Generación de imágenes inline", "Flows de marketing visual", "Exporta campañas", "Colaboración"],
    useCases: ["Planificación de campañas", "Funnels de marketing", "Storyboarding", "Workflows"],
    credits: 1, category: "studio",
    demoImage: demoGenerate, demoLabel: "Canvas IA Studio — Lienzo infinito con nodos de IA",
    tryItType: "text-prompt", tryItPlaceholder: "Describe la campaña que quieres planificar...",
    tryItExamples: ["Funnel de lanzamiento para curso online", "Campaña de Black Friday para e-commerce", "Flow de email marketing para SaaS B2B"],
  },
};

const ToolLanding = () => {
  const navigate = useNavigate();
  const { toolSlug } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tryItInput, setTryItInput] = useState("");
  const [tryItImage, setTryItImage] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<string | null>(null);
  const [demoResultImage, setDemoResultImage] = useState<string | null>(null);
  const [demoing, setDemoing] = useState(false);
  const [demoUsed, setDemoUsed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  useEffect(() => {
    setTryItInput("");
    setTryItImage(null);
    setDemoResult(null);
    setDemoResultImage(null);
    setDemoUsed(false);
  }, [toolSlug]);

  const tool = toolSlug ? toolsData[toolSlug] : null;

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Herramienta no encontrada</h1>
          <Button onClick={() => navigate("/")} className="mt-4">Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const handleCTA = () => {
    if (isLoggedIn) {
      if (tool.id === "formaketing") navigate("/formarketing");
      else navigate(`/apps/${tool.id}`);
    } else {
      navigate("/auth");
    }
  };

  const handleTryDemo = async () => {
    const realTextTools = ["copywriter", "blog", "ads", "logo", "social"];
    const isTextTool = realTextTools.includes(tool.id);

    if (tool.tryItType === "image-upload" && !tryItImage) {
      toast.error("Sube una imagen primero");
      return;
    }
    if (tool.tryItType === "text-prompt" && !tryItInput.trim()) {
      toast.error("Escribe un prompt primero");
      return;
    }

    setDemoing(true);
    setDemoResult(null);
    setDemoResultImage(null);

    try {
      const data = await aiService.processAction({
        action: isTextTool ? "chat" : "image",
        tool: tool.id,
        prompt: tryItInput.trim(),
        image: tryItImage || undefined,
        model: isTextTool ? "gemini-3-flash" : "nano-banana-25"
      });

      if (data?.text) {
        setDemoResult(data.text);
        setDemoUsed(Boolean(data?.demo_limit_reached));
        toast.success("¡Resultado real generado con IA!");
      } else if (data?.url) {
        setDemoResultImage(data.url);
        setDemoUsed(Boolean(data?.demo_limit_reached));
        toast.success("¡Imagen real generada con IA!");
      } else {
        throw new Error(data?.error || "No se pudo generar el resultado");
      }
    } catch (err: any) {
      const message = err?.message || "Error al procesar";
      if (message.toLowerCase().includes("límite de pruebas gratuitas")) {
        setDemoUsed(true);
        toast("Ya usaste tus pruebas gratis. Regístrate para seguir.", {
          action: { label: "Registrarme", onClick: () => navigate("/auth") },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setDemoing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    const reader = new FileReader();
    reader.onload = () => setTryItImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const categoryLabel = tool.category === "image" ? "Imagen IA" : tool.category === "marketing" ? "Texto IA" : "Studio";
  const categoryPath = tool.category === "image" ? "/herramientas/imagen" : "/herramientas/texto";

  return (
    <div className="min-h-screen bg-white">
      <Helmet><title>{tool ? `${tool.name} | Creator IA Pro` : 'Herramienta IA | Creator IA Pro'}</title></Helmet>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-white/90 backdrop-blur-md border-b border-zinc-100">
        <Logo size="sm" showText showPro onClick={() => navigate("/")} />

        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/pricing")} className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-800 transition-colors font-medium">
            Precios
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 transition-all active:scale-95"
          >
            Empezar gratis
          </button>
        </div>
      </header>

      <main>
        {/* ── Breadcrumb ─────────────────────────────────── */}
        <div className="border-b border-zinc-100 bg-zinc-50 pt-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-zinc-500" aria-label="Breadcrumb">
              <button onClick={() => navigate("/")} className="hover:text-zinc-800 transition-colors">Inicio</button>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <button onClick={() => navigate(categoryPath)} className="hover:text-zinc-800 transition-colors">Generar IA</button>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <button onClick={() => navigate("/herramienta/mejorar-imagen")} className="hover:text-zinc-800 transition-colors">{categoryLabel}</button>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="text-zinc-900 font-medium">{tool.name}</span>
            </nav>
          </div>
        </div>

        {/* ── Hero section ───────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-16">
          {/* Title */}
          <div className="mb-8 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-semibold px-3 py-1">
              <tool.icon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {categoryLabel}
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight leading-tight max-w-3xl mx-auto">
              {tool.headline}
            </h1>
            <p className="mt-3 text-base text-zinc-500 max-w-xl mx-auto">{tool.description}</p>
            <p className="mt-2 text-xs text-zinc-400 font-medium">
              1 prueba gratis sin registro · {tool.credits} crédito{tool.credits > 1 ? "s" : ""} por uso después
            </p>
          </div>

          {/* 2-column layout: Demo left + Upload/Prompt right */}
          <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
            {/* LEFT — Demo showcase */}
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
                <img
                  src={tool.demoImage}
                  alt={tool.demoLabel}
                  className="w-full h-auto object-cover aspect-[16/9]"
                  loading="lazy"
                />
                {/* Before/After overlay label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <p className="text-sm font-medium text-white">{tool.demoLabel}</p>
                  <p className="text-xs text-white/70 mt-0.5">Generado con Creator IA Pro</p>
                </div>
                {/* Before/After badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-white/90 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm border border-zinc-200">ANTES</span>
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">DESPUÉS</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { stat: "+50.000", label: "procesadas" },
                  { stat: "4.9 ⭐", label: "valoración" },
                  { stat: "<5s", label: "tiempo promedio" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
                    <p className="text-lg font-bold text-zinc-900">{s.stat}</p>
                    <p className="text-[11px] text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Features grid */}
              <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Características</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {tool.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                      <span className="text-sm text-zinc-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Upload / Prompt card */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-md p-6">
                <h2 className="text-base font-bold text-zinc-900 mb-1">
                  {tool.tryItType === "image-upload" ? "Sube tu imagen" : "Escribe tu prompt"}
                </h2>
                <p className="text-xs text-zinc-500 mb-4">Prueba gratis — sin necesidad de registrarte</p>

                {tool.tryItType === "image-upload" ? (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="demo-upload"
                      onChange={handleFileUpload}
                      aria-label="Subir imagen"
                    />
                    {!tryItImage ? (
                      <label
                        htmlFor="demo-upload"
                        className="flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                          <Upload className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium text-zinc-700">Arrastra o haz clic para subir</span>
                          <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, WEBP · máx 10 MB</p>
                        </div>
                      </label>
                    ) : (
                      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        <img src={tryItImage} alt="Preview" className="h-44 w-full object-contain" />
                        <button
                          onClick={() => { setTryItImage(null); setDemoResultImage(null); }}
                          className="absolute right-2 top-2 rounded-lg border border-zinc-200 bg-white/90 px-2 py-1 text-xs text-zinc-600 hover:bg-white backdrop-blur-sm"
                          aria-label="Quitar imagen"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={tryItInput}
                      onChange={(e) => setTryItInput(e.target.value)}
                      placeholder={tool.tryItPlaceholder}
                      rows={4}
                      aria-label="Prompt de texto"
                      className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    {tool.tryItExamples.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] text-zinc-400 font-medium">Ejemplos:</p>
                        <div className="flex flex-col gap-1.5">
                          {tool.tryItExamples.map((ex, i) => (
                            <button
                              key={i}
                              onClick={() => setTryItInput(ex)}
                              className="text-left rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                            >
                              {ex}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleTryDemo}
                  disabled={demoing || (tool.tryItType === "image-upload" ? !tryItImage : !tryItInput.trim())}
                  className="w-full mt-4 bg-primary text-white hover:bg-primary/90 gap-2 h-11 font-semibold rounded-xl shadow-sm"
                  aria-label={demoing ? "Procesando..." : `Probar ${tool.name} gratis`}
                >
                  {demoing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : !isLoggedIn && demoUsed ? (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  {demoing ? "Procesando con IA..." : !isLoggedIn && demoUsed ? "Límite alcanzado" : `Probar ${tool.name}${isLoggedIn ? "" : " — Gratis"}`}
                </Button>

                {/* Result area */}
                {(demoing || demoResult || demoResultImage) && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Resultado</p>
                    {demoing ? (
                      <div className="flex h-32 items-center justify-center rounded-xl border border-primary/10 bg-primary/5">
                        <div className="text-center">
                          <Loader2 className="mx-auto mb-2 h-6 w-6 text-primary animate-spin" aria-label="Cargando resultado" />
                          <p className="text-xs text-zinc-500">Nuestra IA está procesando...</p>
                        </div>
                      </div>
                    ) : demoResultImage ? (
                      <div className="space-y-2">
                        <div className="overflow-hidden rounded-xl border border-zinc-200">
                          <img src={demoResultImage} alt="Resultado generado" className="w-full object-cover" />
                        </div>
                        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-center">
                          <p className="text-xs font-medium text-zinc-900">✨ ¡Resultado listo!</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Regístrate para descargar en alta calidad.</p>
                          <Button onClick={() => navigate("/auth")} size="sm" className="mt-2 h-7 text-xs rounded-full bg-primary text-white gap-1">
                            Crear Cuenta Gratis <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ) : demoResult ? (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 max-h-52 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-xs text-zinc-700 font-sans leading-relaxed">{demoResult}</pre>
                        </div>
                        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-center">
                          <p className="text-xs font-medium text-zinc-900">✨ ¡Texto generado!</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Regístrate para generar sin límites.</p>
                          <Button onClick={() => navigate("/auth")} size="sm" className="mt-2 h-7 text-xs rounded-full bg-primary text-white gap-1">
                            Registrarme Gratis <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* CTA card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                    <tool.icon className="h-4.5 w-4.5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Acceso completo a {tool.name}</p>
                    <p className="text-xs text-zinc-500">desde $69.000 COP/mes</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {["Sin límite de generaciones", "Descarga en alta calidad", "Acceso a todas las herramientas"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-zinc-700">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCTA} className="w-full bg-primary text-white hover:bg-primary/90 gap-2 h-10 text-sm font-semibold rounded-xl">
                  {isLoggedIn ? `Abrir ${tool.name}` : "Empezar Gratis"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Use cases ──────────────────────────────────── */}
        <div className="border-t border-zinc-100 bg-zinc-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 text-center">Casos de uso</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tool.useCases.map((uc) => (
                <div key={uc} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <Zap className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-sm text-zinc-700">{uc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ───────────────────────────────── */}
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-8 text-center">Cómo funciona</h2>
            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { step: "1", title: "Sube o escribe", desc: "Carga tu imagen o describe lo que necesitas." },
                { step: "2", title: "La IA procesa", desc: "Nuestra IA analiza y genera el resultado en segundos." },
                { step: "3", title: "Descarga", desc: "Descarga tu resultado en alta calidad sin marca de agua." },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-zinc-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Final CTA ──────────────────────────────────── */}
        <div className="border-t border-zinc-100 bg-gradient-to-br from-primary/5 to-purple-50 py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">
              Empieza a usar {tool.name}
            </h2>
            <p className="text-zinc-500 mb-6">
              Regístrate gratis y obtén 5 créditos para probar todas las herramientas. Sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleCTA} size="lg" className="bg-primary text-white hover:bg-primary/90 gap-2 px-8 h-12 font-semibold rounded-xl shadow-sm">
                {isLoggedIn ? `Abrir ${tool.name}` : "Crear Cuenta Gratis"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 gap-2 px-8 h-12 font-semibold rounded-xl">
                Ver planes desde $69.000 COP
                <Play className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
};

export default ToolLanding;
