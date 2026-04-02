import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogOut,
  Home, Menu, X, User, Download,
  ChevronDown, Coins, Lock,
  Code2, Wand2, FolderOpen, CreditCard, Image, Zap, LayoutTemplate,
  Sparkles, Brain, Video, Monitor
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

// ─── Direct nav items (no dropdown) ─────────────────────────────────────────
const DIRECT_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
];

// ─── Dropdown mega-menu groups ───────────────────────────────────────────────
const MENU_GROUPS = [
  {
    id: "generar",
    label: "Generar",
    icon: Sparkles,
    items: [
      {
        path: "/chat",
        label: "Genesis IDE",
        desc: "Genera texto, código y estrategias con IA multimodal",
        icon: Code2,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        badge: null as string | null,
        requiresPymes: false,
      },
      {
        path: "/studio",
        label: "Studio — Imagen",
        desc: "Crea imágenes únicas con modelos FLUX y SDXL",
        icon: Image,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        badge: null as string | null,
        requiresPymes: false,
      },
      {
        path: "/studio",
        label: "Studio — Video",
        desc: "Genera videos cortos con Stable Video Diffusion",
        icon: Video,
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        badge: "Beta" as string | null,
        requiresPymes: false,
      },
      {
        path: "/formarketing",
        label: "Canvas Visual",
        desc: "Flujos visuales de contenido con nodos de IA",
        icon: LayoutTemplate,
        color: "text-primary",
        bg: "bg-primary/10",
        badge: "Pymes" as string | null,
        requiresPymes: true,
      },
    ],
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    icon: FolderOpen,
    items: [
      {
        path: "/hub",
        label: "Hub de Plantillas",
        desc: "Más de 20 plantillas profesionales listas para usar",
        icon: Sparkles,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        badge: null as string | null,
        requiresPymes: false,
      },
      {
        path: "/spaces",
        label: "Mis Espacios",
        desc: "Proyectos guardados y Canvas activos",
        icon: FolderOpen,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        badge: null as string | null,
        requiresPymes: false,
      },
      {
        path: "/assets",
        label: "Activos & Medios",
        desc: "Imágenes, videos y archivos generados con IA",
        icon: Monitor,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        badge: null as string | null,
        requiresPymes: false,
      },
    ],
  },
] as const;

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isPymes = ["pymes", "agency", "admin"].includes(
    profile?.subscription_tier?.toLowerCase() || "free"
  );

  const handleNav = (path: string, requiresPymes?: boolean, label?: string) => {
    if (requiresPymes && !isPymes) {
      toast.error("Funcionalidad exclusiva", {
        description: `"${label}" es exclusivo del plan Pymes.`,
        action: { label: "Ver planes", onClick: () => navigate("/pricing") },
        duration: 6000,
      });
      return;
    }
    navigate(path);
    setMobileOpen(false);
    setUserMenuOpen(false);
    setOpenGroup(null);
  };

  const displayName = profile?.display_name?.split(" ")[0] || null;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  const isGroupActive = (group: typeof MENU_GROUPS[number]) =>
    group.items.some((item) => isActive(item.path));

  return (
    <>
      {/* Backdrop for dropdowns */}
      {openGroup && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setOpenGroup(null)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-[100] h-[56px] flex items-center border-b border-zinc-200 bg-white/90 backdrop-blur-xl shadow-sm shadow-zinc-100">
        <div className="w-full max-w-[1400px] mx-auto px-5 flex items-center gap-4">

          {/* Logo */}
          <Logo size="sm" showText onClick={() => navigate("/dashboard")} />

          {/* Divider */}
          <div className="hidden md:block w-px h-4 bg-zinc-200" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">

            {/* Direct items */}
            {DIRECT_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95",
                    active
                      ? "text-zinc-900 bg-zinc-100 border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5 shrink-0", active && "text-primary")} />
                  {item.label}
                </button>
              );
            })}

            {/* Mega-menu dropdown groups */}
            {MENU_GROUPS.map((group) => {
              const active = isGroupActive(group);
              const isOpen = openGroup === group.id;
              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    aria-label={`Menú ${group.label}`}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95",
                      active
                        ? "text-zinc-900 bg-zinc-100 border border-zinc-200"
                        : isOpen
                        ? "text-zinc-800 bg-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                    )}
                  >
                    <group.icon className={cn("w-3.5 h-3.5 shrink-0", active && "text-primary")} />
                    {group.label}
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 text-zinc-400 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-full left-0 mt-2 w-[300px] rounded-2xl z-[200] bg-white border border-zinc-200 shadow-xl shadow-zinc-200/60 overflow-hidden"
                      >
                        {/* Group header */}
                        <div className="px-4 py-2.5 border-b border-zinc-100">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                            {group.label}
                          </p>
                        </div>
                        <div className="p-2 space-y-0.5">
                          {group.items.map((item) => {
                            const itemActive = isActive(item.path);
                            const isLocked = item.requiresPymes && !isPymes;
                            return (
                              <button
                                key={`${item.path}-${item.label}`}
                                onClick={() =>
                                  handleNav(item.path, item.requiresPymes, item.label)
                                }
                                className={cn(
                                  "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                                  itemActive
                                    ? "bg-primary/5 border border-primary/10"
                                    : "hover:bg-zinc-50"
                                )}
                              >
                                <div
                                  className={cn(
                                    "p-2 rounded-xl shrink-0 mt-0.5",
                                    item.bg
                                  )}
                                >
                                  {isLocked ? (
                                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                                  ) : (
                                    <item.icon
                                      className={cn("w-3.5 h-3.5", item.color)}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={cn(
                                        "text-[12px] font-semibold",
                                        itemActive ? "text-primary" : "text-zinc-800"
                                      )}
                                    >
                                      {item.label}
                                    </span>
                                    {item.badge && (
                                      <span
                                        className={cn(
                                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                          item.badge === "Pymes"
                                            ? "bg-amber-100 text-amber-600"
                                            : item.badge === "Beta"
                                            ? "bg-sky-100 text-sky-600"
                                            : "bg-primary/10 text-primary"
                                        )}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => handleNav("/admin")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Pricing link */}
            <button
              onClick={() => handleNav("/pricing")}
              aria-label="Ver precios y planes"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-400 border border-zinc-200 hover:text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              <Zap className="w-3 h-3 text-primary" />
              Precios
            </button>

            {/* Credits */}
            <button
              onClick={() => handleNav("/pricing")}
              aria-label={`Créditos disponibles: ${profile?.credits_balance?.toLocaleString() ?? "cargando"}`}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-primary/5 border border-primary/15 hover:bg-primary/10 hover:border-primary/25 transition-all"
            >
              <Coins className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="tabular-nums font-mono text-zinc-700" aria-hidden="true">
                {profile?.credits_balance?.toLocaleString() ?? "—"}
              </span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="Menú de usuario"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
                <span className="hidden lg:block text-[12px] font-medium text-zinc-600 max-w-[90px] truncate">
                  {displayName ?? "Perfil"}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 text-zinc-400 transition-transform",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[150]"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-[200] bg-white border border-zinc-200 shadow-lg shadow-zinc-100">
                    <div className="px-3 py-2.5 border-b border-zinc-100">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">
                        {profile?.display_name ?? "Mi Perfil"}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {profile?.email ?? ""}
                      </p>
                    </div>
                    <div className="p-1">
                      {[
                        { label: "Mi Perfil", icon: User, path: "/profile" },
                        { label: "Mis Activos", icon: Image, path: "/assets" },
                        { label: "Planes", icon: CreditCard, path: "/pricing" },
                        { label: "Descargar App", icon: Download, path: "/descargar" },
                      ].map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleNav(item.path)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
                        >
                          <item.icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          {item.label}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-zinc-100" />
                      <button
                        onClick={() => {
                          onSignOut();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-all"
            >
              {mobileOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            className="fixed inset-0 top-[56px] z-40 md:hidden overflow-y-auto bg-white border-t border-zinc-200 px-4 py-5"
          >
            {/* User card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-zinc-50 border border-zinc-200">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 truncate">
                  {profile?.display_name ?? "Mi Perfil"}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">{profile?.email ?? ""}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15">
                <Coins className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-semibold text-zinc-700 tabular-nums">
                  {profile?.credits_balance?.toLocaleString() ?? "—"}
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {/* Dashboard direct */}
              <button
                onClick={() => handleNav("/dashboard")}
                aria-current={isActive("/dashboard") ? "page" : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all",
                  isActive("/dashboard")
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                )}
              >
                <Home className={cn("w-5 h-5", isActive("/dashboard") && "text-primary")} />
                Dashboard
              </button>

              {/* Mobile grouped items */}
              {MENU_GROUPS.map((group) => (
                <div key={group.id} className="mt-1">
                  <p className="px-4 pt-1 pb-1 text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    const isLocked = item.requiresPymes && !isPymes;
                    return (
                      <button
                        key={`mobile-${item.path}-${item.label}`}
                        onClick={() =>
                          handleNav(item.path, item.requiresPymes, item.label)
                        }
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold transition-all",
                          active
                            ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg", item.bg)}>
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-amber-500" />
                            ) : (
                              <item.icon className={cn("w-4 h-4", item.color)} />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                    item.badge === "Pymes"
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-sky-100 text-sky-600"
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {isAdmin && (
                <button
                  onClick={() => handleNav("/admin")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-red-400 bg-red-50 border border-red-100 transition-all mt-1"
                >
                  <Shield className="w-5 h-5" /> Admin
                </button>
              )}

              <button
                onClick={() => handleNav("/pricing")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold mt-2 bg-primary/5 border border-primary/15 text-primary hover:bg-primary/10 transition-all"
              >
                <Zap className="w-5 h-5" /> Ver planes
              </button>

              <div className="mt-2 pt-2 border-t border-zinc-100">
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-red-400 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
