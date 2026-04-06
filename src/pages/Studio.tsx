import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks & Auth
import { useAuth } from '@/hooks/useAuth';
import { useStudioProjects, type StudioFile } from '@/hooks/useStudioProjects';

// UI Components
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioArtifactsPanel, type UIPlanTask, type UIArtifact, type UILog } from '@/components/studio/StudioArtifactsPanel';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioCloud, type SupabaseConfig } from '@/components/studio/StudioCloud';
import { StudioAnalytics } from '@/components/studio/StudioAnalytics';
import { StudioNexus } from '@/components/studio/Nexus/StudioNexus';
import { StudioFloatingToolbar } from '@/components/studio/StudioFloatingToolbar';
import { type ViewMode, type DeviceMode } from '@/components/studio/StudioTopbar';
import { type AgentPhase, type AgentSpecialist } from '@/components/studio/chat/types';

// Lucide Icons & Utils
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Studio() {
  const { user } = useAuth('/auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    loading: loadingProjects, 
    updateProjectFiles, 
    createProject 
  } = useStudioProjects();

  // ── Operational State ──
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

  // ── Engineering Core State ──
  const [artifacts, setArtifacts] = useState<UIArtifact[]>([]);
  const [tasks, setTasks] = useState<UIPlanTask[]>([]);
  const [logs, setLogs] = useState<UILog[]>([]);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [activeSpecialist, setActiveSpecialist] = useState<AgentSpecialist>('none');
  const [cloudConfig, setCloudConfig] = useState<SupabaseConfig | null>(null);

  const activeTasks = useMemo(() => tasks, [tasks]);

  // Handle Project Selection & Basic Routing
  useEffect(() => {
    if (loadingProjects) return;
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setActiveProject(project);
      } else {
        navigate('/studio');
      }
    } else {
      setActiveProject(null);
    }
  }, [projectId, projects, loadingProjects, setActiveProject, navigate]);

  // Auto-Select First File
  useEffect(() => {
    if (activeProject && !activeFile) {
      const files = Object.keys(activeProject.files);
      if (files.includes('App.tsx')) setActiveFile('App.tsx');
      else if (files.length > 0) setActiveFile(files[0]);
    }
  }, [activeProject, activeFile]);

  // Project Health check: Ensure boilerplate files exist
  useEffect(() => {
    if (!activeProject) return;
    const files = activeProject.files;
    const hasHtml = !!files['index.html'];
    const hasPkg = !!files['package.json'];
    const hasVite = !!files['vite.config.ts'];

    if (!hasHtml || !hasPkg || !hasVite) {
      const u = { ...files };
      if (!hasHtml) {
        // Safe string construction to avoid parser conflicts
        const h = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\" /><title>Genesis Project</title></head><body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.tsx\"></script></body></html>";
        u['index.html'] = { language: 'html', content: h };
      }
      if (!hasPkg) {
        u['package.json'] = { language: 'json', content: JSON.stringify({ name: "project", type: "module", scripts: { dev: "vite" } }, null, 2) };
      }
      if (!hasVite) {
        u['vite.config.ts'] = { 
          language: 'typescript', 
          content: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });" 
        };
      }
      updateProjectFiles(activeProject.id, u);
    }
  }, [activeProject, updateProjectFiles]);

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

  const renderWorkspace = () => {
    if (!activeProject) return null;
    switch (viewMode) {
      case 'preview':
        return (
          <div className="h-full w-full flex items-center justify-center p-4">
            <div className={cn(
              "h-full w-full bg-white shadow-2xl rounded-3xl overflow-hidden transition-all duration-700", 
              deviceMode === 'mobile' ? "max-w-[375px]" : deviceMode === 'tablet' ? "max-w-[768px]" : "max-w-full"
            )}>
              <StudioPreview 
                files={activeProject.files} 
                isGenerating={isGenerating} 
                streamChars={streamChars} 
                streamPreview={streamPreview}
                deviceMode={deviceMode}
                onDeviceModeChange={(m) => setDeviceMode(m)}
                viewMode="preview"
                onToggleViewMode={(m) => setViewMode(m)}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                onShare={() => {}}
                onError={(err) => setRuntimeError(err)}
              />
            </div>
          </div>
        );
      case 'code':
        return (
          <div className="flex h-full w-full bg-[#080808]">
            <div className="w-64 shrink-0 border-r border-white/5 bg-black/20">
              <StudioFileTree 
                files={activeProject.files} 
                selectedFile={activeFile || ''} 
                onSelect={(f) => setActiveFile(f)} 
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
          </div>
        );
      case 'artifacts':
        return (
          <div className="h-full w-full bg-[#0F0F12]">
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
              onFix={() => {}}
            />
          </div>
        );
      case 'cloud':
        return <StudioCloud projectId={activeProject.id} config={cloudConfig} onConfigChange={setCloudConfig} />;
      case 'analytics':
        return <StudioAnalytics projectId={activeProject.id} />;
      case 'nexus':
        return <StudioNexus currentProject={activeProject} allProjects={projects} />;
      default:
        return (
          <div className="h-full w-full flex items-center justify-center bg-[#080808]">
            <span className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.4em]">Sincronizando Nucleo...</span>
          </div>
        );
    }
  };

  if (loadingProjects) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // ── Project Selector Screen ──
  if (!activeProject) {
    return (
      <div className="h-screen w-full bg-black overflow-hidden flex flex-col relative aether-iridescent">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <header className="h-[72px] px-12 flex items-center justify-between border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl z-50">
          <div className="flex items-center gap-6">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-primary/20 border border-primary/20 shadow-2xl shadow-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-[14px] font-black text-white tracking-[0.5em] uppercase italic">GENESIS://STUDIO_OS</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Sovereign_System_v21.4</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-10">
            <button onClick={() => navigate('/dashboard')} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Dashboard</button>
            <button onClick={() => navigate('/docs')} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Protocol_Docs</button>
            <button 
              onClick={() => createProject('Genesis_Project')} 
              className="px-8 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Lanzar Nuevo Nucleo
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-12 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12rem] font-black text-white uppercase italic tracking-tighter leading-none mb-12 drop-shadow-[0_20px_40px_rgba(255,255,255,0.05)]"
          >
            GENESIS
          </motion.h1>
          <p className="text-zinc-500 max-w-2xl mb-16 uppercase font-black tracking-[0.4em] italic text-[11px] leading-relaxed">
            Orquestacion de Ingeniería de Grado Industrial.<br/>
            Soberanía de Código y Arquitectura Autónoma de Alta Fidelidad.
          </p>
          <button 
            onClick={() => createProject('Industrial_Core')}
            className="px-20 py-8 rounded-[3rem] bg-white text-black font-black uppercase text-xs tracking-[0.4em] italic hover:scale-[1.05] active:scale-95 transition-all shadow-2xl overflow-hidden group relative"
          >
            <span className="relative z-10">INICIAR_SISTEMA_OPERATIVO</span>
            <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
        </main>
      </div>
    );
  }

  // ── Main UI Surface ──
  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] overflow-hidden font-sans selection:bg-primary selection:bg-opacity-20">
      <Helmet><title>Studio | Genesis IA</title></Helmet>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Engineering Intelligence Terminal (Sidebar) */}
        <div className={cn(
          "shrink-0 z-30 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] relative",
          isSidebarCollapsed ? "w-0 opacity-0 -translate-x-12" : "w-[460px] opacity-100 translate-x-0"
        )}>
          <div className="h-full p-5 flex flex-col">
             <div className="flex-1 bg-white border border-black border-opacity-5 shadow-2xl rounded-[3rem] overflow-hidden relative aether-glass">
                <StudioChat 
                   projectId={activeProject.id} 
                   projectFiles={activeProject.files}
                   projectName={activeProject.name}
                   isSaving={isSaving}
                   activeFile={activeFile}
                   onCodeGenerated={handleCodeGenerated}
                   onGeneratingChange={setIsGenerating}
                   artifacts={artifacts}
                   setArtifacts={setArtifacts}
                   tasks={tasks}
                   setTasks={setTasks}
                   logs={logs}
                   setLogs={setLogs}
                   runtimeError={runtimeError}
                   onClearError={() => setRuntimeError(null)}
                   onPhaseChange={(phase, specialist) => {
                     setAgentPhase(phase);
                     if (specialist) setActiveSpecialist(specialist);
                   }}
                   onStreamCharsChange={(chars, preview) => {
                     setStreamChars(chars);
                     setStreamPreview(preview);
                   }}
                   onShare={() => {}}
                   onBack={() => navigate('/dashboard')}
                   onToggleArtifacts={() => setViewMode('artifacts')}
                   onSelectFile={(f) => {
                     setActiveFile(f);
                     setViewMode('code');
                   }}
                />
             </div>
          </div>
        </div>

        {/* Global Workspace Surface */}
        <div className="flex-1 p-5 pl-0 relative">
          <div className="h-full w-full rounded-[3rem] border border-black border-opacity-5 bg-[#F7F7F9] overflow-hidden relative shadow-inner">
            <AnimatePresence mode="wait">
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="h-full w-full"
              >
                {renderWorkspace()}
              </motion.div>
            </AnimatePresence>

            {/* Industrial Control Overlays */}
            <StudioFloatingToolbar 
              projectName={activeProject.name}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              deviceMode={deviceMode}
              onDeviceModeChange={setDeviceMode}
              isSaving={isSaving}
              onShare={() => {}}
              onBack={() => navigate('/dashboard')}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
