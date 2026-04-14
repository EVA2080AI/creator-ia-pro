// Genesis State Management - Zustand Stores
// Unified state architecture for Creator IA Pro

export { useProjectStore, type StudioProject, type StudioFile } from './projectStore';
export {
  useStudioStore,
  type ViewMode,
  type DeviceMode,
  type AgentPhase,
  type AgentSpecialist,
  type UIPlanTask,
  type UIArtifact,
  type UILog
} from './studioStore';
export {
  useChatStore,
  type Message,
  type ChatSession
} from './chatStore';
export {
  usePluginStore,
  type TemplateCategory,
  type GenesisTemplate,
  type GenesisPlugin,
  type PluginRegistry
} from './pluginStore';

// Composed hooks for common patterns
import { useProjectStore } from './projectStore';
import { useStudioStore } from './studioStore';
import { useChatStore } from './chatStore';

/**
 * Reset all Genesis stores - useful for logout or project switch
 */
export function resetAllStores() {
  useProjectStore.setState({
    activeProject: null,
    previousFiles: null
  });
  useStudioStore.getState().resetStudio();
  useChatStore.setState({
    messages: [],
    input: '',
    pendingImage: null,
    pendingUrl: null,
    pendingContext: null,
  });
}

/**
 * Initialize a new project session
 */
export function initializeProjectSession(projectId: string) {
  const chatStore = useChatStore.getState();
  const studioStore = useStudioStore.getState();

  // Load existing conversation
  chatStore.loadConversation(projectId);

  // Reset studio state but keep view preferences
  studioStore.setAgentPhase('idle');
  studioStore.setActiveSpecialist('none');
  studioStore.clearArtifacts();
  studioStore.clearTasks();
  studioStore.clearLogs();
  studioStore.setRuntimeError(null);
}
