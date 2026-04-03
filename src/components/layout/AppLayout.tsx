import { Outlet } from 'react-router-dom';
import { SidebarGlobal } from './SidebarGlobal';
import { ContextualSidebar } from './ContextualSidebar';
import { useSidebarKeyboard } from '@/hooks/useSidebarV2';

/**
 * AppLayout — shared authenticated layout.
 * Structure: SidebarGlobal | <Outlet /> | ContextualSidebar
 * No AppHeader — navigation lives in the sidebar.
 */
export function AppLayout() {
  // Register Cmd+\ and Escape keyboard shortcuts
  useSidebarKeyboard();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left global navigation sidebar */}
      <SidebarGlobal />

      {/* Main content area */}
      <main
        id="main-content"
        className="flex-1 min-w-0 overflow-auto"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {/* Right contextual panel (Genesis IA, node props, etc.) */}
      <ContextualSidebar />
    </div>
  );
}
