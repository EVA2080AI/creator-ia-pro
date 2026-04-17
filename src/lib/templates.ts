import { ElementType } from 'react';
import {
  Layout, Megaphone, Share2, Sparkles, Instagram, Video, FileText,
  Palette, Globe, Image, Search, Mic, Zap, Rocket, TrendingUp, Monitor,
  ShoppingBag, BarChart2, Smartphone, Camera, BookOpen, LayoutGrid, Hash, PenTool,
  Mail
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
    description: 'Anatomía de anuncio persuasivo: Brief → Imagen Neural → Campaign Sync. PLANTILLA CON EJEMPLOS EJECUTADOS.',
    category: 'Publicidad',
    icon: Megaphone,
    color: '#3b82f6',
    tags: ['Meta', 'Neural', 'Sync', 'Pre-ejecutado'],
    nodes: [
      { type: 'textInput', data: {
        title: "BRIEFING",
        value: "Producto: Serum Facial Orgánico\nAudiencia: Mujeres 25-40 interesadas en skincare minimalista.\nObjetivo: Awareness + Conversión.\nPresupuesto: $500/mes."
      }},
      { type: 'llmNode', data: {
        title: 'CLAUDE 3.5 SONNET',
        systemPrompt: "Genera un copy publicitario para Meta Ads basado en el brief. Estructura: Gancho, Cuerpo, CTA.",
        output: "🌿 Tu piel merece lo mejor de la naturaleza\n\nDescubre nuestro Serum Facial Orgánico, formulado con 99% ingredientes naturales. Resultados visibles en 7 días.\n\n✨ Hidrata profundamente\n✨ Reduce líneas finas\n✨ Sin químicos agresivos\n\n🛍️ Aprovecha -30% en tu primera compra con código: NATURAL30\n\n#SkincareOrganico #BellezaNatural #CuidadoPiel",
        status: 'ready'
      }},
      { type: 'modelView', data: {
        title: 'FLUX PRO 1.1',
        prompt: 'Serum facial sobre mármol blanco, iluminación cinematográfica, 4k, minimalista, gotas de aceite esencial',
        assetUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop',
        status: 'ready'
      }},
      { type: 'campaignManager', data: {
        title: 'META CONNECT',
        platforms: { facebook: 'pending', instagram: 'pending' },
        status: 'idle'
      }}
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 2, sourceHandle: 'text-out', targetHandle: 'prompt-in' },
      { source: 2, target: 3, sourceHandle: 'image-out', targetHandle: 'content-in' }
    ]
  },
  {
    id: 'tiktok_viral',
    title: 'TikTok UGC Engine',
    description: 'Sistema de viralización vertical: Concepto → Script Viral → Video AI. PLANTILLA CON EJEMPLOS EJECUTADOS.',
    category: 'Redes Sociales',
    icon: Video,
    color: '#6366f1',
    tags: ['TikTok', 'Viral', 'UGC', 'Pre-ejecutado'],
    nodes: [
      { type: 'textInput', data: {
        title: "CONCEPTO",
        value: "Review honesto de app de productividad usando la técnica de 'The Messy Middle'.\nTarget: Millennials con side hustles.\nDuración: 30-45 segundos."
      }},
      { type: 'llmNode', data: {
        title: 'GEMINI 2.0 FLASH',
        systemPrompt: "Escribe un guión de 30 segundos para TikTok. Hook en los primeros 2 segundos.",
        output: "[0:00-0:02] HOOK: '3 apps que usan los CEOs multimillonarios... la #3 me cambió la vida'\n\n[0:02-0:15] PROBLEMA: 'Antes tenía 47 pestañas abiertas, notas en 5 apps diferentes y olvidaba el 80% de mis ideas'\n\n[0:15-0:30] SOLUCIÓN: 'Notion AI consolidó TODO. Ahora mis workflows, notas y bases de datos están en un solo lugar'\n\n[0:30-0:45] CTA: 'Link en bio para template gratuito. ¿Qué app usas tú? 👇'",
        status: 'ready'
      }},
      { type: 'videoModel', data: {
        title: 'KLING AI',
        prompt: "Young professional working on laptop in modern coffee shop, energetic motion, trendy aesthetic, 4k, dynamic transitions",
        assetUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop',
        status: 'ready'
      }},
      { type: 'captionNode', data: {
        title: "CAPTION ENGINE",
        network: "tiktok",
        tone: "Viral 🔥",
        caption: "POV: Descubriste la app que te ahorra 5 horas semanales 📈✨\n\n3 apps que usan los CEOs que trabajan SMART no HARD 💼\n\n¿Cuál usas tú? 👇\n\n#Productividad #SideHustle #Entrepreneur #Notion #WorkSmart #GenZ",
        status: 'ready'
      }}
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 2, sourceHandle: 'text-out', targetHandle: 'any-in' },
      { source: 1, target: 3, sourceHandle: 'text-out', targetHandle: 'text-in' }
    ]
  },
  {
    id: 'landing_conversion',
    title: 'High-Conversion Landing',
    description: 'De idea a prototipo funcional: Arquitectura → Copy → UI Neural. PLANTILLA CON EJEMPLOS EJECUTADOS.',
    category: 'Web',
    icon: Globe,
    color: '#10b981',
    tags: ['Landing', 'UX', 'Conversion', 'Pre-ejecutado'],
    nodes: [
      { type: 'textInput', data: {
        title: "PRODUCTO",
        value: "Plataforma de IA para arquitectos: de bocetos a renders 3D en segundos.\nTarget: Arquitectos freelance y estudios medianos.\nUSP: De sketch a render fotorealista en 15 segundos."
      }},
      { type: 'llmNode', data: {
        title: 'CLAUDE 3.5 SONNET',
        systemPrompt: "Crea la arquitectura de información y el copy para una Landing Page de alta conversión.",
        output: "**LANDING PAGE ARCHITECTURE**\n\nHERO SECTION:\nHeadline: 'Transforma bocetos en renders fotorealistas en 15 segundos'\nSubheadline: 'La IA que entiende tu visión arquitectónica. Sin configuraciones complejas, sin horas de renderizado.'\nCTA: 'Prueba gratis 14 días'\n\nSOCIAL PROOF:\n- +10,000 arquitectos confían en ArchVision AI\n- 4.9/5 estrellas en G2\n- Usado por estudios como BIG, Foster + Partners\n\nFEATURES SECTION:\n✓ Sketch-to-Render en segundos\n✓ Materiales PBR hiperrealistas\n✓ Integración directa con Rhino, Revit, SketchUp\n✓ Exporta en 4K, 8K, VR-ready\n\nPRICING:\nFreelancer: $29/mes\nStudio: $99/mes\nEnterprise: Contactar",
        status: 'ready'
      }},
      { type: 'layoutBuilder', data: {
        title: 'LAYOUT GEN',
        layout: {
          sections: ['hero', 'social-proof', 'features-grid', 'demo-video', 'pricing', 'faq', 'cta-footer'],
          colorScheme: 'dark-modern',
          primaryColor: '#10b981'
        },
        status: 'ready'
      }},
      { type: 'modelView', data: {
        title: 'DALL-E 3',
        prompt: "Modern minimalist architecture office, floor-to-ceiling windows, scandinavian interior design, natural wood textures, plants, professional workspace",
        assetUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
        status: 'ready'
      }}
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 2, sourceHandle: 'text-out', targetHandle: 'content-in' },
      { source: 1, target: 3, sourceHandle: 'text-out', targetHandle: 'prompt-in' }
    ]
  },
  {
    id: 'seo_factory',
    title: 'SEO Article Factory',
    description: 'Orquestación de contenido rankeable: Keyword → Intent → Redacción NLP. PLANTILLA CON EJEMPLOS EJECUTADOS.',
    category: 'SEO',
    icon: FileText,
    color: '#64748b',
    tags: ['SEO', 'Content', 'NLP', 'Pre-ejecutado'],
    nodes: [
      { type: 'textInput', data: {
        title: "KEYWORD",
        value: "Cómo invertir en bienes raíces con poco dinero 2025"
      }},
      { type: 'characterBreakdown', data: {
        title: 'SEARCH INTENT',
        description: "Intención: Informativa + Comercial\n\nEl usuario busca:\n- Aprender estrategias de inversión\n- Conocer opciones con bajo capital\n- Entender riesgos y oportunidades\n- Encontrar plataformas confiables\n\nSearch Volume: 14,800/mes\nKeyword Difficulty: 42/100\nCPC: $2.30",
        status: 'ready'
      }},
      { type: 'llmNode', data: {
        title: 'GPT-4O',
        systemPrompt: "Redacta un artículo optimizado para SEO usando entidades NLP y estructura H1-H3.",
        output: "# Cómo Invertir en Bienes Raíces con Poco Dinero: Guía Definitiva 2025\n\n## Introducción\nInvertir en bienes raíces ya no requiere capital millonario. Con tan solo $500 y las estrategias correctas, puedes empezar tu portafolio inmobiliario en 2025.\n\n## 1. Crowdfunding Inmobiliario (Mínimo $100)\n\nPlataformas como RealtyMogul y Fundrise permiten invertir fracciones de propiedades comerciales. Rendimientos promedio: 8-12% anual.\n\n✓ Acceso a propiedades institucionales\n✓ Diversificación sin grandes capitales\n✓ Gestión profesional incluida\n\n## 2. REITs (Fondos de Inversión Inmobiliaria)\n\nLos REITs cotizados en bolsa ofrecen liquidez diaria y dividendos mensuales. Ejemplos: Vanguard Real Estate ETF (VNQ) con yield del 4.2%.\n\n## 3. House Hacking\n\nCompra una casa multifamiliar, vive en una unidad y alquila las demás. Estrategia que genera ingresos pasivos mientras reduces tus costos de vivienda.\n\n## Conclusión\nLa barrera de entrada a la inversión inmobiliaria nunca fue tan baja. Empieza con lo que tienes y escala progresivamente.",
        status: 'ready'
      }},
      { type: 'exportNode', data: {
        title: 'DRAFT EXPORT',
        content: 'article-ready-for-publish.md',
        status: 'ready'
      }}
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 2, sourceHandle: 'context-out', targetHandle: 'context-in' },
      { source: 2, target: 3, sourceHandle: 'text-out', targetHandle: 'content-in' }
    ]
  },
  {
    id: 'brand_dna',
    title: 'Brand DNA Kit',
    description: 'Evolución de identidad: Valores → Concepto Visual → Identity Board. PLANTILLA CON EJEMPLOS EJECUTADOS.',
    category: 'Marca',
    icon: Palette,
    color: '#f59e0b',
    tags: ['Branding', 'Identity', 'Design', 'Pre-ejecutado'],
    nodes: [
      { type: 'textInput', data: {
        title: "VALORES",
        value: "Exploración, coraje, precisión, minimalismo tecnológico.\nIndustria: SaaS B2B para startups.\nTarget: Founders técnicos y CTOs.\nPersonalidad: Innovador pero confiable."
      }},
      { type: 'llmNode', data: {
        title: 'GEMINI 1.5 PRO',
        systemPrompt: "Define el manual de identidad verbal: Misión, Visión y Tono.",
        output: "## BRAND VOICE MANUAL\n\n### MISIÓN\nEmpoderar a founders técnicos con herramientas que exploran lo imposible, ejecutando con precisión milimétrica.\n\n### VISIÓN\nSer el estándar de oro en infraestructura tecnológica para startups en crecimiento exponencial.\n\n### TONO DE VOZ\n\n**Precisión técnica + Calidez humana**\n\n✓ Usamos analogías técnicas accesibles\n✓ Evitamos jerga corporativa vacía\n✓ Celebramos el 'aha moment' del usuario\n✓ Comunicamos complejidad con claridad\n\n**Ejemplo de messaging:**\n❌ 'Nuestra plataforma escala horizontalmente'\n✅ 'Tu infra crece contigo, sin dolor de cabeza'\n\n### PALETA VERBAL\nExplorar → Descubrir\nCoraje → Audacia calculada\nPrecisión → Ejecución impecable\nTecnología → Herramientas humanas",
        status: 'ready'
      }},
      { type: 'modelView', data: {
        title: 'FLUX DEV',
        prompt: "Tech startup logo, minimalist geometric design, exploration compass motif, precision lines, dark navy and amber colors, vector style, professional",
        assetUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
        status: 'ready'
      }},
      { type: 'layoutBuilder', data: {
        title: 'BRAND BOARD',
        layout: {
          elements: ['Logo variations', 'Color palette', 'Typography', 'Iconography', 'Brand voice examples', 'Do/Don\'t guidelines'],
          mood: 'tech-minimalist',
          primaryColors: ['#1e293b', '#f59e0b', '#64748b']
        },
        status: 'ready'
      }}
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 2, sourceHandle: 'text-out', targetHandle: 'prompt-in' },
      { source: 1, target: 3, sourceHandle: 'text-out', targetHandle: 'content-in' }
    ]
  },
  // Nueva plantilla: Email Marketing Sequence
  {
    id: 'email_sequence',
    title: 'Email Nurture Sequence',
    description: 'Secuencia de emails automatizada: Lead Magnet → Welcome → Value → Offer. PLANTILLA CON EJEMPLOS EJECUTADOS.',
    category: 'Email',
    icon: Mail,
    color: '#ec4899',
    tags: ['Email', 'Automation', 'Nurture', 'Pre-ejecutado'],
    nodes: [
      { type: 'textInput', data: {
        title: "LEAD MAGNET",
        value: "Producto: Curso de Productivity para Freelancers\nLead Magnet: Template pack 'Productividad Extrema'\nTarget: Freelancers overwhelmados"
      }},
      { type: 'llmNode', data: {
        title: 'CLAUDE EMAILS',
        systemPrompt: "Crea una secuencia de 5 emails de nurture: Welcome, Value 1, Value 2, Soft Pitch, Hard Pitch.",
        output: "**SECUENCIA EMAIL NURTURE**\n\nEMAIL 1 - WELCOME (Inmediato):\nAsunto: 'Aquí está tu pack de productividad [Descarga]'\n\n¡Hola! 👋\n\nGracias por descargar el Productivity Template Pack.\n\nEn los próximos 5 días te enviaré las estrategias que usan los freelancers de 6 figuras para eliminar el overwhelm.\n\n[LINK DESCARGA]\n\nSaludos,\nTu Equipo\n\n---\n\nEMAIL 2 - VALUE (Día 2):\nAsunto: 'El sistema que me salvó de quemarme'\n\nHace 2 años estaba a nada de abandonar el freelance...\n\n[Historia personal + sistema Time Blocking]\n\n---\n\nEMAIL 3 - VALUE (Día 4):\nAsunto: 'Por qué tu to-do list te está saboteando'\n\nLas listas tradicionales son trampas...\n\n[Sistema Eisenhower Matrix + ejemplo]\n\n---\n\nEMAIL 4 - SOFT PITCH (Día 6):\nAsunto: '¿Listo para el siguiente nivel?'\n\nSi te funcionaron estos templates, imagina el curso completo...\n\n[Introducción suave al producto]\n\n---\n\nEMAIL 5 - HARD PITCH (Día 8):\nAsunto: '⏰ Cierra mañana: 40% OFF Productivity Masterclass'\n\nÚltimas 24 horas para unirte a 2,000+ freelancers transformados...\n\n[CTA claro + urgency + bonuses]",
        status: 'ready'
      }},
      { type: 'captionNode', data: {
        title: "SUBJECT LINE VARIATIONS",
        network: "any",
        tone: "Profesional 💼",
        caption: "Subject Line A/B Testing:\n\nA: 'Tu pack está listo 📦'\nB: 'Descarga: Plantillas de productividad'\n\nA/B: 'El error #1 de freelancers'\nB: 'Por qué tu to-do list falla'\n\nA: '40% OFF termina mañana'\nB: 'Últimas plazas disponibles'",
        status: 'ready'
      }},
      { type: 'exportNode', data: {
        title: 'SEQUENCE EXPORT',
        content: 'email-nurture-sequence.html',
        status: 'ready'
      }}
    ],
    edges: [
      { source: 0, target: 1, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 2, sourceHandle: 'text-out', targetHandle: 'text-in' },
      { source: 1, target: 3, sourceHandle: 'text-out', targetHandle: 'content-in' }
    ]
  }
];

