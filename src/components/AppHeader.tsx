import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Sparkles, LayoutGrid, Wand2, Image, Coins, Shield,
  CreditCard, LogOut, Palette, Home, Menu, X, Activity, MonitorDown, Code, User
} from "lucide-react";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Inicio", icon: Home },
    { path: "/tools", label: "Herramientas", icon: Wand2 },
    { path: "/formarketing", label: "Formarketing", icon: Palette },
    { path: "/spaces", label: "Espacios", icon: LayoutGrid },
    { path: "/assets", label: "Assets", icon: Image },
    { path: "/pricing", label: "Planes", icon: CreditCard },
    { path: "/descargar", label: "Descargas", icon: MonitorDown },
    { path: "/developer", label: "Desarrollo", icon: Code },
    { path: "/profile", label: "Perfil", icon: User },
  ];

  const adminItems = isAdmin
    ? [
        { path: "/admin", label: "Admin", icon: Shield },
        { path: "/system-status", label: "Sistema", icon: Activity },
      ]
    : [];

  const allItems = [...navItems, ...adminItems];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="ir al inicio"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff0071] shadow-lg shadow-[#ff0071]/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black hidden sm:inline text-white leading-none lowercase tracking-tighter">
                creator_ia <span className="text-[#ff0071]">pro</span>
              </span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5 hidden sm:inline">Pulse V7.0_EBONY</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === "/tools" && location.pathname.startsWith("/apps"));
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`shrink-0 h-10 px-5 rounded-full text-[10px] font-black lowercase tracking-widest transition-all duration-300 ${
                    isActive ? "text-white bg-[#ff0071] shadow-xl shadow-[#ff0071]/20 hover:bg-[#e60066]" : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Credits + Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-2.5 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-black text-slate-400 hover:bg-white/10 hover:border-[#ff0071]/30 hover:text-white transition-all shadow-2xl"
            >
              <Coins className="h-3.5 w-3.5 text-[#ff0071]" />
              <span className="font-mono tracking-tighter">
                {profile?.credits_balance ?? 0}
              </span>
            </button>
            
            <div className="h-4 w-px bg-white/10 mx-2" />

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSignOut} 
              aria-label="cerrar sesión"
              className="text-slate-300 hover:text-[#ff0071] hover:bg-[#ff0071]/5 h-9 w-9 p-0 rounded-full hidden md:flex transition-all"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "cerrar menú" : "abrir menú"}
              className="md:hidden text-slate-400 hover:text-slate-900 h-9 w-9 p-0 rounded-xl bg-slate-50"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-[#050506]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-[68px] left-4 right-4 border border-white/5 bg-[#0a0a0b]/95 backdrop-blur-3xl p-4 rounded-[2rem] space-y-1.5 shadow-2xl animate-in slide-in-from-top-4 duration-500 z-50">
            {allItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-xs font-black lowercase tracking-widest transition-all ${
                    isActive
                      ? "bg-[#ff0071] text-white shadow-xl shadow-[#ff0071]/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#ff0071]'}`} />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-xs font-black lowercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}