import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Monitor, Smartphone, Tablet, Plus, Trash2,
  Github, ArrowLeft, Loader2, FolderOpen, Files,
  MessageSquare, ChevronDown, ChevronRight, Pencil, Check, X,
  UploadCloud
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioChat } from '@/components/studio/StudioChat';
import { useStudioProjects, type StudioFile, type StudioProject } from '@/hooks/useStudioProjects';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
// Studio requires auth — handled by AppHeader redirect
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type PanelView = 'code' | 'preview' | 'split';
type SidebarView = 'files' | 'projects' | 'github';

export default function Studio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects, activeProject, setActiveProject,
    loading, createProject, updateProjectFiles,
    renameProject, deleteProject
  } = useStudioProjects();

  const [selectedFile, setSelectedFile] = useState('App.tsx');
  const [panelView, setPanelView] = useState<PanelView>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [sidebarView, setSidebarView] = useState<SidebarView>('files');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [savingGithub, setSavingGithub] = useState(false);
  const [pushingGithub, setPushingGithub] = useState(false);

  const projectFiles = activeProject?.files || {};

  const handleFilesChange = useCallback((files: Record<string, StudioFile>) => {
    if (activeProject) updateProjectFiles(activeProject.id, files);
  }, [activeProject, updateProjectFiles]);

  const handleCodeGenerated = useCallback((files: Record<string, StudioFile>) => {
    if (!activeProject) return;
    const merged = { ...projectFiles, ...files };
    updateProjectFiles(activeProject.id, merged);
    // Select first generated file
    const firstFile = Object.keys(files)[0];
    if (firstFile) setSelectedFile(firstFile);
  }, [activeProject, projectFiles, updateProjectFiles]);

  const handleAddFile = (name: string) => {
    if (!activeProject) return;
    const updated = {
      ...projectFiles,
      [name]: { language: name.endsWith('.css') ? 'css' : name.endsWith('.json') ? 'json' : 'tsx', content: `// ${name}\n` }
    };
    updateProjectFiles(activeProject.id, updated);
    setSelectedFile(name);
  };

  const handleDeleteFile = (name: string) => {
    if (!activeProject || name === 'App.tsx') return;
    const updated = { ...projectFiles };
    delete updated[name];
    updateProjectFiles(activeProject.id, updated);
    if (selectedFile === name) setSelectedFile('App.tsx');
  };

  const startRename = (project: StudioProject) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const confirmRename = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    await renameProject(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  // GitHub push: create/update files in a GitHub repo via API
  const handleGithubPush = async () => {
    if (!githubToken || !githubRepo || !activeProject) {
      toast.error('Configura tu token de GitHub y el nombre del repositorio');
      return;
    }
    setPushingGithub(true);
    try {
      const [owner, repo] = githubRepo.includes('/') ? githubRepo.split('/') : ['', githubRepo];
      if (!owner || !repo) { toast.error('Formato: usuario/repositorio'); return; }

      // Get or create repo
      const repoCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
      });

      if (!repoCheckRes.ok) {
        // Try to create repo
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ name: repo, description: `Proyecto de Creator IA Pro: ${activeProject.name}`, private: false, auto_init: true }),
        });
        if (!createRes.ok) { toast.error('No se pudo crear el repositorio'); return; }
        toast.info(`Repositorio ${repo} creado`);
        await new Promise((r) => setTimeout(r, 2000)); // wait for repo init
      }

      // Push each file
      let pushed = 0;
      for (const [filename, file] of Object.entries(projectFiles)) {
        const content = btoa(unescape(encodeURIComponent(file.content)));
        // Get current SHA if file exists
        const shaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
          headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
        });
        const shaData = shaRes.ok ? await shaRes.json() : null;
        const sha = shaData?.sha;

        const pushRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
          method: 'PUT',
          headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({
            message: `feat: update ${filename} from Creator IA Pro Studio`,
            content,
            ...(sha ? { sha } : {}),
          }),
        });

        if (pushRes.ok) pushed++;
      }

      toast.success(`${pushed} archivos enviados a github.com/${owner}/${repo}`);

      // Save connection to DB
      if (user) {
        await supabase.from('github_connections').upsert({
          user_id: user.id,
          github_username: owner,
          access_token: githubToken,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    } catch (e) {
      console.error('GitHub push error:', e);
      toast.error('Error al enviar a GitHub');
    } finally {
      setPushingGithub(false);
    }
  };

  // Download project as zip-like HTML
  const handleDownload = () => {
    if (!activeProject) return;
    const content = JSON.stringify({ name: activeProject.name, files: projectFiles }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030304]">
        <Loader2 className="h-8 w-8 animate-spin text-aether-purple" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020203] overflow-hidden">
      <AppHeader />

      {/* Studio Top Bar */}
      <div className="flex h-12 items-center gap-3 px-4 border-b border-white/[0.05] bg-[#030304] shrink-0 z-10">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 text-white/30 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest font-display hidden sm:block">Chat</span>
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Project selector */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Code2 className="h-4 w-4 text-aether-purple shrink-0" />
          {activeProject ? (
            <span className="text-[13px] font-bold text-white truncate font-display">{activeProject.name}</span>
          ) : (
            <span className="text-[13px] text-white/30">Sin proyecto</span>
          )}
        </div>

        {/* Panel view toggle */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.05]">
          {(['code', 'split', 'preview'] as PanelView[]).map((v) => (
            <button
              key={v}
              onClick={() => setPanelView(v)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-display ${
                panelView === v ? 'bg-aether-purple/20 text-aether-purple border border-aether-purple/30' : 'text-white/30 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Device toggles */}
        <div className="hidden md:flex items-center gap-1">
          {([
            { mode: 'desktop', Icon: Monitor },
            { mode: 'tablet', Icon: Tablet },
            { mode: 'mobile', Icon: Smartphone },
          ] as { mode: DeviceMode; Icon: any }[]).map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode)}
              className={`p-2 rounded-xl transition-all ${
                deviceMode === mode ? 'text-aether-blue bg-aether-blue/10 border border-aether-blue/20' : 'text-white/20 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleDownload}
          disabled={!activeProject}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all font-display uppercase tracking-widest"
        >
          Exportar
        </button>

        <button
          onClick={() => setSidebarView('github')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/40 hover:text-white hover:border-white/20 transition-all font-display uppercase tracking-widest"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:block">GitHub</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left activity bar */}
        <div className="flex flex-col items-center gap-2 w-12 py-3 border-r border-white/[0.05] bg-[#030304] shrink-0">
          {([
            { view: 'files', Icon: Files, label: 'Archivos' },
            { view: 'projects', Icon: FolderOpen, label: 'Proyectos' },
            { view: 'github', Icon: Github, label: 'GitHub' },
          ] as { view: SidebarView; Icon: any; label: string }[]).map(({ view, Icon, label }) => (
            <button
              key={view}
              onClick={() => setSidebarView(sidebarView === view ? 'files' : view)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                sidebarView === view
                  ? 'bg-aether-purple/20 text-aether-purple border border-aether-purple/30'
                  : 'text-white/20 hover:bg-white/5 hover:text-white'
              }`}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => createProject()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/20 hover:bg-aether-purple/10 hover:text-aether-purple transition-all"
            title="Nuevo proyecto"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar panel */}
        <div className="w-56 shrink-0 border-r border-white/[0.05] overflow-hidden flex flex-col">
          {sidebarView === 'files' && (
            <StudioFileTree
              files={projectFiles}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {sidebarView === 'projects' && (
            <div className="flex flex-col h-full bg-[#030304]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Proyectos</span>
                <span className="text-[10px] text-white/20 font-bold">{projects.length}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
                {projects.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <FolderOpen className="h-6 w-6 text-white/10" />
                    <span className="text-[11px] text-white/20">Sin proyectos aún</span>
                    <button
                      onClick={() => createProject()}
                      className="text-[10px] text-aether-purple/60 hover:text-aether-purple transition-colors font-bold uppercase tracking-widest"
                    >
                      Crear primero
                    </button>
                  </div>
                )}
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                      activeProject?.id === p.id
                        ? 'bg-aether-purple/15 border-aether-purple/30 text-white'
                        : 'text-white/40 hover:bg-white/[0.03] hover:text-white border-transparent'
                    }`}
                    onClick={() => { setActiveProject(p); setSidebarView('files'); }}
                  >
                    {renamingId === p.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
                        onBlur={confirmRename}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-b border-aether-purple/40 text-[11px] text-white outline-none"
                      />
                    ) : (
                      <span className="text-[11px] font-medium truncate flex-1">{p.name}</span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(p); }}
                        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-all"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                        className="p-1 rounded hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sidebarView === 'github' && (
            <div className="flex flex-col h-full bg-[#030304] overflow-y-auto">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
                <Github className="h-4 w-4 text-white/40" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">GitHub</span>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-display">Token de acceso</label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-aether-purple/40 transition-colors font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-display">Repositorio</label>
                  <input
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="usuario/mi-repo"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-aether-purple/40 transition-colors font-mono"
                  />
                </div>
                <button
                  onClick={handleGithubPush}
                  disabled={pushingGithub || !githubToken || !githubRepo}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-black text-[11px] font-bold disabled:opacity-30 hover:bg-white/90 transition-all active:scale-95"
                >
                  {pushingGithub
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…</>
                    : <><UploadCloud className="h-3.5 w-3.5" /> Push a GitHub</>
                  }
                </button>
                <p className="text-[9px] text-white/20 leading-relaxed">
                  Necesitas un token con permisos <strong className="text-white/40">repo</strong>. Si el repositorio no existe, se creará automáticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Code panel */}
          {(panelView === 'code' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-1/2 border-r border-white/[0.05]' : 'flex-1'}`}>
              {activeProject ? (
                <StudioCodeEditor
                  selectedFile={selectedFile}
                  projectFiles={projectFiles}
                  onFilesChange={handleFilesChange}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                  <Code2 className="h-12 w-12 text-white/10" />
                  <h3 className="text-lg font-bold text-white/30 font-display">Crea tu primer proyecto</h3>
                  <p className="text-sm text-white/20 max-w-xs">Usa el panel de la izquierda para crear un nuevo proyecto y empieza a construir con IA.</p>
                  <button
                    onClick={() => createProject()}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-aether-purple text-white text-sm font-bold hover:bg-aether-purple/80 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo Proyecto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Preview panel */}
          {(panelView === 'preview' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-1/2' : 'flex-1'}`}>
              <StudioPreview
                files={projectFiles}
                deviceMode={deviceMode}
                onDeviceModeChange={setDeviceMode}
              />
            </div>
          )}
        </div>

        {/* Right: AI Chat — desktop */}
        <div className="hidden lg:flex w-80 shrink-0 border-l border-white/[0.05] flex-col overflow-hidden">
          <StudioChat
            projectId={activeProject?.id || null}
            projectFiles={projectFiles}
            onCodeGenerated={handleCodeGenerated}
          />
        </div>

        {/* Mobile chat button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-aether-purple text-white shadow-lg shadow-aether-purple/30 hover:bg-aether-purple/80 transition-all">
                <MessageSquare className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[380px] p-0 bg-[#030304] border-white/[0.05]">
              <StudioChat
                projectId={activeProject?.id || null}
                projectFiles={projectFiles}
                onCodeGenerated={handleCodeGenerated}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
