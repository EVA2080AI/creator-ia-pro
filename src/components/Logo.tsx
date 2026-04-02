import { Sparkles } from "lucide-react";
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
  sm: { wrap: "w-7 h-7",   icon: "w-3.5 h-3.5", text: "text-[12px]", subtext: "text-[9px]"  },
  md: { wrap: "w-9 h-9",   icon: "w-4.5 h-4.5", text: "text-[14px]", subtext: "text-[10px]" },
  lg: { wrap: "w-12 h-12", icon: "w-6 h-6",     text: "text-[18px]", subtext: "text-[12px]" },
};

export function Logo({ size = "sm", showText = true, showPro = false, className, onClick }: LogoProps) {
  const s = sizeMap[size];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn("flex items-center gap-2.5 shrink-0", onClick && "group cursor-pointer", className)}
    >
      {/* Icon badge */}
      <div
        className={cn("relative rounded-lg flex items-center justify-center shrink-0 bg-primary", s.wrap)}
      >
        <Sparkles className={cn("text-white", s.icon)} />
      </div>

      {/* Text */}
      {showText && (
        <div className="hidden sm:flex flex-col leading-none">
          <span className={cn("font-black text-zinc-900 tracking-tight font-display uppercase", s.text)}>
            Creator{" "}
            <span className="text-primary">IA</span>
            {showPro && (
              <span className="ml-1 text-zinc-400 font-semibold normal-case tracking-normal" style={{ fontSize: "0.7em" }}>
                Pro
              </span>
            )}
          </span>
        </div>
      )}
    </Tag>
  );
}
