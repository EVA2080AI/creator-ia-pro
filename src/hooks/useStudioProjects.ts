import { useState, useEffect, useCallback } from 'react';
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

// Forma que devuelve /api/projects (Drizzle, camelCase) — se traduce a la
// forma pública snake_case de este hook para no tocar los consumidores
// (Chat.tsx, Dashboard.tsx) en esta pasada.
interface ApiProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  files: unknown;
  createdAt: string;
  updatedAt: string;
}

function normalizeFiles(files: unknown): Record<string, StudioFile> {
  if (!files) return {};
  if (typeof files === 'string') {
    try {
      return normalizeFiles(JSON.parse(files));
    } catch (e) {
      console.error("[useStudioProjects] Failed to parse files string:", e);
      return {};
    }
  }
  if (typeof files === 'object' && !Array.isArray(files)) {
    return files as Record<string, StudioFile>;
  }
  return {};
}

function fromApi(p: ApiProject): StudioProject {
  return {
    id: p.id,
    user_id: p.userId,
    name: p.name,
    description: p.description,
    files: normalizeFiles(p.files),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; error?: string; data?: T }> {
  try {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.error || `Error ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de red' };
  }
}

export function useStudioProjects() {
  const { user } = useAuth(); // no redirect — Studio handles auth via AppHeader
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousFiles, setPreviousFiles] = useState<Record<string, StudioFile> | null>(null);

  const fetchProjects = useCallback(async (showLoading = false) => {
    if (!user) { setLoading(false); return; }
    if (showLoading) setLoading(true);

    const res = await api<{ projects: ApiProject[] }>('/api/projects');
    if (!res.ok) {
      console.error('Error fetching projects:', res.error);
      toast.error('No se pudieron cargar los proyectos');
      setLoading(false);
      return;
    }

    setProjects((res.data!.projects || []).map(fromApi));
    // No autoseleccionar el primero al cargar — evita saltarse la pantalla de bienvenida de Genesis.
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects(true);
  }, [fetchProjects]);

  const createProject = useCallback(async (name = 'Nuevo Proyecto') => {
    if (!user) return null;
    const res = await api<{ project: ApiProject }>('/api/projects', { method: 'POST', body: JSON.stringify({ name }) });
    if (!res.ok) { toast.error('Error al crear proyecto'); return null; }

    const project = fromApi(res.data!.project);
    setProjects((prev) => [project, ...prev]);
    setActiveProject(project);
    toast.success('Proyecto creado');
    return project;
  }, [user]);

  // ─── AUTO-SAVE ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeProject || !user) return;

    const timer = setTimeout(async () => {
      const res = await api(`/api/projects/${activeProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ files: activeProject.files }),
      });
      if (res.ok) console.log(`💾 Genesis Auto-save: ${activeProject.name}`);
      else console.error('Auto-save failed:', res.error);
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeProject?.files, activeProject?.id, user?.id]);

  const updateProjectFiles = useCallback(async (projectId: string, files: Record<string, StudioFile>) => {
    if (Object.keys(files).length > 100) {
      toast.error('Límite de 100 archivos por proyecto');
      return;
    }

    if (activeProject?.id === projectId) {
      setPreviousFiles(activeProject.files);
    }

    const res = await api(`/api/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify({ files }) });
    if (!res.ok) { console.error('Error saving files:', res.error); return; }

    const now = new Date().toISOString();
    const updater = (p: StudioProject) => p.id === projectId ? { ...p, files: normalizeFiles(files), updated_at: now } : p;
    setProjects((prev) => prev.map(updater));
    setActiveProject((prev) => prev?.id === projectId ? updater(prev) : prev);
  }, [activeProject]);

  const renameProject = useCallback(async (projectId: string, name: string) => {
    const res = await api(`/api/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify({ name }) });
    if (!res.ok) { toast.error('Error al renombrar'); return; }
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, name } : p));
    setActiveProject((prev) => prev?.id === projectId ? { ...prev, name } : prev);
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    const res = await api(`/api/projects/${projectId}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Error al eliminar proyecto'); return; }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setActiveProject((prev) => prev?.id === projectId ? null : prev);
    toast.success('Proyecto eliminado');
  }, []);

  const duplicateProject = useCallback(async (project: StudioProject) => {
    if (!user) return null;
    const created = await api<{ project: ApiProject }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: `${project.name} (Copia)` }),
    });
    if (!created.ok) { toast.error('Error al duplicar'); return null; }

    const withFiles = await api<{ project: ApiProject }>(`/api/projects/${created.data!.project.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ files: project.files }),
    });
    const finalProject = fromApi(withFiles.ok ? withFiles.data!.project : created.data!.project);
    setProjects((prev) => [finalProject, ...prev]);
    toast.success('Proyecto duplicado exitosamente');
    return finalProject;
  }, [user]);

  const rollbackFiles = useCallback(async () => {
    if (!activeProject || !previousFiles) {
      toast.error('No hay nada que deshacer');
      return;
    }
    const filesToRestore = { ...previousFiles };
    await updateProjectFiles(activeProject.id, filesToRestore);
    setPreviousFiles(null);
    toast.success('Cambios revertidos');
  }, [activeProject, previousFiles, updateProjectFiles]);

  const getProjectFiles = useCallback(async (projectId: string): Promise<Record<string, StudioFile> | null> => {
    const res = await api<{ project: ApiProject }>(`/api/projects/${projectId}`);
    if (!res.ok) {
      console.error('Error fetching project files:', res.error);
      return null;
    }
    return normalizeFiles(res.data!.project.files);
  }, []);

  const hardResetProject = useCallback(async (projectId: string) => {
    const res = await api(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ files: {}, description: null }),
    });
    if (!res.ok) {
      toast.error('Error al limpiar archivos');
      return false;
    }

    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, files: {}, description: null } : p));
    if (activeProject?.id === projectId) {
      setActiveProject((prev) => prev ? { ...prev, files: {}, description: null } : null);
    }

    toast.success('Proyecto reseteado a cero');
    return true;
  }, [activeProject]);

  return {
    projects, activeProject, setActiveProject, loading,
    createProject, updateProjectFiles, renameProject,
    deleteProject, duplicateProject, rollbackFiles, canUndo: !!previousFiles,
    refetch: fetchProjects, getProjectFiles, hardResetProject
  };
}
