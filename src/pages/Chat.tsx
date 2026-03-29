/**
 * Genesis — AI Code Builder
 * Lovable-like IDE: describe → generate → preview → push to GitHub
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Monitor, Smartphone, Tablet, Plus, Trash2,
  Github, Loader2, FolderOpen, Files, MessageSquare,
  Pencil, UploadCloud, Zap, Sparkles, Search, Star,
  User, Home, Paperclip, Mic, Send, LayoutTemplate,
  Clock, ChevronDown,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioChat } from '@/components/studio/StudioChat';
import { useStudioProjects, type StudioFile, type StudioProject } from '@/hooks/useStudioProjects';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type PanelView = 'code' | 'preview' | 'split';
type SidebarView = 'files' | 'projects' | 'github';

// ─── Starter prompts / Templates ────────────────────────────────────────────
const STARTER_PROMPTS = [
  { label: 'Landing page',  emoji: '🚀', prompt: 'Crea una landing page moderna con hero section animado, sección de features con iconos, testimonios y footer. Diseño oscuro con gradientes morados.' },
  { label: 'Dashboard',     emoji: '📊', prompt: 'Crea un dashboard con tarjetas de métricas, una tabla de datos con filtros, y un gráfico de barras CSS. Diseño dark minimalista.' },
  { label: 'Login / Auth',  emoji: '🔐', prompt: 'Crea un sistema de login y registro con formularios validados, estados de error, y diseño moderno con glassmorphism.' },
  { label: 'E-commerce',    emoji: '🛍️', prompt: 'Crea una página de producto de e-commerce con galería de imágenes, selector de variantes, precio, y botón de compra. Diseño premium.' },
  { label: 'Portfolio',     emoji: '🎨', prompt: 'Crea un portfolio personal con sección hero, proyectos en grid, habilidades con barras de progreso, y formulario de contacto.' },
  { label: 'Kanban Board',  emoji: '📋', prompt: 'Crea un tablero Kanban con columnas (Por hacer, En progreso, Hecho), tarjetas con prioridad, y diseño drag-like.' },
];

type WelcomeTab = 'projects' | 'recents' | 'templates';

interface WelcomeScreenProps {
  onPrompt: (prompt: string) => void;
  onCreateProject: () => void;
  creating: boolean;
  projects: StudioProject[];
  onSelectProject: (p: StudioProject) => void;
  displayName?: string;
}

function WelcomeScreen({ onPrompt, onCreateProject, creating, projects, onSelectProject, displayName }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<WelcomeTab>('projects');
  const [search, setSearch] = useState('');

  const handleSubmit = (val?: string) => {
    const text = (val ?? input).trim();
    if (text) onPrompt(text);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const greeting = displayName ? `¿Qué tienes en mente, ${displayName.split(' ')[0]}?` : '¿Qué vas a construir hoy?';

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left Sidebar ──────────────────────────────────────────────── */}
      <div className="w-60 shrink-0 flex flex-col border-r border-white/[0.06]" style={{ background: '#0c0c10' }}>

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.05]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <Code2 className="h-3.5 w-3.5 text-aether-purple" />
          </div>
          <span className="text-[13px] font-black text-white tracking-tight">Genesis</span>
          <ChevronDown className="h-3 w-3 text-white/20 ml-auto" />
        </div>

        {/* Nav */}
        <div className="px-2 py-2 border-b border-white/[0.05]">
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-all">
            <Home className="h-3.5 w-3.5 shrink-0" />
            Home
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-all">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Buscar</span>
            <kbd className="text-[9px] text-white/20 font-mono px-1.5 py-0.5 rounded border border-white/[0.08]">⌘K</kbd>
          </button>
        </div>

        {/* Projects */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">Proyectos</p>
        </div>
        <div className="px-2 flex flex-col gap-0.5">
          {[
            { label: 'Todos',      icon: FolderOpen, count: projects.length },
            { label: 'Favoritos',  icon: Star,       count: 0 },
            { label: 'Creados',    icon: User,       count: projects.length },
          ].map(item => (
            <button key={item.label}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-all">
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count > 0 && <span className="text-[10px] text-white/20">{item.count}</span>}
            </button>
          ))}
        </div>

        {/* Recents */}
        {projects.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Recientes</p>
            </div>
            <div className="px-2 flex flex-col gap-0.5 flex-1 overflow-y-auto pb-2">
              {projects.slice(0, 8).map(p => (
                <button key={p.id} onClick={() => onSelectProject(p)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-all text-left group">
                  <div className="h-2 w-2 rounded-sm shrink-0" style={{ background: 'rgba(168,85,247,0.4)', border: '1px solid rgba(168,85,247,0.4)' }} />
                  <span className="truncate flex-1">{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        <div className="p-3 border-t border-white/[0.05] shrink-0">
          <button onClick={() => navigate('/pricing')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'rgba(168,85,247,0.8)' }}>
            <Zap className="h-3.5 w-3.5 shrink-0" />
            Actualizar plan
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Gradient background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(88,28,135,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(157,23,77,0.25) 0%, transparent 60%), #08080e'
        }} />

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 relative z-10">

          {/* Heading */}
          <h1 className="text-[28px] font-black text-white tracking-tight mb-8 text-center leading-tight">
            {greeting}
          </h1>

          {/* Input */}
          <div className="w-full max-w-2xl">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe la app que quieres construir…"
                className="w-full bg-transparent px-5 pt-5 pb-4 text-[14px] text-white placeholder:text-white/25 outline-none resize-none leading-relaxed"
                rows={3}
              />
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-1">
                  <button className="flex items-center justify-center h-8 w-8 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button className="flex items-center justify-center h-8 w-8 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || creating}
                  className="flex items-center justify-center h-9 w-9 rounded-xl text-white disabled:opacity-30 transition-all active:scale-95"
                  style={{ background: input.trim() && !creating ? '#a855f7' : 'rgba(168,85,247,0.3)' }}
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-2.5">Enter para enviar · Shift+Enter nueva línea · ~5 créditos</p>
          </div>
        </div>

        {/* ── Bottom section ──────────────────────────────────────────── */}
        <div className="relative z-10 border-t border-white/[0.06]" style={{ background: 'rgba(8,8,14,0.8)', backdropFilter: 'blur(20px)' }}>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3">
            {([
              { id: 'projects',  label: 'Mis proyectos',    icon: FolderOpen },
              { id: 'recents',   label: 'Recientes',        icon: Clock },
              { id: 'templates', label: 'Templates',        icon: LayoutTemplate },
            ] as { id: WelcomeTab; label: string; icon: any }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={activeTab === tab.id
                  ? { background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }
                  : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
                }
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={onCreateProject}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: 'rgba(168,85,247,0.9)' }}
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Nuevo
            </button>
          </div>

          {/* Tab content */}
          <div className="px-6 py-4 min-h-[140px] max-h-[180px] overflow-y-auto">

            {/* My projects */}
            {activeTab === 'projects' && (
              <>
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 gap-2">
                    <FolderOpen className="h-6 w-6 text-white/10" />
                    <p className="text-[12px] text-white/25">Aún no tienes proyectos. ¡Crea el primero!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {projects.map(p => (
                      <button key={p.id} onClick={() => onSelectProject(p)}
                        className="flex flex-col gap-1.5 p-3 rounded-xl text-left transition-all group"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(168,85,247,0.15)' }}>
                          <Code2 className="h-3.5 w-3.5 text-aether-purple" />
                        </div>
                        <p className="text-[11px] font-semibold text-white/70 group-hover:text-white truncate transition-colors">{p.name}</p>
                        <p className="text-[9px] text-white/20">{new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Recents */}
            {activeTab === 'recents' && (
              <div className="flex flex-col gap-1">
                {projects.slice(0, 5).map(p => (
                  <button key={p.id} onClick={() => onSelectProject(p)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all text-left">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-white/20" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-white/20 shrink-0">{new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  </button>
                ))}
                {projects.length === 0 && (
                  <p className="text-[12px] text-white/20 text-center py-6">Sin actividad reciente</p>
                )}
              </div>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {STARTER_PROMPTS.map(s => (
                  <button key={s.label} onClick={() => handleSubmit(s.prompt)}
                    className="flex flex-col gap-2 p-3 rounded-xl text-left transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <p className="text-[11px] font-semibold text-white/60">{s.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Genesis IDE ─────────────────────────────────────────────────────────────
export default function Chat() {
  const { user, signOut } = useAuth('/auth');
  const { profile } = useProfile(user?.id);
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
      <div className="flex flex-col h-screen" style={{ background: '#08080e' }}>
        <AppHeader userId={user?.id} onSignOut={signOut} />
        <div className="flex-1 overflow-hidden pt-14">
          <WelcomeScreen
            onPrompt={handleWelcomePrompt}
            onCreateProject={() => createProject()}
            creating={creatingWithPrompt}
            projects={projects}
            onSelectProject={setActiveProject}
            displayName={profile?.display_name ?? undefined}
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
