import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BistroButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const BistroButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className,
  ...props 
}: BistroButtonProps) => {
  const variants = {
    primary: 'bg-bistro-gold text-bistro-black hover:bg-bistro-gold-light shadow-xl shadow-bistro-gold/10',
    outline: 'bg-transparent border border-bistro-gold/30 text-bistro-gold hover:border-bistro-gold hover:bg-bistro-gold/5',
    ghost: 'bg-transparent text-bistro-muted hover:text-bistro-white hover:bg-white/5'
  };

  const sizes = {
    sm: 'px-6 py-2.5 text-[10px]',
    md: 'px-8 py-4 text-xs',
    lg: 'px-10 py-5 text-sm'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-2xl font-black uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : 'w-auto',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const BistroCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(
    'bg-bistro-surface border border-bistro-zinc/50 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl',
    className
  )} {...props}>
    {children}
  </div>
);
