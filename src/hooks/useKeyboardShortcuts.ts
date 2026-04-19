import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === e.ctrlKey;
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;
        const metaMatch = !!shortcut.meta === e.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          if (shortcut.stopPropagation) {
            e.stopPropagation();
          }
          shortcut.handler(e);
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts preset
export function useCommonShortcuts({
  onSearch,
  onNew,
  onSave,
  onClose,
  onUndo,
  onRedo,
  onHelp,
}: {
  onSearch?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  onClose?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onHelp?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [
    ...(onSearch ? [{ key: 'k', meta: true, handler: onSearch }] : []),
    ...(onNew ? [{ key: 'n', meta: true, handler: onNew }] : []),
    ...(onSave ? [{ key: 's', meta: true, handler: onSave }] : []),
    ...(onClose ? [{ key: 'w', meta: true, handler: onClose }] : []),
    ...(onUndo ? [{ key: 'z', meta: true, handler: onUndo }] : []),
    ...(onRedo ? [{ key: 'z', meta: true, shift: true, handler: onRedo }] : []),
    ...(onHelp ? [{ key: '?', shift: true, handler: onHelp }] : []),
  ];

  useKeyboardShortcuts(shortcuts as ShortcutConfig[]);
}

// Focus management
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
}

// Escape key handler
export function useEscapeKey(handler: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handler, isActive]);
}
