import React from 'react';
import { Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTIONS, DesignSection } from '../constants';

interface DesignSidebarProps {
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export const DesignSidebar: React.FC<DesignSidebarProps> = ({ activeSection, onSectionClick }) => {
  return (
    <aside className="w-72 bg-muted/50 border-r border-border sticky top-0 h-screen hidden lg:flex flex-col p-8">
      <div className="flex items-center gap-3 mb-12">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">Creator IA</span>
          <span className="text-lg font-black text-foreground tracking-tight leading-none">Aether V8.0</span>
        </div>
      </div>

      <nav className="space-y-1">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSectionClick(id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
              activeSection === id
                ? "bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className={cn("h-4 w-4", activeSection === id ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-border">
        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/20">
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <Shield className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Enterprise Ready</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            Aether es un sistema de diseño de alto nivel con enfoque en IA.
          </p>
        </div>
      </div>
    </aside>
  );
};
