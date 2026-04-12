import { Sparkles, Shield, CheckCircle2, Copy, Check, RotateCcw, Download, Cpu } from 'lucide-react';
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
        "group animate-in fade-in duration-500 slide-in-from-bottom-2",
        isUser
          ? "flex flex-col items-end gap-2 mb-6"
          : "flex flex-col items-start gap-4 mb-8"
      )}
      aria-label={isUser ? "Tu mensaje" : `Mensaje de ${persona === 'antigravity' ? 'Antigravity' : 'Génesis'}`}
    >
      {/* ── USER BUBBLE ── */}
      {isUser ? (
        <>
          {/* Image preview */}
          {msg.imagePreview && (
            <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg max-w-[85%]">
              <img
                src={msg.imagePreview}
                alt="Referencia visual adjunta"
                className="max-h-60 w-auto object-contain"
              />
            </div>
          )}
          <div className="chat-bubble-user text-white px-5 py-3.5 rounded-2xl rounded-tr-sm text-[14px] font-medium max-w-[88%] leading-relaxed shadow-lg shadow-primary/20">
            <span className="whitespace-pre-wrap tracking-tight">{msg.content}</span>
          </div>
          <time className="text-[10px] text-zinc-400 font-medium mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </>
      ) : (
        /* ── AI BUBBLE ── */
        <div className="w-full max-w-[97%]">
          {/* Agent header */}
          <header className="flex items-center gap-2.5 mb-3 pl-1">
            <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-zinc-900 tracking-tight">
                {persona === 'antigravity' ? 'Antigravity AI' : 'Génesis AI'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-primary/8 border border-primary/15 text-[9px] font-bold text-primary uppercase tracking-wider">
                V21
              </span>
              {msg.type === 'code' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                  <Cpu className="h-2.5 w-2.5" />
                  Código
                </span>
              )}
            </div>
          </header>

          {/* Message body */}
          <section
            className={cn(
              "relative rounded-2xl rounded-tl-sm border overflow-hidden transition-all duration-300 group/msg",
              msg.type === 'plan'
                ? "bg-zinc-50 border-zinc-200 p-5 md:p-7"
                : "bg-white border-zinc-100 shadow-sm p-5 md:p-7"
            )}
          >
            {/* Subtle purple glow only on hover */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/4 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-700" />

            {/* ── Plan header ─────────────────────────── */}
            {msg.type === 'plan' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-5 border-b border-zinc-200">
                <div className="h-10 w-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 tracking-tight">Plan de Arquitectura</p>
                  <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Fase Alpha · Pendiente de aprobación</p>
                </div>
                <div className="ml-auto shrink-0">
                  {msg.planStatus === 'pending' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Esperando
                    </span>
                  )}
                  {msg.planStatus === 'approved' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                      <CheckCircle2 className="w-3 h-3" />
                      Ejecutando
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── Content ─────────────────────────────── */}
            <div
              className={cn(
                "result-prose relative z-10 leading-relaxed text-[13px]",
                msg.type === 'plan' ? "" : "text-zinc-600"
              )}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />

            {/* ── Plan Actions ────────────────────────── */}
            {msg.type === 'plan' && msg.planStatus === 'pending' && (
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-zinc-200">
                <button
                  onClick={onApprovePlan}
                  aria-label="Aprobar y comenzar construcción"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold tracking-wide hover:bg-black transition-all active:scale-[0.98] shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Construir ahora
                </button>
                <button
                  onClick={onRejectPlan}
                  aria-label="Rechazar y revisar"
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 text-[12px] font-bold hover:border-zinc-300 hover:text-zinc-700 transition-all active:scale-[0.98]"
                >
                  Revisar
                </button>
              </div>
            )}

            {/* ── Download artifact ───────────────────── */}
            {msg.blob && (
              <div className="mt-5 pt-5 border-t border-zinc-100">
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
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-zinc-900 text-white text-[12px] font-bold hover:bg-black transition-all active:scale-[0.98] group/dl"
                >
                  <Download className="w-4 h-4 group-hover/dl:translate-y-0.5 transition-transform" />
                  Descargar proyecto (.zip)
                </button>
              </div>
            )}

            {/* ── Tech stack badges ───────────────────── */}
            {msg.stack && msg.stack.length > 0 && (
              <footer className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-100" aria-label="Tecnologías utilizadas">
                {msg.stack.map(s => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all cursor-default"
                  >
                    {s}
                  </span>
                ))}
              </footer>
            )}

            {/* ── Quick actions (hover) ───────────────── */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-all -translate-y-1 group-hover/msg:translate-y-0">
              <button
                onClick={() => onCopy(msg.content, msg.id)}
                className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-xs active:scale-90"
                aria-label="Copiar mensaje"
              >
                {copiedId === msg.id
                  ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                  : <Copy className="h-3.5 w-3.5" />
                }
              </button>
              <button
                onClick={onRetry}
                className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-xs active:scale-90"
                aria-label="Reintentar"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* ── Suggestion chips ────────────────────── */}
          {msg.suggestions && msg.suggestions.length > 0 && (
            <nav
              className="mt-3 flex flex-wrap gap-2 pl-1"
              aria-label="Sugerencias de continuación"
            >
              {msg.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(s)}
                  className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-[11px] font-medium text-zinc-500 hover:border-primary/40 hover:text-primary hover:shadow-sm hover:shadow-primary/5 transition-all animate-in fade-in duration-500 active:scale-95"
                  style={{ animationDelay: `${i * 80}ms` }}
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
