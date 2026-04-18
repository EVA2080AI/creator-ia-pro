import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, Crown, Rocket, Network } from 'lucide-react';

const PLAN_ICON: Record<string, React.ElementType> = {
  Free: Zap,
  Creador: Sparkles,
  Pro: Crown,
  Agencia: Crown,
  Pyme: Rocket,
  Empresarial: Network,
};

const PricingTiers = () => (
  <section className="py-24 px-6 bg-zinc-900 text-white">
    <div className="max-w-7xl mx-auto space-y-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Planes <span className="text-primary">Flexibles</span></h2>
        <p className="text-zinc-500">Escala a tu propio ritmo. Paga en pesos colombianos con Bold.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Free', price: '$0', priceSuffix: '', credits: '5 créditos de por vida', description: 'Para explorar el potencial de la IA.', color: '#64748B', badge: 'Para empezar', features: ['5 créditos totales', 'Studio creativo básico', 'Modelos estándar', 'Soporte comunitario'] },
          { name: 'Creador', price: '$149.900', priceSuffix: 'COP/mes', credits: '1.000 créditos/mes', description: 'Todo lo que necesitas para empezar.', color: '#94A3B8', badge: null, features: ['1.000 créditos mensuales', 'Studio creativo con IA', 'Modelos rápidos ilimitados', 'Soporte por chat'] },
          { name: 'Pro', price: '$349.900', priceSuffix: 'COP/mes', credits: '3.000 créditos/mes', description: 'Para creadores que publican a diario.', color: '#6366F1', badge: 'Más popular', highlight: true, features: ['3.000 créditos mensuales', 'Modelos premium (GPT-4, Claude)', 'Generación prioritaria', 'Múltiples chats simultáneos', 'Soporte prioritario'] },
          { name: 'Agencia', price: '$699.900', priceSuffix: 'COP/mes', credits: '8.000 créditos/mes', description: 'Ideal para equipos y agencias.', color: '#F59E0B', badge: 'Acceso total', features: ['8.000 créditos mensuales', 'Suite completa: texto, imágenes, código', 'Todos los modelos de IA', 'Soporte 24/7', 'Facturación directa'] },
          { name: 'Pyme', price: '$1.499.900', priceSuffix: 'COP/mes', credits: '20.000 créditos/mes', description: 'Para negocios sin límites.', color: '#10B981', badge: 'Para negocios', features: ['20.000 créditos mensuales', 'Todo del plan Agencia', 'Usuarios adicionales del equipo', 'Integraciones y API', 'Gerente de cuenta'] },
          { name: 'Empresarial', price: 'A medida', priceSuffix: '', credits: 'Créditos personalizados', description: 'Solución para grandes organizaciones.', color: '#A855F7', badge: null, features: ['Volumen a la medida', 'Infraestructura dedicada', 'SLA personalizado', 'Soporte enterprise', 'Facturación corporativa NIT'] },
        ].map((plan, i) => {
          const Icon = PLAN_ICON[plan.name] || Zap;
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`relative p-8 rounded-[2.5rem] border flex flex-col justify-between h-full transition-all duration-500 ${
                plan.highlight
                  ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/20'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{plan.name}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black italic tracking-tighter">{plan.price}</h3>
                    {plan.priceSuffix && <span className="text-xs text-zinc-500 font-medium">{plan.priceSuffix}</span>}
                  </div>
                  <p className="text-xs text-primary font-medium">{plan.credits}</p>
                  <p className="text-[11px] text-zinc-500">{plan.description}</p>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-zinc-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-primary/20' : 'bg-white/5'}`}>
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`mt-8 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all ${
                  plan.highlight
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {plan.name === 'Empresarial' ? 'Contactar' : 'Seleccionar Plan'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default PricingTiers;
