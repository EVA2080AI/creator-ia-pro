import { motion } from "framer-motion";
import { 
  Code2, 
  LayoutGrid, 
  ChevronRight, 
  Copy, 
  Trash2, 
  ExternalLink,
  History,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: any;
  onClick: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function ProjectCard({ project, onClick, onDuplicate, onDelete }: ProjectCardProps) {
  const isCode = project.type === 'code';
  const lastUpdated = new Date(project.updated_at).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col p-5 bg-white border border-zinc-200/60 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500 overflow-hidden"
    >
      {/* Visual Identity / Thumbnail Placeholder */}
      <div 
        onClick={onClick}
        className={cn(
          "h-32 mb-4 rounded-2xl relative overflow-hidden cursor-pointer flex items-center justify-center transition-all duration-700",
          isCode ? "bg-zinc-50 group-hover:bg-emerald-50/50" : "bg-zinc-50 group-hover:bg-primary/5"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_rgba(var(--primary),0.05),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {isCode ? (
          <Code2 className="w-10 h-10 text-zinc-200 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-500" />
        ) : (
          <LayoutGrid className="w-10 h-10 text-zinc-200 group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-black/[0.03] flex items-center gap-1.5 shadow-sm">
          <div className={cn("w-1 h-1 rounded-full animate-pulse", isCode ? "bg-emerald-500" : "bg-primary")} />
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900">
            {isCode ? 'Genesis App' : 'Canvas IA'}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-black text-zinc-900 truncate group-hover:text-primary transition-colors leading-tight">
            {project.name}
          </h3>
        </div>
        <p className="text-[10px] text-zinc-400 truncate font-bold uppercase tracking-widest leading-none mb-4">
          {project.description || "Sin descripción"}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <History className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{lastUpdated}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Hover Actions Menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="h-8 w-8 rounded-xl bg-white shadow-lg border border-black/[0.03] flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border-zinc-200 shadow-2xl">
            <DropdownMenuItem 
              onClick={onDuplicate}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-black text-zinc-600 hover:text-primary transition-all cursor-pointer"
            >
              <Copy className="h-4 w-4" /> REMIX / DUPLICAR
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-black text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" /> VER EN VIVO
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 bg-black/[0.03]" />
            <DropdownMenuItem 
              onClick={onDelete}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-black text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" /> ELIMINAR PROYECTO
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
