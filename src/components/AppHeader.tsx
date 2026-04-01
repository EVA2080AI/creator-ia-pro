import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Shield, LogOut,
  Home, Menu, X, User, Download,
  ChevronDown, Coins, Monitor, Lock,
  Code2, Wand2, FolderOpen, CreditCard, Image, Zap, LayoutTemplate
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { path: "/dashboard",   label: "Home",    icon: Home           },
  { path: "/chat",        label: "Genesis", icon: Code2          }, // Chat viejo
  { path: "/studio",      label: "Studio",  icon: Wand2          }, // Herramientas de IA
  { path: "/code",        label: "Code",    icon: Monitor,        requiresPymes: true }, // El IDE / Web Builder
  { path: "/formarketing",label: "Canvas",  icon: LayoutTemplate, requiresPymes: true },
  { path: "/spaces",      label: "Spaces",  icon: FolderOpen     },
];

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isPymes = ["pymes", "agency", "admin"].includes(profile?.subscription_tier?.toLowerCase() || "free");

  const handleNav = (item: typeof NAV_ITEMS[0] | string) => {
    const path = typeof item === 'string' ? item : item.path;
    
    // Check if the route is premium and user is not Pymes
    if (typeof item !== 'string' && (item as any).requiresPymes && !isPymes) {
      toast.error("Funcionalidad exclusiva", {
        description: `La herramienta "${item.label}" es exclusiva del plan Pymes.`,
        action: { label: "Actualizar Plan", onClick: () => navigate("/pricing") },
        duration: 8000
      });
      return;
    }

    navigate(path);
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  const displayName = profile?.display_name?.split(" ")[0] || null;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-[56px] flex items-center border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="w-full max-w-[1400px] mx-auto px-5 flex items-center gap-5">

        {/* Logo */}
        <Logo size="sm" showText onClick={() => navigate("/dashboard")} />

        {/* Divider */}
        <div className="hidden md:block w-px h-4" style={{ background: 'rgba(255,255,255,0.10)' }} />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const isLocked = item.requiresPymes && !isPymes;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-150 active:scale-95",
                  active
                    ? "text-white bg-white/10 border border-white/10 shadow-lg shadow-white/5"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5",
                  isLocked && "opacity-75"
                )}
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500/80" />
                ) : (
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                )}
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => handleNav("/admin")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-400/50 hover:text-red-400 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </nav>

        <div className="flex-1" />

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Pricing */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { (e.target as HTMLElement).closest('button')!.style.color = 'white'; (e.target as HTMLElement).closest('button')!.style.borderColor = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).closest('button')!.style.color = 'rgba(255,255,255,0.35)'; (e.target as HTMLElement).closest('button')!.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <Zap className="w-3 h-3" style={{ color: 'var(--brand)' }} />
            Precios
          </button>

          {/* Credits */}
          <button
            onClick={() => handleNav("/pricing")}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', color: 'rgba(255,255,255,0.60)' }}
          >
            <Coins className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
            <span className="tabular-nums font-mono">{profile?.credits_balance?.toLocaleString() ?? "—"}</span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.12)' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-3 h-3 text-white/40" />
                }
              </div>
              <span className="hidden lg:block text-[12px] font-medium text-white/50 max-w-[90px] truncate">
                {displayName ?? "Perfil"}
              </span>
              <ChevronDown className={cn("w-3 h-3 text-white/25 transition-transform", userMenuOpen && "rotate-180")} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-[150]" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-[200] bg-popover/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80">
                  <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[13px] font-semibold text-white truncate">{profile?.display_name ?? "Mi Perfil"}</p>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{profile?.email ?? ""}</p>
                  </div>
                  <div className="p-1">
                    {[
                      { label: "Mi Perfil",          icon: User,       path: "/profile" },
                      { label: "Mis Activos",         icon: Image,      path: "/assets" },
                      { label: "Planes",              icon: CreditCard, path: "/pricing" },
                      { label: "Compartir Pantalla",  icon: Monitor,    path: "/sharescreen" },
                      { label: "Descargar App",       icon: Download,   path: "/descargar" },
                    ].map(item => (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white/45 hover:text-white transition-all"
                        style={{ hover: { background: 'rgba(255,255,255,0.05)' } } as any}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = ''; }}
                      >
                        <item.icon className="w-3.5 h-3.5 text-white/25 shrink-0" />
                        {item.label}
                      </button>
                    ))}
                    <div className="my-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    <button
                      onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
                      style={{ color: 'rgba(248,113,113,0.6)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgb(248,113,113)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.6)'; }}
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[56px] z-40 md:hidden overflow-y-auto px-4 py-5"
          style={{ background: 'rgba(18,18,22,0.99)', backdropFilter: 'blur(20px)' }}>

          {/* User */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.10)' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-white/30" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{profile?.display_name ?? "Mi Perfil"}</p>
              <p className="text-[11px] text-white/30 truncate">{profile?.email ?? ""}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <Coins className="w-3 h-3" style={{ color: 'var(--brand)' }} />
              <span className="text-[11px] font-semibold text-white/50 tabular-nums">{profile?.credits_balance?.toLocaleString() ?? "—"}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const isLocked = item.requiresPymes && !isPymes;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
                  style={active
                    ? { background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }
                    : { color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {isLocked && <Lock className="w-4 h-4 text-amber-500/80" />}
                </button>
              );
            })}

            {isAdmin && (
              <button onClick={() => handleNav("/admin")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-red-400/60 transition-all"
                style={{ border: '1px solid rgba(248,113,113,0.10)', background: 'rgba(248,113,113,0.04)' }}>
                <Shield className="w-5 h-5" /> Admin
              </button>
            )}

            <button onClick={() => handleNav("/pricing")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold mt-2 transition-all"
              style={{ border: '1px solid rgba(74,222,128,0.20)', background: 'rgba(74,222,128,0.06)', color: 'var(--brand)' }}>
              <Zap className="w-5 h-5" /> Ver planes
            </button>

            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
                style={{ color: 'rgba(248,113,113,0.6)', border: '1px solid transparent' }}
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
