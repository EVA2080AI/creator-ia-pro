import { useState } from "react";
import {
  Plus,
  Play,
  Scissors,
  Pen,
  MessageSquare,
  Undo2,
  Redo2,
  Settings,
  Image,
  Video,
  Coins,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface CanvasToolbarProps {
  creditsBalance: number;
  onGenerate: (type: "image" | "video", prompt: string) => void;
  onSignOut: () => void;
  generating: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${className ?? ""}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

export function CanvasToolbar({
  creditsBalance,
  onGenerate,
  onSignOut,
  generating,
}: CanvasToolbarProps) {
  const [prompt, setPrompt] = useState("");
  const [genType, setGenType] = useState<"image" | "video">("image");

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Escribe un prompt primero");
      return;
    }
    const cost = genType === "image" ? 1 : 20;
    if (creditsBalance < cost) {
      toast.error(`Necesitas ${cost} créditos. Tienes ${creditsBalance}.`);
      return;
    }
    onGenerate(genType, prompt.trim());
    setPrompt("");
  };

  return (
    <div className="absolute left-5 top-1/2 z-50 -translate-y-1/2 animate-fade-in">
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/95 px-1.5 py-2 backdrop-blur-xl node-shadow">
        {/* Add node */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              title="Nuevo nodo"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Plus className="h-[18px] w-[18px]" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-80 bg-card border-border p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Plus className="h-4 w-4 text-primary" />
                Nuevo nodo de IA
              </div>

              {/* Type toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setGenType("image")}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    genType === "image"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Image className="h-3.5 w-3.5" />
                  Imagen (1 cr)
                </button>
                <button
                  onClick={() => setGenType("video")}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-l border-border ${
                    genType === "video"
                      ? "bg-accent/15 text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  Video (20 cr)
                </button>
              </div>

              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Describe lo que quieres generar..."
                className="bg-muted border-none text-sm"
                disabled={generating}
              />

              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full gap-2"
              >
                {generating ? (
                  <div className="h-4 w-4 animate-spin-slow rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Generar
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Run (disabled placeholder) */}
        <ToolbarButton icon={Play} label="Ejecutar" active />

        {/* Divider */}
        <div className="my-1 h-px w-6 bg-border" />

        <ToolbarButton icon={Scissors} label="Cortar" />
        <ToolbarButton icon={Pen} label="Editar" />
        <ToolbarButton icon={MessageSquare} label="Comentarios" />

        {/* Divider */}
        <div className="my-1 h-px w-6 bg-border" />

        <ToolbarButton icon={Undo2} label="Deshacer" />
        <ToolbarButton icon={Redo2} label="Rehacer" />

        {/* Divider */}
        <div className="my-1 h-px w-6 bg-border" />

        <ToolbarButton icon={Settings} label="Ajustes" />
      </div>

      {/* Credits — below toolbar */}
      <div className="mt-3 flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card/95 px-1.5 py-2 backdrop-blur-xl node-shadow">
        <div className="flex items-center gap-1 px-1">
          <Coins className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-semibold text-foreground font-mono">
            {creditsBalance}
          </span>
        </div>
      </div>
    </div>
  );
}
