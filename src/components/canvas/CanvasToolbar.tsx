import { useState } from "react";
import { Image, Video, Sparkles, Coins, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CanvasToolbarProps {
  creditsBalance: number;
  onGenerate: (type: "image" | "video", prompt: string) => void;
  onSignOut: () => void;
  generating: boolean;
}

export function CanvasToolbar({ creditsBalance, onGenerate, onSignOut, generating }: CanvasToolbarProps) {
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
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-4 py-3 backdrop-blur-xl node-shadow">
        {/* Credits badge */}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 mr-2">
          <Coins className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground font-mono">{creditsBalance}</span>
        </div>

        {/* Type toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setGenType("image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              genType === "image" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Image className="h-3.5 w-3.5" />
            1cr
          </button>
          <button
            onClick={() => setGenType("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
              genType === "video" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            20cr
          </button>
        </div>

        {/* Prompt input */}
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="Describe lo que quieres generar..."
          className="w-80 bg-muted border-none text-sm"
          disabled={generating}
        />

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          {generating ? (
            <div className="h-4 w-4 animate-spin-slow rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generar
        </Button>

        {/* Sign out */}
        <Button variant="ghost" size="icon" onClick={onSignOut} className="text-muted-foreground hover:text-foreground ml-1">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
