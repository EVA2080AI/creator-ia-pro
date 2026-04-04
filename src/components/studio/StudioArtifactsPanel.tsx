import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Layout, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mermaid } from './Mermaid';

export interface UIPlanTask {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface UIArtifact {
  id: string;
  type: 'mermaid' | 'text' | 'image';
  title: string;
  content: string;
}

export interface UILog {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  source?: string;
}

interface StudioArtifactsPanelProps {
  tasks: UIPlanTask[];
  artifacts: UIArtifact[];
  logs: UILog[];
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'progress' | 'diagrams' | 'logs';
}

export const StudioArtifactsPanel: React.FC<StudioArtifactsPanelProps> = ({
  tasks,
  artifacts,
  logs,
  isOpen,
  onClose,
  activeTab: initialTab = 'progress'
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'diagrams' | 'logs'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white/80 backdrop-blur-3xl border-l border-white/20 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[110] flex flex-col animate-in slide-in-from-right duration-500">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100/50 bg-white/40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 tracking-tight leading-none mb-1 uppercase tracking-[0.1em]">Centro de Artefactos</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Genesis v10.0 Engineering Engine</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="p-4 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('progress')}
          className={cn(
            "flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest",
            activeTab === 'progress' 
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100"
          )}
        >
          <Activity className="w-3 h-3" />
          Plan
        </button>
        <button
          onClick={() => setActiveTab('diagrams')}
          className={cn(
            "flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest",
            activeTab === 'diagrams' 
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100"
          )}
        >
          <Layout className="w-3 h-3" />
          Arquitectura
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest",
            activeTab === 'logs' 
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100"
          )}
        >
          <Zap className="w-3 h-3" />
          Logs
          {logs.filter(l => l.type === 'error').length > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {activeTab === 'progress' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lista de Tareas (task.md)</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-600 bg-emerald-50/50">
                Live Analysis
              </Badge>
            </div>
            
            <div className="space-y-2">
              {tasks.length > 0 ? tasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-start gap-4",
                    task.status === 'completed' 
                      ? "bg-emerald-50/30 border-emerald-100/50" 
                      : task.status === 'in-progress'
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : "bg-white border-zinc-100"
                  )}
                >
                  <div className="mt-0.5">
                    {task.status === 'completed' ? (
                      <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    ) : task.status === 'in-progress' ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-bold leading-relaxed",
                      task.status === 'completed' ? "text-emerald-800 line-through decoration-emerald-300" : "text-zinc-700"
                    )}>
                      {task.text}
                    </p>
                  </div>
                  {task.status === 'in-progress' && (
                    <Zap className="h-3 w-3 text-primary animate-pulse shrink-0" />
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 mb-4">
                    <Activity className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Sin plan activo</p>
                  <p className="text-[10px] text-zinc-500 mt-2 max-w-[200px]">Solicita a Genesis que inicie un plan para ver el progreso aquí.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'diagrams' ? (
          <div className="space-y-6">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visualización de Arquitectura</span>
            
            {artifacts.filter(a => a.type === 'mermaid').length > 0 ? (
              artifacts.filter(a => a.type === 'mermaid').map((artifact) => (
                <div key={artifact.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                       <Layout className="w-3.5 h-3.5 text-primary" />
                       {artifact.title}
                    </h4>
                  </div>
                  <div className="p-6 rounded-[28px] border border-zinc-100 bg-zinc-50/50 shadow-sm overflow-hidden flex items-center justify-center min-h-[200px]">
                    <Mermaid chart={artifact.content} className="w-full" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 mb-4">
                  <Layout className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Sin diagramas</p>
                <p className="text-[10px] text-zinc-500 mt-2 max-w-[200px]">Los diagramas que genere Genesis aparecerán aquí.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logs de Ejecución & Debugging</span>
               <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500" />
                 <span className="text-[9px] font-bold text-emerald-600 uppercase">Live Console</span>
               </div>
            </div>

            <div className="space-y-1.5 font-mono">
              {logs.length > 0 ? logs.map((log) => (
                <div 
                  key={log.id}
                  className={cn(
                    "p-3 rounded-xl border text-[10px] leading-relaxed transition-all",
                    log.type === 'error' ? "bg-rose-50/50 border-rose-100 text-rose-700" :
                    log.type === 'warning' ? "bg-amber-50/50 border-amber-100 text-amber-700" :
                    log.type === 'success' ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" :
                    "bg-zinc-50 border-zinc-100 text-zinc-600"
                  )}
                >
                  <div className="flex items-center justify-between mb-1 opacity-60">
                    <span className="font-black uppercase text-[8px] tracking-widest">{log.type}</span>
                    <span>{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="break-words font-medium">{log.message}</p>
                  {log.source && (
                    <div className="mt-1 flex items-center gap-1 opacity-40">
                       <ChevronRight className="w-2.5 h-2.5" />
                       <span className="text-[8px] uppercase font-black">{log.source}</span>
                    </div>
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-100 rounded-[32px]">
                   <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
                     <Zap className="w-4 h-4" />
                   </div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nada capturado aún</p>
                   <p className="text-[9px] text-zinc-500 mt-2">Los errores del preview aparecerán aquí.</p>
                </div>
              )}
            </div>
            {logs.length > 0 && logs.some(l => l.type === 'error') && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                 <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                 <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-relaxed">
                   Genesis está analizando los errores capturados para auto-corrección...
                 </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 border-t border-zinc-100 bg-white/40">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/5 border border-white/40">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Agente Autónomo Sincronizado</span>
        </div>
      </div>
    </div>
  );
};

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
      variant === 'outline' ? "bg-white border-zinc-200" : "bg-zinc-900 text-white border-zinc-900",
      className
    )}>
      {children}
    </span>
  );
}

