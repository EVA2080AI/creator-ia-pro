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
  Gamepad2,
  ImageIcon,
  Copy,
  BookOpen,
  ArrowRight,
  Globe
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
  activeTab?: 'plan' | 'progress' | 'intelligence' | 'diagrams' | 'logs' | 'terminal' | 'agents';
  agentPhase?: 'idle' | 'thinking' | 'generating' | 'architecting' | 'fixing';
  activeSpecialist?: 'ux' | 'frontend' | 'backend' | 'devops' | 'game' | 'architect' | 'engineer' | 'none';
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
  const [activeTab, setActiveTab] = useState<'plan' | 'progress' | 'intelligence' | 'diagrams' | 'logs' | 'terminal' | 'agents'>(initialTab);
  const [settingsAgent, setSettingsAgent] = useState<{ id: AgentSpecialist, name: string } | null>(null);

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-white/40 backdrop-blur-3xl border-l border-black/[0.04] flex flex-col animate-in fade-in slide-in-from-right-8 duration-1000 overflow-hidden relative selection:bg-primary/20">
      <div className="absolute inset-0 bg-grid-black opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Header: Neural Command Center */}
      <div className="h-[72px] flex items-center justify-between px-8 border-b border-black/[0.04] bg-white/40 backdrop-blur-3xl shrink-0 relative z-20 aether-iridescent">
        <div className="flex items-center gap-5">
          <div className="h-11 w-11 rounded-[1.25rem] bg-white border border-black/[0.04] flex items-center justify-center text-primary shadow-xl group transition-all hover:scale-105 hover:rotate-3">
            <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h3 className="text-xs font-black text-zinc-900 tracking-tighter leading-none mb-1 uppercase italic">NEURAL_COMMAND_CENTER</h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">AETHER_SOVEREIGN_V9.0</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="h-10 w-10 rounded-2xl flex items-center justify-center text-zinc-400 hover:bg-black/[0.04] hover:text-zinc-900 transition-all border border-transparent hover:border-black/5 active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs: Industrial Interface */}
      <div className="p-6 flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar-x shrink-0 relative z-20 bg-white/10 backdrop-blur-xl">
        {[
          { id: 'plan', icon: BookOpen, label: 'Master_Plan' },
          { id: 'progress', icon: Activity, label: 'Process_Queue' },
          { id: 'intelligence', icon: Sparkles, label: 'Knowledge_Core' },
          { id: 'diagrams', icon: Layout, label: 'Architecture' },
          { id: 'logs', icon: Zap, label: 'Telemetry' },
          { id: 'terminal', icon: TerminalIcon, label: 'Shell_Console' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 h-11 min-w-[100px] rounded-[1.25rem] flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest px-4 border",
              activeTab === tab.id 
                ? "bg-zinc-900 text-white border-zinc-900 shadow-2xl scale-[1.02] italic" 
                : "bg-white/50 text-zinc-500 border-black/[0.04] hover:bg-white hover:text-zinc-900 hover:shadow-lg"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary shadow-sm" : "")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {activeTab === 'plan' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 selection:bg-primary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">ROOT://MASTER_PLAN.MD</span>
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">
                ARCHITECT_MODE_V9.0
              </div>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl relative overflow-hidden group/plan aether-iridescent">
              {/* Blueprint Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.05] select-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} aria-hidden="true" />
              
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover/plan:rotate-0 duration-700">
                <BookOpen className="w-48 h-48 text-white" />
              </div>

              <div className="relative z-20 prose prose-invert prose-sm max-w-none">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3 italic">
                   ESTRATEGIA_LOGICA_DE_DESARROLLO
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                </h2>
                <div className="space-y-6 text-sm font-medium text-zinc-400 leading-relaxed">
                  <p>Protocolo de ingeniería optimizado para escalabilidad industrial y rendimiento atómico. Arquitectura soberana en curso:</p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                       <span className="text-primary font-black mt-0.5">01/</span>
                       <span><strong className="text-white italic uppercase tracking-widest text-[11px]">Neural_Core:</strong> Infraestructura de orquestación autónoma y gestión de estado cognitivo.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-primary font-black mt-0.5">02/</span>
                       <span><strong className="text-white italic uppercase tracking-widest text-[11px]">Industrial_UI:</strong> Interfaz Aether V9.0 con micro-interacciones de estado y glassmorphism profundo.</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="text-primary font-black mt-0.5">03/</span>
                       <span><strong className="text-white italic uppercase tracking-widest text-[11px]">Engine_Hardening:</strong> Políticas de seguridad RLS proyectadas y normalización de esquemas en tiempo real.</span>
                    </li>
                  </ul>
                  <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 italic text-[11px] font-bold tracking-tight">
                    "TECHNICAL_LOG: La arquitectura es la voluntad de una época traducida a código soberano." — GENESIS_V20.0
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Ready_For_Exec</span>
                </div>
                <button 
                  onClick={() => setActiveTab('progress')}
                  className="px-10 py-5 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-2xl flex items-center gap-3 group"
                >
                  EJECUTAR_ORQUESTACION <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'progress' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">PROCESS_QUEUE_TELEMETRY</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                 <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live_Sync</span>
              </div>
            </div>

            {/* Industrial Process Monitor Dashboard */}
            {tasks.length > 0 && (
              <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl relative overflow-hidden group/monitor selection:text-white/80">
                 <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                 
                 <div className="relative z-10 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-primary animate-pulse" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest italic">NEURAL_LOAD</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-1000 ease-out italic text-[8px] flex items-center justify-center font-black text-white"
                            style={{ width: `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` }}
                          />
                       </div>
                       <div className="flex justify-between items-end">
                          <span className="text-[24px] font-black text-white tracking-tighter leading-none">
                            {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}<span className="text-primary text-xs ml-1">%</span>
                          </span>
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">SYNCHRONIZED</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">ACTIVE_QUEUE</span>
                          <span className="text-lg font-black text-white tracking-tighter">{tasks.length}</span>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">COMPLETED</span>
                          <span className="text-lg font-black text-emerald-400 tracking-tighter">{tasks.filter(t => t.status === 'completed').length}</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
                       <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none mb-1">CURRENT_DIRECTIVE</p>
                       <p className="text-[9px] font-medium text-zinc-400 truncate max-w-[200px]">
                          {tasks.find(t => t.status === 'in-progress')?.text || 'WAITING_FOR_SEQUENCE_INIT'}
                       </p>
                    </div>
                 </div>
              </div>
            )}
            
            <div className="space-y-3">
              {tasks.length > 0 ? tasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all duration-700 flex items-start gap-5 relative overflow-hidden group/task",
                    task.status === 'completed' 
                      ? "bg-emerald-50/10 border-emerald-500/20 opacity-50 grayscale hover:grayscale-0" 
                      : task.status === 'in-progress'
                        ? "bg-white border-primary/30 shadow-2xl scale-[1.02] aether-iridescent"
                        : "bg-white/40 border-black/[0.04] backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-black/10"
                  )}
                >
                  <div className="mt-1 shrink-0 relative">
                    {task.status === 'completed' ? (
                      <div className="h-6 w-6 rounded-xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    ) : task.status === 'in-progress' ? (
                      <div className="relative">
                         <div className="absolute -inset-2 bg-primary/30 blur-xl rounded-full animate-pulse" />
                         <div className="h-6 w-6 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl relative z-10">
                            <Loader2 className="h-4 w-4 animate-spin" />
                         </div>
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-300">
                         <div className="w-2 h-2 rounded-full bg-zinc-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className={cn(
                      "text-[13px] font-bold leading-relaxed tracking-tight transition-colors duration-500",
                      task.status === 'completed' ? "text-emerald-900/40 line-through italic" : "text-zinc-900"
                    )}>
                      {task.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 italic">Phase_{task.status.toUpperCase()}</span>
                       {task.status === 'in-progress' && (
                         <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => <div key={i} className="h-2 w-0.5 bg-primary animate-height" style={{ animationDelay: `${i * 0.1}s` }} />)}
                         </div>
                       )}
                    </div>
                  </div>
                  {task.status === 'in-progress' && (
                    <Zap className="h-5 w-5 text-primary animate-pulse shrink-0 drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white/20 rounded-[3rem] border border-dashed border-black/5">
                  <div className="h-20 w-20 rounded-[2.5rem] bg-white border border-black/5 flex items-center justify-center text-zinc-200 mb-6 shadow-sm">
                    <Activity className="w-10 h-10 animate-pulse" />
                  </div>
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-2 italic">EMPTY_SESSION_BUFFER</p>
                  <p className="text-[10px] text-zinc-500 font-medium max-w-[240px] leading-relaxed">No se han detectado orquestaciones activas. Solicita un plan a Génesis para iniciar el proceso.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'intelligence' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 selection:bg-primary/20">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">SYSTEM_INTELLIGENCE_CORE</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                 <Sparkles className="w-3 h-3 text-indigo-400" />
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">AETHER_KNOWLEDGE_V9.0</span>
              </div>
            </div>

            {/* Knowledge Sections: Industrial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                 {
                   id: 'integrations',
                   title: 'SYSTEM_INTEGRATIONS',
                   desc: 'Conecta Genesis a herramientas externas, servidores MCP y APIs globales.',
                   details: [
                     { label: 'SHARED_CONNECTORS', val: 'Supabase, Vercel, Resend, Netlify' },
                     { label: 'MCP_COLLECTIVE', val: 'Contexto local mediante servidores personales.' },
                     { label: 'SECURE_API_BRIDGE', val: 'Integración universal con cualquier servicio REST/GraphQL.' }
                   ],
                   icon: Globe,
                   color: 'text-blue-500'
                 },
                 {
                   id: 'best-practices',
                   title: 'ENGINEERING_BEST_PRACTICES',
                   desc: 'Protocolos optimizados para generación de código industrial de alta fidelidad.',
                   details: [
                     { label: 'PLAN_BEFORE_ACT', val: 'Siempre solicita un plan antes de la ejecución técnica.' },
                     { label: 'ATOMIC_COMPONENTS', val: 'Construcción modular por componentes enfocados.' },
                     { label: 'REAL_ASSETS', val: 'Uso de contenido real y metadatos premium.' }
                   ],
                   icon: Zap,
                   color: 'text-amber-500'
                 },
                 {
                   id: 'plan-mode',
                   title: 'ARCHITECT_MODE_V9.0',
                   desc: 'Modo de orquestación estratégica para decisiones antes del código.',
                   details: [
                     { label: 'BRAINSTORMING', val: 'Exploración de enfoques sin alterar el código.' },
                     { label: 'CREDIT_EFFICIENCY', val: 'Consumo optimizado: 1 crédito por mensaje estratégico.' },
                     { label: 'SOVEREIGN_BLUEPRINTS', val: 'Aprobación obligatoria para cambios críticos.' }
                   ],
                   icon: Layout,
                   color: 'text-indigo-500'
                 },
                 {
                   id: 'prompting',
                   title: 'PROMPTING_HEURISTICS',
                   desc: 'Técnicas avanzadas para maximizar la calidad visual y lógica.',
                   details: [
                     { label: 'DESIGN_BUZZWORDS', val: 'Glassmorphism, Industrial, Sovereign, High-Density.' },
                     { label: 'ITERATIVE_EVOLUTION', val: 'Refinamiento constante basado en feedback de Sandpack.' },
                     { label: 'CONTEXT_DENSITY', val: 'Provee detalles exhaustivos para resultados premium.' }
                   ],
                   icon: Sparkles,
                   color: 'text-primary'
                 }
               ].map(section => (
                 <div 
                   key={section.id}
                   className="p-8 rounded-[2.5rem] bg-white border border-black/[0.04] shadow-xl hover:shadow-2xl transition-all duration-500 group/section relative overflow-hidden aether-iridescent"
                 >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/section:scale-110 transition-transform duration-700">
                       <section.icon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                       <div className="flex items-center gap-4 mb-6">
                          <div className={cn("h-11 w-11 rounded-2xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-center transition-all group-hover/section:scale-105", section.color)}>
                             <section.icon className="w-5 h-5" />
                          </div>
                          <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tighter italic">{section.title}</h4>
                       </div>
                       <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mb-8 flex-1">{section.desc}</p>
                       <div className="space-y-4">
                          {section.details.map((detail, idx) => (
                             <div key={idx} className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{detail.label}</span>
                                <span className="text-[10px] font-bold text-zinc-800">{detail.val}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {/* Special Plans & Credits section */}
            <div className="mt-12 p-10 rounded-[3rem] bg-zinc-900 border border-white/10 shadow-2xl relative overflow-hidden selection:text-white/80">
               <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               
               <div className="relative z-20 flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-6">
                     <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">COMMERCIAL_TIER_SOVEREIGN</span>
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">PLANES_Y_CREDITOS</h3>
                     <p className="text-[13px] text-zinc-400 font-medium leading-relaxed">Escala tu producción de software con Genesis. Créditos consumibles por mensaje para máxima flexibilidad.</p>
                     
                     <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-1">
                           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">FREE_TIER</span>
                           <p className="text-sm font-black text-white italic">LIMITADO_EXPLORACION</p>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[8px] font-black text-primary uppercase tracking-widest">PRO_TIER</span>
                           <p className="text-sm font-black text-white italic">500-1000_CREDITOS/MES</p>
                        </div>
                     </div>
                  </div>

                  <div className="shrink-0">
                     <button className="px-12 py-6 rounded-[2.5rem] bg-white text-black text-xs font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl italic">
                        UPGRADE_SYSTEM
                     </button>
                  </div>
               </div>
            </div>
          </div>
        ) : activeTab === 'diagrams' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visualización de Arquitectura</span>

            {artifacts.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 pb-10">
                {/* Visual Artifacts (Mermaid & Images) */}
                {artifacts.filter(a => a.type === 'mermaid' || a.type === 'image').map((artifact) => (
                  <div key={artifact.id} className="group space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-2xl flex items-center justify-center shadow-xl border transition-all",
                          artifact.type === 'mermaid' ? "bg-primary/5 border-primary/20 text-primary" : "bg-blue-500/5 border-blue-500/20 text-blue-500"
                        )}>
                          {artifact.type === 'mermaid' ? <Layout className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-[12px] font-black text-zinc-900 uppercase tracking-widest">{artifact.title}</h4>
                             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          </div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{artifact.type === 'mermaid' ? 'Architecture Blueprint v2.0' : 'Visual Asset Optimized'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="h-8 px-4 rounded-xl border border-zinc-100 bg-white text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:border-primary/30 hover:text-primary transition-all">
                          Export SVG
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative p-10 rounded-[3rem] border border-zinc-100 bg-white shadow-2xl overflow-hidden flex items-center justify-center min-h-[300px] group/chart cursor-zoom-in transition-all hover:border-primary/30">
                      {/* Architectural Grid Background */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                      
                      <div className="relative z-10 w-full flex justify-center">
                        {artifact.type === 'mermaid' ? (
                          artifact.content.length > 20 && (artifact.content.includes('graph') || artifact.content.includes('flowchart') || artifact.content.includes('---')) ? (
                            <Mermaid chart={artifact.content} className="w-full max-w-full transform transition-transform group-hover/chart:scale-[1.02]" />
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-zinc-300">
                               <Activity className="w-8 h-8 opacity-20 animate-pulse" />
                               <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Analizando Nodo...</span>
                            </div>
                          )
                        ) : (
                          <img src={artifact.content} alt={artifact.title} className="max-w-full h-auto rounded-xl shadow-lg" />
                        )}
                      </div>
                      
                      <div className="absolute bottom-6 right-8 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 pointer-events-none mix-blend-difference">
                        Genesis OS • Deep Engineering
                      </div>
                    </div>
                  </div>
                ))}

                {/* Text Artifacts (Refined Notes, Copywriting, Schemas) */}
                {artifacts.filter(a => a.type === 'text').length > 0 && (
                  <div className="space-y-4 pt-10 mt-10 border-t border-black/5">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                          <Code2 className="w-4 h-4" />
                       </div>
                       <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Activos de Documentación</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {artifacts.filter(a => a.type === 'text').map(artifact => (
                        <div key={artifact.id} className="p-8 rounded-[2.5rem] bg-white border border-zinc-100 hover:border-primary/20 hover:shadow-xl hover:shadow-zinc-100 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Copy className="w-3.5 h-3.5 text-zinc-300 hover:text-primary cursor-pointer" />
                          </div>
                          <h4 className="text-[12px] font-black text-zinc-900 mb-3 uppercase tracking-widest leading-tight">{artifact.title}</h4>
                          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium line-clamp-6">{artifact.content}</p>
                          <div className="mt-6 flex items-center gap-2 opacity-40">
                             <div className="w-1 h-1 rounded-full bg-zinc-400" />
                             <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Texto Optimizado por Genesis</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-12 text-center rounded-[3rem] bg-white border border-dashed border-zinc-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
                <div className="relative z-10">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-20 w-20 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 mb-8 mx-auto shadow-sm"
                  >
                    <Layout className="w-8 h-8 opacity-40" />
                  </motion.div>
                  <h3 className="text-[18px] font-black text-zinc-900 mb-3 uppercase tracking-tighter">Sin Arquitectura Detectada</h3>
                  <p className="text-[12px] text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed font-bold">
                    Genesis no ha capturado un blueprint estructural en el chat todavía.
                  </p>
                  
                  <button 
                    onClick={onFix}
                    className="mt-10 px-8 py-3.5 rounded-[1.8rem] bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary shadow-2xl shadow-primary/20 transition-all flex items-center gap-3 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analizar Arquitectura con UX Engine
                  </button>
                  
                  <div className="mt-8 flex items-center justify-center gap-1.5 opacity-30">
                     <div className="w-1 h-1 rounded-full bg-zinc-400" />
                     <div className="w-1 h-1 rounded-full bg-zinc-400" />
                     <div className="w-1 h-1 rounded-full bg-zinc-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'agents' ? (
          <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
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
              
              {/* Special Swarm Card */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex flex-col justify-between items-start group relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-center justify-between w-full mb-6">
                   <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      <Sparkles className="w-5 h-5" />
                   </div>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                   </div>
                </div>
                <div>
                   <h3 className="text-white text-[12px] font-black uppercase tracking-widest mb-1">Enjambre Genesis</h3>
                   <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Multiprocesamiento Activo</p>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-4 border-t border-black/5">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Métrica de Rendimiento Neural</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="Velocidad de Síntesis" value="98.4%" />
                <MetricBox label="Precisión Global" value="99.2%" />
                <MetricBox label="Estado Neural" value="Estable" />
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
      <div className="p-8 border-t border-black/5 bg-white/40 shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-50/50 border border-zinc-100 shadow-inner">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Deep Reasoning Sync</span>
          </div>
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Genesis Architecture Hub</span>
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
