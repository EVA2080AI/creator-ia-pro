// ── Model catalog ─────────────────────────────────────────────────────────────
// First model = DEFAULT (always free, no OpenRouter cost)
export const MODELS = [
  // ── FREE TIER ── (no OpenRouter cost)
  {
    id: 'google/gemini-2.0-flash-001',
    label: 'Gemini 2.0 Flash',
    badge: 'FREE',
    provider: 'Google',
    description: 'Velocidad extrema. Ideal para generación de código y agentes interactivos.',
    vision: true,
    premium: false,
    free: true,
    inputCost: 0,
    outputCost: 0,
    context: '1M tokens',
  },
  {
    id: 'google/gemini-2.0-flash-lite-001',
    label: 'Gemini Flash Lite',
    badge: 'FREE',
    provider: 'Google',
    description: 'Versión ultra-ligera. Perfecta para respuestas cortas y ediciones puntuales.',
    vision: true,
    premium: false,
    free: true,
    inputCost: 0,
    outputCost: 0,
    context: '1M tokens',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B',
    badge: 'FREE',
    provider: 'Meta',
    description: 'Open-source de alto rendimiento. Sin costes, máxima privacidad.',
    vision: false,
    premium: false,
    free: true,
    inputCost: 0,
    outputCost: 0,
    context: '128K tokens',
  },
  {
    id: 'microsoft/phi-4',
    label: 'Phi-4',
    badge: 'FREE',
    provider: 'Microsoft',
    description: 'Modelo compacto pero potente. Ideal para razonamiento y código.',
    vision: false,
    premium: false,
    free: true,
    inputCost: 0,
    outputCost: 0,
    context: '16K tokens',
  },
  // ── PAID TIER ──
  {
    id: 'google/gemini-2.5-pro-preview-03-25',
    label: 'Gemini 2.5 Pro',
    badge: 'PRO',
    provider: 'Google',
    description: 'Razonamiento avanzado, contextos extensos y code generation de elite.',
    vision: true,
    premium: true,
    free: false,
    inputCost: 1.25,
    outputCost: 10,
    context: '1M tokens',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    badge: 'PRO',
    provider: 'Anthropic',
    description: 'El mejor para arquitectura limpia, refactoring y código production-ready.',
    vision: true,
    premium: true,
    free: false,
    inputCost: 3,
    outputCost: 15,
    context: '200K tokens',
  },
  {
    id: 'anthropic/claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    badge: 'PRO',
    provider: 'Anthropic',
    description: 'Última generación de Claude. Código complejo, largo contexto y razonamiento.',
    vision: true,
    premium: true,
    free: false,
    inputCost: 3,
    outputCost: 15,
    context: '200K tokens',
  },
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o',
    badge: 'PRO',
    provider: 'OpenAI',
    description: 'Flagship de OpenAI. Visión, código y precisión profesional.',
    vision: true,
    premium: true,
    free: false,
    inputCost: 5,
    outputCost: 15,
    context: '128K tokens',
  },
  {
    id: 'openai/o4-mini',
    label: 'o4 Mini',
    badge: 'PRO',
    provider: 'OpenAI',
    description: 'Razonamiento profundo a precio reducido. Excelente para algoritmos y lógica.',
    vision: true,
    premium: true,
    free: false,
    inputCost: 1.1,
    outputCost: 4.4,
    context: '128K tokens',
  },
  {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek V3',
    badge: 'ECONOMY',
    provider: 'DeepSeek',
    description: 'Bajo coste con alta calidad. Balance ideal costo/rendimiento.',
    vision: false,
    premium: false,
    free: false,
    inputCost: 0.27,
    outputCost: 1.1,
    context: '64K tokens',
  },
  {
    id: 'deepseek/deepseek-r1',
    label: 'DeepSeek R1',
    badge: 'ECONOMY',
    provider: 'DeepSeek',
    description: 'Razonamiento tipo o1. Problemas matemáticos y algorítmicos complejos.',
    vision: false,
    premium: true,
    free: false,
    inputCost: 0.55,
    outputCost: 2.19,
    context: '64K tokens',
  },
];

export const CODE_VERBS = [
  'crea','genera','construye','haz','has','diseña','implementa','desarrolla','arma','quiero','necesito',
  'build','create','make','generate','design','develop','write','code','programa',
  'clona','replica','copia','clone','replicate'
];

export const CODE_NOUNS = [
  'página','pagina','web','app','aplicación','aplicacion','dashboard','landing',
  'formulario','componente','component','api','backend','frontend','website','sitio','site',
  'portfolio','portafolio','calculator','calculadora','todo','ecommerce','blog','navbar',
  'footer','hero','modal','sidebar','tabla','chart','gráfica','grafica','system','sistema',
  'multi-page','multipágina','multipagina','prototipo','prototype','sitemap','rutas','routes'
];

export const GREETINGS = [
  'hola', 'hi', 'hello', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hey', 'buenas'
];

export const FILE_MGMT_KEYWORDS = [
  'mueve', 'renombra', 'pon', 'usa', 'set', 'move', 'rename', 'index', 'archivo', 'carpeta', 'folder', 
  'crea el archivo', 'sustituye', 'pégalo', 'pegalo'
];

export const VISION_KEYWORDS = [
  'foto', 'imagen', 'imágen', 'referencia', 'captura', 'screenshot', 'clona', 'replica', 'copia', 'clone', 'replicate'
];
