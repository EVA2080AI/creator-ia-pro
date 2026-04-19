# Plan de Migración a IA Open Source/Gratuita
## Creator IA Pro - Genesis & Canvas

---

## Resumen Ejecutivo

Migrar de un modelo **100% OpenRouter (pago)** a un modelo **Open Source por defecto** con OpenRouter solo para usuarios Pro que explicitamente elijan modelos premium.

---

## Arquitectura de Proveedores

### Tier 1: Open Source/Gratuito (Default)
| Proveedor | Modelos | Ventajas | Limitaciones |
|-----------|---------|----------|----------------|
| **Groq** | Llama 3, Mixtral, Gemma | Ultra rápido (800 tok/s), tier gratuito generoso | Rate limit en free tier |
| **Hugging Face** | Miles de modelos open | Gratuito, variedad enorme | Más lento, rate limits estrictos |
| **Ollama** (Local) | Llama 3, Mistral, etc | 100% privado, sin costos | Requiere instalación local |

### Tier 2: Freemium (Fallback)
| Proveedor | Modelos | Límite Gratuito |
|-----------|---------|-----------------|
| **Google Gemini** | Gemini 1.5 Flash/Pro | 60 req/min, 1000 req/día |
| **Mistral AI** | Mistral 7B, Mixtral | Tier gratuito disponible |
| **Cohere** | Command, Aya | 1000 calls/mes trial |
| **OpenRouter** | Modelos `:free` | Limitado pero gratuito |

### Tier 3: Pro/Pago (Opt-in)
| Proveedor | Modelos | Uso |
|-----------|---------|-----|
| **OpenRouter** | GPT-4, Claude, Gemini Pro | Solo si usuario explícitamente selecciona "Pro" |
| **Anthropic Direct** | Claude 3.5 Sonnet | API key propia |
| **OpenAI Direct** | GPT-4, DALL-E 3 | API key propia |

---

## Plan de Implementación

### Fase 1: Infraestructura Multi-Provider (Semana 1)

#### 1.1 Nuevo Edge Function: `open-source-proxy`
```typescript
// Multi-provider con fallback chain
const PROVIDER_CHAIN = [
  { name: 'groq', priority: 1, models: ['llama3-70b', 'mixtral-8x7b'] },
  { name: 'huggingface', priority: 2, models: ['mistral-7b', 'llama2-13b'] },
  { name: 'gemini', priority: 3, models: ['gemini-1.5-flash'] },
  { name: 'openrouter-free', priority: 4, models: ['*:free'] },
];
```

#### 1.2 Configuración de Variables de Entorno
```bash
# Tier 1: Open Source
GROQ_API_KEY=gsk_xxx
HUGGINGFACE_API_KEY=hf_xxx
OLLAMA_ENABLED=true

# Tier 2: Freemium
GEMINI_API_KEY=AIxxx
MISTRAL_API_KEY=xxx
COHERE_API_KEY=xxx

# Tier 3: Pro (existente)
OPENROUTER_API_KEY=sk-or-xxx
```

#### 1.3 User Preference: Provider Selection
```typescript
interface AIProviderPreference {
  defaultTier: 'open-source' | 'freemium' | 'pro';
  preferredProvider?: string;
  allowFallback: boolean;
  proModelsExplicit: boolean; // Nuevo: solo true si usuario activamente selecciona Pro
}
```

### Fase 2: Modificación de Genesis IDE (Semana 2)

#### 2.1 Selector de Modelo Rediseñado
```tsx
<ModelSelector>
  {/* Por defecto - Open Source */}
  <ModelGroup label="Open Source (Gratuito)" defaultExpanded>
    <ModelOption provider="groq" model="llama3-70b" />
    <ModelOption provider="groq" model="mixtral-8x7b" />
    <ModelOption provider="ollama" model="codellama" />
  </ModelGroup>
  
  {/* Freemium */}
  <ModelGroup label="Freemium" defaultExpanded={false}>
    <ModelOption provider="gemini" model="gemini-1.5-flash" />
    <ModelOption provider="openrouter" model="*:free" />
  </ModelGroup>
  
  {/* Pro - Requiere confirmación */}
  <ModelGroup label="Pro (Consumirá créditos)" requiresConfirmation>
    <ModelOption provider="openrouter" model="anthropic/claude-sonnet-4" tier="pro" />
    <ModelOption provider="openrouter" model="openai/gpt-4o" tier="pro" />
  </ModelGroup>
</ModelSelector>
```

#### 2.2 Indicadores Visuales Claros
- 🟢 **Verde**: Open Source (sin costo)
- 🟡 **Amarillo**: Freemium (límites aplican)
- 🔴 **Rojo**: Pro (consumirá créditos)

### Fase 3: Modificación de Canvas (Semana 2-3)

#### 3.1 Default Nodes con Open Source
```typescript
// Default AI nodes now use open source
const DEFAULT_CANVAS_CONFIG = {
  textGeneration: {
    defaultProvider: 'groq',
    defaultModel: 'llama3-70b',
    fallbackChain: ['huggingface', 'gemini', 'openrouter-free']
  },
  codeGeneration: {
    defaultProvider: 'groq',
    defaultModel: 'llama3-70b', // Llama 3 es excelente para código
    fallbackChain: ['ollama', 'openrouter-free']
  }
};
```

#### 3.2 Node Properties Panel
- Mostrar claramente el proveedor activo
- Toggle "Usar modelo Pro" con confirmación
- Info de cuántos créditos se consumirían

### Fase 4: Backend & Fallback Logic (Semana 3)

#### 4.1 Smart Routing en ai-proxy
```typescript
async function routeToProvider(request: AIRequest): Promise<Response> {
  // 1. Verificar preferencia del usuario
  if (request.userPreference === 'pro' && request.explicitProSelection) {
    return await callOpenRouter(request);
  }
  
  // 2. Intentar Open Source primero
  const openSourceProviders = ['groq', 'huggingface', 'ollama'];
  for (const provider of openSourceProviders) {
    try {
      return await callProvider(provider, request);
    } catch (e) {
      continue; // Fallback al siguiente
    }
  }
  
  // 3. Freemium como último recurso antes de error
  const freemiumProviders = ['gemini', 'openrouter-free'];
  for (const provider of freemiumProviders) {
    try {
      return await callProvider(provider, request);
    } catch (e) {
      continue;
    }
  }
  
  // 4. Solo si todo falla, ofrecer upgrade a Pro
  throw new Error('Todos los proveedores gratuitos agotados. Actualiza a Pro o intenta más tarde.');
}
```

#### 4.2 Rate Limiting por Proveedor
```typescript
const RATE_LIMITS = {
  groq: { requests: 20, window: 60000 },      // 20/min free tier
  huggingface: { requests: 30, window: 60000 }, // 30/min
  gemini: { requests: 60, window: 60000 },    // 60/min free tier
  openrouter: { requests: 20, window: 60000 }, // 20/min combined
};
```

### Fase 5: UI/UX & Educación al Usuario (Semana 4)

#### 5.1 Onboarding de Modelos
```tsx
<OnboardingStep>
  <h2>Elige tu experiencia de IA</h2>
  <OptionCard 
    title="Open Source (Recomendado)"
    description="Usa modelos gratuitos de código abierto. Sin costos, 100% privado."
    icon={<OpenSourceIcon />}
    selected={default}
  />
  <OptionCard 
    title="Modelos Pro"
    description="Accede a GPT-4, Claude, y modelos premium de pago."
    icon={<ProIcon />}
    badge="Consume créditos"
  />
</OnboardingStep>
```

#### 5.2 Badges Informativos en la UI
- Tooltips explicando por qué un modelo es "Pro"
- Contador de ahorro: "Has ahorrado $X usando modelos open source"
- Comparación de calidad: Side-by-side de respuestas

#### 5.3 Settings Page
```tsx
<SettingsSection title="Preferencias de IA">
  <Toggle 
    label="Siempre usar Open Source por defecto"
    description="Los modelos Pro solo se usarán si los seleccionas manualmente"
    defaultChecked={true}
  />
  <Toggle 
    label="Mostrar advertencia antes de usar modelos Pro"
    defaultChecked={true}
  />
  <Toggle 
    label="Permitir fallback automático a modelos Pro si Open Source falla"
    defaultChecked={false}
  />
</SettingsSection>
```

---

## Implementación Técnica Detallada

### Cambios en Base de Datos
```sql
-- Agregar preferencias de usuario
ALTER TABLE profiles ADD COLUMN ai_preferences JSONB DEFAULT '{
  "defaultTier": "open-source",
  "preferredProvider": "groq",
  "allowProFallback": false,
  "showProWarning": true
}';
```

### Nuevos Hooks
```typescript
// useAIProvider.ts
export function useAIProvider() {
  const [activeProvider, setActiveProvider] = useState('groq');
  const [isPro, setIsPro] = useState(false);
  
  const selectModel = async (model: string, tier: 'free' | 'pro') => {
    if (tier === 'pro') {
      // Mostrar modal de confirmación
      const confirmed = await showProConfirmation(model);
      if (!confirmed) return false;
    }
    setIsPro(tier === 'pro');
    setActiveProvider(getProviderForModel(model));
    return true;
  };
  
  return { activeProvider, isPro, selectModel };
}
```

### Modificación de Edge Functions

#### `ai-proxy/index.ts` (Modificado)
```typescript
// Router inteligente
serve(async (req) => {
  const { provider, tier, explicitPro } = await req.json();
  
  // Si no es explícitamente Pro, forzar Open Source
  if (!explicitPro) {
    return await routeToOpenSource(req);
  }
  
  // Verificar créditos antes de Pro
  if (tier === 'pro') {
    const hasCredits = await checkUserCredits(req.userId);
    if (!hasCredits) {
      return json({ error: 'Créditos insuficientes para modelo Pro' }, 402);
    }
  }
  
  return await routeToProvider(provider, req);
});
```

#### Nuevo: `groq-proxy/index.ts`
```typescript
// Wrapper para Groq API
const GROQ_MODELS = {
  'llama3-8b': 'llama3-8b-8192',
  'llama3-70b': 'llama3-70b-8192',
  'mixtral': 'mixtral-8x7b-32768',
  'gemma': 'gemma-7b-it',
};
```

#### Nuevo: `huggingface-proxy/index.ts`
```typescript
// Wrapper para Hugging Face Inference API
const HF_MODELS = {
  'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.2',
  'llama2-13b': 'meta-llama/Llama-2-13b-chat-hf',
  'codellama': 'codellama/CodeLlama-7b-Instruct-hf',
};
```

---

## Costos y Limitaciones

### Proveedores Open Source - Límites Gratuitos
| Proveedor | Requests/día | Tokens/min | Notas |
|-----------|--------------|------------|-------|
| Groq | 1,000,000 | 20,000 | Muy generoso |
| Hugging Face | 1,000 | Varies | Rate limit estricto |
| Gemini | 1,000 | 60/min | Buen balance |
| Ollama | Ilimitado | Hardware local | Requiere setup |

### Estrategia de Fallback
```
Usuario hace request
    ↓
¿Seleccionó modelo Pro explícitamente?
    Sí → Verificar créditos → OpenRouter
    No → Intentar Groq (más rápido)
              ↓ (si falla)
         Intentar Hugging Face
              ↓ (si falla)
         Intentar Gemini
              ↓ (si falla)
         Intentar OpenRouter :free
              ↓ (si falla)
         Informar usuario: "Proveedores agotados"
```

---

## Cronograma

| Semana | Tareas |
|--------|--------|
| **1** | Setup infraestructura, crear edge functions Groq/HF, config env vars |
| **2** | Modificar Genesis IDE, nuevo selector de modelos, badges UI |
| **3** | Modificar Canvas, node defaults, properties panel |
| **4** | Testing, debugging, onboarding flow, documentación |
| **5** | Deploy a staging, user testing, ajustes finales |
| **6** | Deploy a producción, monitoreo, rollback plan |

---

## Métricas de Éxito

- [ ] 80%+ de requests usan Open Source (vs OpenRouter pago)
- [ ] 0% de requests Pro sin confirmación explícita del usuario
- [ ] Latencia promedio < 2s para modelos Open Source
- [ ] Fallback rate < 5% (requests que necesitan fallback)
- [ ] User satisfaction > 4.5/5 en encuestas post-implementación

---

## Rollback Plan

Si surge algún problema:
1. Feature flag `USE_OPEN_SOURCE_DEFAULT` → `false`
2. Revertir a OpenRouter como default
3. Mantener Open Source como opción alternativa
4. Comunicación transparente a usuarios sobre cambios

---

**Documento versión:** 1.0
**Fecha:** 19 Abril 2026
**Autor:** Claude (para Creator IA Pro)
