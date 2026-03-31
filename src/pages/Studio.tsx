import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStudioProjects, StudioFile } from '@/hooks/useStudioProjects';
import { StudioTopbar, ViewMode, DeviceMode } from '@/components/studio/StudioTopbar';
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { Loader2, FolderOpen, Code2, Plus, Sparkles, ChevronRight, Layout } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Studio — Integrated IDE Workspace (Lovable Architecture)
 * - Topbar: Project navigation & View toggles
 * - Sidebar: Genesis AI Chat
 * - Main: Content workspace (Preview or Code)
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0A0B10] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-sm font-medium animate-pulse">Iniciando Genesis Studio...</p>
      </div>
    );
  }

  // --- Welcome Screen / Empty State ---
  if (!activeProject) {
    return (
      <div className="h-screen w-full bg-[#0A0B10] overflow-hidden flex flex-col relative selection:bg-primary/30">
        {/* Animated background background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[80%] bg-primary/10 rounded-full blur-[160px] opacity-40" />
          <div className="absolute bottom-[0%] right-[-5%] w-[60%] h-[70%] bg-emerald-500/5 rounded-full blur-[140px] opacity-20" />
        </div>

        {/* Minimal Navigation */}
        <header className="h-[60px] px-6 flex items-center justify-between border-b border-white/[0.04] bg-black/20 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Code2 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-black text-white tracking-widest uppercase">Genesis AI</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-white/30 hover:text-white transition-all">Volver al Dashboard</button>
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
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 max-w-2xl leading-tight">
                Construye el futuro de la web <br/> <span className="text-white/40">con Genesis Studio.</span>
              </h1>
              <p className="text-lg text-white/30 max-w-xl mb-10 leading-relaxed font-medium font-display">
                Crea, diseña y despliega aplicaciones completas en minutos. Todo desde una interfaz diseñada para la velocidad.
              </p>
              
              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                <Plus className="w-5 h-5" />
                Empezar nuevo proyecto
              </button>
            </div>

            {/* Recents Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="col-span-full border-b border-white/[0.05] pb-4 mb-4">
                <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Proyectos Recientes</h2>
              </div>
              
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/studio?project=${p.id}`)}
                  className="group relative flex flex-col gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-primary/[0.03] hover:border-primary/20 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <FolderOpen className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{p.name}</h3>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{Object.keys(p.files).length} Archivos</p>
                  </div>
                  
                  {/* Subtle hover indicator */}
                  <div className="absolute inset-0 border border-primary/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}

              {projects.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl">
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
    <div className="flex flex-col h-screen bg-[#0A0B10] overflow-hidden text-white selection:bg-primary/30">
      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      <StudioTopbar 
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

      <main className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Chat ─────────────────────────────────────────── */}
        <div className="w-[400px] shrink-0 border-r border-white/[0.06] bg-[#0A0B10]/50 backdrop-blur-3xl overflow-hidden flex flex-col">
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

        {/* ── Main Workspace: Preview or Code ──────────────────────────────── */}
        <div className="flex-1 overflow-hidden bg-background/20 relative">
          {viewMode === 'preview' ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-4">
              <div className={cn(
                "h-full w-full transition-all duration-500 ease-in-out flex items-center justify-center",
                deviceMode === 'mobile' ? "max-w-[375px]" : deviceMode === 'tablet' ? "max-w-[768px]" : "max-w-full"
              )}>
                <StudioPreview 
                  files={activeProject.files} 
                  isGenerating={isGenerating}
                  deviceMode={deviceMode as any}
                  onDeviceModeChange={setDeviceMode as any}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full">
              {/* File Tree */}
              <div className="w-64 shrink-0 border-r border-white/[0.06] bg-black/20">
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
          )}
        </div>
      </main>
    </div>
  );
}

// Utility local for cn
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
