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
  Zap,
  Terminal as TerminalIcon,
  Code2,
  Database, 
  RefreshCw,
  Settings,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mermaid } from './Mermaid';
import { AgentSettingsModal } from './AgentSettingsModal';
import { type AgentSpecialist } from '@/hooks/useAgentPreferences';
import { StudioTerminal } from './StudioTerminal';
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

interface StudioArtifactsPanelProps {
  tasks: UIPlanTask[];
  artifacts: UIArtifact[];
  logs: UILog[];
  files: Record<string, StudioFile>;
  isOpen: boolean;
  onClose: () => void;
  onFix?: () => void;
  activeTab?: 'progress' | 'diagrams' | 'logs' | 'terminal' | 'agents';
  agentPhase?: 'idle' | 'thinking' | 'generating' | 'architecting' | 'fixing';
  activeSpecialist?: 'ux' | 'frontend' | 'backend' | 'devops' | 'game' | 'none';
  persona?: 'genesis' | 'antigravity';
}

export const StudioArtifactsPanel: React.FC<StudioArtifactsPanelProps> = ({
  tasks,
  artifacts,
  logs,
  files,
  isOpen,
  onClose,
  onFix,
  activeTab: initialTab = 'progress',
  agentPhase = 'idle',
  activeSpecialist = 'none',
  persona = 'genesis'
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'diagrams' | 'logs' | 'terminal' | 'agents'>(initialTab);
  const [settingsAgent, setSettingsAgent] = useState<{ id: AgentSpecialist, name: string } | null>(null);

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-white/40 backdrop-blur-3xl border-l border-white/20 flex flex-col animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-100/50 bg-white/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-zinc-900 tracking-tight leading-none mb-0.5 uppercase tracking-[0.1em]">Centro de Artefactos</h3>
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Genesis v10.0 Engineering Engine</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-all"
        >
          <X className="h-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="p-4 flex items-center gap-1 overflow-x-auto custom-scrollbar no-scrollbar-x shrink-0">
        <button
          onClick={() => setActiveTab('progress')}
          className={cn(
            "flex-1 h-10 min-w-[80px] rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest px-3",
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
            "flex-1 h-10 min-w-[100px] rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest px-3",
            activeTab === 'diagrams' 
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100"
          )}
        >
          <Layout className="w-3 h-3" />
          Arqui
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={cn(
            "flex-1 h-10 min-w-[80px] rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest px-3",
            activeTab === 'agents' 
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100"
          )}
        >
          <Sparkles className="w-3 h-3" />
          Agentes
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "flex-1 h-10 min-w-[80px] rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest px-3",
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
        <button
          onClick={() => setActiveTab('terminal')}
          className={cn(
            "flex-1 h-10 min-w-[90px] rounded-xl flex items-center justify-center gap-1.5 transition-all font-black text-[9px] uppercase tracking-widest px-3",
            activeTab === 'terminal' 
              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-100"
          )}
        >
          <TerminalIcon className="w-3 h-3" />
          Shell
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {activeTab === 'progress' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visualización de Arquitectura</span>
            
            {artifacts.filter(a => a.type === 'mermaid').length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {artifacts.filter(a => a.type === 'mermaid').map((artifact) => (
                  <div key={artifact.id} className="group space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                          <Layout className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">{artifact.title}</h4>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">SVG Blueprint Generated</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-white border-zinc-200">
                        Vector Map
                      </Badge>
                    </div>
                    
                    <div className="relative p-8 rounded-[32px] border border-zinc-100 bg-[#fafafa] shadow-md overflow-hidden flex items-center justify-center min-h-[300px] group/chart cursor-zoom-in transition-all hover:shadow-xl hover:border-primary/20">
                      {/* Architectural Grid Background */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                      
                      <div className="relative z-10 w-full flex justify-center">
                        <Mermaid chart={artifact.content} className="w-full max-w-full transform transition-transform group-hover/chart:scale-[1.02]" />
                      </div>
                      
                      {/* Watermark */}
                      <div className="absolute bottom-4 right-6 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-300 pointer-events-none">
                        Genesis Core Engineering
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        ) : activeTab === 'agents' ? (
          <div className="h-full flex flex-col p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AgentCard 
                name="UX Engine" 
                role="UI/UX & Design Systems" 
                active={activeSpecialist === 'ux' || (persona === 'genesis' && agentPhase !== 'idle' && activeSpecialist === 'none')} 
                phase={activeSpecialist === 'ux' ? agentPhase : 'idle'} 
                color="primary"
                icon={<Layout className="w-5 h-5" />}
                description="Optimización de experiencia de usuario, jerarquía visual y flujos conversacionales tácticos."
                onSettings={() => setSettingsAgent({ id: 'ux', name: 'UX Engine' })}
              />
              <AgentCard 
                name="Frontend Core" 
                role="React & Logic execution" 
                active={activeSpecialist === 'frontend'} 
                phase={activeSpecialist === 'frontend' ? agentPhase : 'idle'} 
                color="blue"
                icon={<Code2 className="w-5 h-5" />}
                description="Generación de componentes de alto rendimiento, gestión de estados y animaciones premium."
                onSettings={() => setSettingsAgent({ id: 'frontend', name: 'Frontend Core' })}
              />
              <AgentCard 
                name="Backend Logic" 
                role="Database & API Architect" 
                active={activeSpecialist === 'backend'} 
                phase={activeSpecialist === 'backend' ? agentPhase : 'idle'} 
                color="purple"
                icon={<Database className="w-5 h-5" />}
                description="Orquestación de esquemas de datos, Edge Functions y seguridad robusta en Supabase."
                onSettings={() => setSettingsAgent({ id: 'backend', name: 'Backend Logic' })}
              />
              <AgentCard 
                name="DevOps Sync" 
                role="Deployment & CI/CD" 
                active={activeSpecialist === 'devops'} 
                phase={activeSpecialist === 'devops' ? agentPhase : 'idle'} 
                color="orange"
                icon={<RefreshCw className="w-5 h-5" />}
                description="Integración continua con GitHub, optimización de build y despliegue automatizado en Vercel."
                onSettings={() => setSettingsAgent({ id: 'devops', name: 'DevOps Sync' })}
              />
              <AgentCard 
                name="Game Engine" 
                role="Physics & Logic Orchestrator" 
                active={activeSpecialist === 'game'} 
                phase={activeSpecialist === 'game' ? agentPhase : 'idle'} 
                color="primary"
                icon={<Gamepad2 className="w-5 h-5" />}
                description="Matemáticas de juegos, detección de colisiones 2D/3D y gestión de estado sincronizado en tiempo real."
                onSettings={() => setSettingsAgent({ id: 'game', name: 'Game Engine' })}
              />
              <div className="p-4 bg-zinc-900 border-t border-white/5 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enjambre de Especialistas Genesis</span>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>

          <AnimatePresence>
            {settingsAgent && (
              <AgentSettingsModal 
                isOpen={true} 
                onClose={() => setSettingsAgent(null)} 
                agentId={settingsAgent.id} 
                agentName={settingsAgent.name} 
              />
            )}
          </AnimatePresence>
        </div>

            <div className="pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Métricas de Colaboración</h4>
              <div className="grid grid-cols-3 gap-4">
                <MetricBox label="Velocidad" value="98%" />
                <MetricBox label="Precisión" value="99.2%" />
                <MetricBox label="Autonomía" value="Activa" />
              </div>
            </div>
          </div>
        ) : activeTab === 'logs' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center justify-between mb-2 shrink-0">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Terminal Interactiva (Experimental)</span>
               <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-bold text-primary uppercase">Active Shell</span>
               </div>
            </div>
            <div className="flex-1 min-h-0">
               <StudioTerminal 
                 files={files} 
                 onFix={onFix}
               />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 border-t border-zinc-100 bg-white/40 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/5 border border-white/40">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Agente Autónomo Sincronizado</span>
          </div>
          <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter">Genesis Engine LTS v10</span>
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

function AgentCard({ name, role, active, phase, color, description, icon, onSettings }: { name: string, role: string, active: boolean, phase: string, color: 'primary' | 'blue' | 'purple' | 'orange', description: string, icon: React.ReactNode, onSettings: () => void }) {
  const isThinking = phase === 'thinking' || phase === 'architecting' || phase === 'fixing';
  const isGenerating = phase === 'generating';

  return (
    <div className={cn(
      "p-6 rounded-[32px] border transition-all duration-500 relative overflow-hidden group flex flex-col h-full",
      active 
        ? "bg-white/5 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-[1.02] z-10" 
        : "bg-zinc-900/10 border-white/5 opacity-50 hover:opacity-80"
    )}>
      {active && (
        <div className={cn(
          "absolute -top-12 -right-12 w-24 h-24 blur-[60px] opacity-20",
          color === 'primary' ? "bg-primary" : 
          color === 'blue' ? "bg-blue-500" :
          color === 'purple' ? "bg-purple-500" : "bg-orange-500"
        )} />
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center relative",
            color === 'primary' ? "bg-primary/10 border border-primary/20" : 
            color === 'blue' ? "bg-blue-500/10 border border-blue-500/20" :
            color === 'purple' ? "bg-purple-500/10 border border-purple-500/20" : "bg-orange-500/10 border border-orange-500/20"
          )}>
            {React.cloneElement(icon as React.ReactElement, { 
              className: cn("w-4.5 h-4.5", 
                color === 'primary' ? "text-primary" : 
                color === 'blue' ? "text-blue-400" :
                color === 'purple' ? "text-purple-400" : "text-orange-400"
              ) 
            })}
            {active && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", 
                  color === 'primary' ? "bg-primary" : 
                  color === 'blue' ? "bg-blue-400" :
                  color === 'purple' ? "bg-purple-400" : "bg-orange-400"
                )}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2", 
                  color === 'primary' ? "bg-primary" : 
                  color === 'blue' ? "bg-blue-400" :
                   color === 'purple' ? "bg-purple-400" : "bg-orange-400"
                )}></span>
              </span>
            )}
          </div>
          <div>
            <h3 className={cn("text-xs font-black transition-colors", active ? "text-white" : "text-zinc-500")}>{name}</h3>
            <p className={cn("text-[9px] font-bold uppercase tracking-widest transition-colors", active ? "text-zinc-400" : "text-zinc-600")}>{role}</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onSettings(); }}
          className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className={cn("text-[10px] leading-relaxed mb-6 line-clamp-3 transition-colors", active ? "text-zinc-300" : "text-zinc-500")}>
        {description}
      </p>

      <div className="flex items-center justify-between mt-auto">
         <div className="flex items-center gap-2">
            <div className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1",
              active ? (
                color === 'primary' ? "bg-primary/20 text-primary" : 
                color === 'blue' ? "bg-blue-500/20 text-blue-400" :
                color === 'purple' ? "bg-purple-500/20 text-purple-400" : "bg-orange-500/20 text-orange-400"
              ) : "bg-zinc-800 text-zinc-500"
            )}>
               {active ? (
                 <>
                   {isThinking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                   {isGenerating && <Zap className="w-2.5 h-2.5 animate-pulse fill-current" />}
                   {phase === 'idle' ? 'Listo' : phase.charAt(0).toUpperCase() + phase.slice(1)}
                 </>
               ) : 'En Espera'}
            </div>
         </div>
         {active && (isThinking || isGenerating) && (
           <div className="flex gap-0.5">
             {[1, 2, 3].map(i => (
               <div key={i} className={cn(
                 "w-0.5 h-2.5 rounded-full animate-pulse",
                 color === 'primary' ? "bg-primary" : 
                 color === 'blue' ? "bg-blue-400" :
                 color === 'purple' ? "bg-purple-400" : "bg-orange-400"
               )} style={{ animationDelay: `${i * 0.15}s` }} />
             ))}
           </div>
         )}
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-zinc-300 tracking-tight">{value}</p>
    </div>
  );
}
