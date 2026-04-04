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
  PanelLeftClose, PanelLeft, PanelRightClose,
  Loader2, Plus, Code2, List,
  Save, Play, Globe, Github, Sparkles, Bot,
  Search, GitBranch, Package, Settings, User,
  ChevronRight, ChevronDown, Clock, AlertCircle,
  CheckCircle2, Terminal, MoreHorizontal
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
 * CodeIDE — Professional VSCode-style IDE (GitHub.dev aesthetic)
 * Full light theme with Activity Bar, Explorer sections, Welcome screen, Status Bar
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

  // --- Panel Visibility ---
  const [showFileTree, setShowFileTree] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [activeActivityTab, setActiveActivityTab] = useState<'explorer' | 'search' | 'git' | 'extensions'>('explorer');

  // --- Explorer Section Toggles ---
  const [showOutline, setShowOutline] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);

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
      const lastProject = [...projects].sort((a, b) => 
        new Date(b.updated_at ?? b.created_at ?? 0).getTime() - 
        new Date(a.updated_at ?? a.created_at ?? 0).getTime()
      )[0];
      navigate(`/code?project=${lastProject.id}`, { replace: true });
    } else {
      handleCreateNew();
    }
  }, [projectId, projects, loadingProjects, setActiveProject, navigate]);

  const { setActions, clearActions } = useWorkspaceActions();

  useEffect(() => {
    if (!activeProject) { clearActions(); return; }
    setActions([
      {
        id: 'ide-main', label: 'Proyecto',
        actions: [
          { id: 'save', label: 'Guardar', icon: Save, onClick: () => toast.success('Cambios guardados') },
          { id: 'run', label: 'Ejecutar', icon: Play, variant: 'primary', onClick: () => toast.info('Iniciando entorno...') }
        ]
      },
      {
        id: 'ide-remote', label: 'Despliegue',
        actions: [
          { id: 'publish', label: 'Publicar', icon: Globe, onClick: () => toast.info('Publicación próximamente') },
          { id: 'github', label: 'Sync GitHub', icon: Github, onClick: () => toast.info('GitHub Sync habilitado') }
        ]
      }
    ], activeProject.name);
    return () => clearActions();
  }, [activeProject, setActions, clearActions]);

  useEffect(() => {
    if (activeProject && !activeFile) {
      const files = Object.keys(activeProject.files);
      if (files.includes('App.tsx')) setActiveFile('App.tsx');
      else if (files.length > 0) setActiveFile(files[0]);
    }
  }, [activeProject, activeFile]);

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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Iniciando Creator IDE...</p>
      </div>
    );
  }

  if (!activeProject) return null;

  // Derived: file outline (top-level keys as pseudo-symbols)
  const fileKeys = activeFile ? Object.keys(activeProject.files) : [];
  const outlineItems = activeFile 
    ? (activeProject.files[activeFile]?.content ?? '')
        .split('\n')
        .filter(l => l.match(/^(export |function |const |class |interface |type )/))
        .slice(0, 8)
    : [];

  // Status bar info
  const branch = 'main';
  const errorCount = 0;
  const warnCount = 0;
  const language = activeFile?.split('.').pop()?.toUpperCase() ?? 'PLAIN';

  return (
    <>
      <Helmet><title>{activeProject.name} | Creator IDE</title></Helmet>
      
      <div className="flex flex-col h-full bg-white overflow-hidden text-zinc-800 font-sans select-none">
      
        {/* ── StudioTopbar ── */}
        <StudioTopbar 
          projectName={activeProject.name}
          viewMode="code"
          onViewModeChange={() => navigate('/studio')}
          deviceMode="desktop"
          onDeviceModeChange={() => {}}
          isSaving={isSaving}
          onShare={() => { navigator.clipboard.writeText(window.location.href); toast.success('Enlace copiado'); }}
          onBack={() => navigate('/dashboard')}
          onGithubSync={() => toast.info('Sincronizando con GitHub...')}
          onPublish={() => toast.info('Desplegando en Vercel...')}
          credits={profile?.credits_balance ?? 0}
          userProfile={profile}
          hideGlobalNav={true}
        />

        {/* ── Main IDE Area ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden relative flex">

            {/* ════════════════════ ACTIVITY BAR ════════════════════ */}
            <div className="w-[48px] shrink-0 bg-zinc-100 border-r border-zinc-200/80 flex flex-col items-center py-2 gap-1 relative z-50">
              {/* Top Icons */}
              {[
                { id: 'explorer' as const, icon: Code2,      label: 'Explorador' },
                { id: 'search'   as const, icon: Search,     label: 'Buscar' },
                { id: 'git'      as const, icon: GitBranch,  label: 'Control de Versiones' },
                { id: 'extensions' as const, icon: Package,  label: 'Extensiones' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveActivityTab(id); if (!showFileTree) setShowFileTree(true); }}
                  title={label}
                  className={cn(
                    "w-full flex-1 max-h-[48px] flex items-center justify-center transition-all relative",
                    activeActivityTab === id
                      ? "text-zinc-900 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-primary before:rounded-r"
                      : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  <Icon className="w-[22px] h-[22px]" />
                </button>
              ))}

              {/* Bottom Icons */}
              <div className="mt-auto flex flex-col items-center w-full gap-1 pb-2">
                <button onClick={() => toast.info('Configuración próximamente')} title="Configuración"
                  className="w-full flex-1 max-h-[48px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-all">
                  <Settings className="w-[22px] h-[22px]" />
                </button>
                <button onClick={() => navigate('/profile')} title="Perfil"
                  className="w-full flex-1 max-h-[48px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-all">
                  <User className="w-[22px] h-[22px]" />
                </button>
              </div>
            </div>

            <ResizablePanelGroup direction="horizontal" className="flex-1 items-stretch">
              
              {/* ════════════════════ FILE EXPLORER ════════════════════ */}
              {showFileTree && (
                <>
                  <ResizablePanel defaultSize={18} minSize={12} maxSize={32}
                    className="bg-zinc-50 border-r border-zinc-200/80 transition-all flex flex-col">
                    
                    {/* Explorer Header */}
                    <div className="h-9 px-4 flex items-center justify-between border-b border-zinc-200/60 shrink-0">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">EXPLORADOR</span>
                      <div className="flex items-center gap-1">
                        <button onClick={handleCreateNew} title="Nuevo Archivo"
                          className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-all">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setShowFileTree(false)} title="Cerrar Explorador"
                          className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-all">
                          <PanelLeftClose className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {/* Project Files Section */}
                      <div>
                        <button
                          className="w-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em] hover:bg-zinc-100 transition-all"
                        >
                          <ChevronDown className="w-3 h-3 shrink-0" />
                          <span className="truncate">{activeProject.name.toUpperCase()}</span>
                        </button>
                        <StudioFileTree 
                          files={activeProject.files} 
                          selectedFile={activeFile || ''} 
                          onSelect={setActiveFile} 
                        />
                      </div>

                      {/* ESQUEMA (Outline) Section */}
                      <div className="border-t border-zinc-200/60 mt-1">
                        <button
                          onClick={() => setShowOutline(!showOutline)}
                          className="w-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all"
                        >
                          {showOutline ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          ESQUEMA
                        </button>
                        {showOutline && (
                          <div className="px-3 pb-2">
                            {outlineItems.length > 0 ? (
                              outlineItems.map((line, i) => (
                                <div key={i} className="flex items-center gap-2 py-0.5 px-2 rounded text-[11px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all cursor-pointer truncate">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                  <span className="truncate font-mono">{line.trim().slice(0, 32)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-zinc-400 px-2 py-1 italic">Sin símbolos disponibles</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* LÍNEA DE TIEMPO (Timeline) Section */}
                      <div className="border-t border-zinc-200/60">
                        <button
                          onClick={() => setShowTimeline(!showTimeline)}
                          className="w-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all"
                        >
                          {showTimeline ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          LÍNEA DE TIEMPO
                        </button>
                        {showTimeline && (
                          <div className="px-3 pb-3 space-y-1">
                            {[
                              { label: 'Guardado automático', time: 'hace 2 min' },
                              { label: 'Commit: feat/update', time: 'hace 1h' },
                              { label: 'Proyecto creado', time: 'hace 3h' },
                            ].map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-100 transition-all cursor-pointer group">
                                <Clock className="w-3 h-3 text-zinc-300 group-hover:text-zinc-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[11px] text-zinc-600 truncate">{entry.label}</p>
                                  <p className="text-[9px] text-zinc-400">{entry.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-transparent border-none w-1 hover:bg-primary/20 transition-colors" />
                </>
              )}

              {/* ════════════════════ MAIN EDITOR ════════════════════ */}
              <ResizablePanel defaultSize={showChat ? 57 : 82} className="flex flex-col min-w-0 bg-white relative">
                {/* Tab Bar / Breadcrumbs */}
                <div className="h-9 flex items-stretch border-b border-zinc-200/80 bg-zinc-50 shrink-0">
                  {!showFileTree && (
                    <button onClick={() => setShowFileTree(true)}
                      className="px-3 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all border-r border-zinc-200">
                      <PanelLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Active Tab */}
                  {activeFile && (
                    <div className="flex items-center gap-2 px-4 bg-white border-r border-zinc-200 border-b-2 border-b-primary -mb-px">
                      <span className="text-[11px] font-bold text-zinc-700">{activeFile}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    </div>
                  )}
                  <div className="flex-1" />
                  {/* Breadcrumb right side */}
                  <div className="flex items-center px-3 gap-2 text-zinc-400 text-[10px]">
                    <span>{activeProject.name}</span>
                    {activeFile && <><span>›</span><span className="text-zinc-600">{activeFile}</span></>}
                  </div>
                </div>

                {/* Code Editor Area */}
                <div className="flex-1 overflow-hidden relative">
                  {activeFile ? (
                    <StudioCodeEditor 
                      selectedFile={activeFile}
                      projectFiles={activeProject.files}
                      onFilesChange={handleFilesChange}
                      isGenerating={isGenerating}
                      streamPreview={streamPreview}
                    />
                  ) : (
                    /* Welcome Screen — VSCode Style */
                    <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-8">
                      <div className="relative">
                        <div className="w-24 h-24 opacity-[0.07]">
                          <svg viewBox="0 0 100 100" fill="currentColor" className="text-zinc-900 w-full h-full">
                            <path d="M65.4 2.1L20.5 44.4 5.3 31.6 0 36.5l5.3 4.7L0 45.9l5.3 4.8L0 54.1l5.3 4.8L0 63.5l5.3 4.7-5.3 4.8 20.5-12.8L20 97.9l79.7-47.5V49.6L65.4 2.1zM20 85l.1-62.9L88 50 20 85z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-sm font-black text-zinc-900 tracking-tight">{activeProject.name}</h2>
                        <p className="text-xs text-zinc-400">Selecciona un archivo del explorador para empezar</p>
                      </div>
                      <div className="space-y-2 w-full max-w-xs">
                        {[
                          { label: 'Mostrar todos los comandos', keys: ['⌘', 'P'] },
                          { label: 'Buscar en archivos',         keys: ['⌘', 'F'] },
                          { label: 'Ir al archivo',              keys: ['⇧', '⌘', 'P'] },
                        ].map(({ label, keys }) => (
                          <div key={label} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-zinc-50 transition-all cursor-pointer group">
                            <span className="text-[12px] text-zinc-500 group-hover:text-zinc-700 transition-colors">{label}</span>
                            <div className="flex items-center gap-1">
                              {keys.map(k => (
                                <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-100 border border-zinc-200 text-zinc-500">{k}</kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STICKY AI BUTTON */}
                  <div className="absolute bottom-6 left-6 z-50">
                    <button 
                      onClick={() => setShowChat(!showChat)}
                      className={cn(
                        "group flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 shadow-lg relative overflow-hidden active:scale-95",
                        showChat 
                          ? "bg-zinc-900 text-white border border-zinc-700" 
                          : "bg-white text-zinc-900 border border-zinc-200 hover:shadow-xl"
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 shrink-0">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {showChat ? 'Cerrar IA' : 'Antigravity'}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </button>
                  </div>
                </div>
              </ResizablePanel>

              {/* ════════════════════ ANTIGRAVITY AI PANEL ════════════════════ */}
              {showChat && (
                <>
                  <ResizableHandle withHandle className="bg-transparent border-none w-1 hover:bg-primary/20 transition-colors" />
                  <ResizablePanel defaultSize={25} minSize={20} maxSize={40}
                    className="bg-zinc-50 border-l border-zinc-200/80">
                    <div className="h-full flex flex-col">
                      {/* AI Panel Header */}
                      <div className="h-9 px-3 flex items-center justify-between border-b border-zinc-200/60 bg-white shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 border border-primary/20">
                            <Bot className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">ANTIGRAVITY IA</span>
                        </div>
                        <button onClick={() => setShowChat(false)}
                          className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700 transition-all">
                          <PanelRightClose className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden bg-white">
                        <StudioChat 
                          projectId={activeProject.id} 
                          projectFiles={activeProject.files}
                          onCodeGenerated={handleCodeGenerated}
                          onGeneratingChange={setIsGenerating}
                          onStreamCharsChange={(chars, preview) => setStreamPreview(preview)}
                          persona="antigravity"
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>

          {/* ════════════════════ STATUS BAR ════════════════════ */}
          <div className="h-[22px] shrink-0 bg-[#0078d4] flex items-center px-3 gap-4 text-white z-50">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button onClick={() => toast.info('Sincronizando con GitHub...')}
                className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-all">
                <GitBranch className="w-3 h-3" />
                <span className="text-[10px] font-bold">{branch}</span>
              </button>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" /> {errorCount}
                </span>
              )}
              {errorCount === 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold opacity-70">
                  <CheckCircle2 className="w-3 h-3" /> Sin errores
                </span>
              )}
            </div>

            {/* Right */}
            <div className="ml-auto flex items-center gap-3 text-[10px] font-bold opacity-80">
              {isSaving && <span className="animate-pulse">Guardando...</span>}
              {isGenerating && <span className="animate-pulse">Generando código...</span>}
              <span>{language}</span>
              <span>UTF-8</span>
              <button onClick={() => toast.info('Terminal próximamente')}
                className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-all">
                <Terminal className="w-3 h-3" />
                <span>Terminal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
