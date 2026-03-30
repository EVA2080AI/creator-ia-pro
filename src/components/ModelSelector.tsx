import { Check, ChevronsUpDown, Sparkles, Zap, Image as ImageIcon, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface AIModel {
  id: string;
  name: string;
  provider: "Google" | "Anthropic" | "DeepSeek" | "OpenSource" | "OpenRouter";
  tokenCost: number;
  badge?: string;
  description: string;
  type?: "text" | "image";
}

export const AVAILABLE_MODELS: AIModel[] = [
  // ─── TEXTO — vía OpenRouter ───────────────────────────────────────────────────
  { id: "deepseek-chat",       name: "DeepSeek V3",          provider: "DeepSeek",    tokenCost: 1,  badge: "Mejor valor",   description: "Rendimiento excepcional al menor costo.",          type: "text" },
  { id: "gemini-3-flash",      name: "Gemini 2.0 Flash",     provider: "Google",      tokenCost: 1,  description: "Respuestas ultrarrápidas de Google.",                    type: "text" },
  { id: "gemini-3.1-pro-low",  name: "Gemini 2.5 Pro",       provider: "Google",      tokenCost: 1,  badge: "Nuevo",         description: "Inteligencia avanzada de Google.",                 type: "text" },
  { id: "gemini-3.1-pro-high", name: "Gemini 2.5 Pro Max",   provider: "Google",      tokenCost: 3,  badge: "Alta IQ",       description: "Razonamiento profundo y lógica compleja.",         type: "text" },
  { id: "claude-3.5-sonnet",   name: "Claude Sonnet 4.6",    provider: "Anthropic",   tokenCost: 4,  badge: "Thinking",      description: "Código avanzado y análisis de Anthropic.",         type: "text" },
  { id: "claude-3-opus",       name: "Claude Opus 4.6",      provider: "Anthropic",   tokenCost: 5,  badge: "Genius",        description: "El modelo más capaz de Anthropic.",                type: "text" },
  { id: "gpt-oss-120b",        name: "Llama 4 Maverick",     provider: "OpenSource",  tokenCost: 2,  badge: "Open Source",   description: "Modelo open source de alto rendimiento.",          type: "text" },
  // ─── IMAGEN — FLUX y SDXL vía OpenRouter ─────────────────────────────────────
  { id: "flux-schnell",        name: "FLUX Schnell",         provider: "OpenRouter",  tokenCost: 2,  badge: "Recomendado",   description: "FLUX.1 Schnell — rápido, 4 pasos, 1024×1024.",    type: "image" },
  { id: "flux-pro",            name: "FLUX Pro",             provider: "OpenRouter",  tokenCost: 4,  badge: "Alta calidad",  description: "FLUX.1 Pro — máxima fidelidad y detalle.",         type: "image" },
  { id: "flux-pro-1.1",        name: "FLUX Pro 1.1",         provider: "OpenRouter",  tokenCost: 4,  badge: "Más nuevo",     description: "FLUX.1.1 Pro — última versión, superior calidad.", type: "image" },
  { id: "sdxl",                name: "SDXL",                 provider: "OpenRouter",  tokenCost: 2,  badge: "Alternativo",   description: "Stable Diffusion XL — versátil y creativo.",       type: "image" },
];

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  filterType?: "text" | "image";
}

export function ModelSelector({ selectedModelId, onModelChange, filterType }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const visibleModels = filterType
    ? AVAILABLE_MODELS.filter((m) => m.type === filterType)
    : AVAILABLE_MODELS;

  const selectedModel =
    visibleModels.find((m) => m.id === selectedModelId) ||
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ||
    visibleModels[0];

  const imageModels = visibleModels.filter((m) => m.type === "image");
  const textModels  = visibleModels.filter((m) => m.type !== "image");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors border-white/5 hover:border-white/10 h-14 rounded-xl px-4 transition-all duration-300 shadow-inner group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[13px] font-semibold text-white truncate">{selectedModel.name}</span>
              <span className="text-[10px] text-white/25 mt-0.5">
                {selectedModel.tokenCost} crédito{selectedModel.tokenCost > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/50 transition-colors" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[420px] p-0 border-white/10 bg-[#0d0d0f]/95 backdrop-blur-3xl rounded-2xl shadow-2xl overflow-hidden z-[9999]"
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions
        collisionPadding={16}
      >
        <Command className="bg-transparent border-none">
          <div className="flex items-center border-b border-white/[0.06] px-4">
            <CommandInput
              placeholder="Buscar modelo..."
              className="h-11 text-sm border-none bg-transparent focus:ring-0 placeholder:text-white/20"
            />
          </div>

          <CommandList className="max-h-[320px] overflow-y-auto p-2">
            <CommandEmpty className="py-8 text-center text-xs text-white/20 font-medium">
              Sin resultados.
            </CommandEmpty>

            {imageModels.length > 0 && (
              <CommandGroup
                heading={
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] px-2 py-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> Imagen
                  </span>
                }
              >
                {imageModels.map((model) => (
                  <ModelItem
                    key={model.id}
                    model={model}
                    selectedId={selectedModelId}
                    onSelect={(id) => { onModelChange(id); setOpen(false); }}
                  />
                ))}
              </CommandGroup>
            )}

            {textModels.length > 0 && (
              <CommandGroup
                heading={
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] px-2 py-1 flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" /> Texto
                  </span>
                }
              >
                {textModels.map((model) => (
                  <ModelItem
                    key={model.id}
                    model={model}
                    selectedId={selectedModelId}
                    onSelect={(id) => { onModelChange(id); setOpen(false); }}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ModelItem({
  model,
  selectedId,
  onSelect,
}: {
  model: AIModel;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const isSelected = selectedId === model.id;

  return (
    <CommandItem
      value={model.id}
      onSelect={() => onSelect(model.id)}
      className={cn(
        "flex items-center justify-between px-3 py-3 cursor-pointer rounded-xl mb-0.5 transition-all duration-200",
        isSelected
          ? "bg-white/[0.07] border border-white/[0.08]"
          : "hover:bg-white/[0.04] border border-transparent"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Active dot */}
        <div className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
          isSelected ? "bg-primary shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "bg-white/10"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[13px] font-semibold truncate", isSelected ? "text-white" : "text-white/50")}>
              {model.name}
            </span>
            {model.badge && (
              <Badge className="text-[9px] h-4 px-2 py-0 bg-white/5 text-white/30 border-none font-semibold">
                {model.badge}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-white/20 mt-0.5 truncate">{model.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <div className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-lg">
          <Zap className="h-2.5 w-2.5 text-primary" />
          <span className="text-[10px] font-bold text-white/30 tabular-nums">{model.tokenCost}</span>
        </div>
        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
    </CommandItem>
  );
}
