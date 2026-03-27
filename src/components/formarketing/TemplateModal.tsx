import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Layout,
  Megaphone,
  Share2,
  Sparkles,
  Instagram,
  Video,
  FileText,
  Palette,
  Globe,
  Image,
  Search,
  ArrowRight,
  Mic,
  Zap,
  Rocket,
  TrendingUp,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type NodeType = 'characterBreakdown' | 'modelView' | 'videoModel' | 'layoutBuilder' | 'campaignManager' | 'antigravityBridge';

interface TemplateNode {
  type: NodeType;
  data: Record<string, any>;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  nodes: TemplateNode[];
}

interface TemplateModalProps {
  trigger: React.ReactNode;
  onSelect: (template: Template) => void;
}

export const CATEGORIES = ['Todos', 'Redes Sociales', 'Publicidad', 'Marca', 'Contenido', 'Web'];

export const TEMPLATES: Template[] = [
  {
    id: 'instagram_ads',
    title: 'Anuncio de Instagram',
    description: 'Crea anuncios visuales de alto impacto para Instagram con copy persuasivo.',
    category: 'Redes Sociales',
    icon: Instagram,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Persona de marca', description: 'Define el tono y voz del anuncio', prompt: 'Crea una persona de marca para anuncio de Instagram', status: 'idle' } },
      { type: 'modelView', data: { title: 'Visual del anuncio', description: 'Genera la imagen principal del anuncio', prompt: 'Imagen publicitaria para Instagram, formato cuadrado, alta resolución', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Campaña de Instagram Ads', description: 'Gestiona la distribución del anuncio', prompt: 'Configura campaña de Instagram Ads con targeting óptimo', status: 'idle' } },
    ],
  },
  {
    id: 'facebook_ads',
    title: 'Anuncio de Facebook',
    description: 'Anuncios optimizados para el feed y stories de Facebook con alta conversión.',
    category: 'Publicidad',
    icon: Megaphone,
    color: 'text-aether-blue',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy del anuncio', description: 'Redacta el texto persuasivo del anuncio', prompt: 'Escribe copy de alto impacto para anuncio de Facebook', status: 'idle' } },
      { type: 'modelView', data: { title: 'Imagen del anuncio', description: 'Visual principal para el feed de Facebook', prompt: 'Imagen publicitaria profesional para Facebook Ads', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Campaña de Facebook Ads', description: 'Configura y distribuye la campaña', prompt: 'Estructura de campaña de Facebook Ads con segmentación por intereses', status: 'idle' } },
    ],
  },
  {
    id: 'tiktok_video',
    title: 'Video para TikTok',
    description: 'Contenido vertical corto y viral para maximizar el alcance en TikTok.',
    category: 'Redes Sociales',
    icon: Video,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Guión del video', description: 'Crea el guión y el gancho inicial', prompt: 'Escribe un guión viral para TikTok de 30 segundos con gancho en los primeros 3 segundos', status: 'idle' } },
      { type: 'videoModel', data: { title: 'Video TikTok', description: 'Genera el video vertical para TikTok', prompt: 'Video vertical 9:16 para TikTok, estilo dinámico y moderno', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Estrategia TikTok', description: 'Plan de publicación y hashtags', prompt: 'Estrategia de publicación en TikTok con hashtags y horarios óptimos', status: 'idle' } },
    ],
  },
  {
    id: 'landing_page',
    title: 'Página de aterrizaje',
    description: 'Landing page completa con copy, diseño y estructura optimizada para conversión.',
    category: 'Web',
    icon: Globe,
    color: 'text-emerald-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy de la landing', description: 'Redacta todos los textos de la página', prompt: 'Escribe el copy completo de una landing page de alta conversión: titular, subtítulo, beneficios, CTA', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Estructura de la landing', description: 'Diseña la estructura visual de la página', prompt: 'Wireframe y diseño de landing page con hero, beneficios, testimonios y CTA', status: 'idle' } },
      { type: 'modelView', data: { title: 'Imagen hero', description: 'Visual principal de la landing', prompt: 'Imagen hero profesional para landing page, estilo corporativo moderno', status: 'idle' } },
    ],
  },
  {
    id: 'logo_brand',
    title: 'Crear logo y marca',
    description: 'Diseña el logo y la identidad visual básica de tu marca desde cero.',
    category: 'Marca',
    icon: Palette,
    color: 'text-aether-purple',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Brief de marca', description: 'Define los valores y personalidad de la marca', prompt: 'Crea un brief creativo para el diseño de logo y marca: valores, colores, tipografía, estilo', status: 'idle' } },
      { type: 'modelView', data: { title: 'Diseño del logo', description: 'Genera opciones de logo para la marca', prompt: 'Logo minimalista y profesional, fondo transparente, vectorial', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Manual de marca', description: 'Crea las guías de uso de la identidad', prompt: 'Manual de identidad visual básico: colores, tipografías, uso del logo', status: 'idle' } },
    ],
  },
  {
    id: 'blog_article',
    title: 'Artículo de blog',
    description: 'Artículo largo, bien estructurado y optimizado para SEO sobre cualquier tema.',
    category: 'Contenido',
    icon: FileText,
    color: 'text-amber-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Estructura del artículo', description: 'Planifica el contenido y los subtítulos', prompt: 'Crea la estructura completa de un artículo de blog SEO: título, meta descripción, H2s y puntos clave', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Formato del artículo', description: 'Define el diseño y layout del contenido', prompt: 'Layout para artículo de blog con imagen destacada, secciones y CTA interno', status: 'idle' } },
    ],
  },
  {
    id: 'google_ads',
    title: 'Anuncio de Google',
    description: 'Anuncios de búsqueda y display para Google Ads con alto CTR y conversión.',
    category: 'Publicidad',
    icon: Search,
    color: 'text-aether-blue',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy de Google Ads', description: 'Escribe los títulos y descripciones del anuncio', prompt: 'Escribe 5 variaciones de títulos y descripciones para Google Search Ads con máximo CTR', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Campaña de Google Ads', description: 'Estructura la campaña y las palabras clave', prompt: 'Estructura de campaña de Google Ads con grupos de anuncios y palabras clave negativas', status: 'idle' } },
    ],
  },
  {
    id: 'youtube_video',
    title: 'Video de YouTube',
    description: 'Video completo para YouTube con guión, thumbnail y descripción optimizada.',
    category: 'Contenido',
    icon: Video,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Guión del video', description: 'Redacta el guión completo del video', prompt: 'Escribe un guión para video de YouTube de 10 minutos con gancho inicial, desarrollo y CTA final', status: 'idle' } },
      { type: 'videoModel', data: { title: 'Video de YouTube', description: 'Genera el video o clips principales', prompt: 'Video horizontal 16:9 para YouTube, estilo profesional y dinámico', status: 'idle' } },
      { type: 'modelView', data: { title: 'Thumbnail del video', description: 'Crea el thumbnail llamativo para YouTube', prompt: 'Thumbnail de YouTube con texto impactante, colores vivos y rostro expresivo', status: 'idle' } },
    ],
  },
  {
    id: 'email_campaign',
    title: 'Campaña de email',
    description: 'Secuencia de emails de marketing con alta tasa de apertura y conversión.',
    category: 'Publicidad',
    icon: Megaphone,
    color: 'text-emerald-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy de emails', description: 'Redacta los textos de la secuencia', prompt: 'Escribe una secuencia de 5 emails de marketing: bienvenida, valor, caso de éxito, oferta y urgencia', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Diseño de emails', description: 'Estructura visual de los emails', prompt: 'Templates de email responsive con header, contenido y footer para campaña de email marketing', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Estrategia de email', description: 'Plan de envío y segmentación', prompt: 'Estrategia de email marketing: segmentación, horarios de envío, KPIs y métricas de seguimiento', status: 'idle' } },
    ],
  },
  {
    id: 'linkedin_post',
    title: 'Post de LinkedIn',
    description: 'Publicación profesional para LinkedIn que genera engagement y autoridad.',
    category: 'Redes Sociales',
    icon: TrendingUp,
    color: 'text-aether-blue',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Texto del post', description: 'Redacta el contenido del post de LinkedIn', prompt: 'Escribe un post de LinkedIn de alto engagement con historia personal, aprendizaje clave y llamada a la acción', status: 'idle' } },
      { type: 'modelView', data: { title: 'Imagen del post', description: 'Visual que acompañe el post', prompt: 'Imagen profesional para LinkedIn, formato 1200x627, estilo corporativo moderno', status: 'idle' } },
    ],
  },
  {
    id: 'brand_identity',
    title: 'Identidad de marca',
    description: 'Sistema de identidad visual completo: logo, colores, tipografía y guía de estilo.',
    category: 'Marca',
    icon: Palette,
    color: 'text-aether-purple',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Estrategia de marca', description: 'Define la misión, visión y valores', prompt: 'Desarrolla la estrategia de marca completa: propósito, valores, arquetipo, tono de voz y posicionamiento', status: 'idle' } },
      { type: 'modelView', data: { title: 'Logo principal', description: 'Diseño del logotipo principal', prompt: 'Logo profesional y versátil para la marca, múltiples variaciones: positivo, negativo e icono', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Sistema visual', description: 'Paleta de colores y tipografías', prompt: 'Sistema visual completo: paleta de colores primarios y secundarios, tipografías principal y secundaria', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Guía de marca', description: 'Manual de uso de la identidad', prompt: 'Guía de marca completa con reglas de uso del logo, colores, tipografía y ejemplos de aplicación', status: 'idle' } },
    ],
  },
  {
    id: 'product_launch',
    title: 'Lanzamiento de producto',
    description: 'Estrategia completa de lanzamiento con contenido visual y campaña multicanal.',
    category: 'Publicidad',
    icon: Rocket,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Storytelling del producto', description: 'La historia detrás del producto', prompt: 'Crea el storytelling de lanzamiento: problema, solución, beneficios y propuesta de valor única', status: 'idle' } },
      { type: 'modelView', data: { title: 'Fotos del producto', description: 'Imágenes de producto profesionales', prompt: 'Fotografía de producto profesional con fondo blanco y versión lifestyle en contexto real', status: 'idle' } },
      { type: 'videoModel', data: { title: 'Video de lanzamiento', description: 'Teaser o video principal del producto', prompt: 'Video de lanzamiento de producto: 60 segundos, estilo cinematográfico, con beneficios clave', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Campaña de lanzamiento', description: 'Plan de medios y distribución', prompt: 'Plan de lanzamiento multicanal: redes sociales, email, paid media y PR en 30 días', status: 'idle' } },
    ],
  },
  {
    id: 'instagram_story',
    title: 'Historia de Instagram',
    description: 'Stories verticales atractivos para Instagram con diseño profesional.',
    category: 'Redes Sociales',
    icon: Instagram,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy del story', description: 'Texto e instrucciones para el story', prompt: 'Escribe el copy para una secuencia de 5 stories de Instagram: gancho, desarrollo, CTA y encuesta', status: 'idle' } },
      { type: 'modelView', data: { title: 'Diseño del story', description: 'Visual del story formato 9:16', prompt: 'Diseño de Instagram Story 1080x1920px, colores vibrantes, texto legible y elementos gráficos', status: 'idle' } },
    ],
  },
  {
    id: 'web_app_ui',
    title: 'Diseño de app móvil',
    description: 'UI/UX de aplicación móvil con pantallas principales y flujo de usuario.',
    category: 'Web',
    icon: Monitor,
    color: 'text-aether-blue',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Descripción de la app', description: 'Define el propósito y funcionalidades', prompt: 'Describe la arquitectura de información, flujo de usuario y pantallas principales de la app móvil', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'UI de la app', description: 'Diseño de las pantallas principales', prompt: 'Diseño UI de app móvil: pantalla de inicio, lista, detalle y perfil con sistema de diseño consistente', status: 'idle' } },
      { type: 'modelView', data: { title: 'Mockups de la app', description: 'Visualizaciones realistas de la app', prompt: 'Mockup de app móvil en iPhone 16 Pro, estilo minimalista y moderno, fondo oscuro', status: 'idle' } },
    ],
  },
  {
    id: 'pinterest_content',
    title: 'Contenido para Pinterest',
    description: 'Pins verticales llamativos con diseño optimizado para Pinterest.',
    category: 'Redes Sociales',
    icon: Image,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy del pin', description: 'Título y descripción del pin', prompt: 'Escribe 10 títulos llamativos y descripciones SEO para pins de Pinterest en la categoría seleccionada', status: 'idle' } },
      { type: 'modelView', data: { title: 'Diseño del pin', description: 'Imagen vertical para Pinterest', prompt: 'Diseño de pin para Pinterest 1000x1500px, estilo editorial, con título superpuesto y branding sutil', status: 'idle' } },
    ],
  },
  {
    id: 'podcast_cover',
    title: 'Portada de podcast',
    description: 'Arte de podcast profesional para destacar en plataformas de audio.',
    category: 'Contenido',
    icon: Mic,
    color: 'text-aether-purple',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Concepto del podcast', description: 'Define el nombre, tagline y estilo', prompt: 'Desarrolla el concepto visual del podcast: nombre, tagline, colores, tipografía y personalidad', status: 'idle' } },
      { type: 'modelView', data: { title: 'Arte del podcast', description: 'Portada cuadrada 3000x3000px', prompt: 'Portada de podcast 3000x3000px, diseño llamativo para Spotify y Apple Podcasts, estilo profesional', status: 'idle' } },
    ],
  },
  {
    id: 'seasonal_campaign',
    title: 'Campaña de temporada',
    description: 'Campaña visual y creativa para fechas especiales o temporadas del año.',
    category: 'Publicidad',
    icon: Sparkles,
    color: 'text-amber-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Concepto de la campaña', description: 'Idea creativa y mensaje central', prompt: 'Crea el concepto creativo de la campaña de temporada: big idea, mensaje emocional y eje de comunicación', status: 'idle' } },
      { type: 'modelView', data: { title: 'Piezas visuales', description: 'Imágenes principales de la campaña', prompt: 'Pack de imágenes para campaña de temporada: banner principal, cuadrado para RRSS y formato story', status: 'idle' } },
      { type: 'videoModel', data: { title: 'Video de la campaña', description: 'Spot o video principal', prompt: 'Video de campaña de temporada: 30 segundos, emotivo, con producto/servicio en contexto festivo', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Plan de medios', description: 'Estrategia de distribución', prompt: 'Plan de medios para campaña de temporada: canales, presupuesto sugerido, calendario de publicación', status: 'idle' } },
    ],
  },
  {
    id: 'brand_presentation',
    title: 'Presentación de marca',
    description: 'Presentación corporativa de marca para clientes, inversores o socios.',
    category: 'Marca',
    icon: Layout,
    color: 'text-aether-blue',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Contenido de la presentación', description: 'Estructura y textos de la presentación', prompt: 'Escribe el contenido de una presentación de marca de 15 slides: historia, propuesta de valor, productos, equipo y próximos pasos', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Diseño de slides', description: 'Template y layout de la presentación', prompt: 'Template de presentación corporativa en PowerPoint/Keynote con portada, slides de contenido y cierre', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Estrategia de presentación', description: 'Cómo y cuándo usar la presentación', prompt: 'Guía de uso de la presentación de marca: versiones, contextos de uso y mensaje clave por audiencia', status: 'idle' } },
    ],
  },
  {
    id: 'viral_content',
    title: 'Contenido viral',
    description: 'Estrategia de contenido diseñada para maximizar el alcance orgánico y compartidos.',
    category: 'Redes Sociales',
    icon: TrendingUp,
    color: 'text-rose-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Idea viral', description: 'Concepto que conecta emocionalmente', prompt: 'Desarrolla 5 ideas de contenido viral con alto potencial de compartidos: formato, gancho emocional y CTA', status: 'idle' } },
      { type: 'videoModel', data: { title: 'Video viral', description: 'Video corto con potencial viral', prompt: 'Video corto 15-30 segundos con gancho en el primer segundo, formato vertical, estilo auténtico y cercano', status: 'idle' } },
      { type: 'modelView', data: { title: 'Visual viral', description: 'Imagen o meme con potencial de difusión', prompt: 'Imagen con alto potencial viral: meme, infografía o visual impactante relacionado con el tema', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Distribución viral', description: 'Plan de difusión del contenido', prompt: 'Estrategia de distribución para maximizar el alcance: plataformas, comunidades, influencers y timing', status: 'idle' } },
    ],
  },
  {
    id: 'full_website',
    title: 'Sitio web completo',
    description: 'Diseño y contenido de un sitio web completo de múltiples páginas.',
    category: 'Web',
    icon: Globe,
    color: 'text-emerald-400',
    nodes: [
      { type: 'characterBreakdown', data: { title: 'Copy del sitio web', description: 'Todos los textos del sitio', prompt: 'Escribe el copy completo para un sitio web de 5 páginas: inicio, nosotros, servicios, blog y contacto', status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Diseño del sitio', description: 'Estructura y layout de todas las páginas', prompt: 'Diseño de sitio web completo: wireframes de home, interior pages, sistema de diseño y guía de estilos', status: 'idle' } },
      { type: 'modelView', data: { title: 'Imágenes del sitio', description: 'Fotografías y visuales del sitio', prompt: 'Pack de imágenes para sitio web: hero, about us, servicios y blog, estilo fotográfico consistente', status: 'idle' } },
      { type: 'antigravityBridge', data: { title: 'Integración del sitio', description: 'Conecta todos los módulos del sitio', prompt: 'Conecta todos los elementos del sitio: copywriting, diseño e imágenes en un flujo de producción coherente', status: 'idle' } },
    ],
  },
];

export function TemplateModal({ trigger, onSelect }: TemplateModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: Template) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a0a0b]/95 border border-white/10 rounded-[2rem] text-white max-w-3xl p-0 backdrop-blur-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-8 pb-0 shrink-0">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight font-display">Plantillas</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-0.5 font-display">
                    {TEMPLATES.length} plantillas listas para usar
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar plantillas..."
                className="pl-11 bg-white/[0.03] border-white/10 focus:border-white/20 rounded-2xl h-11 text-xs font-medium text-white placeholder:text-white/20 transition-all"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all font-display",
                    activeCategory === cat
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white border border-white/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-y-auto px-8 pb-8 flex-1 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-white/20 text-sm">
                No se encontraron plantillas
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="group flex flex-col gap-4 p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 text-left active:scale-[0.97]"
                  >
                    {/* Icon + Arrow */}
                    <div className="flex items-start justify-between">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner transition-all group-hover:scale-110 group-hover:rotate-3", template.color)}>
                        <template.icon className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/10 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1.5 flex-1">
                      <h3 className="text-sm font-bold text-white tracking-tight font-display leading-snug">{template.title}</h3>
                      <p className="text-[10px] text-white/30 font-medium leading-relaxed line-clamp-2">{template.description}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-widest font-display">
                        {template.category}
                      </span>
                      <span className="text-[9px] text-white/20 font-bold font-display">
                        {template.nodes.length} {template.nodes.length === 1 ? 'nodo' : 'nodos'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-white/5 shrink-0">
            <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.4em] font-display text-center">
              Creator IA Pro · Studio
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
