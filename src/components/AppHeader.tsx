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
  { path: "/dashboard", label: "Nexus", icon: Home },
  { path: "/tools", label: "Arsenal", icon: Wand2 },
  { path: "/formarketing", label: "Studio", icon: Palette },
  { path: "/spaces", label: "Clusters", icon: LayoutGrid },
  { path: "/assets", label: "Manifests", icon: Image },
  { path: "/pricing", label: "Protocols", icon: CreditCard },
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
            <span className="text-[8px] text-white/20 font-bold uppercase tracking-[0.3em] font-display leading-none mt-0.5">v8.0 Neural Core</span>
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
              <Shield className="w-3.5 h-3.5" /> root
            </button>
          )}
        </nav>

        {/* Right Zone */}
        <div className="flex items-center gap-4 ml-auto shrink-0">
          {/* Credits */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-widest font-display"
          >
            <Coins className="w-3.5 h-3.5 text-aether-purple" />
            <span className="tabular-nums">{profile?.credits_balance?.toLocaleString() ?? "0"}</span>
          </button>

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-4 p-1.5 pr-4 rounded-xl aether-card border border-white/5 hover:border-white/10 transition-all active:scale-95 shadow-inner"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-4 h-4 text-white/30" />
                }
              </div>
              <span className="hidden lg:block text-[11px] font-bold text-white/40 max-w-[100px] truncate uppercase tracking-widest font-display">
                {profile?.display_name?.split(" ")[0] ?? "Operator"}
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-white/10 transition-transform duration-500", userMenuOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-4 w-60 aether-card border border-white/10 rounded-[2rem] shadow-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 z-[100] p-3 backdrop-blur-3xl">
                <div className="p-5 border-b border-white/5 bg-white/[0.01] rounded-2xl mb-2">
                  <p className="text-[11px] font-bold text-white truncate uppercase tracking-tighter font-display">{profile?.display_name ?? "Operator"}</p>
                  <p className="text-[9px] text-white/20 truncate mt-1.5 font-bold uppercase tracking-[0.1em] font-display">{profile?.email}</p>
                </div>
                <div className="space-y-1">
                  {[
                    { label: "Neural Profile", icon: User, path: "/profile" },
                    { label: "Manifests", icon: Image, path: "/assets" },
                    { label: "Developer Nexus", icon: Code, path: "/developer" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-bold text-white/30 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest font-display"
                    >
                      <item.icon className="w-4 h-4 text-white/10" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-bold text-rose-500/40 hover:text-rose-400 hover:bg-rose-500/5 transition-all uppercase tracking-widest font-display"
                  >
                    <LogOut className="w-4 h-4" />
                    Terminate session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/5 text-white/30"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden bg-[#050506]/95 backdrop-blur-3xl animate-in slide-in-from-top duration-700 p-8 pt-10">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between px-8 py-5 rounded-[2rem] text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-500",
                    isActive
                      ? "bg-white text-black shadow-4xl scale-[1.02]"
                      : "text-white/20 bg-white/[0.02] border border-white/5"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-black" : "text-white/10")} />
                    {item.label}
                  </div>
                  <ChevronDown className="-rotate-90 w-4 h-4 opacity-20" />
                </button>
              );
            })}
            <div className="mt-8 pt-8 border-t border-white/5">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-5 px-8 py-5 rounded-[2rem] text-[11px] font-bold text-rose-500/40 bg-rose-500/5 border border-rose-500/10 tracking-widest uppercase transition-all"
              >
                <LogOut className="w-5 h-5" />
                Terminate Session
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}