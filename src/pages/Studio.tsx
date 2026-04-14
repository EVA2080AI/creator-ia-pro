import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

// New Unified Hook
import { useGenesisUnified } from '@/hooks/useGenesisUnified';

// UI Components
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioArtifactsPanel } from '@/components/studio/StudioArtifactsPanel';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioCloud } from '@/components/studio/StudioCloud';
import { StudioAnalytics } from '@/components/studio/StudioAnalytics';
import { StudioNexus } from '@/components/studio/Nexus/StudioNexus';
import { StudioFloatingToolbar } from '@/components/studio/StudioFloatingToolbar';

import { cn } from '@/lib/utils';

export default function Studio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const genesis = useGenesisUnified({ projectId });

  // Initialize auto-fix on error
  useEffect(() => {
    if (genesis.runtimeError) {
      genesis.handleAutoFix(genesis.runtimeError);
    }
  }, [genesis.runtimeError, genesis.handleAutoFix]);

  const renderWorkspace = useMemo(() => {
    if (!genesis.activeProject) return null;

    switch (genesis.viewMode) {
      case 'preview':
        return (
          <div className="h-full w-full flex items-center justify-center p-4">
            <div className={cn(
              "h-full w-full bg-white shadow-2xl rounded-3xl overflow-hidden transition-all duration-700",
              genesis.deviceMode === 'mobile' ? "max-w-[375px]" :
              genesis.deviceMode === 'tablet' ? "max-w-[768px]" : "max-w-full"
            )}>
              <StudioPreview
                files={genesis.activeProject.files}
                isGenerating={genesis.isGenerating}
                streamChars={genesis.streamChars}
                streamPreview={genesis.streamPreview}
                deviceMode={genesis.deviceMode}
                onDeviceModeChange={genesis.setDeviceMode}
                viewMode="preview"
                onToggleViewMode={(m) => genesis.setViewMode(m === 'code' ? 'code' : 'preview')}
                isSidebarCollapsed={genesis.isSidebarCollapsed}
                onToggleSidebar={genesis.toggleSidebar}
                isFullscreen={genesis.isFullscreen}
                onToggleFullscreen={genesis.toggleFullscreen}
                onShare={() => {}}
                onError={(err) => genesis.setRuntimeError(err)}
              />
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="flex h-full w-full bg-[#080808]">
            <div className="w-64 shrink-0 border-r border-white/5 bg-black/20">
              <StudioFileTree
                files={genesis.activeProject.files}
                selectedFile={genesis.activeFile || ''}
                onSelect={(f) => genesis.setActiveFile(f)}
                onAddFile={genesis.handleAddFile}
                onDeleteFile={genesis.handleDeleteFile}
                onRenameFile={genesis.handleRenameFile}
                onAddFolder={(folder) => genesis.handleAddFile(`${folder}/.gitkeep`)}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <StudioCodeEditor
                selectedFile={genesis.activeFile || ''}
                projectFiles={genesis.activeProject.files}
                onFilesChange={genesis.handleFilesChange}
                isGenerating={genesis.isGenerating}
                streamPreview={genesis.streamPreview}
              />
            </div>
          </div>
        );

      case 'artifacts':
        return (
          <div className="h-full w-full bg-[#0F0F12]">
            <StudioArtifactsPanel
              isOpen={true}
              onClose={() => genesis.setViewMode('preview')}
              artifacts={genesis.artifacts}
              tasks={genesis.tasks}
              logs={genesis.logs}
              files={genesis.activeProject.files}
              agentPhase={genesis.agentPhase}
              activeSpecialist={genesis.activeSpecialist}
              persona="genesis"
              onFix={() => {}}
            />
          </div>
        );

      case 'cloud':
        return (
          <StudioCloud
            projectId={genesis.activeProject.id}
            projectName={genesis.activeProject.name}
            config={null}
            onConfigChange={() => {}}
            onHardReset={genesis.handleHardReset}
          />
        );

      case 'analytics':
        return <StudioAnalytics projectId={genesis.activeProject.id} />;

      case 'nexus':
        return (
          <StudioNexus
            currentProject={genesis.activeProject}
            allProjects={genesis.projects}
          />
        );

      default:
        return (
          <div className="h-full w-full flex items-center justify-center bg-[#080808]">
            <span className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.4em]">
              Sincronizando Nucleo...
            </span>
          </div>
        );
    }
  }, [genesis]);

  // Loading state
  if (genesis.projectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Project selector screen
  if (!genesis.activeProject) {
    return (
      <div className="h-screen w-full bg-black overflow-hidden flex flex-col relative aether-iridescent">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <header className="h-[72px] px-12 flex items-center justify-between border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl z-50">
          <div className="flex items-center gap-6">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-primary/20 border border-primary/20 shadow-2xl shadow-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-[14px] font-black text-white tracking-[0.5em] uppercase italic">
                GENESIS://STUDIO_OS
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                  Sovereign_System_v21.4
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-10">
            <button
              onClick={genesis.goToDashboard}
              className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Dashboard
            </button>
            <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
              Protocol_Docs
            </button>
            <button
              onClick={() => genesis.createNewProject('Genesis_Project')}
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
            Orquestacion de Ingenieria de Grado Industrial.<br/>
            Soberania de Codigo y Arquitectura Autonoma de Alta Fidelidad.
          </p>
          <button
            onClick={() => genesis.createNewProject('Industrial_Core')}
            className="px-20 py-8 rounded-[3rem] bg-white text-black font-black uppercase text-xs tracking-[0.4em] italic hover:scale-[1.05] active:scale-95 transition-all shadow-2xl overflow-hidden group relative"
          >
            <span className="relative z-10">INICIAR_SISTEMA_OPERATIVO</span>
            <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
        </main>
      </div>
    );
  }

  // Main Studio UI
  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] overflow-hidden font-sans selection:bg-primary selection:bg-opacity-20">
      <Helmet><title>Studio | Genesis IA</title></Helmet>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat Sidebar */}
        <div className={cn(
          "shrink-0 z-30 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] relative",
          genesis.isSidebarCollapsed ? "w-0 opacity-0 -translate-x-12" : "w-[460px] opacity-100 translate-x-0"
        )}>
          <div className="h-full p-5 flex flex-col">
            <div className="flex-1 bg-white border border-black border-opacity-5 shadow-2xl rounded-[3rem] overflow-hidden relative aether-glass">
              <StudioChat
                projectId={genesis.activeProject.id}
                projectFiles={genesis.activeProject.files}
                projectName={genesis.activeProject.name}
                isSaving={genesis.isSaving}
                activeFile={genesis.activeFile}
                onCodeGenerated={genesis.handleFilesChange}
                onGeneratingChange={genesis.setGenerating}
                artifacts={genesis.artifacts}
                setArtifacts={(arts) => arts.forEach((a: any) => genesis.addArtifact(a))}
                tasks={genesis.tasks}
                setTasks={genesis.setTasks}
                logs={genesis.logs}
                setLogs={(logs) => {}}
                runtimeError={genesis.runtimeError}
                onClearError={genesis.clearRuntimeError}
                onPhaseChange={(phase, specialist) => {
                  genesis.setAgentPhase(phase);
                  if (specialist) genesis.setActiveSpecialist(specialist);
                }}
                onStreamCharsChange={(chars, preview) => genesis.setStreamChars(chars, preview)}
                onShare={() => {}}
                onBack={genesis.goToDashboard}
                onToggleArtifacts={() => genesis.setViewMode('artifacts')}
                onSelectFile={(f) => {
                  genesis.setActiveFile(f);
                  genesis.setViewMode('code');
                }}
              />
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 p-5 pl-0 relative">
          <div className="h-full w-full rounded-[3rem] border border-black border-opacity-5 bg-[#F7F7F9] overflow-hidden relative shadow-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={genesis.viewMode}
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="h-full w-full"
              >
                {renderWorkspace}
              </motion.div>
            </AnimatePresence>

            <StudioFloatingToolbar
              projectName={genesis.activeProject.name}
              viewMode={genesis.viewMode}
              onViewModeChange={genesis.setViewMode}
              deviceMode={genesis.deviceMode}
              onDeviceModeChange={genesis.setDeviceMode}
              isSaving={genesis.isSaving}
              onShare={() => {}}
              onBack={genesis.goToDashboard}
              isSidebarCollapsed={genesis.isSidebarCollapsed}
              onToggleSidebar={genesis.toggleSidebar}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
