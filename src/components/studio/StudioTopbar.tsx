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

export type ViewMode = 'preview' | 'code' | 'tools' | 'files' | 'cloud' | 'analytics';
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
    <header className="h-[52px] w-full border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-4 shrink-0 transition-all z-[100] selection:bg-primary/30">
      
      {/* --- Left: Context & Layout --- */}
      <div className="flex items-center gap-1">
        <IconButton icon={<History className="w-4 h-4" />} onClick={() => {}} title="Historial" />
        <IconButton icon={<Layout className="w-4 h-4" />} onClick={() => {}} title="Alternar Sidebar" />
      </div>

      {/* --- Center: Navigation & View Controls --- */}
      <div className="flex items-center gap-4 flex-1 justify-center max-w-4xl px-4">
        
        {/* Segmented View Toggles */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
          <ViewToggle 
            label="Preview" 
            icon={<Globe className="w-3.5 h-3.5" />} 
            active={viewMode === 'preview'} 
            onClick={() => onViewModeChange('preview')}
            variant="success"
          />
          <ViewToggle icon={<FileText className="w-3.5 h-3.5" />} active={viewMode === 'files'} onClick={() => onViewModeChange('files')} />
          <ViewToggle icon={<Code className="w-3.5 h-3.5" />} active={viewMode === 'code'} onClick={() => onViewModeChange('code')} />
          <ViewToggle icon={<Cloud className="w-3.5 h-3.5" />} active={viewMode === 'cloud'} onClick={() => onViewModeChange('cloud')} />
          <ViewToggle icon={<LineChart className="w-3.5 h-3.5" />} active={viewMode === 'analytics'} onClick={() => onViewModeChange('analytics')} />
          <ViewToggle icon={<MoreHorizontal className="w-3.5 h-3.5" />} active={false} onClick={() => {}} />
        </div>

        {/* URL / Path Bar */}
        <div className="flex-1 max-w-[400px] h-8 flex items-center gap-2 px-3 bg-white/5 border border-white/10 rounded-xl group hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 text-zinc-500">
             <Layout className="w-3.5 h-3.5" />
             <span className="text-[11px] font-mono opacity-40">/</span>
          </div>
          <input 
            type="text" 
            readOnly 
            value={projectName.toLowerCase().replace(/\s+/g, '-')} 
            className="flex-1 bg-transparent border-none outline-none text-[12px] font-medium text-zinc-400 cursor-default"
          />
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </button>
            <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
              <RotateCcw className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Device Toggles (Only in Preview) */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-0.5 p-1 bg-white/5 border border-white/10 rounded-xl">
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
          className="flex items-center gap-2 px-3 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-black text-zinc-300 transition-all active:scale-95 whitespace-nowrap"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        <button 
          className="flex items-center gap-2 px-3 h-8 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-[11px] font-black text-white hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Upgrade
        </button>

        <button 
          onClick={onPublish}
          className="flex items-center px-4 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.2)] whitespace-nowrap"
        >
          Publish
        </button>
      </div>
    </header>
  );
}

// --- Helper Components ---

function ViewToggle({ label, icon, active, onClick, variant }: { label?: string, icon: React.ReactNode, active: boolean, onClick: () => void, variant?: 'success' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200",
        active 
          ? (variant === 'success' ? "bg-blue-500/10 text-blue-400" : "bg-white/10 text-white shadow-lg shadow-black/20") 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
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
        "rounded-lg transition-all flex items-center justify-center",
        small ? "w-7 h-7" : "w-9 h-9",
        active 
          ? "bg-white/10 text-white border border-white/10 shadow-lg shadow-black/20" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      )}
    >
      {icon}
    </button>
  );
}
