import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
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

interface ProjectState {
  // Data
  projects: StudioProject[];
  activeProject: StudioProject | null;
  loading: boolean;
  previousFiles: Record<string, StudioFile> | null;

  // Actions
  setProjects: (projects: StudioProject[]) => void;
  setActiveProject: (project: StudioProject | null) => void;
  setLoading: (loading: boolean) => void;

  // Async actions
  fetchProjects: (userId: string) => Promise<void>;
  createProject: (userId: string, name?: string) => Promise<StudioProject | null>;
  updateProjectFiles: (projectId: string, files: Record<string, StudioFile>) => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (userId: string, project: StudioProject) => Promise<StudioProject | null>;
  hardResetProject: (projectId: string) => Promise<boolean>;
  rollbackFiles: () => Promise<void>;

  // Computed
  canUndo: () => boolean;
  getProjectFiles: (projectId: string) => Promise<Record<string, StudioFile> | null>;
}

function normalizeFiles(files: unknown): Record<string, StudioFile> {
  if (!files) return {};
  if (typeof files === 'string') {
    try {
      return normalizeFiles(JSON.parse(files));
    } catch {
      return {};
    }
  }
  if (typeof files === 'object' && !Array.isArray(files)) {
    return files as Record<string, StudioFile>;
  }
  return {};
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProject: null,
      loading: false,
      previousFiles: null,

      setProjects: (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),
      setLoading: (loading) => set({ loading }),

      fetchProjects: async (userId: string) => {
        set({ loading: true });
        const { data, error } = await supabase
          .from('studio_projects')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
          toast.error('No se pudieron cargar los proyectos');
          set({ loading: false });
          return;
        }

        const parsed = (data || []).map((p: any) => ({
          ...p,
          files: normalizeFiles(p.files),
        })) as StudioProject[];

        set({ projects: parsed, loading: false });
      },

      createProject: async (userId: string, name = 'Nuevo Proyecto') => {
        const { data, error } = await supabase
          .from('studio_projects')
          .insert({ user_id: userId, name, files: {} })
          .select()
          .single();

        if (error || !data) {
          toast.error('Error al crear proyecto');
          return null;
        }

        const project = { ...data, files: normalizeFiles(data.files) } as StudioProject;
        set((state) => ({
          projects: [project, ...state.projects],
          activeProject: project
        }));
        toast.success('Proyecto creado');
        return project;
      },

      updateProjectFiles: async (projectId: string, files: Record<string, StudioFile>) => {
        if (Object.keys(files).length > 100) {
          toast.error('Límite de 100 archivos por proyecto');
          return;
        }

        const { activeProject } = get();

        // Save previous state for undo
        if (activeProject?.id === projectId) {
          set({ previousFiles: activeProject.files });
        }

        const { error } = await supabase
          .from('studio_projects')
          .update({
            files: files as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);

        if (error) {
          console.error('Error saving files:', error);
          return;
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, files: normalizeFiles(files), updated_at: new Date().toISOString() }
              : p
          ),
          activeProject: state.activeProject?.id === projectId
            ? { ...state.activeProject, files: normalizeFiles(files), updated_at: new Date().toISOString() }
            : state.activeProject
        }));
      },

      renameProject: async (projectId: string, name: string) => {
        const { error } = await supabase
          .from('studio_projects')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', projectId);

        if (error) {
          toast.error('Error al renombrar');
          return;
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, name } : p
          ),
          activeProject: state.activeProject?.id === projectId
            ? { ...state.activeProject, name }
            : state.activeProject
        }));
      },

      deleteProject: async (projectId: string) => {
        const { error } = await supabase
          .from('studio_projects')
          .delete()
          .eq('id', projectId);

        if (error) {
          toast.error('Error al eliminar proyecto');
          return;
        }

        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          activeProject: state.activeProject?.id === projectId ? null : state.activeProject
        }));
        toast.success('Proyecto eliminado');
      },

      duplicateProject: async (userId: string, project: StudioProject) => {
        const { data, error } = await supabase
          .from('studio_projects')
          .insert({
            user_id: userId,
            name: `${project.name} (Copia)`,
            files: project.files as unknown as Record<string, unknown>
          })
          .select()
          .single();

        if (error || !data) {
          toast.error('Error al duplicar');
          return null;
        }

        const newProject = {
          ...data,
          files: normalizeFiles(data.files)
        } as StudioProject;

        set((state) => ({ projects: [newProject, ...state.projects] }));
        toast.success('Proyecto duplicado exitosamente');
        return newProject;
      },

      hardResetProject: async (projectId: string) => {
        const { error: fileError } = await supabase
          .from('studio_projects')
          .update({
            files: {},
            updated_at: new Date().toISOString(),
            description: null
          })
          .eq('id', projectId);

        if (fileError) {
          toast.error('Error al limpiar archivos');
          return false;
        }

        await supabase
          .from('studio_conversations')
          .delete()
          .eq('project_id', projectId);

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, files: {}, description: null } : p
          ),
          activeProject: state.activeProject?.id === projectId
            ? { ...state.activeProject, files: {}, description: null }
            : state.activeProject
        }));

        toast.success('Proyecto reseteado a cero');
        return true;
      },

      rollbackFiles: async () => {
        const { activeProject, previousFiles } = get();

        if (!activeProject || !previousFiles) {
          toast.error('No hay nada que deshacer');
          return;
        }

        await get().updateProjectFiles(activeProject.id, { ...previousFiles });
        set({ previousFiles: null });
        toast.success('Cambios revertidos');
      },

      canUndo: () => !!get().previousFiles,

      getProjectFiles: async (projectId: string) => {
        const { data, error } = await supabase
          .from('studio_projects')
          .select('files')
          .eq('id', projectId)
          .single();

        if (error || !data) {
          console.error('Error fetching project files:', error);
          return null;
        }

        return normalizeFiles(data.files);
      }
    }),
    {
      name: 'genesis-project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeProject: state.activeProject
      })
    }
  )
);
