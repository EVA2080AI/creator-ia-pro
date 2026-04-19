import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Model definitions by tier
export const AI_MODELS = {
  // Tier 1: Open Source (default)
  openSource: [
    {
      id: "llama3-70b",
      name: "Llama 3 70B",
      provider: "groq",
      description: "Meta's Llama 3 - Excelente para código y chat",
      tier: "open-source",
      tags: ["code", "chat", "fast"],
      color: "#22c55e",
    },
    {
      id: "mixtral-8x7b",
      name: "Mixtral 8x7B",
      provider: "groq",
      description: "Mistral's MOE model - Muy capaz y rápido",
      tier: "open-source",
      tags: ["general", "fast"],
      color: "#22c55e",
    },
    {
      id: "llama3-8b",
      name: "Llama 3 8B",
      provider: "groq",
      description: "Versión ligera - Ultra rápida",
      tier: "open-source",
      tags: ["fast", "lightweight"],
      color: "#22c55e",
    },
    {
      id: "codellama-34b",
      name: "CodeLlama 34B",
      provider: "huggingface",
      description: "Especializado en código - Excelente para Genesis IDE",
      tier: "open-source",
      tags: ["code", "specialized"],
      color: "#3b82f6",
    },
    {
      id: "mistral-7b",
      name: "Mistral 7B",
      provider: "huggingface",
      description: "Mistral base - Buen balance",
      tier: "open-source",
      tags: ["general", "balanced"],
      color: "#3b82f6",
    },
    {
      id: "deepseek-coder",
      name: "DeepSeek Coder",
      provider: "huggingface",
      description: "Especialista en código de DeepSeek",
      tier: "open-source",
      tags: ["code", "specialized"],
      color: "#3b82f6",
    },
  ],

  // Tier 2: Freemium
  freemium: [
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "gemini",
      description: "Google - Muy capaz, contexto largo",
      tier: "freemium",
      tags: ["general", "long-context"],
      color: "#f59e0b",
      limits: "60 req/min"
    },
    {
      id: "openrouter-free",
      name: "OpenRouter Free",
      provider: "openrouter",
      description: "Modelos gratuitos vía OpenRouter",
      tier: "freemium",
      tags: ["varied"],
      color: "#f59e0b",
      limits: "20 req/min"
    },
  ],

  // Tier 3: Pro (consumes credits)
  pro: [
    {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
      provider: "openrouter",
      description: "Anthropic - El mejor para código y análisis",
      tier: "pro",
      tags: ["premium", "code", "analysis"],
      color: "#8b5cf6",
      cost: "1-5 créditos/req"
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openrouter",
      description: "OpenAI - Versátil y potente",
      tier: "pro",
      tags: ["premium", "general"],
      color: "#8b5cf6",
      cost: "2-10 créditos/req"
    },
    {
      id: "claude-opus-4",
      name: "Claude Opus 4",
      provider: "openrouter",
      description: "Anthropic - Máxima calidad",
      tier: "pro",
      tags: ["premium", "high-quality"],
      color: "#8b5cf6",
      cost: "5-20 créditos/req"
    },
  ],
};

// Provider configurations
const PROVIDER_CONFIG = {
  groq: {
    functionName: "groq-proxy",
    requiresAuth: true,
    streaming: true,
  },
  huggingface: {
    functionName: "huggingface-proxy",
    requiresAuth: true,
    streaming: false,
  },
  gemini: {
    functionName: "ai-proxy",
    provider: "gemini",
    requiresAuth: true,
    streaming: false,
  },
  openrouter: {
    functionName: "ai-proxy",
    provider: "openrouter",
    requiresAuth: true,
    streaming: true,
  },
};

interface AIProviderState {
  selectedModel: typeof AI_MODELS.openSource[0] | null;
  isPro: boolean;
  lastProvider: string;
  fallbackUsed: boolean;
}

export function useAIProvider() {
  const [state, setState] = useState<AIProviderState>({
    selectedModel: AI_MODELS.openSource[0], // Default to Llama 3 70B
    isPro: false,
    lastProvider: "groq",
    fallbackUsed: false,
  });

  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    defaultTier: "open-source",
    allowProFallback: false,
    showProWarning: true,
  });

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("ai_preferences")
          .eq("user_id", user.id)
          .single();

        if (data?.ai_preferences) {
          setPreferences(prev => ({ ...prev, ...data.ai_preferences }));
        }
      }
    };
    loadPreferences();
  }, []);

  // Select a model with Pro confirmation
  const selectModel = useCallback(async (
    modelId: string,
    explicitPro: boolean = false
  ): Promise<boolean> => {
    // Find model in all tiers
    const allModels = [...AI_MODELS.openSource, ...AI_MODELS.freemium, ...AI_MODELS.pro];
    const model = allModels.find(m => m.id === modelId);

    if (!model) {
      toast.error(`Modelo ${modelId} no encontrado`);
      return false;
    }

    // If it's a Pro model, require explicit confirmation
    if (model.tier === "pro") {
      if (!explicitPro && preferences.showProWarning) {
        toast.info("Los modelos Pro consumen créditos. Selecciona explícitamente si deseas usarlo.", {
          action: {
            label: "Seleccionar",
            onClick: () => selectModel(modelId, true),
          },
        });
        return false;
      }

      // Check credits before allowing Pro model
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits_balance")
          .eq("user_id", user.id)
          .single();

        if (!profile || profile.credits_balance <= 0) {
          toast.error("No tienes créditos suficientes para usar modelos Pro. Recarga para continuar.");
          return false;
        }
      }

      setState(prev => ({
        ...prev,
        selectedModel: model,
        isPro: true,
        lastProvider: model.provider
      }));

      toast.success(`Modelo Pro seleccionado: ${model.name}`, {
        description: `Este modelo consumirá ${model.cost}`,
      });

      return true;
    }

    // Open Source or Freemium - no confirmation needed
    setState(prev => ({
      ...prev,
      selectedModel: model,
      isPro: false,
      lastProvider: model.provider
    }));

    return true;
  }, [preferences.showProWarning]);

  // Get model by task type (smart selection)
  const getRecommendedModel = useCallback((task: "code" | "chat" | "image" | "general") => {
    switch (task) {
      case "code":
        return AI_MODELS.openSource.find(m => m.id === "codellama-34b") || AI_MODELS.openSource[0];
      case "chat":
        return AI_MODELS.openSource.find(m => m.id === "llama3-70b") || AI_MODELS.openSource[0];
      case "general":
        return AI_MODELS.openSource.find(m => m.id === "mixtral-8x7b") || AI_MODELS.openSource[0];
      default:
        return AI_MODELS.openSource[0];
    }
  }, []);

  // Call AI with fallback chain
  const callAI = useCallback(async (payload: any): Promise<any> => {
    setLoading(true);
    setState(prev => ({ ...prev, fallbackUsed: false }));

    try {
      const model = state.selectedModel;
      if (!model) throw new Error("No model selected");

      const config = PROVIDER_CONFIG[model.provider as keyof typeof PROVIDER_CONFIG];

      // Build the request
      const requestBody = {
        ...payload,
        model: model.id,
        provider: config.provider || model.provider,
        tier: model.tier,
        explicitPro: state.isPro,
      };

      // Call the edge function
      const { data, error } = await supabase.functions.invoke(
        config.functionName,
        { body: requestBody }
      );

      if (error) throw error;

      return {
        ...data,
        _provider: model.provider,
        _tier: model.tier,
        _model: model.name,
      };

    } catch (error) {
      console.error("AI call failed:", error);

      // If Pro failed, don't retry
      if (state.isPro) {
        toast.error("Error al llamar modelo Pro. Intenta con un modelo Open Source.");
        throw error;
      }

      // Try fallback to freemium
      toast.info("Proveedor ocupado, intentando alternativa...");

      try {
        const fallbackModel = AI_MODELS.freemium[0]; // Gemini Flash
        const { data, error } = await supabase.functions.invoke("ai-proxy", {
          body: {
            ...payload,
            model: fallbackModel.id,
            provider: "gemini",
            tier: "freemium",
          }
        });

        if (error) throw error;

        setState(prev => ({ ...prev, fallbackUsed: true }));

        return {
          ...data,
          _provider: fallbackModel.provider,
          _tier: "freemium",
          _model: fallbackModel.name,
          _fallback: true,
        };
      } catch (fallbackError) {
        toast.error("Todos los proveedores gratuitos están ocupados. Intenta más tarde o usa un modelo Pro.");
        throw fallbackError;
      }
    } finally {
      setLoading(false);
    }
  }, [state.selectedModel, state.isPro]);

  return {
    // State
    selectedModel: state.selectedModel,
    isPro: state.isPro,
    loading,
    fallbackUsed: state.fallbackUsed,

    // Actions
    selectModel,
    getRecommendedModel,
    callAI,

    // Data
    models: AI_MODELS,
    preferences,

    // Helpers
    isOpenSource: (modelId: string) => {
      return AI_MODELS.openSource.some(m => m.id === modelId);
    },
    isFreemium: (modelId: string) => {
      return AI_MODELS.freemium.some(m => m.id === modelId);
    },
    isProModel: (modelId: string) => {
      return AI_MODELS.pro.some(m => m.id === modelId);
    },
  };
}

// Hook for Genesis IDE specific
export function useGenesisAI() {
  const ai = useAIProvider();

  // Genesis default: CodeLlama for code tasks
  useEffect(() => {
    const codeModel = ai.models.openSource.find(m => m.id === "codellama-34b");
    if (codeModel && !ai.selectedModel) {
      ai.selectModel(codeModel.id);
    }
  }, []);

  return ai;
}

// Hook for Canvas specific
export function useCanvasAI() {
  const ai = useAIProvider();

  // Canvas default: Mixtral for general tasks
  useEffect(() => {
    const generalModel = ai.models.openSource.find(m => m.id === "mixtral-8x7b");
    if (generalModel && !ai.selectedModel) {
      ai.selectModel(generalModel.id);
    }
  }, []);

  return ai;
}
