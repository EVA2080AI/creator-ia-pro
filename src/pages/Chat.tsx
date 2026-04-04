/**
 * Genesis — AI Code Builder
 * Lovable-like IDE: describe → generate → preview → push to GitHub
 */
import { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Monitor, Smartphone, Tablet, Plus, Trash2,
  Github, Loader2, FolderOpen, Files, MessageSquare,
  Pencil, UploadCloud, Zap, Sparkles, Search, Star,
  User, Paperclip, Mic, Send, LayoutTemplate,
  Clock, ChevronDown, Eye, History, Download, RotateCcw,
  MoreHorizontal, Globe, BarChart2, Columns, Cloud,
  Map, ArrowUp, ArrowRight, Layers, X, ArrowLeft,
  PanelLeft, PanelLeftClose, Phone, RefreshCw, Database,
} from 'lucide-react';
import { StudioFileTree } from '@/components/studio/StudioFileTree';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioChat } from '@/components/studio/StudioChat';
import { SitemapView } from '@/components/studio/SitemapView';
import { CommandPalette } from '@/components/studio/CommandPalette';
import { useStudioProjects, type StudioFile, type StudioProject } from '@/hooks/useStudioProjects';
import { StudioCloud, type SupabaseConfig } from '@/components/studio/StudioCloud';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { generateProject, downloadBlob, type ProjectType, type ScaffoldOptions } from '@/services/scaffold-service';
import { StudioDeploy } from '@/components/studio/StudioDeploy';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type PanelView = 'code' | 'preview' | 'split' | 'files' | 'history' | 'sitemap';
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
  onDeleteProject: (projectId: string, e: React.MouseEvent) => void;
  displayName?: string;
  onOpenSearch: () => void;
  onMic: () => void;
  isListening: boolean;
}

// Plan credit limits for bar calculation
const PLAN_CREDITS: Record<string, number> = { free: 5, starter: 500, creator: 1200, pymes: 4000 };

function WelcomeScreen({ onPrompt, onCreateProject, creating, projects, onSelectProject, onDeleteProject, displayName, onOpenSearch, onMic, isListening }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<WelcomeTab>('projects');
  const [search, setSearch] = useState('');
  const textareaRef = useState<HTMLTextAreaElement | null>(null);

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 200) + 'px';
  };

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

      {/* ── Main Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white">

        {/* Light modern background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[80%] bg-primary/10 rounded-full blur-[140px] opacity-60" />
          <div className="absolute inset-0 bg-grid-canvas" />
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pb-32">
          <h1 className="text-[32px] md:text-[42px] font-bold text-zinc-900 tracking-tight mb-10 text-center leading-tight">
            {greeting}
          </h1>

          {/* Input Box */}
          <div className="w-full max-w-3xl relative z-20">
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl transition-all border border-zinc-200 bg-white shadow-zinc-200/50">
              
              <div className="absolute top-6 left-6 text-zinc-400">
                <Plus className="h-5 w-5" />
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={handleTextareaInput}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe qué quieres construir..."
                className="w-full bg-transparent pl-14 pr-32 pt-6 pb-6 text-[16px] font-medium text-zinc-800 placeholder:text-zinc-400 outline-none resize-none leading-relaxed min-h-[72px] max-h-[200px]"
                rows={1}
                style={{ overflowY: 'hidden' }}
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button onClick={onMic}
                  aria-label={isListening ? 'Detener grabación de voz' : 'Activar dictado por voz'}
                  className={`flex items-center justify-center p-2 rounded-full transition-all ${isListening ? 'text-red-500 bg-red-100 animate-pulse' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || creating}
                  aria-label="Enviar prompt y crear proyecto"
                  className="flex items-center justify-center h-10 w-10 rounded-full text-white disabled:opacity-30 transition-all active:scale-95 shadow-md"
                  style={{ background: input.trim() && !creating ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                >
                  {creating ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowUp className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Panel */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 w-full h-[240px]">
          <div className="w-full max-w-5xl rounded-t-[36px] overflow-hidden flex flex-col relative z-30" 
            style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 -20px 60px rgba(0,0,0,0.1)' }}>

            {/* Tabs Header */}
            <div className="flex items-center gap-8 px-12 pt-10 pb-4 shrink-0">
              {(['projects', 'recents', 'templates'] as WelcomeTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="text-[14px] font-bold transition-all relative pb-2 uppercase tracking-widest"
                  style={activeTab === tab ? { color: 'hsl(var(--primary))' } : { color: 'hsl(var(--text-secondary))' }}
                >
                  {tab === 'projects' ? 'Mis proyectos' : tab === 'recents' ? 'Recientes' : 'Plantillas'}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />}
                </button>
              ))}
            </div>

            {/* Tab content area */}
            <div className="px-12 py-4 flex-1 overflow-y-auto mb-4 custom-scrollbar">
              {activeTab === 'projects' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProjects.map(p => (
                    <button key={p.id} onClick={() => onSelectProject(p)}
                      className="flex flex-col gap-2 p-4 rounded-2xl text-left border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <Code2 className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-[13px] font-bold text-zinc-800 group-hover:text-zinc-900 truncate mt-1">{p.name}</p>
                      <Trash2 
                        className="absolute right-4 top-4 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" 
                        onClick={(e) => onDeleteProject(p.id, e)}
                      />
                    </button>
                  ))}
                  {filteredProjects.length === 0 && (
                    <div className="col-span-full flex flex-col items-center gap-3 py-6">
                      <span className="text-4xl">✨</span>
                      <p className="text-[13px] text-zinc-500 text-center">Escribe un prompt arriba para crear tu primer proyecto</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'recents' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...projects]
                    .sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime())
                    .slice(0, 10)
                    .map(p => (
                      <button key={p.id} onClick={() => onSelectProject(p)}
                        className="flex flex-col gap-2 p-4 rounded-2xl text-left border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-[13px] font-bold text-zinc-800 group-hover:text-zinc-900 truncate mt-1">{p.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(p.updated_at ?? p.created_at ?? Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </p>
                        <Trash2 
                          className="absolute right-4 top-4 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" 
                          onClick={(e) => onDeleteProject(p.id, e)}
                        />
                      </button>
                    ))
                  }
                  {projects.length === 0 && (
                    <div className="col-span-full flex flex-col items-center gap-3 py-6">
                      <span className="text-4xl">🕐</span>
                      <p className="text-[13px] text-zinc-500">Tus proyectos recientes aparecerán aquí</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'templates' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {STARTER_PROMPTS.map(s => (
                    <button key={s.label} onClick={() => handleSubmit(s.prompt)}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm">
                      <span className="text-2xl">{s.emoji}</span>
                      <p className="text-[13px] font-bold text-zinc-800">{s.label}</p>
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
  const [vercelDeployOpen, setVercelDeployOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
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
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genProjectName, setGenProjectName] = useState('');
  const [genPages, setGenPages] = useState('Home, About, Contact');
  const [genType, setGenType] = useState<ProjectType>('react');
  const [genIncludeSupa, setGenIncludeSupa] = useState(false);
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const projectFiles = activeProject?.files || {};

  useEffect(() => {
    if (activeProject) localStorage.setItem('genesis-last-project', activeProject.id);
  }, [activeProject?.id]);

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
    setSnapshots(prev => [{
      id: Date.now().toString(),
      label: `v${prev.length + 1} · ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date(),
      files: { ...merged },
    }, ...prev].slice(0, 20));
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2500);
  }, [activeProject, projectFiles, updateProjectFiles]);

  const handleAutoName = useCallback(async (name: string) => {
    if (!activeProject) return;
    await renameProject(activeProject.id, name);
    setActiveProject(p => p ? { ...p, name } : p);
  }, [activeProject, renameProject, setActiveProject]);

  const handleWelcomePrompt = async (prompt: string) => {
    setCreatingWithPrompt(true);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleMic = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Navegador no compatible'); return; }
    if (isListening) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) handleWelcomePrompt(transcript);
    };
    recognition.start();
  }, [handleWelcomePrompt, isListening]);

  const handleCmdAction = useCallback((action: string) => {
    switch (action) {
      case 'preview': setPanelView('preview'); break;
      case 'code': setPanelView('code'); break;
      case 'zip': if (activeProject) exportZip(projectFiles, activeProject.name); break;
      case 'github': setGithubOpen(true); break;
      case 'home': setActiveProject(null); break;
      case 'pricing': navigate('/pricing'); break;
    }
  }, [activeProject, projectFiles, navigate, setActiveProject]);

  const handleGithubPush = async () => {
    if (!githubToken || !githubRepo || !activeProject) { toast.error('Faltan datos'); return; }
    setPushingGithub(true);
    toast.success('Pushed to GitHub (simulado)');
    setPushingGithub(false);
  };

  const handleDeleteProject = useCallback(async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    await deleteProject(projectId);
  }, [deleteProject]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-spin">
            <Loader2 className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[12px] text-muted-foreground uppercase tracking-widest font-bold">Genesis IDE</span>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <WelcomeScreen
            onPrompt={handleWelcomePrompt}
            onCreateProject={() => createProject()}
            creating={creatingWithPrompt}
            projects={projects}
            onSelectProject={setActiveProject}
            onDeleteProject={handleDeleteProject}
            displayName={profile?.display_name ?? undefined}
            onOpenSearch={() => setCmdPaletteOpen(true)}
            onMic={handleMic}
            isListening={isListening}
          />
        </div>
        <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} files={{}} projects={projects} onSelectFile={() => {}} onSelectProject={(p) => { setActiveProject(p); setCmdPaletteOpen(false); }} onAction={handleCmdAction} />
      </div>
    );
  }

  const credits = profile?.credits_balance ?? 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <Helmet><title>Genesis IA | Creator IA Pro</title></Helmet>

      {/* ── Topbar ── */}
      <div className="flex h-[44px] items-center px-3 shrink-0 z-[40] w-full relative"
        style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border) / 0.6)' }}>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setActiveProject(null)} aria-label="Volver a mis proyectos" className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition-all"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /></button>
          <button onClick={() => setIsChatOpen(!isChatOpen)} aria-label={isChatOpen ? 'Cerrar panel de chat' : 'Abrir panel de chat'} className={`flex items-center justify-center h-7 w-7 rounded-md transition-all ${isChatOpen ? 'text-foreground bg-accent/10' : 'text-muted-foreground hover:bg-white/5'}`}>{isChatOpen ? <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" /> : <PanelLeft className="h-3.5 w-3.5" aria-hidden="true" />}</button>
          <div className="h-4 w-px mx-1 shrink-0 bg-border/40" />
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: isGenerating ? 'hsl(var(--warning))' : 'hsl(var(--success))' }} />
            <button onClick={() => { setRenameTopBarValue(activeProject.name); setRenamingTopBar(true); }} aria-label={`Renombrar proyecto: ${activeProject.name}`} className="text-[13px] font-bold text-foreground/90 truncate max-w-[150px]">{activeProject.name}</button>
          </div>
        </div>
        <div className="flex items-center gap-0.5 ml-4">
          {([
            { id: 'code',    icon: Code2,    label: 'Código'   },
            { id: 'preview', icon: Monitor,  label: 'Preview'  },
            { id: 'split',   icon: Columns,  label: 'Split'    },
            { id: 'files',   icon: Files,    label: 'Files'    },
            { id: 'history', icon: History,  label: 'History'  },
          ] as { id: PanelView; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setPanelView(id)}
              title={label}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold transition-all ${panelView === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {profile?.subscription_tier !== 'pymes' && (
            <button onClick={() => navigate('/pricing')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"><Zap className="h-3 w-3" /> Upgrade</button>
          )}
          <button onClick={() => setDeployOpen(!deployOpen)} aria-label="Publicar proyecto" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all">Publish</button>
          {profile?.avatar_url && <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full border border-border/40 ml-1" />}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 grid overflow-hidden relative" style={{ gridTemplateColumns: `${isChatOpen ? '380px' : '0px'} 1fr`, transition: 'grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {/* Sidebar: Chat */}
        <div className="flex flex-col h-full border-r border-border/40 overflow-hidden" style={{ background: 'hsl(var(--card) / 0.3)', backdropFilter: 'blur(20px)' }}>
          <div className="flex-1 min-h-0"><StudioChat projectId={activeProject.id} projectFiles={projectFiles} onCodeGenerated={handleCodeGenerated} initialPrompt={pendingPrompt} onGeneratingChange={setIsGenerating} supabaseConfig={supabaseConfig} /></div>
          <div className="p-4 border-t border-border/40 shrink-0">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="flex justify-between text-[10px] font-bold mb-2 text-muted-foreground uppercase tracking-widest">
                <span>{credits.toLocaleString()} créditos</span>
                <Zap className="h-3 w-3" />
              </div>
              {(() => {
                const tier = profile?.subscription_tier ?? 'free';
                const limit = PLAN_CREDITS[tier] ?? 1000;
                const pct = Math.min(100, (credits / limit) * 100);
                const barColor = pct < 20 ? 'hsl(var(--destructive))' : pct < 50 ? 'hsl(var(--warning))' : 'hsl(var(--primary))';
                return (
                  <>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1 capitalize">{tier} plan · {limit.toLocaleString()} límite</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex flex-col min-w-0 h-full overflow-hidden relative">
          {panelView === 'files' && (
            <div className="w-full h-full flex items-center justify-center p-8 bg-background/50">
              <div className="w-full max-w-2xl h-[80vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center"><h3 className="text-sm font-bold flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> Explorer</h3><button onClick={() => handleAddFile('new.tsx')} className="text-[11px] font-bold text-primary">+ New</button></div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar"><StudioFileTree files={projectFiles} selectedFile={selectedFile} onSelect={f => { setSelectedFile(f); setPanelView('code'); }} onAddFile={handleAddFile} onDeleteFile={handleDeleteFile} /></div>
              </div>
            </div>
          )}
          {(panelView === 'code' || panelView === 'split') && <div className={`flex flex-col overflow-hidden ${panelView === 'split' ? 'w-[45%] border-r border-border/40' : 'flex-1'}`}><StudioCodeEditor selectedFile={selectedFile} projectFiles={projectFiles} onFilesChange={handleFilesChange} isGenerating={isGenerating} streamPreview={streamPreview} /></div>}
          {(panelView === 'preview' || panelView === 'split') && <div className="flex flex-col overflow-hidden flex-1"><StudioPreview files={projectFiles} deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} isGenerating={isGenerating} supabaseConfig={supabaseConfig} viewMode="preview" onToggleViewMode={(mode) => setPanelView(mode)} isSidebarCollapsed={!isChatOpen} onToggleSidebar={() => setIsChatOpen(!isChatOpen)} isFullscreen={false} onToggleFullscreen={() => {}} /></div>}
          {panelView === 'history' && (
            <div className="w-full h-full flex items-center justify-center p-8 bg-background/50">
              <div className="w-full max-w-2xl h-[80vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                <div className="px-6 py-4 border-b border-border"><h3 className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4 text-muted-foreground" /> Snapshots</h3></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {snapshots.length === 0 ? <p className="text-center text-muted-foreground py-20 uppercase tracking-widest text-[10px]">No snapshots</p> : snapshots.map((s, i) => <div key={s.id} className="p-4 rounded-xl bg-zinc-50 border border-border flex justify-between items-center"><div className="flex items-center gap-4"><div className="h-10 w-10 flex items-center justify-center bg-muted/20 border border-border rounded-lg">{i}</div><div><p className="text-[13px] font-bold text-zinc-900">{s.label}</p><p className="text-[11px] text-zinc-500">{Object.keys(s.files).length} files</p></div></div><button onClick={() => { updateProjectFiles(activeProject.id, s.files); setPanelView('preview'); }} className="text-[11px] font-bold hover:text-primary transition-colors">Restore</button></div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {deployOpen && (
        <>
          <div className="fixed inset-0 z-[45]" onClick={() => setDeployOpen(false)} />
          <div className="absolute right-4 top-[100px] z-[50] w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">Despliegue</div>
            <div className="p-1">
              {[
                { icon: Github, label: 'GitHub', action: () => { setDeployOpen(false); setGithubOpen(true); } },
                { icon: UploadCloud, label: 'Vercel', action: () => { setDeployOpen(false); setVercelDeployOpen(true); } },
                { icon: Download, label: 'ZIP', action: () => { setDeployOpen(false); exportZip(projectFiles, activeProject.name); } },
              ].map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.05] transition-all text-muted-foreground hover:text-foreground text-[12px] font-bold">
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {cloudOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md" onClick={() => setCloudOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-4xl max-h-[85vh] bg-background border border-border rounded-[24px] shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center px-6"><h3 className="font-bold flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Supabase Config</h3><button onClick={() => setCloudOpen(false)}>✕</button></div>
            <div className="p-8 overflow-y-auto custom-scrollbar"><StudioCloud projectId={activeProject.id} config={supabaseConfig} onConfigChange={handleSupabaseConfigChange} /></div>
          </div>
        </>
      )}

      {vercelDeployOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/80" onClick={() => setVercelDeployOpen(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><StudioDeploy onClose={() => setVercelDeployOpen(false)} files={projectFiles} projectName={activeProject.name} /></div>
        </>
      )}

      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} files={projectFiles} projects={projects} onSelectFile={f => { setSelectedFile(f); setPanelView('code'); }} onSelectProject={setActiveProject} onAction={handleCmdAction} />
      
      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
        <Sheet>
          <SheetTrigger asChild><button className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center border border-primary/20"><MessageSquare className="h-5 w-5" /></button></SheetTrigger>
          <SheetContent side="left" className="w-full p-0 border-r border-border bg-background"><StudioChat projectId={activeProject.id} projectFiles={projectFiles} onCodeGenerated={handleCodeGenerated} initialPrompt={pendingPrompt} onGeneratingChange={setIsGenerating} supabaseConfig={supabaseConfig} /></SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
