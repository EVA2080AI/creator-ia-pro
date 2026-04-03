import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarV2, type ContextualPanel } from '@/hooks/useSidebarV2';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';

// Lazy-loaded panels — we import them inline to keep the bundle split
// (GenesisPanel will be a dedicated component after Phase 4)
function PanelPlaceholder({ id }: { id: ContextualPanel }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
          {id === 'genesis' && <Brain className="w-5 h-5 text-primary" />}
          {id === 'history' && <History className="w-5 h-5 text-primary" />}
          {id === 'settings' && <Settings className="w-5 h-5 text-primary" />}
          {id === 'node-properties' && <Settings className="w-5 h-5 text-primary" />}
        </div>
        <p className="text-[13px] font-semibold text-zinc-700 capitalize">
          {id === 'genesis' ? 'Genesis IA' : id}
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">Panel cargando…</p>
      </div>
    </div>
  );
}

const PANEL_LABELS: Record<string, string> = {
  genesis: 'Genesis IA',
  history: 'Historial',
  settings: 'Configuración',
  'node-properties': 'Propiedades del nodo',
};

const PANEL_ICONS: Record<string, typeof Brain> = {
  genesis: Brain,
  history: History,
  settings: Settings,
  'node-properties': Settings,
};

export function ContextualSidebar() {
  const { activeContextual, closeContextual, contextualPayload } = useSidebarV2();
  const isMobile = useIsMobile();
  const isOpen = activeContextual !== null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeContextual();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeContextual]);

  const PanelIcon = activeContextual ? (PANEL_ICONS[activeContextual] ?? Settings) : Settings;
  const panelLabel = activeContextual ? (PANEL_LABELS[activeContextual] ?? activeContextual) : '';

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
          <PanelIcon className="w-4 h-4 text-primary" />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-zinc-800 truncate">
          {panelLabel}
        </span>
        <button
          onClick={closeContextual}
          aria-label="Cerrar panel"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <PanelPlaceholder id={activeContextual} />
      </div>
    </div>
  );

  // Mobile: Sheet overlay
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeContextual()}>
        <SheetContent side="right" className="w-full max-w-[400px] p-0 bg-white border-l border-zinc-200">
          {panelContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: slide-in panel
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="contextual"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0, 0.08, 1] }}
          className="relative z-20 h-screen border-l border-zinc-200 bg-white overflow-hidden shrink-0"
          aria-label={panelLabel}
        >
          <div className="w-[400px] h-full">
            {panelContent}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
