import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { detectIntent, processAIResponse, detectDependencies } from '@/components/studio/chat/utils-simple';

interface UseSimpleCodeGenProps {
  projectFiles: Record<string, StudioFile>;
  selectedModel?: string;
  subscriptionTier?: 'free' | 'pro' | 'admin';
}

interface GenerationResult {
  files: Record<string, StudioFile>;
  explanation: string;
  isChatOnly: boolean;
}

export function useSimpleCodeGen({
  projectFiles,
  selectedModel = 'google/gemini-2.0-flash-001',
  subscriptionTier = 'free'
}: UseSimpleCodeGenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setStreamContent('');
    setProgress(0);
  }, []);

  const buildPrompt = useCallback((userPrompt: string, imageUrl?: string | null) => {
    const intent = detectIntent(userPrompt);
    const hasFiles = Object.keys(projectFiles).length > 0;

    // Construir contexto de archivos existentes (simplificado)
    let fileContext = '';
    if (hasFiles) {
      const fileList = Object.keys(projectFiles).slice(0, 5).join(', ');
      fileContext = `\n\nArchivos existentes: ${fileList}`;
    }

    // System prompt simplificado
    const systemPrompt = `Eres Genesis AI, un asistente experto en crear páginas web y componentes React.

REGLAS:
1. Genera código limpio y funcional usando React + TypeScript + Tailwind CSS
2. Usa Lucide React para iconos (import { IconName } from 'lucide-react')
3. Para landing pages: crea secciones Hero, Features, CTA, Footer
4. Siempre devuelve el código en bloques markdown con el nombre del archivo
5. Ejemplo de formato:
\`\`\`tsx App.tsx
export default function App() {
  return <div>Hola</div>;
}
\`\`\`

${fileContext}`;

    // User content
    let userContent = userPrompt;

    // Añadir instrucciones específicas según intent
    if (intent === 'landing') {
      userContent += '\n\nCrea una landing page completa y moderna con Hero, Features, CTA y Footer. Usa Tailwind CSS para el diseño.';
    } else if (intent === 'component') {
      userContent += '\n\nCrea un componente reutilizable con props bien tipadas.';
    }

    return { systemPrompt, userContent, intent };
  }, [projectFiles]);

  const generate = useCallback(async (
    prompt: string,
    options?: { imageUrl?: string | null }
  ): Promise<GenerationResult | null> => {
    setIsGenerating(true);
    setStreamContent('');
    setProgress(0);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { systemPrompt, userContent, intent } = buildPrompt(prompt, options?.imageUrl);

      // Token limits según tier
      const maxTokens = subscriptionTier === 'free' ? 4000 : 12000;

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...(options?.imageUrl ? [
                { role: 'user', content: [{ type: 'image_url', image_url: { url: options.imageUrl } }] },
                { role: 'user', content: userContent }
              ] : [{ role: 'user', content: userContent }])
            ],
            stream: true,
            temperature: intent === 'chat' ? 0.7 : 0.3,
            max_tokens: maxTokens
          }
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      // Leer stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') {
              accumulated += delta;
              setStreamContent(accumulated);
              setProgress(Math.min((accumulated.length / maxTokens) * 100, 95));
            }
          } catch {
            // Ignorar chunks malformados
          }
        }
      }

      // Procesar respuesta
      const result = processAIResponse(accumulated);

      setIsGenerating(false);
      setProgress(100);

      return {
        files: result.files,
        explanation: result.explanation || 'Código generado exitosamente.',
        isChatOnly: !result.hasCode
      };

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.error('[useSimpleCodeGen] Error:', err);
      setIsGenerating(false);
      throw err;
    }
  }, [buildPrompt, selectedModel, subscriptionTier]);

  return {
    isGenerating,
    streamContent,
    progress,
    generate,
    stopGeneration
  };
}
