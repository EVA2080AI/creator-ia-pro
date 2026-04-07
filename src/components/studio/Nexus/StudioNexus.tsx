import { motion } from "framer-motion";
import { 
  Link2, 
  Plus, 
  Globe, 
  Code2, 
  LayoutGrid, 
  Zap, 
  Activity,
  ArrowUpRight,
  Settings2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type StudioProject } from "@/hooks/useStudioProjects";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

interface StudioNexusProps {
  currentProject: StudioProject;
  allProjects: StudioProject[];
}

export function StudioNexus({ currentProject, allProjects }: StudioNexusProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  // Filter out current project
  const linkableProjects = allProjects.filter(p => p.id !== currentProject.id);

  const handleLink = (id: string, name: string) => {
    if (connectedIds.includes(id)) {
      setConnectedIds(prev => prev.filter(x => x !== id));
      toast.success(`Conexión con "${name}" eliminada`);
    } else {
      setConnectedIds(prev => [...prev, id]);
      toast.success(`Proyecto "${name}" conectado con éxito`);
    }
    setIsLinking(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/5 text-zinc-900 p-8">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Genesis Nexus</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Arquitectura Conectada</h1>
          <p className="text-sm text-zinc-500 font-medium max-w-lg">
            Gestiona la interconectividad de tus proyectos. Conecta múltiples arquitecturas para crear ecosistemas digitales escalables.
          </p>
        </div>
        
        <button 
          onClick={() => setIsLinking(true)}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-zinc-200"
        >
          <Plus className="w-4 h-4" /> Conectar Proyecto
        </button>
      </div>

      {/* Connection Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Project Card (Static) */}
        <div className="p-8 rounded-[2.5rem] bg-white border border-primary/20 shadow-2xl shadow-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/10">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-1">{currentProject.name}</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none mb-6">Nodo Principal</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Latencia: 12ms
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Globe className="w-3.5 h-3.5 text-blue-500" /> Region: US-EAST
              </div>
            </div>
          </div>
        </div>

        {/* Connected Projects */}
        {connectedIds.map(id => {
          const proj = allProjects.find(p => p.id === id);
          if (!proj) return null;
          return (
            <motion.div 
              key={id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-200 shadow-sm relative group hover:border-zinc-300 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center mb-6">
                <LayoutGrid className="w-6 h-6 text-zinc-500" />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-1">{proj.name}</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none mb-6">Proyecto Vinculado</p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleLink(id, proj.name)}
                  className="flex-1 py-3 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button className="flex-[2] py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all">
                  Configurar <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Placeholder for Empty State if no connections */}
        {connectedIds.length === 0 && (
          <div 
            onClick={() => setIsLinking(true)}
            className="p-8 rounded-[2.5rem] border border-dashed border-zinc-200 bg-white/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-white transition-all group"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-zinc-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Link2 className="w-5 h-5 text-zinc-300 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Añadir Conexión</p>
          </div>
        )}
      </div>

      {/* Linking Dialog */}
      <Dialog open={isLinking} onOpenChange={setIsLinking}>
        <DialogContent className="max-w-md p-8 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase">Vincular Proyecto</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
              Selecciona un componente de tu arquitectura para establecer una conexión de datos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-6 max-h-[300px] overflow-y-auto px-1">
            {linkableProjects.length === 0 ? (
              <p className="text-center py-8 text-sm text-zinc-400">No hay otros proyectos creados aún.</p>
            ) : (
              linkableProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleLink(p.id, p.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                    connectedIds.includes(p.id) 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
                      <LayoutGrid className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-zinc-900 leading-none mb-1">{p.name}</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                        {connectedIds.includes(p.id) ? 'Conectado' : 'Disponible'}
                      </p>
                    </div>
                  </div>
                  {connectedIds.includes(p.id) ? (
                    <Zap className="w-4 h-4 text-primary" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-zinc-300" />
                  )}
                </button>
              ))
            )}
          </div>

          <DialogFooter className="mt-8">
             <button 
              onClick={() => setIsLinking(false)}
              className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
               Confirmar Selección
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
