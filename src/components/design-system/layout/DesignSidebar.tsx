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
    <aside className="w-72 bg-zinc-50 border-r border-zinc-200 sticky top-0 h-screen hidden lg:flex flex-col p-8">
      <div className="flex items-center gap-3 mb-12">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">Creator IA</span>
          <span className="text-lg font-black text-zinc-900 tracking-tight leading-none">Aether V8.0</span>
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
                ? "bg-white text-blue-600 shadow-sm border border-zinc-200" 
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <Icon className={cn("h-4 w-4", activeSection === id ? "text-blue-600" : "text-zinc-400")} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-zinc-200">
        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/20">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Shield className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Enterprise Ready</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
            Aether es un sistema de diseño de alto nivel con enfoque en IA.
          </p>
        </div>
      </div>
    </aside>
  );
};
