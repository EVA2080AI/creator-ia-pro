import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { useAuth } from './useAuth';

// Types
interface Project {
  id: string;
  name: string;
  files: Record<string, StudioFile>;
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Simple storage
const STORAGE_KEY = 'genesis_lite_project';

export function useGenesisLite(projectId?: string | null) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [streamContent, setStreamContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('studio_projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProject({
        id: data.id,
        name: data.name,
        files: data.files || {},
        created_at: data.created_at,
      });

      // Set default active file
      if (data.files && Object.keys(data.files).length > 0) {
        setActiveFile('App.tsx');
      }
    } catch (err) {
      console.error('Error loading project:', err);
      toast.error('Error cargando proyecto');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = useCallback(async (name: string = 'Nuevo Proyecto') => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('studio_projects')
        .insert({
          user_id: user.id,
          name,
          files: {},
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = {
        id: data.id,
        name: data.name,
        files: {},
        created_at: data.created_at,
      };

      setProject(newProject);
      setMessages([]);
      setActiveFile(null);
      navigate(`/studio?project=${data.id}`);
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Error creando proyecto');
      return null;
    }
  }, [user, navigate]);

  const updateFiles = useCallback(async (newFiles: Record<string, StudioFile>) => {
    if (!project) return;

    setProject(prev => prev ? { ...prev, files: newFiles } : null);

    // Save to DB
    try {
      await supabase
        .from('studio_projects')
        .update({ files: newFiles, updated_at: new Date().toISOString() })
        .eq('id', project.id);
    } catch (err) {
      console.error('Error saving files:', err);
    }
  }, [project]);

  const generateCode = useCallback(async (prompt: string) => {
    if (!user || !project) {
      toast.error('No hay proyecto activo');
      return null;
    }

    setIsGenerating(true);
    setStreamContent('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const systemPrompt = `Eres Genesis AI. Genera código React + TypeScript + Tailwind CSS.

REGLAS CRÍTICAS:
1. Para dashboards/proyectos COMPLETOS: genera TODO en UN SOLO ARCHIVO App.tsx (componentes inline)
2. Para componentes SIMPLES: un solo archivo es suficiente
3. Si necesitas recharts: incluye 'import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"'
4. Usa Lucide React para iconos: import { IconName } from 'lucide-react'
5. Código COMPLETO, FUNCIONAL, sin placeholders
6. Responde SOLO con el bloque de código

DEPENDENCIAS (se instalan automáticamente):
- recharts → incluye react-is automáticamente
- lucide-react → para iconos
- framer-motion → para animaciones

Ejemplo:
\`\`\`tsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
    </div>
  );
}
\`\`\``;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
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
              { role: 'user', content: prompt }
            ],
            stream: true,
            temperature: 0.3,
            max_tokens: 12000
          }
        })
      });

      if (!res.ok) throw new Error('Error en la generación');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setStreamContent(accumulated);
            }
          } catch {
            // Skip malformed
          }
        }
      }

      // Extract code
      const codeMatch = accumulated.match(/```(?:tsx?)?\n?([\s\S]*?)```/);
      if (codeMatch) {
        const code = codeMatch[1].trim();

        // Detect dependencies from imports
        const deps = new Set<string>(['react', 'react-dom', 'lucide-react']);
        if (code.includes('recharts')) {
          deps.add('recharts');
          deps.add('react-is'); // Required by recharts
        }
        if (code.includes('framer-motion')) deps.add('framer-motion');
        if (code.includes('date-fns')) deps.add('date-fns');
        if (code.includes('clsx') || code.includes('tailwind-merge')) {
          deps.add('clsx');
          deps.add('tailwind-merge');
        }

        // Build package.json
        const dependencies: Record<string, string> = {};
        deps.forEach(dep => {
          dependencies[dep] = dep === 'react-is' ? '^18.0.0' : 'latest';
        });

        const pkgJson = {
          name: 'genesis-project',
          type: 'module',
          dependencies
        };

        const newFiles = {
          ...project.files,
          'App.tsx': { language: 'tsx', content: code },
          'package.json': { language: 'json', content: JSON.stringify(pkgJson, null, 2) }
        };

        await updateFiles(newFiles);
        setActiveFile('App.tsx');
        setViewMode('preview');

        // Add message
        setMessages(prev => [...prev,
          { id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: new Date() },
          { id: crypto.randomUUID(), role: 'assistant', content: `Código generado. Dependencias: ${Array.from(deps).join(', ')}`, timestamp: new Date() }
        ]);

        return { code, files: newFiles };
      } else {
        throw new Error('No se pudo extraer el código');
      }

    } catch (err: any) {
      toast.error(err.message || 'Error generando código');
      return null;
    } finally {
      setIsGenerating(false);
      setStreamContent('');
    }
  }, [user, project, selectedModel, updateFiles]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;
    await generateCode(prompt);
  }, [isGenerating, generateCode]);

  const deleteProject = useCallback(async () => {
    if (!project || !user) return;

    try {
      await supabase.from('studio_projects').delete().eq('id', project.id);
      setProject(null);
      navigate('/studio');
      toast.success('Proyecto eliminado');
    } catch (err) {
      toast.error('Error eliminando proyecto');
    }
  }, [project, user, navigate]);

  const renameProject = useCallback(async (newName: string) => {
    if (!project || !user) return;

    try {
      await supabase
        .from('studio_projects')
        .update({ name: newName })
        .eq('id', project.id);

      setProject(prev => prev ? { ...prev, name: newName } : null);
    } catch (err) {
      toast.error('Error renombrando proyecto');
    }
  }, [project, user]);

  return {
    // State
    project,
    isLoading,
    isGenerating,
    messages,
    activeFile,
    viewMode,
    streamContent,
    selectedModel,

    // Actions
    createProject,
    updateFiles,
    generateCode,
    handleSendMessage,
    deleteProject,
    renameProject,

    // Setters
    setActiveFile,
    setViewMode,
    setSelectedModel,
    setMessages,
  };
}
