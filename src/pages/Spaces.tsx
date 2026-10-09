import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Image as ImageIcon, Plus, LayoutTemplate, Code2, Sparkles } from "lucide-react";
import { ProjectsView } from "@/components/spaces/ProjectsView";
import { LibraryView } from "@/components/spaces/LibraryView";
import { HubView } from "@/components/spaces/HubView";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { CANVAS_ENABLED } from "@/lib/features";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const Spaces = () => {
  const { user, loading: authLoading } = useAuth("/auth");
  const { isAdmin } = useAdmin(user?.id);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'library' | 'hub'>('projects');

  // Canvas IA está apagado por flag — "Flujo en Blanco" no crea nada en la
  // base (solo navega sin spaceId), pero igual es un callejón sin salida;
  // mismo toast que ya usa el sidebar de Basalt en vez de navegar en falso
  // (auditoría UX 2026-09-29).
  const goToCanvas = () => {
    if (!CANVAS_ENABLED && !isAdmin) {
      toast("Canvas IA — Próximamente", { description: "Estamos terminando esta función. Te avisaremos cuando esté lista." });
      return;
    }
    navigate("/studio-flow");
  };

  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Define tab buttons data
  const TABS = [
    { id: 'projects', label: 'Tus Proyectos', icon: FolderOpen, desc: 'Flujos y Código' },
    { id: 'library', label: 'Mi Biblioteca', icon: ImageIcon,  desc: 'Imágenes y Activos' },
    { id: 'hub', label: 'Hub Plantillas', icon: LayoutTemplate, desc: 'Explorar' },
  ] as const;

  return (
    <>
      <Helmet><title>Proyectos | Creator IA Pro</title></Helmet>

      {/* Ambient background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px] mix-blend-multiply opacity-50" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[150px] mix-blend-multiply opacity-50" />
      </div>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 py-5 md:py-10 md:pt-8 font-sans relative z-10">
        
        {/* Header Master */}
        {/* En un iPhone 13 había que deslizar una pantalla entera antes del primer
            proyecto: la etiqueta "Hub Central", el título de 36px y la descripción de dos
            líneas se comían 370px. En móvil queda el título y el botón; la descripción
            explica algo que las pestañas de abajo ya dicen. */}
        {/* El botón ocupaba una fila entera para él solo en el teléfono (medido: el
            nombre del primer proyecto quedaba a 603px de 664). Va al lado del título. */}
        <div className="mb-4 md:mb-10 flex flex-row items-center md:items-end justify-between gap-3 md:gap-6 border-b border-border/60 pb-4 md:pb-8">
          <div className="space-y-2 md:space-y-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] font-display">Hub Central</span>
            </div>
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight font-display text-foreground leading-none">
              Tus <span className="text-primary italic font-medium pr-1">Proyectos</span>
            </h1>
            <p className="hidden md:block text-[13px] text-muted-foreground font-medium max-w-sm leading-relaxed">
              El punto de encuentro para todos tus flujos creativos, repositorios de código y biblioteca de recursos.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             {/* Master Create Button */}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 md:gap-3 px-4 md:px-6 h-10 md:h-12 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-primary/10 hover:shadow-xl hover:bg-primary/90 font-display">
                  <Plus className="h-4 w-4" />
                  <span>NUEVO</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] rounded-[1.5rem] border-border shadow-2xl p-2 bg-popover/95 backdrop-blur-xl">
                <div className="p-2 pb-1">
                  <span className="text-[9px] font-black tracking-widest uppercase text-muted-foreground font-display">Crear Recurso</span>
                </div>
                <DropdownMenuItem className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-muted focus:bg-primary/10 focus:text-primary transition-all font-display text-muted-foreground mb-0.5"
                  onClick={() => setActiveTab('hub')}>
                  <Sparkles className="h-4 w-4 mr-3 opacity-60 text-primary" /> 
                  Hub de Plantillas
                </DropdownMenuItem>
                {/* Mismo criterio que el sidebar y el dashboard: mientras
                    Canvas IA no esté listo, un usuario normal solo veía un
                    ítem que abría un toast de "próximamente". Admins sí
                    lo ven para probarlo. */}
                {(CANVAS_ENABLED || isAdmin) && (
                  <>
                    <DropdownMenuItem className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-muted focus:bg-primary/10 focus:text-primary transition-all font-display text-muted-foreground mb-0.5"
                      onClick={goToCanvas}>
                      <LayoutTemplate className="h-4 w-4 mr-3 opacity-60" /> 
                      Flujo en Blanco
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-muted my-1 mx-2" />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/code')} className="rounded-xl p-3 text-[12px] font-bold cursor-pointer hover:bg-muted focus:bg-emerald-500/10 focus:text-emerald-600 transition-all font-display text-muted-foreground">
                  <Code2 className="h-4 w-4 mr-3 opacity-60" />
                  Desarrollo de Código
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        {/* Tres pestañas con etiquetas largas no caben en 390px: la tercera ("Hub
            Plantillas") quedaba cortada contra el borde, con solo su icono visible. En
            móvil se reparten el ancho por igual y el texto se centra debajo del límite. */}
        <div className="grid grid-cols-3 md:flex items-center gap-1 md:gap-2 mb-6 md:mb-8 bg-muted/50 p-1.5 rounded-2xl border border-border/50 w-full md:w-max backdrop-blur-sm shadow-inner">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex min-w-0 flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-6 py-2.5 md:py-3.5 rounded-[12px] transition-all duration-300 font-display group
                  ${isActive ? 'bg-card shadow-sm border border-border/40 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent'}
                `}
              >
                <tab.icon className={`h-4 w-4 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                <div className="min-w-0 text-center md:text-left leading-none">
                  <div className={`text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest ${isActive ? 'text-foreground' : ''}`}>
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
            <ProjectsView onOpenCreate={() => setActiveTab('hub')} />
          ) : activeTab === 'library' ? (
            <LibraryView />
          ) : (
            <HubView />
          )}
        </div>

      </div>
    </>
  );
};

export default Spaces;
