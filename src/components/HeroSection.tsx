import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Bot, Code2 } from 'lucide-react';

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center py-24 px-6 overflow-hidden bg-white">
    {/* Background Gradient Effects */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/8 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:4s]" />
    </div>

    {/* Grid Pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

    <div className="max-w-7xl mx-auto text-center relative z-10">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200 mb-8"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-black uppercase tracking-widest text-zinc-600">Potenciado por IA</span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[-0.04em] text-zinc-900 mb-6 leading-[0.95]"
      >
        Crea con IA,
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 italic">sin límites.</span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        La plataforma definitiva para creadores. Genera texto, imágenes y código con los modelos más avanzados.
        Paga en pesos colombianos, sin complicaciones.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
      >
        <button className="group px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">
          <Zap className="h-4 w-4 text-primary" />
          Comenzar Gratis
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="px-8 py-4 bg-white text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs border border-zinc-200 hover:bg-zinc-50 transition-all active:scale-95">
          Ver Demo
        </button>
      </motion.div>

      {/* Visual Banner / Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative max-w-5xl mx-auto"
      >
        {/* Browser Frame */}
        <div className="rounded-3xl bg-zinc-100 border border-zinc-200 p-3 sm:p-4 shadow-2xl shadow-zinc-900/10">
          {/* Browser Header */}
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1.5 rounded-lg bg-white border border-zinc-200 text-[10px] text-zinc-400 font-medium">
                creator-ia.com/studio
              </div>
            </div>
          </div>

          {/* App Preview */}
          <div className="rounded-2xl bg-zinc-900 overflow-hidden">
            {/* Studio Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-[10px] font-bold">C</div>
                <span className="text-xs font-bold text-white hidden sm:inline">Genesis Studio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <Bot className="h-3 w-3" />
                  <span className="hidden sm:inline">GPT-4 Turbo</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-primary/20 text-[10px] font-bold text-primary">
                  2.847 créditos
                </div>
              </div>
            </div>

            {/* Studio Content */}
            <div className="grid grid-cols-12 gap-0">
              {/* Sidebar */}
              <div className="hidden sm:flex col-span-2 flex-col items-center py-6 gap-4 border-r border-white/5">
                <Bot className="h-5 w-5 text-white" />
                <Code2 className="h-5 w-5 text-zinc-600" />
                <Zap className="h-5 w-5 text-zinc-600" />
              </div>

              {/* Chat Area */}
              <div className="col-span-12 sm:col-span-10 p-4 sm:p-6 space-y-4">
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-48 bg-zinc-700 rounded" />
                    <div className="h-2 w-64 bg-zinc-700 rounded" />
                    <div className="h-2 w-40 bg-zinc-700 rounded" />
                  </div>
                </div>
                {/* User Message */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-white/5 rounded-2xl px-4 py-2 max-w-sm">
                    <div className="h-2 w-32 bg-zinc-600 rounded" />
                  </div>
                </div>
                {/* Input */}
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                  <div className="h-2 w-full bg-zinc-700 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute -left-4 sm:-left-12 top-1/4 hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-zinc-200 shadow-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Zap className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Generación</p>
            <p className="text-xs font-bold text-zinc-900">10x más rápida</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="absolute -right-4 sm:-right-12 top-1/3 hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-zinc-200 shadow-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Modelos</p>
            <p className="text-xs font-bold text-zinc-900">GPT-4, Claude, Gemini</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
