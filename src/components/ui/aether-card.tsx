import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AetherCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'iridescent' | 'outline';
  glow?: boolean;
}

export function AetherCard({ 
  children, 
  className, 
  variant = 'glass', 
  glow = false,
  ...props 
}: AetherCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'rounded-3xl p-6 transition-all duration-300',
        variant === 'glass' && 'aether-glass',
        variant === 'iridescent' && 'aether-glass aether-iridescent',
        variant === 'outline' && 'bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300',
        glow && 'neural-pulse',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
