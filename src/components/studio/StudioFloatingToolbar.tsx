import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Share2, 
  Github, 
  ChevronLeft,
  Cloud,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Code,
  Globe,
  History,
  Download,
  Link2,
  Save,
  Zap,
  FileText,
  LineChart,
  Layout,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, DeviceMode } from './StudioTopbar';

interface StudioFloatingToolbarProps {
  projectName: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  isSaving?: boolean;
  onShare?: () => void;
  onBack?: () => void;
  onGithubSync?: () => void;
  onPublish?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function StudioFloatingToolbar({
  viewMode,
  onViewModeChange,
  deviceMode,
  onDeviceModeChange,
  onShare,
  onPublish,
  onGithubSync,
  isSidebarCollapsed,
  onToggleSidebar
}: StudioFloatingToolbarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 p-2 bg-white/80 backdrop-blur-3xl border border-black/[0.05] shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Sidebar Toggle ── */}
      <button
        onClick={onToggleSidebar}
        className={cn(
          "h-10 w-10 flex items-center justify-center rounded-2xl transition-all duration-300",
          !isSidebarCollapsed 
            ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
            : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
        )}
        title="Alternar Chat Génesis"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-zinc-200/60" />

      {/* ── View Modes ── */}
      <div className="flex items-center gap-1 bg-zinc-100/50 p-1 rounded-[1.4rem]">
        <ViewButton 
          active={viewMode === 'preview'} 
          onClick={() => onViewModeChange('preview')} 
          icon={<Globe className="w-4 h-4 text-emerald-500" />} 
          label="Preview" 
        />
        <ViewButton 
          active={viewMode === 'code'} 
          onClick={() => onViewModeChange('code')} 
          icon={<Code className="w-4 h-4 text-blue-500" />} 
          label="Code" 
        />
        <ViewButton 
          active={viewMode === 'artifacts'} 
          onClick={() => onViewModeChange('artifacts')} 
          icon={<Zap className="w-4 h-4 text-amber-500" />} 
          label="Artefactos" 
        />
        <ViewButton 
          active={viewMode === 'files'} 
          onClick={() => onViewModeChange('files')} 
          icon={<FileText className="w-4 h-4 text-zinc-500" />} 
        />
        <ViewButton 
          active={viewMode === 'cloud'} 
          onClick={() => onViewModeChange('cloud')} 
          icon={<Cloud className="w-4 h-4 text-sky-500" />} 
        />
        <ViewButton 
          active={viewMode === 'nexus'} 
          onClick={() => onViewModeChange('nexus')} 
          icon={<Link2 className="w-4 h-4 text-purple-500" />} 
          label="Nexus" 
        />
        <ViewButton 
          active={viewMode === 'analytics'} 
          onClick={() => onViewModeChange('analytics')} 
          icon={<LineChart className="w-4 h-4 text-rose-500" />} 
          label="Analytics" 
        />
      </div>

      {/* ── Device Controls (Preview Only) ── */}
      {viewMode === 'preview' && (
        <>
          <div className="w-px h-6 bg-zinc-200/60" />
          <div className="flex items-center gap-1 bg-zinc-100/50 p-1 rounded-[1.4rem]">
            <IconButton 
              active={deviceMode === 'desktop'} 
              onClick={() => onDeviceModeChange('desktop')} 
              icon={<Monitor className="w-4 h-4" />} 
            />
            <IconButton 
              active={deviceMode === 'tablet'} 
              onClick={() => onDeviceModeChange('tablet')} 
              icon={<Tablet className="w-4 h-4" />} 
            />
            <IconButton 
              active={deviceMode === 'mobile'} 
              onClick={() => onDeviceModeChange('mobile')} 
              icon={<Smartphone className="w-4 h-4" />} 
            />
          </div>
        </>
      )}

      <div className="w-px h-6 bg-zinc-200/60" />

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 pr-1">
        <IconButton onClick={onGithubSync} icon={<Github className="w-4 h-4" />} title="GitHub" />
        <IconButton onClick={onShare} icon={<Share2 className="w-4 h-4" />} title="Compartir" />
        <button 
          onClick={onPublish}
          className="flex items-center gap-2 px-5 h-10 rounded-[1.4rem] bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-zinc-200 active:scale-95"
        >
          Publish
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ViewButton({ 
  icon, 
  active, 
  onClick, 
  label 
}: { 
  icon: React.ReactNode, 
  active?: boolean, 
  onClick: () => void,
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 px-3 rounded-2xl flex items-center gap-2.5 transition-all duration-300",
        active 
          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
      )}
    >
      {icon}
      {label && <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>}
    </button>
  );
}

function IconButton({ 
  icon, 
  active, 
  onClick,
  title
}: { 
  icon: React.ReactNode, 
  active?: boolean, 
  onClick: () => void,
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded-2xl transition-all duration-300",
        active 
          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" 
          : "text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
      )}
    >
      {icon}
    </button>
  );
}
