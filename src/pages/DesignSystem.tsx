import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Zap, Box, Layers } from 'lucide-react';

// Layout Components
import { DesignSidebar } from '@/components/design-system/layout/DesignSidebar';
import { DesignHero } from '@/components/design-system/layout/DesignHero';

// Section Components
import { ColorSection } from '@/components/design-system/sections/ColorSection';
import { TypographySection } from '@/components/design-system/sections/TypographySection';
import { ButtonSection } from '@/components/design-system/sections/ButtonSection';
import { FormSection } from '@/components/design-system/sections/FormSection';
import { ChatSection } from '@/components/design-system/sections/ChatSection';
import { NavigationSection } from '@/components/design-system/sections/NavigationSection';
import { DataSection } from '@/components/design-system/sections/DataSection';
import { ComponentSection } from '@/components/design-system/sections/ComponentSection';
import { FeedbackSection } from '@/components/design-system/sections/FeedbackSection';
import { IndustrialSection } from '@/components/design-system/sections/IndustrialSection';
import { AtomicSection } from '@/components/design-system/sections/AtomicSection';

// Icons for Footer
import { Github, Figma, ArrowUpRight } from 'lucide-react';

export default function DesignSystem() {
  const [activeSection, setActiveSection] = useState('colors');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Helmet>
        <title>Aether V8.0 | Design System</title>
      </Helmet>

      {/* SIDEBAR NAV */}
      <DesignSidebar activeSection={activeSection} onSectionClick={scrollTo} />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 bg-white">
        
        {/* Hero Section */}
        <DesignHero />

        <div className="px-8 lg:px-20 py-24 space-y-32 max-w-6xl">
          <ColorSection />
          <ChatSection />
          <FormSection />
          <NavigationSection />
          <TypographySection />
          <ButtonSection />
          <DataSection />
          <ComponentSection />
          <IndustrialSection />
          <FeedbackSection />
          <AtomicSection />
        </div>

        {/* Footer Section */}
        <footer className="px-8 lg:px-20 py-20 bg-zinc-50 border-t border-zinc-200">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="h-8 w-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-xl font-black text-zinc-900 tracking-tight">Creator IA Pro</span>
              </div>
              <p className="text-sm text-zinc-500 font-medium max-w-sm">
                Diseñado para fundadores, ingenieros y mentes creativas del mañana.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="space-y-6">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recursos</h5>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors flex items-center gap-1">Docs <ArrowUpRight className="h-3 w-3" /></a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors flex items-center gap-1">Github <Github className="h-3 w-3" /></a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors flex items-center gap-1">Figma <Figma className="h-3 w-3" /></a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Legal</h5>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Privacidad</a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Términos</a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Licencia</a></li>
                </ul>
              </div>
              <div className="space-y-6 hidden sm:block">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Comunidad</h5>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Discord</a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-blue-600 transition-colors">Twitter</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">© 2026 Creator IA Pro · Proudly built with Aether</p>
            <div className="flex items-center gap-2 text-zinc-300">
              <Box className="h-4 w-4" />
              <div className="h-4 w-[1px] bg-zinc-200" />
              <Layers className="h-4 w-4" />
              <div className="h-4 w-[1px] bg-zinc-200" />
              <Zap className="h-4 w-4" />
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
