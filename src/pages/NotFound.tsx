import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <Helmet><title>Página No Encontrada | Creator IA Pro</title></Helmet>
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <h1 className="mb-6 text-[10rem] font-black text-zinc-200 tracking-tighter lowercase leading-none">404</h1>
        <p className="mb-10 text-[9px] font-black text-zinc-400 uppercase tracking-[0.5em]">Página no encontrada</p>
        <a href="/" className="inline-flex items-center gap-4 px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all active:scale-95">
          Ir al inicio →
        </a>
      </div>
    </div>

  );
};

export default NotFound;
