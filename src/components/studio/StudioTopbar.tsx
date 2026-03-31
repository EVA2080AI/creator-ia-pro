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
  Sparkles,
  Home,
  LayoutGrid,
  FolderOpen,
  Shield,
  CreditCard,
  Coins,
  Search,
  User,
  Globe,
  History,
  Download,
  Link2,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  credits?: number;
  userProfile?: { 
    full_name?: string; 
    avatar_url?: string; 
  } | null;
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
  credits = 0,
  userProfile
}: StudioTopbarProps) {
  return (
    <div className="flex flex-col w-full shrink-0 z-50 sticky top-0">
      {/* ── Level 1: Global Navigation ── */}
      <nav className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 relative">
        <div className="flex items-center gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-4 h-4 bg-emerald-500 rounded-sm rotate-45" />
            </div>
            <span className="text-sm font-black text-white tracking-widest uppercase">CREATOR <span className="text-emerald-500">IA</span></span>
          </div>

          <div className="h-4 w-px bg-border/40" />

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <NavLink icon={<Home className="w-3.5 h-3.5" />} label="Home" active={false} />
            <NavLink icon={<Sparkles className="w-3.5 h-3.5" />} label="Genesis" active={true} />
            <NavLink icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Studio" active={false} />
            <NavLink icon={<Layout className="w-3.5 h-3.5" />} label="Canvas" active={false} />
            <NavLink icon={<FolderOpen className="w-3.5 h-3.5" />} label="Spaces" active={false} />
            <NavLink icon={<Shield className="w-3.5 h-3.5" />} label="Admin" active={false} />
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all">
            <CreditCard className="w-3.5 h-3.5" />
            Precios
          </button>
          
          <div className="h-4 w-px bg-border/40 mx-1" />
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Coins className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-black text-emerald-500 tracking-wider">
              {credits.toLocaleString()}
            </span>
          </div>

          <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-all select-none">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-primary/20 border border-primary/20 flex items-center justify-center">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <span className="text-[11px] font-bold text-foreground">Perfil</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </nav>

      {/* ── Level 2: Project Bar ── */}
      <header className="h-[52px] border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
        {/* --- Left: Project Info --- */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-secondary/80 rounded-lg transition-all group"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">Proyectos</span>
          </button>
          
          <div className="h-4 w-px bg-border mx-1" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xs font-black text-white tracking-tight leading-none truncate max-w-[200px]">
                {projectName}
              </h1>
            </div>
            <p className="text-[9px] font-medium text-muted-foreground/60 leading-none mt-1">
              {isSaving ? 'Guardando cambios...' : 'Última versión guardada'}
            </p>
          </div>
        </div>

        {/* --- Center: Desktop/Mobile/Actions --- */}
        <div className="flex items-center gap-1.5">
          {/* View Toggles */}
          <div className="flex items-center gap-1 p-1 bg-secondary/20 rounded-xl border border-border/40 mr-4">
            <IconButton 
              active={viewMode === 'preview'} 
              onClick={() => onViewModeChange('preview')} 
              icon={<Globe className="w-3.5 h-3.5" />} 
              title="Preview"
            />
            <IconButton 
              active={false} 
              onClick={() => {}} 
              icon={<Layout className="w-3.5 h-3.5 rotate-90" />} 
              title="Layout"
            />
            <IconButton 
              active={viewMode === 'code'} 
              onClick={() => onViewModeChange('code')} 
              icon={<Code className="w-3.5 h-3.5" />} 
              title="View Code"
            />
          </div>

          {/* Device Toggles */}
          {viewMode === 'preview' && (
            <div className="flex items-center gap-1 p-1 bg-secondary/20 rounded-xl border border-border/40 mr-4">
              <IconButton 
                active={deviceMode === 'desktop'} 
                onClick={() => onDeviceModeChange('desktop')} 
                icon={<Monitor className="w-3.5 h-3.5" />} 
                title="Desktop"
              />
              <IconButton 
                active={deviceMode === 'tablet'} 
                onClick={() => onDeviceModeChange('tablet')} 
                icon={<Tablet className="w-3.5 h-3.5" />} 
                title="Tablet"
              />
              <IconButton 
                active={deviceMode === 'mobile'} 
                onClick={() => onDeviceModeChange('mobile')} 
                icon={<Smartphone className="w-3.5 h-3.5" />} 
                title="Mobile"
              />
            </div>
          )}

          {/* Sync & History */}
          <div className="flex items-center gap-1 mr-4">
            <IconButton icon={<History className="w-3.5 h-3.5" />} onClick={() => {}} title="History" />
            <IconButton icon={<Cloud className="w-3.5 h-3.5" />} onClick={onGithubSync} title="Sync" />
          </div>

          <div className="h-6 w-px bg-border/60 mx-1" />

          {/* Export & Actions */}
          <div className="flex items-center gap-2 pl-4">
            <IconButton icon={<Download className="w-3.5 h-3.5" />} onClick={() => {}} title="Download" />
            <IconButton icon={<Link2 className="w-4 h-4" />} onClick={onShare} title="Share" />
            
            <button 
              onClick={onPublish}
              className="flex items-center gap-2 px-5 h-8 rounded-full bg-primary text-white text-[11px] font-black hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 ml-2"
            >
              Publicar
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

// --- Internal Helper Components ---

function NavLink({ icon, label, active }: { icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap",
      active 
        ? "bg-secondary text-foreground shadow-sm" 
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
    )}>
      {icon}
      {label}
    </button>
  );
}

function IconButton({ icon, active, onClick, title }: { icon: React.ReactNode, active?: boolean, onClick: () => void, title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-all overflow-hidden relative group",
        active 
          ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
          : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60"
      )}
    >
      <div className={cn(
        "transition-transform",
        active ? "scale-105" : "group-hover:scale-110"
      )}>
        {icon}
      </div>
    </button>
  );
}
