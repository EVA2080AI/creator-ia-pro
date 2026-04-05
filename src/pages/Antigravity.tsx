import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { StudioChat } from '@/components/studio/StudioChat';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, Bot, Zap, MessageSquare, 
  Shield, Star, Share2, Activity,
  Terminal, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AetherCard } from '@/components/ui/aether-card';

export default function Antigravity() {
  const { user } = useAuth('/auth');
  const [neuralStatus, setNeuralStatus] = useState<'idle' | 'processing' | 'optimized'>('optimized');
  const [neuralLogs, setNeuralLogs] = useState<{ label: string; status: 'active' | 'complete' | 'waiting'; time: string }[]>([
    { label: "Análisis de Contexto", status: "complete", time: "2ms" },
    { label: "Orquestación Multimodal", status: "waiting", time: "" },
    { label: "Validación de Seguridad", status: "waiting", time: "" },
    { label: "Sincronización de Nexus", status: "waiting", time: "" }
  ]);

  const handleAddLog = (msg: string, type: string = 'info') => {
    setNeuralLogs(prev => {
      const newLogs = [...prev];
      // Simple logic to rotate or update logs based on message content
      if (msg.includes('Analizando') || msg.includes('Iniciando')) {
        newLogs[1] = { label: msg, status: 'active', time: '...' };
      } else if (msg.includes('completado') || msg.includes('Éxito')) {
        newLogs[1] = { label: "Procesamiento Exitoso", status: 'complete', time: '14ms' };
      }
      return newLogs;
    });
    if (type === 'info') setNeuralStatus('processing');
    else setNeuralStatus('optimized');
  };

  return (
    <div className="h-full w-full bg-[#FCFCFC] flex flex-col relative overflow-hidden">
      <Helmet>
        <title>Antigravity AI | Creator IA Pro</title>
      </Helmet>

      {/* ── Aether V9.0 Background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-purple-100/20 via-blue-50/10 to-transparent rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-tl from-pink-50/20 via-violet-50/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* ── Header ── */}
      <header className="h-[64px] border-b border-zinc-200/60 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl relative z-20 shrink-0">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-xl shadow-zinc-900/10 aether-iridescent"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-black text-zinc-900 tracking-tight leading-none mb-1">Antigravity AI</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Neural Orchestration Engine</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/5 border border-primary/10 transition-all uppercase tracking-widest">v9.0 Alpha</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 mr-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Capacidad Transaccional</span>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: neuralStatus === 'processing' ? "98%" : "84%" }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-600 font-mono">{neuralStatus === 'processing' ? '98%' : '84%'}</span>
              </div>
            </div>
          </div>
          <button className="h-10 w-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-white/80 border border-transparent hover:border-zinc-200 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex overflow-hidden relative z-10 p-4 md:p-6 lg:p-8 gap-8">
        
        {/* Sidebar Intel (Only on XL) */}
        <div className="hidden xl:flex w-[280px] flex-col gap-6">
          <AetherCard className="flex-1 flex flex-col p-5" variant="glass">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">Actividad Neural</h3>
            </div>
            
            <div className="flex-1 space-y-4 overflow-hidden">
              {neuralLogs.map((log, i) => (
                <NeuralLog 
                  key={i}
                  label={log.label} 
                  status={log.status} 
                  time={log.time} 
                />
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-zinc-100">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-zinc-400">Latencia Promedio</span>
                 <span className="text-[10px] font-black text-zinc-900">1.2ms</span>
               </div>
               <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden">
                 <div className={cn("h-full bg-emerald-500 transition-all duration-1000", neuralStatus === 'processing' ? "w-[45%]" : "w-[12%]")} />
               </div>
            </div>
          </AetherCard>

          <AetherCard variant="iridescent" className="p-5">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-white/50 flex items-center justify-center">
                 <Shield className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Nexus Guard</p>
                 <p className="text-[10px] text-zinc-500 font-medium">Protección Neural Activa</p>
               </div>
            </div>
          </AetherCard>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col items-center">
          <AetherCard 
            variant="glass" 
            className="w-full max-w-6xl h-full flex flex-col p-1 shadow-2xl shadow-black/[0.02]"
            glow={neuralStatus === 'processing'}
          >
            <div className="flex-1 rounded-[22px] bg-white border border-zinc-100 overflow-hidden relative">
              <StudioChat 
                projectId="antigravity-global"
                projectFiles={{}}
                onCodeGenerated={() => {}}
                persona="antigravity"
                onGeneratingChange={(v) => setNeuralStatus(v ? 'processing' : 'optimized')}
              />
            </div>
          </AetherCard>
        </div>
      </main>

      {/* Experimental Floating Indicators */}
      <AnimatePresence>
        <div className="absolute bottom-10 left-10 hidden 2xl:flex flex-col gap-3 pointer-events-none">
           <FeatureBadge icon={Zap} label="Procesamiento Ultra-rápido" />
           <FeatureBadge icon={Terminal} label="Kernel v9.0.2" />
           <FeatureBadge icon={Globe} label="Sincronización Global" />
        </div>
      </AnimatePresence>
    </div>
  );
}

function NeuralLog({ label, status, time }: { label: string, status: 'active' | 'complete' | 'waiting', time?: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === 'active' && "bg-primary animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]",
          status === 'complete' && "bg-emerald-500",
          status === 'waiting' && "bg-zinc-200"
        )} />
        <span className={cn(
          "text-[10px] font-bold tracking-tight transition-colors",
          status === 'active' ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"
        )}>{label}</span>
      </div>
      {time && (
        <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-50 px-1 rounded">{time}</span>
      )}
    </div>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-[18px] bg-white/60 backdrop-blur-md border border-white shadow-xl shadow-black/[0.02]"
    >
      <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-[11px] font-black text-zinc-900 tracking-tight uppercase tracking-widest opacity-80">{label}</span>
    </motion.div>
  );
}
