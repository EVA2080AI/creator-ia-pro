import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PricingTiers = () => (
  <section className="py-24 px-6 bg-zinc-900 text-white">
    <div className="max-w-7xl mx-auto space-y-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Planes <span className="text-primary">Flexibles</span></h2>
        <p className="text-zinc-500">Escala a tu propio ritmo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: 'Starter', price: '$0', features: ['1 Workspace', 'AI Básica', 'Comunidad'] },
          { name: 'Pro', price: '$29', features: ['Workspaces Ilimitados', 'AI Avanzada', 'Soporte 24/7'], highlight: true },
          { name: 'Enterprise', price: 'Custom', features: ['Seguridad Grado Militar', 'SLA Garantizado', 'Manager Dedicado'] },
        ].map((plan, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.02 }}
            className={`p-10 rounded-[3rem] border ${plan.highlight ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-white/5 bg-white/[0.02]'} flex flex-col justify-between h-full`}
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{plan.name}</p>
                <h3 className="text-4xl font-black italic tracking-tighter">{plan.price}</h3>
              </div>
              <ul className="space-y-4">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button className={`mt-10 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${plan.highlight ? 'bg-primary text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
              Seleccionar Plan
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingTiers;
