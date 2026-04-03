import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { StudioChat } from '@/components/studio/StudioChat';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, Bot, Zap, MessageSquare, 
  Shield, Star, Share2, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Antigravity() {
  const { user } = useAuth('/auth');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden">
      <Helmet>
        <title>Antigravity AI | Creator IA Pro</title>
      </Helmet>

      {/* ── Background Decoration ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-violet-50/50 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* ── Header ── */}
      <header className="h-[56px] border-b border-zinc-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-200">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-zinc-900 tracking-tight leading-none mb-0.5">Antigravity AI</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Motor de Inteligencia Central</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Estado</span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                Sistemas Optimizados
              </span>
            </div>
          </div>
          <button className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {/* Chat Section — Centered and Wide */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-5xl h-full flex flex-col bg-white rounded-3xl border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <StudioChat 
              projectId="antigravity-global"
              projectFiles={{}}
              onCodeGenerated={() => {}}
              persona="antigravity"
            />
          </div>
        </div>

        {/* Floating Features Indicator */}
        <div className="absolute bottom-10 left-10 hidden xl:flex flex-col gap-3 pointer-events-none">
          <FeatureBadge icon={Zap} label="Procesamiento Ultra-rápido" />
          <FeatureBadge icon={Shield} label="Privacidad Empresarial" />
          <FeatureBadge icon={Star} label="Modelos Premium" />
        </div>
      </main>
    </div>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-zinc-200/50 shadow-sm"
    >
      <div className="w-6 h-6 rounded-lg bg-zinc-50 flex items-center justify-center">
        <Icon className="w-3 h-3 text-zinc-400" />
      </div>
      <span className="text-[11px] font-bold text-zinc-500 tracking-tight">{label}</span>
    </motion.div>
  );
}
