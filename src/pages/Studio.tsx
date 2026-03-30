/**
 * Studio — AI Creative Workspace (v2)
 * 2-panel layout: tool sidebar left, generation workspace right.
 * All generation happens inline — no redirects to /tools or /formarketing.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { aiService } from '@/services/ai-service';
import { toast } from 'sonner';
import {
  Image, Video, Palette, FileText, Megaphone, Hash,
  Wand2, ZoomIn, ImagePlus, RotateCcw, Sparkles,
  PenTool, ShoppingBag, Zap,
  Upload, Loader2, Download, Copy, X, Check, BookmarkPlus,
  CheckCircle2, ChevronRight, Clock, Search,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolId =
  | 'generate' | 'logo' | 'enhance' | 'upscale' | 'background' | 'restore' | 'style' | 'product'
  | 'copywriter' | 'social' | 'blog' | 'ads';

interface StudioTool {
  id: ToolId;
  name: string;
  desc: string;
  icon: typeof Wand2;
  credits: number;
  category: 'image' | 'text';
  needsUpload: boolean;
  placeholder?: string;
  color: string;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS: StudioTool[] = [
  { id: 'generate',   name: 'Crear imagen',       desc: 'Texto → imagen con IA',         icon: Image,       credits: 2, category: 'image', needsUpload: false, placeholder: 'Un gato astronauta en Marte al atardecer, estilo fotorrealista…', color: '#a855f7' },
  { id: 'logo',       name: 'Diseñar logo',        desc: 'Identidades de marca',          icon: PenTool,     credits: 3, category: 'image', needsUpload: false, placeholder: 'Logo minimalista para una cafetería llamada Origen, tonos cálidos…', color: '#00c2ff' },
  { id: 'enhance',    name: 'Mejorar imagen',      desc: 'Optimiza luz y detalle',        icon: Wand2,       credits: 2, category: 'image', needsUpload: true,  color: '#a855f7' },
  { id: 'upscale',    name: 'Aumentar resolución', desc: 'Escala hasta 4K',               icon: ZoomIn,      credits: 3, category: 'image', needsUpload: true,  color: '#00c2ff' },
  { id: 'background', name: 'Quitar fondo',        desc: 'Extracción perfecta',           icon: ImagePlus,   credits: 1, category: 'image', needsUpload: true,  color: '#34d399' },
  { id: 'restore',    name: 'Restaurar foto',      desc: 'Fotos antiguas o dañadas',      icon: RotateCcw,   credits: 3, category: 'image', needsUpload: true,  color: '#f59e0b' },
  { id: 'style',      name: 'Transferir estilo',   desc: 'Aplica estilo entre imágenes',  icon: Palette,     credits: 2, category: 'image', needsUpload: true,  color: '#a855f7' },
  { id: 'product',    name: 'Mockup producto',     desc: 'Renders profesionales',         icon: ShoppingBag, credits: 3, category: 'image', needsUpload: true,  color: '#f59e0b' },
  { id: 'copywriter', name: 'Copywriting',         desc: 'Textos persuasivos',            icon: Megaphone,   credits: 1, category: 'text',  needsUpload: false, placeholder: 'Escribe un mensaje para vender zapatos deportivos en Instagram…', color: '#a855f7' },
  { id: 'social',     name: 'Redes sociales',      desc: 'Posts e ideas virales',         icon: Hash,        credits: 2, category: 'text',  needsUpload: false, placeholder: '5 ideas de contenido para Instagram de una marca de ropa sostenible…', color: '#f43f5e' },
  { id: 'blog',       name: 'Artículo SEO',        desc: 'Contenido optimizado',          icon: FileText,    credits: 1, category: 'text',  needsUpload: false, placeholder: 'Artículo sobre los beneficios del café de especialidad…', color: '#34d399' },
  { id: 'ads',        name: 'Anuncios',            desc: 'Google, Meta y más',            icon: Megaphone,   credits: 1, category: 'text',  needsUpload: false, placeholder: 'Anuncio de Google Ads para consultoría de marketing digital…', color: '#ffffff' },
];

const IMAGE_MODELS = [
  { id: 'flux-schnell',  name: 'FLUX Schnell',  badge: 'Rápido' },
  { id: 'flux-pro',      name: 'FLUX Pro',      badge: 'Calidad' },
  { id: 'flux-pro-1.1',  name: 'FLUX 1.1 Pro',  badge: 'Mejor' },
];
const TEXT_MODELS = [
  { id: 'deepseek-chat',      name: 'DeepSeek V3',      badge: 'Rápido' },
  { id: 'gemini-3-flash',     name: 'Gemini 2.0 Flash', badge: 'Gratis' },
  { id: 'claude-3.5-sonnet',  name: 'Claude 4.6',       badge: 'Premium' },
];

// ─── Onboarding ───────────────────────────────────────────────────────────────
const STUDIO_ONBOARDING_STEPS = [
  { title: 'Elige una herramienta', desc: 'Selecciona una herramienta de imagen o texto en la barra izquierda.' },
  { title: 'Describe tu idea',      desc: 'Escribe tu prompt o sube una imagen según la herramienta elegida.' },
  { title: 'Genera y descarga',     desc: 'Pulsa Generar y obtén tu resultado al instante. Guárdalo en tu biblioteca.' },
];

function StudioOnboarding({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STUDIO_ONBOARDING_STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm mx-4 rounded-3xl bg-[#0d0d10] border border-white/[0.1] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            {STUDIO_ONBOARDING_STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
          <button onClick={onDismiss} className="text-[10px] text-white/20 hover:text-white/50 transition-colors font-bold uppercase tracking-widest">
            Saltar
          </button>
        </div>
        <div className="mb-5">
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.3em] mb-1">Paso {step + 1} / {STUDIO_ONBOARDING_STEPS.length}</p>
          <h3 className="text-base font-black text-white mb-1">{STUDIO_ONBOARDING_STEPS[step].title}</h3>
          <p className="text-sm text-white/40 leading-relaxed">{STUDIO_ONBOARDING_STEPS[step].desc}</p>
        </div>
        <button
          onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/80 transition-all active:scale-95"
        >
          {isLast ? 'Empezar a crear →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}

// ─── Welcome (no tool selected) ───────────────────────────────────────────────
interface RecentAsset { id: string; tool: string; prompt: string | null; image_url: string | null; created_at: string; }

function StudioWelcome({ onSelectTool, recentAssets, loadingAssets }: {
  onSelectTool: (t: StudioTool) => void;
  recentAssets: RecentAsset[];
  loadingAssets: boolean;
}) {
  const navigate = useNavigate();
  const quickStart = TOOLS.slice(0, 4);
  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
      {/* Hero */}
      <div>
        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.3em] mb-3">AI Creative Hub</p>
        <h1 className="text-3xl font-black text-white tracking-tight mb-3">¿Qué vas a crear hoy?</h1>
        <p className="text-white/35 text-sm max-w-md leading-relaxed">Elige una herramienta de la barra lateral o comienza desde aquí.</p>
      </div>

      {/* Quick start */}
      <div>
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Empezar ahora</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickStart.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTool(t)}
              className="group flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:border-white/20 transition-colors">
                <t.icon className="h-4 w-4" style={{ color: t.color }} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white/80 group-hover:text-white transition-colors">{t.name}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{t.credits} cr</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent assets */}
      {(loadingAssets || recentAssets.length > 0) && (
        <div className="pb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Recientes</p>
            <button onClick={() => navigate('/assets')} className="text-[10px] text-white/20 hover:text-white/50 transition-colors flex items-center gap-1">Ver todo <ChevronRight className="h-3 w-3" /></button>
          </div>
          {loadingAssets ? (
            <div className="grid grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.04] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {recentAssets.map((a) => (
                <div key={a.id} onClick={() => navigate('/assets')} className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer bg-white/[0.02]">
                  {a.image_url
                    ? <img src={a.image_url} alt={a.prompt || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Sparkles className="h-5 w-5 text-white/10" /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-[9px] font-bold text-white uppercase tracking-widest">{a.tool}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Generation workspace ─────────────────────────────────────────────────────
function ToolWorkspace({
  tool, profile, user, onDone,
}: {
  tool: StudioTool;
  profile: any;
  user: any;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  const [prompt, setPrompt]         = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState('flux-schnell');
  const [textModel, setTextModel]   = useState('deepseek-chat');
  const [processing, setProcessing] = useState(false);
  const [streaming, setStreaming]   = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText]   = useState('');
  const [saved, setSaved]             = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const models = tool.category === 'image' ? IMAGE_MODELS : TEXT_MODELS;
  const activeModel = tool.category === 'image' ? imageModel : textModel;
  const isRunning = processing || streaming;
  const hasResult = !!resultImage || !!resultText;

  // Auto-scroll streaming text
  useEffect(() => {
    if (streaming && textRef.current) textRef.current.scrollTop = textRef.current.scrollHeight;
  }, [resultText, streaming]);

  // Reset when tool changes
  useEffect(() => {
    setPrompt(''); setImagePreview(null); setResultImage(null); setResultText(''); setSaved(false);
  }, [tool.id]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máx 10MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setResultImage(null); setResultText(''); };
    reader.readAsDataURL(file);
  };

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    if (tool.needsUpload && !imagePreview) { toast.error('Sube una imagen primero'); return; }
    if (!tool.needsUpload && !prompt.trim()) { toast.error('Escribe un prompt'); return; }
    const credits = profile?.credits_balance ?? 0;
    if (credits < tool.credits) {
      toast.error(`Necesitas ${tool.credits} créditos. Tienes ${credits}.`);
      navigate('/pricing');
      return;
    }

    setResultImage(null);
    setResultText('');
    setSaved(false);

    if (tool.category === 'text') {
      setStreaming(true);
      try {
        await (supabase.rpc as any)('spend_credits', { _amount: tool.credits, _action: tool.id, _model: activeModel, _node_id: null });
      } catch {
        setStreaming(false);
        toast.error('Créditos insuficientes');
        return;
      }
      let full = '';
      try {
        await aiService.streamTextGen(tool.id, prompt, activeModel, profile, (chunk: string) => {
          full += chunk;
          setResultText(full);
        });
      } catch {
        if (!full) { toast.error('Error generando texto'); }
      } finally { setStreaming(false); }
      return;
    }

    setProcessing(true);
    try {
      const data = await aiService.processAction({
        action: 'image', tool: tool.id, prompt, model: activeModel, image: imagePreview || undefined,
      });
      if (data?.url) { setResultImage(data.url); toast.success('¡Imagen generada!'); }
      else throw new Error('Sin resultado');
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar');
    } finally { setProcessing(false); }
  }, [user, tool, imagePreview, prompt, profile, activeModel, navigate]);

  const handleSave = async () => {
    if (!user || !resultImage) return;
    const { error } = await supabase.from('saved_assets').insert({
      user_id: user.id, tool: tool.id, prompt: prompt || null, image_url: resultImage,
    });
    if (!error) { setSaved(true); toast.success('Guardado en tu biblioteca'); }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `studio-${tool.id}-${Date.now()}.png`;
    a.click();
  };

  const handleCopyText = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tool header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <tool.icon className="h-4 w-4" style={{ color: tool.color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{tool.name}</p>
            <p className="text-[10px] text-white/30">{tool.desc} · {tool.credits} créditos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Model selector pills */}
          <div className="flex items-center gap-1.5">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => tool.category === 'image' ? setImageModel(m.id) : setTextModel(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeModel === m.id
                    ? 'bg-white/10 text-white border border-white/15'
                    : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/10'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Input zone */}
        <div className="w-80 shrink-0 border-r border-white/[0.05] flex flex-col overflow-y-auto p-6 gap-5">

          {/* Image upload zone */}
          {tool.needsUpload && (
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Imagen de entrada</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Input" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-white/20" />
                    <span className="text-[11px] text-white/30">Haz clic para subir</span>
                    <span className="text-[9px] text-white/15">PNG, JPG · Máx 10MB</span>
                  </>
                )}
              </button>
              {imagePreview && (
                <button onClick={() => setImagePreview(null)} className="mt-2 text-[10px] text-white/20 hover:text-rose-400 transition-colors flex items-center gap-1">
                  <X className="h-3 w-3" /> Quitar imagen
                </button>
              )}
            </div>
          )}

          {/* Prompt */}
          {!tool.needsUpload || tool.category === 'image' ? (
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                {tool.needsUpload ? 'Descripción (opcional)' : 'Prompt'}
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
                placeholder={tool.placeholder || 'Describe lo que quieres…'}
                className="flex-1 min-h-[140px] w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/15 outline-none focus:border-primary/40 resize-none transition-all leading-relaxed"
                rows={6}
              />
              <p className="text-[9px] text-white/15">⌘ + Enter para generar</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Instrucciones (opcional)</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={tool.placeholder || 'Describe el resultado esperado…'}
                className="flex-1 min-h-[100px] w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/15 outline-none focus:border-primary/40 resize-none transition-all leading-relaxed"
                rows={4}
              />
            </div>
          )}

          {/* Credits badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] text-white/40">Costo: <span className="text-white/70 font-bold">{tool.credits} créditos</span></span>
            <span className="ml-auto text-[10px] text-white/20">{profile?.credits_balance ?? 0} disponibles</span>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-white text-black font-black text-[13px] hover:bg-white/90 disabled:opacity-40 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
          >
            {isRunning
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</>
              : <><Sparkles className="h-4 w-4" /> Generar</>
            }
          </button>
        </div>

        {/* Right: Result zone */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          {!hasResult && !isRunning ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                <tool.icon className="h-7 w-7 text-white/10" style={{ color: tool.color + '40' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white/30">Tu resultado aparecerá aquí</p>
                <p className="text-[12px] text-white/15 mt-1">
                  {tool.needsUpload ? 'Sube una imagen y pulsa Generar' : 'Escribe un prompt y pulsa Generar'}
                </p>
              </div>
            </div>
          ) : isRunning && tool.category === 'image' && !resultImage ? (
            /* Image loading */
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-3xl opacity-20 animate-pulse" style={{ background: tool.color }} />
                <div className="relative w-20 h-20 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: tool.color }} />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white/50">Generando imagen…</p>
                <p className="text-[12px] text-white/25">Puede tardar entre 10 y 30 segundos</p>
              </div>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: tool.color + '80', animationDelay: `${i * 180}ms` }} />
                ))}
              </div>
            </div>
          ) : tool.category === 'text' ? (
            /* Text result */
            <div ref={textRef} className="flex-1 overflow-y-auto p-8">
              {(streaming || resultText) && (
                <div className="max-w-2xl mx-auto">
                  <div className="text-[13px] text-white/75 leading-[1.8] whitespace-pre-wrap font-sans">
                    {resultText}
                    {streaming && <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 rounded-sm" />}
                  </div>
                  {!streaming && resultText && (
                    <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/[0.06]">
                      <button onClick={handleCopyText} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-all active:scale-95">
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : resultImage ? (
            /* Image result */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                <img
                  src={resultImage}
                  alt="Resultado"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                />
              </div>
              {/* Image actions */}
              <div className="shrink-0 flex items-center gap-2 px-8 py-4 border-t border-white/[0.05]">
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-all active:scale-95">
                  <Download className="h-3.5 w-3.5" /> Descargar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 border ${
                    saved ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:border-white/15'
                  }`}
                >
                  {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Guardado</> : <><BookmarkPlus className="h-3.5 w-3.5" /> Guardar</>}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isRunning}
                  className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] font-bold text-white/50 hover:text-white hover:border-white/15 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Variación
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Studio Page ──────────────────────────────────────────────────────────────
export default function Studio() {
  const { user, signOut } = useAuth('/auth');
  const { profile } = useProfile(user?.id);
  const [activeTool, setActiveTool] = useState<StudioTool | null>(null);
  const [category, setCategory]     = useState<'all' | 'image' | 'text'>('all');
  const [search, setSearch]         = useState('');
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('studio_onboarded'));

  useEffect(() => {
    if (!user) return;
    supabase.from('saved_assets').select('id, tool, prompt, image_url, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => { setRecentAssets(data || []); setLoadingAssets(false); });
  }, [user]);

  const dismissOnboarding = () => {
    localStorage.setItem('studio_onboarded', '1');
    setShowOnboarding(false);
  };

  const visibleTools = TOOLS.filter((t) => {
    const matchCat = category === 'all' || t.category === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col h-screen bg-[#222228] overflow-hidden">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <div className="flex flex-1 overflow-hidden pt-16">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 border-r border-white/[0.05] flex flex-col overflow-hidden bg-[#222228]">

          {/* Header */}
          <div className="px-4 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">Studio</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar herramientas…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-white placeholder:text-white/15 outline-none focus:border-primary/40 transition-all"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-white/[0.05]">
            {(['all', 'image', 'text'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  category === c ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'
                }`}
              >
                {c === 'all' ? 'Todo' : c === 'image' ? 'Imagen' : 'Texto'}
              </button>
            ))}
          </div>

          {/* Tool list */}
          <div className="flex-1 overflow-y-auto py-2">
            {visibleTools.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <Search className="h-5 w-5 text-white/10" />
                <p className="text-[11px] text-white/20">Sin resultados para "{search}"</p>
                <button onClick={() => setSearch('')} className="text-[10px] text-primary/60 hover:text-primary transition-colors font-bold uppercase tracking-widest">Limpiar</button>
              </div>
            ) : visibleTools.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left group ${
                  activeTool?.id === t.id
                    ? 'bg-white/[0.06] border-r-2 border-primary'
                    : 'hover:bg-white/[0.03] border-r-2 border-transparent'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors ${
                  activeTool?.id === t.id ? 'bg-white/10' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                }`}>
                  <t.icon className="h-4 w-4" style={{ color: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-bold truncate transition-colors ${activeTool?.id === t.id ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>{t.name}</p>
                  <p className="text-[9px] text-white/20">{t.credits} cr</p>
                </div>
                {activeTool?.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </button>
            ))}
          </div>

        </div>

        {/* ── Main Area ─────────────────────────────────────────────────────── */}
        {activeTool
          ? <ToolWorkspace tool={activeTool} profile={profile} user={user} onDone={() => setActiveTool(null)} />
          : <StudioWelcome onSelectTool={setActiveTool} recentAssets={recentAssets} loadingAssets={loadingAssets} />
        }
      </div>

      {/* Onboarding overlay */}
      {showOnboarding && <StudioOnboarding onDismiss={dismissOnboarding} />}
    </div>
  );
}
