import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStudioProjects, StudioFile } from '@/hooks/useStudioProjects';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { StudioChat, type AgentPhase, type AgentSpecialist } from '@/components/studio/StudioChat';
import { StudioArtifactsPanel, type UIPlanTask, type UIArtifact, type UILog } from '@/components/studio/StudioArtifactsPanel';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioDeploy } from '@/components/studio/StudioDeploy';
import { StudioAITools } from '@/components/studio/StudioAITools';
import { StudioFloatingToolbar } from '@/components/studio/StudioFloatingToolbar';
import { StudioCloud, SupabaseConfig } from '@/components/studio/StudioCloud';
import { StudioAnalytics } from '@/components/studio/StudioAnalytics';
import { StudioNexus } from '@/components/studio/Nexus/StudioNexus';
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
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // --- Engineering State (Lifted from StudioChat) ---
  const [artifacts, setArtifacts] = useState<UIArtifact[]>([]);
  const [tasks, setTasks] = useState<UIPlanTask[]>([]);
  const [logs, setLogs] = useState<UILog[]>([]);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [activeSpecialist, setActiveSpecialist] = useState<AgentSpecialist>('none');
  const [cloudConfig, setCloudConfig] = useState<SupabaseConfig | null>(null);

  const activeTasks = useMemo(() => tasks, [tasks]);

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

  // --- Auto-Migrator (Nuclear Fix v14.6) ---
  // Silently upgrades legacy CRA projects to the new Vite-Native architecture
  useEffect(() => {
    if (!activeProject) return;

    const files = activeProject.files;
    const hasRootIndex = !!files['index.html'];
    const hasPackageJson = !!files['package.json'];
    const hasViteConfig = !!files['vite.config.ts'];

    // Nuclear enforcement: missing ANY of these files triggers immediate injection
    if (!hasRootIndex || !hasPackageJson || !hasViteConfig) {
      console.log('Genesis: Legacy project detected. Migrating to Vite-Native...');
      
      const upgradedFiles = { ...files };

      // Ensure root index.html exists
      if (!hasRootIndex) {
        upgradedFiles['index.html'] = {
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Genesis Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        };
      }

      // Ensure package.json exists
      if (!hasPackageJson) {
        upgradedFiles['package.json'] = {
          language: 'json',
          content: JSON.stringify({
            name: "genesis-project",
            private: true,
            type: "module",
            scripts: { "dev": "vite", "build": "vite build" }
          }, null, 2)
        };
      }

      // Ensure vite.config.ts exists
      if (!hasViteConfig) {
        upgradedFiles['vite.config.ts'] = {
          language: 'typescript',
          content: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });"
        };
      }

      // Ensure src/main.tsx exists if it's a React project
      if (!files['src/main.tsx']) {
        upgradedFiles['src/main.tsx'] = {
          language: 'tsx',
          content: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from '../App';\nimport '../index.css';\nReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);"
        };
      }

      updateProjectFiles(activeProject.id, upgradedFiles);
      // Only toast on manual project load to avoid spamming during generation
      if (!isGenerating) {
        toast.info('Sincronizando arquitectura maestra...');
      }
    }
  }, [activeProject, updateProjectFiles]); // Removed isGenerating from deps to ensure foundation

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
      <div className="h-full w-full bg-[#020202] overflow-hidden flex flex-col relative selection:bg-primary/30 font-sans">
        {/* --- Cinematic Background (Mesh Grid + Light Orbs) --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[90%] bg-primary/10 rounded-full blur-[200px] opacity-30 animate-pulse" />
          <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[80%] bg-purple-500/5 rounded-full blur-[180px] opacity-20" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        {/* --- Elite Header --- */}
        <header className="h-[72px] px-10 flex items-center justify-between border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl relative z-50">
          <div className="flex items-center gap-4">
            <div className="group flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] transition-transform hover:rotate-12 duration-500">
              <Sparkles className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-white tracking-[0.5em] uppercase leading-none mb-1">Genesis IA</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[8px] font-bold text-zinc-500 tracking-widest uppercase leading-none">Deep Reasoning Enabled</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-[0.3em]"
            >
              Dashboard
            </button>
            <button
              onClick={handleCreateNew}
              className="px-6 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Lanzar Studio
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 relative z-10 custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col pt-28 pb-40">
            {/* --- Quantum Compositor --- */}
            <div className="flex flex-col items-center text-center mb-32 max-w-4xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-10 shadow-2xl backdrop-blur-md"
              >
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Engine Status: High-Fidelity Prototype Mode</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-10 max-w-4xl leading-[0.85]"
              >
                ¿Listo para construir el <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500">futuro?</span>
              </motion.h1>

              {/* Futuristic Prompt Unit */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-full max-w-3xl group"
              >
                <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-r from-white/10 via-white/5 to-white/10 shadow-2xl transition-all group-hover:shadow-primary/20 group-hover:scale-[1.01]">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                  <div className="relative flex flex-col gap-4 p-5 md:p-8 rounded-[2.4rem] bg-[#080808]/80 backdrop-blur-3xl border border-white/5">
                    <div className="flex items-start gap-5">
                       <div className="mt-1 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Plus className="w-6 h-6 text-primary" />
                       </div>
                       <textarea 
                          placeholder="Describe tu visión... (ej: Plataforma de e-commerce de lujo con visuales dorados)"
                          className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-medium text-white placeholder:text-zinc-700 resize-none h-32 custom-scrollbar"
                          disabled
                       />
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-5">
                       <div className="flex items-center gap-4">
                          <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-zinc-500 hover:text-white"><Smartphone className="w-4 h-4" /></button>
                          <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-zinc-500 hover:text-white"><Globe className="w-4 h-4" /></button>
                       </div>
                       <button 
                        onClick={handleCreateNew}
                        className="px-8 py-3.5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                       >
                          Lanzar Genesis
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* --- Bento Gallery --- */}
            <div className="space-y-10">
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-6">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-zinc-500" />
                  <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.6em]">Proyectos Recientes</h2>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Favoritos</div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-widest">Ver Todos</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((p, idx) => (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (idx * 0.05) }}
                    key={p.id}
                    onClick={() => navigate(`/studio?project=${p.id}`)}
                    className="group relative flex flex-col gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-primary/30 transition-all text-left shadow-2xl backdrop-blur-sm overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900/50 border border-white/5 group-hover:border-primary/20 flex items-center justify-center transition-all duration-700 group-hover:rotate-[15deg]">
                        <Code2 className="w-6 h-6 text-zinc-500 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Deep AI 1A</span>
                         <span className="text-zinc-800 tracking-widest">•</span>
                         <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">React v18</span>
                      </div>
                      <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors truncate tracking-tighter">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-white/10 flex items-center justify-center"><Layout className="w-3 h-3 text-blue-400" /></div>
                           <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-white/10 flex items-center justify-center"><Sparkles className="w-3 h-3 text-purple-400" /></div>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-2">Editado recientemente</p>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {/* --- Add New Card --- */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleCreateNew}
                  className="flex flex-col items-center justify-center gap-6 p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group min-h-[240px]"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-8 h-8 text-zinc-600 group-hover:text-primary group-hover:rotate-90 transition-all duration-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Nuevo Proyecto</h3>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Empieza desde cero</p>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#FCFCFC] overflow-hidden text-foreground selection:bg-primary/20 font-sans">
      <Helmet><title>Studio | Creator IA Pro</title></Helmet>

      {/* --- Immersive View Controls (Génesis Floating Toolbar) --- */}
      <StudioFloatingToolbar 
        projectName={activeProject.name}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        onShare={handleShare}
        onGithubSync={() => toast.info('Sincronización con GitHub iniciada')}
        onPublish={() => setShowDeployModal(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Chat (Genesis) ── */}
        <div 
          className={cn(
            "shrink-0 z-30 transition-all duration-500 ease-in-out relative",
            isSidebarCollapsed ? "w-0 opacity-0 -translate-x-full" : "w-[380px] md:w-[420px] opacity-100 translate-x-0"
          )}
        >
          {/* Glass Overlay for the sidebar area */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl border-r border-black/[0.03] shadow-2xl z-0" />
          
          <div className="relative h-full flex flex-col z-10">
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
              // --- v16.0 Interconnect ---
              runtimeError={runtimeError}
              onClearError={() => setRuntimeError(null)}
              onPhaseChange={(phase, specialist) => {
                setAgentPhase(phase);
                setActiveSpecialist(specialist);
              }}
              onStreamCharsChange={(chars, preview) => {
                setStreamChars(chars);
                setStreamPreview(preview);
              }}
              onShare={handleShare}
              onPublish={() => setShowDeployModal(true)}
              onBack={() => navigate('/studio')}
              onToggleArtifacts={() => setViewMode('artifacts')}
              onSelectFile={(f) => {
                setActiveFile(f);
                setViewMode('code');
              }}
            />
          </div>
        </div>

        {/* ── Main Workspace: Immersive Stage ────────────────── */}
        <div className="flex-1 overflow-hidden bg-[#FAFAFA] relative z-0">
          {/* Subtle global gradient backdrop for preview */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#F0F0F0_0%,_transparent_100%)] pointer-events-none" />
          
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
                      onError={setRuntimeError}
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
                    artifacts={artifacts} 
                    tasks={activeTasks} 
                    logs={logs}
                    files={activeProject.files}
                    agentPhase={agentPhase}
                    activeSpecialist={activeSpecialist}
                    persona="genesis"
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
              ) : viewMode === 'nexus' ? (
                <StudioNexus 
                  currentProject={activeProject} 
                  allProjects={projects} 
                />
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
