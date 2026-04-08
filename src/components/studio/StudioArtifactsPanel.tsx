import React, { useState } from 'react';
import {
  X, Activity, CheckCircle2, Circle, Loader2,
  Zap, Layout, ImageIcon
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
  tasks, artifacts, logs, isOpen, onClose, agentPhase = 'idle',
}) => {
  const [tab, setTab] = useState<PanelTab>('tasks');

  if (!isOpen) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center border",
            agentPhase !== 'idle'
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-zinc-50 border-zinc-200 text-zinc-400"
          )}>
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-900">Consola</h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
              {agentPhase !== 'idle' ? 'Procesando...' : 'En espera'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-zinc-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
              tab === t.id
                ? "bg-primary/10 text-primary"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {t.icon}
            {t.label}
            {t.id === 'tasks' && tasks.length > 0 && (
              <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
            )}
            {t.id === 'logs' && logs.length > 0 && (
              <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">{logs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div className="space-y-3">
            {tasks.length > 0 ? (
              <>
                {/* Progress bar */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Progreso</span>
                    <span className="text-[11px] font-bold text-zinc-700">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400">
                    <span>{completedTasks} / {tasks.length} completadas</span>
                    {agentPhase !== 'idle' && <span className="text-primary font-medium">Activo</span>}
                  </div>
                </div>

                {/* Task list */}
                <div className="space-y-1.5">
                  {tasks.map(task => (
                    <div key={task.id} className={cn(
                      "flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all",
                      task.status === 'completed' ? "bg-emerald-50/50 border-emerald-100" :
                      task.status === 'in-progress' ? "bg-primary/5 border-primary/10" :
                      "bg-white border-zinc-100"
                    )}>
                      {task.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> :
                       task.status === 'in-progress' ? <Loader2 className="h-4 w-4 text-primary animate-spin mt-0.5 shrink-0" /> :
                       <Circle className="h-4 w-4 text-zinc-300 mt-0.5 shrink-0" />}
                      <span className={cn(
                        "text-[12px] leading-relaxed",
                        task.status === 'completed' ? "text-emerald-700 line-through" :
                        task.status === 'in-progress' ? "text-zinc-800 font-medium" :
                        "text-zinc-500"
                      )}>{task.text}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={<Activity className="h-8 w-8" />} title="Sin tareas" description="Las tareas aparecerán cuando Genesis planifique un proyecto." />
            )}
          </div>
        )}

        {/* Architecture Tab */}
        {tab === 'architecture' && (
          <div className="space-y-4">
            {artifacts.length > 0 ? (
              <>
                {artifacts.filter(a => a.type === 'mermaid').map(a => (
                  <div key={a.id} className="rounded-xl border border-zinc-100 overflow-hidden">
                    <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                      <span className="text-[11px] font-bold text-zinc-600">{a.title}</span>
                    </div>
                    <div className="p-4 bg-white"><Mermaid chart={a.content} /></div>
                  </div>
                ))}
                {artifacts.filter(a => a.type === 'image').map(a => (
                  <div key={a.id} className="rounded-xl border border-zinc-100 overflow-hidden">
                    <img src={a.content} alt={a.title} className="w-full" />
                  </div>
                ))}
                {artifacts.filter(a => a.type === 'text').map(a => (
                  <div key={a.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                    <h4 className="text-[12px] font-bold text-zinc-700 mb-2">{a.title}</h4>
                    <p className="text-[12px] text-zinc-500 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState icon={<Layout className="h-8 w-8" />} title="Sin arquitectura" description="Los diagramas Mermaid generados por Genesis aparecerán aquí." />
            )}
          </div>
        )}

        {/* Logs Tab */}
        {tab === 'logs' && (
          <div className="space-y-1.5">
            {logs.length > 0 ? (
              logs.slice(0, 50).map(log => (
                <div key={log.id} className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] border",
                  log.type === 'error' ? "bg-red-50 border-red-100 text-red-700" :
                  log.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-700" :
                  log.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                  "bg-zinc-50 border-zinc-100 text-zinc-600"
                )}>
                  <span className="text-[9px] font-mono text-zinc-400 shrink-0 mt-0.5">
                    {log.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="leading-relaxed">{log.message}</span>
                </div>
              ))
            ) : (
              <EmptyState icon={<Zap className="h-8 w-8" />} title="Sin logs" description="Los logs de ejecución aparecerán aquí cuando Genesis procese." />
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
