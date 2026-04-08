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
  // Use explicit return to help the parser
  return (
    <div className={cn(
      "h-14 w-full shrink-0 flex items-center justify-between px-6 z-40 bg-white border-t border-zinc-100 shadow-sm"
    )}>
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "h-10 w-10 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all rounded-2xl",
            isSidebarCollapsed && "bg-zinc-100 text-zinc-900 shadow-inner"
          )}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <div className="w-[1px] h-5 bg-zinc-100 mx-1" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] select-none">
          Génesis Studio <span className="text-zinc-200 mx-2">{'\u002F'}</span> <span className="text-primary font-black">v21.0</span>
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(val) => { if (val) onToggleViewMode(val as 'preview' | 'code'); }}
          className="bg-zinc-50 p-1 rounded-2xl border border-zinc-100 h-11"
        >
          <ToggleGroupItem 
            value="preview" 
            className="h-9 px-5 text-[11px] font-bold gap-2 uppercase tracking-[0.2em] data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-xl transition-all text-zinc-400"
          >
            <Monitor className="h-3.5 w-3.5" />
            Vista
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="code" 
            className="h-9 px-5 text-[11px] font-bold gap-2 uppercase tracking-[0.2em] data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-xl transition-all text-zinc-400"
          >
            <FileCode className="h-3.5 w-3.5" />
            Código
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
