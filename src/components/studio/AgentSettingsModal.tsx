import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Shield, 
  Info,
  ChevronRight,
  Monitor,
  Database,
  RefreshCw,
  Layout,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAgentPreferences, type AgentSpecialist } from '@/hooks/useAgentPreferences';

interface AgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: AgentSpecialist;
  agentName: string;
}

export function AgentSettingsModal({ isOpen, onClose, agentId, agentName }: AgentSettingsModalProps) {
  const { preferences, updatePreference, loading } = useAgentPreferences();
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load current preferences
  useEffect(() => {
    if (isOpen && preferences) {
      const pref = preferences.find(p => p.agent_id === agentId);
      setInstructions(pref?.instructions || '');
    }
  }, [isOpen, agentId, preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    await updatePreference(agentId, instructions);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const getAgentColor = () => {
    switch (agentId) {
      case 'ux': return 'text-primary border-primary/20 bg-primary/5';
      case 'frontend': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'backend': return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'devops': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
      default: return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
    }
  };

  const getAgentIcon = () => {
    switch (agentId) {
      case 'ux': return <Layout className="w-5 h-5" />;
      case 'frontend': return <Monitor className="w-5 h-5" />;
      case 'backend': return <Database className="w-5 h-5" />;
      case 'devops': return <RefreshCw className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-[#0c0c0c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl border", getAgentColor())}>
              {getAgentIcon()}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Memoria de {agentName}</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Configuración de Especialista</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-400 leading-relaxed font-medium">
              Define instrucciones persistentes para este agente. Genesis consultará esta memoria antes de generar código para asegurar que se ajusta a tus estándares de diseño y arquitectura.
            </p>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
               Instrucciones de Personalidad
             </label>
             <textarea
               value={instructions}
               onChange={(e) => setInstructions(e.target.value)}
               placeholder={`Ejemplo: "Para el Frontend, siempre usa un esquema de colores HSL. Prefiere animaciones sutiles con Framer Motion y utiliza Lucide-react para todos los iconos."`}
               className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-zinc-300 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none font-mono"
             />
          </div>

          <div className="pt-2">
             <div className="flex items-center gap-3 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Seguridad de Datos</span>
             </div>
             <p className="text-[10px] text-zinc-600 leading-relaxed">
               Tus preferencias se almacenan de forma segura en tu perfil de Supabase y solo son accesibles por tus agentes durante las sesiones de generación.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Memoria
          </button>
        </div>
      </motion.div>
    </div>
  );
}
