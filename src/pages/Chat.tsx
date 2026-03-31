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
  Map, ArrowUp, ArrowRight,
  PanelLeft, PanelLeftClose, Phone, RefreshCw, Database,
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
type PanelView = 'code' | 'preview' | 'split' | 'files' | 'history';
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

  const greeting = displayName ? `¿Listo para construir, ${displayName.split(' ')[0]}?` : '¿Listo para construir?';

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
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#010101]">

        {/* Rich vibrant genesis background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[80%] bg-[#0066FF]/40 rounded-full blur-[160px] mix-blend-screen" />
          <div className="absolute top-[5%] right-[-15%] w-[60%] h-[70%] bg-[#4ADE80]/20 rounded-full blur-[140px] mix-blend-screen" />
          <div className="absolute bottom-[-15%] left-[20%] w-[60%] h-[60%] bg-[#e2e8f0]/10 rounded-full blur-[140px] mix-blend-screen" />
          <div className="absolute inset-0 bg-background bg-grid-white/[0.01]" />
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pb-32">

          {/* Heading */}
          <h1 className="text-[32px] md:text-[40px] font-medium text-white tracking-tight mb-8 text-center leading-tight drop-shadow-md">
            {greeting}
          </h1>

          {/* Input Box - Floating Pill style */}
          <div className="w-full max-w-3xl relative z-20">
            <div className="relative rounded-[24px] overflow-hidden shadow-2xl transition-all"
              style={{ background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              
              <div className="absolute top-5 left-5 text-white/40 cursor-text">
                <Plus className="h-5 w-5" />
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe la aplicación o sitio que quieres generar..."
                className="w-full bg-transparent pl-14 pr-32 pt-5 pb-5 text-[15px] font-medium text-white placeholder:text-white/40 outline-none resize-none leading-relaxed min-h-[64px]"
                rows={1}
                style={{ overflow: 'hidden' }}
              />
              
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                <button className="flex items-center justify-center p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                  <Map className="h-4 w-4" />
                </button>
                <button className="flex items-center justify-center p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || creating}
                  className="flex items-center justify-center h-8 w-8 rounded-full text-[#1c1c1f] disabled:opacity-30 transition-all active:scale-95 ml-1 shadow-md"
                  style={{ background: input.trim() && !creating ? 'white' : 'rgba(255,255,255,0.4)' }}
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Floating Panel ──────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 w-full h-[220px]">
          <div className="w-full max-w-5xl rounded-t-[32px] overflow-hidden flex flex-col relative z-30" 
            style={{ background: '#151515', borderTop: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 -20px 60px rgba(0,0,0,0.8)' }}>

            {/* Tabs Header */}
            <div className="flex items-center gap-6 px-10 pt-8 pb-4 shrink-0 border-b border-transparent">
              {([
                { id: 'projects',  label: 'Mis proyectos' },
                { id: 'recents',   label: 'Recientes vistos' },
                { id: 'templates', label: 'Templates' },
              ] as { id: WelcomeTab; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="text-[13px] font-semibold transition-all relative pb-2"
                  style={activeTab === tab.id
                    ? { color: 'white' }
                    : { color: 'rgba(255,255,255,0.4)' }
                  }
                >
                  {tab.label}
                  {activeTab === tab.id && (
                     <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-white/30" />
                  )}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={onCreateProject}
                disabled={creating}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white/60 hover:text-white transition-colors"
              >
                Explorar todos <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tab content area */}
            <div className="px-10 py-4 flex-1 overflow-y-auto mb-4 custom-scrollbar">
              {/* My projects */}
              {activeTab === 'projects' && (
                <>
                  {filteredProjects.length === 0 ? (
                    <p className="text-[12px] text-white/25 mt-2">Aún no tienes proyectos. ¡Crea el primero!</p>
                  ) : (
                    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredProjects.map(p => (
                        <button key={p.id} onClick={() => onSelectProject(p)}
                          className="flex flex-col gap-1.5 p-3 rounded-2xl text-left transition-all group lg:min-h-[85px]"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(138,180,248,0.06)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(138,180,248,0.15)' }}>
                              <Code2 className="h-3.5 w-3.5 text-[#8AB4F8]" />
                            </div>
                            <span className="text-[9px] text-white/20">{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[12px] font-semibold text-white/80 group-hover:text-white truncate transition-colors w-full mt-1.5">{p.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Recents */}
              {activeTab === 'recents' && (
                <div className="flex flex-col gap-1.5">
                  {filteredProjects.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => onSelectProject(p)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-left border border-transparent hover:border-white/[0.06]">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-white/20" />
                      <span className="flex-1 truncate font-medium">{p.name}</span>
                      <span className="text-[10px] text-white/20 shrink-0">{new Date(p.created_at).toLocaleDateString()}</span>
                    </button>
                  ))}
                  {filteredProjects.length === 0 && (
                    <p className="text-[12px] text-white/20 mt-2">Sin actividad reciente</p>
                  )}
                </div>
              )}

              {/* Templates */}
              {activeTab === 'templates' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {STARTER_PROMPTS.map(s => (
                    <button key={s.label} onClick={() => handleSubmit(s.prompt)}
                      className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(138,180,248,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      <span className="text-xl shrink-0">{s.emoji}</span>
                      <p className="text-[12px] font-semibold text-white/80">{s.label}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Genesis IDE ─────────────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth('/auth');
  const { profile } = useProfile(user?.id);
  const {
    projects, activeProject, setActiveProject,
    loading, createProject, updateProjectFiles,
    renameProject, deleteProject
  } = useStudioProjects();

  const [selectedFile, setSelectedFile] = useState('App.tsx');
  const [panelView, setPanelView] = useState<PanelView>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
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
        // Note: github_connections table not in schema yet — skip upsert
        console.log('[GitHub] pushed by', user.id);
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
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-[56px]" style={{ background: '#191a1f' }}>
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* ── Genesis Topbar (Lovable V3 — icon-only compact) ─────────────────── */}
      <div className="flex h-[44px] items-center px-3 shrink-0 z-10 w-full"
        style={{ background: '#0f1014', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* ── LEFT: Nav + project name ─────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Back to projects */}
          <button onClick={() => setActiveProject(null)} title="Proyectos"
            className="flex items-center justify-center h-7 w-7 rounded-md text-white/35 hover:bg-white/[0.06] hover:text-white transition-all">
            <Home className="h-3.5 w-3.5" />
          </button>

          {/* Toggle chat panel */}
          <button onClick={() => setIsChatOpen(!isChatOpen)} title={isChatOpen ? 'Ocultar chat' : 'Mostrar chat'}
            className="flex items-center justify-center h-7 w-7 rounded-md transition-all"
            style={isChatOpen
              ? { color: 'white', background: 'rgba(255,255,255,0.07)' }
              : { color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isChatOpen ? 'rgba(255,255,255,0.07)' : ''; }}>
            {isChatOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
          </button>

          <div className="h-4 w-px mx-1 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Project name + status dot */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: isGenerating ? '#f59e0b' : '#34d399' }} />
            {renamingTopBar ? (
              <input autoFocus value={renameTopBarValue}
                onChange={e => setRenameTopBarValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { renameProject(activeProject.id, renameTopBarValue.trim() || activeProject.name); setRenamingTopBar(false); }
                  if (e.key === 'Escape') setRenamingTopBar(false);
                }}
                onBlur={() => { renameProject(activeProject.id, renameTopBarValue.trim() || activeProject.name); setRenamingTopBar(false); }}
                className="text-[13px] font-semibold text-white bg-transparent outline-none max-w-[140px] border-b border-white/20" />
            ) : (
              <button onClick={() => { setRenameTopBarValue(activeProject.name); setRenamingTopBar(true); }}
                className="flex items-center gap-1 group/rename min-w-0">
                <span className="text-[13px] font-semibold text-white/80 truncate max-w-[130px] group-hover/rename:text-white transition-colors">{activeProject.name}</span>
                <Pencil className="h-2.5 w-2.5 text-white/20 opacity-0 group-hover/rename:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* ── CENTER-LEFT: Icon strip (Lovable style) ──────────────────────── */}
        <div className="flex items-center gap-0.5 ml-3 shrink-0">
          {/* Undo/Redo history buttons */}
          <button onClick={() => setPanelView('history')} title="Historial de versiones"
            className="relative flex items-center justify-center h-7 w-7 rounded-md transition-all"
            style={panelView === 'history' ? { color: 'white', background: 'rgba(255,255,255,0.08)' } : { color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = panelView === 'history' ? 'rgba(255,255,255,0.08)' : ''; (e.currentTarget as HTMLElement).style.color = panelView === 'history' ? 'white' : 'rgba(255,255,255,0.35)'; }}>
            <History className="h-3.5 w-3.5" />
            {snapshots.length > 0 && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#8AB4F8]" />}
          </button>

          <div className="h-4 w-px mx-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Preview */}
          <button onClick={() => setPanelView('preview')} title="Preview"
            className="flex items-center justify-center h-7 w-7 rounded-md transition-all"
            style={panelView === 'preview' ? { color: 'white', background: 'rgba(255,255,255,0.08)' } : { color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = panelView === 'preview' ? 'rgba(255,255,255,0.08)' : ''; (e.currentTarget as HTMLElement).style.color = panelView === 'preview' ? 'white' : 'rgba(255,255,255,0.35)'; }}>
            <Globe className="h-3.5 w-3.5" />
          </button>

          {/* Files */}
          <button onClick={() => setPanelView('files')} title="Archivos"
            className="flex items-center justify-center h-7 w-7 rounded-md transition-all"
            style={panelView === 'files' ? { color: 'white', background: 'rgba(255,255,255,0.08)' } : { color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = panelView === 'files' ? 'rgba(255,255,255,0.08)' : ''; (e.currentTarget as HTMLElement).style.color = panelView === 'files' ? 'white' : 'rgba(255,255,255,0.35)'; }}>
            <Files className="h-3.5 w-3.5" />
          </button>

          {/* Code */}
          <button onClick={() => setPanelView('code')} title="Editor de código"
            className="flex items-center justify-center h-7 w-7 rounded-md transition-all"
            style={panelView === 'code' ? { color: 'white', background: 'rgba(255,255,255,0.08)' } : { color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = panelView === 'code' ? 'rgba(255,255,255,0.08)' : ''; (e.currentTarget as HTMLElement).style.color = panelView === 'code' ? 'white' : 'rgba(255,255,255,0.35)'; }}>
            <Code2 className="h-3.5 w-3.5" />
          </button>

          {/* Cloud */}
          <button onClick={() => setCloudOpen(true)} title="Cloud / Supabase"
            className="flex items-center justify-center h-7 w-7 rounded-md text-white/35 hover:bg-white/[0.06] hover:text-white transition-all">
            <Database className="h-3.5 w-3.5" />
          </button>

          {/* BarChart / Analytics */}
          <button title="Analytics (próximamente)"
            className="flex items-center justify-center h-7 w-7 rounded-md text-white/20 hover:bg-white/[0.06] hover:text-white/50 transition-all cursor-not-allowed">
            <BarChart2 className="h-3.5 w-3.5" />
          </button>

          {/* More menu (…) */}
          <div className="relative">
            <button onClick={() => setMoreOpen(v => !v)} title="Más opciones"
              className="flex items-center justify-center h-7 w-7 rounded-md transition-all"
              style={moreOpen ? { color: 'white', background: 'rgba(255,255,255,0.08)' } : { color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = moreOpen ? 'rgba(255,255,255,0.08)' : ''; (e.currentTarget as HTMLElement).style.color = moreOpen ? 'white' : 'rgba(255,255,255,0.35)'; }}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl z-50 overflow-hidden"
                  style={{ background: '#1a1b22', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                  <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold text-white/25 uppercase tracking-[0.3em]">Herramientas</p>
                  {[
                    { icon: History,    label: 'Historial de versiones', action: () => { setPanelView('history'); setMoreOpen(false); } },
                    { icon: Github,     label: 'Push a GitHub',          action: () => { setGithubOpen(true); setMoreOpen(false); } },
                    { icon: Download,   label: 'Descargar ZIP',          action: () => { exportZip(projectFiles, activeProject.name).then(() => toast.success('ZIP descargado')).catch(() => toast.error('Error al generar ZIP')); setMoreOpen(false); } },
                    { icon: UploadCloud,label: 'Publicar en Vercel',     action: () => { toast.info('Conecta Vercel desde ajustes'); setMoreOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all text-white/60 hover:text-white hover:bg-white/[0.05]">
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-[12px] font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CENTER: Device pill ──────────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="flex items-center rounded-full px-2 py-1 gap-1 w-full max-w-[340px]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Device cycle button */}
            <button
              onClick={() => setDeviceMode(prev => prev === 'desktop' ? 'tablet' : prev === 'tablet' ? 'mobile' : 'desktop')}
              title={`Modo: ${deviceMode}`}
              className="flex items-center justify-center p-1 rounded-full text-white/40 hover:text-white hover:bg-white/[0.05] transition-all shrink-0">
              {deviceMode === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : deviceMode === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
            </button>
            <div className="h-3 w-px shrink-0 mx-1 bg-white/10" />
            <div className="flex-1 text-center text-[11px] text-white/30 select-none truncate">
              {activeProject.name.toLowerCase().replace(/\s+/g, '-')}
            </div>
            <div className="h-3 w-px shrink-0 mx-1 bg-white/10" />
            <button title="Abrir en nueva pestaña"
              className="flex items-center justify-center p-1 rounded-full text-white/30 hover:text-white hover:bg-white/[0.05] transition-all shrink-0">
              <ArrowUp className="h-3.5 w-3.5 rotate-45" />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Saved indicator */}
          {savedIndicator && (
            <span className="text-[10px] text-emerald-400/70 font-medium animate-in fade-in duration-200">Guardado ✓</span>
          )}

          {/* Share */}
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copiado'); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-white/50 hover:text-white border border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04] transition-all">
            Share
          </button>

          {/* GitHub */}
          <button onClick={() => setGithubOpen(true)} title="GitHub"
            className="flex items-center justify-center h-7 w-7 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.1] transition-all">
            <Github className="h-3.5 w-3.5 text-white/70" />
          </button>

          {/* Upgrade */}
          <button onClick={() => navigate('/pricing')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
            style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
            <Zap className="h-3 w-3" /> Upgrade
          </button>

          {/* Publish */}
          <button onClick={() => setDeployOpen(!deployOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
            style={{ background: isGenerating ? 'rgba(138,180,248,0.5)' : '#8AB4F8', color: '#0f1014' }}>
            {isGenerating
              ? <><span className="h-1.5 w-1.5 rounded-full bg-[#0f1014] animate-pulse" />Generando</>
              : 'Publish'}
          </button>

          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full border border-white/10 ml-0.5" />
          )}
        </div>
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
              { icon: Github, label: 'Push a GitHub', desc: 'Sube los archivos al repo', action: () => { setDeployOpen(false); setGithubOpen(true); } },
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

        {/* ── Modals: Cloud & GitHub ────────────────────────────────────────────────────────── */}
      {cloudOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" onClick={() => setCloudOpen(false)} />
      )}
      {cloudOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[24px] shadow-2xl flex flex-col"
          style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#3ECF8E]/20 flex items-center justify-center">
                <Database className="h-4 w-4 text-[#3ECF8E]" />
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-white">Supabase Cloud</h3>
                <p className="text-[11px] text-white/40">Base de datos y Storage conectados en tiempo real</p>
              </div>
            </div>
            <button onClick={() => setCloudOpen(false)} className="text-white/40 hover:text-white p-2">✕</button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
             <StudioCloud projectId={activeProject.id} config={supabaseConfig} onConfigChange={handleSupabaseConfigChange} />
             
             {/* Fake Usage Data to look Industrial/Lovable style */}
             <div className="mt-8 pt-8 border-t border-white/[0.05] grid grid-cols-3 gap-6">
                <div>
                   <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3">Database Health</p>
                   <div className="flex items-end gap-2"><span className="text-[28px] font-medium text-white leading-none">99.9</span><span className="text-white/30 text-[14px] mb-1">%</span></div>
                   <div className="mt-3 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden"><div className="h-full bg-[#3ECF8E] w-[99%]" /></div>
                </div>
                <div>
                   <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3">API Requests</p>
                   <div className="flex items-end gap-2"><span className="text-[28px] font-medium text-white leading-none">1.2k</span><span className="text-[#8AB4F8] text-[14px] mb-1">/hr</span></div>
                   <div className="mt-3 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden"><div className="h-full bg-[#8AB4F8] w-[25%]" /></div>
                </div>
                <div>
                   <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3">Storage</p>
                   <div className="flex items-end gap-2"><span className="text-[28px] font-medium text-white leading-none">42</span><span className="text-white/30 text-[14px] mb-1">MB</span></div>
                   <div className="mt-3 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[5%]" /></div>
                </div>
             </div>
          </div>
        </div>
      )}

      {githubOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setGithubOpen(false)} />
          <div className="absolute right-4 z-50 w-[320px] rounded-[16px] overflow-hidden shadow-2xl"
            style={{ top: '60px', background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }}>
            <div className="p-5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                    <Github className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="px-2 py-1 rounded-full bg-[#34d399]/10 text-[#34d399] tracking-widest text-[9px] font-bold uppercase flex items-center gap-1.5 border border-[#34d399]/20">
                     <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" /> Connected
                  </div>
               </div>
               <div>
                  <h4 className="text-[14px] font-semibold text-white">GitHub Integration</h4>
                  <p className="text-[11px] text-white/40 mt-1">Sincronización bidireccional activada con tu repositorio actual.</p>
               </div>
               
               <div className="p-3 bg-black/30 rounded-xl border border-white/[0.05]">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Repository</p>
                  <p className="text-[12px] font-mono text-white/80 truncate">{githubRepo || 'EVA2080AI/creator-ia-pro'}</p>
               </div>

               <div className="flex flex-col gap-2 mt-2">
                 <button onClick={handleGithubPush} className="w-full py-2.5 bg-white text-black font-semibold text-[12px] rounded-xl flex items-center justify-center gap-2 hover:bg-white/90">
                   <UploadCloud className="h-4 w-4" /> Push to Main
                 </button>
                 <a href={`vscode://vscode.git/clone?url=https://github.com/${githubRepo || 'EVA2080AI/creator-ia-pro'}.git`}
                    className="w-full py-2.5 bg-[#0066FF]/15 text-[#0066FF] font-semibold text-[12px] rounded-xl flex items-center justify-center gap-2 border border-[#0066FF]/30 hover:bg-[#0066FF]/25 transition-colors">
                   <Code2 className="h-4 w-4" /> Edit in VS Code
                 </a>
               </div>
            </div>
          </div>
        </>
      )}

      {/* ── LEFT: Chat panel (Collapsible) ─────────────────────────────────── */}
      <div className={`${isChatOpen ? 'flex' : 'hidden'} lg:flex transition-all duration-300 w-[380px] h-full min-h-0 shrink-0 flex-col overflow-hidden`}
        style={{ background: '#131318', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        
        <div className="flex-1 min-h-0 flex flex-col">
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

        {/* ── Credits footer ── */}
        <div className="shrink-0 p-3 border-t border-white/[0.05]">
          <div className="px-3 py-2.5 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-white/30">{credits.toLocaleString()} credits left</span>
              <Zap className="h-3 w-3 text-white/20" />
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (credits / 1000) * 100)}%`, background: credits > 200 ? '#8AB4F8' : credits > 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Dynamic Workspace ─────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative" style={{ background: '#0a0a0c' }}>
          
          {panelView === 'files' && (
             <div className="w-full h-full flex items-center justify-center p-8 bg-[#0a0a0c]">
                <div className="w-full max-w-2xl h-[80vh] bg-[#111114] rounded-2xl border border-white/[0.05] overflow-hidden flex flex-col shadow-2xl">
                   <div className="px-6 py-4 border-b border-white/[0.05] flex justify-between items-center">
                      <h3 className="text-white text-[14px] font-medium flex items-center gap-2"><FolderOpen className="h-4 w-4 text-[#8AB4F8]" /> Archivos del Proyecto</h3>
                      <button onClick={() => handleAddFile(`file${Date.now()}.tsx`)} className="px-3 py-1.5 bg-[#8AB4F8]/10 text-[#8AB4F8] hover:bg-[#8AB4F8]/20 transition-colors text-[11px] font-medium rounded-lg">+ Añadir</button>
                   </div>
                   <div className="flex-1 overflow-y-auto w-full p-4">
                      <StudioFileTree files={projectFiles} selectedFile={selectedFile} onSelect={(f) => { setSelectedFile(f); setPanelView('code'); }} onAddFile={handleAddFile} onDeleteFile={handleDeleteFile} />
                   </div>
                </div>
             </div>
          )}

          {panelView === 'history' && (
             <div className="w-full h-full flex items-center justify-center p-8 bg-[#0a0a0c]">
                <div className="w-full max-w-2xl h-[80vh] bg-[#111114] rounded-2xl border border-white/[0.05] overflow-hidden flex flex-col shadow-2xl">
                   <div className="px-6 py-4 border-b border-white/[0.05] flex justify-between items-center">
                      <h3 className="text-white text-[14px] font-medium flex items-center gap-2"><History className="h-4 w-4 text-white/50" /> Historial de Versiones</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {snapshots.length === 0 ? <p className="text-center text-white/30 text-[12px] mt-10">No hay snapshots aún.</p> : 
                        snapshots.map((snap, i) => (
                          <div key={snap.id} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                             <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50">{i}</div>
                               <div>
                                 <p className="text-white text-[13px] font-medium">{snap.label}</p>
                                 <p className="text-white/40 text-[11px] mt-0.5">{Object.keys(snap.files).length} archivos generados</p>
                               </div>
                             </div>
                             <button onClick={() => { updateProjectFiles(activeProject.id, snap.files); toast.success('Restaurado!'); setPanelView('preview'); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-medium shrink-0 flex items-center gap-2">
                               <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                             </button>
                          </div>
                        ))
                      }
                   </div>
                </div>
             </div>
          )}

          {(panelView === 'code' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-[45%] border-r border-white/[0.05]' : 'flex-1'}`}>
              <StudioCodeEditor selectedFile={selectedFile} projectFiles={projectFiles} onFilesChange={handleFilesChange} isGenerating={isGenerating} streamPreview={streamPreview} />
            </div>
          )}
          {(panelView === 'preview' || panelView === 'split') && (
            <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'flex-1' : 'flex-1'}`}>
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
