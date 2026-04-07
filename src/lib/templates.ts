import { ElementType } from 'react';
import {
  Layout, Megaphone, Share2, Sparkles, Instagram, Video, FileText,
  Palette, Globe, Image, Search, Mic, Zap, Rocket, TrendingUp, Monitor,
  ShoppingBag, BarChart2, Smartphone, Camera, BookOpen, LayoutGrid, Hash, PenTool
} from "lucide-react";

export type NodeType = 
  | 'characterBreakdown' | 'modelView' | 'videoModel' | 'layoutBuilder' 
  | 'campaignManager' | 'antigravityBridge' | 'llmNode' | 'textInput' 
  | 'captionNode' | 'promptBuilder' | 'exportNode';

export interface TemplateNode {
  type: NodeType;
  data: Record<string, any>;
}

export interface TemplateEdge {
  source: number; 
  target: number;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: ElementType;
  color: string;
  nodes: TemplateNode[];
  edges?: TemplateEdge[];
  tags: string[];
}

export const CATEGORIES = [
  'Todos', 'Redes Sociales', 'Publicidad', 'Marca', 'Contenido', 'Web', 'UI/UX', 'SEO', 'Email'
];

export const TEMPLATES: Template[] = [
  {
    id: 'meta-ad-single',
    title: 'Meta Ads — Imagen Única',
    description: 'Campaña de imagen única optimizada para Facebook e Instagram. Incluye nodo de copy principal, imagen IA y CTA.',
    category: 'Publicidad',
    icon: Megaphone,
    color: '#3b82f6',
    tags: ['Facebook', 'Instagram', 'Imagen'],
    nodes: [
      { type: 'textInput', data: { title: "Briefing del Anuncio", value: "Escribe aquí el producto, audiencia y propuesta de valor..." } },
      { type: 'modelView', data: { title: 'Imagen IA', prompt: 'Anuncio publicitario profesional para Meta Ads', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Campaña Meta Ads', platforms: { facebook: 'pending', instagram: 'pending' }, status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'image-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'google-ads',
    title: 'Google Ads — Responsive',
    description: 'Anuncio de búsqueda con múltiples titulares y descripciones generados con IA para máximo Quality Score.',
    category: 'Publicidad',
    icon: Search,
    color: '#0ea5e9',
    tags: ['Google', 'Search', 'Copy'],
    nodes: [
      { type: 'textInput', data: { title: "Producto / Servicio", value: "Escribe el producto que ofreces o palabras clave objetivo..." } },
      { type: 'llmNode', data: { title: "Copy Titulares", systemPrompt: "Genera 3 titulares y 2 descripciones para un anuncio Google Ads Responsive. Máximo 30 caracteres por titular y 90 por descripción. Solo devuelve el texto estructurado.", model: "anthropic/claude-sonnet-4-5", status: 'idle' } },
      { type: 'captionNode', data: { title: "Estrategia SEM", network: "google", tone: "Persuasivo 🔍", status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'tiktok_video',
    title: 'Video UGC para TikTok',
    description: 'Flujo completo para crear contenido vertical viral: guion UGC y generación o edición del video final.',
    category: 'Redes Sociales',
    icon: Video,
    color: '#6366f1',
    tags: ['TikTok', 'UGC', 'Video'],
    nodes: [
      { type: 'textInput', data: { title: "Idea del Video", value: "Escribe de qué trata el video o el producto a mostrar..." } },
      { type: 'llmNode', data: { title: 'Guión UGC Viral', systemPrompt: "Escribe un guión UGC viral para TikTok de 30 segundos. Hook potente en los primeros 3 segundos, desarrollo y CTA. Tono casual y auténtico.", status: 'idle' } },
      { type: 'videoModel', data: { title: 'Generador Video TikTok', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Estrategia TikTok', platforms: { tiktok: 'pending' }, status: 'idle' } },
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 2, target: 3, sourceHandle: 'video-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'landing_page_wireframe',
    title: 'Landing Page Flow',
    description: 'Genera todo el esquema, wireframes y copy de una landing optimizada para conversiones.',
    category: 'Web',
    icon: Globe,
    color: '#10b981',
    tags: ['Landing', 'SaaS', 'Web'],
    nodes: [
      { type: 'textInput', data: { title: "Producto SaaS / Oferta", value: "Describe la oferta, propuesta de valor y pain points de tu cliente..." } },
      { type: 'llmNode', data: { title: 'Copywriting de Landing', systemPrompt: "Genera el copy completo de una landing page: H1 impactante, subtítulo, 3 features con descripción y testimonios y CTA.", status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Wireframe Visual', prompt: "Generador de layout y wireframe de la landing", status: 'idle' } },
      { type: 'modelView', data: { title: 'Hero Image Visual', prompt: "Modern SaaS product hero image 16:9, clean UI, colorful gradient, professional", status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 2, target: 3, sourceHandle: 'ui-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'social-kit-full',
    title: 'Campaña Omnicanal (Kit)',
    description: 'Contenido consolidado para Instagram, LinkedIn y Twitter a partir de un solo prompt o contexto.',
    category: 'Redes Sociales',
    icon: Sparkles,
    color: '#8b5cf6',
    tags: ['Omnicanal', 'Instagram', 'LinkedIn', 'Twitter'],
    nodes: [
      { type: 'textInput', data: { title: "Brief de Marca & Anuncio", value: "Escribe la novedad o el anuncio que deseas publicar..." } },
      { type: 'modelView', data: { title: 'Imagen del Post', prompt: "Visual creativo para redes sociales", status: 'idle' } },
      { type: 'captionNode', data: { title: "Post Instagram", network: "instagram", tone: "Viral 🔥", status: 'idle' } },
      { type: 'captionNode', data: { title: "Post LinkedIn", network: "linkedin", tone: "Profesional 💼", status: 'idle' } },
      { type: 'captionNode', data: { title: "Tweet / Hilo", network: "twitter", tone: "Directo e informativo", status: 'idle' } },
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 3, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 4, sourceHandle: 'any-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'blog-seo',
    title: 'Blog Post SEO Estratégico',
    description: 'Genera un artículo de blog 100% optimizado para SEO: research de keyword, desarrollo y redacción de metas.',
    category: 'SEO',
    icon: FileText,
    color: '#64748b',
    tags: ['Blog', 'Contenido', 'SEO'],
    nodes: [
      { type: 'textInput', data: { title: "Tema o Keyword", value: "Introduce la palabra clave principal de tu artículo..." } },
      { type: 'characterBreakdown', data: { title: 'Perfil de Búsqueda (Intent)', status: 'idle' } },
      { type: 'llmNode', data: { title: "Redactor SEO Artículos", systemPrompt: "Escribe un artículo de 1000 palabras estructurado por H1, H2 y H3 utilizando entidades NLP importantes para la keyword proporcionada", status: 'idle' } },
      { type: 'modelView', data: { title: 'Imagen Portada', prompt: "Fotografía llamativa para banner de blog", status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 2, target: 3, sourceHandle: 'any-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'brand_identity',
    title: 'Manual de Identidad Visual',
    description: 'Sistema completo para definir bases de una marca: conceptualización, propuesta de logo y moodboard de estilo.',
    category: 'Marca',
    icon: Palette,
    color: '#f59e0b',
    tags: ['Manual', 'Branding', 'Identidad'],
    nodes: [
      { type: 'textInput', data: { title: "Propuesta de Valor de Marca", value: "Describe a tu empresa y valores principales..." } },
      { type: 'llmNode', data: { title: 'Concepto & Tono', systemPrompt: "Define el tono de voz de marca, personalidad, misión, visión y arquetipo. Formato claro y estructurado.", status: 'idle' } },
      { type: 'modelView', data: { title: 'Concepto Logo (IA)', prompt: "Logo profesional, fondo transparente, vectorial y simple vector graphic logo design", status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Moodboard de Marca', prompt: "Guía visual con paletas y tipografía", status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 2, target: 3, sourceHandle: 'image-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'email-welcome',
    title: 'Secuencia de Nurturing (Email)',
    description: 'Campañas de email de alta retención: establece reglas y automatiza copys para correos en bienvenida y ventas.',
    category: 'Email',
    icon: Mic,
    color: '#ec4899',
    tags: ['Email', 'Onboarding', 'Ventas'],
    nodes: [
      { type: 'textInput', data: { title: "Datos del Funnel", value: "Explica qué vendes y a quién, y qué regalo enviaste..." } },
      { type: 'llmNode', data: { title: 'Secuencia 5 Correos', systemPrompt: "Escribe una secuencia de bienvenida de 5 correos. E-1: Valor, E-2: Sorpresa, E-3: Caso de Éxito, E-4: Objeciones, E-5: Hard Pitch con escasez real.", status: 'idle' } },
      { type: 'campaignManager', data: { title: 'Flujo de Email Marketing', status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'ui-mobile-app',
    title: 'Diseño UX/UI de App Móvil',
    description: 'De concepto a wireframe navegable usando generadores layout orientados a la arquitectura de pantallas móviles.',
    category: 'UI/UX',
    icon: Smartphone,
    color: '#14b8a6',
    tags: ['Mobile', 'App', 'Layout'],
    nodes: [
      { type: 'textInput', data: { title: "Concepto App Móvil", value: "Qué problema principal resuelve la app y cuáles son sus features clave..." } },
      { type: 'promptBuilder', data: { title: "Prompt de App", status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'Layout UI Visual', prompt: "Diseño UI moderno app móvil con 3 vistas core, modo claro, estilo minimalista.", status: 'idle' } },
      { type: 'antigravityBridge', data: { title: 'Exportación a Studio IDE', status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'prompt-out', targetHandle: 'any-in' },
      { source: 2, target: 3, sourceHandle: 'ui-out', targetHandle: 'any-in' }
    ]
  },
  {
    id: 'youtube_video',
    title: 'Paquete de YouTube',
    description: 'Video largo completo. Genera el título, guion por minutos, miniatura Clickbait (Thumbnail) y metadatos.',
    category: 'Contenido',
    icon: Monitor,
    color: '#ef4444',
    tags: ['YouTube', 'Video', 'Script'],
    nodes: [
      { type: 'textInput', data: { title: "Idea Central del Video", value: "Tema principal que vamos a abordar..." } },
      { type: 'llmNode', data: { title: 'Guionista Retention', systemPrompt: "Genera el script de YouTube enfocado a la retención extrema, con intro-A/V ratio dinámico", status: 'idle' } },
      { type: 'modelView', data: { title: 'Generador Thumbnails HD', prompt: "Miniatura clickbait para youtube asombrosa", status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'any-out', targetHandle: 'any-in' },
      { source: 1, target: 2, sourceHandle: 'any-out', targetHandle: 'any-in' }
    ]
  }
];
