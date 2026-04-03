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
}: StudioFloatingToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 bg-white/80 backdrop-blur-xl border border-zinc-200/60 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Project & Status ── */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-50 border border-zinc-200/40 rounded-xl">
        <button 
          onClick={onBack}
          className="p-1 hover:bg-zinc-200/50 rounded-lg transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900" />
        </button>
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[10px] font-black text-zinc-900 truncate max-w-[120px] uppercase tracking-wider">{projectName}</span>
          <span className="text-[8px] font-bold text-zinc-400 uppercase">
            {isSaving ? 'Guardando...' : 'Guardado'}
          </span>
        </div>
      </div>

      <div className="w-px h-8 bg-zinc-200/60 mx-1" />

      {/* ── View Modes ── */}
      <div className="flex items-center gap-1 p-1 bg-zinc-50 border border-zinc-200/40 rounded-xl">
        <ToolbarButton 
          active={viewMode === 'preview'} 
          onClick={() => onViewModeChange('preview')} 
          icon={<Globe className="w-4 h-4" />} 
          label="Vista"
        />
        <ToolbarButton 
          active={viewMode === 'code'} 
          onClick={() => onViewModeChange('code')} 
          icon={<Code className="w-4 h-4" />} 
          label="Código"
        />
      </div>

      {/* ── Device Modes (Only in Preview) ── */}
      {viewMode === 'preview' && (
        <>
          <div className="w-px h-8 bg-zinc-200/60 mx-1" />
          <div className="flex items-center gap-1 p-1 bg-zinc-50 border border-zinc-200/40 rounded-xl">
            <ToolbarButton 
              active={deviceMode === 'desktop'} 
              onClick={() => onDeviceModeChange('desktop')} 
              icon={<Monitor className="w-4 h-4" />} 
            />
            <ToolbarButton 
              active={deviceMode === 'tablet'} 
              onClick={() => onDeviceModeChange('tablet')} 
              icon={<Tablet className="w-4 h-4" />} 
            />
            <ToolbarButton 
              active={deviceMode === 'mobile'} 
              onClick={() => onDeviceModeChange('mobile')} 
              icon={<Smartphone className="w-4 h-4" />} 
            />
          </div>
        </>
      )}

      <div className="w-px h-8 bg-zinc-200/60 mx-1" />

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 pr-1">
        <button 
          onClick={onShare}
          className="p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-all"
          title="Compartir"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button 
          onClick={onPublish}
          className="flex items-center gap-2 px-6 h-10 rounded-xl bg-zinc-900 text-white text-[11px] font-black hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
          Publicar
        </button>
      </div>
    </div>
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
