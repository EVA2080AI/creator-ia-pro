import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => (
  <section className="relative py-24 px-6 overflow-hidden bg-white">
    <div className="max-w-7xl mx-auto text-center relative z-10">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl font-black tracking-tighter text-zinc-900 mb-6"
      >
        Diseño Simple, <span className="text-primary">Impacto Total</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl text-zinc-600 max-w-2xl mx-auto mb-10"
      >
        La plataforma definitiva para creadores que buscan simplicidad sin sacrificar el poder de la IA.
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-4"
      >
        <button className="px-8 py-4 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          Comenzar Gratis
        </button>
        <button className="px-8 py-4 bg-zinc-100 text-zinc-900 rounded-full font-bold hover:bg-zinc-200 transition-all">
          Saber Más
        </button>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
