import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Shield, TrendingUp } from 'lucide-react';

const ValuePropositionGrid = () => (
  <section className="py-24 px-6 bg-white">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        { title: 'Velocidad Neural', desc: 'Generación de código en milisegundos.', icon: Zap },
        { title: 'Seguridad Total', desc: 'Protocolos de cifrado de grado militar.', icon: Shield },
        { title: 'IA Predictiva', desc: 'Anticipa las necesidades de tus usuarios.', icon: Target },
        { title: 'Escalado Real', desc: 'Desde cero a millones sin fricción.', icon: TrendingUp },
      ].map((item, i) => (
        <motion.div 
          key={i}
          whileHover={{ y: -5 }}
          className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 hover:shadow-xl transition-all"
        >
          <item.icon className="w-10 h-10 text-primary mb-6" />
          <h3 className="text-xl font-bold mb-3">{item.title}</h3>
          <p className="text-zinc-600 text-sm leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ValuePropositionGrid;
