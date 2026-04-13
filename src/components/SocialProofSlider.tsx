import React from 'react';
import { motion } from 'framer-motion';

const SocialProofSlider = () => (
  <div className="py-12 bg-zinc-50 border-y border-zinc-100 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 mb-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
      Con la confianza de +10,000 creadores
    </div>
    <motion.div 
      animate={{ x: [0, -1000] }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      className="flex gap-12 items-center grayscale opacity-50 whitespace-nowrap"
    >
      {[1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8].map((i) => (
        <span key={i} className="text-2xl font-black italic text-zinc-900 px-4">BRAND_{i}</span>
      ))}
    </motion.div>
  </div>
);

export default SocialProofSlider;
