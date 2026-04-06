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
        "group animate-in fade-up duration-700 panorama-transition",
        isUser ? "flex flex-col items-end gap-3 mb-8" : "flex flex-col items-start gap-6 mb-12"
      )}
      aria-label={isUser ? "Tu mensaje" : `Mensaje de ${persona === 'antigravity' ? 'Antigravity' : 'Génesis'}`}
    >
      {isUser ? (
        <>
          <div className="chat-bubble-user text-white px-5 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-[3.5rem] rounded-tr-none text-[14px] md:text-[15px] font-medium max-w-[90%] md:max-w-[85%] leading-relaxed relative overflow-hidden group/user">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
            
            {msg.imagePreview && (
              <div className="rounded-xl md:rounded-[2rem] overflow-hidden mb-4 md:mb-6 border border-white/20 shadow-xl relative z-10 bg-black/20 p-1 backdrop-blur-md">
                <img src={msg.imagePreview} alt="Referencia visual adjunta" className="max-h-60 md:max-h-80 w-auto object-contain rounded-lg md:rounded-[1.5rem]" />
              </div>
            )}
            <span className="whitespace-pre-wrap relative z-10 tracking-tight selection:bg-white/20 font-medium">{msg.content}</span>
          </div>
          <div className="flex items-center gap-4 pr-6 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
               <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] italic">SYNC_OK</span>
            </div>
            <time className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] italic opacity-60">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </time>
          </div>
        </>
      ) : (
        <div className="w-full max-w-[98%]">
          <header className="flex items-center gap-3 md:gap-6 mb-4 md:mb-6 pl-2 md:pl-4">
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-[1.5rem] bg-white border border-zinc-100 flex items-center justify-center text-primary shadow-sm transition-all duration-700 group-hover:scale-110 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-60" />
               <Sparkles className="h-5 w-5 md:h-6 md:w-6 fill-primary/10 relative z-10" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[12px] font-black uppercase text-zinc-900 tracking-tighter italic">
                  {persona === 'antigravity' ? 'ANTIGRAVITY_CORE' : 'GENESIS_ENGINE'}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-zinc-950 text-[8px] font-black text-primary uppercase tracking-[0.3em] border border-primary/30 shadow-lg">AGENT_V21.0</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex items-end gap-0.5 h-3 items-center opacity-40">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="w-0.5 h-full bg-primary rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                   ))}
                 </div>
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none italic">AETHER_NEURAL_LINK</span>
              </div>
            </div>
          </header>

          <section className={cn(
            "px-6 md:px-14 py-6 md:py-14 rounded-[2rem] md:rounded-[4.5rem] rounded-tl-none transition-all duration-1000 relative group/msg border overflow-hidden shadow-sm",
            msg.type === 'plan' 
              ? "bg-zinc-50 border-zinc-200" 
              : "bg-white border-zinc-100"
          )}>
            {/* Soft Aura */}
            {!isUser && (
              <div className="absolute -top-16 md:-top-32 -right-16 md:-right-32 w-48 md:w-80 h-48 md:h-80 bg-primary/5 rounded-full blur-[60px] md:blur-[140px] pointer-events-none opacity-40" />
            )}
            
            {/* Neural Pattern Overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] neural-mesh select-none" aria-hidden="true" />
            <div className="absolute inset-0 scanline-overlay opacity-[0.02] pointer-events-none" />
            
            {/* Plan Header (Lumina Style) */}
            {msg.type === 'plan' && (
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-8 md:mb-12 pb-6 md:pb-10 border-b border-zinc-200 relative z-10">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[2.2rem] bg-white border border-zinc-200 flex items-center justify-center shadow-sm relative group/blueprint overflow-hidden">
                  <div className="absolute inset-0 bg-grid-canvas opacity-10" />
                  <Shield className="h-5 w-5 md:h-7 md:w-7 text-primary relative z-10" />
                </div>
                <div>
                  <span className="text-lg md:text-xl font-black uppercase tracking-tighter text-zinc-900 italic block mb-1">PLAN_DE_ARQUITECTURA</span>
                  <div className="flex items-center gap-2 md:gap-3">
                     <span className="px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-[8px] md:text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">PHASE_ALPHA</span>
                  </div>
                </div>
                
                <div className="ml-auto">
                  {msg.planStatus === 'pending' && (
                    <div className="flex items-center gap-4 px-8 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]" role="status">
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                       <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">AWAITING_APPROVAL</span>
                    </div>
                  )}
                  {msg.planStatus === 'approved' && (
                    <div className="flex items-center gap-4 px-8 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]" role="status">
                       <CheckCircle2 className="w-5 h-5 animate-bounce" />
                       <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">EXECUTING_LOGIC</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={cn(
              "prose prose-sm max-w-none relative z-10 font-medium selection:bg-primary/10 transition-colors duration-700 leading-relaxed",
              msg.type === 'plan' ? "prose-zinc prose-p:text-zinc-600 prose-headings:text-zinc-900" : "prose-zinc text-zinc-700 md:text-zinc-800"
            )}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} 
            />

            {/* Action navigation for industrial plans */}
            {msg.type === 'plan' && msg.planStatus === 'pending' && (
              <nav className="flex items-center gap-6 mt-16 pt-10 border-t border-white/10 relative z-10" aria-label="Acciones de plan">
                <button
                  onClick={onApprovePlan}
                  aria-label="Aprobar y comenzar construcción"
                  className="flex-1 flex items-center justify-center gap-5 px-12 py-6 rounded-[2.5rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.25em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] group relative overflow-hidden italic"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform text-primary" />
                  LANZAR_CONSTRUCCIÓN_ATÓMICA
                </button>
                <button 
                  onClick={onRejectPlan}
                  aria-label="Rechazar y revisar prompt"
                  className="px-10 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 border-dashed italic"
                >
                  REVISAR_PARÁMETROS
                </button>
              </nav>
            )}

            {/* Project Download Artifact (Genesis V16.0) */}
            {msg.blob && (
              <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-zinc-100">
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
                  className="w-full flex items-center justify-center gap-4 px-6 md:px-8 py-4 md:py-6 rounded-xl md:rounded-[2rem] bg-zinc-900 text-white text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-black transition-all active:scale-[0.98] group/download italic shadow-lg shadow-zinc-200"
                >
                  <Download className="w-5 h-5 group-hover/download:translate-y-1 transition-transform text-white/80" />
                  DESCARGAR_ZIP_COMPLETO
                </button>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.4em] text-center mt-5 opacity-40 italic">
                  GENESIS_CONSOLIDATION_V21.0
                </p>
              </div>
            )}

            {/* Tech stack badges */}
            {msg.stack && msg.stack.length > 0 && (
              <footer className="flex flex-wrap gap-3 mt-10 pt-10 border-t border-black/[0.04]" aria-label="Tecnologías utilizadas">
                {msg.stack.map(s => (
                  <span key={s} className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-zinc-100/50 text-zinc-600 border border-black/[0.04] transition-all hover:bg-primary/10 hover:border-primary/20 hover:text-primary italic">
                    {s}
                  </span>
                ))}
              </footer>
            )}

            {/* Quick Actions */}
            <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-all translate-y-2 group-hover/msg:translate-y-0">
              <button 
                onClick={() => onCopy(msg.content, msg.id)}
                className="p-3.5 rounded-2xl bg-white border border-black/[0.06] text-zinc-400 hover:text-primary hover:bg-white hover:shadow-2xl transition-all shadow-sm active:scale-90"
              >
                {copiedId === msg.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button 
                onClick={onRetry}
                className="p-3.5 rounded-2xl bg-white border border-black/[0.06] text-zinc-400 hover:text-primary hover:bg-white hover:shadow-2xl transition-all shadow-sm active:scale-90"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </section>

          {msg.suggestions && msg.suggestions.length > 0 && (
            <nav className="mt-4 md:mt-8 flex flex-wrap gap-2 md:gap-3 pl-2 md:pl-6" aria-label="Sugerencias de continuación">
              {msg.suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => onSuggestionClick(s)}
                  className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-[2rem] border border-zinc-100 bg-white text-[11px] md:text-[12px] font-black text-zinc-500 hover:border-primary/30 hover:text-primary hover:shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-700 active:scale-95 italic tracking-tighter"
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
