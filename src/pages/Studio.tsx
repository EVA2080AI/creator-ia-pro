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

    if (!hasHtml || !hasPkg || !hasVite || (!files['App.tsx'] && !files['src/App.tsx'])) {
      const u = { ...files };
      
      if (!hasHtml) {
        u['index.html'] = { 
          language: 'html', 
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Genesis Studio App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>` 
        };
      }

      if (!hasPkg) {
        u['package.json'] = { 
          language: 'json', 
          content: JSON.stringify({ 
            name: "genesis-project", 
            type: "module", 
            dependencies: { 
              "react": "^18.2.0", 
              "react-dom": "^18.2.0",
              "lucide-react": "latest",
              "framer-motion": "latest",
              "clsx": "latest",
              "tailwind-merge": "latest"
            } 
          }, null, 2) 
        };
      }

      if (!hasVite) {
        u['vite.config.ts'] = { 
          language: 'typescript', 
          content: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });" 
        };
      }

      // Final critical files: main.tsx, index.css and App.tsx
      if (!files['src/main.tsx']) {
        u['src/main.tsx'] = {
          language: 'tsx',
          content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}`
        };
      }

      if (!files['src/index.css']) {
        u['src/index.css'] = {
          language: 'css',
          content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background-size: 200% 100%;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #FDFDFF;
}`
        };
      }

      if (!files['src/App.tsx'] && !files['App.tsx']) {
        u['src/App.tsx'] = {
          language: 'tsx',
          content: `import React from 'react';
import { Sparkles, Code2, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-6 text-zinc-900 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-zinc-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-900/5 to-transparent" />
          
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-zinc-200 rotate-3 hover:rotate-0 transition-all duration-500 group">
            <Sparkles className="text-white w-10 h-10 group-hover:scale-110 transition-transform" />
          </div>
          
          <h1 className="text-3xl font-black mb-3 tracking-tight text-zinc-900">Génesis Studio</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 px-2">
            El nucleo de inteligencia ha orquestado tu entorno. Todo está listo para construir.
          </p>
          
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 flex flex-col items-center gap-2">
              <Code2 className="w-5 h-5 text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">React + TS</span>
            </div>
            <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 flex flex-col items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500/60" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ready</span>
            </div>
          </div>

          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-zinc-900 w-full rounded-full animate-shimmer" 
                 style={{
                   backgroundImage: 'linear-gradient(90deg, #18181b 0%, #3f3f46 50%, #18181b 100%)',
                 }} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Engine Active</span>
          </div>
        </div>
        
        <p className="mt-8 text-center text-zinc-400 text-[11px] font-medium leading-relaxed max-w-[280px] mx-auto">
          Utiliza el chat para generar tu primera aplicación o página web profesional.
        </p>
      </div>
    </div>
  );
}`
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

  const handleAddFile = (name: string) => {
    if (!activeProject) return;
    const lang = name.endsWith('.tsx') || name.endsWith('.ts') ? 'tsx'
      : name.endsWith('.css') ? 'css'
      : name.endsWith('.json') ? 'json'
      : name.endsWith('.html') ? 'html'
      : 'typescript';
    const newFiles = {
      ...activeProject.files,
      [name]: { language: lang, content: `// ${name}\n` },
    };
    handleFilesChange(newFiles);
    setActiveFile(name);
  };

  const handleDeleteFile = (name: string) => {
    if (!activeProject) return;
    const newFiles = { ...activeProject.files };
    delete newFiles[name];
    if (activeFile === name) {
      const remaining = Object.keys(newFiles);
      setActiveFile(remaining[0] ?? null);
    }
    handleFilesChange(newFiles);
  };

  const handleRenameFile = (oldName: string, newName: string) => {
    if (!activeProject || oldName === newName) return;
    const newFiles = { ...activeProject.files };
    newFiles[newName] = newFiles[oldName];
    delete newFiles[oldName];
    if (activeFile === oldName) setActiveFile(newName);
    handleFilesChange(newFiles);
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
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onAddFolder={(folder) => handleAddFile(`${folder}/.gitkeep`)}
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
