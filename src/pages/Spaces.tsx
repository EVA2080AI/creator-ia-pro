import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Image as ImageIcon, Plus, LayoutTemplate, Code2, Sparkles, Wand2 } from "lucide-react";
import { ProjectsView } from "@/components/spaces/ProjectsView";
import { LibraryView } from "@/components/spaces/LibraryView";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const Spaces = () => {
  const { loading: authLoading } = useAuth("/auth");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'library'>('projects');

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Define tab buttons data
  const TABS = [
    { id: 'projects', label: 'Tus Proyectos', icon: FolderOpen, desc: 'Flujos y Código' },
    { id: 'library', label: 'Mi Biblioteca', icon: ImageIcon,  desc: 'Imágenes y Activos' },
  ] as const;

  return (
    <>
      <Helmet><title>Proyectos | Creator IA Pro</title></Helmet>

      {/* Ambient background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px] mix-blend-multiply opacity-50" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[150px] mix-blend-multiply opacity-50" />
      </div>

      <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-10 pt-8 font-sans relative z-10">
        
        {/* Header Master */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200/60 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em] font-display">Hub Central</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display text-zinc-900 leading-none">
              Tus <span className="text-primary italic font-medium pr-1">Proyectos</span>
            </h1>
            <p className="text-[13px] text-zinc-500 font-medium max-w-sm leading-relaxed">
              El punto de encuentro para todos tus flujos creativos, repositorios de código y biblioteca de recursos.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             {/* Master Create Button */}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-6 h-12 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-zinc-900/10 hover:shadow-xl hover:bg-zinc-800 font-display">
                  <Plus className="h-4 w-4" />
                  <span>NUEVO</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] rounded-[1.5rem] border-zinc-200 shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                <div className="p-2 pb-1">
                  <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400 font-display">Crear Recurso</span>
                </div>
                <DropdownMenuItem className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-zinc-50 focus:bg-primary/10 focus:text-primary transition-all font-display text-zinc-600 mb-0.5">
                  <Wand2 className="h-4 w-4 mr-3 opacity-60" /> 
                  Flujo desde IA
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100 my-1 mx-2" />
                <DropdownMenuItem asChild className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-zinc-50 focus:bg-primary/10 focus:text-primary transition-all font-display text-zinc-600 mb-0.5">
                  <a href="https://creator-ia.com/hub" target="_blank" rel="noreferrer">
                    <Sparkles className="h-4 w-4 mr-3 opacity-60 text-primary" /> 
                    Hub de Plantillas
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-zinc-50 focus:bg-primary/10 focus:text-primary transition-all font-display text-zinc-600 mb-0.5"
                  onClick={() => navigate('/hub')}>
                  <LayoutTemplate className="h-4 w-4 mr-3 opacity-60" /> 
                  Flujo en Blanco
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100 my-1 mx-2" />
                <DropdownMenuItem onClick={() => navigate('/code')} className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-zinc-50 focus:bg-emerald-500/10 focus:text-emerald-600 transition-all font-display text-zinc-600">
                  <Code2 className="h-4 w-4 mr-3 opacity-60" />
                  Desarrollo de Código
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex items-center gap-2 mb-8 bg-zinc-50/50 p-1.5 rounded-2xl border border-zinc-200/50 w-full md:w-max backdrop-blur-sm shadow-inner">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-3 px-6 py-3.5 rounded-[12px] transition-all duration-300 font-display group
                  ${isActive ? 'bg-white shadow-sm border border-zinc-200/40 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50 border border-transparent'}
                `}
              >
                <tab.icon className={`h-4 w-4 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-primary/70'}`} />
                <div className="text-left leading-none">
                  <div className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-zinc-900' : ''}`}>
                    {tab.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'projects' ? (
            <ProjectsView onOpenCreate={() => navigate('/hub')} />
          ) : (
            <LibraryView />
          )}
        </div>

      </div>
    </>
  );
};

export default Spaces;
