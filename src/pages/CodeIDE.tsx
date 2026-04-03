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
import { PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Loader2 } from 'lucide-react';
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
    updateProjectFiles 
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
        navigate('/ide');
      }
    } else if (projects.length > 0 && !activeProject) {
      // Auto-select first project if none specified
      navigate(`/ide?project=${projects[0].id}`);
    }
  }, [projectId, projects, loadingProjects, setActiveProject, navigate, activeProject]);

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

  if (loadingProjects) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-sm font-medium animate-pulse tracking-wide">Iniciando Code IDE...</p>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-white/20" />
        </div>
        <h2 className="text-xl font-bold text-white">Cargando Espacio de Trabajo</h2>
        <p className="text-white/40 text-sm max-w-xs text-center">Configurando el entorno de desarrollo Onyx...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-foreground selection:bg-primary/30">
      <Helmet><title>Code IDE | Creator IA Pro</title></Helmet>
      <AppHeader 
        userId={user?.id} 
        onSignOut={async () => {
          await supabase.auth.signOut();
          navigate('/auth');
        }} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- Topbar --- */}
        <StudioTopbar 
          projectName={activeProject.name}
          viewMode="code"
          onViewModeChange={() => navigate('/studio')} // Link back to Studio
          deviceMode="desktop"
          onDeviceModeChange={() => {}}
          isSaving={isSaving}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Enlace copiado');
          }}
          onBack={() => navigate('/dashboard')}
          onGithubSync={() => toast.info('GitHub Sync próximamente')}
          onPublish={() => toast.info('Publicación próximamente')}
          credits={profile?.credits_balance ?? 0}
          userProfile={profile}
          hideGlobalNav={true}
        />

        {/* --- Triple-Column Layout --- */}
        <main id="main-content" className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
          
          {/* 1. File Explorer (Left) */}
          {showFileTree && (
            <>
              <ResizablePanel 
                defaultSize={18} 
                minSize={10} 
                maxSize={30}
                className="bg-background/50 backdrop-blur-xl border-r border-white/5 transition-all"
              >
                <div className="h-full flex flex-col">
                  {/* Sidebar Header */}
                  <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">EXPLORER</span>
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
          <ResizablePanel defaultSize={showChat ? 57 : 82} className="flex flex-col min-w-0">
            {/* Editor Top Toolbar (Tabs placeholder or Breadcrumbs) */}
            <div className="h-10 px-4 flex items-center gap-4 border-b border-white/5 bg-background/30 backdrop-blur-md shrink-0">
              {!showFileTree && (
                <button 
                  onClick={() => setShowFileTree(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center gap-2 text-[11px] font-bold text-white/40 truncate">
                <span className="hover:text-white cursor-pointer transition-colors">{activeProject.name}</span>
                <span className="text-white/10">/</span>
                <span className="text-white/80">{activeFile || 'Selecciona un archivo'}</span>
              </div>
              <div className="flex-1" />
              {!showChat && (
                <button 
                  onClick={() => setShowChat(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <StudioCodeEditor 
                selectedFile={activeFile || ''}
                projectFiles={activeProject.files}
                onFilesChange={handleFilesChange}
                isGenerating={isGenerating}
                streamPreview={streamPreview}
              />
            </div>
          </ResizablePanel>

          {/* 3. Genesis AI Chat (Right) */}
          {showChat && (
            <>
              <ResizableHandle withHandle className="bg-transparent border-none w-1 hover:bg-primary/20 transition-colors" />
              <ResizablePanel 
                defaultSize={25} 
                minSize={20} 
                maxSize={40}
                className="bg-background border-l border-white/5"
              >
                <div className="h-full flex flex-col relative">
                  {/* Chat Header */}
                  <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">GENESIS AI</span>
                    </div>
                    <button 
                      onClick={() => setShowChat(false)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
                    >
                      <PanelRightClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* AI Chat Component */}
                  <div className="flex-1 overflow-hidden">
                    <StudioChat 
                      projectId={activeProject.id} 
                      projectFiles={activeProject.files}
                      onCodeGenerated={handleCodeGenerated}
                      onGeneratingChange={setIsGenerating}
                      onStreamCharsChange={(chars, preview) => {
                        setStreamPreview(preview);
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>
      </div>
    </div>
  );
}
