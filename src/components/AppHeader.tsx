import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sparkles, LayoutGrid, Wand2, Image, Shield, CreditCard, LogOut,
  Palette, Home, Menu, X, Code, User,
  ChevronDown, Coins, Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { path: "/dashboard",    label: "Inicio",        icon: Home        },
  { path: "/tools",        label: "Herramientas",  icon: Wand2       },
  { path: "/formarketing", label: "Studio",         icon: Palette     },
  { path: "/spaces",       label: "Espacios",      icon: LayoutGrid  },
  { path: "/assets",       label: "Activos",       icon: Image       },
  { path: "/pricing",      label: "Precios",       icon: CreditCard  },
];

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  const displayName = profile?.display_name?.split(" ")[0] || null;

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-16 flex items-center border-b border-white/5 bg-[#050506]/40 backdrop-blur-2xl">
      <div className="w-full max-w-[1440px] mx-auto px-8 flex items-center gap-8">

        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all">
            <Sparkles className="w-4.5 h-4.5 text-black" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-aether-purple shadow-[0_0_8px_rgba(168,85,247,1)] animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight font-display uppercase leading-none">
              Creator <span className="text-aether-purple">IA</span> Pro
            </span>
            <span className="text-[8px] text-white/20 font-bold uppercase tracking-[0.3em] font-display leading-none mt-0.5">v8.0</span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5 flex-1 ml-4 py-1.5 px-1.5 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 font-display",
                  isActive
                    ? "text-white bg-white/5 shadow-inner border border-white/5"
                    : "text-white/20 hover:text-white/60"
                )}
              >
                <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-aether-purple" : "text-white/10")} />
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => handleNav("/admin")}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500/40 hover:text-rose-500 transition-all font-display"
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </button>
          )}
        </nav>

        {/* Right Zone */}
        <div className="flex items-center gap-3 ml-auto shrink-0">

          {/* Credits */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Coins className="w-3.5 h-3.5 text-aether-purple shrink-0" />
            <span className="tabular-nums">{profile?.credits_balance?.toLocaleString() ?? "0"}</span>
          </button>

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3.5 rounded-xl aether-card border border-white/5 hover:border-white/15 transition-all active:scale-95"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-4 h-4 text-white/40" />
                }
              </div>
              {/* Name or fallback */}
              <span className="hidden lg:block text-sm font-semibold text-white/70 max-w-[110px] truncate">
                {displayName ?? "Mi Perfil"}
              </span>
              <ChevronDown className={cn(
                "w-3.5 h-3.5 text-white/25 transition-transform duration-300 shrink-0",
                userMenuOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-[#0d0d10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[200] p-2">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-white/[0.06] mb-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {profile?.display_name ?? "Mi Perfil"}
                  </p>
                  <p className="text-xs text-white/40 truncate mt-0.5">{profile?.email ?? ""}</p>
                </div>

                {/* Menu items */}
                <div className="space-y-0.5">
                  {[
                    { label: "Mi Perfil",           icon: User,    path: "/profile" },
                    { label: "Mis Activos",          icon: Image,   path: "/assets" },
                    { label: "Compartir pantalla",   icon: Monitor, path: "/sharescreen" },
                    { label: "Desarrollador",        icon: Code,    path: "/developer" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all text-left"
                    >
                      <item.icon className="w-4 h-4 text-white/25 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div className="mt-1 pt-1 border-t border-white/[0.06]">
                  <button
                    onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden bg-[#050506]/98 backdrop-blur-3xl animate-in slide-in-from-top duration-300 px-5 py-6 overflow-y-auto">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-white/30" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.display_name ?? "Mi Perfil"}</p>
              <p className="text-xs text-white/40 truncate">{profile?.email ?? ""}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
              <Coins className="w-3 h-3 text-aether-purple" />
              <span className="text-xs font-semibold text-white/50 tabular-nums">
                {profile?.credits_balance?.toLocaleString() ?? "0"}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-white text-black shadow-lg"
                      : "text-white/60 bg-white/[0.03] border border-white/5 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-black" : "text-white/30")} />
                    {item.label}
                  </div>
                  <ChevronDown className="-rotate-90 w-4 h-4 opacity-30" />
                </button>
              );
            })}

            {/* Share Screen */}
            <button
              onClick={() => handleNav("/sharescreen")}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold text-aether-blue/70 bg-aether-blue/5 border border-aether-blue/10 hover:text-aether-blue transition-all"
            >
              <Monitor className="w-5 h-5" />
              Compartir pantalla
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav("/admin")}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold text-rose-400/70 bg-rose-500/5 border border-rose-500/10 hover:text-rose-400 transition-all"
              >
                <Shield className="w-5 h-5" />
                Admin
              </button>
            )}

            <div className="mt-2 pt-2 border-t border-white/5">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold text-rose-400/60 bg-rose-500/5 border border-rose-500/10 hover:text-rose-400 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
