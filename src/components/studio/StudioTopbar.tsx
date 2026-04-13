import {
  Globe, FileText, Code, Zap, Github, Share2,
  Monitor, Tablet, Smartphone, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export type ViewMode = 'preview' | 'code' | 'artifacts' | 'files' | 'cloud' | 'nexus' | 'analytics';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StudioTopbarProps {
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
}

export function StudioTopbar({
  projectName,
  viewMode,
  onViewModeChange,
  deviceMode,
  onDeviceModeChange,
  isSaving,
  onShare,
  onBack,
  onGithubSync,
  onPublish
}: StudioTopbarProps) {
  const navigate = useNavigate();

  return (
    <header className="h-[48px] w-full border-b border-zinc-100 bg-white flex items-center justify-between px-4 shrink-0 z-[100]">

      {/* Left: Back + Project Name */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[12px] font-bold text-zinc-700 truncate max-w-[160px]">
          {projectName}
        </span>
        {isSaving && (
          <span className="text-[9px] text-primary font-bold uppercase tracking-widest animate-pulse">Sync</span>
        )}
      </div>

      {/* Center: View Toggles */}
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-xl p-0.5">
          <ViewToggle label="Preview" icon={<Globe className="w-3.5 h-3.5" />} active={viewMode === 'preview'} onClick={() => onViewModeChange('preview')} />
          <ViewToggle label="Code" icon={<Code className="w-3.5 h-3.5" />} active={viewMode === 'code'} onClick={() => onViewModeChange('code')} />
          <ViewToggle label="Consola" icon={<Zap className="w-3.5 h-3.5" />} active={viewMode === 'artifacts'} onClick={() => onViewModeChange('artifacts')} />
          <ViewToggle icon={<FileText className="w-3.5 h-3.5" />} active={viewMode === 'files'} onClick={() => onViewModeChange('files')} />
        </div>

        {viewMode === 'preview' && (
          <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-xl p-0.5 ml-2">
            <DeviceToggle active={deviceMode === 'desktop'} icon={<Monitor className="w-3.5 h-3.5" />} onClick={() => onDeviceModeChange('desktop')} />
            <DeviceToggle active={deviceMode === 'tablet'} icon={<Tablet className="w-3.5 h-3.5" />} onClick={() => onDeviceModeChange('tablet')} />
            <DeviceToggle active={deviceMode === 'mobile'} icon={<Smartphone className="w-3.5 h-3.5" />} onClick={() => onDeviceModeChange('mobile')} />
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 rounded-xl p-0.5 mr-2">
          <button onClick={onGithubSync} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all" title="GitHub">
            <Github className="w-3.5 h-3.5" />
          </button>
          <button onClick={onShare} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all" title="Compartir">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button 
          onClick={onPublish} 
          className="h-9 px-4 rounded-xl bg-zinc-900 text-white flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden shadow-xl"
        >
          {/* Subtle pulse for the "Live" vibe */}
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/20" />
          <span className="text-[10px] font-black uppercase tracking-[0.05em] italic">Push to Cloud</span>
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
        </button>
      </div>
    </header>
  );
}

function ViewToggle({ label, icon, active, onClick }: { label?: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
        active ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400 hover:text-zinc-600"
      )}
    >
      {icon}
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  );
}

function DeviceToggle({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
        active ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400 hover:text-zinc-600"
      )}
    >
      {icon}
    </button>
  );
}
