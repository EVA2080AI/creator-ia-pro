import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  showPro?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: { icon: "w-6 h-6",   text: "text-[14px]", subtext: "text-[9px]"  },
  md: { icon: "w-7 h-7",   text: "text-[16px]", subtext: "text-[10px]" },
  lg: { icon: "w-10 h-10", text: "text-[20px]", subtext: "text-[12px]" },
};

/** El morado de marca, fijo: `text-primary` dejó de ser morado cuando los tokens se
 *  volvieron neutros. Es el único color de la marca: vive en el bloque-cursor. */
const BRAND_PURPLE = "#A855F7";

export function Logo({ size = "sm", showText = true, showPro = false, className, onClick }: LogoProps) {
  const s = sizeMap[size];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn("flex items-center gap-2.5 shrink-0", onClick && "group cursor-pointer", className)}
    >
      {/* Marca (V3+V2, 2026-10-06): la "C" gruesa con CORTES PLANOS (los extremos
          redondeados la hacían ver blanda, de plantilla) y, en la apertura, un
          BLOQUE-CURSOR morado — el cursor de terminal que ya parpadea en el
          compositor del modo oscuro: una sola seña en toda la marca. Va desnuda,
          sin tile detrás: el tile queda solo para el favicon (public/favicon.svg,
          mismo dibujo), donde hace falta fondo propio. */}
      <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0 text-zinc-900 dark:text-zinc-50", s.icon)} xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="5" strokeLinecap="butt" strokeDasharray="39 50.3" transform="rotate(40.35 12 12)" />
        <rect x="17.85" y="8.9" width="4.8" height="6.2" rx="1" fill={BRAND_PURPLE} />
      </svg>

      {/* Text */}
      {showText && (
        <div className="hidden sm:flex flex-col leading-none">
          {/* logo-wordmark: selector estable para overrides externos (ver
              Assistant.css) — no depender de que esta combinación exacta de
              clases utilitarias se mantenga si este componente cambia. */}
          {/* Monocromo a propósito: con el bloque morado al lado, un "IA" también
              morado era dos acentos peleándose. El wordmark acompaña; la marca
              es la C con el cursor. */}
          <span className={cn("logo-wordmark font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-display", s.text)}>
            Creator IA
            {showPro && (
              <span className="ml-1 text-zinc-500 dark:text-zinc-400 font-semibold tracking-normal" style={{ fontSize: "0.7em" }}>
                Pro
              </span>
            )}
          </span>
        </div>
      )}
    </Tag>
  );
}
