import * as React from 'react';
import {
  PanelLeft,
  RotateCcw,
  Download,
  Play,
  Share2,
  Maximize2,
  Minimize2,
  ChevronDown,
  Copy,
  FileCode,
  Monitor,
  PanelRightClose,
  MoreHorizontal,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';

export interface StudioViewToolbarProps {
  currentVersion?: string;
  currentViewName?: string;
  viewMode: 'preview' | 'code';
  isSidebarCollapsed: boolean;
  isFullscreen: boolean;
  
  onToggleSidebar: () => void;
  onToggleFullscreen: () => void;
  onVersionChange?: (version: string) => void;
  onViewChange?: (view: string) => void;
  onRefresh: () => void;
  onCopyToFigma: () => void;
  onDownload: () => void;
  onToggleViewMode: (mode: 'preview' | 'code') => void;
  onRun: () => void;
  onShare: () => void;
  onToggleRightPanel?: () => void;
}

export function StudioViewToolbar({
  currentVersion = 'v1',
  currentViewName = 'Dashboard',
  viewMode,
  isSidebarCollapsed,
  isFullscreen,
  onToggleSidebar,
  onToggleFullscreen,
  onVersionChange,
  onViewChange,
  onRefresh,
  onCopyToFigma,
  onDownload,
  onToggleViewMode,
  onRun,
  onShare,
  onToggleRightPanel,
}: StudioViewToolbarProps) {
  return (
    <div 
      className={cn(
        "h-11 w-full shrink-0 flex items-center justify-between px-3 z-40 transition-all duration-300",
        "bg-white/80 backdrop-blur-xl border-b border-slate-200",
        isFullscreen && "fixed top-0 left-0 right-0"
      )}
    >
      {/* ── Group 1: Sidebar & Context (Left) ────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "h-8 w-8 text-slate-500 hover:text-slate-900 transition-colors",
            isSidebarCollapsed && "bg-slate-100"
          )}
          title="Toggle Sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />

        {/* Version Selector */}
        <Select value={currentVersion} onValueChange={onVersionChange}>
          <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100/50 px-2 py-0 focus:ring-0 gap-1.5 transition-all">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">VER</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-xl">
            <SelectItem value="v1" className="text-xs">V1 · Initial Draft</SelectItem>
            <SelectItem value="v2" className="text-xs">V2 · Updated UI</SelectItem>
            <SelectItem value="v3" className="text-xs">V3 · New Features</SelectItem>
          </SelectContent>
        </Select>

        <ChevronRight className="h-3 w-3 text-slate-300" />

        {/* Page/View Selector */}
        <Select value={currentViewName} onValueChange={onViewChange}>
          <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100/50 px-2 py-0 focus:ring-0 gap-1.5 transition-all">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{currentViewName}</span>
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-xl">
            <SelectItem value="Dashboard" className="text-xs">Dashboard</SelectItem>
            <SelectItem value="Settings" className="text-xs">Settings</SelectItem>
            <SelectItem value="Profile" className="text-xs">Profile</SelectItem>
            <SelectItem value="Analytics" className="text-xs">Analytics</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors"
          title="Refresh view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Group 2: Actions & View (Right) ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        
        {/* Export / Split Button */}
        <div className="flex items-center bg-slate-100/50 rounded-lg p-0.5 border border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopyToFigma}
            className="h-7 px-2.5 gap-2 text-xs font-bold text-slate-700 hover:bg-white hover:text-slate-900 transition-all rounded-md"
          >
            <Zap className="h-3.5 w-3.5 text-primary fill-primary/10" />
            Copy to Figma
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-6 hover:bg-white rounded-md p-0">
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-200">
              <DropdownMenuItem onClick={onCopyToFigma} className="text-xs gap-2">
                <Copy className="h-4 w-4" /> Copy SVG
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2">
                <FileCode className="h-4 w-4" /> Copy React Component
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs">Export to Studio Flow</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDownload}
          className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all lg:flex hidden"
          title="Download assets"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />

        {/* Segmented Control: Preview/Code */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(val) => val && onToggleViewMode(val as 'preview' | 'code')}
          className="bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 h-8"
        >
          <ToggleGroupItem 
            value="preview" 
            className="h-7 px-3 text-xs font-bold gap-2 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm rounded-md transition-all"
          >
            <Monitor className="h-3.5 w-3.5" />
            Preview
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="code" 
            className="h-7 px-3 text-xs font-bold gap-2 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm rounded-md transition-all"
          >
            <FileCode className="h-3.5 w-3.5" />
            Code
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200 lg:flex hidden" />

        {/* Global Controls */}
        <div className="lg:flex hidden items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRun}
            className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            title="Run Project"
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-8 w-8 text-slate-500 hover:text-slate-900 transition-all",
              isFullscreen && "text-primary"
            )}
            title="Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRightPanel}
            className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-all"
            title="Collapse Right Panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile More Actions */}
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden flex">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
