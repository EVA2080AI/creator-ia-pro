import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050506] font-sans selection:bg-white/10 selection:text-white">
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <h1 className="mb-6 text-[10rem] font-black text-white/10 tracking-tighter lowercase leading-none">404_</h1>
        <p className="mb-10 text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Critical_Error: _Route_Not_Found</p>
        <a href="/" className="inline-flex items-center gap-4 px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/90 transition-all active:scale-95 shadow-3xl shadow-white/5">
          restart_nexus_node →
        </a>
      </div>
    </div>

  );
};

export default NotFound;
