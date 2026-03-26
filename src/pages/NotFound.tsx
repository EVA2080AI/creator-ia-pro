import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050506] font-sans">
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <h1 className="mb-4 text-9xl font-display text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">404</h1>
        <p className="mb-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Error Crítico: Dirección no encontrada</p>
        <a href="/" className="inline-flex items-center gap-3 px-8 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-white uppercase tracking-[0.2em] hover:bg-[#EC4699] hover:border-[#EC4699] transition-all active:scale-95">
          Reiniciar_Contexto →
        </a>
      </div>
    </div>
  );
};

export default NotFound;
