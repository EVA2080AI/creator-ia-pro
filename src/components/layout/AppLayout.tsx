import { Outlet } from 'react-router-dom';
import { SidebarGlobal } from './SidebarGlobal';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

/**
 * AppLayout
 * 
 * The main structural wrapper for authenticated platform pages.
 * Implements a 100% headerless architecture:
 * - Desktop: SidebarGlobal (fixed/collapsible) + Scrollable Main Content
 * - Mobile: Floating Menu Button + SidebarGlobal (Drawer)
 */
export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-background font-sans overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <SidebarGlobal />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* ── Mobile Floating Trigger (Headerless Design) ── */}
        {/* top-4 fijo queda debajo del notch/status bar en iPhone — mismo
            bug que ya se arregló en el drawer de Basalt, reabierto acá
            (auditoría UX 2026-09-29). */}
        <div className="md:hidden fixed left-4 z-[60]" style={{ top: "calc(1rem + env(safe-area-inset-top))" }}>
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px] border-r-0 shadow-2xl">
              <SidebarGlobal isMobile />
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Main Content ── */}
        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-auto pt-0 focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
