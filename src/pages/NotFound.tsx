import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO, seoPresets } from "@/components/SEO";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <SEO {...seoPresets.notFound} />
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <div className="mb-8 flex justify-center">
          <Logo size="md" showText showPro />
        </div>
        <h1 className="mb-6 text-[10rem] font-black text-foreground/10 tracking-tighter lowercase leading-none">404</h1>
        <p className="mb-10 text-[13px] font-black text-muted-foreground uppercase tracking-[0.25em]">Página no encontrada</p>
        <Link to="/" className="inline-flex items-center gap-4 px-10 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all active:scale-95">
          Ir al inicio →
        </Link>
      </div>
    </div>

  );
};

export default NotFound;
