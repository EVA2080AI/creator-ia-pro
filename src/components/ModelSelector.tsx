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
  // ─── TEXTO / CHAT (via OpenRouter) ──────────────────────────────────────────
  { id: "deepseek-chat",       name: "DeepSeek V3",              provider: "DeepSeek",    tokenCost: 1,  badge: "Best Value 🔥", description: "deepseek-chat-v3-0324 · Rendimiento top-tier por menos.",        type: "text" },
  { id: "gemini-3-flash",      name: "Gemini 2.0 Flash",         provider: "Google",      tokenCost: 1,  description: "gemini-2.0-flash-001 · Ultra rápido para tareas cotidianas.",         type: "text" },
  { id: "gemini-3.1-pro-low",  name: "Gemini 2.5 Pro",           provider: "Google",      tokenCost: 1,  badge: "New",          description: "gemini-2.5-pro-preview · Equilibrio coste-inteligencia.",         type: "text" },
  { id: "gemini-3.1-pro-high", name: "Gemini 2.5 Pro (Max)",     provider: "Google",      tokenCost: 3,  badge: "New",          description: "gemini-2.5-pro-preview · Razonamiento complejo avanzado.",        type: "text" },
  { id: "claude-3.5-sonnet",   name: "Claude Sonnet 4.5",        provider: "Anthropic",   tokenCost: 4,  badge: "Thinking ⚡",  description: "claude-sonnet-4-5 · Lógica avanzada y programación.",             type: "text" },
  { id: "claude-3-opus",       name: "Claude Opus 4.5",          provider: "Anthropic",   tokenCost: 5,  badge: "Best 🧠",      description: "claude-opus-4-5 · El más potente de Anthropic vía OR.",          type: "text" },
  { id: "gpt-oss-120b",        name: "Llama 4 Maverick",         provider: "OpenSource",  tokenCost: 2,  badge: "Open 🦙",     description: "llama-4-maverick · Open Source de alto rendimiento.",             type: "text" },
  // ─── IMAGEN (via Pollinations.ai) ───────────────────────────────────────────
  { id: "nano-banana-2",       name: "Image Flash (Alta Cal.)",  provider: "NanoBanana",  tokenCost: 2,  badge: "Imagen ✨",    description: "Pollinations · 1024x1024, semilla aleatoria, calidad alta.",       type: "image" },
  { id: "nano-banana-pro",     name: "Image Pro (Estudio)",      provider: "NanoBanana",  tokenCost: 4,  badge: "Imagen 🎨",    description: "Pollinations + enhance · Máxima calidad, estudio profesional.",    type: "image" },
  { id: "nano-banana-25",      name: "Image Rápida (Eco)",       provider: "NanoBanana",  tokenCost: 1,  badge: "Free Tier 🍌", description: "Pollinations · Generación rápida y económica.",                    type: "image" },
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
