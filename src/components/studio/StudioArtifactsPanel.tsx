import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Activity, CheckCircle2, Circle, Loader2,
  Zap, Layout, ChevronDown, AlertTriangle, Info, CheckCircle, XCircle, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mermaid } from './Mermaid';
import { type AgentSpecialist, type AgentPhase } from './chat/types';
import type { StudioFile } from '@/hooks/useStudioProjects';

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

type PanelTab = 'tasks' | 'architecture' | 'logs';

interface StudioArtifactsPanelProps {
  tasks: UIPlanTask[];
  artifacts: UIArtifact[];
  logs: UILog[];
  files: Record<string, StudioFile>;
  isOpen: boolean;
  onClose: () => void;
  onFix?: () => void;
  activeTab?: string;
  agentPhase?: AgentPhase;
  activeSpecialist?: AgentSpecialist;
  persona?: 'genesis' | 'antigravity';
}

const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'tasks', label: 'Tareas', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'architecture', label: 'Arquitectura', icon: <Layout className="h-3.5 w-3.5" /> },
  { id: 'logs', label: 'Logs', icon: <Zap className="h-3.5 w-3.5" /> },
];

export const StudioArtifactsPanel: React.FC<StudioArtifactsPanelProps> = ({
  tasks, artifacts, logs, isOpen, onClose, onFix, agentPhase = 'idle',
}) => {
  const [tab, setTab] = useState<PanelTab>('tasks');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === 'logs') logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length, tab]);

  const toggleLog = (id: string) =>
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  if (!isOpen) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-100 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center border transition-all duration-500",
            agentPhase !== 'idle'
              ? "bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
              : "bg-zinc-100 border-zinc-200 text-zinc-400"
          )}>
            <Activity className={cn("h-4 w-4", agentPhase !== 'idle' ? "animate-pulse" : "")} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-900 tracking-tight">Estudio de Ingeniería</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={cn("w-1 h-1 rounded-full animate-pulse", agentPhase !== 'idle' ? "bg-primary" : "bg-zinc-300")} />
               <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">
                 {agentPhase !== 'idle' ? 'Orquestando...' : 'En espera'}
               </p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-2 bg-white border-b border-zinc-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative overflow-hidden",
              tab === t.id
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {t.icon}
            {t.label}
            {t.id === 'tasks' && tasks.length > 0 && (
              <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full ml-1 font-black", tab === t.id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-500")}>
                {tasks.length}
              </span>
            )}
            {t.id === 'logs' && logs.length > 0 && (
              <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full ml-1 font-black", tab === t.id ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-500")}>
                {logs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-50/20">

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            {tasks.length > 0 ? (
              <>
                {/* Progress bar */}
                <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Plan de Ejecución</span>
                    <span className="text-[12px] font-black text-primary">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ scaleX: 0 }} 
                      animate={{ scaleX: progress / 100 }} 
                      className="h-full bg-primary origin-left transition-all duration-700" 
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <span>{completedTasks} / {tasks.length} tareas</span>
                    {agentPhase !== 'idle' && <span className="text-primary flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Activo</span>}
                  </div>
                </div>

                {/* Task list */}
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className={cn(
                      "flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all duration-300",
                      task.status === 'completed' ? "bg-emerald-50/30 border-emerald-100" :
                      task.status === 'in-progress' ? "bg-white border-primary/20 shadow-md shadow-primary/5" :
                      "bg-white border-zinc-100"
                    )}>
                      {task.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> :
                       task.status === 'in-progress' ? <Loader2 className="h-4 w-4 text-primary animate-spin mt-0.5 shrink-0" /> :
                       <Circle className="h-4 w-4 text-zinc-200 mt-0.5 shrink-0" />}
                      <span className={cn(
                        "text-[12.5px] leading-relaxed font-medium",
                        task.status === 'completed' ? "text-emerald-700/80 line-through" :
                        task.status === 'in-progress' ? "text-zinc-900" :
                        "text-zinc-500"
                      )}>{task.text}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={<Activity className="h-8 w-8" />} title="Sin tareas activas" description="Las tareas aparecerán cuando Genesis planifique una arquitectura." />
            )}
          </div>
        )}

        {/* Architecture Tab */}
        {tab === 'architecture' && (
          <div className="space-y-4">
            {artifacts.length > 0 ? (
              <>
                {artifacts.filter(a => a.type === 'mermaid').map(a => (
                  <div key={a.id} className="rounded-2xl border border-zinc-100 overflow-hidden shadow-sm bg-white">
                    <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-900 tracking-tight">{a.title}</span>
                      <Layout className="h-3 w-3 text-zinc-400" />
                    </div>
                    <div className="p-5 flex justify-center"><Mermaid chart={a.content} /></div>
                  </div>
                ))}
                {artifacts.filter(a => a.type === 'image').map(a => (
                  <div key={a.id} className="rounded-2xl border border-zinc-100 overflow-hidden shadow-sm bg-white p-2">
                    <img src={a.content} alt={a.title} className="w-full rounded-xl" />
                  </div>
                ))}
                {artifacts.filter(a => a.type === 'text').map(a => (
                  <div key={a.id} className="p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                    <h4 className="text-[12.5px] font-black text-zinc-900 mb-2 uppercase tracking-tight">{a.title}</h4>
                    <p className="text-[12.5px] text-zinc-600 whitespace-pre-wrap leading-relaxed font-medium">{a.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState icon={<Layout className="h-8 w-8" />} title="Nada que mostrar" description="No hay diagramas visuales en esta sesión." />
            )}
          </div>
        )}

        {/* Logs Tab */}
        {tab === 'logs' && (
          <div className="space-y-2">
            {logs.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Ejecución Industrial</span>
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">{logs.length} eventos</span>
                </div>
                {logs.slice(-100).map(log => {
                  const isExpanded = expandedLogs.has(log.id);
                  const hasDetail = !!(log.source);

                  const Icon = log.type === 'error' ? XCircle
                    : log.type === 'warning' ? AlertTriangle
                    : log.type === 'success' ? CheckCircle
                    : Info;

                  const colors = {
                    error:   'bg-red-50 border-red-100/50 text-red-900',
                    warning: 'bg-amber-50 border-amber-100/50 text-amber-900',
                    success: 'bg-emerald-50 border-emerald-100/50 text-emerald-900',
                    info:    'bg-white border-zinc-200 text-zinc-700 shadow-sm',
                  }[log.type];

                  const iconColors = {
                    error: 'text-red-500',
                    warning: 'text-amber-500',
                    success: 'text-emerald-500',
                    info: 'text-zinc-400',
                  }[log.type];

                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "rounded-2xl border overflow-hidden transition-all duration-300",
                        colors
                      )}
                    >
                      {/* Row */}
                      <button
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-all",
                          hasDetail ? "cursor-pointer hover:bg-black/[0.02]" : "cursor-default"
                        )}
                        onClick={() => hasDetail && toggleLog(log.id)}
                        disabled={!hasDetail}
                      >
                        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColors)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] leading-snug font-bold break-words pr-2">{log.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[8.5px] font-mono opacity-50 font-bold">
                            {log.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          {hasDetail && (
                            <ChevronDown className={cn(
                              "h-3.5 w-3.5 opacity-40 transition-transform duration-300",
                              isExpanded && "rotate-180"
                            )} />
                          )}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && hasDetail && (
                        <div className="px-10 pb-4 pt-1 animate-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                             <div className="flex items-center gap-1.5">
                                <Terminal className="h-3 w-3 opacity-40" />
                                <span className="text-[9px] font-black uppercase tracking-wider opacity-50">Stack Trace / Source</span>
                             </div>
                             {log.type === 'error' && onFix && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); onFix(); }}
                                 className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-white text-[9px] font-black uppercase tracking-wider hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                               >
                                 <Zap className="h-2.5 w-2.5 text-primary" />
                                 Reparar con Génesis
                               </button>
                             )}
                          </div>
                          <pre className="text-[10px] font-mono opacity-75 whitespace-pre-wrap break-all leading-relaxed bg-black/5 rounded-lg p-2">
                            {log.source}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </>
            ) : (
              <EmptyState
                icon={<Terminal className="h-8 w-8" />}
                title="Sin logs"
                description="Los logs de ejecución aparecerán aquí cuando Génesis procese."
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-zinc-200 mb-3">{icon}</div>
      <h4 className="text-[13px] font-bold text-zinc-400 mb-1">{title}</h4>
      <p className="text-[11px] text-zinc-300 max-w-[200px]">{description}</p>
    </div>
  );
}
