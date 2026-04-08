// ─── Model Categories & Multipliers ──────────────────────────────────────────
// Credits consumed = base_tokens / 100 * multiplier
// ECO: 1x  |  PRO: 5x  |  ULTRA: 20x

export type ModelCategory = 'ECO' | 'PRO' | 'ULTRA';
export type PlanTier = 'free' | 'creador' | 'pro' | 'agencia' | 'pyme' | 'pymes';

export interface ModelDef {
  id: string;               // internal ID used in UI
  name: string;             // display name
  openrouter: string;       // OpenRouter model ID
  category: ModelCategory;
  context: string;          // context window display
  badge: string;            // short description badge
  color: string;            // accent color
  cost: number;             // flat credits per message (current system)
  multiplier: number;       // token multiplier (new system)
}

export const CATEGORY_CONFIG: Record<ModelCategory, {
  label: string;
  multiplier: number;
  color: string;
  bgColor: string;
  bolts: number;            // number of lightning bolts to show
  minTier: PlanTier;
  description: string;
}> = {
  ECO: {
    label: 'ECO',
    multiplier: 1,
    color: '#8AB4F8',
    bgColor: 'rgba(138,180,248,0.1)',
    bolts: 1,
    minTier: 'creador',
    description: 'Rápido y eficiente',
  },
  PRO: {
    label: 'PRO',
    multiplier: 5,
    color: '#A855F7',
    bgColor: 'rgba(168,85,247,0.1)',
    bolts: 3,
    minTier: 'pro',
    description: 'Alta calidad · Requiere Pro',
  },
  ULTRA: {
    label: 'ULTRA',
    multiplier: 20,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.1)',
    bolts: 5,
    minTier: 'pyme',
    description: 'Máximo poder · Requiere Pyme',
  },
};

export const PLAN_TIER_ORDER: PlanTier[] = ['free', 'creador', 'pro', 'agencia', 'pyme'];

export function canAccessModel(userTier: string, modelCategory: ModelCategory): boolean {
  const tierOrder = PLAN_TIER_ORDER;
  const minTier = CATEGORY_CONFIG[modelCategory].minTier;
  // Normalize tier aliases: pymes→pyme, starter→creador, creator→pro
  const TIER_ALIASES: Record<string, PlanTier> = { pymes: 'pyme', starter: 'creador', creator: 'pro', agency: 'agencia' };
  const normalized = TIER_ALIASES[userTier?.toLowerCase()] || (userTier?.toLowerCase() as PlanTier) || 'free';
  const userIdx = tierOrder.indexOf(normalized);
  const minIdx = tierOrder.indexOf(minTier);
  return userIdx >= minIdx;
}

// ─── Model Definitions ────────────────────────────────────────────────────────
export const CHAT_MODELS: ModelDef[] = [
  // ── ECO (1x multiplier) ────────────────────────────────────────────────────
  {
    id: 'gemini-flash',
    name: 'Gemini Flash 2.0',
    openrouter: 'google/gemini-2.0-flash-001',
    category: 'ECO',
    context: '1M tokens',
    badge: 'Rápido',
    color: '#00C2FF',
    cost: 1,
    multiplier: 1,
  },
  {
    id: 'llama-3-8b',
    name: 'Llama 3.1 8B',
    openrouter: 'meta-llama/llama-3.1-8b-instruct',
    category: 'ECO',
    context: '128K tokens',
    badge: 'Open Source',
    color: '#8AB4F8',
    cost: 1,
    multiplier: 1,
  },
  {
    id: 'mistral-small',
    name: 'Mistral Small',
    openrouter: 'mistralai/mistral-small-3.1-24b-instruct',
    category: 'ECO',
    context: '32K tokens',
    badge: 'Privacidad',
    color: '#FF6B6B',
    cost: 1,
    multiplier: 1,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    openrouter: 'deepseek/deepseek-chat-v3-0324',
    category: 'ECO',
    context: '64K tokens',
    badge: 'Código',
    color: '#34D399',
    cost: 1,
    multiplier: 1,
  },
  // ── PRO (5x multiplier) ────────────────────────────────────────────────────
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4.6',
    openrouter: 'anthropic/claude-sonnet-4-6',
    category: 'PRO',
    context: '200K tokens',
    badge: 'Creativo',
    color: '#A855F7',
    cost: 5,
    multiplier: 5,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    openrouter: 'openai/gpt-4o',
    category: 'PRO',
    context: '128K tokens',
    badge: 'Multimodal',
    color: '#10B981',
    cost: 5,
    multiplier: 5,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro 1.5',
    openrouter: 'google/gemini-pro-1.5',
    category: 'PRO',
    context: '2M tokens',
    badge: 'Análisis',
    color: '#00E5A0',
    cost: 5,
    multiplier: 5,
  },
  // ── ULTRA (20x multiplier) ─────────────────────────────────────────────────
  {
    id: 'claude-opus',
    name: 'Claude 3 Opus',
    openrouter: 'anthropic/claude-3-opus',
    category: 'ULTRA',
    context: '200K tokens',
    badge: 'Máximo',
    color: '#F59E0B',
    cost: 20,
    multiplier: 20,
  },
  {
    id: 'gpt-4o-ultra',
    name: 'GPT-4o Ultra',
    openrouter: 'openai/gpt-4o',
    category: 'ULTRA',
    context: '128K tokens',
    badge: 'Power',
    color: '#EC4899',
    cost: 20,
    multiplier: 20,
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    openrouter: 'mistralai/mistral-large',
    category: 'ULTRA',
    context: '128K tokens',
    badge: 'EU Privacy',
    color: '#FF9500',
    cost: 20,
    multiplier: 20,
  },
];

// Legacy mapping for backwards compatibility with ai-service.ts
export const LEGACY_OPENROUTER_MAP: Record<string, string> = {
  'gemini-3-flash':      'google/gemini-2.0-flash-001',
  'gemini-3.1-pro-low':  'google/gemini-pro-1.5',
  'gemini-3.1-pro-high': 'google/gemini-pro-1.5',
  'claude-3.5-sonnet':   'anthropic/claude-sonnet-4-6',
  'claude-3-opus':       'anthropic/claude-opus-4-6',
  'gpt-oss-120b':        'meta-llama/llama-4-maverick',
  'mistral-large':       'mistralai/mistral-large',
  'mistral-small':       'mistralai/mistral-small-3.1-24b-instruct',
  'deepseek-chat':       'deepseek/deepseek-chat-v3-0324',
};
