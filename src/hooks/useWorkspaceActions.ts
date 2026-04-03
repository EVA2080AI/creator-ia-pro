import { create } from 'zustand';

export interface WorkspaceAction {
  id: string;
  label: string;
  icon: any; // Lucide icon component
  onClick: () => void;
  active?: boolean;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  tooltip?: string;
}

export interface WorkspaceActionGroup {
  id: string;
  label?: string;
  actions: WorkspaceAction[];
}

interface WorkspaceActionsState {
  /** Groups of actions to show in the sidebar */
  groups: WorkspaceActionGroup[];
  /** Optional title for the workspace section */
  workspaceTitle?: string;
  /** Clear all actions (call on unmount) */
  clearActions: () => void;
  /** Set the workspace actions */
  setActions: (groups: WorkspaceActionGroup[], title?: string) => void;
}

export const useWorkspaceActions = create<WorkspaceActionsState>((set) => ({
  groups: [],
  workspaceTitle: undefined,

  clearActions: () => set({ groups: [], workspaceTitle: undefined }),
  
  setActions: (groups, title) => set({ groups, workspaceTitle: title }),
}));
