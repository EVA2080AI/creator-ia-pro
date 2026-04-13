import { useState } from 'react';
import {
  Sparkles, Shield, CheckCircle2, Copy, Check, RotateCcw,
  Download, Cpu, ChevronDown, FileCode2, Package, Lightbulb, XCircle
} from 'lucide-react';
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

// ── Collapsible File Accordion ───────────────────────────────────────────────
function FileAccordion({ files }: { files: string[] }) {
  const [open, setOpen] = useState(false);
  const PREVIEW = 3;

  return (
    <div className="mt-4 rounded-xl border border-zinc-100 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
          <Package className="h-3.5 w-3.5 text-primary" />
          {files.length} archivo{files.length > 1 ? 's' : ''} generado{files.length > 1 ? 's' : ''}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-[400px]" : "max-h-0"
        )}
      >
        <div className="p-2 space-y-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors group"
            >
              <FileCode2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[12px] font-mono text-zinc-600 truncate flex-1">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {!open && files.length > PREVIEW && (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-center py-1.5 text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors border-t border-zinc-100"
        >
          +{files.length - PREVIEW} más
        </button>
      )}
    </div>
  );
}

// ── Main MessageItem ─────────────────────────────────────────────────────────
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
  const [contentCopied, setContentCopied] = useState(false);

  const handleCopy = () => {
    onCopy(msg.content, msg.id);
    setContentCopied(true);
    setTimeout(() => setContentCopied(false), 2000);
  };

  return (
    <article
      className={cn(
        "group animate-in fade-in duration-500 slide-in-from-bottom-2",
        isUser
          ? "flex flex-col items-end gap-1.5 mb-5"
          : "flex flex-col items-start gap-3 mb-6"
      )}
      aria-label={isUser ? "Tu mensaje" : `Mensaje de ${persona === 'antigravity' ? 'Antigravity' : 'Génesis'}`}
    >

      {/* ── USER BUBBLE ──────────────────────────────────────── */}
      {isUser ? (
        <>
          {msg.imagePreview && (
            <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm max-w-[85%]">
              <img src={msg.imagePreview} alt="Referencia visual" className="max-h-52 w-auto object-contain" />
            </div>
          )}
          <div className="chat-bubble-user text-white px-4 py-3 rounded-2xl rounded-tr-sm text-[13.5px] font-medium max-w-[88%] leading-relaxed shadow-md shadow-primary/15">
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
          <time className="text-[10px] text-zinc-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </>
      ) : (

      /* ── AI BUBBLE ───────────────────────────────────────── */
      <div className="w-full max-w-[97%]">

        {/* Agent header */}
        <header className="flex items-center gap-2 mb-2.5 pl-0.5">
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[11.5px] font-bold text-zinc-800 tracking-tight">
            {persona === 'antigravity' ? 'Antigravity AI' : 'Génesis AI'}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-primary/8 border border-primary/15 text-[9px] font-bold text-primary uppercase tracking-wider">
            V21
          </span>
          {msg.type === 'code' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
              <Cpu className="h-2.5 w-2.5" />
              Código
            </span>
          )}
          {msg.type === 'plan' && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-600 uppercase tracking-wider">
              <Shield className="h-2.5 w-2.5" />
              Plan
            </span>
          )}
        </header>

        {/* Message card */}
        <section
          className={cn(
            "relative rounded-2xl rounded-tl-sm border overflow-hidden transition-all duration-300 group/msg",
            msg.type === 'plan'
              ? "bg-zinc-50 border-zinc-200 p-4 md:p-5"
              : "bg-white border-zinc-100 shadow-sm p-4 md:p-5"
          )}
        >
          {/* Hover glow */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-700" />

          {/* ── Plan banner ─── */}
          {msg.type === 'plan' && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-200">
              <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-zinc-900">Plan de Arquitectura</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Fase Alpha · Pendiente de aprobación</p>
              </div>
              {msg.planStatus === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-600 uppercase tracking-wide shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Esperando
                </span>
              )}
              {msg.planStatus === 'approved' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-600 uppercase tracking-wide shrink-0">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Ejecutando
                </span>
              )}
              {msg.planStatus === 'rejected' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[9px] font-bold text-red-500 uppercase tracking-wide shrink-0">
                  <XCircle className="h-2.5 w-2.5" />
                  Rechazado
                </span>
              )}
            </div>
          )}

          {/* ── Content ─── */}
          <div
            className="result-prose relative z-10 leading-relaxed text-[13px] text-zinc-700"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />

          {/* ── Files accordion ─── */}
          {msg.files && msg.files.length > 0 && (
            <FileAccordion files={msg.files} />
          )}

          {/* ── Plan actions ─── */}
          {msg.type === 'plan' && msg.planStatus === 'pending' && (
            <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-zinc-200">
              <button
                onClick={onApprovePlan}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-wide hover:bg-black transition-all active:scale-[0.98] shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Construir ahora
              </button>
              <button
                onClick={onRejectPlan}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 text-[11px] font-bold hover:border-zinc-300 hover:text-zinc-700 transition-all active:scale-[0.98]"
              >
                Revisar
              </button>
            </div>
          )}

          {/* ── Download artifact ─── */}
          {msg.blob && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
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
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-[11px] font-bold hover:bg-black transition-all active:scale-[0.98] group/dl"
              >
                <Download className="w-3.5 h-3.5 group-hover/dl:translate-y-0.5 transition-transform" />
                Descargar proyecto (.zip)
              </button>
            </div>
          )}

          {/* ── Tech stack badges ─── */}
          {msg.stack && msg.stack.length > 0 && (
            <footer className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-100">
              {msg.stack.map(s => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all cursor-default"
                >
                  {s}
                </span>
              ))}
            </footer>
          )}

          {/* ── Hover actions ─── */}
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all -translate-y-1 group-hover/msg:translate-y-0 duration-200">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-xs active:scale-90"
              aria-label="Copiar mensaje"
              title="Copiar"
            >
              {contentCopied
                ? <Check className="h-3 w-3 text-emerald-500" />
                : <Copy className="h-3 w-3" />
              }
            </button>
            <button
              onClick={onRetry}
              className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-xs active:scale-90"
              aria-label="Reintentar"
              title="Reintentar"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </section>

        {/* ── Suggestion chips ─── */}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <nav className="mt-2.5 flex flex-wrap gap-1.5 pl-0.5" aria-label="Sugerencias">
            <span className="self-center">
              <Lightbulb className="h-3 w-3 text-amber-400" />
            </span>
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s)}
                className="px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-[10.5px] font-medium text-zinc-500 hover:border-primary/40 hover:text-primary hover:shadow-sm transition-all animate-in fade-in active:scale-95"
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
