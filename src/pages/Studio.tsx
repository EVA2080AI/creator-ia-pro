import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStudioProjects, StudioFile } from '@/hooks/useStudioProjects';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioArtifactsPanel } from '@/components/studio/StudioArtifactsPanel';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioDeploy } from '@/components/studio/StudioDeploy';
import { StudioAITools } from '@/components/studio/StudioAITools';
import { StudioFloatingToolbar } from '@/components/studio/StudioFloatingToolbar';
import { StudioCloud, SupabaseConfig } from '@/components/studio/StudioCloud';
import { StudioAnalytics } from '@/components/studio/StudioAnalytics';
import { StudioTopbar, ViewMode, DeviceMode } from '@/components/studio/StudioTopbar';
import { 
  Loader2, FolderOpen, Code2, Plus, Sparkles, ChevronRight, Layout,
  Monitor, Tablet, Smartphone, Eye, Code, Share2, Globe, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Studio — Integrated IDE Workspace (Lovable Architecture)
 * - Topbar: High-fidelity Project navigation & View toggles
 * - Sidebar: Genesis AI Chat
 * - Main: Content workspace (Preview, Code, Files, Cloud or Analytics)
 */
export default function Studio() {
  const { user } = useAuth('/auth');
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const { clearActions } = useWorkspaceActions();

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

  // --- Engineering State (Lifted from StudioChat) ---
  const [artifacts,   setArtifacts]   = useState<any[]>([]);
  const [activeTasks, setTasks]       = useState<any[]>([]);
  const [logs,        setLogs]        = useState<any[]>([]);
  const [cloudConfig, setCloudConfig] = useState<SupabaseConfig | null>(null);

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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[90%] bg-primary/20 rounded-full blur-[180px] opacity-30 animate-pulse" />
          <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[80%] bg-purple-500/10 rounded-full blur-[160px] opacity-20" />
        </div>

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

        <div className="flex-1 overflow-y-auto px-8 relative z-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col pt-24 pb-32">
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
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate">{p.name}</h3>
                    <p className="text-xs text-zinc-600 font-medium tracking-tight">Última edición hace 2 horas</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      <Helmet><title>Studio | Creator IA Pro</title></Helmet>

      {/* --- New High-Fidelity Toolbar (Lovable Architecture) --- */}
      <StudioTopbar 
        projectName={activeProject.name}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        isSaving={isSaving}
        onBack={() => navigate('/studio')}
        onGithubSync={() => toast.info('Sincronización con GitHub iniciada')}
        onPublish={() => setShowDeployModal(true)}
        onShare={handleShare}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Chat (Genesis) ── */}
        <div 
          className={cn(
            "shrink-0 border-r border-white/5 bg-background flex flex-col relative z-20 transition-all duration-300",
            isSidebarCollapsed ? "w-0 opacity-0 -translate-x-full" : "w-[410px] opacity-100 translate-x-0"
          )}
        >
          <StudioChat 
            projectId={activeProject.id} 
            projectFiles={activeProject.files}
            projectName={activeProject.name}
            isSaving={isSaving}
            activeFile={activeFile}
            onCodeGenerated={handleCodeGenerated}
            onGeneratingChange={setIsGenerating}
            // Lifted State
            artifacts={artifacts}
            setArtifacts={setArtifacts}
            tasks={activeTasks}
            setTasks={setTasks}
            logs={logs}
            setLogs={setLogs}
            onStreamCharsChange={(chars, preview) => {
              setStreamChars(chars);
              setStreamPreview(preview);
            }}
            onShare={handleShare}
            onPublish={() => setShowDeployModal(true)}
            onBack={() => navigate('/studio')}
            onToggleArtifacts={() => setViewMode('artifacts')}
          />
        </div>

        {/* ── Main Workspace: Preview, Code, Files, Cloud or Analytics ────────────────── */}
        <div className="flex-1 overflow-hidden bg-background relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
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
                <motion.div 
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex h-full w-full bg-[#080808]"
                >
                  <div className="w-64 shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-sm">
                    <StudioFileTree 
                      files={activeProject.files} 
                      selectedFile={activeFile || ''} 
                      onSelect={setActiveFile} 
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <StudioCodeEditor 
                      selectedFile={activeFile || ''}
                      projectFiles={activeProject.files}
                      onFilesChange={handleFilesChange}
                      isGenerating={isGenerating}
                      streamPreview={streamPreview}
                    />
                  </div>
                </motion.div>
              ) : viewMode === 'artifacts' ? (
                <motion.div 
                  key="artifacts"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full bg-[#080808]"
                >
                  <StudioArtifactsPanel 
                    isOpen={true}
                    onClose={() => setViewMode('preview')}
                    tasks={activeTasks}
                    artifacts={artifacts}
                    logs={logs}
                    files={activeProject.files}
                    onFix={() => {
                       window.dispatchEvent(new CustomEvent('GENESIS_LOG', { 
                         detail: { message: 'Iniciando reparación manual...', type: 'info', source: 'UI' } 
                       }));
                    }}
                  />
                </motion.div>
              ) : viewMode === 'files' ? (
                <div className="h-full w-full bg-[#080808] flex border-t border-white/5">
                   <div className="w-full max-w-xs border-r border-white/5 bg-black/20 backdrop-blur-sm">
                      <StudioFileTree 
                        files={activeProject.files} 
                        selectedFile={activeFile || ''} 
                        onSelect={setActiveFile} 
                      />
                   </div>
                   <div className="flex-1 flex items-center justify-center bg-background">
                      <div className="text-center space-y-4">
                         <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                            <FolderOpen className="w-8 h-8 text-zinc-500" />
                         </div>
                         <h3 className="text-white font-black uppercase tracking-widest text-xs">Gestor de Archivos</h3>
                         <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Selecciona un archivo para editar su contenido.</p>
                      </div>
                   </div>
                </div>
              ) : viewMode === 'cloud' ? (
                <StudioCloud 
                  projectId={activeProject.id} 
                  config={cloudConfig} 
                  onConfigChange={setCloudConfig} 
                />
              ) : viewMode === 'analytics' ? (
                <StudioAnalytics projectId={activeProject.id} />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#080808]">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-xs">Módulo en Desarrollo</h3>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Genesis está preparando esta vista para ti.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {showDeployModal && activeProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
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
                onLog={(message, type) => {
                  window.dispatchEvent(new CustomEvent('GENESIS_LOG', { 
                    detail: { message, type, source: 'Deployer' } 
                  }));
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
