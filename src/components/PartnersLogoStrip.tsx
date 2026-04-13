import React from 'react';
import { motion } from 'framer-motion';

const PartnersLogoStrip = () => {
  const partners = [
    { name: 'Google', emoji: '🔍' },
    { name: 'Meta', emoji: '♾️' },
    { name: 'Microsoft', emoji: '💻' },
    { name: 'Amazon', emoji: '📦' },
    { name: 'OpenAI', emoji: '🤖' },
    { name: 'Anthropic', emoji: '🌍' },
    { name: 'Vercel', emoji: '▲' },
    { name: 'Supabase', emoji: '⚡' },
  ];

  // Double the list for infinite scroll effect
  const fullPartners = [...partners, ...partners];

  return (
    <section className="py-12 bg-zinc-50 border-y border-zinc-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
          Empoderando a la próxima generación de creadores
        </p>
      </div>

      <div className="relative flex overflow-hidden group">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex whitespace-nowrap min-w-full"
        >
          {fullPartners.map((partner, idx) => (
            <div 
              key={`${partner.name}-${idx}`}
              className="flex items-center gap-2 mx-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
            >
              <span className="text-2xl">{partner.emoji}</span>
              <span className="text-lg font-black tracking-tighter text-zinc-800">{partner.name}</span>
            </div>
          ))}
        </motion.div>
        
        {/* Gradient overlays for smooth fading edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-zinc-50 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-zinc-50 to-transparent z-10" />
      </div>
    </section>
  );
};

export default PartnersLogoStrip;
