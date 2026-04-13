import React from 'react';
import { motion } from 'framer-motion';
import { Code, Globe, Cpu, Layout } from 'lucide-react';

const FeaturesGrid = () => (
  <section className="py-24 px-6 bg-zinc-50">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Capacidades del <span className="text-primary">Ecosistema</span></h2>
        <p className="text-zinc-500 max-w-xl mx-auto">Tecnología de punta orquestada para el máximo rendimiento creativo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: 'Neural Engine', desc: 'Procesamiento de lenguaje natural avanzado.', icon: Cpu },
          { title: 'Atomic Layouts', desc: 'Diseños que se adaptan a cualquier resolución.', icon: Layout },
          { title: 'Global Deploy', desc: 'Publicación instantánea en el borde (Edge).', icon: Globe },
          { title: 'Clean Code', desc: 'Código estructurado para escalabilidad infinita.', icon: Code },
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -8 }}
            className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 uppercase tracking-tighter">{item.title}</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesGrid;
