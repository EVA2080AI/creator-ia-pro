/**
 * Studio — AI Creative Hub
 * Freepik Spaces-inspired: image gen, video, canvas, templates, text tools
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  Image, Video, Palette, FileText, Megaphone, Hash,
  Wand2, ZoomIn, ImagePlus, RotateCcw, Sparkles,
  ArrowRight, Layers, PenTool, ShoppingBag, Zap,
  ChevronRight, Clock, Star, TrendingUp, Layout
} from 'lucide-react';

// ─── Tool Sections ────────────────────────────────────────────────────────────
const AI_IMAGE_TOOLS = [
  { id: 'generate',   name: 'Crear imagen',       desc: 'Texto a imagen con IA',       icon: Image,      color: '#a855f7', credits: 2 },
  { id: 'logo',       name: 'Diseñar logo',        desc: 'Identidades de marca',         icon: PenTool,    color: '#00c2ff', credits: 3 },
  { id: 'enhance',    name: 'Mejorar imagen',      desc: 'Mejora detalles y luz',        icon: Wand2,      color: '#a855f7', credits: 2 },
  { id: 'upscale',    name: 'Aumentar resolución', desc: 'Escala hasta 4K',              icon: ZoomIn,     color: '#00c2ff', credits: 3 },
  { id: 'background', name: 'Quitar fondo',        desc: 'Extracción perfecta',          icon: ImagePlus,  color: '#34d399', credits: 1 },
  { id: 'restore',    name: 'Restaurar foto',      desc: 'Fotos antiguas o dañadas',     icon: RotateCcw,  color: '#f59e0b', credits: 3 },
  { id: 'style',      name: 'Transferir estilo',   desc: 'Aplica estilo entre imágenes', icon: Palette,    color: '#a855f7', credits: 2 },
  { id: 'product',    name: 'Mockup producto',     desc: 'Renders profesionales',        icon: ShoppingBag, color: '#f59e0b', credits: 3 },
];

const AI_TEXT_TOOLS = [
  { id: 'copywriter', name: 'Copywriting',         desc: 'Textos persuasivos',          icon: Megaphone,  color: '#a855f7', credits: 1 },
  { id: 'social',     name: 'Redes sociales',      desc: 'Posts e ideas virales',        icon: Hash,       color: '#f43f5e', credits: 2 },
  { id: 'blog',       name: 'Artículo SEO',         desc: 'Contenido optimizado',        icon: FileText,   color: '#34d399', credits: 1 },
  { id: 'ads',        name: 'Anuncios',             desc: 'Google, Meta y más',          icon: Megaphone,  color: '#ffffff', credits: 1 },
];

const FEATURED_TEMPLATES = [
  { title: 'Campaña de producto', category: 'Marketing', color: '#a855f7', icon: TrendingUp },
  { title: 'Identidad de marca',  category: 'Branding',  color: '#00c2ff', icon: Star },
  { title: 'Contenido viral',     category: 'Social',    color: '#f43f5e', icon: Zap },
  { title: 'Pack editorial',      category: 'Editorial', color: '#34d399', icon: Layout },
];

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, onClick }: { tool: typeof AI_IMAGE_TOOLS[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all text-left overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${tool.color}10 0%, transparent 70%)` }} />

      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:border-white/20 transition-colors">
          <tool.icon className="h-4 w-4" style={{ color: tool.color }} />
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <span className="text-[9px] font-bold text-white/30 tabular-nums">{tool.credits}</span>
          <span className="text-[9px] text-white/20">cr</span>
        </div>
      </div>

      <div>
        <p className="text-[12px] font-bold text-white/80 group-hover:text-white transition-colors font-display">{tool.name}</p>
        <p className="text-[10px] text-white/30 mt-0.5">{tool.desc}</p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all ml-auto" />
    </button>
  );
}

// ─── Studio Page ──────────────────────────────────────────────────────────────
export default function Studio() {
  const { user, signOut } = useAuth('/auth');
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'all' | 'image' | 'video' | 'text' | 'canvas'>('all');

  const goToTool = (toolId: string) => navigate(`/tools?tool=${toolId}`);
  const goToCanvas = () => navigate('/formarketing');

  return (
    <div className="min-h-screen bg-[#030304]">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="pt-16">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-white/[0.04]">
          {/* Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[200px] bg-aether-purple/10 blur-[80px] rounded-full" />
            <div className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-aether-blue/8 blur-[80px] rounded-full" />
          </div>

          <div className="relative max-w-[1200px] mx-auto px-8 py-14">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-aether-purple/30 to-aether-blue/20 border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-aether-purple" />
              </div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">AI Creative Hub</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-tight mb-4">
              Studio.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-aether-purple to-aether-blue">Crea sin límites.</span>
            </h1>
            <p className="text-white/40 text-[15px] max-w-lg leading-relaxed mb-8">
              Imágenes, videos, textos y campañas generados con IA. Todo en un solo lugar.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Generar imagen',  icon: Image,   id: 'generate',  color: '#a855f7' },
                { label: 'Crear video',     icon: Video,   id: 'video',     color: '#00c2ff' },
                { label: 'Canvas editor',  icon: Layers,  id: 'canvas',    color: '#34d399' },
                { label: 'Diseñar logo',    icon: PenTool, id: 'logo',      color: '#f59e0b' },
              ].map((a) => (
                <button
                  key={a.id}
                  onClick={() => a.id === 'canvas' ? goToCanvas() : a.id === 'video' ? navigate('/formarketing') : goToTool(a.id)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07] transition-all group"
                >
                  <a.icon className="h-4 w-4" style={{ color: a.color }} />
                  <span className="text-[12px] font-bold text-white/60 group-hover:text-white transition-colors font-display">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-8 py-10 space-y-14">

          {/* Section filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {([
              { id: 'all', label: 'Todo' },
              { id: 'image', label: 'Imágenes IA' },
              { id: 'video', label: 'Video IA' },
              { id: 'text', label: 'Texto IA' },
              { id: 'canvas', label: 'Canvas' },
            ] as { id: typeof activeSection; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveSection(t.id)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap font-display ${
                  activeSection === t.id
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/15'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* AI Image Tools */}
          {(activeSection === 'all' || activeSection === 'image') && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 bg-aether-purple/50" />
                  <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] font-display">Imágenes con IA</h2>
                </div>
                <button onClick={() => navigate('/tools')} className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {AI_IMAGE_TOOLS.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => goToTool(tool.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Canvas Editor */}
          {(activeSection === 'all' || activeSection === 'canvas') && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-6 bg-aether-blue/50" />
                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] font-display">Canvas & Video Editor</h2>
              </div>
              <button
                onClick={goToCanvas}
                className="group relative w-full rounded-3xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-aether-blue/15 via-transparent to-aether-purple/10" />
                <div className="relative flex flex-col md:flex-row items-center gap-8 p-8">
                  <div className="flex flex-col gap-4 text-left flex-1">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-aether-blue" />
                      <span className="text-[10px] font-bold text-aether-blue/70 uppercase tracking-[0.3em] font-display">Flow Editor</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white font-display mb-2">Canvas de producción</h3>
                      <p className="text-white/40 text-[13px] leading-relaxed max-w-md">
                        Editor visual de nodos para flujos de marketing. Genera imágenes y videos en secuencia con IA.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-bold text-white/40 group-hover:text-white transition-colors">
                      Abrir Canvas Editor <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  {/* Preview mockup */}
                  <div className="flex gap-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {[
                      { bg: 'bg-aether-purple/20', border: 'border-aether-purple/30', w: 'w-24', h: 'h-16' },
                      { bg: 'bg-aether-blue/20',   border: 'border-aether-blue/30',   w: 'w-20', h: 'h-12 mt-4' },
                      { bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20',   w: 'w-16', h: 'h-10 mt-2' },
                    ].map((b, i) => (
                      <div key={i} className={`${b.w} ${b.h} ${b.bg} border ${b.border} rounded-2xl flex items-center justify-center`}>
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            </section>
          )}

          {/* AI Video */}
          {(activeSection === 'all' || activeSection === 'video') && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-6 bg-rose-400/50" />
                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] font-display">Video con IA</h2>
              </div>
              <button
                onClick={() => navigate('/formarketing')}
                className="group relative w-full rounded-3xl overflow-hidden border border-white/[0.06] hover:border-rose-400/30 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/8 via-transparent to-transparent" />
                <div className="relative flex items-center justify-between p-8">
                  <div className="flex flex-col gap-3 text-left">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-rose-400" />
                      <span className="text-[10px] font-bold text-rose-400/70 uppercase tracking-[0.3em] font-display">Cinema Engine</span>
                    </div>
                    <h3 className="text-xl font-black text-white font-display">Genera videos con IA</h3>
                    <p className="text-white/35 text-[13px] max-w-sm">Stable Video Diffusion desde el Canvas Editor. Flujos de producción visual completos.</p>
                    <div className="flex items-center gap-2 text-[12px] font-bold text-white/35 group-hover:text-white transition-colors mt-1">
                      Ir al Video Editor <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
                    <div className="w-36 h-20 bg-black/40 border border-rose-400/20 rounded-2xl flex items-center justify-center">
                      <Video className="h-6 w-6 text-rose-400/40" />
                    </div>
                    <div className="flex gap-1">
                      {[0,1,2,3].map(i => <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-6 bg-rose-400/60' : 'w-2 bg-white/10'}`} />)}
                    </div>
                  </div>
                </div>
              </button>
            </section>
          )}

          {/* AI Text Tools */}
          {(activeSection === 'all' || activeSection === 'text') && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 bg-emerald-400/50" />
                  <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] font-display">Texto & Copy con IA</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AI_TEXT_TOOLS.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => goToTool(tool.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Templates */}
          {(activeSection === 'all') && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 bg-yellow-400/50" />
                  <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] font-display">Plantillas destacadas</h2>
                </div>
                <button onClick={() => navigate('/hub')} className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FEATURED_TEMPLATES.map((t) => (
                  <button
                    key={t.title}
                    onClick={() => navigate('/hub')}
                    className="group flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${t.color}60, transparent)` }} />
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08]" style={{ background: `${t.color}15` }}>
                      <t.icon className="h-5 w-5" style={{ color: t.color }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-white/70 group-hover:text-white transition-colors font-display">{t.title}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{t.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Recent Activity (placeholder) */}
          {activeSection === 'all' && (
            <section className="pb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-6 bg-white/20" />
                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] font-display flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Actividad reciente
                </h2>
              </div>
              <div className="flex flex-col items-center gap-3 py-10 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                <Sparkles className="h-8 w-8 text-white/10" />
                <p className="text-[12px] text-white/25 text-center">Tus creaciones aparecerán aquí</p>
                <button onClick={() => goToTool('generate')} className="text-[11px] text-aether-purple/60 hover:text-aether-purple transition-colors font-bold uppercase tracking-widest font-display">
                  Crear algo →
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
