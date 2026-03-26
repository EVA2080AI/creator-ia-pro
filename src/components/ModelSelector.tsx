import { Check, ChevronsUpDown, Sparkles, BrainCircuit, Zap, Image as ImageIcon, Flame, Cpu } from "lucide-react";
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
  { id: "deepseek-chat",       name: "DeepSeek V3",              provider: "DeepSeek",    tokenCost: 1,  badge: "Best Value 🔥", description: "DeepSeek-V3 · Peak performance ratio.",        type: "text" },
  { id: "gemini-3-flash",      name: "Gemini 2.0 Flash",         provider: "Google",      tokenCost: 1,  description: "Gemini-2.0-Flash · Sub-second latency processing.",         type: "text" },
  { id: "gemini-3.1-pro-low",  name: "Gemini 2.5 Pro",           provider: "Google",      tokenCost: 1,  badge: "New",          description: "Gemini-2.5-Pro · Balanced intelligence nexus.",         type: "text" },
  { id: "gemini-3.1-pro-high", name: "Gemini 2.5 Pro (Max)",     provider: "Google",      tokenCost: 3,  badge: "High-IQ",      description: "Gemini-2.5-Pro · Deep reasoning & complex logic.",        type: "text" },
  { id: "claude-3.5-sonnet",   name: "Claude Sonnet 4.5",        provider: "Anthropic",   tokenCost: 4,  badge: "Thinking ⚡",  description: "Claude-Sonnet-4.5 · Advanced coding & logic.",             type: "text" },
  { id: "claude-3-opus",       name: "Claude Opus 4.5",          provider: "Anthropic",   tokenCost: 5,  badge: "Genius 🧠",    description: "Claude-Opus-4.5 · The pinnacle of Anthropic reasoning.",          type: "text" },
  { id: "gpt-oss-120b",        name: "Llama 4 Maverick",         provider: "OpenSource",  tokenCost: 2,  badge: "Open 🦙",     description: "Llama-4-Maverick · High-performance open-source core.",             type: "text" },
  // ─── IMAGEN (via Pollinations.ai) ───────────────────────────────────────────
  { id: "nano-banana-2",       name: "Image Flash (HD)",         provider: "NanoBanana",  tokenCost: 2,  badge: "Visual ✨",    description: "Pollinations · 1024x1024 high-fidelity generation.",       type: "image" },
  { id: "nano-banana-pro",     name: "Image Pro (Studio)",      provider: "NanoBanana",  tokenCost: 4,  badge: "Studio 🎨",    description: "Pollinations + Enhance · Studio-grade visual manifestation.",    type: "image" },
  { id: "nano-banana-25",      name: "Image Rapid (Eco)",       provider: "NanoBanana",  tokenCost: 1,  badge: "Eco 🍌",       description: "Pollinations · Fast, low-latency visual sketching.",                    type: "image" },
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
          className="w-full justify-between aether-card border-white/5 hover:border-white/10 h-16 rounded-2xl px-5 transition-all duration-300 shadow-inner group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-aether-purple/10 group-hover:border-aether-purple/20 transition-all">
              <Sparkles className="h-4 w-4 text-aether-purple" />
            </div>
            <div className="flex flex-col items-start truncate text-left">
              <span className="text-[13px] font-bold text-white font-display tracking-tight uppercase">{selectedModel.name}</span>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">
                 Manifestation Charge: {selectedModel.tokenCost} units
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white/10 group-hover:text-white/40 transition-colors" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 border-white/10 bg-[#0a0a0b]/90 backdrop-blur-3xl rounded-[2rem] shadow-5xl overflow-hidden mt-3 z-[110]">
        <Command className="bg-transparent border-none">
          <div className="flex items-center border-b border-white/5 px-6">
             <CommandInput placeholder="Search neural models..." className="h-14 font-display text-sm border-none bg-transparent focus:ring-0" />
          </div>
          <CommandList className="max-h-[400px] custom-scrollbar p-3">
            <CommandEmpty className="py-10 text-center text-xs text-white/20 font-bold uppercase tracking-widest font-display">No neural matches found.</CommandEmpty>
            
            <CommandGroup heading={<span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] px-3 mb-2 flex items-center gap-2"><ImageIcon className="w-3 h-3"/> visual manifestation</span>}>
              {AVAILABLE_MODELS.filter(m => m.provider === "NanoBanana").map((model) => (
                <ModelItem key={model.id} model={model} selectedId={selectedModelId} onSelect={(id) => { onModelChange(id); setOpen(false); }} />
              ))}
            </CommandGroup>
            
            <CommandGroup heading={<span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] px-3 mt-4 mb-2 flex items-center gap-2"><Cpu className="w-3 h-3"/> industrial intelligence</span>}>
              {AVAILABLE_MODELS.filter(m => m.provider !== "NanoBanana").map((model) => (
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
  const isSelected = selectedId === model.id;
  
  return (
    <CommandItem
      key={model.id}
      value={model.id}
      onSelect={() => onSelect(model.id)}
      className={cn(
        "flex justify-between items-center px-4 py-4 cursor-pointer rounded-2xl mb-1.5 transition-all duration-300",
        isSelected ? "bg-white/5 border-white/10" : "hover:bg-white/[0.03] border-transparent"
      )}
    >
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className={cn(
             "w-2 h-2 rounded-full transition-all duration-500",
             isSelected ? "bg-aether-purple shadow-[0_0_10px_rgba(168,85,247,0.8)]" : "bg-white/5"
          )} />
          <span className={cn("text-xs font-bold font-display tracking-tight uppercase", isSelected ? "text-white" : "text-white/40")}>
            {model.name}
          </span>
          {model.badge && (
             <Badge className="text-[8px] h-4 px-2 py-0 bg-white/5 text-white/30 border-none font-bold uppercase tracking-widest">{model.badge}</Badge>
          )}
        </div>
        <p className="text-[10px] text-white/10 font-medium ml-5 truncate max-w-[220px] italic">{model.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
           <Zap className="h-2.5 w-2.5 text-aether-purple" />
           <span className="text-[10px] font-bold text-white/40 tabular-nums">{model.tokenCost} units</span>
        </div>
      </div>
    </CommandItem>
  );
}
