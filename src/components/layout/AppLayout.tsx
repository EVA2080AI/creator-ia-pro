import { Outlet } from 'react-router-dom';
import { SidebarGlobal } from './SidebarGlobal';
import { ContextualSidebar } from './ContextualSidebar';
import { MobileNav } from './MobileNav';
import { useSidebarKeyboard } from '@/hooks/useSidebarV2';
import { SidebarProvider } from '@/components/ui/sidebar';

/**
 * AppLayout — shared authenticated layout.
 * Structure: SidebarGlobal | <Outlet /> | ContextualSidebar
 * No AppHeader — navigation lives in the sidebar.
 */
export function AppLayout() {
  // Register Cmd+\ and Escape keyboard shortcuts
  useSidebarKeyboard();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Left global navigation sidebar */}
        <SidebarGlobal />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top navigation */}
          <MobileNav />

          {/* Main content area */}
          <main
            id="main-content"
            className="flex-1 min-w-0 overflow-auto"
            tabIndex={-1}
          >
          <Outlet />
          </main>
        </div>

        {/* Right contextual panel (Genesis IA, node props, etc.) */}
        <ContextualSidebar />
      </div>
    </SidebarProvider>
  );
}
