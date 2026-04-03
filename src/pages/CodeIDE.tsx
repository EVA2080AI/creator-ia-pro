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
  Save, Play, Globe, Github
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
        navigate('/code');
      }
    } else {
      // Clear active project if no ID in URL (Selection Mode)
      setActiveProject(null);
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
            onClick: () => toast.info('GitHub Sync próximamente')
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

  const { duplicateProject, createProject, deleteProject } = useStudioProjects();

  const handleCreateNew = async () => {
    const p = await createProject('Nuevo Proyecto');
    if (p) navigate(`/code?project=${p.id}`);
  };

  if (loadingProjects) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-sm font-medium animate-pulse tracking-wide">Iniciando Code IDE...</p>
      </div>
    );
  }

  // --- SELECTION HUB (When no project is active) ---
  if (!activeProject) {
    return (
      <div className="h-screen w-full bg-background overflow-y-auto p-8 selection:bg-primary/30">
        <Helmet><title>Editor | Creator IA Pro</title></Helmet>
        
        <div className="max-w-6xl mx-auto py-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                Entorno Onyx
              </div>
              <h1 className="text-4xl font-black text-white mb-2">Editor de Código</h1>
              <p className="text-white/40 text-[15px]">Crea desde cero o perfecciona tus proyectos de Genesis.</p>
            </div>
            
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => {
              const fileCount = Object.keys(p.files).length;
              const hasGenesis = p.name.toLowerCase().includes('genesis') || p.description?.includes('genesis');
              
              return (
                <div 
                  key={p.id}
                  className="group relative flex flex-col bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => navigate(`/code?project=${p.id}`)}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                      <Code2 className="w-6 h-6 text-primary" />
                    </div>
                    {hasGenesis && (
                      <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[9px] font-black text-violet-400 uppercase tracking-widest">
                        Genesis
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-white/30 text-[11px] mb-4 line-clamp-2">
                      {p.description || `Proyecto de ${fileCount} archivos creado el ${new Date(p.created_at).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       <Layers className="w-3.5 h-3.5 text-white/20" />
                       <span className="text-[10px] font-bold text-white/40">{fileCount} archivos</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateProject(p);
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                        title="Duplicar (Proteger original)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar proyecto?')) deleteProject(p.id);
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {projects.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Code2 className="w-10 h-10 text-white/10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No tienes proyectos aún</h2>
              <p className="text-white/30 text-sm mb-8">Empieza creando tu primer espacio de trabajo o usa Genesis.</p>
              <button 
                onClick={handleCreateNew}
                className="bg-primary text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                Crear Mi Primer Proyecto
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Code IDE | Creator IA Pro</title></Helmet>
      
      <div className="flex flex-col h-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      
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
        <div className="flex-1 overflow-hidden relative">
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
        </div>
      </div>
    </div>
    </>
  );
}
