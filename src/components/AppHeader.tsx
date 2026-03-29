import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sparkles, Shield, LogOut,
  Home, Menu, X, User, Download,
  ChevronDown, Coins, Monitor,
  Code2, Wand2, FolderOpen, CreditCard, Image, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

// Core 4-pillar navigation
const NAV_ITEMS = [
  { path: "/dashboard", label: "Home",    icon: Home,      color: "text-white/50" },
  { path: "/chat",      label: "Genesis", icon: Code2,     color: "text-aether-purple" },
  { path: "/studio",    label: "Studio",  icon: Wand2,     color: "text-aether-blue" },
  { path: "/spaces",    label: "Spaces",  icon: FolderOpen, color: "text-emerald-400" },
];

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  const displayName = profile?.display_name?.split(" ")[0] || null;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-16 flex items-center border-b border-white/[0.04] bg-[#040405]/80 backdrop-blur-2xl">
      <div className="w-full max-w-[1440px] mx-auto px-6 flex items-center gap-6">

        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="relative w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-all">
            <Sparkles className="w-4 h-4 text-black" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-aether-purple shadow-[0_0_8px_rgba(168,85,247,1)] animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[13px] font-black text-white tracking-tight font-display uppercase">
              Creator <span className="text-aether-purple">IA</span>
            </span>
            <span className="text-[8px] text-white/15 font-bold uppercase tracking-[0.3em] font-display mt-0.5">Pro · v9.0</span>
          </div>
        </button>

        {/* Desktop Nav — pill style like Lovable */}
        <nav className="hidden md:flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 font-display",
                  active
                    ? "bg-white/[0.07] text-white shadow-inner border border-white/[0.08]"
                    : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("w-3.5 h-3.5 shrink-0 transition-colors", active ? item.color : "text-white/25")} />
                {item.label}
                {item.label === "Genesis" && !active && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-aether-purple animate-pulse" />
                )}
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => handleNav("/admin")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-rose-500/40 hover:text-rose-400 hover:bg-rose-500/5 transition-all font-display"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right zone */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Pricing CTA — visible to all */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden sm:flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-white hover:border-white/15 transition-all font-display"
          >
            <Zap className="w-3 h-3 text-aether-purple shrink-0" />
            Precios
          </button>

          {/* Credits counter */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden lg:flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-[12px] font-semibold text-white/40 hover:text-white hover:bg-white/[0.06] transition-all group"
          >
            <Coins className="w-3.5 h-3.5 text-aether-purple group-hover:text-aether-purple shrink-0" />
            <span className="tabular-nums">{profile?.credits_balance?.toLocaleString() ?? "0"}</span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aether-purple/30 to-aether-blue/30 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-3.5 h-3.5 text-white/50" />
                }
              </div>
              <span className="hidden lg:block text-[12px] font-semibold text-white/50 max-w-[100px] truncate">
                {displayName ?? "Perfil"}
              </span>
              <ChevronDown className={cn("w-3 h-3 text-white/20 transition-transform duration-200", userMenuOpen && "rotate-180")} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-[150]" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0c0c0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-[200] animate-in fade-in zoom-in-95 duration-150 p-1.5">
                  <div className="px-3 py-2.5 mb-1">
                    <p className="text-[13px] font-semibold text-white truncate">{profile?.display_name ?? "Mi Perfil"}</p>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{profile?.email ?? ""}</p>
                  </div>
                  <div className="h-px bg-white/[0.05] mb-1" />
                  {[
                    { label: "Mi Perfil",      icon: User,     path: "/profile" },
                    { label: "Mis Activos",     icon: Image,    path: "/assets" },
                    { label: "Precios",         icon: CreditCard, path: "/pricing" },
                    { label: "Compartir Pantalla", icon: Monitor, path: "/sharescreen" },
                    { label: "Descargar App",   icon: Download, path: "/descargar" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-white/40 hover:text-white hover:bg-white/[0.05] transition-all"
                    >
                      <item.icon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                  <div className="h-px bg-white/[0.05] my-1" />
                  <button
                    onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white transition-all"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden bg-[#040405]/98 backdrop-blur-3xl animate-in slide-in-from-top duration-200 px-5 py-6 overflow-y-auto">
          {/* User card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aether-purple/30 to-aether-blue/30 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-white/30" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{profile?.display_name ?? "Mi Perfil"}</p>
              <p className="text-[11px] text-white/30 truncate">{profile?.email ?? ""}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/[0.06] px-2.5 py-1.5 rounded-xl">
              <Coins className="w-3 h-3 text-aether-purple" />
              <span className="text-[11px] font-semibold text-white/40 tabular-nums">{profile?.credits_balance?.toLocaleString() ?? "0"}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[13px] font-bold transition-all font-display uppercase tracking-widest",
                    active
                      ? "bg-white text-black shadow-lg"
                      : "text-white/50 bg-white/[0.03] border border-white/[0.05] hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", active ? "text-black" : item.color)} />
                    {item.label}
                  </div>
                  <ChevronDown className="-rotate-90 w-4 h-4 opacity-20" />
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => handleNav("/admin")}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[13px] font-bold font-display uppercase tracking-widest text-rose-400/60 bg-rose-500/5 border border-rose-500/10 hover:text-rose-400 transition-all"
              >
                <Shield className="w-5 h-5" /> Admin
              </button>
            )}

            <div className="mt-2 pt-2 border-t border-white/[0.05]">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[13px] font-semibold text-rose-400/60 bg-rose-500/5 border border-rose-500/10 hover:text-rose-400 transition-all"
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
