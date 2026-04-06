import { Sparkles, Shield, CheckCircle2, Copy, Check, RotateCcw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './renderer';
import type { Message } from './types';

interface MessageItemProps {
  msg: Message;
  persona: 'genesis' | 'antigravity';
  copiedId: string | null;
  onCopy: (content: string, id: string) => void;
  onRetry: () => void;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onSuggestionClick: (s: string) => void;
}

export function MessageItem({
  msg,
  persona,
  copiedId,
  onCopy,
  onRetry,
  onApprovePlan,
  onRejectPlan,
  onSuggestionClick
}: MessageItemProps) {
  const isUser = msg.role === 'user';

  return (
    <article 
      className={cn(
        "group animate-in fade-up duration-500",
        isUser ? "flex flex-col items-end gap-2 mb-6" : "flex flex-col items-start gap-4 mb-9"
      )}
      aria-label={isUser ? "Tu mensaje" : `Mensaje de ${persona === 'antigravity' ? 'Antigravity' : 'Génesis'}`}
    >
      {isUser ? (
        <>
          <div className="bg-primary/95 text-primary-foreground px-8 py-5 rounded-[2.5rem] rounded-tr-none text-sm font-bold shadow-2xl max-w-[85%] leading-relaxed aether-iridescent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            {msg.imagePreview && (
              <div className="rounded-2xl overflow-hidden mb-4 border border-white/20 shadow-xl relative z-10">
                <img src={msg.imagePreview} alt="Referencia visual adjunta" className="max-h-64 w-auto object-contain" />
              </div>
            )}
            <span className="whitespace-pre-wrap relative z-10">{msg.content}</span>
          </div>
          <time className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity pr-4 mt-1 italic">
            TX_LOG: {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </time>
        </>
      ) : (
        <div className="w-full max-w-[98%]">
          <header className="flex items-center gap-4 mb-4 pl-2">
            <div className="h-11 w-11 rounded-[1.25rem] bg-white border border-black/[0.04] flex items-center justify-center text-primary shadow-xl transition-all group-hover:scale-105 group-hover:rotate-3 aether-iridescent">
              <Sparkles className="h-5 w-5 fill-primary/10" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xs font-black uppercase text-zinc-900 tracking-tight leading-none mb-1 italic">
                {persona === 'antigravity' ? 'ANTIGRAVITY_CORE' : 'GENESIS_ENGINE'}
              </span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">AETHER_SOVEREIGN_V9.0</span>
              </div>
            </div>
          </header>

          <section className={cn(
            "px-10 py-10 rounded-[2.5rem] rounded-tl-none transition-all duration-700 relative group/msg border overflow-hidden",
            msg.type === 'plan' 
              ? "bg-zinc-900 text-white border-white/10 shadow-2xl" 
              : "bg-white/40 border-black/[0.04] backdrop-blur-3xl saturate-[1.5] shadow-xl"
          )}>
            {/* Blueprint Grid for Plans */}
            {msg.type === 'plan' && (
              <div className="absolute inset-0 pointer-events-none opacity-[0.05] select-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} aria-hidden="true" />
            )}

            {/* Plan Header (Industrial Style) */}
            {msg.type === 'plan' && (
              <div className="flex items-center gap-5 mb-10 pb-8 border-b border-white/10 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative">
                  <Shield className="h-6 w-6 text-primary" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-lg animate-pulse" />
                </div>
                <div>
                  <span className="text-sm font-black uppercase tracking-tighter text-white italic">Plan Maestro de Ingeniería Atómica</span>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] leading-none animate-pulse">STRATEGIC_PHASE_01</span>
                  </div>
                </div>
                
                <div className="ml-auto">
                  {msg.planStatus === 'pending' && (
                    <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500" role="status">
                       <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Awaiting_Approve</span>
                    </div>
                  )}
                  {msg.planStatus === 'approved' && (
                    <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" role="status">
                       <CheckCircle2 className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Exec_Orquestation</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={cn(
              "prose prose-sm max-w-none relative z-10 font-medium selection:bg-primary/20 transition-colors duration-500",
              msg.type === 'plan' ? "prose-invert prose-p:text-zinc-300 prose-headings:text-white" : "prose-zinc text-zinc-700"
            )}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} 
            />

            {/* Action navigation for industrial plans */}
            {msg.type === 'plan' && msg.planStatus === 'pending' && (
              <nav className="flex items-center gap-4 mt-12 pt-8 border-t border-white/10 relative z-10" aria-label="Acciones de plan">
                <button
                  onClick={onApprovePlan}
                  aria-label="Aprobar y comenzar construcción"
                  className="flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl group"
                >
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Lanzar Construcción Atómica
                </button>
                <button 
                  onClick={onRejectPlan}
                  aria-label="Rechazar y revisar prompt"
                  className="px-8 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-zinc-400 text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95 border-dashed"
                >
                  Revisar Parámetros
                </button>
              </nav>
            )}

            {/* Project Download Artifact (Genesis V16.0) */}
            {msg.blob && (
              <div className="mt-8 pt-6 border-t border-black/[0.04]">
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(msg.blob!);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `proyecto-${msg.id.slice(0, 5)}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black hover:shadow-2xl hover:shadow-black/20 transition-all active:scale-[0.98] group/download"
                >
                  <Download className="w-4 h-4 group-hover/download:translate-y-0.5 transition-transform" />
                  Descargar Proyecto ZIP
                </button>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center mt-3 opacity-60">
                  Arquitectura Swarm V16.0 Consolidada
                </p>
              </div>
            )}

            {/* Tech stack badges */}
            {msg.stack && msg.stack.length > 0 && (
              <footer className="flex flex-wrap gap-2 mt-7 pt-7 border-t border-black/[0.04]" aria-label="Tecnologías utilizadas">
                {msg.stack.map(s => (
                  <span key={s} className="px-3.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-zinc-50 text-zinc-500 border border-black/[0.04] transition-colors hover:border-black/10 hover:text-zinc-800">
                    {s}
                  </span>
                ))}
              </footer>
            )}

            {/* Quick Actions */}
            <div className="absolute top-5 right-5 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all translate-y-1 group-hover/msg:translate-y-0">
              <button 
                onClick={() => onCopy(msg.content, msg.id)}
                aria-label={copiedId === msg.id ? "Copiado" : "Copiar contenido"}
                className="p-2.5 rounded-xl bg-white border border-black/[0.04] text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm active:scale-90"
              >
                {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button 
                onClick={onRetry}
                aria-label="Reintentar generación"
                className="p-2.5 rounded-xl bg-white border border-black/[0.04] text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm active:scale-90"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* Assistant suggestions */}
          {msg.suggestions && msg.suggestions.length > 0 && (
            <nav className="mt-5 flex flex-wrap gap-2 pl-2" aria-label="Sugerencias de continuación">
              {msg.suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => onSuggestionClick(s)}
                  className="px-6 py-3 rounded-full border border-black/[0.06] bg-white text-[11px] font-bold text-zinc-500 hover:border-primary/40 hover:text-primary hover:shadow-[0_10px_25px_-8px_rgba(0,0,0,0.06)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 active:scale-95"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {s}
                </button>
              ))}
            </nav>
          )}
        </div>
      )}
    </article>
  );
}
