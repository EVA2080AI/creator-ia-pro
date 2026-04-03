import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

export type ContextualPanel = 'genesis' | 'node-properties' | 'settings' | 'history' | null;

interface SidebarV2State {
  /** Whether the global left sidebar is expanded (vs. icon-only) */
  globalExpanded: boolean;
  /** Which contextual right panel is open */
  activeContextual: ContextualPanel;
  /** Arbitrary payload for the contextual panel (e.g. node data) */
  contextualPayload: unknown;

  // Actions
  toggleGlobal: () => void;
  setGlobalExpanded: (expanded: boolean) => void;
  openContextual: (id: ContextualPanel, payload?: unknown) => void;
  closeContextual: () => void;
  toggleContextual: (id: ContextualPanel, payload?: unknown) => void;
}

export const useSidebarV2 = create<SidebarV2State>()(
  persist(
    (set, get) => ({
      globalExpanded: true,
      activeContextual: null,
      contextualPayload: null,

      toggleGlobal: () =>
        set((s) => ({ globalExpanded: !s.globalExpanded })),

      setGlobalExpanded: (expanded) =>
        set({ globalExpanded: expanded }),

      openContextual: (id, payload = null) =>
        set({ activeContextual: id, contextualPayload: payload }),

      closeContextual: () =>
        set({ activeContextual: null, contextualPayload: null }),

      toggleContextual: (id, payload = null) => {
        const { activeContextual } = get();
        if (activeContextual === id) {
          set({ activeContextual: null, contextualPayload: null });
        } else {
          set({ activeContextual: id, contextualPayload: payload });
        }
      },
    }),
    {
      name: 'creator-ia-sidebar-v2',
      // Only persist global sidebar state, not contextual panel
      partialize: (s) => ({ globalExpanded: s.globalExpanded }),
    }
  )
);

/**
 * Register keyboard shortcuts for the sidebar.
 * Call this once in AppLayout.
 */
export function useSidebarKeyboard() {
  const { toggleGlobal, closeContextual, activeContextual } = useSidebarV2();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+\ (Mac) / Ctrl+\ (Windows) → toggle global sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleGlobal();
      }
      // Escape → close contextual panel
      if (e.key === 'Escape' && activeContextual) {
        e.preventDefault();
        closeContextual();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleGlobal, closeContextual, activeContextual]);
}
