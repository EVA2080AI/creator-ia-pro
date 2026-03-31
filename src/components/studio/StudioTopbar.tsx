import { 
  Layout, 
  Code, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Share2, 
  Github, 
  ChevronLeft,
  Cloud,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type ViewMode = 'preview' | 'code' | 'tools';
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
  onPublish,
}: StudioTopbarProps) {
  return (
    <header className="h-[60px] border-b border-white/[0.06] bg-[#0A0B10]/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-50">
      {/* --- Left: Project Info --- */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-xl transition-all group"
        >
          <ChevronLeft className="w-5 h-5 text-white/40 group-hover:text-white" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Layout className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Proyecto</span>
              <ChevronRight className="w-3 h-3 text-white/10" />
              <span className="text-sm font-bold text-white truncate max-w-[150px]">{projectName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isSaving ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-[10px] text-white/20 font-medium lowercase">Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                  <span className="text-[10px] text-white/20 font-medium lowercase">Todo guardado</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Center: View Switcher --- */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl shadow-2xl">
        <button
          onClick={() => onViewModeChange('preview')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'preview' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' 
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => onViewModeChange('code')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'code' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' 
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Código
        </button>
        <button
          onClick={() => onViewModeChange('tools')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'tools' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' 
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Herramientas
        </button>
      </div>

      {/* --- Right: Device & Actions --- */}
      <div className="flex items-center gap-3">
        {/* Device Mode Switcher (only in preview) */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl mr-2">
            <button
              onClick={() => onDeviceModeChange('desktop')}
              className={`p-1.5 rounded-lg transition-all ${deviceMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
              title="Escritorio"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeviceModeChange('tablet')}
              className={`p-1.5 rounded-lg transition-all ${deviceMode === 'tablet' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeviceModeChange('mobile')}
              className={`p-1.5 rounded-lg transition-all ${deviceMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
              title="Móvil"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-white/[0.1] pl-3">
          <button 
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all group"
          >
            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Compartir</span>
          </button>

          <button 
            onClick={onGithubSync}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all group"
            title="Sincronizar GitHub"
          >
            <Github className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onPublish}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Cloud className="w-4 h-4" />
            <span className="text-xs">Publicar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
