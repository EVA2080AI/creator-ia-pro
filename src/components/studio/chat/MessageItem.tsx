import { Sparkles, Shield, CheckCircle2, Copy, Check, RotateCcw } from 'lucide-react';
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
          <div className="bg-primary text-primary-foreground px-7 py-5 rounded-[2.5rem] rounded-tr-none text-[13px] font-semibold shadow-[0_20px_50px_-12px_rgba(var(--primary-rgb),0.3)] max-w-[85%] leading-relaxed">
            {msg.imagePreview && (
              <div className="rounded-2xl overflow-hidden mb-4 border border-white/20 shadow-xl">
                <img src={msg.imagePreview} alt="Referencia visual adjunta" className="max-h-64 w-auto object-contain" />
              </div>
            )}
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
          <time className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity pr-4 mt-1">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </>
      ) : (
        <div className="w-full max-w-[98%]">
          <header className="flex items-center gap-3.5 mb-4 pl-2">
            <div className="h-10 w-10 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center text-primary shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-105 group-hover:rotate-3">
              <Sparkles className="h-5 w-5 fill-primary/10" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-black uppercase text-zinc-900 tracking-[0.2em] leading-none mb-1 font-display">
                {persona === 'antigravity' ? 'Antigravity Core' : 'Genesis Engine'}
              </span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                 <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Protocolo Lumina v2.0</span>
              </div>
            </div>
          </header>

          <section className={cn(
            "px-9 py-8 rounded-[2.5rem] rounded-tl-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-700 relative group/msg border overflow-hidden",
            msg.type === 'plan' 
              ? "bg-indigo-50/40 border-indigo-200/40" 
              : "bg-white/90 border-black/[0.04] backdrop-blur-[40px] saturate-[1.2]"
          )}>
            {/* Background design for plans */}
            {msg.type === 'plan' && (
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
            )}

            {/* Plan Header */}
            {msg.type === 'plan' && (
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-indigo-100/50 relative z-10">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)]">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-700 font-display">Génesis Arquitecto</span>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest leading-none">Plan de Ingeniería Atómica</span>
                  </div>
                </div>
                
                <div className="ml-auto">
                  {msg.planStatus === 'pending' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/50" role="status">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                       <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Esperando</span>
                    </div>
                  )}
                  {msg.planStatus === 'approved' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50" role="status">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ejecutando</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={cn(
              "prose prose-zinc prose-sm max-w-none relative z-10 font-medium selection:bg-primary/10",
              msg.type === 'plan' ? "text-indigo-950/80 prose-indigo" : "text-zinc-600"
            )}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} 
            />

            {/* Action buttons for pending plans */}
            {msg.type === 'plan' && msg.planStatus === 'pending' && (
              <nav className="flex items-center gap-3 mt-8 pt-6 border-t border-indigo-100/50 relative z-10" aria-label="Acciones de plan">
                <button
                  onClick={onApprovePlan}
                  aria-label="Aprobar y comenzar construcción"
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200/50 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Comenzar Construcción
                </button>
                <button 
                  onClick={onRejectPlan}
                  aria-label="Rechazar y revisar prompt"
                  className="px-6 py-3.5 rounded-2xl bg-white border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95"
                >
                  Revisar Prompt
                </button>
              </nav>
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
