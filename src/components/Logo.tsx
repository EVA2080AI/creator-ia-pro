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
  sm: { wrap: "w-7 h-7",   icon: "w-4 h-4",   text: "text-[14px]", subtext: "text-[9px]"  },
  md: { wrap: "w-9 h-9",   icon: "w-5 h-5",   text: "text-[16px]", subtext: "text-[10px]" },
  lg: { wrap: "w-12 h-12", icon: "w-7 h-7",   text: "text-[20px]", subtext: "text-[12px]" },
};

/** El morado de marca, fijo: `text-primary` dejó de ser morado cuando los tokens se
 *  volvieron neutros y el "IA" del wordmark quedó del mismo color que "Creator". */
const BRAND_PURPLE = "#A855F7";

export function Logo({ size = "sm", showText = true, showPro = false, className, onClick }: LogoProps) {
  const s = sizeMap[size];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn("flex items-center gap-2.5 shrink-0", onClick && "group cursor-pointer", className)}
    >
      {/* Marca: "C" de Creator —un anillo GRUESO con la apertura franca a la
          derecha— y el punto morado de la marca dentro de esa apertura. El anillo
          fino anterior, a 28px, se leía como un spinner de carga ("se ve muy
          antiguo, no se lee", 2026-10-05). Mismo dibujo que public/favicon.svg:
          una sola identidad en pestaña, cabecera y app. */}
      <div
        className={cn("relative rounded-[30%] flex items-center justify-center shrink-0 bg-primary", s.wrap)}
      >
        <svg viewBox="0 0 24 24" fill="none" className={cn("text-primary-foreground", s.icon)} xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="36.3 50.3" transform="rotate(50 12 12)" />
          <circle cx="20" cy="12" r="2.6" fill={BRAND_PURPLE} />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="hidden sm:flex flex-col leading-none">
          {/* logo-wordmark: selector estable para overrides externos (ver
              Assistant.css) — no depender de que esta combinación exacta de
              clases utilitarias se mantenga si este componente cambia. */}
          {/* Caja alta y bold —no MAYÚSCULAS black apretadas a 12px, que a ese
              tamaño se emborronaban— y el "IA" vuelve a ser morado (más oscuro en
              claro para que también pase contraste). */}
          <span className={cn("logo-wordmark font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-display", s.text)}>
            Creator{" "}
            <span className="text-purple-700 dark:text-purple-400">IA</span>
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
