import { Check, ChevronsUpDown, Sparkles } from "lucide-react";
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
  provider: "Google" | "Anthropic" | "DeepSeek" | "OpenSource" | "OpenAI" | "NanoBanana";
  tokenCost: number;
  badge?: string;
  description: string;
  type?: "text" | "image";
}

export const AVAILABLE_MODELS: AIModel[] = [
  // ─── TEXTO / CHAT ───────────────────────────────────────────────
  { id: "deepseek-chat",       name: "DeepSeek V3",              provider: "DeepSeek",    tokenCost: 1,  badge: "Best Value 🔥", description: "Rendimiento top-tier a una fracción del costo.",         type: "text" },
  { id: "gemini-3-flash",      name: "Gemini 3 Flash",           provider: "Google",      tokenCost: 1,  description: "Respuestas ultra rápidas para tareas sencillas.",            type: "text" },
  { id: "gemini-3.1-pro-low",  name: "Gemini 3.1 Pro (Low)",     provider: "Google",      tokenCost: 1,  badge: "New",          description: "Equilibrio entre coste y velocidad.",                   type: "text" },
  { id: "gemini-3.1-pro-high", name: "Gemini 3.1 Pro (High)",    provider: "Google",      tokenCost: 3,  badge: "New",          description: "Máxima inteligencia y razonamiento complejo.",          type: "text" },
  { id: "claude-3.5-sonnet",   name: "Claude Sonnet 3.5",        provider: "Anthropic",   tokenCost: 4,  badge: "Thinking ⚡",  description: "Lógica avanzada y programación.",                       type: "text" },
  { id: "claude-3-opus",       name: "Claude Opus 3",            provider: "Anthropic",   tokenCost: 5,  badge: "Best 🧠",      description: "El modelo más potente de Anthropic.",                   type: "text" },
  { id: "gpt-oss-120b",        name: "GPT-OSS 120B (Medium)",    provider: "OpenSource",  tokenCost: 2,  badge: "⚠️",          description: "Alternativa Open Source de alto rendimiento.",          type: "text" },
  // ─── IMAGEN / NANO BANANA ───────────────────────────────────────
  { id: "nano-banana-2",       name: "Nano Banana 2 (Flash)",    provider: "NanoBanana",  tokenCost: 2,  badge: "Imagen ✨",    description: "Nano Banana 2: Gemini 3.1 Flash Image. 4K, ultra rápido.", type: "image" },
  { id: "nano-banana-pro",     name: "Nano Banana Pro",          provider: "NanoBanana",  tokenCost: 4,  badge: "Imagen 🎨",    description: "Nano Banana Pro: Gemini 3 Pro Image. Calidad estudio 4K.",  type: "image" },
  { id: "nano-banana-25",      name: "Nano Banana (2.5 Flash)",  provider: "NanoBanana",  tokenCost: 1,  badge: "Free Tier 🍌", description: "Nano Banana: Gemini 2.5 Flash Image. Rápido y económico.",   type: "image" },
];

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModelId, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card border-border hover:bg-muted/50 h-14"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="flex flex-col items-start truncate text-left">
              <span className="font-semibold text-foreground">{selectedModel.name}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Costo: {selectedModel.tokenCost} Créditos / gen</span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 border-border bg-card/95 backdrop-blur-md">
        <Command>
          <CommandInput placeholder="Buscar modelo..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontró ningún modelo.</CommandEmpty>
            <CommandGroup heading="🍌 Nano Banana (Imagen IA)">
              {AVAILABLE_MODELS.filter(m => m.provider === "NanoBanana").map((model) => (
                <ModelItem key={model.id} model={model} selectedId={selectedModelId} onSelect={(id) => { onModelChange(id); setOpen(false); }} />
              ))}
            </CommandGroup>
            <CommandGroup heading="🔵 DeepSeek & Open Source">
              {AVAILABLE_MODELS.filter(m => m.provider === "DeepSeek" || m.provider === "OpenSource").map((model) => (
                <ModelItem key={model.id} model={model} selectedId={selectedModelId} onSelect={(id) => { onModelChange(id); setOpen(false); }} />
              ))}
            </CommandGroup>
            <CommandGroup heading="🟢 Google Gemini (Chat)">
              {AVAILABLE_MODELS.filter(m => m.provider === "Google").map((model) => (
                <ModelItem key={model.id} model={model} selectedId={selectedModelId} onSelect={(id) => { onModelChange(id); setOpen(false); }} />
              ))}
            </CommandGroup>
            <CommandGroup heading="🟣 Anthropic Claude">
              {AVAILABLE_MODELS.filter(m => m.provider === "Anthropic").map((model) => (
                <ModelItem key={model.id} model={model} selectedId={selectedModelId} onSelect={(id) => { onModelChange(id); setOpen(false); }} />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ModelItem({ model, selectedId, onSelect }: { model: AIModel, selectedId: string, onSelect: (id: string) => void }) {
  return (
    <CommandItem
      key={model.id}
      value={model.id}
      onSelect={() => onSelect(model.id)}
      className="flex justify-between items-center py-2 cursor-pointer"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Check className={cn("h-4 w-4", selectedId === model.id ? "opacity-100 text-primary" : "opacity-0")} />
          <span className="font-medium">{model.name}</span>
          {model.badge && (
             <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0">{model.badge}</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-6 mt-0.5 max-w-[200px] truncate">{model.description}</span>
      </div>
      <div className="text-xs font-mono text-gold bg-gold/10 px-2 py-1 rounded-md shrink-0">
        {model.tokenCost} <span className="hidden sm:inline">Créditos</span>
      </div>
    </CommandItem>
  );
}
