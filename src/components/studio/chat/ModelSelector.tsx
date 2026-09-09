import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ChevronDown, Zap, Eye, DollarSign, Cpu, Image as ImageIcon } from 'lucide-react';
import { MODELS } from './constants';
import { IMAGE_MODELS } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Único selector de modelos del producto. Antes había 3 (components/ModelSelector,
// components/ai/ModelSelector y este) con catálogos hardcodeados divergentes;
// ahora todos derivan del catálogo canónico src/lib/ai/models.ts.
interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
  /** 'text' = CHAT_MODELS (coste por mensaje) · 'image' = IMAGE_MODELS (Replicate). */
  models?: 'text' | 'image';
  /** 'inline' = chip compacto (chat/canvas) · 'full' = botón ancho (panel de Tools). */
  variant?: 'inline' | 'full';
}

interface RowModel {
  id: string;
  label: string;
  badge: string;
  provider: string;
  description: string;
  vision: boolean;
  free: boolean;
  credits: number;
}

// IMAGE_MODELS no trae copy de vitrina — se describe aquí, junto al resto del UI.
const IMAGE_ROWS: RowModel[] = IMAGE_MODELS.map((m) => ({
  id: m.id,
  label: m.label,
  badge: m.credits <= 2 ? 'ECO' : 'PRO',
  provider: 'Replicate',
  description: m.supportsImagePrompt
    ? 'Máxima fidelidad y seguimiento de prompt. Acepta imagen de referencia.'
    : '4 pasos, ultra rápido. Disponible en todos los planes.',
  vision: m.supportsImagePrompt,
  free: false,
  credits: m.credits,
}));

const FREE_MODELS = MODELS.filter(m => m.free);
const PAID_MODELS = MODELS.filter(m => !m.free);

const PROVIDER_COLORS: Record<string, string> = {
  Google: 'text-blue-500',
  Anthropic: 'text-amber-500',
  OpenAI: 'text-emerald-500',
  Meta: 'text-indigo-500',
  Microsoft: 'text-sky-500',
  DeepSeek: 'text-violet-500',
  Replicate: 'text-teal-500',
};

function ModelRow({
  m,
  isSelected,
  onSelect,
}: {
  m: RowModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const providerColor = PROVIDER_COLORS[m.provider] ?? 'text-zinc-400';

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl border transition-all group/item relative",
        isSelected
          ? "bg-primary/[0.05] border-primary/25"
          : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"
      )}
    >
      {/* Active indicator */}
      {isSelected && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-primary" />
      )}

      <div className="flex items-center justify-between gap-2 pl-3">
        {/* Left: name + desc */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[11.5px] font-black tracking-tight", isSelected ? "text-zinc-900" : "text-zinc-700 group-hover/item:text-zinc-900")}>
              {m.label}
            </span>
            <span className={cn("text-[8.5px] font-bold uppercase tracking-widest", providerColor)}>
              {m.provider}
            </span>
            {m.vision && (
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-500 uppercase tracking-wider">
                <Eye className="h-2.5 w-2.5" />Vision
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug truncate pr-2">{m.description}</p>
        </div>

        {/* Right: badge + cost */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
            m.free
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : m.badge === 'PRO'
              ? "bg-amber-50 text-amber-600 border-amber-200"
              : "bg-violet-50 text-violet-600 border-violet-200"
          )}>
            {m.free ? '✓ FREE' : m.badge}
          </span>
          {!m.free && (
            <span className="text-[8px] font-mono text-zinc-400">
              {m.credits} {m.credits === 1 ? 'crédito' : 'créditos'}/uso
            </span>
          )}
          {m.free && (
            <span className="text-[8px] text-emerald-500 font-bold">Sin coste</span>
          )}
        </div>
      </div>
    </button>
  );
}

const DROPDOWN_WIDTH = 416; // matches w-[26rem]
const DROPDOWN_GAP = 12;    // 0.75rem breathing room
const VIEWPORT_PADDING = 12;

export function ModelSelector({ selectedModel, onSelect, models = 'text', variant = 'inline' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; maxHeight: number; openUpward: boolean } | null>(null);
  const rows: RowModel[] = models === 'image' ? IMAGE_ROWS : MODELS;
  const currentModel = rows.find(m => m.id === selectedModel) ?? rows[0];
  const isFree = currentModel.free;

  // Position the portal dropdown next to the trigger and decide direction based on viewport space.
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceAbove = rect.top - VIEWPORT_PADDING;
      const spaceBelow = vh - rect.bottom - VIEWPORT_PADDING;
      const openUpward = spaceAbove >= 320 || spaceAbove > spaceBelow;
      const maxHeight = Math.max(220, openUpward ? spaceAbove - DROPDOWN_GAP : spaceBelow - DROPDOWN_GAP);
      // El panel se achica con maxWidth en viewports angostos (ver JSX) — usar
      // ese mismo ancho efectivo aquí, si no `left` puede quedar negativo en
      // móvil (bug documentado: el dropdown se recortaba contra el borde).
      const effectiveWidth = Math.min(DROPDOWN_WIDTH, vw - VIEWPORT_PADDING * 2);
      const left = Math.min(
        Math.max(VIEWPORT_PADDING, rect.left),
        vw - effectiveWidth - VIEWPORT_PADDING
      );
      const top = openUpward
        ? rect.top - DROPDOWN_GAP
        : rect.bottom + DROPDOWN_GAP;
      setCoords({ left, top, maxHeight, openUpward });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <div className="relative">
      {variant === 'full' ? (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 h-11 rounded-xl border transition-all duration-200 group",
            isOpen
              ? "bg-white border-zinc-300 shadow-sm"
              : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100"
          )}
        >
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[13px] font-bold text-zinc-900 truncate leading-none">{currentModel.label}</span>
            <span className="text-[10px] text-zinc-500 mt-0.5 leading-none">
              {isFree ? 'Sin coste' : `${currentModel.credits} crédito${currentModel.credits > 1 ? 's' : ''}`} · {currentModel.provider}
            </span>
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", isOpen ? "rotate-180 text-primary" : "text-zinc-400")} />
        </button>
      ) : (
        <button
          ref={triggerRef}
          id="model-selector-trigger"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 border group",
            isOpen
              ? "bg-white border-zinc-200 shadow-sm"
              : "border-transparent hover:bg-white hover:border-zinc-200 bg-transparent"
          )}
        >
          {isFree
            ? <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
            : <Cpu className="h-3 w-3 text-amber-500 shrink-0" />
          }
          <span className={cn(
            "text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap leading-none",
            isOpen ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-800"
          )}>
            {currentModel.label}
          </span>
          {isFree && (
            <span className="text-[7px] font-black text-emerald-500 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              FREE
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-200", isOpen ? "rotate-180 text-primary" : "text-zinc-400")} />
        </button>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && coords && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: coords.openUpward ? 8 : -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords.openUpward ? 8 : -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  left: coords.left,
                  top: coords.openUpward ? undefined : coords.top,
                  bottom: coords.openUpward ? Math.max(VIEWPORT_PADDING, window.innerHeight - coords.top) : undefined,
                  width: DROPDOWN_WIDTH,
                  maxWidth: 'calc(100vw - 24px)',
                  maxHeight: coords.maxHeight,
                }}
                className="rounded-2xl overflow-hidden z-[9999] bg-white/95 backdrop-blur-xl border border-zinc-200/60 shadow-[0_20px_70px_rgba(0,0,0,0.15)] flex flex-col"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    {models === 'image'
                      ? <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      {models === 'image' ? 'Seleccionar motor' : 'Seleccionar modelo'}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-medium">
                    {models === 'image' ? 'Créditos por imagen' : 'Créditos por mensaje'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {models === 'image' ? (
                    <div className="px-3 pt-3 pb-3">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <ImageIcon className="h-3 w-3 text-teal-500" />
                        <span className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em]">
                          Motores de imagen — Replicate
                        </span>
                        <div className="flex-1 h-px bg-zinc-100" />
                      </div>
                      <div className="space-y-0.5">
                        {IMAGE_ROWS.map(m => (
                          <ModelRow
                            key={m.id}
                            m={m}
                            isSelected={selectedModel === m.id}
                            onSelect={() => { onSelect(m.id); setIsOpen(false); }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* FREE section */}
                      <div className="px-3 pt-3 pb-1">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                            ✓ Gratis — Sin coste OpenRouter
                          </span>
                          <div className="flex-1 h-px bg-emerald-100" />
                        </div>
                        <div className="space-y-0.5">
                          {FREE_MODELS.map(m => (
                            <ModelRow
                              key={m.id}
                              m={m}
                              isSelected={selectedModel === m.id}
                              onSelect={() => { onSelect(m.id); setIsOpen(false); }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* PAID section */}
                      <div className="px-3 pt-2 pb-3">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <DollarSign className="h-3 w-3 text-amber-500" />
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">
                            Premium — Consume créditos OpenRouter
                          </span>
                          <div className="flex-1 h-px bg-amber-100" />
                        </div>
                        <div className="space-y-0.5">
                          {PAID_MODELS.map(m => (
                            <ModelRow
                              key={m.id}
                              m={m}
                              isSelected={selectedModel === m.id}
                              onSelect={() => { onSelect(m.id); setIsOpen(false); }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50 shrink-0">
                  <p className="text-[9px] text-zinc-400 text-center">
                    {models === 'image'
                      ? <>💡 Por defecto <strong className="text-teal-600">Flux Schnell</strong> — rápido y disponible en todos los planes</>
                      : <>💡 Por defecto <strong className="text-amber-600">Claude Sonnet 4.5</strong> (pro) o <strong className="text-emerald-600">Gemini 2.5 Flash Lite</strong> (gratis)</>}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}