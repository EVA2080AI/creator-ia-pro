import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStudioProjects, StudioFile } from '@/hooks/useStudioProjects';
import { StudioTopbar, ViewMode, DeviceMode } from '@/components/studio/StudioTopbar';
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioAITools } from '@/components/studio/StudioAITools';
import { Loader2, FolderOpen, Code2, Plus, Sparkles, ChevronRight, Layout } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Studio — Integrated IDE Workspace (Lovable Architecture)
 * - Topbar: Project navigation & View toggles
 * - Sidebar: Genesis AI Chat
 * - Main: Content workspace (Preview, Code or AI Tools)
 */
export default function Studio() {
  const { user } = useAuth('/auth');
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  // --- Studio State ---
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    loading: loadingProjects, 
    updateProjectFiles,
    createProject
  } = useStudioProjects();

  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamChars, setStreamChars] = useState(0);
  const [streamPreview, setStreamPreview] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Project Initialization ---
  useEffect(() => {
    if (loadingProjects) return;

    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setActiveProject(project);
      } else {
        toast.error('Proyecto no encontrado');
        navigate('/studio');
      }
    } else {
      // CLEAR active project if no ID in URL (ensures we see welcome screen)
      setActiveProject(null);
    }
  }, [projectId, projects, loadingProjects, setActiveProject, navigate]);

  // Set default active file when project changes
  useEffect(() => {
    if (activeProject && !activeFile) {
      const files = Object.keys(activeProject.files);
      if (files.includes('App.tsx')) setActiveFile('App.tsx');
      else if (files.length > 0) setActiveFile(files[0]);
    }
  }, [activeProject, activeFile]);

  // --- Handlers ---
  const handleFilesChange = async (newFiles: Record<string, StudioFile>) => {
    if (!activeProject) return;
    setIsSaving(true);
    await updateProjectFiles(activeProject.id, newFiles);
    setIsSaving(false);
  };

  const handleCodeGenerated = (newFiles: Record<string, StudioFile>) => {
    if (!activeProject) return;
    handleFilesChange(newFiles);
    if (Object.keys(newFiles).length > 0) {
      setViewMode('preview');
    }
  };

  const handleShare = () => {
    if (!activeProject) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Enlace de colaboración copiado');
  };

  const handleCreateNew = async () => {
    const project = await createProject('Nuevo Proyecto');
    if (project) {
      navigate(`/studio?project=${project.id}`);
    }
  };

  if (loadingProjects) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-sm font-medium animate-pulse">Iniciando Genesis Studio...</p>
      </div>
    );
  }

  // --- Welcome Screen / Empty State ---
  if (!activeProject) {
    return (
      <div className="h-full w-full bg-background overflow-hidden flex flex-col relative selection:bg-primary/30">
        {/* Animated background background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[80%] bg-primary/10 rounded-full blur-[160px] opacity-40" />
          <div className="absolute bottom-[0%] right-[-5%] w-[60%] h-[70%] bg-emerald-500/5 rounded-full blur-[140px] opacity-20" />
        </div>

        {/* Minimal Navigation */}
        <header className="h-[60px] px-6 flex items-center justify-between border-b border-zinc-200 bg-white relative z-20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Code2 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-black text-zinc-900 tracking-widest uppercase">Studio</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-all">Volver al Dashboard</button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col pt-12 pb-24">
            
            {/* Hero Section */}
            <div className="flex flex-col items-start mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 group cursor-default">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Entorno de Desarrollo Profesional</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4 max-w-2xl leading-tight">
                Construye el futuro de la web <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">con Studio.</span>
              </h1>
              <p className="text-lg text-zinc-500 max-w-xl mb-10 leading-relaxed font-medium font-display">
                Crea, diseña y despliega aplicaciones completas en minutos. Todo desde una interfaz diseñada para la velocidad.
              </p>

              <button
                onClick={handleCreateNew}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Empezar nuevo proyecto
              </button>
            </div>

            {/* Recents Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="col-span-full border-b border-zinc-200 pb-4 mb-4">
                <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Proyectos Recientes</h2>
              </div>

              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/studio?project=${p.id}`)}
                  className="group relative flex flex-col gap-4 p-5 rounded-3xl bg-zinc-50 border border-zinc-200 hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <FolderOpen className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">{p.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{Object.keys(p.files).length} Archivos</p>
                  </div>
                </button>
              ))}

              {projects.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-200 rounded-3xl">
                  <Layout className="w-12 h-12 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No hay proyectos activos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      <Helmet><title>Studio | Creator IA Pro</title></Helmet>
import { StudioFloatingToolbar } from '@/components/studio/StudioFloatingToolbar';

// ... inside Studio component ...

      {/* ── Floating Toolbar (Replaces Topbar for Headerless Architecture) ── */}
      {!isFullscreen && (
        <StudioFloatingToolbar 
          projectName={activeProject.name}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          deviceMode={deviceMode}
          onDeviceModeChange={(m) => setDeviceMode(m as DeviceMode)}
          isSaving={isSaving}
          onShare={handleShare}
          onBack={() => navigate('/studio')}
          onGithubSync={() => toast.info('Sincronización con GitHub próximamente')}
          onPublish={() => toast.info('Publicación próximamente')}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Chat (Genesis) ── */}
        <div 
          className={cn(
            "shrink-0 border-r border-border bg-background flex flex-col relative z-20 transition-all duration-300",
            isSidebarCollapsed ? "w-0 opacity-0 -translate-x-full" : "w-[410px] opacity-100 translate-x-0"
          )}
        >
          <StudioChat 
            projectId={activeProject.id} 
            projectFiles={activeProject.files}
            onCodeGenerated={handleCodeGenerated}
            onGeneratingChange={setIsGenerating}
            onStreamCharsChange={(chars, preview) => {
              setStreamChars(chars);
              setStreamPreview(preview);
            }}
          />
        </div>

        {/* ── Main Workspace: Preview, Code or Tools ──────────────────────────────── */}
        <div className="flex-1 overflow-hidden bg-background/20 relative">
          {viewMode === 'preview' ? (
            <div className="h-full w-full flex flex-col items-center justify-center">
              <div className={cn(
                "h-full w-full transition-all duration-500 ease-in-out flex items-center justify-center",
                deviceMode === 'mobile' ? "max-w-[375px]" : deviceMode === 'tablet' ? "max-w-[768px]" : "max-w-full"
              )}>
                <StudioPreview 
                  files={activeProject.files} 
                  isGenerating={isGenerating}
                  deviceMode={deviceMode as any}
                  onDeviceModeChange={setDeviceMode as any}
                  viewMode="preview"
                  onToggleViewMode={(m) => setViewMode(m as any)}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                  onShare={handleShare}
                />
              </div>
            </div>
          ) : viewMode === 'code' ? (
            <div className="flex h-full w-full">
              {/* File Tree - Glass Effect */}
              <div className="w-64 shrink-0 border-r border-border bg-card/30 backdrop-blur-sm">
                <StudioFileTree 
                  files={activeProject.files} 
                  selectedFile={activeFile || ''} 
                  onSelect={setActiveFile} 
                />
              </div>
              
              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <StudioCodeEditor 
                  selectedFile={activeFile || ''}
                  projectFiles={activeProject.files}
                  onFilesChange={handleFilesChange}
                  isGenerating={isGenerating}
                  streamPreview={streamPreview}
                />
              </div>
            </div>
          ) : (
            /* Tools View Mode */
            <div className="h-full w-full overflow-hidden">
              <StudioAITools />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility local for cn
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
