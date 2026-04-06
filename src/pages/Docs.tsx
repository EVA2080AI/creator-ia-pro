import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Book, 
  Zap, 
  Terminal, 
  Shield, 
  Cpu, 
  Globe, 
  ArrowLeft, 
  ChevronRight,
  Sparkles,
  Code,
  Layout,
  Database
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Docs = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'cycles',
      title: 'Neural Cycles',
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <p className="text-zinc-400 leading-relaxed">
            Los Neural Cycles son la unidad fundamental de cómputo en el ecosistema Genesis. Cada acción realizada por la IA —desde la generación de código hasta el despliegue en la nube— consume una cantidad específica de ciclos dependiendo de la complejidad del razonamiento requerido.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-[10px]">Generación Base</h4>
              <p className="text-zinc-500 text-sm">1-5 Ciclos por iteración de código estándar.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-[10px]">Deep Reasoning</h4>
              <p className="text-zinc-500 text-sm">10-20 Ciclos para arquitecturas complejas y auto-corrección.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h4 className="text-primary font-black uppercase tracking-[0.2em] text-xs">Protección de Activos</h4>
            </div>
            <p className="text-zinc-400 text-sm">
              Si una operación falla debido a errores del sistema, los créditos son reembolsados automáticamente a tu Neural Vault.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'studio',
      title: 'Genesis Studio',
      icon: <Layout className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <p className="text-zinc-400 leading-relaxed">
            El Studio es tu comando central. Combina un IDE de alto rendimiento con un orquestador de IA que entiende el contexto completo de tu proyecto.
          </p>
          
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="mt-1"><Code className="w-4 h-4 text-primary" /></div>
              <div>
                <h5 className="text-white font-bold text-sm">Arquitectura Live-Sync</h5>
                <p className="text-zinc-500 text-sm italic">Cualquier cambio generado por la IA se refleja instantáneamente en el sistema de archivos y en el preview.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="mt-1"><Terminal className="w-4 h-4 text-primary" /></div>
              <div>
                <h5 className="text-white font-bold text-sm">Auto-Diagnostic Terminal</h5>
                <p className="text-zinc-500 text-sm italic">El sistema detecta errores de runtime y propone soluciones autónomas antes de que las notes.</p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'deployment',
      title: 'Despliegues Cloud',
      icon: <Globe className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <p className="text-zinc-400 leading-relaxed">
            Lanza tus aplicaciones a producción con un solo clic. Genesis se encarga de la infraestructura, el SSL y la optimización de activos.
          </p>
          
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4"><Database className="w-12 h-12 text-white/5" /></div>
            <h4 className="text-white font-black text-2xl mb-4 italic uppercase tracking-tighter">Genesis Edge</h4>
            <p className="text-zinc-500 text-sm mb-6">Infraestructura global optimizada para aplicaciones React y Next.js.</p>
            <button className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest">Ver Precios de Hosting</button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans">
      <Helmet><title>Documentation | Genesis IA</title></Helmet>

      {/* Iridescent Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Book className="w-4 h-4 text-primary" />
             </div>
             <h1 className="text-[11px] font-black uppercase tracking-[0.5em]">Neural Documentation</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/studio')} className="px-6 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Regresar al Studio</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-10 py-20 flex gap-20">
        {/* Sidebar Nav */}
        <aside className="w-64 shrink-0 space-y-12">
          <section>
            <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-6">Fundamentos</h2>
            <nav className="space-y-1">
              {sections.map(s => (
                <a 
                  key={s.id} 
                  href={`#${s.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group transition-all"
                >
                  <div className="flex items-center gap-3 text-zinc-400 group-hover:text-white">
                    {s.icon}
                    <span className="text-sm font-bold">{s.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-white" />
                </a>
              ))}
            </nav>
          </section>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5">
             <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Soporte Elite</span>
             </div>
             <p className="text-zinc-500 text-[10px] uppercase tracking-wide leading-relaxed">
                Nuestros ingenieros operan 24/7 en la red neuronal para asistirte.
             </p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl space-y-32">
          <section>
            <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-8 leading-none">
              Navegando el<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Multiverso I.A.</span>
            </h2>
            <p className="text-xl text-zinc-500 leading-relaxed">
              Bienvenido a la documentación oficial de Genesis. Aquí encontrarás todo lo necesario para dominar la orquestación autónoma y el despliegue de sistemas industriales.
            </p>
          </section>

          {sections.map(s => (
            <motion.section 
              key={s.id} 
              id={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary">
                    {s.icon}
                 </div>
                 <h3 className="text-3xl font-black uppercase tracking-tight">{s.title}</h3>
              </div>
              <div className="border-l border-white/10 pl-8 ml-6">
                {s.content}
              </div>
            </motion.section>
          ))}

          <section className="pt-20 border-t border-white/5">
             <div className="text-center space-y-6">
                <Cpu className="w-12 h-12 text-zinc-800 mx-auto" />
                <h3 className="text-lg font-black uppercase tracking-[0.4em]">Fin del Archivo</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto">Genesis IA actualiza esta documentación dinámicamente basándose en la evolución de sus algoritmos.</p>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Docs;
