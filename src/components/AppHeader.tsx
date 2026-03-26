import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Sparkles, LayoutGrid, Wand2, Image, Coins, Shield,
  CreditCard, LogOut, Palette, Home, Menu, X, Activity, MonitorDown
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
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
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
              <span className="text-sm font-bold hidden sm:inline text-slate-900 leading-none lowercase tracking-tight">
                creator_ia <span className="text-[#ff0071]">pro</span>
              </span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1 hidden sm:inline">Pulse V6.2</span>
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
                  className={`shrink-0 h-9 px-4 rounded-full text-[11px] font-bold lowercase tracking-normal transition-all ${
                    isActive ? "text-white bg-[#ff0071] shadow-md shadow-[#ff0071]/20 hover:bg-[#e60066] hover:text-white" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
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
              className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-white hover:border-[#ff0071]/20 hover:text-[#ff0071] transition-all shadow-sm"
            >
              <Coins className="h-3.5 w-3.5 text-[#ff0071]" />
              <span className="font-mono">
                {profile?.credits_balance ?? 0}
              </span>
            </button>
            
            <div className="h-4 w-px bg-slate-100 mx-1" />

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
        <div className="fixed inset-0 z-40 md:hidden bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-[68px] left-4 right-4 border border-slate-100 bg-white/95 backdrop-blur-3xl p-4 rounded-3xl space-y-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-500 z-50">
            {allItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-xs font-bold lowercase transition-all ${
                    isActive
                      ? "bg-[#ff0071] text-white shadow-lg shadow-[#ff0071]/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-slate-50 pt-2 mt-2">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-xs font-bold lowercase text-destructive hover:bg-destructive/5 transition-all"
              >
                <LogOut className="h-4.5 w-4.5" />
                cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}