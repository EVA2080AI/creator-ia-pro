import { motion } from "framer-motion";
import {
  Book, Code2, Cpu, Globe, Rocket,
  Shield, Zap, ChevronRight, Search,
  Terminal, Layers, Sparkles, Box
} from "lucide-react";
import { LandingHeader } from "../components/layout/LandingHeader";
import { Footer } from "../components/Footer";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";

const DOCS_SECTIONS = [
  {
    title: "Empezando",
    icon: Rocket,
    items: [
      { id: "intro", label: "Introducción a Genesis", desc: "Arquitectura del Agente Autónomo v21.0" },
      { id: "setup", label: "Configuración Rápida", desc: "Tus primeros pasos en el IDE" },
      { id: "auth", label: "Identidad & Seguridad", desc: "Protocolos de acceso y roles" }
    ]
  },
  {
    title: "Engineering Studio",
    icon: Code2,
    items: [
      { id: "flow", label: "Studio Flow", desc: "Gestión de nodos y orquestación" },
      { id: "codegen", label: "Generación de Código", desc: "Personalización de prompts industriales" },
      { id: "artifacts", label: "Panel de Artefactos", desc: "Visualización de planos y diagramas" }
    ]
  },
  {
    title: "Antigravity AI",
    icon: Cpu,
    items: [
      { id: "brain", label: "Neural Engine", desc: "Razonamiento y lógica de Swarm Autonomy" },
      { id: "agents", label: "Especialistas", desc: "Configuración de agentes (UX, Dev, Ops)" },
      { id: "memory", label: "Memoria Persistente", desc: "Contexto compartido entre sesiones" }
    ]
  }
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-white selection:bg-primary/10">
      <SEO
        title="Documentación — Genesis IDE"
        description="Guías técnicas, protocolos y estándares arquitectónicos de Creator IA Pro. Aprende a diseñar, construir y desplegar con la potencia de Genesis."
        keywords="documentación, Genesis IDE, API, guía, tutorial, React, Colombia"
        canonical="https://creator-ia.com/documentation"
      />
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden border-b border-black/[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary-rgb),0.05),transparent)] pointer-events-none" />
        <div className="container px-6 mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Documentación Oficial</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">v21.0 Ultra Sovereign</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tighter mb-8 italic uppercase">
              Dominando el Futuro de la <span className="text-primary">Ingeniería Autónoma</span>.
            </h1>
            <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-10 max-w-2xl">
              Explora las guías técnicas, protocolos y estándares arquitectónicos de Creator IA Pro. Diseña, construye y despliega con la potencia de Genesis.
            </p>
            
            <div className="relative max-w-xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar guías, comandos o protocolos..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <kbd className="px-2 py-1 rounded bg-white border border-zinc-200 text-[10px] font-black text-zinc-400 shadow-sm">⌘</kbd>
                <kbd className="px-2 py-1 rounded bg-white border border-zinc-200 text-[10px] font-black text-zinc-400 shadow-sm">K</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid Content */}
      <section className="py-24 container px-6 mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {DOCS_SECTIONS.map((section, idx) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-8"
            >
              {(() => {
                const Icon = section.icon;
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-xl shadow-zinc-950/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter italic">{section.title}</h2>
                  </div>
                );
              })()}
              
              <div className="space-y-4">
                {section.items.map((item) => (
                  <button 
                    key={item.id}
                    className="w-full text-left group p-5 rounded-2xl border border-zinc-100 hover:border-primary/20 hover:bg-zinc-50 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-black text-zinc-900 uppercase tracking-tighter group-hover:text-primary transition-colors">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Breakdown Banner */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="container px-6 mx-auto relative z-10 text-center">
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             className="max-w-2xl mx-auto"
          >
            <Box className="h-12 w-12 text-primary mx-auto mb-8 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-6">
              Protocolo DeepBuild v16.0
            </h2>
            <p className="text-zinc-400 font-medium mb-10 leading-relaxed text-sm md:text-base">
              Genesis no es solo IA, es ingeniería pura. Nuestro protocolo de síntesis permite que las aplicaciones se construyan, prueben y desplieguen de forma autónoma siguiendo estándares Clean Architecture.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
               {["React 18", "Next.js 14", "Supabase v3", "Tailwind v4", "Docker"].map(tech => (
                 <span key={tech} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black text-zinc-500 uppercase tracking-widest">{tech}</span>
               ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
