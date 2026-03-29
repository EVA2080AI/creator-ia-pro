/**
 * Genesis — AI Code Builder
 * Lovable-like IDE: describe → generate → preview → push to GitHub
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Monitor, Smartphone, Tablet, Plus, Trash2,
  Github, Loader2, FolderOpen, Files, MessageSquare,
  Pencil, UploadCloud, Zap, ArrowRight, Sparkles
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioChat } from '@/components/studio/StudioChat';
import { useStudioProjects, type StudioFile, type StudioProject } from '@/hooks/useStudioProjects';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type PanelView = 'code' | 'preview' | 'split';
type SidebarView = 'files' | 'projects' | 'github';

// ─── Lovable-like Welcome Screen ────────────────────────────────────────────
const STARTER_PROMPTS = [
  { label: 'Landing page', prompt: 'Crea una landing page moderna con hero section animado, sección de features con iconos, testimonios y footer. Diseño oscuro con gradientes morados.' },
  { label: 'Dashboard', prompt: 'Crea un dashboard con tarjetas de métricas, una tabla de datos con filtros, y un gráfico de barras CSS. Diseño dark minimalista.' },
  { label: 'Login / Auth', prompt: 'Crea un sistema de login y registro con formularios validados, estados de error, y diseño moderno con glassmorphism.' },
  { label: 'E-commerce', prompt: 'Crea una página de producto de e-commerce con galería de imágenes, selector de variantes, precio, y botón de compra. Diseño premium.' },
  { label: 'Portfolio', prompt: 'Crea un portfolio personal con sección hero, proyectos en grid, habilidades con barras de progreso, y formulario de contacto.' },
  { label: 'Kanban Board', prompt: 'Crea un tablero Kanban con columnas (Por hacer, En progreso, Hecho), tarjetas con prioridad, y diseño drag-like.' },
];

interface WelcomeScreenProps {
  onPrompt: (prompt: string) => void;
  onCreateProject: () => void;
  creating: boolean;
  projects: StudioProject[];
  onSelectProject: (p: StudioProject) => void;
}

function WelcomeScreen({ onPrompt, onCreateProject, creating, projects, onSelectProject }: WelcomeScreenProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onPrompt(input.trim());
  };

  const hasProjects = projects.length > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-aether-purple/8 blur-[100px] rounded-full pointer-events-none" />

      {/* Logo mark */}
      <div className="relative mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aether-purple/30 to-aether-blue/20 border border-white/10 shadow-2xl">
          <Code2 className="h-7 w-7 text-aether-purple" />
        </div>
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-aether-purple shadow-[0_0_12px_rgba(74,222,128,0.8)] flex items-center justify-center">
          <Sparkles className="h-2.5 w-2.5 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-black text-white font-display tracking-tight mb-2 text-center">
        Genesis
      </h1>
      <p className="text-white/40 text-sm text-center mb-10 max-w-xs leading-relaxed">
        Describe lo que quieres construir. La IA genera el código completo.
      </p>

      {/* Recent projects — returning users */}
      {hasProjects && (
        <div className="w-full max-w-xl mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">Proyectos recientes</p>
            <button
              onClick={onCreateProject}
              disabled={creating}
              className="flex items-center gap-1 text-[10px] font-bold text-aether-purple/60 hover:text-aether-purple transition-colors"
            >
              <Plus className="h-3 w-3" />
              Nuevo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {projects.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className="flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-aether-purple/30 hover:bg-aether-purple/5 transition-all text-left group"
              >
                <div className="flex items-center gap-2 w-full min-w-0">
                  <FolderOpen className="h-3.5 w-3.5 text-white/20 group-hover:text-aether-purple shrink-0 transition-colors" />
                  <span className="text-[12px] font-semibold text-white/70 group-hover:text-white truncate transition-colors">{p.name}</span>
                </div>
                <span className="text-[10px] text-white/20 pl-5">
                  {new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </button>
            ))}
          </div>
          {projects.length > 4 && (
            <p className="text-center text-[10px] text-white/20 mt-2">+{projects.length - 4} más en la barra lateral</p>
          )}
        </div>
      )}

      {/* Main input */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mb-6">
        <div className="relative flex flex-col gap-0 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-aether-purple/50 focus-within:bg-white/[0.05] transition-all overflow-hidden shadow-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) onPrompt(input.trim()); } }}
            placeholder="Crea una app de gestión de tareas con modo oscuro, drag & drop, y etiquetas de prioridad..."
            className="w-full bg-transparent px-5 pt-5 pb-3 text-[14px] text-white placeholder:text-white/20 outline-none resize-none min-h-[100px] leading-relaxed"
            rows={3}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-[11px] text-white/20">Enter para enviar · Shift+Enter nueva línea</span>
            <button
              type="submit"
              disabled={!input.trim() || creating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aether-purple text-white text-[12px] font-bold disabled:opacity-30 hover:bg-aether-purple/80 transition-all active:scale-95"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
              Generar
            </button>
          </div>
        </div>
      </form>

      {/* Starter suggestions */}
      <div className="w-full max-w-xl">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-display mb-3 text-center">{hasProjects ? 'O empieza algo nuevo' : 'Empieza con'}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STARTER_PROMPTS.map((s) => (
            <button
              key={s.label}
              onClick={() => onPrompt(s.prompt)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[11px] text-white/50 hover:text-white hover:border-aether-purple/30 hover:bg-aether-purple/5 transition-all text-left group"
            >
              <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-aether-purple shrink-0 transition-colors" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-aether-purple/8 border border-aether-purple/15">
          <Zap className="h-3 w-3 text-aether-purple" />
          <span className="text-[10px] font-bold text-aether-purple/70">~5 créditos por generación</span>
        </div>
        {!hasProjects && (
          <button
            onClick={onCreateProject}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-white/40 hover:text-white hover:border-white/20 transition-all"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Proyecto en blanco
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Genesis IDE ─────────────────────────────────────────────────────────────
export default function Chat() {
  const { user, signOut } = useAuth('/auth');
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
  const [pushingGithub, setPushingGithub] = useState(false);
  const [creatingWithPrompt, setCreatingWithPrompt] = useState(false);
  // Pending prompt that triggers code generation immediately
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const projectFiles = activeProject?.files || {};

  const handleFilesChange = useCallback((files: Record<string, StudioFile>) => {
    if (activeProject) updateProjectFiles(activeProject.id, files);
  }, [activeProject, updateProjectFiles]);

  const handleCodeGenerated = useCallback((files: Record<string, StudioFile>) => {
    if (!activeProject) return;
    const merged = { ...projectFiles, ...files };
    updateProjectFiles(activeProject.id, merged);
    const first = Object.keys(files)[0];
    if (first) setSelectedFile(first);
    setPanelView('split');
  }, [activeProject, projectFiles, updateProjectFiles]);

  const handleWelcomePrompt = async (prompt: string) => {
    setCreatingWithPrompt(true);
    const project = await createProject(`Genesis — ${prompt.slice(0, 40)}…`);
    if (project) {
      setActiveProject(project);
      setPendingPrompt(prompt);
    }
    setCreatingWithPrompt(false);
  };

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

  const confirmRename = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    await renameProject(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  const handleGithubPush = async () => {
    if (!githubToken || !githubRepo || !activeProject) {
      toast.error('Configura token y repositorio');
      return;
    }
    setPushingGithub(true);
    try {
      const parts = githubRepo.includes('/') ? githubRepo.split('/') : ['', githubRepo];
      const owner = parts[0];
      const repo = parts[1];
      if (!owner || !repo) { toast.error('Formato: usuario/repositorio'); return; }

      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (!repoCheck.ok) {
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ name: repo, description: activeProject.name, private: false, auto_init: true }),
        });
        if (!createRes.ok) { toast.error('No se pudo crear el repositorio'); return; }
        await new Promise(r => setTimeout(r, 2000));
      }

      let pushed = 0;
      for (const [filename, file] of Object.entries(projectFiles)) {
        const content = btoa(unescape(encodeURIComponent(file.content)));
        const shaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
          headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
        });
        const sha = shaRes.ok ? (await shaRes.json())?.sha : undefined;
        const pushRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
          method: 'PUT',
          headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ message: `feat: update ${filename} via Genesis`, content, ...(sha ? { sha } : {}) }),
        });
        if (pushRes.ok) pushed++;
      }
      toast.success(`${pushed} archivos enviados a github.com/${owner}/${repo}`);
      if (user) {
        await supabase.from('github_connections').upsert({ user_id: user.id, github_username: owner, access_token: githubToken, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      }
    } catch {
      toast.error('Error al enviar a GitHub');
    } finally {
      setPushingGithub(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030304]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-aether-purple/30 to-aether-blue/20 border border-white/10 flex items-center justify-center animate-pulse">
            <Code2 className="h-5 w-5 text-aether-purple" />
          </div>
          <span className="text-[12px] text-white/30 font-display uppercase tracking-widest">Genesis</span>
        </div>
      </div>
    );
  }

  // Show Welcome screen when no project is active
  if (!activeProject) {
    return (
      <div className="flex flex-col h-screen bg-[#030304]">
        <AppHeader userId={user?.id} onSignOut={signOut} />
        <div className="flex-1 overflow-hidden pt-16">
          <WelcomeScreen
            onPrompt={handleWelcomePrompt}
            onCreateProject={() => createProject()}
            creating={creatingWithPrompt}
            projects={projects}
            onSelectProject={setActiveProject}
          />
        </div>
      </div>
    );
  }

  // Full IDE view
  return (
    <div className="flex flex-col h-screen bg-[#020203] overflow-hidden">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* Genesis Top Bar */}
      <div className="flex h-11 items-center gap-3 px-3 border-b border-white/[0.05] bg-[#030304] shrink-0 z-10 mt-16">
        {/* Project name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-aether-purple/10 border border-aether-purple/20">
            <Code2 className="h-3.5 w-3.5 text-aether-purple shrink-0" />
            <span className="text-[11px] font-bold text-white/80 truncate max-w-[200px] font-display">{activeProject.name}</span>
          </div>
          <button
            onClick={() => setActiveProject(null as any)}
            className="text-[10px] text-white/20 hover:text-white/60 transition-colors font-display uppercase tracking-widest"
          >
            ← Proyectos
          </button>
        </div>

        {/* View toggles */}
        <div className="hidden md:flex items-center gap-0.5 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.05]">
          {(['code', 'split', 'preview'] as PanelView[]).map((v) => (
            <button
              key={v}
              onClick={() => setPanelView(v)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-display ${
                panelView === v ? 'bg-aether-purple/20 text-aether-purple' : 'text-white/25 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Device */}
        <div className="hidden md:flex items-center gap-0.5">
          {([{ m: 'desktop', I: Monitor }, { m: 'tablet', I: Tablet }, { m: 'mobile', I: Smartphone }] as { m: DeviceMode; I: any }[]).map(({ m, I }) => (
            <button key={m} onClick={() => setDeviceMode(m)} className={`p-1.5 rounded-lg transition-all ${deviceMode === m ? 'text-aether-blue bg-aether-blue/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}>
              <I className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setSidebarView('github')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/30 hover:text-white hover:border-white/15 transition-all font-display"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Push</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <div className="flex flex-col items-center gap-2 w-10 py-2 border-r border-white/[0.05] bg-[#030304] shrink-0">
          {([
            { v: 'files' as SidebarView, I: Files, t: 'Archivos' },
            { v: 'projects' as SidebarView, I: FolderOpen, t: 'Proyectos' },
            { v: 'github' as SidebarView, I: Github, t: 'GitHub' },
          ]).map(({ v, I, t }) => (
            <button key={v} onClick={() => setSidebarView(sidebarView === v ? 'files' : v)} title={t}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${sidebarView === v ? 'bg-aether-purple/20 text-aether-purple border border-aether-purple/30' : 'text-white/20 hover:bg-white/5 hover:text-white'}`}>
              <I className="h-3.5 w-3.5" />
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => createProject()} title="Nuevo proyecto"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 hover:bg-aether-purple/10 hover:text-aether-purple transition-all">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="w-52 shrink-0 border-r border-white/[0.05] overflow-hidden flex flex-col">
          {sidebarView === 'files' && (
            <StudioFileTree files={projectFiles} selectedFile={selectedFile} onSelect={setSelectedFile} onAddFile={handleAddFile} onDeleteFile={handleDeleteFile} />
          )}
          {sidebarView === 'projects' && (
            <div className="flex flex-col h-full bg-[#030304]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] font-display">Proyectos</span>
                <span className="text-[10px] text-white/15 font-bold">{projects.length}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
                {projects.map((p) => (
                  <div key={p.id}
                    className={`group flex items-center justify-between gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all border ${activeProject.id === p.id ? 'bg-aether-purple/15 border-aether-purple/30 text-white' : 'text-white/35 hover:bg-white/[0.03] hover:text-white border-transparent'}`}
                    onClick={() => { setActiveProject(p); setSidebarView('files'); }}
                  >
                    {renamingId === p.id ? (
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
                        onBlur={confirmRename} onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-b border-aether-purple/40 text-[11px] text-white outline-none" />
                    ) : (
                      <span className="text-[11px] font-medium truncate flex-1">{p.name}</span>
                    )}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setRenamingId(p.id); setRenameValue(p.name); }}
                        className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white transition-all">
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                        className="p-1 rounded hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all">
                        <Trash2 className="h-2.5 w-2.5" />
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
                <Github className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] font-display">GitHub Push</span>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-display">Token PAT</label>
                  <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="ghp_xxx"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/15 outline-none focus:border-aether-purple/40 font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-display">Repositorio</label>
                  <input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="usuario/repo"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/15 outline-none focus:border-aether-purple/40 font-mono" />
                </div>
                <button onClick={handleGithubPush} disabled={pushingGithub || !githubToken || !githubRepo}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-black text-[11px] font-bold disabled:opacity-25 hover:bg-white/90 transition-all active:scale-95">
                  {pushingGithub ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…</> : <><UploadCloud className="h-3.5 w-3.5" /> Push</>}
                </button>
                <p className="text-[9px] text-white/15 leading-relaxed">Token necesita permisos <span className="text-white/30 font-mono">repo</span>. Crea el repo automáticamente si no existe.</p>
              </div>
            </div>
          )}
        </div>

        {/* Code + Preview area */}
        <div className="flex flex-1 overflow-hidden">
          {(panelView === 'code' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-1/2 border-r border-white/[0.05]' : 'flex-1'}`}>
              <StudioCodeEditor selectedFile={selectedFile} projectFiles={projectFiles} onFilesChange={handleFilesChange} />
            </div>
          )}
          {(panelView === 'preview' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-1/2' : 'flex-1'}`}>
              <StudioPreview files={projectFiles} deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} />
            </div>
          )}
        </div>

        {/* Right: Chat — desktop */}
        <div className="hidden lg:flex w-72 shrink-0 border-l border-white/[0.05] flex-col overflow-hidden">
          <StudioChat
            projectId={activeProject.id}
            projectFiles={projectFiles}
            onCodeGenerated={handleCodeGenerated}
            initialPrompt={pendingPrompt}
            onInitialPromptUsed={() => setPendingPrompt(null)}
          />
        </div>

        {/* Mobile chat */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-aether-purple text-white shadow-lg shadow-aether-purple/30">
                <MessageSquare className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[360px] p-0 bg-[#030304] border-white/[0.05]">
              <StudioChat
                projectId={activeProject.id}
                projectFiles={projectFiles}
                onCodeGenerated={handleCodeGenerated}
                initialPrompt={pendingPrompt}
                onInitialPromptUsed={() => setPendingPrompt(null)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
