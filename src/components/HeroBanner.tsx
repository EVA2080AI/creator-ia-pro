import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Zap, Sparkles, Bot, Image, Code2, ChevronRight } from 'lucide-react';

const HeroBanner = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-zinc-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                Plataforma IA #1 en Colombia
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
            >
              <span className="text-white">Crea contenido</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-primary">
                10x más rápido
              </span>
              <br />
              <span className="text-white">con IA</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-zinc-400 max-w-lg leading-relaxed"
            >
              Texto, imágenes y código con GPT-4, Claude y Gemini. Paga en pesos colombianos
              con Bold. Sin tarjeta internacional.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-8"
            >
              <div>
                <div className="text-3xl font-black text-white">50K+</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Creadores</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">1M+</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Generaciones</div>
              </div>
              <div>
                <div className="text-3xl font-black text-primary">4.9</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Rating</div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="group px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                Comenzar Gratis
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Play className="h-4 w-4" />
                Ver Demo
              </button>
            </motion.div>
          </div>

          {/* Right Visual - Interactive Demo Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            {/* Main Interface Mockup */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-50" />

              {/* Browser Frame */}
              <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 rounded-lg bg-zinc-800 text-[10px] text-zinc-500 font-medium">
                      creator-ia.com/studio
                    </div>
                  </div>
                </div>

                {/* App Content */}
                <div className="p-4 space-y-4">
                  {/* Studio Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">C</span>
                      </div>
                      <span className="text-white font-bold text-sm">Genesis Studio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        2,847 créditos
                      </span>
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="space-y-3">
                    {/* AI Message */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-2 bg-zinc-800/50 rounded-2xl rounded-tl-sm p-3">
                        <div className="h-2 w-3/4 bg-zinc-700 rounded" />
                        <div className="h-2 w-full bg-zinc-700 rounded" />
                        <div className="h-2 w-1/2 bg-zinc-700 rounded" />
                      </div>
                    </motion.div>

                    {/* User Message */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 }}
                      className="flex gap-3 justify-end"
                    >
                      <div className="bg-primary/20 rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                        <div className="h-2 w-32 bg-primary/40 rounded" />
                      </div>
                    </motion.div>

                    {/* AI Response with Image */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-3 bg-zinc-800/50 rounded-2xl rounded-tl-sm p-3">
                        <div className="h-2 w-1/2 bg-zinc-700 rounded" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="aspect-square rounded-lg bg-zinc-700/50 border border-zinc-700 flex items-center justify-center">
                            <Image className="h-6 w-6 text-zinc-600" />
                          </div>
                          <div className="aspect-square rounded-lg bg-zinc-700/50 border border-zinc-700 flex items-center justify-center">
                            <Image className="h-6 w-6 text-zinc-600" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Input Area */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                    <div className="flex-1 text-[11px] text-zinc-500">
                      Escribe tu mensaje...
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                        <Image className="h-4 w-4 text-zinc-500" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                        <Code2 className="h-4 w-4 text-zinc-500" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute -left-8 top-1/4 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Modelo</div>
                    <div className="text-xs font-bold text-white">GPT-4 Turbo</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="absolute -right-4 top-8 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Velocidad</div>
                    <div className="text-xs font-bold text-white">Generación 2.3s</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="absolute -right-8 bottom-1/4 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Exportar</div>
                    <div className="text-xs font-bold text-white">Código + Imágenes</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
