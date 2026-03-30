/**
 * Genesis — AI Code Builder
 * Lovable-like IDE: describe → generate → preview → push to GitHub
 */
import { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Monitor, Smartphone, Tablet, Plus, Trash2,
  Github, Loader2, FolderOpen, Files, MessageSquare,
  Pencil, UploadCloud, Zap, Sparkles, Search, Star,
  User, Home, Paperclip, Mic, Send, LayoutTemplate,
  Clock, ChevronDown, Eye, History, Download, RotateCcw,
  MoreHorizontal, Globe, BarChart2, Columns, Cloud,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioChat } from '@/components/studio/StudioChat';
import { useStudioProjects, type StudioFile, type StudioProject } from '@/hooks/useStudioProjects';
import { StudioCloud, type SupabaseConfig } from '@/components/studio/StudioCloud';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type PanelView = 'code' | 'preview' | 'split';
type LeftTab = 'chat' | 'files' | 'projects' | 'github' | 'history' | 'cloud';

interface Snapshot {
  id: string;
  label: string;
  timestamp: Date;
  files: Record<string, StudioFile>;
}

// ─── Export all files as a single ZIP ────────────────────────────────────────
async function exportZip(files: Record<string, StudioFile>, projectName: string) {
  const entries = Object.entries(files);
  if (entries.length === 0) return;
  const zip = new JSZip();
  const folder = zip.folder(projectName.replace(/[^a-z0-9_-]/gi, '_')) ?? zip;
  entries.forEach(([filename, file]) => folder.file(filename, file.content));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${projectName.replace(/[^a-z0-9_-]/gi, '_')}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: 'rgba(138,180,248,0.15)', border: '1px solid rgba(138,180,248,0.3)' }}>
            <Code2 className="h-3.5 w-3.5 text-[#8AB4F8]" />
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
                  <div className="h-2 w-2 rounded-sm shrink-0" style={{ background: 'rgba(138,180,248,0.4)', border: '1px solid rgba(138,180,248,0.4)' }} />
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
            style={{ background: 'rgba(138,180,248,0.08)', border: '1px solid rgba(138,180,248,0.2)', color: 'rgba(138,180,248,0.8)' }}>
            <Zap className="h-3.5 w-3.5 shrink-0" />
            Actualizar plan
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Minimalist background — Lovable-style System Grid */}
        <div className="absolute inset-0 bg-background bg-grid-white/[0.02]" />
        {/* Subtle top glow just for visual depth, not neon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

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
                  style={{ background: input.trim() && !creating ? '#8AB4F8' : 'rgba(138,180,248,0.3)' }}
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
              style={{ background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.25)', color: 'rgba(138,180,248,0.9)' }}
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
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(138,180,248,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(138,180,248,0.15)' }}>
                          <Code2 className="h-3.5 w-3.5 text-[#8AB4F8]" />
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
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(138,180,248,0.06)'; }}
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
  const [leftTab, setLeftTab] = useState<LeftTab>('chat');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingTopBar, setRenamingTopBar] = useState(false);
  const [renameTopBarValue, setRenameTopBarValue] = useState('');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamPreview, setStreamPreview] = useState('');
  const [deployOpen, setDeployOpen] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [pushingGithub, setPushingGithub] = useState(false);
  const [creatingWithPrompt, setCreatingWithPrompt] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  // Version history snapshots
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  // Supabase Cloud config — persisted per project
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig | null>(null);

  const projectFiles = activeProject?.files || {};

  // ── Persist last-open project across navigation ────────────────────────────
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('genesis-last-project', activeProject.id);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    if (!loading && projects.length > 0 && !activeProject) {
      const saved = localStorage.getItem('genesis-last-project');
      if (saved) {
        const found = projects.find(p => p.id === saved);
        if (found) setActiveProject(found);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, projects.length]);

  // Load Supabase config for active project from localStorage
  useEffect(() => {
    if (!activeProject) { setSupabaseConfig(null); return; }
    const key = `genesis-supabase-${activeProject.id}`;
    const saved = localStorage.getItem(key);
    setSupabaseConfig(saved ? JSON.parse(saved) : null);
  }, [activeProject?.id]);

  const handleSupabaseConfigChange = useCallback((cfg: SupabaseConfig | null) => {
    if (!activeProject) return;
    const key = `genesis-supabase-${activeProject.id}`;
    if (cfg) localStorage.setItem(key, JSON.stringify(cfg));
    else localStorage.removeItem(key);
    setSupabaseConfig(cfg);
  }, [activeProject?.id]);

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
    // Save version snapshot
    setSnapshots(prev => [{
      id: Date.now().toString(),
      label: `v${prev.length + 1} · ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date(),
      files: { ...merged },
    }, ...prev].slice(0, 20));
    // Auto-save indicator
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2500);
  }, [activeProject, projectFiles, updateProjectFiles]);

  const handleAutoName = useCallback(async (name: string) => {
    if (!activeProject) return;
    await renameProject(activeProject.id, name);
    setActiveProject(p => p ? { ...p, name } : p);
  }, [activeProject, renameProject]);

  const handleWelcomePrompt = async (prompt: string) => {
    setCreatingWithPrompt(true);
    // Use first meaningful words of prompt as project name (max 40 chars)
    const words = prompt.trim().split(/\s+/).slice(0, 6).join(' ');
    const projectName = words.length > 3 ? words.slice(0, 40) : 'Nuevo Proyecto';
    const project = await createProject(projectName);
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

      const pushFile = async ([filename, file]: [string, StudioFile]) => {
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
        if (!pushRes.ok) throw new Error(filename);
      };

      const results = await Promise.allSettled(Object.entries(projectFiles).map(pushFile));
      const pushed = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) toast.warning(`${pushed} enviados, ${failed} fallaron — revisa el token`);
      else toast.success(`${pushed} archivos enviados a github.com/${owner}/${repo}`);
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
      <div className="flex h-screen items-center justify-center bg-[#191a1f]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#8AB4F8]/30 to-[#A8C7FA]/20 border border-white/10 flex items-center justify-center animate-pulse">
            <Code2 className="h-5 w-5 text-[#8AB4F8]" />
          </div>
          <span className="text-[12px] text-white/30 font-sans uppercase tracking-widest">Genesis</span>
        </div>
      </div>
    );
  }

  // Show Welcome screen when no project is active
  if (!activeProject) {
    return (
      <div className="flex flex-col h-screen" style={{ background: '#191a1f' }}>
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

  // Full IDE view — Lovable-style: chat LEFT | code/preview CENTER
  const credits = profile?.credits_balance ?? 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#191a1f' }}>
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* Genesis Top Bar — Lovable-style */}
      <div className="flex h-11 items-center gap-1.5 px-3 shrink-0 z-10 mt-14"
        style={{ background: '#16161b', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Left: back + project name */}
        <div className="flex items-center gap-2 min-w-0 mr-2">
          <button onClick={() => setActiveProject(null)}
            className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white transition-colors shrink-0 px-1.5 py-1 rounded-md hover:bg-white/[0.05]">
            ← <span className="hidden sm:block">Proyectos</span>
          </button>
          <div className="h-4 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ background: isGenerating ? '#f59e0b' : '#34d399' }} />
              {renamingTopBar ? (
                <input autoFocus value={renameTopBarValue}
                  onChange={e => setRenameTopBarValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { renameProject(activeProject.id, renameTopBarValue.trim() || activeProject.name); setRenamingTopBar(false); } if (e.key === 'Escape') setRenamingTopBar(false); }}
                  onBlur={() => { renameProject(activeProject.id, renameTopBarValue.trim() || activeProject.name); setRenamingTopBar(false); }}
                  className="text-[12px] font-semibold text-white bg-transparent border-b border-[#8AB4F8]/50 outline-none max-w-[160px]" />
              ) : (
                <button onClick={() => { setRenameTopBarValue(activeProject.name); setRenamingTopBar(true); }}
                  className="flex items-center gap-1 group/rename">
                  <span className="text-[12px] font-semibold text-white/85 truncate max-w-[150px]">{activeProject.name}</span>
                  <Pencil className="h-2.5 w-2.5 text-white/20 opacity-0 group-hover/rename:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
            </div>
            <span className="text-[9px] leading-none hidden sm:block" style={{ color: isGenerating ? '#f59e0b' : savedIndicator ? '#34d399' : 'rgba(255,255,255,0.2)' }}>
              {isGenerating ? 'Genesis está generando…' : savedIndicator ? '✓ Guardado' : 'Última versión guardada'}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Center icon group: view mode */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([
            { v: 'preview' as PanelView, Icon: Globe,   tip: 'Preview'  },
            { v: 'split'   as PanelView, Icon: Columns, tip: 'Split'    },
            { v: 'code'    as PanelView, Icon: Code2,   tip: 'Código'   },
          ]).map(({ v, Icon, tip }) => (
            <button key={v} onClick={() => setPanelView(v)} title={tip}
              className="p-1.5 rounded-md transition-all"
              style={panelView === v ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Device mode */}
        <div className="hidden md:flex items-center gap-0.5 ml-0.5">
          {([{ m: 'desktop' as DeviceMode, I: Monitor }, { m: 'tablet' as DeviceMode, I: Tablet }, { m: 'mobile' as DeviceMode, I: Smartphone }]).map(({ m, I }) => (
            <button key={m} onClick={() => setDeviceMode(m)} title={m}
              className="p-1.5 rounded-md transition-all"
              style={deviceMode === m ? { color: '#8AB4F8', background: 'rgba(138,180,248,0.1)' } : { color: 'rgba(255,255,255,0.22)' }}>
              <I className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="h-4 w-px mx-1 shrink-0 hidden md:block" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* History */}
        <button onClick={() => setLeftTab('history')} title="Versiones"
          className="p-1.5 rounded-md text-white/25 hover:text-white hover:bg-white/[0.05] transition-all relative">
          <History className="h-3.5 w-3.5" />
          {snapshots.length > 0 && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#8AB4F8]" />}
        </button>

        {/* Deploy panel toggle */}
        <button onClick={() => setDeployOpen(!deployOpen)} title="Deploy"
          className="p-1.5 rounded-md transition-all"
          style={deployOpen ? { color: '#8AB4F8', background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.25)' } : { color: 'rgba(255,255,255,0.25)' }}>
          <UploadCloud className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px mx-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* ZIP download */}
        <button onClick={() => exportZip(projectFiles, activeProject.name).then(() => toast.success('ZIP descargado')).catch(() => toast.error('Error al generar ZIP'))}
          disabled={Object.keys(projectFiles).length === 0}
          title="Descargar ZIP"
          className="p-1.5 rounded-md text-white/25 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-30">
          <Download className="h-3.5 w-3.5" />
        </button>

        {/* Share */}
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copiado'); }}
          title="Compartir" className="p-1.5 rounded-md text-white/25 hover:text-white hover:bg-white/[0.05] transition-all hidden sm:block">
          <BarChart2 className="h-3.5 w-3.5" />
        </button>

        {/* Publish */}
        <button onClick={() => toast.success('Proyecto publicado')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all active:scale-95 ml-1"
          style={{ background: isGenerating ? 'rgba(138,180,248,0.4)' : '#8AB4F8' }}>
          {isGenerating ? <><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Generando…</> : <>Publish</>}
        </button>
      </div>

      {/* Deploy panel overlay */}
      {deployOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDeployOpen(false)} />
      )}
      {deployOpen && (
        <div className="absolute right-3 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl"
          style={{ top: '116px', background: '#1e2028', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
          <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
            <p className="text-[11px] font-bold text-white/80">Deploy & Export</p>
            <p className="text-[10px] text-white/30 mt-0.5">Publica tu proyecto</p>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {[
              { icon: Github, label: 'Push a GitHub', desc: 'Sube los archivos al repo', action: () => { setDeployOpen(false); setLeftTab('github'); } },
              { icon: Download, label: 'Descargar ZIP', desc: 'Todos los archivos comprimidos', action: () => { exportZip(projectFiles, activeProject.name).then(() => toast.success('ZIP descargado')).catch(() => toast.error('Error al generar ZIP')); setDeployOpen(false); } },
              { icon: UploadCloud, label: 'Publicar con Vercel', desc: 'Deploy automático', action: () => { toast.success('Conecta Vercel desde ajustes'); setDeployOpen(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/[0.05]">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                  style={{ background: 'rgba(138,180,248,0.1)', border: '1px solid rgba(138,180,248,0.15)' }}>
                  <item.icon className="h-3.5 w-3.5 text-[#8AB4F8]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white/80">{item.label}</p>
                  <p className="text-[9px] text-white/30">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Chat / Files / Projects / GitHub panel ──────────────────── */}
        <div className="hidden lg:flex w-[380px] shrink-0 flex-col border-r overflow-hidden"
          style={{ background: '#131318', borderColor: 'rgba(255,255,255,0.07)' }}>

          {/* Left panel tab bar — 3 labeled tabs */}
          <div className="shrink-0 px-3 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-0.5 rounded-xl p-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {([
                { id: 'chat'    as LeftTab, I: MessageSquare, t: 'Chat'     },
                { id: 'files'   as LeftTab, I: Files,         t: 'Archivos' },
                { id: 'cloud'   as LeftTab, I: Cloud,         t: 'Supabase', badge: supabaseConfig ? '●' as any : undefined },
                { id: 'history' as LeftTab, I: History,       t: 'Versiones', badge: snapshots.length > 0 ? snapshots.length : undefined },
              ]).map(({ id, I, t, badge }) => (
                <button key={id} onClick={() => setLeftTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all relative"
                  style={leftTab === id
                    ? { background: 'rgba(138,180,248,0.15)', color: '#8AB4F8', border: '1px solid rgba(138,180,248,0.2)' }
                    : { color: 'rgba(255,255,255,0.28)', border: '1px solid transparent' }}
                >
                  <I className="h-3 w-3 shrink-0" />
                  {t}
                  {badge !== undefined && (
                    <span className="h-3.5 min-w-[14px] px-0.5 flex items-center justify-center rounded-full text-[8px] font-black bg-[#8AB4F8] text-black">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content — fills remaining height */}
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* CHAT tab — always mounted so history never resets */}
            <div className={`flex flex-col flex-1 overflow-hidden ${leftTab !== 'chat' ? 'hidden' : ''}`}>
              <StudioChat
                projectId={activeProject.id}
                projectFiles={projectFiles}
                onCodeGenerated={handleCodeGenerated}
                initialPrompt={pendingPrompt}
                onInitialPromptUsed={() => setPendingPrompt(null)}
                onAutoName={handleAutoName}
                onGeneratingChange={(v) => { setIsGenerating(v); if (!v) setStreamPreview(''); }}
                onStreamCharsChange={(_n, preview) => setStreamPreview(preview)}
                supabaseConfig={supabaseConfig}
              />
            </div>

            {/* FILES tab */}
            {leftTab === 'files' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Archivos</span>
                  <button onClick={() => handleAddFile(`file${Date.now()}.tsx`)}
                    className="text-white/25 hover:text-white transition-all">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <StudioFileTree files={projectFiles} selectedFile={selectedFile} onSelect={(f) => { setSelectedFile(f); setPanelView('code'); }} onAddFile={handleAddFile} onDeleteFile={handleDeleteFile} />
                </div>
              </div>
            )}

            {/* CLOUD tab */}
            {leftTab === 'cloud' && (
              <StudioCloud
                projectId={activeProject.id}
                config={supabaseConfig}
                onConfigChange={handleSupabaseConfigChange}
              />
            )}

            {/* PROJECTS tab */}
            {leftTab === 'projects' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Proyectos</span>
                  <button onClick={() => createProject()}
                    className="text-white/25 hover:text-white transition-all">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
                  {projects.map((p) => (
                    <div key={p.id}
                      className={`group flex items-center justify-between gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all border ${activeProject.id === p.id ? 'bg-[#8AB4F8]/15 border-[#8AB4F8]/30 text-white' : 'text-white/35 hover:bg-white/[0.03] hover:text-white border-transparent'}`}
                      onClick={() => { setActiveProject(p); setLeftTab('chat'); }}
                    >
                      {renamingId === p.id ? (
                        <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null); }}
                          onBlur={confirmRename} onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent border-b border-[#8AB4F8]/40 text-[11px] text-white outline-none" />
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

            {/* HISTORY tab */}
            {leftTab === 'history' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Historial de versiones</span>
                  <span className="text-[10px] text-white/20">{snapshots.length} guardadas</span>
                </div>
                <div className="flex flex-col gap-1.5 p-3 flex-1 overflow-y-auto">
                  {snapshots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 gap-2">
                      <History className="h-5 w-5 text-white/10" />
                      <p className="text-[11px] text-white/20 text-center">Genera código para crear una versión</p>
                    </div>
                  ) : snapshots.map((snap, i) => (
                    <div key={snap.id} className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.25)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg shrink-0"
                          style={{ background: i === 0 ? 'rgba(138,180,248,0.15)' : 'rgba(255,255,255,0.05)' }}>
                          <History className="h-3 w-3" style={{ color: i === 0 ? '#8AB4F8' : 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white/70">{snap.label}</p>
                          <p className="text-[9px] text-white/25">{Object.keys(snap.files).length} archivos</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (activeProject) {
                            updateProjectFiles(activeProject.id, snap.files);
                            toast.success(`Restaurado a ${snap.label}`);
                            setLeftTab('chat');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/50 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GITHUB tab */}
            {leftTab === 'github' && (
              <div className="flex flex-col flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 px-4 py-2.5 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Github className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">GitHub Push</span>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Token PAT</label>
                    <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="ghp_xxx"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/15 outline-none focus:border-[#8AB4F8]/40 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Repositorio</label>
                    <input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="usuario/repo"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/15 outline-none focus:border-[#8AB4F8]/40 font-mono" />
                  </div>
                  <button onClick={handleGithubPush} disabled={pushingGithub || !githubToken || !githubRepo}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-black text-[11px] font-bold disabled:opacity-25 hover:bg-white/90 transition-all active:scale-95">
                    {pushingGithub ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…</> : <><UploadCloud className="h-3.5 w-3.5" /> Push a GitHub</>}
                  </button>
                  <p className="text-[9px] text-white/20 leading-relaxed">Token necesita permisos <code className="text-white/35">repo</code>. Crea el repo automáticamente si no existe.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom strip: Visual edits toggle + Back to Preview + Credits ── */}
          <div className="shrink-0 flex flex-col gap-1 p-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Back to Preview (only when in code view) */}
            {panelView === 'code' && (
              <button
                onClick={() => setPanelView('preview')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium text-white/35 hover:text-white transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Eye className="h-3.5 w-3.5 shrink-0" />
                Volver al Preview
              </button>
            )}

            {/* Credits bar */}
            <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/30">{credits.toLocaleString()} créditos restantes</span>
                <Zap className="h-3 w-3 text-white/20" />
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (credits / 1000) * 100)}%`, background: credits > 200 ? '#8AB4F8' : credits > 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <button
                onClick={() => { window.location.href = '/pricing'; }}
                className="mt-2 w-full text-center text-[10px] font-semibold py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(138,180,248,0.12)', color: '#a78bfa', border: '1px solid rgba(138,180,248,0.2)' }}
              >
                Actualizar plan →
              </button>
            </div>
          </div>
        </div>

        {/* ── CENTER: Code + Preview ─────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {(panelView === 'code' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-1/2 border-r border-white/[0.05]' : 'flex-1'}`}>
              <StudioCodeEditor selectedFile={selectedFile} projectFiles={projectFiles} onFilesChange={handleFilesChange} isGenerating={isGenerating} streamPreview={streamPreview} />
            </div>
          )}
          {(panelView === 'preview' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-1/2' : 'flex-1'}`}>
              <StudioPreview files={projectFiles} deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} isGenerating={isGenerating} supabaseConfig={supabaseConfig} />
            </div>
          )}
        </div>

        {/* Mobile chat FAB */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                style={{ background: '#8AB4F8', boxShadow: '0 8px 24px rgba(138,180,248,0.4)' }}>
                <MessageSquare className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[280px] p-0 border-white/[0.05]"
              style={{ background: '#131318' }}>
              <StudioChat
                projectId={activeProject.id}
                projectFiles={projectFiles}
                onCodeGenerated={handleCodeGenerated}
                initialPrompt={pendingPrompt}
                onInitialPromptUsed={() => setPendingPrompt(null)}
                onGeneratingChange={(v) => { setIsGenerating(v); if (!v) setStreamPreview(''); }}
                onStreamCharsChange={(_n, preview) => setStreamPreview(preview)}
                supabaseConfig={supabaseConfig}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
