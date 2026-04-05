/**
 * Genesis — AI Code Builder
 * Lovable-like IDE: describe → generate → preview → push to GitHub
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { StudioChat, type AgentPhase, type AgentSpecialist } from '@/components/studio/StudioChat';
import { SitemapView } from '@/components/studio/SitemapView';
import { CommandPalette } from '@/components/studio/CommandPalette';
import { StudioArtifactsPanel, type UIArtifact, type UIPlanTask, type UILog } from '@/components/studio/StudioArtifactsPanel';
import { StudioTopbar } from '@/components/studio/StudioTopbar';
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
type PanelView = 'code' | 'preview' | 'split' | 'files' | 'history' | 'sitemap' | 'artifacts';
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
  onFileSelect?: (file: File) => void;
  pendingFile?: { name: string } | null;
  onRemoveFile?: () => void;
}

// Plan credit limits for bar calculation
const PLAN_CREDITS: Record<string, number> = { free: 5, starter: 500, creator: 1200, pymes: 4000 };

function WelcomeScreen({ 
  onPrompt, onCreateProject, creating, projects, onSelectProject, onDeleteProject, 
  displayName, onOpenSearch, onMic, isListening, 
  onFileSelect, pendingFile, onRemoveFile 
}: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<WelcomeTab>('projects');
  const [search, setSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);


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
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // handled by parent Chat onDrop wrapper to allow full folder drops
  };

  const greeting = displayName ? `¿Listo para construir, ${displayName.split(' ')[0]}?` : '¿Listo para construir?';

  return (
    <div className="flex h-full overflow-hidden" 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >

      {/* ── Main Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-transparent">

        {/* Genesis Premium Header (Replicated and Improved) */}
        <header className="h-[60px] w-full border-b border-black/[0.08] bg-white/[0.85] backdrop-blur-[40px] saturate-[1.2] flex items-center justify-between px-6 shrink-0 transition-all z-[100] absolute top-0 left-0 right-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
             </div>
             <span className="text-[13px] font-black tracking-widest text-zinc-900 uppercase">Genesis Builder</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/[0.03] border border-black/[0.05] shadow-inner shadow-black/5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">IA Mode</span>
             </div>
             <button className="flex items-center gap-2 px-5 h-9 rounded-2xl bg-zinc-900 text-white hover:bg-black text-[11px] font-black tracking-widest uppercase transition-all active:scale-95 shadow-md shadow-zinc-900/20">
                Lanzar Studio
             </button>
          </div>
        </header>

        {/* Genesis Mesh Background (Solicitado) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none genesis-panel-background animate-in fade-in duration-1000 mt-[60px]">
          <div className="absolute inset-0 bg-grid-canvas opacity-[0.4]" />
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pb-32">
          <h1 className="text-[32px] md:text-[42px] font-bold text-zinc-900 tracking-tight mb-10 text-center leading-tight">
            {greeting}
          </h1>

          {/* Input Box */}
          <div className="w-full max-w-3xl relative z-20">
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl transition-all border border-zinc-200 bg-white shadow-zinc-200/50">
              
              <button 
                onClick={() => document.getElementById('welcome-file-input')?.click()}
                className="absolute top-4 left-5 text-zinc-400 hover:text-zinc-900 transition-colors z-30 p-1 rounded-md hover:bg-zinc-100"
              >
                <Plus className="h-5 w-5" />
              </button>
              
              {/* File chip */}
              {pendingFile && (
                <div className="absolute top-4 left-14 flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-100 border border-zinc-200 animate-in fade-in zoom-in duration-200 z-30">
                  <Paperclip className="h-3 w-3 text-zinc-500" />
                  <span className="text-[10px] font-bold text-zinc-600 truncate max-w-[120px]">{pendingFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); onRemoveFile?.(); }} className="text-zinc-400 hover:text-zinc-900 p-0.5 rounded hover:bg-zinc-200">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={handleTextareaInput}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe qué quieres construir..."
                className={`w-full bg-transparent pr-32 pb-6 text-[16px] font-medium text-zinc-800 placeholder:text-zinc-400 outline-none resize-none leading-relaxed min-h-[72px] max-h-[200px] ${pendingFile ? 'pt-14 pl-5' : 'pt-5 pl-14'}`}
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
            <div className="flex items-center justify-between px-12 pt-10 pb-4 shrink-0">
              <div className="flex items-center gap-8">
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
              <button 
                onClick={() => document.getElementById('welcome-folder-input')?.click()}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm hover:shadow-md"
              >
                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                Importar Carpeta
              </button>
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
  const [pendingFile, setPendingFile] = useState<{name: string, content: string} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // --- Lifted Engineering State ---
  const [artifacts, setArtifacts] = useState<UIArtifact[]>([]);
  const [tasks, setTasks] = useState<UIPlanTask[]>([]);
  const [logs, setLogs] = useState<UILog[]>([]);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [activeSpecialist, setActiveSpecialist] = useState<AgentSpecialist>('none');

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
    const p = (prompt || "").toLowerCase().trim();
    const GREETINGS = ['hola', 'hi', 'hello', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hey', 'buenas'];
    
    // 1. Detect simple greetings to avoid "hola" projects
    if (GREETINGS.includes(p) || p.length < 3) {
      toast("¡Hola! 👋 ¿Qué quieres construir hoy? Describe tu idea para empezar.");
      return;
    }

    setCreatingWithPrompt(true);
    let finalPrompt = prompt;
    if (pendingFile) {
      finalPrompt = `[CONTRATO/CONTEXTO DE ARCHIVO: ${pendingFile.name}]\n\`\`\`\n${pendingFile.content}\n\`\`\`\n\n${prompt || "Analiza este archivo y construye un proyecto basado en él."}`;
    }

    // 2. Improved Automated Naming (avoid stop words at start)
    const stopWords = ['crea', 'un', 'una', 'el', 'la', 'de', 'para', 'mi', 'con', 'construye'];
    const namingWords = p.split(/\s+/).filter(w => !stopWords.includes(w)).slice(0, 4);
    let projectName = namingWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    if (!projectName || projectName.length < 3) {
      projectName = 'Nuevo Proyecto Genesis';
    } else if (projectName.length > 40) {
      projectName = projectName.slice(0, 37) + '...';
    }

    const project = await createProject(projectName);
    if (project) {
      setActiveProject(project);
      setPendingPrompt(finalPrompt);
      setPendingFile(null);
    }
    setCreatingWithPrompt(false);
  };


  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPendingFile({ name: file.name, content });
      toast.success(`Archivo "${file.name}" cargado.`);
    };
    reader.readAsText(file);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.info('Construyendo proyecto desde la carpeta...');
    const newProjectFiles: Record<string, StudioFile> = {};
    const readPromises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const pathPart = file.webkitRelativePath || file.name;
        if (pathPart.includes('node_modules/') || pathPart.includes('.git/') || file.type.startsWith('image/')) {
          resolve(); return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const pathParts = pathPart.split('/');
            const filePath = pathParts.length > 1 ? pathParts.slice(1).join('/') : pathPart;
            let lang = 'plaintext';
            if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) lang = 'tsx';
            else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) lang = 'jsx';
            else if (file.name.endsWith('.html')) lang = 'html';
            else if (file.name.endsWith('.css')) lang = 'css';
            else if (file.name.endsWith('.json')) lang = 'json';
            else if (file.name.endsWith('.md')) lang = 'markdown';
            newProjectFiles[filePath] = { language: lang, content };
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsText(file);
      });
    });

    await Promise.all(readPromises);

    if (Object.keys(newProjectFiles).length > 0) {
      if (activeProject) {
        await updateProjectFiles(activeProject.id, newProjectFiles);
      } else {
        const p = await createProject('Proyecto Importado');
        if (p) {
          await updateProjectFiles(p.id, newProjectFiles);
          setActiveProject(p);
        }
      }
      toast.success('Proyecto importado exitosamente');
    } else {
      toast.error('No se encontraron archivos de texto válidos.');
    }
    e.target.value = '';
  };

  // Full folder/file drag and drop using DataTransferItem recursion
  const handleWorkspaceDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.dataTransfer.items) return;
    const items = e.dataTransfer.items;
    
    // Si solo sueltan un archivo simple y no hay proyecto activo, actuamos onFileSelect (como el adjuntar archivo simple)
    if (!activeProject && items.length === 1 && items[0].webkitGetAsEntry()?.isFile) {
       const f = items[0].getAsFile();
       if (f) handleFileSelect(f);
       return;
    }

    toast.info('Extrayendo archivos...');
    const newProjectFiles: Record<string, StudioFile> = {};

    const traverseFileTree = async (item: any, path?: string): Promise<void> => {
      path = path || "";
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          item.file((file: File) => {
            if(file.name.includes('node_modules') || file.type.startsWith('image/')){ resolve(); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
              let lang = 'plaintext';
              if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) lang = 'tsx';
              else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) lang = 'jsx';
              else if (file.name.endsWith('.html')) lang = 'html';
              else if (file.name.endsWith('.css')) lang = 'css';
              else if (file.name.endsWith('.json')) lang = 'json';
              else if (file.name.endsWith('.md')) lang = 'markdown';
              const cleanPath = path.startsWith('/') ? path.substring(1) : path;
              newProjectFiles[cleanPath + file.name] = { language: lang, content: ev.target?.result as string };
              resolve();
            };
            reader.readAsText(file);
          });
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        return new Promise<void>((resolve) => {
          dirReader.readEntries(async (entries: any[]) => {
            for (let i = 0; i < entries.length; i++) {
              await traverseFileTree(entries[i], path + item.name + "/");
            }
            resolve();
          });
        });
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) await traverseFileTree(item);
    }

    if (Object.keys(newProjectFiles).length > 0) {
      if (activeProject) {
        await updateProjectFiles(activeProject.id, newProjectFiles);
      } else {
        const p = await createProject('Proyecto Importado');
        if (p) {
          await updateProjectFiles(p.id, newProjectFiles);
          setActiveProject(p);
        }
      }
      toast.success('Proyecto importado exitosamente');
    } else {
      toast.error('No se encontraron archivos de texto válidos.');
    }
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
    try {
      const parts = githubRepo.includes('/') ? githubRepo.split('/') : ['', githubRepo];
      const owner = parts[0];
      const repoName = parts[1];
      if (!owner || !repoName) { toast.error('Formato: usuario/repositorio'); return; }

      // Verificar si el repo existe, crearlo si no
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (!repoCheck.ok) {
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ name: repoName, description: activeProject.name, private: false, auto_init: true }),
        });
        if (!createRes.ok) { toast.error('No se pudo crear el repositorio'); return; }
        await new Promise(r => setTimeout(r, 2000));
      }

      const pushFile = async ([filename, file]: [string, StudioFile]) => {
        const content = btoa(unescape(encodeURIComponent(file.content)));
        const shaRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filename}`, {
          headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
        });
        const sha = shaRes.ok ? (await shaRes.json())?.sha : undefined;
        const pushRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filename}`, {
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
      else toast.success(`${pushed} archivos enviados a github.com/${owner}/${repoName}`);
    } catch {
      toast.error('Error al enviar a GitHub');
    } finally {
      setPushingGithub(false);
    }
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
            onFileSelect={handleFileSelect}
            pendingFile={pendingFile}
            onRemoveFile={() => setPendingFile(null)}
          />
          <input 
            type="file" 
            id="welcome-file-input" 
            className="hidden" 
            accept=".txt,.js,.ts,.tsx,.css,.html,.json,.md,.py,.go,.sh,.sql,.yaml,.yml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />
          <input 
            type="file" 
            id="welcome-folder-input" 
            className="hidden" 
            onChange={handleFolderUpload}
            /* @ts-expect-error webkitdirectory */
            webkitdirectory="true" 
            directory="true" 
            multiple 
          />
        </div>
        <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} files={{}} projects={projects} onSelectFile={() => {}} onSelectProject={(p) => { setActiveProject(p); setCmdPaletteOpen(false); }} onAction={handleCmdAction} />
      </div>
    );
  }

  const credits = profile?.credits_balance ?? 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative"
      onDrop={handleWorkspaceDrop}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <Helmet><title>Genesis IA | Creator IA Pro</title></Helmet>

      {/* ── Topbar (Replicated Premium Style) ── */}
      <StudioTopbar
        projectName={activeProject.name}
        viewMode={(panelView as any)}
        onViewModeChange={(mode) => setPanelView(mode as any)}
        deviceMode={deviceMode as any}
        onDeviceModeChange={setDeviceMode as any}
        isSaving={isGenerating}
        onShare={() => { navigator.clipboard.writeText(window.location.href); toast.success('Enlace copiado'); }}
        onBack={() => setActiveProject(null)}
        onGithubSync={() => setGithubOpen(true)}
        onPublish={() => setDeployOpen(!deployOpen)}
      />

      {/* ── Main Content ── */}
      <div className="flex-1 grid overflow-hidden relative" style={{ gridTemplateColumns: `${isChatOpen ? '380px' : '0px'} 1fr`, transition: 'grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {/* Sidebar: Chat */}
        <div className="flex flex-col h-full border-r border-border/40 overflow-hidden" style={{ background: 'hsl(var(--card) / 0.3)', backdropFilter: 'blur(20px)' }}>
          <div className="flex-1 min-h-0">
            <StudioChat 
              projectId={activeProject.id} 
              projectFiles={projectFiles} 
              onCodeGenerated={handleCodeGenerated} 
              initialPrompt={pendingPrompt} 
              onGeneratingChange={setIsGenerating} 
              supabaseConfig={supabaseConfig} 
              previewError={previewError}
              artifacts={artifacts}
              setArtifacts={setArtifacts}
              tasks={tasks}
              setTasks={setTasks}
              logs={logs}
              setLogs={setLogs}
              onPhaseChange={(phase, specialist) => {
                setAgentPhase(phase);
                setActiveSpecialist(specialist ?? 'none');
              }}
              onInitialPromptUsed={() => setPendingPrompt(null)}
              onStreamCharsChange={(_chars, preview) => setStreamPreview(preview)}
              onToggleArtifacts={() => setPanelView('artifacts')}
            />
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
          {(panelView === 'preview' || panelView === 'split') && <div className="flex flex-col overflow-hidden flex-1"><StudioPreview files={projectFiles} deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} isGenerating={isGenerating} supabaseConfig={supabaseConfig} onError={setPreviewError} viewMode="preview" onToggleViewMode={(mode) => setPanelView(mode)} isSidebarCollapsed={!isChatOpen} onToggleSidebar={() => setIsChatOpen(!isChatOpen)} isFullscreen={false} onToggleFullscreen={() => {}} /></div>}
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
          {panelView === 'artifacts' && (
            <div className="flex-1 overflow-hidden">
              <StudioArtifactsPanel 
                isOpen={true} 
                onClose={() => setPanelView('preview')} 
                artifacts={artifacts} 
                tasks={tasks} 
                logs={logs} 
                files={projectFiles}
                agentPhase={agentPhase}
                activeSpecialist={activeSpecialist}
                persona="genesis"
              />
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
          <SheetContent side="left" className="w-full p-0 border-r border-border bg-background">
            <StudioChat 
              projectId={activeProject.id} 
              projectFiles={projectFiles} 
              onCodeGenerated={handleCodeGenerated} 
              initialPrompt={pendingPrompt} 
              onGeneratingChange={setIsGenerating} 
              supabaseConfig={supabaseConfig} 
              previewError={previewError}
              artifacts={artifacts}
              setArtifacts={setArtifacts}
              tasks={tasks}
              setTasks={setTasks}
              logs={logs}
              setLogs={setLogs}
              onPhaseChange={(phase, specialist) => {
                setAgentPhase(phase);
                setActiveSpecialist(specialist ?? 'none');
              }}
              onInitialPromptUsed={() => setPendingPrompt(null)}
              onStreamCharsChange={(_chars, preview) => setStreamPreview(preview)}
              onToggleArtifacts={() => setPanelView('artifacts')}
            />
          </SheetContent>

        </Sheet>
      </div>
    </div>
  );
}
