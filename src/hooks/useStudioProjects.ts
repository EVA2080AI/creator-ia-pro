import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface StudioFile {
  language: string;
  content: string;
}

export interface StudioProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  files: Record<string, StudioFile>;
  created_at: string;
  updated_at: string;
}

const DEFAULT_FILES: Record<string, StudioFile> = {
  'App.tsx': {
    language: 'tsx',
    content: `export default function App() {
  return null;
}`,
  },
  'index.css': {
    language: 'css',
    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
  },
};

export function useStudioProjects() {
  const { user } = useAuth(); // no redirect — Studio handles auth via AppHeader
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('studio_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching studio projects:', error);
      toast.error('No se pudieron cargar los proyectos');
      setLoading(false);
      return;
    }

    const parsed = (data || []).map((p: any) => ({
      ...p,
      files: typeof p.files === 'string'
        ? (() => { try { return JSON.parse(p.files); } catch { return {}; } })()
        : (p.files || {}),
    })) as StudioProject[];

    setProjects(parsed);
    
    // IMPORTANT: Fix to prevent skipping Genesis Home.
    // Only update activeProject if it already exists (syncing).
    // DO NOT auto-select the first one if null.
    setActiveProject((curr) => {
      if (curr) return parsed.find((p) => p.id === curr.id) ?? null;
      return null;
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = useCallback(async (name = 'Nuevo Proyecto') => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('studio_projects')
      .insert({ user_id: user.id, name, files: DEFAULT_FILES as any })
      .select()
      .single();

    if (error) { toast.error('Error al crear proyecto'); return null; }

    const project = { ...data, files: data.files as unknown as Record<string, StudioFile> } as StudioProject;
    setProjects((prev) => [project, ...prev]);
    setActiveProject(project);
    toast.success('Proyecto creado');
    return project;
  }, [user]);

  const updateProjectFiles = useCallback(async (projectId: string, files: Record<string, StudioFile>) => {
    if (Object.keys(files).length > 100) {
      toast.error('Límite de 100 archivos por proyecto');
      return;
    }
    const { error } = await supabase
      .from('studio_projects')
      .update({ files: files as any, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) { console.error('Error saving files:', error); return; }

    const updater = (p: StudioProject) => p.id === projectId ? { ...p, files, updated_at: new Date().toISOString() } : p;
    setProjects((prev) => prev.map(updater));
    setActiveProject((prev) => prev?.id === projectId ? updater(prev) : prev);
  }, []);

  const renameProject = useCallback(async (projectId: string, name: string) => {
    const { error } = await supabase
      .from('studio_projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) { toast.error('Error al renombrar'); return; }
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, name } : p));
    setActiveProject((prev) => prev?.id === projectId ? { ...prev, name } : prev);
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase.from('studio_projects' as any).delete().eq('id', projectId);
    if (error) { toast.error('Error al eliminar proyecto'); return; }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setActiveProject((prev) => prev?.id === projectId ? null : prev);
    toast.success('Proyecto eliminado');
  }, []);

  const duplicateProject = useCallback(async (project: StudioProject) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('studio_projects' as any)
      .insert({ 
        user_id: user.id, 
        name: `${project.name} (Copia)`, 
        files: project.files as any 
      })
      .select()
      .single();

    if (error) { toast.error('Error al duplicar'); return null; }

    const newProject = { ...data, files: typeof data.files === 'string' ? JSON.parse(data.files) : data.files } as StudioProject;
    setProjects((prev) => [newProject, ...prev]);
    toast.success('Proyecto duplicado exitosamente');
    return newProject;
  }, [user]);

  return { 
    projects, activeProject, setActiveProject, loading, 
    createProject, updateProjectFiles, renameProject, 
    deleteProject, duplicateProject, refetch: fetchProjects 
  };
}
