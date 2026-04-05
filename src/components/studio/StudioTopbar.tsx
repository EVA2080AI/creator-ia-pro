import { 
  Globe, 
  FileText, 
  Code, 
  Cloud, 
  LineChart, 
  MoreHorizontal, 
  ExternalLink, 
  RotateCcw, 
  MessageSquare, 
  Github, 
  Share2, 
  Zap, 
  History,
  Layout,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type ViewMode = 'preview' | 'code' | 'artifacts' | 'tools' | 'files' | 'cloud' | 'analytics' | 'nexus';
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
  return (
    <header className="h-[48px] w-full border-b border-black/[0.08] bg-white/[0.85] backdrop-blur-[40px] saturate-[1.2] flex items-center justify-between px-6 shrink-0 transition-all z-[100] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] selection:bg-primary/30">
      
      {/* --- Left: Context & Layout --- */}
      <div className="flex items-center gap-1">
        <IconButton icon={<History className="w-4 h-4" />} onClick={() => {}} title="Historial" />
        <IconButton icon={<Layout className="w-4 h-4" />} onClick={() => {}} title="Alternar Sidebar" />
      </div>

      {/* --- Center: Navigation & View Controls --- */}
      <div className="flex items-center gap-4 flex-1 justify-center max-w-5xl px-4">
        
        {/* Segmented View Toggles */}
        <div className="flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-inner shadow-black/20">
          <ViewToggle 
            label="Preview" 
            icon={<Globe className="w-3.5 h-3.5" />} 
            active={viewMode === 'preview'} 
            onClick={() => onViewModeChange('preview')}
            variant="success"
          />
          <ViewToggle icon={<Code className="w-3.5 h-3.5" />} active={viewMode === 'code'} onClick={() => onViewModeChange('code')} />
          <ViewToggle 
            label="Artefactos" 
            icon={<Zap className="w-3.5 h-3.5" />} 
            active={viewMode === 'artifacts'} 
            onClick={() => onViewModeChange('artifacts')} 
            variant="primary"
          />
          <ViewToggle icon={<FileText className="w-3.5 h-3.5" />} active={viewMode === 'files'} onClick={() => onViewModeChange('files')} />
          <ViewToggle icon={<Cloud className="w-3.5 h-3.5" />} active={viewMode === 'cloud'} onClick={() => onViewModeChange('cloud')} />
          <ViewToggle icon={<LineChart className="w-3.5 h-3.5" />} active={viewMode === 'analytics'} onClick={() => onViewModeChange('analytics')} />
          <ViewToggle icon={<MoreHorizontal className="w-3.5 h-3.5" />} active={false} onClick={() => {}} />
        </div>


        {/* Device Toggles (Only in Preview) */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-0.5 p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-inner shadow-black/20">
             <IconButton small active={deviceMode === 'desktop'} icon={<Monitor className="w-3.5 h-3.5" />} onClick={() => onDeviceModeChange('desktop')} />
             <IconButton small active={deviceMode === 'tablet'} icon={<Tablet className="w-3.5 h-3.5" />} onClick={() => onDeviceModeChange('tablet')} />
             <IconButton small active={deviceMode === 'mobile'} icon={<Smartphone className="w-3.5 h-3.5" />} onClick={() => onDeviceModeChange('mobile')} />
          </div>
        )}
      </div>

      {/* --- Right: Actions & Publishing --- */}
      <div className="flex items-center gap-1.5">
        <IconButton icon={<MessageSquare className="w-4 h-4" />} onClick={() => {}} title="Chat" />
        <IconButton icon={<Github className="w-4 h-4" />} onClick={onGithubSync} title="GitHub" />
        
        <div className="h-6 w-px bg-white/10 mx-1.5" />

        <button 
          onClick={onShare}
          className="flex items-center gap-2 px-4 h-9 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/10 text-[11px] font-black tracking-widest uppercase text-white transition-all active:scale-95 whitespace-nowrap shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        <button 
          className="flex items-center gap-2 px-4 h-9 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-[11px] font-black tracking-widest uppercase text-white hover:brightness-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)] whitespace-nowrap border border-white/10"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Upgrade
        </button>

        <button 
          onClick={onPublish}
          className="flex items-center px-5 h-9 rounded-2xl bg-white text-black hover:bg-zinc-200 text-[11px] font-black tracking-widest uppercase transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] whitespace-nowrap"
        >
          Publish
        </button>
      </div>
    </header>
  );
}

// --- Helper Components ---

function ViewToggle({ label, icon, active, onClick, variant }: { label?: string, icon: React.ReactNode, active: boolean, onClick: () => void, variant?: 'success' | 'primary' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300",
        active 
          ? (variant === 'success' ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]" : 
             variant === 'primary' ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
             "bg-white/[0.08] text-white shadow-lg shadow-black/40 border border-white/10") 
          : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      {icon}
      {label && <span className="hidden lg:inline">{label}</span>}
    </button>
  );
}

function IconButton({ icon, active, onClick, title, small }: { icon: React.ReactNode, active?: boolean, onClick: () => void, title?: string, small?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-xl transition-all duration-300 flex items-center justify-center",
        small ? "w-8 h-8" : "w-10 h-10",
        active 
          ? "bg-white/[0.08] text-white border border-white/10 shadow-lg shadow-black/40" 
          : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      {icon}
    </button>
  );
}
