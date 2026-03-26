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
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-3xl shadow-white/5 group-hover:rotate-3 transition-all">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-black text-white tracking-tighter hidden sm:block lowercase">
            nexus_ <span className="text-white/40">system</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-150",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-white/30 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-white/20")} />
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <>
              <button onClick={() => handleNav("/admin")} className="nav-item text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white">
                <Shield className="w-3.5 h-3.5" /> admin
              </button>
              <button onClick={() => handleNav("/system-status")} className="nav-item text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white">
                <Activity className="w-3.5 h-3.5" /> system
              </button>
            </>
          )}
        </nav>

        {/* Right Zone */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* Credits */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-4 py-1.5 text-[10px] font-black text-white/40 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
          >
            <Coins className="w-3 h-3" />
            {profile?.credits_balance?.toLocaleString() ?? "0"}
          </button>

          {/* Upgrade CTA */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden lg:flex items-center gap-1.5 bg-white text-black rounded-lg text-[10px] font-black py-2 px-4 shadow-3xl shadow-white/5 hover:bg-white/90 transition-all uppercase tracking-widest"
          >
            <Zap className="w-3 h-3" />
            boost_engine
          </button>

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 p-1 pr-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all"
            >
              <div className="w-6.5 h-6.5 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden border border-white/5">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover grayscale" />
                  : <User className="w-3.5 h-3.5 text-white/40" />
                }
              </div>
              <span className="hidden sm:block text-[11px] font-black text-white/40 max-w-[80px] truncate lowercase">
                {profile?.display_name?.split(" ")[0] ?? "operator"}
              </span>
              <ChevronDown className={cn("w-3 h-3 text-white/10 transition-transform", userMenuOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-50">
                <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                  <p className="text-[11px] font-black text-white truncate lowercase tracking-tight">{profile?.display_name ?? "operator"}</p>
                  <p className="text-[9px] text-white/20 truncate mt-1 font-bold lowercase tracking-wider">{profile?.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { label: "account_profile", icon: User, path: "/profile" },
                    { label: "stored_assets", icon: Image, path: "/assets" },
                    { label: "developer_api", icon: Code, path: "/developer" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black text-white/30 hover:text-white hover:bg-white/5 transition-all lowercase tracking-widest"
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-white/5 bg-white/[0.01]">
                  <button
                    onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black text-white/20 hover:text-white hover:bg-white/5 transition-all lowercase tracking-widest"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    terminate_session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white/40"
          >
            {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-40 md:hidden bg-[#050506] backdrop-blur-3xl animate-in slide-in-from-top duration-500">
          <nav className="p-6 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all",
                    isActive
                      ? "bg-white text-black shadow-3xl shadow-white/5"
                      : "text-white/30 bg-white/[0.02] border border-white/5"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-black" : "text-white/20")} />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black text-white/20 bg-white/5 tracking-widest uppercase transition-all"
              >
                <LogOut className="w-4 h-4" />
                terminate_session
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}