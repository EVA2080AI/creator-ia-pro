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
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface TemplateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (templateId: string) => void;
}

const TEMPLATES = [
  {
    id: "meta_ads",
    title: "Meta Ads Mastery",
    description: "Orchestrate high-conversion visuals for Facebook & Instagram.",
    icon: Megaphone,
    color: "text-aether-purple",
    nodes: ["campaignManager", "modelView", "characterBreakdown"]
  },
  {
    id: "landing_page",
    title: "Quantum Landing",
    description: "Manifest a full web structure with semantic copy and hero assets.",
    icon: Layout,
    color: "text-aether-blue",
    nodes: ["layoutBuilder", "modelView", "characterBreakdown"]
  },
  {
    id: "social_media",
    title: "Viral Orchestration",
    description: "Multichannel distribution fleet with neural visual hooks.",
    icon: Share2,
    color: "text-rose-400",
    nodes: ["characterBreakdown", "videoModel", "campaignManager"]
  }
];

export function TemplateModal({ isOpen, onOpenChange, onApplyTemplate }: TemplateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0b]/95 border border-white/10 rounded-[3rem] text-white max-w-2xl p-12 backdrop-blur-3xl shadow-5xl overflow-hidden">
        <DialogHeader className="mb-12">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 text-white/40" />
             </div>
             <div>
                <DialogTitle className="text-3xl font-bold tracking-tight font-display">Neural Templates</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1 font-display">Aether V8.0 Industrial Orchestration</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onApplyTemplate(template.id);
                onOpenChange(false);
                toast.success(`Manifesting ${template.title}...`);
              }}
              className="group flex items-start gap-8 p-8 aether-card rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all duration-500 text-left active:scale-[0.98]"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 ${template.color}`}>
                <template.icon className="w-7 h-7" />
              </div>
              <div className="flex-1 mt-1">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-xl font-bold text-white tracking-tight font-display">{template.title}</h3>
                   <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white transition-all transform translate-x-0 group-hover:translate-x-2" />
                </div>
                <p className="text-[13px] text-white/30 font-medium leading-relaxed mb-6">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {template.nodes.map(node => (
                    <span key={node} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-white/20 uppercase tracking-widest font-display">
                      {node}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold text-white/5 uppercase tracking-[0.4em] font-display">system_v8.0_industrial_audit_ready</p>
        </div>
        
        {/* Decorative noise */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </DialogContent>
    </Dialog>
  );
}
