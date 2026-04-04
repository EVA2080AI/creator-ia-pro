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
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, DeviceMode } from './StudioTopbar'; // Keep types for now

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
}

export function StudioFloatingToolbar({
  viewMode,
  onViewModeChange,
  deviceMode,
  onDeviceModeChange,
}: Omit<StudioFloatingToolbarProps, 'projectName' | 'isSaving' | 'onShare' | 'onPublish' | 'onBack' | 'onGithubSync'>) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-2 p-1.5 bg-white/70 backdrop-blur-3xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── View Modes (Pill Style) ── */}
      <div className="flex items-center gap-1 bg-zinc-900/5 p-1 rounded-[14px]">
        <button
          onClick={() => onViewModeChange('preview')}
          className={cn(
            "h-9 px-4 rounded-xl flex items-center gap-2 transition-all duration-300",
            viewMode === 'preview' 
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" 
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Vista</span>
        </button>
        <button
          onClick={() => onViewModeChange('code')}
          className={cn(
            "h-9 px-4 rounded-xl flex items-center gap-2 transition-all duration-300",
            viewMode === 'code' 
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" 
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <Code className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Código</span>
        </button>
      </div>

      {/* ── Device Modes (Only in Preview) ── */}
      {viewMode === 'preview' && (
        <>
          <div className="w-px h-6 bg-zinc-200/60 mx-1" />
          <div className="flex items-center gap-1 bg-zinc-900/5 p-1 rounded-[14px]">
            <DeviceButton 
              active={deviceMode === 'desktop'} 
              onClick={() => onDeviceModeChange('desktop')} 
              icon={<Monitor className="w-3.5 h-3.5" />} 
            />
            <DeviceButton 
              active={deviceMode === 'tablet'} 
              onClick={() => onDeviceModeChange('tablet')} 
              icon={<Tablet className="w-3.5 h-3.5" />} 
            />
            <DeviceButton 
              active={deviceMode === 'mobile'} 
              onClick={() => onDeviceModeChange('mobile')} 
              icon={<Smartphone className="w-3.5 h-3.5" />} 
            />
          </div>
        </>
      )}
    </div>
  );
}

function DeviceButton({ 
  icon, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode, 
  active?: boolean, 
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-300",
        active 
          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" 
          : "text-zinc-400 hover:text-zinc-600"
      )}
    >
      {icon}
    </button>
  );
}

function ToolbarButton({ 
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
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
        active 
          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60" 
          : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/30"
      )}
    >
      {icon}
      {label && <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>}
    </button>
  );
}
