import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TestimonialSlider = () => (
  <section className="py-24 px-6 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
      <div className="flex-1 space-y-6">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-primary fill-primary" />)}
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
          Lo que dicen los <span className="text-zinc-400">Pioneros</span>
        </h2>
        <p className="text-zinc-500 text-lg leading-relaxed">
          "Creator IA Pro ha transformado mi flujo de trabajo de días a segundos. No es solo una herramienta, es mi copiloto de ingeniería."
        </p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 rounded-full" />
          <div>
            <p className="font-bold uppercase tracking-widest text-xs">Alex Rivera</p>
            <p className="text-[10px] text-zinc-400 uppercase font-black">Senior Architecht</p>
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <motion.div 
          animate={{ x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="w-full aspect-video bg-zinc-100 rounded-[3rem] border border-zinc-100 shadow-2xl relative z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        </motion.div>
        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary/5 blur-3xl rounded-full" />
      </div>
    </div>
  </section>
);

export default TestimonialSlider;
