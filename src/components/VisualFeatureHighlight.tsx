import React from 'react';
import { motion } from 'framer-motion';

const VisualFeatureHighlight = () => (
  <section className="py-24 px-6 bg-zinc-900 text-white overflow-hidden">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
      <div className="flex-1 space-y-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase leading-none">
          Visualización <span className="text-primary italic">Atómica</span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
          Nuestra IA no solo escribe código; esculpe interfaces. Cada componente se genera con una precisión visual que desafía los estándares tradicionales.
        </p>
        <button className="px-10 py-5 bg-white text-zinc-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all text-[11px]">
          Ver Demostración
        </button>
      </div>
      <div className="flex-1 w-full flex items-center justify-center relative">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-80 h-80 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center relative z-10"
        >
          <div className="w-64 h-64 border-4 border-primary/40 rounded-full flex items-center justify-center">
            <div className="w-48 h-48 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl" />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default VisualFeatureHighlight;
