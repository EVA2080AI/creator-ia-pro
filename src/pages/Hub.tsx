import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Megaphone, FileText, Image, Video, Hash, PenTool, Type, Monitor,
  MessageSquare, Layout, Zap, Search, Mail, ShoppingBag, BarChart2,
  Smartphone, Globe, Palette, Camera, Star, BookOpen, ArrowRight,
  LayoutGrid, Plus, Sparkles
} from "lucide-react";

// ─── Template Definitions ────────────────────────────────────────────────────
const TEMPLATE_CATEGORIES = [
  "Todos", "Ads", "Landing", "Social", "SEO", "Email", "UI/UX"
];

const TEMPLATES = [
  // --- ADS ---
  {
    id: "meta-ad-single",
    category: "Ads",
    title: "Meta Ads — Imagen Única",
    desc: "Campaña de imagen única optimizada para Facebook e Instagram. Incluye nodo de copy principal, imagen IA y CTA.",
    icon: Megaphone,
    color: "#2563eb", // Royal Blue
    nodes: 4,
    tags: ["Facebook", "Instagram", "Imagen"],
    preset: [
      { type: "model", data: { title: "AI Copywriter", model: "gemini-3-flash" } },
      { type: "model", data: { title: "Imagen IA", type: "image" } },
      { type: "campaignManager", data: { title: "Meta Ads Deploy", platforms: { instagram: "pending", facebook: "pending" } } },
    ]
  },
  {
    id: "google-ads",
    category: "Ads",
    title: "Google Ads — Responsive",
    desc: "Anuncio de búsqueda con múltiples titulares y descripciones generados con IA para máximo Quality Score.",
    icon: Search,
    color: "#00c2ff",
    nodes: 3,
    tags: ["Google", "Search", "Copy"],
    preset: []
  },
  {
    id: "tiktok-ugc",
    category: "Ads",
    title: "TikTok UGC Creator",
    desc: "Flujo completo para crear un video estilo UGC: guion, voiceover y dirección creativa para TikTok Ads.",
    icon: Video,
    color: "#6366f1", // Indigo
    nodes: 5,
    tags: ["TikTok", "UGC", "Video"],
    preset: []
  },
  {
    id: "carousel-meta",
    category: "Ads",
    title: "Meta Ads — Carrusel",
    desc: "5 tarjetas de carrusel con imágenes generadas por IA y copy persuasivo para Meta Business Suite.",
    icon: LayoutGrid,
    color: "#3b82f6", // Blue-500
    nodes: 7,
    tags: ["Facebook", "Carrusel", "E-commerce"],
    preset: []
  },
  // --- LANDING ---
  {
    id: "landing-saas",
    category: "Landing",
    title: "Landing SaaS — Hero + Features",
    desc: "Landing page completa para producto SaaS: hero, propuesta de valor, features, testimonios y CTA final.",
    icon: Layout,
    color: "#0ea5e9", // Sky-500
    nodes: 6,
    tags: ["SaaS", "Web", "Conversión"],
    preset: []
  },
  {
    id: "landing-product",
    category: "Landing",
    title: "Product Launch — E-commerce",
    desc: "Página de lanzamiento de producto con contador regresivo, galería de imágenes generadas y pricing grid.",
    icon: ShoppingBag,
    color: "#8b5cf6", // Violet-500
    nodes: 5,
    tags: ["E-commerce", "Lanzamiento", "Producto"],
    preset: []
  },
  {
    id: "landing-webinar",
    category: "Landing",
    title: "Webinar / Evento Landing",
    desc: "Registro de evento o webinar con sección de speakers, agenda y formulario de inscripción.",
    icon: Camera,
    color: "#6d28d9", // Violet-700
    nodes: 4,
    tags: ["Evento", "Webinar", "Registro"],
    preset: []
  },
  // --- SOCIAL ---
  {
    id: "instagram-reel",
    category: "Social",
    title: "Instagram Reel Pack",
    desc: "Pack de 3 Reels: guion, texto en pantalla y hashtags estratégicos para máximo alcance orgánico.",
    icon: Camera,
    color: "#4f46e5", // Indigo-600
    nodes: 4,
    tags: ["Instagram", "Reels", "Orgánico"],
    preset: []
  },
  {
    id: "linkedin-post",
    category: "Social",
    title: "LinkedIn Thought Leadership",
    desc: "Post de autoridad para LinkedIn: hook, narrativa, datos e imagen profesional generada con IA.",
    icon: BookOpen,
    color: "#00c2ff",
    nodes: 3,
    tags: ["LinkedIn", "B2B", "Autoridad"],
    preset: []
  },
  {
    id: "twitter-thread",
    category: "Social",
    title: "X / Twitter Thread Viral",
    desc: "Hilo de 10 tweets con estructura viral: gancho, desarrollo y CTA final. Optimizado para engagement.",
    icon: Hash,
    color: "#1d4ed8", // Blue-700
    nodes: 3,
    tags: ["Twitter/X", "Thread", "Viral"],
    preset: []
  },
  {
    id: "social-kit-full",
    category: "Social",
    title: "Social Media Kit Completo",
    desc: "Contenido unificado para 4 plataformas: Instagram, LinkedIn, X y TikTok desde un solo prompt.",
    icon: Sparkles,
    color: "#7c3aed", // Violet-600
    nodes: 6,
    tags: ["Multi-platform", "Kit", "Eficiencia"],
    preset: []
  },
  // --- SEO ---
  {
    id: "blog-seo",
    category: "SEO",
    title: "Blog Post SEO — 1500 palabras",
    desc: "Artículo de blog optimizado: keyword research, outline, redacción y meta-descripción en un flujo.",
    icon: FileText,
    color: "#475569", // Slate-600
    nodes: 4,
    tags: ["Blog", "Contenido", "Keywords"],
    preset: []
  },
  {
    id: "product-description",
    category: "SEO",
    title: "Descripciones de Producto",
    desc: "Generación en batch de descripciones SEO para catálogos e-commerce usando variables dinámicas.",
    icon: ShoppingBag,
    color: "#ffb800",
    nodes: 3,
    tags: ["E-commerce", "Producto", "Batch"],
    preset: []
  },
  {
    id: "keyword-cluster",
    category: "SEO",
    title: "Keyword Cluster & Content Map",
    desc: "Análisis de clusters de palabras clave y mapa de contenidos para una estrategia SEO de 3 meses.",
    icon: BarChart2,
    color: "#00c2ff",
    nodes: 3,
    tags: ["Estrategia", "Keywords", "Mapa"],
    preset: []
  },
  // --- EMAIL ---
  {
    id: "email-welcome",
    category: "Email",
    title: "Secuencia de Bienvenida",
    desc: "Flujo de 5 emails de onboarding: bienvenida, propuesta de valor, caso de éxito, objeción y conversión.",
    icon: Mail,
    color: "#bd00ff",
    nodes: 6,
    tags: ["Email", "Onboarding", "Nurturing"],
    preset: []
  },
  {
    id: "email-flash-sale",
    category: "Email",
    title: "Flash Sale — Email Campaign",
    desc: "Campaña de urgencia de 3 correos: anuncio, recordatorio y último aviso con subject lines optimizados.",
    icon: Zap,
    color: "#ff0071",
    nodes: 4,
    tags: ["Email", "Oferta", "Urgencia"],
    preset: []
  },
  // --- UI/UX ---
  {
    id: "ui-mobile-app",
    category: "UI/UX",
    title: "Mobile App — 3 Pantallas",
    desc: "Diseño de flujo para app móvil: Onboarding, Dashboard principal y Pantalla de perfil de usuario.",
    icon: Smartphone,
    color: "#00c2ff",
    nodes: 4,
    tags: ["Mobile", "App", "Figma"],
    preset: []
  },
  {
    id: "ui-landing-wireframe",
    category: "UI/UX",
    title: "Landing Page Wireframe",
    desc: "Wireframe detallado de landing: secciones, componentes, paleta de color y typografía. Exportable a Figma.",
    icon: PenTool,
    color: "#00e5a0",
    nodes: 3,
    tags: ["Web", "Wireframe", "Figma"],
    preset: []
  },
  {
    id: "ui-design-system",
    category: "UI/UX",
    title: "Design System Mini",
    desc: "Sistema de diseño básico: colores, tipografía, botones y componentes core en JSON exportable.",
    icon: Palette,
    color: "#ffb800",
    nodes: 3,
    tags: ["Design System", "Tokens", "Export"],
    preset: []
  },
  {
    id: "ui-dashboard",
    category: "UI/UX",
    title: "Analytics Dashboard",
    desc: "UI de dashboard con gráficos, KPIs y sidebar de navegación. Código Tailwind + React compatible con Lovable.",
    icon: Globe,
    color: "#2563eb", // Royal Blue
    nodes: 5,
    tags: ["Dashboard", "Admin", "Lovable"],
    preset: []
  },
];

// Last 5 templates in the array are marked "Nuevo"
const NEW_TEMPLATE_IDS = new Set(TEMPLATES.slice(-5).map(t => t.id));

// ─── Component ───────────────────────────────────────────────────────────────
const Hub = () => {
  const { user, signOut } = useAuth("/auth");
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[0]);

  const filtered = category === "Todos"
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === category);

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    if (!user) return;
    try {
      const { data: space, error } = await supabase
        .from("spaces")
        .insert({ user_id: user.id, name: template.title, description: template.desc })
        .select().single();
      if (error) throw error;

      // Seed canvas nodes from preset
      if (template.preset.length > 0) {
        const nodes = template.preset.map((node: any, i: number) => ({
          user_id: user.id,
          space_id: space.id,
          type: node.type || "model",
          name: node.data?.title || `Nodo ${i + 1}`,
          position_x: 120 + i * 300,
          position_y: 200,
          status: "idle",
          data_payload: node.data || {},
          prompt: "",
        }));
        await supabase.from("canvas_nodes").insert(nodes);
      }

      toast.success(`Plantilla "${template.title}" cargada`);
      navigate(`/formarketing?spaceId=${space.id}`);
    } catch {
      toast.error("Error al crear espacio desde plantilla");
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-900 font-sans">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="pt-20">
        <div className="max-w-[1440px] mx-auto px-8 py-12">

          {/* Header */}
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] font-display">Hub de Plantillas</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-6xl font-bold tracking-tight font-display"
              >
                Proyectos & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Plantillas</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="text-sm text-zinc-400 font-medium"
              >
                {TEMPLATES.length} plantillas profesionales — 1 clic para abrir en el Studio.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex items-center gap-3 shrink-0"
            >
              <div className="px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-display">
                {filtered.length} resultados
              </div>
            </motion.div>
          </div>

          {/* Category Filter — Tailwind UI style pill tabs */}
          <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold whitespace-nowrap transition-all duration-300 font-display uppercase tracking-widest ${
                  category === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {cat}
                {cat !== "Todos" && (
                  <span className={`ml-2 text-[9px] tabular-nums ${category === cat ? "opacity-40" : "opacity-40"}`}>
                    {TEMPLATES.filter(t => t.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Template Grid — Tailwind UI card grid pattern */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Create from scratch card */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.03, borderColor: "rgba(168,85,247,0.3)" }}
              whileTap={{ scale: 0.97 }}
              aria-label="Crear lienzo en blanco — nuevo proyecto vacío"
              onClick={() => {
                supabase.from("spaces").insert({ user_id: user?.id || "", name: "Nuevo Proyecto" })
                  .select().single()
                  .then(({ data }) => {
                    if (data) navigate(`/formarketing?spaceId=${data.id}`);
                    else navigate("/formarketing");
                  });
              }}
              className="rounded-[2rem] border border-dashed border-zinc-200 group flex flex-col items-center justify-center py-12 gap-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-12 h-12 rounded-2xl bg-zinc-100 border border-dashed border-zinc-200 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all"
              >
                <Plus className="w-5 h-5 text-zinc-300 group-hover:text-primary transition-colors" />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase tracking-widest font-display">Lienzo en Blanco</p>
                <p className="text-[10px] text-zinc-300 font-display uppercase tracking-[0.15em]">Empieza desde cero</p>
              </div>
            </motion.button>

            {filtered.map((template, idx) => {
              return (<motion.div
                key={template.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.35 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                className="rounded-[2rem] border border-zinc-200 group flex flex-col gap-5 p-6 transition-all duration-300 overflow-hidden relative"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${template.color}30`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${template.color}12`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgb(228,228,231)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                {/* Color accent bar at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[2rem] opacity-60" style={{ background: `linear-gradient(90deg, ${template.color}80, transparent)` }} />

                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${template.color}12`, border: `1px solid ${template.color}20` }}
                  >
                    <template.icon className="w-5 h-5" style={{ color: template.color }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {NEW_TEMPLATE_IDS.has(template.id) && (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest font-display">
                        Nuevo
                      </span>
                    )}
                    <span
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest font-display"
                      style={{ background: `${template.color}10`, color: template.color, border: `1px solid ${template.color}15` }}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-bold text-zinc-900 leading-tight font-display tracking-tight">{template.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed truncate-2">{template.desc}</p>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap">
                  {template.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest font-display">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer — Tailwind UI divider + action pattern */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                  <span className="text-[10px] text-zinc-400 font-bold font-display uppercase tracking-widest">{template.nodes} nodos</span>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    aria-label={`Usar plantilla: ${template.title}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 active:scale-95 uppercase tracking-widest font-display"
                    style={{
                      background: `${template.color}12`,
                      color: template.color,
                      border: `1px solid ${template.color}20`
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${template.color}22`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${template.color}12`;
                    }}
                  >
                    Usar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );})}
          </div>

          <p className="text-center text-[10px] text-zinc-400 mt-12 font-bold uppercase tracking-[0.3em] font-display">
            {TEMPLATES.length} plantillas disponibles · Más con cada actualización
          </p>
        </div>
      </main>
    </div>
  );
};

export default Hub;
