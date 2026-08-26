// Catálogo de modelos — derivado de src/lib/ai/models.ts (fuente única,
// verificada en vivo contra OpenRouter). Antes había un array separado aquí
// con 5 IDs de modelo que ya no existen en OpenRouter (ver
// docs/INVENTARIO_FUNCIONALIDADES.md G-11/T-17).
import { CHAT_MODELS } from '@/lib/ai/models';

// ── Model catalog ─────────────────────────────────────────────────────────────
// Primer modelo = DEFAULT (siempre gratis, sin coste de OpenRouter)
export const MODELS = CHAT_MODELS.map((m) => ({
  id: m.id,
  label: m.label,
  badge: m.category === 'eco' ? 'FREE' : m.category.toUpperCase(),
  provider: m.provider,
  description: m.description,
  vision: m.vision,
  premium: m.category !== 'eco',
  free: m.free,
  credits: m.credits,
  context: m.context,
}));


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
