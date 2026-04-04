import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStudioProjects, StudioFile } from '@/hooks/useStudioProjects';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioDeploy } from '@/components/studio/StudioDeploy';
import { StudioAITools } from '@/components/studio/StudioAITools';
import { 
  Loader2, FolderOpen, Code2, Plus, Sparkles, ChevronRight, Layout,
  Monitor, Tablet, Smartphone, Eye, Code, Share2, Globe, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ViewMode, DeviceMode } from '@/components/studio/StudioTopbar';

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

  const { setActions, clearActions } = useWorkspaceActions();

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
  const [showDeployModal, setShowDeployModal] = useState(false);

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

  // ── Contextual Actions Registration ─────────────────────────────────────────
  useEffect(() => {
    if (!activeProject) {
      clearActions();
      return;
    }

    setActions([
      {
        id: 'view-mode',
        label: 'Vistas',
        actions: [
          {
            id: 'v-preview',
            label: 'Vista Previa',
            icon: Eye,
            active: viewMode === 'preview',
            onClick: () => setViewMode('preview')
          },
          {
            id: 'v-code',
            label: 'Código',
            icon: Code,
            active: viewMode === 'code',
            onClick: () => setViewMode('code')
          }
        ]
      },
      {
        id: 'device-mode',
        label: 'Dispositivo',
        actions: [
          {
            id: 'd-desktop',
            label: 'Desktop',
            icon: Monitor,
            active: deviceMode === 'desktop',
            onClick: () => setDeviceMode('desktop')
          },
          {
            id: 'd-tablet',
            label: 'Tablet',
            icon: Tablet,
            active: deviceMode === 'tablet',
            onClick: () => setDeviceMode('tablet')
          },
          {
            id: 'd-mobile',
            label: 'Mobile',
            icon: Smartphone,
            active: deviceMode === 'mobile',
            onClick: () => setDeviceMode('mobile')
          }
        ]
      },
      {
        id: 'studio-actions',
        label: 'Acciones',
        actions: [
          {
            id: 'save',
            label: isSaving ? 'Guardando...' : 'Guardar',
            icon: Save,
            disabled: isSaving,
            onClick: () => toast.success('Proyecto guardado')
          },
          {
            id: 'publish',
            label: 'Publicar',
            icon: Globe,
            variant: 'primary',
            onClick: () => setShowDeployModal(true)
          },
          {
            id: 'share',
            label: 'Compartir',
            icon: Share2,
            onClick: handleShare
          }
        ]
      }
    ], activeProject.name);

    return () => clearActions();
  }, [activeProject, viewMode, deviceMode, isSaving]);

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
    // Explicitly stay in 'preview' mode as requested
    setViewMode('preview');
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
      <div className="h-full w-full bg-[#030303] overflow-hidden flex flex-col relative selection:bg-primary/30">
        {/* Cinematic Atmospheric Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[90%] bg-primary/20 rounded-full blur-[180px] opacity-30 animate-pulse" />
          <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[80%] bg-purple-500/10 rounded-full blur-[160px] opacity-20" />
        </div>

        {/* Minimal High-Fidelity Navigation */}
        <header className="h-[64px] px-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-2xl relative z-20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
              <Code2 className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase leading-none mb-0.5">Studio</span>
              <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase leading-none">Professional Environment</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-4 py-2 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest border border-transparent hover:border-white/10"
          >
            Volver al Dashboard
          </button>
        </header>

        {/* Home Content Area */}
        <div className="flex-1 overflow-y-auto px-8 relative z-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col pt-24 pb-32">
            
            {/* High-Impact Hero Section */}
            <div className="flex flex-col items-center text-center mb-24 max-w-3xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 group cursor-default"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Genesis Intelligence Engine</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 max-w-2xl leading-[0.9]"
              >
                Crea sin límites. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-400">Construye con IA.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-zinc-500 max-w-xl mb-12 leading-relaxed font-medium font-display"
              >
                Diseña, desarrolla y despliega aplicaciones web completas en segundos. Una experiencia de desarrollo cinematográfica impulsada por Genesis.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleCreateNew}
                className="group relative flex items-center gap-4 px-10 py-5 rounded-2xl bg-white text-black font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                <Plus className="w-5 h-5 pointer-events-none" />
                Empezar nuevo proyecto
              </motion.button>
            </div>

            {/* Recents Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="col-span-full border-b border-white/5 pb-4 mb-4">
                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Tus Proyectos Recientes</h2>
              </div>

              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/studio?project=${p.id}`)}
                  className="group relative flex flex-col gap-5 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-primary/40 transition-all text-left shadow-2xl backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:rotate-6">
                      <FolderOpen className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{Object.keys(p.files).length} Componentes</p>
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
            activeFile={activeFile}
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
                  streamChars={streamChars}
                  streamPreview={streamPreview}
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

      {/* ── Modals & Overlays ── */}
      <AnimatePresence>
        {showDeployModal && activeProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowDeployModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl"
            >
              <StudioDeploy 
                onClose={() => setShowDeployModal(false)}
                files={activeProject.files}
                projectName={activeProject.name}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

