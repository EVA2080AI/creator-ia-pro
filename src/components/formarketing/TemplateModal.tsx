import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Layout,
  Megaphone,
  Share2,
  Sparkles,
  Instagram,
  Video,
  FileText,
  Palette,
  Globe,
  Image,
  Search,
  ArrowRight,
  Mic,
  Zap,
  Rocket,
  TrendingUp,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import { type Template, CATEGORIES, TEMPLATES } from "@/lib/templates";

interface TemplateModalProps {
  trigger?: React.ReactNode;
  onSelect: (template: Template) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TemplateModal({ trigger, onSelect, open: externalOpen, onOpenChange }: TemplateModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: Template) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-zinc-200 rounded-[2rem] text-zinc-900 max-w-3xl p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="p-8 pb-0 shrink-0">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight font-sans text-zinc-900">Plantillas</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-0.5 font-sans">
                    {TEMPLATES.length} plantillas listas para usar
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar plantillas..."
                className="pl-11 bg-zinc-50 border-zinc-200 focus:border-zinc-300 focus:bg-white rounded-2xl h-11 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 transition-all shadow-sm"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all font-sans",
                    activeCategory === cat
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-y-auto px-8 pb-8 flex-1 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
                No se encontraron plantillas
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="group flex flex-col gap-4 p-5 rounded-[1.5rem] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all duration-300 text-left active:scale-[0.97]"
                  >
                    {/* Icon + Arrow */}
                    <div className="flex items-start justify-between">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-50 border border-zinc-100 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3", template.color)}>
                        <template.icon className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1.5 flex-1">
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight font-sans leading-snug">{template.title}</h3>
                      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed line-clamp-2">{template.description}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-sans">
                        {template.category}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-bold font-sans">
                        {template.nodes.length} {template.nodes.length === 1 ? 'nodo' : 'nodos'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.4em] font-sans text-center">
              Creator IA Pro · Studio
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
