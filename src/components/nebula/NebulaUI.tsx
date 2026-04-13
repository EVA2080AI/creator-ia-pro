import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const NebulaButton = ({ 
  children, 
  variant = 'primary', 
  className,
  ...props 
}: any) => {
  const variants = {
    primary: 'bg-nebula-indigo text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]',
    secondary: 'bg-nebula-emerald text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    outline: 'border border-nebula-border bg-white/5 text-white hover:bg-white/10'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'px-6 py-3 rounded-xl font-bold text-sm tracking-tight transition-all duration-300',
        variants[variant as keyof typeof variants],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const NebulaCard = ({ children, className, glow = false }: any) => (
  <div className={cn(
    'bg-nebula-surface border border-nebula-border rounded-3xl p-6 relative overflow-hidden group',
    glow && 'shadow-[0_0_50px_rgba(99,102,241,0.05)]',
    className
  )}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    {children}
  </div>
);

export const NebulaStat = ({ label, value, trend }: any) => (
  <NebulaCard className="space-y-2">
    <p className="text-[10px] font-bold uppercase tracking-widest text-nebula-muted">{label}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-2xl font-black tracking-tighter text-white">{value}</h3>
      {trend && (
        <span className={cn('text-[10px] font-bold', trend > 0 ? 'text-nebula-emerald' : 'text-rose-500')}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  </NebulaCard>
);
