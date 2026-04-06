import React from 'react';
import { MessageSquare, Sparkles, Send, Plus, Zap, Brain, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ChatSection: React.FC = () => {
  return (
    <section id="chat" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Chat & Inteligencia</h2>
          <p className="text-zinc-500 font-medium">La interfaz de interacción humano-IA de Aether.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Conversation Showcase */}
        <div className="space-y-6 bg-zinc-50 p-8 rounded-[32px] border border-zinc-200">
          {/* User Message */}
          <div className="flex flex-col items-end gap-2 group">
            <div className="bg-zinc-900 text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm font-medium shadow-lg shadow-zinc-900/10 max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-500">
              Propón una arquitectura para un sistema de IA generativa distribuido.
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Tú · 10:05 AM</span>
          </div>

          {/* Assistant Message */}
          <div className="flex flex-col items-start gap-2 group">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-900 tracking-widest">Antigravity AI</span>
            </div>
            <div className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-2">
                <p className="text-sm text-zinc-900 font-bold leading-relaxed">
                  Análisis estratégico completo.
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  He optimizado la arquitectura de tu aplicación siguiendo el patrón <strong className="text-zinc-800">Aether V8.0</strong>. Se han detectado 3 puntos de mejora en la latencia del canvas.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[10px] font-black uppercase hover:bg-black transition-colors">Corregir Errores</button>
                <button className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase hover:bg-zinc-200 transition-colors">Ver Reporte</button>
              </div>
            </div>
          </div>

          {/* Code Block Example */}
          <div className="bg-zinc-900 rounded-2xl p-4 shadow-2xl relative group overflow-hidden border border-white/10">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="text-[9px] font-bold text-white/40 uppercase ml-2 tracking-widest">architecture.py</span>
              </div>
              <button className="text-white/40 hover:text-white transition-colors">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <code className="text-[11px] font-mono leading-relaxed text-zinc-300">
              <span className="text-purple-400">class</span> <span className="text-blue-400">GenAISystem</span>:<br />
              &nbsp;&nbsp;<span className="text-purple-400">async def</span> <span className="text-blue-400">initialize</span>(self):<br />
              &nbsp;&nbsp;&nbsp;&nbsp;self.broker = <span className="text-yellow-400">await</span> Redis.connect()<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400"># Escala workers dinámicamente</span>
            </code>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20" />
          </div>

          {/* Suggestions Chips */}
          <div className="flex flex-wrap gap-2 pt-4">
            {['Optimizar latencia', 'Añadir logs', 'Explicar trade-offs'].map(t => (
              <button key={t} className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-[11px] font-bold text-zinc-500 hover:border-blue-600 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-600/5 transition-all">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="space-y-12">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Barra de Comandos</h3>
            <div className="bg-white rounded-3xl border border-zinc-200 p-3 shadow-xl shadow-zinc-200/50 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center text-zinc-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <input 
                disabled
                placeholder="Escribe un comando inteligente..."
                className="flex-1 bg-transparent text-sm font-medium outline-none text-zinc-900 placeholder:text-zinc-300"
              />
              <div className="flex items-center gap-1.5 pr-1">
                <button className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <Plus className="h-5 w-5" />
                </button>
                <button className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-zinc-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all">
                  Enviar
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Model Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/20 flex items-center gap-4 cursor-pointer hover:bg-blue-600/10 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Gemini 2.0 Flash</p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Default · Fast</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Claude 3.5 Sonnet</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Premium · Reasoning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
