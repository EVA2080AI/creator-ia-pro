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
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <SidebarGlobal />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* ── Mobile Floating Trigger (Headerless Design) ── */}
        <div className="md:hidden fixed top-4 left-4 z-[60]">
          <Sheet>
            <SheetTrigger asChild>
              <button 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/60 shadow-lg text-zinc-600 hover:text-zinc-900 active:scale-90 transition-all"
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
          className="flex-1 min-w-0 overflow-auto pt-0"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
