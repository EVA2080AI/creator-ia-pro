import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, ArrowRight, Check, Wand2, ZoomIn, Eraser,
  ImagePlus, RotateCcw, Image, MessageSquare, PenTool,
  Hash, FileText, Megaphone, Palette, ArrowLeft, Zap,
  Star, Users, Shield, Download, Monitor, Apple, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

const toolsData: Record<string, ToolInfo> = {
  "mejorar-imagen": {
    id: "enhance",
    name: "Mejorar Imagen",
    headline: "Mejora tus fotos con IA en segundos",
    description: "Aumenta la calidad, nitidez e iluminación de cualquier imagen automáticamente. Nuestra IA analiza cada píxel y aplica mejoras profesionales al instante.",
    icon: Wand2,
    features: ["Mejora automática de iluminación y color", "Reducción de ruido inteligente", "Aumento de nitidez sin artefactos", "Procesamiento batch disponible", "Formatos JPG, PNG, WEBP"],
    useCases: ["Fotos de productos para e-commerce", "Fotos de redes sociales", "Imágenes para presentaciones", "Restauración de capturas de pantalla"],
    credits: 2,
    category: "image",
  },
  "ampliar-4x": {
    id: "upscale",
    name: "Ampliar 4x",
    headline: "Escala imágenes hasta 4x sin perder calidad",
    description: "Amplía cualquier imagen hasta 4 veces su tamaño original manteniendo la nitidez y los detalles. Perfecto para impresión y uso en alta resolución.",
    icon: ZoomIn,
    features: ["Ampliación hasta 4x resolución", "Preservación de detalles con IA", "Ideal para impresión de gran formato", "Sin pérdida de calidad visible", "Procesamiento GPU acelerado"],
    useCases: ["Preparar fotos para impresión", "Ampliar logos y gráficos", "Mejorar fotos antiguas de baja resolución", "Wallpapers en alta resolución"],
    credits: 3,
    category: "image",
  },
  "borrar-objetos": {
    id: "eraser",
    name: "Borrar Objetos",
    headline: "Elimina lo que sobra con un solo clic",
    description: "Selecciona cualquier objeto no deseado en tu imagen y nuestra IA lo eliminará de forma inteligente, rellenando el fondo de manera natural.",
    icon: Eraser,
    features: ["Borrado inteligente con relleno automático", "Detección de objetos con IA", "Resultados naturales e imperceptibles", "Múltiples objetos por imagen", "Sin marca de agua"],
    useCases: ["Eliminar personas del fondo", "Quitar textos y logotipos", "Limpiar fotos de productos", "Eliminar elementos distractores"],
    credits: 2,
    category: "image",
  },
  "quitar-fondo": {
    id: "background",
    name: "Quitar Fondo",
    headline: "Fondos eliminados automáticamente con IA",
    description: "Elimina el fondo de cualquier imagen en segundos. Perfecto para fotos de productos, retratos y contenido de redes sociales.",
    icon: ImagePlus,
    features: ["Recorte perfecto de bordes", "Fondo transparente PNG", "Detección de cabello y detalles finos", "Procesamiento en menos de 5 segundos", "Compatible con e-commerce"],
    useCases: ["Fotos de producto sin fondo", "Retratos para perfiles profesionales", "Stickers y emojis personalizados", "Composiciones de diseño"],
    credits: 1,
    category: "image",
  },
  "restaurar-foto": {
    id: "restore",
    name: "Restaurar Foto",
    headline: "Revive tus fotos antiguas con IA",
    description: "Restaura fotos antiguas, dañadas o borrosas. Nuestra IA corrige arañazos, manchas, decoloración y falta de nitidez.",
    icon: RotateCcw,
    features: ["Reparación de arañazos y manchas", "Corrección de color y decoloración", "Aumento de nitidez en fotos borrosas", "Restauración de rostros con IA", "Colorización de fotos B&N"],
    useCases: ["Fotos familiares antiguas", "Documentos históricos", "Fotos escaneadas de baja calidad", "Imágenes con daño por agua"],
    credits: 3,
    category: "image",
  },
  "texto-a-imagen": {
    id: "generate",
    name: "Texto a Imagen",
    headline: "Crea imágenes únicas desde texto",
    description: "Describe lo que imaginas y nuestra IA lo convierte en una imagen profesional. Estilos fotorrealistas, ilustración, 3D y más.",
    icon: Image,
    features: ["Múltiples estilos artísticos", "Resolución hasta 4K", "Generación en menos de 30 segundos", "Prompts en español", "Sin derechos de autor"],
    useCases: ["Contenido para redes sociales", "Ilustraciones para blogs", "Conceptos de diseño rápidos", "Arte digital personalizado"],
    credits: 1,
    category: "image",
  },
  "ai-copywriter": {
    id: "copywriter",
    name: "AI Copywriter",
    headline: "Textos de marketing que convierten",
    description: "Genera textos persuasivos para anuncios, landing pages, emails y redes sociales. Copywriting profesional potenciado por IA.",
    icon: MessageSquare,
    features: ["Textos para Google Ads y Meta Ads", "Copy para landing pages", "Emails de marketing automatizados", "Múltiples tonos y estilos", "Optimizado para conversión"],
    useCases: ["Campañas publicitarias", "Emails de ventas", "Descripciones de productos", "Posts para redes sociales"],
    credits: 1,
    category: "marketing",
  },
  "logo-maker": {
    id: "logo",
    name: "Logo Maker",
    headline: "Logos profesionales creados con IA",
    description: "Diseña logos únicos y profesionales en minutos. Describe tu marca y estilo, nuestra IA creará opciones que reflejan tu identidad.",
    icon: PenTool,
    features: ["Múltiples variaciones por prompt", "Estilos: minimalista, moderno, vintage", "Formato vectorial de alta calidad", "Adaptable a diferentes usos", "Branding consistente"],
    useCases: ["Nuevos emprendimientos", "Rebranding de marcas", "Proyectos personales", "Identidad visual completa"],
    credits: 2,
    category: "marketing",
  },
  "social-media-kit": {
    id: "social",
    name: "Social Media Kit",
    headline: "Contenido social optimizado con IA",
    description: "Genera kits completos de contenido para redes sociales: textos, hashtags y sugerencias visuales optimizados para cada plataforma.",
    icon: Hash,
    features: ["Optimizado para Instagram, TikTok, LinkedIn", "Hashtags relevantes automáticos", "Calendarios de contenido", "Textos para stories y reels", "Tendencias actualizadas"],
    useCases: ["Community managers", "Marcas con presencia digital", "Influencers y creadores", "Agencias de marketing"],
    credits: 2,
    category: "marketing",
  },
  "ai-blog-writer": {
    id: "blog",
    name: "AI Blog Writer",
    headline: "Artículos SEO completos en minutos",
    description: "Genera artículos de blog optimizados para SEO con estructura profesional: títulos, subtítulos, meta descriptions y contenido de calidad.",
    icon: FileText,
    features: ["Estructura H1-H3 automática", "Meta descriptions optimizadas", "Investigación de keywords integrada", "Longitud personalizable", "Múltiples idiomas"],
    useCases: ["Blogs corporativos", "Marketing de contenidos", "SEO y posicionamiento", "Newsletters y emails"],
    credits: 1,
    category: "marketing",
  },
  "ad-generator": {
    id: "ads",
    name: "Ad Generator",
    headline: "Anuncios que generan resultados",
    description: "Crea textos de anuncios optimizados para Google Ads, Meta Ads y otras plataformas. Headlines, descripciones y CTAs que convierten.",
    icon: Megaphone,
    features: ["Google Ads: headlines y descriptions", "Meta Ads: copy para FB e IG", "A/B testing con variaciones", "CTAs optimizados", "Compliance con políticas"],
    useCases: ["Campañas de Google Ads", "Facebook e Instagram Ads", "LinkedIn Ads", "Campañas de remarketing"],
    credits: 1,
    category: "marketing",
  },
  "formaketing-studio": {
    id: "formaketing",
    name: "Formaketing Studio",
    headline: "Marketing visual con lienzo infinito",
    description: "El estudio de marketing visual más potente. Crea flows de campañas, conecta nodos de contenido, genera assets y construye funnels completos con IA.",
    icon: Palette,
    features: ["Lienzo infinito con nodos conectables", "Generación de imágenes inline", "Flows de marketing visual", "Exporta campañas completas", "Colaboración en tiempo real"],
    useCases: ["Planificación de campañas", "Funnels de marketing", "Storyboarding visual", "Workflows de contenido"],
    credits: 1,
    category: "studio",
  },
};

const ToolLanding = () => {
  const navigate = useNavigate();
  const { toolSlug } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

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
      if (tool.id === "formaketing") {
        navigate("/canvas");
      } else {
        navigate("/tools");
      }
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[180px]" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[150px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-muted-foreground hover:text-foreground hidden sm:flex text-sm">
            Precios
          </Button>
          <Button onClick={handleCTA} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
            {isLoggedIn ? "Ir a la App" : "Empezar Gratis"}
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-16 pb-32">
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

        <div className="mt-10 flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Button onClick={handleCTA} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-10 rounded-full h-12">
            {isLoggedIn ? `Usar ${tool.name}` : "Probar Gratis"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-border text-foreground hover:bg-muted gap-2 text-base px-8 rounded-full h-12">
            Ver Planes
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Solo {tool.credits} crédito{tool.credits > 1 ? "s" : ""} por uso • 100 créditos gratis al registrarte
        </p>

        {/* Features */}
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
              { step: "3", title: "Descarga", desc: "Descarga tu resultado en alta calidad, listo para usar." },
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

        {/* Pricing CTA */}
        <div className="mt-24 w-full max-w-3xl rounded-3xl border border-primary/20 bg-card/60 p-12 text-center node-shadow backdrop-blur-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <tool.icon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Empieza a usar <span className="gradient-text">{tool.name}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Regístrate gratis y obtén 100 créditos para probar todas las herramientas. Sin tarjeta de crédito.
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
        <footer className="mt-24 w-full max-w-5xl border-t border-border pt-8 text-center text-xs text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
};

export default ToolLanding;
