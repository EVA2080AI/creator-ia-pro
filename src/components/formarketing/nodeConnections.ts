export type DataType = 'text' | 'image' | 'video' | 'layout' | 'campaign' | 'context' | 'json' | 'any';

export const DATA_TYPE_COLORS: Record<string, string> = {
  text:     '#facc15',
  image:    '#a78bfa',
  video:    '#f472b6',
  layout:   '#60a5fa',
  campaign: '#34d399',
  context:  '#fb923c',
  json:     '#60a5fa',
  any:      '#94a3b8',
};

interface HandleDef {
  id: string;
  dataType: DataType;
  label: string;
}

interface NodeConnectionDef {
  label: string;
  emoji: string;
  description: string;
  inputHandles: HandleDef[];
  outputHandles: HandleDef[];
  compatibleTargets: string[];
}

export interface NodeMeta {
  label: string;
  emoji: string;
  description: string;
  inputHandles: HandleDef[];
  outputHandles: HandleDef[];
  compatibleTargets: string[];
}

export const NODE_META: Record<string, NodeMeta> = {
  characterBreakdown: {
    label: 'Personaje',
    emoji: '🧬',
    description: 'Define la identidad del personaje / marca',
    inputHandles: [],
    outputHandles: [{ id: 'any-out', dataType: 'text' as DataType, label: 'Contexto' }],
    compatibleTargets: ['modelView', 'videoModel', 'llmNode', 'captionNode', 'promptBuilder'],
  },
  textInput: {
    label: 'Texto',
    emoji: '📝',
    description: 'Entrada de texto libre',
    inputHandles: [],
    outputHandles: [{ id: 'text-out', dataType: 'text' as DataType, label: 'Texto' }],
    compatibleTargets: ['llmNode', 'modelView', 'videoModel', 'captionNode', 'promptBuilder', 'campaignManager'],
  },
  llmNode: {
    label: 'LLM',
    emoji: '🤖',
    description: 'Genera texto con IA',
    inputHandles: [{ id: 'text-in', dataType: 'text' as DataType, label: 'Contexto' }],
    outputHandles: [{ id: 'text-out', dataType: 'text' as DataType, label: 'Texto generado' }],
    compatibleTargets: ['modelView', 'videoModel', 'captionNode', 'campaignManager', 'layoutBuilder'],
  },
  modelView: {
    label: 'Imagen IA',
    emoji: '🖼️',
    description: 'Genera imágenes con modelos de difusión',
    inputHandles: [{ id: 'any-in', dataType: 'any' as DataType, label: 'Contexto' }],
    outputHandles: [{ id: 'image-out', dataType: 'image' as DataType, label: 'Imagen' }],
    compatibleTargets: ['videoModel', 'campaignManager', 'exportNode'],
  },
  videoModel: {
    label: 'Video IA',
    emoji: '🎬',
    description: 'Genera videos con IA',
    inputHandles: [
      { id: 'any-in', dataType: 'any' as DataType, label: 'Contexto' },
      { id: 'image-in', dataType: 'image' as DataType, label: 'Imagen base' },
    ],
    outputHandles: [{ id: 'video-out', dataType: 'video' as DataType, label: 'Video' }],
    compatibleTargets: ['campaignManager', 'exportNode'],
  },
  layoutBuilder: {
    label: 'Layout Builder',
    emoji: '🏗️',
    description: 'Estructura visual de la campaña',
    inputHandles: [{ id: 'any-in', dataType: 'any' as DataType, label: 'Contenido' }],
    outputHandles: [{ id: 'ui-out', dataType: 'json' as DataType, label: 'Layout' }],
    compatibleTargets: ['campaignManager', 'exportNode'],
  },
  campaignManager: {
    label: 'Campaign Manager',
    emoji: '🚀',
    description: 'Distribuye el contenido a plataformas',
    inputHandles: [{ id: 'any-in', dataType: 'any' as DataType, label: 'Contenido' }],
    outputHandles: [],
    compatibleTargets: ['exportNode'],
  },
  captionNode: {
    label: 'Caption IA',
    emoji: '💬',
    description: 'Genera captions para redes sociales',
    inputHandles: [{ id: 'text-in', dataType: 'text' as DataType, label: 'Contexto' }],
    outputHandles: [{ id: 'text-out', dataType: 'text' as DataType, label: 'Caption' }],
    compatibleTargets: ['exportNode', 'campaignManager'],
  },
  promptBuilder: {
    label: 'Prompt Builder',
    emoji: '🔧',
    description: 'Constructor de prompts con variables',
    inputHandles: [],
    outputHandles: [{ id: 'text-out', dataType: 'text' as DataType, label: 'Prompt compilado' }],
    compatibleTargets: ['llmNode', 'modelView', 'videoModel', 'captionNode', 'characterBreakdown'],
  },
};

// backward-compat alias
export const NODE_CONNECTIONS = NODE_META;
