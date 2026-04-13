import React from 'react';
import { 
  CreditCard, Zap, CheckCircle2, AlertCircle, 
  ArrowUpRight, Info, History, ShieldCheck,
  TrendingUp, Globe, Code2, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanCardProps {
  title: string;
  price: string;
  billing: string;
  credits: string;
  features: PlanFeature[];
  active?: boolean;
}

function PlanCard({ title, price, billing, credits, features, active }: PlanCardProps) {
  return (
    <div className={cn(
      "relative p-6 rounded-[2.5rem] bg-white/[0.02] border transition-all flex flex-col h-full",
      active ? "border-primary/40 bg-primary/[0.02]" : "border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03]"
    )}>
      {active && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-[9px] font-black uppercase tracking-widest text-black">
          Plan Actual
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-[12px] font-black text-white/40 uppercase tracking-[0.25em] mb-4">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">{price}</span>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{billing}</span>
        </div>
        <p className="mt-2 text-[11px] font-bold text-primary tracking-widest uppercase">{credits} créditos al mes</p>
      </div>

      <div className="flex-1 space-y-3 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            {f.included ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-white/10 shrink-0" />
            )}
            <span className={cn("text-[11px] font-medium", f.included ? "text-white/60" : "text-white/20 line-through")}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      <button className={cn(
        "w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
        active 
          ? "bg-white/5 text-white/20 cursor-default" 
          : "bg-white text-black hover:scale-105 active:scale-95 shadow-xl"
      )}>
        {active ? 'Plan Activo' : 'Mejorar Plan'}
      </button>
    </div>
  );
}

export function StudioBilling() {
  const creditsUsed = 45.5;
  const creditsTotal = 150;
  const usedPercent = (creditsUsed / creditsTotal) * 100;

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto h-full overflow-y-auto no-scrollbar pb-32">
      {/* ── Visual Credit Bar ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-black text-white tracking-widest uppercase mb-1">Créditos del Workspace</h2>
            <p className="text-[11px] text-white/40 leading-relaxed max-w-md">
              Los créditos se consumen según la complejidad de las peticiones. 
              El modo Plan consume menos que el modo Agente de construcción.
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-white">{Math.floor(creditsTotal - creditsUsed)}</span>
            <span className="text-[12px] font-bold text-white/20 uppercase tracking-widest ml-2">Restantes</span>
          </div>
        </div>

        <div className="relative h-4 rounded-full bg-white/[0.05] border border-white/[0.03] overflow-hidden p-0.5">
          <div 
            className="h-full rounded-full bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] transition-all duration-1000 ease-out"
            style={{ width: `${usedPercent}%` }}
          />
          {/* Tooltip Indicators */}
          <div className="absolute top-0 left-0 h-full flex px-4 items-center">
            <div className="text-[8px] font-black text-black/40 uppercase tracking-widest">
              Usage: {usedPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Uso Mensual', val: '45.5', icon: History, sub: 'Créditos consumidos' },
            { label: 'Daily Roll', val: '5.0', icon: Zap, sub: 'Reset diario (Medianoche UTC)' },
            { label: 'Próximo Reset', val: '22 Días', icon: TrendingUp, sub: '28 de Abril, 2026' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] flex items-center gap-4 group hover:bg-white/[0.04] transition-all">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                <s.icon className="h-4 w-4 text-white/40 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <div className="text-[18px] font-black text-white">{s.val}</div>
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing Tables ─────────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-[14px] font-black text-white tracking-widest uppercase">Evoluciona tu Arquitectura</h2>
          <p className="text-[11px] text-zinc-500 max-w-lg mx-auto">
            Sube de nivel para acceder a dominios personalizados, el modo Código y orquestación ilimitada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard 
            title="Free tier"
            price="$0"
            billing="COP/mes"
            credits="5"
            features={[
              { text: '5 Créditos iniciales', included: true },
              { text: 'Colaboración básica', included: true },
              { text: 'Proyectos privados', included: true },
              { text: 'Dominios Custom', included: false },
              { text: 'Code Mode', included: false },
            ]}
          />
          <PlanCard 
            active
            title="Creador"
            price="$149k"
            billing="COP/mes"
            credits="1.000"
            features={[
              { text: '1.000 Créditos / Mes', included: true },
              { text: 'Studio creativo con IA', included: true },
              { text: 'Acceso modelos rápidos', included: true },
              { text: 'Soporte por chat', included: true },
              { text: 'Exportación avanzada', included: false },
            ]}
          />
          <PlanCard 
            title="Pro"
            price="$349k"
            billing="COP/mes"
            credits="3.000"
            features={[
              { text: '3.000 Créditos / Mes', included: true },
              { text: 'Modelos Premium (GPT-4)', included: true },
              { text: 'Generación Prioritaria', included: true },
              { text: 'Soporte Prioritario', included: true },
              { text: 'Opt-out Training', included: true },
            ]}
          />
        </div>
      </section>

      {/* ── One-time Top-ups ─────────────────────────────────────────────── */}
      <section className="p-8 rounded-[3rem] bg-gradient-to-br from-primary/10 to-purple-500/10 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Zap className="h-40 w-40 text-primary" />
        </div>
        
        <div className="relative z-10 space-y-6 max-w-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 mb-4">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Inyección de Emergencia</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter leading-none mb-3">¿Te quedaste sin créditos?</h2>
            <p className="text-[12px] text-white/60 leading-relaxed font-medium">
              Compra paquetes de créditos únicos para mantener tu orquestación activa. 
              Válidos por 12 meses desde la compra.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[50, 100, 500].map(amt => (
              <button key={amt} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all text-left group/btn">
                <div className="text-xl font-black text-white">{amt}</div>
                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Créditos</div>
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform">
            Ver políticas de facturación <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </section>
    </div>
  );
}
