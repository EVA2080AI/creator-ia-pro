import * as React from 'react';
import { PanelLeft, Monitor, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface StudioViewToolbarProps {
  viewMode: 'preview' | 'code';
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleViewMode: (mode: 'preview' | 'code') => void;
}

export function StudioViewToolbar({
  viewMode,
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleViewMode,
}: StudioViewToolbarProps) {
  return (
    <div 
      className={cn(
        "h-12 w-full shrink-0 flex items-center justify-between px-4 z-40 transition-all duration-300",
        "bg-zinc-950/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl"
      )}
    >
      {/* ── Left: Sidebar Toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "h-9 w-9 text-zinc-500 hover:text-white hover:bg-white/5 transition-all rounded-xl",
            isSidebarCollapsed && "bg-white/10 text-white"
          )}
        >
          <PanelLeft className="h-4.5 w-4.5" />
        </Button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] select-none">
          Genesis Studio <span className="text-zinc-700 mx-1">/</span> <span className="text-white/60">V3.0</span>
        </span>
      </div>

      {/* ── Right: Preview/Code Switcher ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(val) => val && onToggleViewMode(val as 'preview' | 'code')}
          className="bg-black/40 p-1 rounded-xl border border-white/5 h-10 shadow-inner"
        >
          <ToggleGroupItem 
            value="preview" 
            className="h-8 px-4 text-[11px] font-black gap-2 uppercase tracking-widest data-[state=on]:bg-white/10 data-[state=on]:text-white data-[state=on]:shadow-xl rounded-lg transition-all text-zinc-500"
          >
            <Monitor className="h-3.5 w-3.5" />
            Vista
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="code" 
            className="h-8 px-4 text-[11px] font-black gap-2 uppercase tracking-widest data-[state=on]:bg-white/10 data-[state=on]:text-white data-[state=on]:shadow-xl rounded-lg transition-all text-zinc-500"
          >
            <FileCode className="h-3.5 w-3.5" />
            Código
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
