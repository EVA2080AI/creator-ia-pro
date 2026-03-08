import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, ArrowRight, Check, Wand2, ZoomIn, Eraser,
  ImagePlus, RotateCcw, Image, MessageSquare, PenTool,
  Hash, FileText, Megaphone, Palette, ArrowLeft, Zap,
  Star, Play, Upload, Loader2, Lock, Copy, Download,
  Menu, ChevronDown, Home, CreditCard, LayoutGrid,
  MonitorDown, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

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
    id: "formaketing", name: "Formaketing Studio",
    headline: "Marketing visual con lienzo infinito",
    description: "El estudio de marketing visual más potente. Crea flows, genera assets y construye funnels con IA.",
    icon: Palette,
    features: ["Lienzo infinito", "Generación de imágenes inline", "Flows de marketing visual", "Exporta campañas", "Colaboración"],
    useCases: ["Planificación de campañas", "Funnels de marketing", "Storyboarding", "Workflows"],
    credits: 1, category: "studio",
    demoImage: demoGenerate, demoLabel: "Formaketing Studio — Lienzo infinito con nodos de IA",
    tryItType: "text-prompt", tryItPlaceholder: "Describe la campaña que quieres planificar...",
    tryItExamples: ["Funnel de lanzamiento para curso online", "Campaña de Black Friday para e-commerce", "Flow de email marketing para SaaS B2B"],
  },
};

// Simulated demo results for text tools (free preview)
const demoTextResults: Record<string, string> = {
  copywriter: `🎯 **Headline Principal:**
"Camina con estilo. Corre con pasión."

📝 **Copy para Facebook Ad:**
¿Buscas las zapatillas perfectas? Nuestras nuevas Runner Pro combinan comodidad extrema con diseño premium. Suela con tecnología CloudStep™ para que cada paso se sienta como caminar sobre nubes.

✅ Envío gratis en pedidos +$50
✅ 30 días de devolución sin preguntas
✅ 4.9⭐ de +10,000 reseñas

👉 Compra ahora y obtén 20% OFF con el código RUNNER20

📱 **Copy para Instagram:**
Tu nuevo mejor amigo para el gym, la calle y la vida. 🏃‍♂️✨ Runner Pro — donde el estilo se encuentra con el rendimiento. Link en bio 👆`,

  blog: `# 10 Tendencias de Marketing Digital para 2026

## Introducción
El marketing digital evoluciona a un ritmo vertiginoso. En 2026, las marcas que adopten estas tendencias liderarán sus mercados...

## 1. IA Generativa como Estándar
La inteligencia artificial ya no es opcional. Desde la creación de contenido hasta la personalización...

## 2. Video Corto Dominante
TikTok, Reels e YouTube Shorts siguen siendo los formatos con mayor engagement...

## 3. Comercio Conversacional
Los chatbots con IA permiten compras directas desde WhatsApp y Messenger...

*[Artículo completo de 1,500 palabras generado con estructura SEO, meta description y keywords optimizadas]*`,

  ads: `📊 **Google Ads — Headlines:**
• Zapatillas Premium | Envío Gratis Hoy
• Runner Pro™ — Comodidad que se Siente
• -20% en Zapatillas Deportivas | Solo Hoy

📝 **Google Ads — Descriptions:**
• Descubre las nuevas Runner Pro con tecnología CloudStep™. Comodidad extrema para tu día a día. Envío gratis.
• +10,000 clientes satisfechos. Zapatillas diseñadas para rendir al máximo. 30 días de garantía.

📱 **Meta Ads — Copy Principal:**
¿Listo para tu próxima aventura? Las Runner Pro son las zapatillas más cómodas que vas a usar. Tecnología CloudStep™ + diseño que enamora. 🏃‍♂️

CTA: "Comprar Ahora" → Landing con 20% descuento`,

  social: `📅 **Kit de Contenido — Skincare Orgánico**

**Instagram Post (Feed):**
🌿 Tu piel merece lo mejor de la naturaleza.
Nuestra nueva línea de skincare orgánico usa solo ingredientes 100% naturales.

Hashtags: #SkinCareNatural #BellezaOrgánica #CuidadoDeLaPiel #CleanBeauty #NaturalSkincare

**Instagram Story (3 slides):**
1. "¿Sabías que tu piel absorbe el 60% de lo que le aplicas?"
2. "Por eso creamos [Marca] — 100% ingredientes orgánicos certificados"
3. "Desliza para ver nuestra rutina de 3 pasos → Link"

**TikTok Script:**
"POV: Descubres que tu skincare tiene más químicos que un laboratorio 😱 
*transición*
Prueba [Marca] — skincare que es 100% naturaleza 🌿✨"`,

  logo: `🎨 **Opciones de Logo Generadas:**

**Opción 1 — Minimalista:**
Tipografía sans-serif limpia con ícono abstracto integrado en la letra inicial.

**Opción 2 — Emblema:**
Escudo circular con elementos que representan la marca, estilo premium.

**Opción 3 — Wordmark:**
Logotipo tipográfico con ligadura personalizada, elegante y memorable.

*Cada opción incluye: versión a color, monocromática, y variante para fondos oscuros.*`,
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
      navigate(tool.id === "formaketing" ? "/canvas" : "/tools");
    } else {
      navigate("/auth");
    }
  };

  const handleTryDemo = async () => {
    const realTextTools = ["copywriter", "blog", "ads"];
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
      if (isTextTool) {
        const chatType = tool.id === "blog" ? "blog" : "copywriter";
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: { type: chatType, prompt: tryItInput.trim() },
        });

        if (error) throw error;
        if (data?.text) {
          setDemoResult(data.text);
          setDemoUsed(Boolean(data?.demo_limit_reached));
          if (!isLoggedIn && typeof data?.demo_remaining === "number") {
            toast.success(`¡Resultado real generado! Te quedan ${data.demo_remaining} pruebas gratis.`);
          } else {
            toast.success("¡Resultado real generado con IA!");
          }
        } else {
          throw new Error(data?.error || "No se pudo generar el resultado");
        }
        return;
      }

      const supportedImageTools = ["enhance", "upscale", "eraser", "background", "restore", "generate", "logo", "social"];
      if (!supportedImageTools.includes(tool.id)) {
        throw new Error("Esta herramienta está disponible en la app completa.");
      }

      const { data, error } = await supabase.functions.invoke("ai-tool", {
        body: {
          tool: tool.id,
          image: tryItImage || undefined,
          prompt: tryItInput.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.result_url) {
        setDemoResultImage(data.result_url);
        setDemoUsed(Boolean(data?.demo_limit_reached));
        if (!isLoggedIn && typeof data?.demo_remaining === "number") {
          toast.success(`¡Imagen real generada! Te quedan ${data.demo_remaining} pruebas gratis.`);
        } else {
          toast.success("¡Imagen real generada con IA!");
        }
      } else {
        throw new Error(data?.error || "No se pudo generar la imagen");
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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[180px]" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[150px]" />
      </div>

      {/* Nav */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 sm:px-8 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold hidden sm:inline">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </button>

          {/* Mega Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">Herramientas</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[560px] p-0 bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Todas las herramientas</p>
                <p className="text-xs text-muted-foreground mt-0.5">Navega entre nuestras soluciones de IA</p>
              </div>
              <div className="grid grid-cols-2 gap-0">
                {/* Image tools */}
                <div className="p-3 border-r border-border">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 mb-2">Herramientas de Imagen</p>
                  {Object.entries(toolsData).filter(([, t]) => t.category === "image").map(([slug, t]) => (
                    <button
                      key={slug}
                      onClick={() => navigate(`/herramienta/${slug}`)}
                      className={`flex items-center gap-2.5 w-full rounded-xl px-2.5 py-2 text-left transition-colors ${
                        toolSlug === slug ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toolSlug === slug ? "bg-primary/20" : "bg-muted"}`}>
                        <t.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium leading-tight">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.credits} cr</p>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Marketing + Studio tools */}
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 mb-2">Apps de Marketing</p>
                  {Object.entries(toolsData).filter(([, t]) => t.category === "marketing" || t.category === "studio").map(([slug, t]) => (
                    <button
                      key={slug}
                      onClick={() => navigate(`/herramienta/${slug}`)}
                      className={`flex items-center gap-2.5 w-full rounded-xl px-2.5 py-2 text-left transition-colors ${
                        toolSlug === slug ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toolSlug === slug ? "bg-primary/20" : "bg-muted"}`}>
                        <t.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium leading-tight">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.credits} cr</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Quick links footer */}
              <div className="flex items-center gap-2 p-3 border-t border-border bg-muted/20">
                <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs text-muted-foreground h-7 gap-1.5">
                  <Home className="h-3 w-3" /> Inicio
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="text-xs text-muted-foreground h-7 gap-1.5">
                  <CreditCard className="h-3 w-3" /> Planes
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/descargar")} className="text-xs text-muted-foreground h-7 gap-1.5">
                  <MonitorDown className="h-3 w-3" /> Descargar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-muted-foreground hover:text-foreground hidden sm:flex text-sm">
            Precios
          </Button>
          <Button onClick={() => navigate("/descargar")} variant="ghost" className="text-muted-foreground hover:text-foreground hidden md:flex text-sm">
            Descargar
          </Button>
          {!isLoggedIn && (
            <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-full px-5 text-sm border-border">
              Iniciar Sesión
            </Button>
          )}
          <Button onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
            {isLoggedIn ? "Ir a la App" : "Empezar Gratis"}
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-12 pb-32">
        {/* Hero */}
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          <tool.icon className="mr-1.5 h-3.5 w-3.5" />
          {tool.name}
        </Badge>

        <h1 className="max-w-3xl text-center text-4xl font-bold leading-[1.1] tracking-tight animate-fade-in md:text-6xl">
          <span className="gradient-text">{tool.headline}</span>
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg text-muted-foreground animate-fade-in leading-relaxed">
          {tool.description}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Button onClick={() => document.getElementById("try-demo")?.scrollIntoView({ behavior: "smooth" })} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-10 rounded-full h-12">
            <Play className="h-4 w-4" />
            Probar Ahora — Gratis
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-border text-foreground hover:bg-muted gap-2 text-base px-8 rounded-full h-12">
            Ver Planes
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          1 prueba gratis sin registro • Luego {tool.credits} crédito{tool.credits > 1 ? "s" : ""} por uso
        </p>

        {/* ========== VISUAL SHOWCASE ========== */}
        <div className="mt-16 w-full max-w-4xl animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-sm node-shadow">
            <img
              src={tool.demoImage}
              alt={tool.demoLabel}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
              <p className="text-sm font-medium text-foreground">{tool.demoLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">Resultado generado con Creator IA Pro</p>
            </div>
          </div>
        </div>

        {/* ========== TRY IT FREE SECTION ========== */}
        <div id="try-demo" className="mt-24 w-full max-w-4xl scroll-mt-8">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 hover:bg-accent/10">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Demo Interactiva
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              Prueba <span className="gradient-text">{tool.name}</span> ahora mismo
            </h2>
            <p className="mt-3 text-muted-foreground">
              Una prueba gratis sin necesidad de registrarte. Experimenta el poder de la IA.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input side */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">1</span>
                {tool.tryItType === "image-upload" ? "Sube tu imagen" : "Escribe tu prompt"}
              </h3>

              {tool.tryItType === "image-upload" ? (
                <div className="space-y-3">
                  <input type="file" accept="image/*" className="hidden" id="demo-upload" onChange={handleFileUpload} />
                  {!tryItImage ? (
                    <label
                      htmlFor="demo-upload"
                      className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-all"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Arrastra o haz clic para subir</span>
                      <span className="text-xs text-muted-foreground/50">JPG, PNG, WEBP</span>
                    </label>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
                      <img src={tryItImage} alt="Preview" className="h-48 w-full object-contain bg-muted/20" />
                      <button
                        onClick={() => { setTryItImage(null); setDemoResultImage(null); }}
                        className="absolute right-3 top-3 rounded-lg border border-border bg-card/80 p-1.5 backdrop-blur-sm hover:bg-card text-xs text-muted-foreground"
                      >
                        ✕
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
                    className="w-full resize-none rounded-2xl border border-border bg-card/60 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary backdrop-blur-sm"
                  />
                  {tool.tryItExamples.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tool.tryItExamples.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setTryItInput(ex)}
                          className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        >
                          {ex.length > 40 ? ex.slice(0, 40) + "..." : ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleTryDemo}
                disabled={demoing || (tool.tryItType === "image-upload" ? !tryItImage : !tryItInput.trim())}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl h-11"
              >
                {demoing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : demoUsed ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {demoing ? "Procesando con IA..." : demoUsed ? "Regístrate para más" : `Probar ${tool.name} Gratis`}
              </Button>
            </div>

            {/* Result side */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent">2</span>
                Resultado
              </h3>

              {demoing ? (
                <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-primary/20 bg-card/30 backdrop-blur-sm">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-3 h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Nuestra IA está procesando...</p>
                    <div className="mt-3 h-1.5 w-48 mx-auto rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%" }} />
                    </div>
                  </div>
                </div>
              ) : demoResultImage ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <img src={demoResultImage} alt="Resultado" className="h-48 w-full object-cover bg-muted/20" />
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <p className="text-sm font-medium text-foreground">✨ ¡Resultado listo!</p>
                    <p className="text-xs text-muted-foreground mt-1">Regístrate gratis para descargar en alta calidad y acceder a todas las herramientas.</p>
                    <Button onClick={() => navigate("/auth")} size="sm" className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full gap-1 text-xs">
                      Crear Cuenta Gratis <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : demoResult ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border bg-card/60 p-5 max-h-64 overflow-y-auto backdrop-blur-sm">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{demoResult}</pre>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <p className="text-sm font-medium text-foreground">✨ ¡Texto generado!</p>
                    <p className="text-xs text-muted-foreground mt-1">Regístrate para copiar, editar y generar sin límites.</p>
                    <Button onClick={() => navigate("/auth")} size="sm" className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full gap-1 text-xs">
                      Registrarme Gratis <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 backdrop-blur-sm">
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">El resultado aparecerá aquí</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Prueba gratis — sin registro</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== FEATURES ========== */}
        <div className="mt-24 w-full max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground mb-10">
            Características <span className="gradient-text">principales</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tool.features.map((f) => (
              <div key={f} className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                <Check className="mt-0.5 h-5 w-5 text-accent shrink-0" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-20 w-full max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground mb-10">
            Casos de <span className="gradient-text">uso</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tool.useCases.map((uc) => (
              <div key={uc} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{uc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 w-full max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground mb-10">
            Cómo <span className="gradient-text">funciona</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Sube o escribe", desc: "Carga tu imagen o describe lo que necesitas." },
              { step: "2", title: "La IA procesa", desc: "Nuestra IA analiza y genera el resultado en segundos." },
              { step: "3", title: "Descarga", desc: "Descarga tu resultado en alta calidad." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-lg font-bold text-primary">
                  {s.step}
                </div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-20 w-full max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { stat: "+50,000", label: "Imágenes procesadas" },
              { stat: "4.9 ⭐", label: "Valoración media" },
              { stat: "<5 seg", label: "Tiempo promedio" },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                <p className="text-3xl font-bold gradient-text">{s.stat}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 w-full max-w-3xl rounded-3xl border border-primary/20 bg-card/60 p-12 text-center node-shadow backdrop-blur-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <tool.icon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Empieza a usar <span className="gradient-text">{tool.name}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Regístrate gratis y obtén 10 créditos para probar todas las herramientas. Sin tarjeta de crédito.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleCTA} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-10 rounded-full h-12">
              {isLoggedIn ? `Abrir ${tool.name}` : "Crear Cuenta Gratis"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-border rounded-full h-12 px-8">
              Ver todos los planes
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 w-full max-w-5xl border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
};

export default ToolLanding;
