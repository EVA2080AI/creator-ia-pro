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
    title: 'Meta Ads Standard',
    description: 'Anatomía de anuncio persuasivo: Brief → Imagen Neural → Campaign Sync.',
    category: 'Publicidad',
    icon: Megaphone,
    color: '#3b82f6',
    tags: ['Meta', 'Neural', 'Sync'],
    nodes: [
      { type: 'textInput', data: { title: "BRIEFING", value: "Producto: Serum Facial Orgánico\nAudiencia: Mujeres 25-40 interesadas en skincare minimalista." } },
      { type: 'llmNode', data: { title: 'CLAUDE 3.5 SONNET', systemPrompt: "Genera un copy publicitario para Meta Ads basado en el brief. Estructura: Gancho, Cuerpo, CTA.", status: 'idle' } },
      { type: 'modelView', data: { title: 'FLUX PRO 1.1', prompt: 'Serum facial sobre mármol blanco, iluminación cinematográfica, 4k, minimalista', status: 'idle' } },
      { type: 'campaignManager', data: { title: 'META CONNECT', platforms: { facebook: 'pending', instagram: 'pending' }, status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  },
  {
    id: 'tiktok_viral',
    title: 'TikTok UGC Engine',
    description: 'Sistema de viralización vertical: Concepto → Script Viral → Video AI.',
    category: 'Redes Sociales',
    icon: Video,
    color: '#6366f1',
    tags: ['TikTok', 'Viral', 'UGC'],
    nodes: [
      { type: 'textInput', data: { title: "CONCEPTO", value: "Review honesto de app de productividad usando la técnica de 'The Messy Middle'." } },
      { type: 'llmNode', data: { title: 'GEMINI 2.0 FLASH', systemPrompt: "Escribe un guión de 30 segundos para TikTok. Hook en los primeros 2 segundos.", status: 'idle' } },
      { type: 'videoModel', data: { title: 'KLING AI', status: 'idle' } },
      { type: 'captionNode', data: { title: "CAPTION ENGINE", network: "tiktok", tone: "Casual ⚡️", status: 'idle' } },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  },
  {
    id: 'landing_conversion',
    title: 'High-Conversion Landing',
    description: 'De idea a prototipo funcional: Arquitectura → Copy → UI Neural.',
    category: 'Web',
    icon: Globe,
    color: '#10b981',
    tags: ['Landing', 'UX', 'Conversion'],
    nodes: [
      { type: 'textInput', data: { title: "PRODUCTO", value: "Plataforma de IA para arquitectos: de bocetos a renders 3D en segundos." } },
      { type: 'llmNode', data: { title: 'CLAUDE 3.5 SONNET', systemPrompt: "Crea la arquitectura de información y el copy para una Landing Page de alta conversión.", status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'LAYOUT GEN', prompt: "SaaS landing page layout, ultra modern, architects niche", status: 'idle' } },
      { type: 'modelView', data: { title: 'DALL-E 3', prompt: "Interior de oficina de arquitectura moderna, cristal y madera, estilo escandinavo", status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  },
  {
    id: 'seo_factory',
    title: 'SEO Article Factory',
    description: 'Orquestación de contenido rankeable: Keyword → Intent → Redacción NLP.',
    category: 'SEO',
    icon: FileText,
    color: '#64748b',
    tags: ['SEO', 'Content', 'NLP'],
    nodes: [
      { type: 'textInput', data: { title: "KEYWORD", value: "Cómo invertir en bienes raíces con poco dinero 2025" } },
      { type: 'characterBreakdown', data: { title: 'SEARCH INTENT', status: 'idle' } },
      { type: 'llmNode', data: { title: 'GPT-4O', systemPrompt: "Redacta un artículo optimizado para SEO usando entidades NLP y estructura H1-H3.", status: 'idle' } },
      { type: 'exportNode', data: { title: 'DRAFT EXPORT', status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  },
  {
    id: 'brand_dna',
    title: 'Brand DNA Kit',
    description: 'Evolución de identidad: Valores → Concepto Visual → Identity Board.',
    category: 'Marca',
    icon: Palette,
    color: '#f59e0b',
    tags: ['Branding', 'Identity', 'Design'],
    nodes: [
      { type: 'textInput', data: { title: "VALORES", value: "Exploración, coraje, precisión, minimalismo tecnológico." } },
      { type: 'llmNode', data: { title: 'GEMINI 1.5 PRO', systemPrompt: "Define el manual de identidad verbal: Misión, Visión y Tono.", status: 'idle' } },
      { type: 'modelView', data: { title: 'FLUX DEV', prompt: "Tech logo concept, minimalist vector, geometric precision", status: 'idle' } },
      { type: 'layoutBuilder', data: { title: 'BRAND BOARD', status: 'idle' } }
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  }
];

