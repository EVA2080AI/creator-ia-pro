import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sparkles, LayoutGrid, Wand2, Image, Shield, CreditCard, LogOut,
  Palette, Home, Menu, X, Activity, MonitorDown, Code, User,
  ChevronDown, Zap, BookOpen, Settings, Coins, BrainCircuit, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { path: "/dashboard", label: "Inicio", icon: Home },
  { path: "/tools", label: "Herramientas", icon: Wand2 },
  { path: "/formarketing", label: "Formarketing", icon: Palette },
  { path: "/spaces", label: "Espacios", icon: LayoutGrid },
  { path: "/assets", label: "Assets", icon: Image },
  { path: "/pricing", label: "Planes", icon: CreditCard },
  { path: "/descargar", label: "Descargas", icon: MonitorDown },
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

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-14 flex items-center border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,6,0.92)] backdrop-blur-xl">
      <div className="w-full max-w-[1400px] mx-auto px-4 flex items-center gap-6">

        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#bd00ff] to-[#ff0071] flex items-center justify-center shadow-[0_0_12px_rgba(189,0,255,0.5)] group-hover:shadow-[0_0_20px_rgba(189,0,255,0.7)] transition-all">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight hidden sm:block">
            Creator <span className="brand-gradient-text">IA Pro</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-white bg-white/8"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-3.5 h-3.5", isActive && "text-[#bd00ff]")} />
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <>
              <button onClick={() => handleNav("/admin")} className="nav-item">
                <Shield className="w-3.5 h-3.5" /> Admin
              </button>
              <button onClick={() => handleNav("/system-status")} className="nav-item">
                <Activity className="w-3.5 h-3.5" /> Sistema
              </button>
            </>
          )}
        </nav>

        {/* Right Zone */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Credits */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden sm:flex items-center gap-1.5 bg-[rgba(255,184,0,0.1)] border border-[rgba(255,184,0,0.2)] rounded-full px-3 py-1 text-xs font-bold text-[#ffb800] hover:bg-[rgba(255,184,0,0.15)] transition-all"
          >
            <Coins className="w-3 h-3" />
            {profile?.credits_balance?.toLocaleString() ?? "0"}
          </button>

          {/* Upgrade CTA */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden lg:flex items-center gap-1.5 btn-brand text-xs py-1.5 px-3"
          >
            <Zap className="w-3 h-3" />
            Mejorar Plan
          </button>

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#bd00ff]/30 to-[#ff0071]/30 flex items-center justify-center overflow-hidden border border-white/10">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-3.5 h-3.5 text-white/70" />
                }
              </div>
              <span className="hidden sm:block text-xs font-medium text-white/70 max-w-[80px] truncate">
                {profile?.display_name?.split(" ")[0] ?? "Creador"}
              </span>
              <ChevronDown className={cn("w-3 h-3 text-white/40 transition-transform", userMenuOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f0f12] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-float-up z-50">
                <div className="p-3 border-b border-white/5">
                  <p className="text-xs font-semibold text-white truncate">{profile?.display_name ?? "Creador"}</p>
                  <p className="text-xs text-white/40 truncate mt-0.5">{profile?.email}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {[
                    { label: "Perfil", icon: User, path: "/profile" },
                    { label: "Mis Assets", icon: Image, path: "/assets" },
                    { label: "API Developer", icon: Code, path: "/developer" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="p-1.5 border-t border-white/5">
                  <button
                    onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#ff0071]/80 hover:text-[#ff0071] hover:bg-[rgba(255,0,113,0.08)] transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/8 text-white"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-40 md:hidden bg-[#050506]/95 backdrop-blur-xl animate-float-up">
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-[#bd00ff]/15 to-[#ff0071]/10 text-white border border-[rgba(189,0,255,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "text-[#bd00ff]")} />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-3 border-t border-white/5 mt-3">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#ff0071]/80 hover:text-[#ff0071] hover:bg-[rgba(255,0,113,0.08)] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}