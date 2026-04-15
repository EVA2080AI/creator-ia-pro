// Enhanced node connection system with better type safety and UX
export type DataType = 'text' | 'image' | 'video' | 'layout' | 'campaign' | 'context' | 'json' | 'any';

export const DATA_TYPE_COLORS: Record<DataType, string> = {
  text:     '#fbbf24',     // amber-400
  image:    '#a855f7',     // purple-500
  video:    '#f472b6',     // pink-400
  layout:   '#60a5fa',     // blue-400
  campaign: '#34d399',     // emerald-400
  context:  '#fb923c',     // orange-400
  json:     '#22d3ee',     // cyan-400
  any:      '#94a3b8',     // slate-400
};

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  text:     'Texto',
  image:    'Imagen',
  video:    'Video',
  layout:   'Layout',
  campaign: 'Campaña',
  context:  'Contexto',
  json:     'JSON',
  any:      'Cualquiera',
};

export interface HandleDef {
  id: string;
  dataType: DataType;
  label: string;
  description?: string;
  required?: boolean;
}

export interface NodeConnectionDef {
  label: string;
  emoji: string;
  description: string;
  inputHandles: HandleDef[];
  outputHandles: HandleDef[];
  compatibleTargets: string[];
  category: 'input' | 'process' | 'output' | 'bridge';
  color: string;
}

export interface NodeMeta {
  label: string;
  emoji: string;
  description: string;
  inputHandles: HandleDef[];
  outputHandles: HandleDef[];
  compatibleTargets: string[];
  category: 'input' | 'process' | 'output' | 'bridge';
  color: string;
}

// Enhanced node definitions with better organization
export const NODE_META: Record<string, NodeMeta> = {
  // Input nodes - sources of data
  textInput: {
    label: 'Texto',
    emoji: '📝',
    description: 'Entrada de texto libre para usar en otros nodos',
    inputHandles: [],
    outputHandles: [
      { id: 'text-out', dataType: 'text', label: 'Texto', description: 'Texto de entrada' }
    ],
    compatibleTargets: ['llmNode', 'modelView', 'videoModel', 'captionNode', 'promptBuilder'],
    category: 'input',
    color: '#fbbf24',
  },
  characterBreakdown: {
    label: 'Personaje',
    emoji: '🧬',
    description: 'Define la identidad del personaje o marca con atributos',
    inputHandles: [
      { id: 'text-in', dataType: 'text', label: 'Texto', required: false }
    ],
    outputHandles: [
      { id: 'context-out', dataType: 'context', label: 'Contexto', description: 'Contexto del personaje' }
    ],
    compatibleTargets: ['modelView', 'videoModel', 'llmNode', 'captionNode'],
    category: 'input',
    color: '#fb923c',
  },
  promptBuilder: {
    label: 'Prompt Builder',
    emoji: '🔧',
    description: 'Constructor de prompts con variables y plantillas',
    inputHandles: [
      { id: 'text-in', dataType: 'text', label: 'Texto', required: false }
    ],
    outputHandles: [
      { id: 'text-out', dataType: 'text', label: 'Prompt', description: 'Prompt compilado' }
    ],
    compatibleTargets: ['llmNode', 'modelView', 'videoModel', 'captionNode'],
    category: 'input',
    color: '#94a3b8',
  },

  // Process nodes - transform data
  llmNode: {
    label: 'LLM',
    emoji: '🤖',
    description: 'Genera texto con modelos de lenguaje (Claude, GPT, etc.)',
    inputHandles: [
      { id: 'text-in', dataType: 'text', label: 'Prompt', description: 'Texto de entrada o instrucción', required: false },
      { id: 'context-in', dataType: 'context', label: 'Contexto', description: 'Contexto adicional', required: false },
    ],
    outputHandles: [
      { id: 'text-out', dataType: 'text', label: 'Texto generado', description: 'Respuesta del modelo' }
    ],
    compatibleTargets: ['modelView', 'videoModel', 'captionNode', 'campaignManager', 'layoutBuilder', 'exportNode'],
    category: 'process',
    color: '#3b82f6',
  },
  modelView: {
    label: 'Imagen IA',
    emoji: '🖼️',
    description: 'Genera imágenes con modelos de difusión (DALL-E, FLUX, etc.)',
    inputHandles: [
      { id: 'prompt-in', dataType: 'text', label: 'Prompt', description: 'Descripción de la imagen', required: false },
      { id: 'context-in', dataType: 'context', label: 'Contexto', description: 'Contexto visual', required: false },
    ],
    outputHandles: [
      { id: 'image-out', dataType: 'image', label: 'Imagen', description: 'Imagen generada' }
    ],
    compatibleTargets: ['videoModel', 'campaignManager', 'exportNode', 'layoutBuilder'],
    category: 'process',
    color: '#a855f7',
  },
  videoModel: {
    label: 'Video IA',
    emoji: '🎬',
    description: 'Genera videos animados a partir de imágenes o prompts',
    inputHandles: [
      { id: 'any-in', dataType: 'any', label: 'Entrada', description: 'Cualquier entrada', required: false },
    ],
    outputHandles: [
      { id: 'video-out', dataType: 'video', label: 'Video', description: 'Video generado' }
    ],
    compatibleTargets: ['campaignManager', 'exportNode'],
    category: 'process',
    color: '#f472b6',
  },
  captionNode: {
    label: 'Caption IA',
    emoji: '💬',
    description: 'Genera captions y copy para redes sociales',
    inputHandles: [
      { id: 'text-in', dataType: 'text', label: 'Contexto', description: 'Contexto o tema', required: false },
      { id: 'image-in', dataType: 'image', label: 'Imagen', description: 'Imagen de referencia', required: false },
    ],
    outputHandles: [
      { id: 'text-out', dataType: 'text', label: 'Caption', description: 'Texto para redes' }
    ],
    compatibleTargets: ['campaignManager', 'exportNode', 'llmNode'],
    category: 'process',
    color: '#fbbf24',
  },
  layoutBuilder: {
    label: 'Layout Builder',
    emoji: '🏗️',
    description: 'Estructura visual de la campaña con componentes',
    inputHandles: [
      { id: 'any-in', dataType: 'any', label: 'Contenido', description: 'Cualquier entrada', required: false },
    ],
    outputHandles: [
      { id: 'ui-out', dataType: 'layout', label: 'UI', description: 'Layout generado' }
    ],
    compatibleTargets: ['campaignManager', 'exportNode'],
    category: 'process',
    color: '#60a5fa',
  },

  // Bridge nodes - connect to external systems
  antigravityBridge: {
    label: 'Antigravity Bridge',
    emoji: '🌉',
    description: 'Conecta con Antigravity para publicación multiplataforma',
    inputHandles: [
      { id: 'any-in', dataType: 'any', label: 'Contenido', description: 'Lo que quieres publicar', required: true },
    ],
    outputHandles: [
      { id: 'any-out', dataType: 'any', label: 'Salida', description: 'Resultado' }
    ],
    compatibleTargets: ['exportNode'],
    category: 'bridge',
    color: '#22d3ee',
  },

  // Output nodes - final destinations
  campaignManager: {
    label: 'Campaign Manager',
    emoji: '🚀',
    description: 'Distribuye el contenido a plataformas y calendariza',
    inputHandles: [
      { id: 'any-in', dataType: 'any', label: 'Contenido', description: 'Assets para publicar', required: true },
    ],
    outputHandles: [
      { id: 'any-out', dataType: 'any', label: 'Salida', description: 'Resultado' }
    ],
    compatibleTargets: ['exportNode'],
    category: 'output',
    color: '#34d399',
  },
  exportNode: {
    label: 'Exportar',
    emoji: '📤',
    description: 'Exporta el contenido final en múltiples formatos',
    inputHandles: [
      { id: 'content-in', dataType: 'any', label: 'Contenido', description: 'Lo que quieres exportar', required: true },
    ],
    outputHandles: [],
    compatibleTargets: [],
    category: 'output',
    color: '#10b981',
  },
};

// Helper functions for connection validation
export function canConnectNodes(sourceType: string, targetType: string): boolean {
  const sourceMeta = NODE_META[sourceType];
  const targetMeta = NODE_META[targetType];

  if (!sourceMeta || !targetMeta) return false;

  // Check if target is in compatible targets
  return sourceMeta.compatibleTargets.includes(targetType);
}

export function getCompatibleSourceTypes(targetType: string): string[] {
  return Object.entries(NODE_META)
    .filter(([_, meta]) => meta.compatibleTargets.includes(targetType))
    .map(([type, _]) => type);
}

export function getNodesByCategory(category: NodeMeta['category']): [string, NodeMeta][] {
  return Object.entries(NODE_META).filter(([_, meta]) => meta.category === category);
}

// backward-compat alias
export const NODE_CONNECTIONS = NODE_META;
