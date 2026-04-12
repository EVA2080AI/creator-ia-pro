export const MODELS = [
  { id: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',    badge: '🚀 Flash',         description: 'Lo mejor para: Velocidad extrema y agentes interactivos.', vision: true,  premium: false },
  { id: 'google/gemini-2.5-pro-preview-03-25',  label: 'Gemini 2.5 Pro',      badge: '🧠 Pro',           description: 'Lo mejor para: Razonamiento avanzado y contextos extensos.', vision: true,  premium: true  },
  { id: 'anthropic/claude-3.5-sonnet',           label: 'Claude 3.5 Sonnet',   badge: '⚡ Sonnet',        description: 'Lo mejor para: Codificación avanzada y arquitectura limpia.', vision: true,  premium: true  },
  { id: 'openai/gpt-4o',                         label: 'GPT-4o',               badge: '🔥 Flagship',      description: 'Lo mejor para: Precisión profesional y lógica compleja.', vision: true,  premium: true  },
  { id: 'deepseek/deepseek-chat',                label: 'DeepSeek V3',          badge: '💰 Balanced',      description: 'Lo mejor para: Tareas generales con bajo coste.', vision: false, premium: false },
  { id: 'deepseek/deepseek-r1',                  label: 'DeepSeek R1',          badge: '💡 Thinking',      description: 'Lo mejor para: Resolución de problemas matemáticos/algorítmicos.', vision: false, premium: true  },
  { id: 'mistralai/mistral-large',               label: 'Mistral Large',        badge: '🇪🇺 Euro Spec',     description: 'Lo mejor para: Privacidad y cumplimiento soberano (EU).', vision: false, premium: true  },
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
