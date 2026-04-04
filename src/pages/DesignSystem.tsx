import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Palette, 
  Type, 
  Layout, 
  Component, 
  Box, 
  Shield, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  Github,
  Figma,
  Layers,
  Sparkles,
  MousePointer2
} from 'lucide-react';

const DesignSystem = () => {
  const colors = [
    { name: 'Primary', hex: '#3B82F6', text: 'white', desc: 'Main brand color, used for primary actions.' },
    { name: 'Secondary', hex: '#6366F1', text: 'white', desc: 'Indigo accent used for features and highlights.' },
    { name: 'Success', hex: '#22C55E', text: 'white', desc: 'Used for positive states and confirmations.' },
    { name: 'Warning', hex: '#F59E0B', text: 'white', desc: 'Used for warnings and pending actions.' },
    { name: 'Error', hex: '#EF4444', text: 'white', desc: 'Used for critical errors and deletions.' },
    { name: 'Zinc 900', hex: '#18181B', text: 'white', desc: 'Core text color and dark backgrounds.' },
    { name: 'Zinc 400', hex: '#A1A1AA', text: 'zinc-900', desc: 'Secondary text and disabled states.' },
    { name: 'Zinc 100', hex: '#F4F4F5', text: 'zinc-900', desc: 'Lighter backgrounds and separators.' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Helmet>
        <title>Sistema de Diseño | Creator IA Pro</title>
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <Palette className="h-6 w-6" />
            </div>
            <span className="text-sm font-black tracking-tighter text-zinc-400 uppercase">Creator IA Pro</span>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-4">
            Sistema de Diseño <span className="text-blue-500">Aether V8.0</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
            Una guía completa de los componentes, patrones y estilos que dan vida a la plataforma Creator IA Pro.
            Enfocado en claridad, velocidad y una experiencia de usuario cinematográfica.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 mt-12 space-y-20">
        
        {/* Colors Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Box className="h-5 w-5 text-zinc-400" />
            <h2 className="text-2xl font-bold text-zinc-900">Paleta de Colores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {colors.map((c) => (
              <div key={c.name} className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300">
                <div 
                  className="h-32 w-full flex items-end justify-between p-4" 
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="text-xs font-mono font-bold opacity-80" style={{ color: c.text }}>{c.hex}</span>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center backdrop-blur-md bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MousePointer2 className="h-4 w-4" style={{ color: c.text }} />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-zinc-900 mb-1">{c.name}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Type className="h-5 w-5 text-zinc-400" />
            <h2 className="text-2xl font-bold text-zinc-900">Tipografía</h2>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Headings / Inter Black</span>
              <h1 className="text-5xl font-black text-zinc-900 tracking-tight">The quick brown fox jumps over the lazy dog.</h1>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Body / Inter Medium</span>
              <p className="text-lg text-zinc-600 leading-relaxed max-w-3xl">
                Creator IA Pro utiliza Inter como su sistema tipográfico principal. Una familia sans-serif diseñada para pantallas de alta resolución, ofreciendo una legibilidad excepcional y una personalidad moderna y profesional.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-zinc-100">
              <div>
                <p className="text-4xl font-black text-zinc-900">Aa</p>
                <p className="text-xs text-zinc-400 mt-2">Extra Black / 900</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-zinc-900">Aa</p>
                <p className="text-xs text-zinc-400 mt-2">Bold / 700</p>
              </div>
              <div>
                <p className="text-4xl font-semibold text-zinc-900">Aa</p>
                <p className="text-xs text-zinc-400 mt-2">SemiBold / 600</p>
              </div>
              <div>
                <p className="text-4xl font-medium text-zinc-900">Aa</p>
                <p className="text-xs text-zinc-400 mt-2">Medium / 500</p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Layers className="h-5 w-5 text-zinc-400" />
            <h2 className="text-2xl font-bold text-zinc-900">Botones y Estados</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-8">Botones Primarios</h3>
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                  Primary Button
                </button>
                <button className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                  Dark Button
                </button>
                <button className="px-6 py-2.5 border border-zinc-200 bg-white text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors">
                  Outline Button
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-8">Icon Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
                  <Sparkles className="h-5 w-5" />
                </button>
                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                  <Shield className="h-5 w-5" />
                </button>
                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-50 text-violet-500 hover:bg-violet-100 transition-colors">
                  <Zap className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts & Badges */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle2 className="h-5 w-5 text-zinc-400" />
            <h2 className="text-2xl font-bold text-zinc-900">Alertas y Badges</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-sm">Operación Exitosa</p>
                <p className="text-xs text-emerald-600 mt-1">Los cambios han sido guardados correctamente en la nube.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm">Límite Alcanzado</p>
                <p className="text-xs text-amber-600 mt-1">Has llegado al límite de créditos de tu plan actual.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm">Nueva Versión</p>
                <p className="text-xs text-blue-600 mt-1">Una nueva actualización está disponible para descargar.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-8 mt-32 pt-10 border-t border-zinc-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-zinc-400 font-medium">
            © 2026 Creator IA Pro · Sistema de Diseño Aether
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
              <Github className="h-4 w-4" />
              Repository
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
              <Figma className="h-4 w-4" />
              Figma UI Kit
            </a>
            <a href="#" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
              <ExternalLink className="h-4 w-4" />
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DesignSystem;
