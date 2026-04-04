import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Palette, 
  Type, 
  Layout, 
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
  MousePointer2,
  MessageSquare,
  Send,
  Bot,
  User,
  Settings,
  CreditCard,
  Users,
  Bell,
  Monitor,
  Code,
  Command,
  Search,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Eye,
  Trash2,
  ArrowUpRight,
  GitBranch,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DesignSystem = () => {
  const [activeSection, setActiveSection] = useState('colors');

  const sections = [
    { id: 'colors', label: 'Colores', icon: Palette },
    { id: 'typography', label: 'Tipografía', icon: Type },
    { id: 'buttons', label: 'Botones', icon: MousePointer2 },
    { id: 'forms', label: 'Formularios', icon: Layout },
    { id: 'chat', label: 'Chat & IA', icon: MessageSquare },
    { id: 'navigation', label: 'Navegación', icon: Layers },
    { id: 'feedback', label: 'Feedback', icon: Zap },
    { id: 'layout', label: 'Estructuras', icon: Box },
  ];

  const colors = [
    { name: 'Primary (Action)', hex: '#3B82F6', text: 'white', desc: 'Main brand color, used for primary actions.' },
    { name: 'Secondary (Logic)', hex: '#6366F1', text: 'white', desc: 'Indigo accent used for features and highlights.' },
    { name: 'Accent (Growth)', hex: '#A855F7', text: 'white', desc: 'Purple accent used for AI and premium features.' },
    { name: 'Success', hex: '#10B981', text: 'white', desc: 'Used for positive states and confirmations.' },
    { name: 'Warning', hex: '#F59E0B', text: 'white', desc: 'Used for warnings and pending actions.' },
    { name: 'Error', hex: '#EF4444', text: 'white', desc: 'Used for critical errors and deletions.' },
    { name: 'Zinc 950', hex: '#09090B', text: 'white', desc: 'Deep background for cards and overlays.' },
    { name: 'Zinc 100', hex: '#F4F4F5', text: 'zinc-900', desc: 'Lighter backgrounds and separators.' },
  ];

  // Helper for scrolling
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

      {/* ════════════════════ SIDEBAR NAV ════════════════════ */}
      <aside className="w-72 bg-zinc-50 border-r border-zinc-200 sticky top-0 h-screen hidden lg:flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">Creator IA</span>
            <span className="text-lg font-black text-zinc-900 tracking-tight leading-none">Aether V8.0</span>
          </div>
        </div>

        <nav className="space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeSection === id 
                  ? "bg-white text-primary shadow-sm border border-zinc-200" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              )}
            >
              <Icon className={cn("h-4 w-4", activeSection === id ? "text-primary" : "text-zinc-400")} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-zinc-200">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Enterprise Ready</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              Aether está diseñado para aplicaciones de clase mundial con enfoque en IA.
            </p>
          </div>
        </div>
      </aside>

      {/* ════════════════════ MAIN CONTENT ════════════════════ */}
      <main className="flex-1 min-w-0 bg-white">
        
        {/* Hero Section */}
        <header className="px-8 lg:px-20 py-20 bg-zinc-50 border-b border-zinc-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[120px]" />
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-500 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-5xl relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 transition-transform hover:scale-105 cursor-pointer">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Actualización 2026</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-zinc-900 tracking-tighter mb-8 leading-[0.9]">
              Diseñando el <br />
              <span className="text-primary italic">Futuro del Software.</span>
            </h1>
            <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed font-medium">
              Aether V8.0 es un lenguaje visual unificado de alta fidelidad, optimizado para flujos de trabajo de IA, colaboración en tiempo real y experiencias de usuario premium.
            </p>
          </div>
        </header>

        <div className="px-8 lg:px-20 py-24 space-y-32 max-w-6xl">
          
          {/* Section: Colors */}
          <section id="colors" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Paleta Semántica</h2>
                <p className="text-zinc-500 font-medium">Colores cuidadosamente curados para cada función.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {colors.map((c) => (
                <div key={c.name} className="group flex flex-col rounded-2xl border border-zinc-200 hover:shadow-2xl hover:shadow-zinc-200 transition-all duration-500 overflow-hidden">
                  <div className="h-32 w-full p-4 flex flex-col justify-between" style={{ backgroundColor: c.hex }}>
                    <div className="flex justify-between items-start">
                      <div className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/20">
                        <span className="text-[10px] font-black text-white uppercase">{c.hex}</span>
                      </div>
                      <button className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-white flex-1">
                    <h3 className="font-bold text-zinc-900 mb-1">{c.name}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Chat & IA */}
          <section id="chat" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Chat & Inteligencia</h2>
                <p className="text-zinc-500 font-medium">La interfaz de interacción humano-IA de Aether.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* Conversation Showcase */}
              <div className="space-y-6 bg-zinc-50 p-8 rounded-[32px] border border-zinc-200">
                {/* User Message */}
                <div className="flex flex-col items-end gap-2 group">
                  <div className="bg-zinc-900 text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm font-medium shadow-lg shadow-zinc-900/10 max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-500">
                    Propón una arquitectura para un sistema de IA generativa distribuido.
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Tú · 10:05 AM</span>
                </div>

                {/* Assistant Message */}
                <div className="flex flex-col items-start gap-2 group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-900 tracking-widest">Genesis AI</span>
                  </div>
                  <div className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      Para un sistema distribuido, recomendaría un enfoque de <strong className="text-zinc-900">Micro-agentes</strong> utilizando:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Broker de mensajes RabbitMQ o Redis.
                      </li>
                      <li className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Workers escalables en Kubernetes.
                      </li>
                    </ul>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase hover:bg-zinc-200 transition-colors">Ver Diagrama</button>
                      <button className="px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase hover:bg-primary/10 transition-colors">Copiar Implementación</button>
                    </div>
                  </div>
                </div>

                {/* Code Block Example */}
                <div className="bg-zinc-900 rounded-2xl p-4 shadow-2xl relative group overflow-hidden border border-white/10">
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                      <span className="text-[9px] font-bold text-white/40 uppercase ml-2 tracking-widest">architecture.py</span>
                    </div>
                    <button className="text-white/40 hover:text-white transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <code className="text-[11px] font-mono leading-relaxed text-zinc-300">
                    <span className="text-purple-400">class</span> <span className="text-blue-400">GenAISystem</span>:<br />
                    &nbsp;&nbsp;<span className="text-purple-400">async def</span> <span className="text-blue-400">initialize</span>(self):<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;self.broker = <span className="text-yellow-400">await</span> Redis.connect()<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400"># Escala workers dinámicamente</span>
                  </code>
                  {/* Glow effect */}
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary rounded-full blur-[80px] opacity-20" />
                </div>

                {/* Suggestions Chips */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {['Optimizar latencia', 'Añadir logs', 'Explicar trade-offs'].map(t => (
                    <button key={t} className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-[11px] font-bold text-zinc-500 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/5 transition-all">
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Area */}
              <div className="space-y-12">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Barra de Comandos</h3>
                  <div className="bg-white rounded-3xl border border-zinc-200 p-3 shadow-xl shadow-zinc-200/50 flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center text-zinc-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <input 
                      disabled
                      placeholder="Escribe un comando inteligente..."
                      className="flex-1 bg-transparent text-sm font-medium outline-none text-zinc-900 placeholder:text-zinc-300"
                    />
                    <div className="flex items-center gap-1.5 pr-1">
                      <button className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-colors">
                        <Plus className="h-5 w-5" />
                      </button>
                      <button className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-zinc-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all">
                        Enviar
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Model Selection</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Gemini 2.0 Flash</p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-wider">Default · Fast</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-zinc-200 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Claude 3.5 Sonnet</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Premium · Reasoning</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Forms & Inputs */}
          <section id="forms" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Layout className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Formularios & Controles</h2>
                <p className="text-zinc-500 font-medium">Inputs responsivos y estados de interacción.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Label Estándar</label>
                  <input 
                    type="text"
                    placeholder="Ingrese su nombre..."
                    className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Búsqueda con Icono</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input 
                      type="text"
                      placeholder="Buscar en el sistema..."
                      className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-zinc-400 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <Bell className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Notificaciones</span>
                  </div>
                  <button className="h-6 w-11 rounded-full bg-primary relative transition-colors">
                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Layers className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Modo Desarrollador</span>
                  </div>
                  <button className="h-6 w-11 rounded-full bg-zinc-200 relative transition-colors">
                    <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Navigation & Sidebars */}
          <section id="navigation" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Navegación & Paneles</h2>
                <p className="text-zinc-500 font-medium">Sistemas de acceso y organización de herramientas.</p>
              </div>
            </div>

            <div className="space-y-12">
              {/* Global Sidebar Documentation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">Patrón Global</div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Sidebar Principal (Global)</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    Utilizada en la raíz de la aplicación para navegación macro. Diseñada para ser minimalista, con iconos Lucide y estados activos en la marca principal.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Ancho estándar: 280px (Expandido) / 80px (Colapsado)
                    </li>
                    <li className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Fondo: Zinc 50 con bordes Zinc 200
                    </li>
                  </ul>
                </div>
                {/* Mock Visual */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 overflow-hidden">
                  <div className="w-48 bg-white border border-zinc-200 rounded-xl shadow-sm p-4 space-y-4 font-sans">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-primary rounded shadow-sm flex items-center justify-center text-[10px] text-white">C</div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-900">Creator IA</span>
                    </div>
                    {[
                      { l: 'Dashboard', i: Layout, a: true },
                      { l: 'Studio', i: Code, a: false },
                      { l: 'Assets', i: Box, a: false },
                    ].map((item, i) => (
                      <div key={i} className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold",
                        item.a ? "bg-primary/5 text-primary border border-primary/10" : "text-zinc-400"
                      )}>
                        <item.i className="h-3.5 w-3.5" />
                        {item.l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Bar & Inner Sidebar (IDE Pattern) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-12 border-t border-zinc-100">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest">Patrón IDE</div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Barra de Actividad & Paneles de Dev</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    Sistemas densos optimizados para el editor de código. Incluye la barra vertical de iconos y el nuevo panel de utilidades derecho.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white">
                      <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-2">Panel de Control de Versiones</h4>
                      <p className="text-[11px] text-zinc-500 mb-3">Refactorizado para ser un menú de lista con iconos integrados:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-50 border border-zinc-100 text-zinc-600">
                          <Github className="h-3 w-3" />
                          <span className="text-[10px] font-bold">Sync GitHub</span>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 text-zinc-400">
                          <Monitor className="h-3 w-3" />
                          <span className="text-[10px] font-bold">Publicar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Visual Mock of Activity Bar */}
                <div className="bg-zinc-900 rounded-[32px] p-8 flex justify-center items-center shadow-2xl relative overflow-hidden">
                  <div className="flex gap-4 items-stretch h-64">
                    {/* Activity Bar Mock */}
                    <div className="w-[48px] bg-zinc-800/50 backdrop-blur-md rounded-2xl flex flex-col items-center py-4 gap-4 border border-white/5">
                      {[Code, Search, GitBranch, Package].map((I, i) => (
                        <div key={i} className={cn("text-zinc-600", i === 0 && "text-white")}>
                          <I className="h-5 w-5" />
                        </div>
                      ))}
                    </div>
                    {/* Inner Content Placeholder */}
                    <div className="w-32 bg-white rounded-2xl border border-white/10 p-4">
                      <div className="h-2 w-[60%] bg-zinc-100 rounded mb-4" />
                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-zinc-50 rounded" />
                        <div className="h-1.5 w-[80%] bg-zinc-50 rounded" />
                        <div className="h-1.5 w-full bg-zinc-50 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Typography */}
          <section id="typography" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Type className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Voz & Branding</h2>
                <p className="text-zinc-500 font-medium">Tipografía Inter para una claridad absoluta.</p>
              </div>
            </div>

            <div className="space-y-16 bg-white border border-zinc-200 p-12 rounded-[40px] shadow-sm">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">H1 / Inter Black</span>
                <h1 className="text-7xl font-black text-zinc-900 tracking-tight leading-[0.9]">Transformamos ideas en productos digitales.</h1>
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">H2 / Inter Bold</span>
                <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">El mejor editor para desarrolladores de IA.</h2>
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Body / Inter Medium</span>
                <p className="text-xl text-zinc-500 leading-relaxed max-w-4xl font-medium">
                  En Creator IA Pro, creemos que el diseño es la inteligencia hecha invisible. Cada píxel debe servir a un propósito, eliminando la fricción entre el pensamiento y la ejecución técnica.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Buttons */}
          <section id="buttons" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <MousePointer2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Interacciones Primarias</h2>
                <p className="text-zinc-500 font-medium">Botones táctiles con respuestas dinámicas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="p-10 rounded-[32px] bg-zinc-50 border border-zinc-200 space-y-10">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Main Actions</h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-900/20">
                      Explorar Proyectos
                    </button>
                    <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-primary-dark transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
                      Crear App
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Outline & Subtle</h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-8 py-4 border-2 border-zinc-900 text-zinc-900 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all">
                      Documentación
                    </button>
                    <button className="px-8 py-4 bg-white border border-zinc-200 text-zinc-500 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-zinc-50 transition-all">
                      Ajustes
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-10 rounded-[32px] border border-zinc-200 space-y-10">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Floating Toolbars</h3>
                  <div className="inline-flex items-center gap-1.5 p-2 bg-white rounded-2xl border border-zinc-200 shadow-2xl">
                    {[Sparkles, Layers, Box, Monitor, Send].map((Icon, i) => (
                      <button key={i} className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                        i === 0 ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                      )}>
                        <Icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Icon Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 font-bold text-xs">
                      <div className="h-6 w-6 rounded-lg bg-violet-200/50 flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                      </div>
                      Generative Pack
                    </div>
                    <div className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 font-bold text-xs">
                      <div className="h-6 w-6 rounded-lg bg-amber-200/50 flex items-center justify-center">
                        <Shield className="h-4 w-4" />
                      </div>
                      Secured API
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Feedback & Skeletons */}
          <section id="feedback" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Feedback & Estados</h2>
                <p className="text-zinc-500 font-medium">Comunicando el estado del sistema con claridad.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Alert Card Progress */}
              <div className="p-8 rounded-[32px] bg-zinc-900 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Server Status</span>
                  </div>
                  <h4 className="text-xl font-bold mb-1">Optimizando Activos</h4>
                  <p className="text-xs text-white/40 mb-6">Procesando modelos de IA en paralelo...</p>
                  <div className="space-y-4">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[65%] bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white opacity-40 uppercase tracking-widest">65% Completado</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Running</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
              </div>

              {/* Profile Skeleton */}
              <div className="p-8 rounded-[32px] border border-zinc-200 bg-white space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-100 animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-[40%] bg-zinc-100 rounded-lg animate-pulse" />
                    <div className="h-3 w-[60%] bg-zinc-50 rounded-lg animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-24 w-full bg-zinc-50 rounded-2xl animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-zinc-50 rounded-xl animate-pulse" />
                    <div className="h-10 bg-zinc-50 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Toast Example Showcase */}
              <div className="p-8 rounded-[32px] bg-zinc-50 border border-zinc-200 flex flex-col justify-center gap-4">
                <button 
                  onClick={() => toast.success('Proyecto guardado', { description: 'Los cambios se sincronizaron con éxito.' })}
                  className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase text-zinc-900 tracking-widest hover:border-primary transition-all shadow-sm"
                >
                  Probar Toast Éxito
                </button>
                <button 
                  onClick={() => toast.error('Error de Conexión', { description: 'No se pudo comunicar con el servidor AI.' })}
                  className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase text-zinc-900 tracking-widest hover:border-red-500 transition-all shadow-sm"
                >
                  Probar Toast Error
                </button>
                <button 
                  onClick={() => toast.info('Nueva Versión', { description: 'Aether V8.0 está lista para explorar.' })}
                  className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase text-zinc-900 tracking-widest hover:border-blue-500 transition-all shadow-sm"
                >
                  Probar Toast Info
                </button>
              </div>
            </div>
          </section>

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
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors flex items-center gap-1">Docs <ArrowUpRight className="h-3 w-3" /></a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors flex items-center gap-1">Github <Github className="h-3 w-3" /></a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors flex items-center gap-1">Figma <Figma className="h-3 w-3" /></a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Legal</h5>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors">Privacidad</a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors">Términos</a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors">Licencia</a></li>
                </ul>
              </div>
              <div className="space-y-6 hidden sm:block">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Comunidad</h5>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors">Discord</a></li>
                  <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors">Twitter</a></li>
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
};

// Internal icon import mock if needed
const Brain = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.23 4.326 4.326 0 0 0 8.003 0 4 4 0 0 0 .52-8.23 4 4 0 0 0-2.526-5.77A3 3 0 0 0 12 5Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.52 8.23 4.326 4.326 0 0 1-8.003 0 4 4 0 0 1-.52-8.23 4 4 0 0 1 2.526-5.77A3 3 0 0 1 12 5Z" />
    <path d="M12 13v8" />
    <path d="M9 17h6" />
  </svg>
);

export default DesignSystem;
