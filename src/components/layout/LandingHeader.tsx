import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Sparkles, Code2, Image, 
  CreditCard, BookOpen, ArrowRight, type LucideIcon 
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface NavLink {
  name: string;
  path: string;
  icon: LucideIcon;
  external?: boolean;
}

export function LandingHeader(): React.ReactElement {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NAV_LINKS: NavLink[] = [
    { name: "Neural Architect", path: "/chat", icon: Code2 },
    { name: "Genesis Studio", path: "/studio", icon: Image },
    { name: "Computo", path: "/pricing", icon: CreditCard },
    { name: "Operaciones", path: "/documentation", icon: BookOpen },
  ];

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-700 panorama-transition px-6 md:px-12",
          isScrolled 
            ? "py-4 bg-white bg-opacity-80 backdrop-blur-xl border-b border-black border-opacity-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)]" 
            : "py-8 bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group relative">
            <Logo className="h-8 w-auto group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute -inset-x-4 -inset-y-2 bg-primary bg-opacity-5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              if (link.external) {
                return (
                  <a 
                    key={link.name}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-bold text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 group-link"
                  >
                    <Icon className="h-4 w-4 opacity-40 group-hover-link:opacity-100 group-hover-link:animate-pulse" />
                    {link.name}
                  </a>
                );
              }
              return (
                <Link 
                  key={link.name}
                  to={link.path}
                  className="text-[13px] font-bold text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 group-link"
                >
                  <Icon className="h-4 w-4 opacity-40 group-hover-link:opacity-100 group-hover-link:animate-pulse" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/auth")}
              className="hidden sm:flex items-center gap-2 text-[13px] font-black text-zinc-900 px-6 py-2.5 rounded-xl hover:bg-zinc-100 transition-all active:scale-95 italic tracking-tighter"
            >
              INGRESAR
            </button>
            <button 
              onClick={() => navigate("/auth")}
              className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 group-cta italic"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              Adquirir Soberania
              <ArrowRight className="h-4 w-4 group-hover-cta:translate-x-1 transition-transform" />
            </button>

            <button 
              className="lg:hidden p-2 text-zinc-900 border border-black border-opacity-5 rounded-xl bg-white bg-opacity-50 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-zinc-100 p-8 flex flex-col gap-6 shadow-2xl"
            >
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-black text-zinc-900 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-xl">
                        <Icon className="h-5 w-5" />
                      </div>
                      {link.name}
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                  </Link>
                );
              })}
              <hr className="border-zinc-100" />
              <button 
                onClick={() => navigate("/auth")}
                className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-widest italic"
              >
                Comenzar Ahora
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
