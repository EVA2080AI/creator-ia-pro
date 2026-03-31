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
    <header className="h-[60px] border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-50 sticky top-0">
      {/* --- Left: Project Info (GitHub Breadcrumbs Style) --- */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1.5 hover:bg-secondary rounded-md transition-all group"
          title="Volver"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
        </button>
        
        <div className="flex items-center gap-2 text-sm font-medium">
          <Github className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">creator-ia</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-bold hover:text-primary cursor-pointer transition-colors">{projectName}</span>
          </div>
          <div className="ml-2 px-2 py-0.5 rounded-full border border-border bg-secondary/50 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
            Public
          </div>
        </div>

        {/* Save Status - Subtly on the left */}
        <div className="ml-4 flex items-center gap-2 opacity-60">
          {isSaving ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground lowercase">Guardando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground lowercase">Guardado</span>
            </div>
          )}
        </div>
      </div>

      {/* --- Center: Tabs Switcher (GitHub Style) --- */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center h-full">
        <button
          onClick={() => onViewModeChange('preview')}
          className={`flex items-center gap-2 px-4 h-full text-xs font-semibold transition-all border-b-2 ${
            viewMode === 'preview' 
              ? 'border-primary text-foreground' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => onViewModeChange('code')}
          className={`flex items-center gap-2 px-4 h-full text-xs font-semibold transition-all border-b-2 ${
            viewMode === 'code' 
              ? 'border-primary text-foreground' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Code
        </button>
        <button
          onClick={() => onViewModeChange('tools')}
          className={`flex items-center gap-2 px-4 h-full text-xs font-semibold transition-all border-b-2 ${
            viewMode === 'tools' 
              ? 'border-primary text-foreground' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tools
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
