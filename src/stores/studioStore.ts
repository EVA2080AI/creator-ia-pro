import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ViewMode = 'preview' | 'code' | 'artifacts' | 'cloud' | 'analytics' | 'nexus';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type AgentPhase = 'idle' | 'thinking' | 'streaming' | 'done';
export type AgentSpecialist = 'none' | 'architect' | 'ux' | 'frontend' | 'backend' | 'engineer';

export interface UIPlanTask {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface UIArtifact {
  id: string;
  type: 'mermaid' | 'text' | 'image';
  title: string;
  content: string;
}

export interface UILog {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  source?: string;
}

interface StudioState {
  // UI State
  viewMode: ViewMode;
  deviceMode: DeviceMode;
  activeFile: string | null;
  isSidebarCollapsed: boolean;
  isFullscreen: boolean;
  isSaving: boolean;
  isGenerating: boolean;

  // Agent State
  agentPhase: AgentPhase;
  activeSpecialist: AgentSpecialist;
  streamChars: number;
  streamPreview: string;

  // Artifacts
  artifacts: UIArtifact[];
  tasks: UIPlanTask[];
  logs: UILog[];

  // Errors
  runtimeError: string | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setActiveFile: (file: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setSaving: (saving: boolean) => void;
  setGenerating: (generating: boolean) => void;

  // Agent Actions
  setAgentPhase: (phase: AgentPhase) => void;
  setActiveSpecialist: (specialist: AgentSpecialist) => void;
  setStreamChars: (chars: number, preview: string) => void;

  // Artifact Actions
  addArtifact: (artifact: UIArtifact) => void;
  updateArtifact: (id: string, updates: Partial<UIArtifact>) => void;
  clearArtifacts: () => void;

  // Task Actions
  addTask: (task: UIPlanTask) => void;
  updateTask: (id: string, updates: Partial<UIPlanTask>) => void;
  setTasks: (tasks: UIPlanTask[]) => void;
  clearTasks: () => void;

  // Log Actions
  addLog: (log: Omit<UILog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Error Actions
  setRuntimeError: (error: string | null) => void;
  clearRuntimeError: () => void;

  // Reset
  resetStudio: () => void;
}

const initialState = {
  viewMode: 'preview' as ViewMode,
  deviceMode: 'desktop' as DeviceMode,
  activeFile: null,
  isSidebarCollapsed: false,
  isFullscreen: false,
  isSaving: false,
  isGenerating: false,
  agentPhase: 'idle' as AgentPhase,
  activeSpecialist: 'none' as AgentSpecialist,
  streamChars: 0,
  streamPreview: '',
  artifacts: [],
  tasks: [],
  logs: [],
  runtimeError: null,
};

export const useStudioStore = create<StudioState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // UI Actions
      setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),
      setDeviceMode: (mode) => set({ deviceMode: mode }, false, 'setDeviceMode'),
      setActiveFile: (file) => set({ activeFile: file }, false, 'setActiveFile'),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }), false, 'toggleSidebar'),
      setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }, false, 'setFullscreen'),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen }), false, 'toggleFullscreen'),
      setSaving: (saving) => set({ isSaving: saving }, false, 'setSaving'),
      setGenerating: (generating) => set({ isGenerating: generating }, false, 'setGenerating'),

      // Agent Actions
      setAgentPhase: (phase) => set({ agentPhase: phase }, false, 'setAgentPhase'),
      setActiveSpecialist: (specialist) => set({ activeSpecialist: specialist }, false, 'setActiveSpecialist'),
      setStreamChars: (chars, preview) => set({ streamChars: chars, streamPreview: preview }, false, 'setStreamChars'),

      // Artifact Actions
      addArtifact: (artifact) => set(
        (state) => ({ artifacts: [...state.artifacts, artifact] }),
        false,
        'addArtifact'
      ),
      updateArtifact: (id, updates) => set(
        (state) => ({
          artifacts: state.artifacts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          )
        }),
        false,
        'updateArtifact'
      ),
      clearArtifacts: () => set({ artifacts: [] }, false, 'clearArtifacts'),

      // Task Actions
      addTask: (task) => set(
        (state) => ({ tasks: [...state.tasks, task] }),
        false,
        'addTask'
      ),
      updateTask: (id, updates) => set(
        (state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          )
        }),
        false,
        'updateTask'
      ),
      setTasks: (tasks) => set({ tasks }, false, 'setTasks'),
      clearTasks: () => set({ tasks: [] }, false, 'clearTasks'),

      // Log Actions
      addLog: (log) => set(
        (state) => ({
          logs: [...state.logs, { ...log, id: crypto.randomUUID(), timestamp: new Date() }]
        }),
        false,
        'addLog'
      ),
      clearLogs: () => set({ logs: [] }, false, 'clearLogs'),

      // Error Actions
      setRuntimeError: (error) => set({ runtimeError: error }, false, 'setRuntimeError'),
      clearRuntimeError: () => set({ runtimeError: null }, false, 'clearRuntimeError'),

      // Reset
      resetStudio: () => set({
        ...initialState,
        viewMode: get().viewMode, // Preserve viewMode
      }, false, 'resetStudio'),
    }),
    { name: 'genesis-studio-store' }
  )
);
