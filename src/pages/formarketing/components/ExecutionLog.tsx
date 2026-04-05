import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Activity, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  time: string;
  node: string;
  msg: string;
  type: 'info' | 'success' | 'error';
}

export function ExecutionLog({ logs, isOpen, onClose }: { logs: LogEntry[]; isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed bottom-24 right-6 w-96 max-h-[500px] flex flex-col bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl z-40"
        >
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Terminal className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Terminal de Ejecución</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Sincronización Neural</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all font-mono"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center opacity-40">
                <Activity className="h-8 w-8 text-zinc-700 mb-3 animate-pulse" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Esperando instrucciones...</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-1 border-l-2 border-zinc-800 pl-3 py-1 group hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-primary/60 tracking-wider">[{log.node}]</span>
                    <span className="text-[9px] text-zinc-600">{log.time}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    {log.type === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5" />}
                    {log.type === 'error' && <AlertCircle className="h-3 w-3 text-rose-500 mt-0.5" />}
                    <p className={cn(
                      "text-[10px] leading-relaxed",
                      log.type === 'info' && "text-zinc-400",
                      log.type === 'success' && "text-emerald-400/80",
                      log.type === 'error' && "text-rose-400/80"
                    )}>
                      {log.msg}
                    </p>
                  </div>
                </motion.div>
              )).reverse()
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Núcleo Activo</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-700">v9.0.2-fm</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
