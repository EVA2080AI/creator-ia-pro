import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStudioProjects, StudioFile } from '@/hooks/useStudioProjects';
import { StudioTopbar } from '@/components/studio/StudioTopbar';
import { StudioChat } from '@/components/studio/StudioChat';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { 
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, 
  Loader2, Plus, Copy, Trash2, Code2, Layers,
  Save, Play, Globe, Github, Sparkles, Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { cn } from '@/lib/utils';

/**
 * CodeIDE — Standalone Professional Code Editor Section.
 * Replicates the Triple-Column layout from the user's visual.
 * [File Tree] | [Code Editor] | [Genesis Chat]
 */
export default function CodeIDE() {
  const { user } = useAuth('/auth');
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  // --- Project State ---
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    loading: loadingProjects, 
    updateProjectFiles,
    createProject
  } = useStudioProjects();

  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamPreview, setStreamPreview] = useState('');

  // --- Sidebar Visibility ---
  const [showFileTree, setShowFileTree] = useState(true);
  const [showChat, setShowChat] = useState(true);

  // --- Initialization ---
  useEffect(() => {
    if (loadingProjects) return;
    
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setActiveProject(project);
      } else {
        toast.error('Proyecto no encontrado');
        navigate('/code', { replace: true });
      }
    } else if (projects.length > 0) {
      // Direct Entry: Auto-select most recent project
      const lastProject = [...projects].sort((a, b) => 
        new Date(b.updated_at ?? b.created_at ?? 0).getTime() - 
        new Date(a.updated_at ?? a.created_at ?? 0).getTime()
      )[0];
      navigate(`/code?project=${lastProject.id}`, { replace: true });
    } else {
      // If no projects exist, create a default "My Space"
      handleCreateNew();
    }
  }, [projectId, projects, loadingProjects, setActiveProject, navigate]);

  const { setActions, clearActions } = useWorkspaceActions();

  // --- Workspace Actions (Sidebar) ---
  useEffect(() => {
    if (!activeProject) {
      clearActions();
      return;
    }

    setActions([
      {
        id: 'ide-main',
        label: 'Proyecto',
        actions: [
          {
            id: 'save',
            label: 'Guardar',
            icon: Save,
            onClick: () => toast.success('Cambios guardados')
          },
          {
            id: 'run',
            label: 'Ejecutar',
            icon: Play,
            variant: 'primary',
            onClick: () => toast.info('Iniciando entorno...')
          }
        ]
      },
      {
        id: 'ide-remote',
        label: 'Despliegue',
        actions: [
          {
            id: 'publish',
            label: 'Publicar',
            icon: Globe,
            onClick: () => toast.info('Publicación próximamente')
          },
          {
            id: 'github',
            label: 'Sync GitHub',
            icon: Github,
            onClick: () => toast.info('GitHub Sync habilitado')
          }
        ]
      }
    ], activeProject.name);

    return () => clearActions();
  }, [activeProject, setActions, clearActions]);

  // Set default active file
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
  };

  const handleCreateNew = async () => {
    const p = await createProject('Proyecto Nuevo');
    if (p) navigate(`/code?project=${p.id}`);
  };

  if (loadingProjects || (!activeProject && projects.length > 0)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Iniciando Creator IDE...</p>
      </div>
    );
  }

  // --- Direct Entry Check ---
  if (!activeProject) return null;

  return (
    <>
      <Helmet><title>{activeProject.name} | Creator IDE</title></Helmet>
      
      <div className="flex flex-col h-full bg-[#0d1117] overflow-hidden text-zinc-300 selection:bg-primary/30 font-sans">
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- VSCode Styled Topbar --- */}
        <StudioTopbar 
          projectName={activeProject.name}
          viewMode="code"
          onViewModeChange={() => navigate('/studio')}
          deviceMode="desktop"
          onDeviceModeChange={() => {}}
          isSaving={isSaving}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Enlace copiado');
          }}
          onBack={() => navigate('/dashboard')}
          onGithubSync={() => toast.info('Sincronizando con GitHub...')}
          onPublish={() => toast.info('Desplegando en Vercel...')}
          credits={profile?.credits_balance ?? 0}
          userProfile={profile}
          hideGlobalNav={true}
        />

        {/* --- Main Workspace Area --- */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {/* A. ACTIVITY BAR (VSCode Far Left) */}
          <div className="w-[48px] shrink-0 bg-[#0d1117] border-r border-white/5 flex flex-col items-center py-4 gap-4 relative z-50">
            <button className="p-2 text-white/40 hover:text-white transition-all bg-white/5 rounded-lg border border-white/10" title="Explorer">
              <Code2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/20 hover:text-white transition-all" title="GitHub Sync" onClick={() => toast.info('GitHub Hub Conectado')}>
              <Github className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/20 hover:text-white transition-all" title="Deploy" onClick={() => toast.info('Vercel Deploy')}>
              <Globe className="w-5 h-5" />
            </button>
            <div className="mt-auto flex flex-col items-center gap-4">
               <button onClick={() => navigate('/dashboard')} className="p-2 text-white/20 hover:text-white transition-all" title="Inicio">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <ResizablePanelGroup direction="horizontal" className="flex-1 items-stretch">
            {/* 1. File Explorer (Left Sidebar) */}
            {showFileTree && (
              <>
                <ResizablePanel 
                  defaultSize={16} 
                  minSize={10} 
                  maxSize={30}
                  className="bg-[#010409] border-r border-white/5 transition-all"
                >
                  <div className="h-full flex flex-col relative">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#010409]/80 backdrop-blur-md">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">EXPLORER</span>
                      <button 
                        onClick={() => setShowFileTree(false)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
                      >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <StudioFileTree 
                        files={activeProject.files} 
                        selectedFile={activeFile || ''} 
                        onSelect={setActiveFile} 
                      />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-transparent border-none w-1 hover:bg-primary/20 transition-colors" />
              </>
            )}

            {/* 2. Main Editor (Center) */}
            <ResizablePanel defaultSize={showChat ? 59 : 84} className="flex flex-col min-w-0 bg-[#0d1117] relative">
              {/* Tabs / Breadcrumbs */}
              <div className="h-10 px-4 flex items-center gap-4 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md shrink-0 relative z-10">
                {!showFileTree && (
                  <button 
                    onClick={() => setShowFileTree(true)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
                  >
                    <PanelLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center gap-2 text-[11px] font-bold text-white/30 truncate">
                  <span className="hover:text-white cursor-pointer transition-colors opacity-60">workspace</span>
                  <span className="text-white/10">›</span>
                  <span className="text-white/80 font-black">{activeFile || 'Select File'}</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2 opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Read Only Mode</span>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-hidden relative">
                <StudioCodeEditor 
                  selectedFile={activeFile || ''}
                  projectFiles={activeProject.files}
                  onFilesChange={handleFilesChange}
                  isGenerating={isGenerating}
                  streamPreview={streamPreview}
                />

                {/* STICKY AI BUTTON (Bottom Left of Editor) */}
                <div className="absolute bottom-6 left-6 z-50">
                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={cn(
                      "group flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 shadow-2xl relative overflow-hidden active:scale-95",
                      showChat 
                        ? "bg-zinc-900 border border-white/20 text-white" 
                        : "bg-white text-zinc-950 border border-zinc-200"
                    )}
                  >
                    {/* Pulsating Glow */}
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/20 shrink-0 relative z-10">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest relative z-10">
                      {showChat ? 'Close Architect' : 'Ask Antigravity'}
                    </span>
                    
                    {/* Status Dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
                  </button>
                </div>
              </div>
            </ResizablePanel>

            {/* 3. Antigravity AI Panel (Right) */}
            {showChat && (
              <>
                <ResizableHandle withHandle className="bg-transparent border-none w-1 hover:bg-primary/20 transition-colors" />
                <ResizablePanel 
                  defaultSize={25} 
                  minSize={20} 
                  maxSize={40}
                  className="bg-[#0d1117] border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.2)]"
                >
                  <div className="h-full flex flex-col relative">
                    {/* Header */}
                    <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 border border-primary/20">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">ANTIGRAVITY IA</span>
                      </div>
                      <button 
                        onClick={() => setShowChat(false)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
                      >
                        <PanelRightClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Chat Section */}
                    <div className="flex-1 overflow-hidden bg-[#0d1117]">
                      <StudioChat 
                        projectId={activeProject.id} 
                        projectFiles={activeProject.files}
                        onCodeGenerated={handleCodeGenerated}
                        onGeneratingChange={setIsGenerating}
                        onStreamCharsChange={(chars, preview) => {
                          setStreamPreview(preview);
                        }}
                        persona="antigravity"
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
    </>
  );
}
