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
  Sparkles, Brain, FileText, Hash, Megaphone, Palette, Eraser, Monitor,
  PenLine, Terminal
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

// ─── Direct nav items ────────────────────────────────────────────────────────
const DIRECT_ITEMS = [
  { path: "/dashboard",    label: "Dashboard", icon: Home,        requiresPymes: false },
  { path: "/chat",         label: "Genesis IA", icon: Brain,       requiresPymes: false },
  { path: "/formarketing", label: "Canvas IA",  icon: LayoutTemplate, requiresPymes: true },
  { path: "/code",         label: "Code",       icon: Terminal,    requiresPymes: true },
];

// ─── Generar IA mega-menu (2 columns) ────────────────────────────────────────
const GENERAR_COLUMNS = [
  {
    heading: "Imagen IA",
    color: "text-blue-500",
    items: [
      {
        path: "/herramienta/texto-a-imagen",
        label: "Crear Imagen",
        desc: "Genera imágenes únicas con FLUX Pro y SDXL",
        icon: Image,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        path: "/herramienta/logo-maker",
        label: "Diseñar Logo",
        desc: "Logos profesionales con IA generativa",
        icon: Palette,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
      {
        path: "/herramienta/mejorar-imagen",
        label: "Mejorar & Upscale",
        desc: "Upscale 4K y restauración automática",
        icon: Sparkles,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
      },
      {
        path: "/herramienta/quitar-fondo",
        label: "Quitar Fondo",
        desc: "Elimina fondos en segundos con IA",
        icon: Eraser,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
      },
    ],
  },
  {
    heading: "Texto IA",
    color: "text-emerald-500",
    items: [
      {
        path: "/herramienta/ai-copywriter",
        label: "AI Copywriter",
        desc: "Copy persuasivo para ventas y anuncios",
        icon: PenLine,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        path: "/herramienta/ai-blog-writer",
        label: "Blog & SEO",
        desc: "Artículos optimizados para posicionar",
        icon: FileText,
        color: "text-sky-500",
        bg: "bg-sky-500/10",
      },
      {
        path: "/herramienta/social-media-kit",
        label: "Social Media",
        desc: "Captions y hashtags para cada red social",
        icon: Hash,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
      },
      {
        path: "/herramienta/ad-generator",
        label: "Ads IA",
        desc: "Anuncios para Google, Meta y TikTok",
        icon: Megaphone,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
      },
    ],
  },
];

// ─── Biblioteca dropdown ──────────────────────────────────────────────────────
const BIBLIOTECA_ITEMS = [
  {
    path: "/hub",
    label: "Hub de Plantillas",
    desc: "Plantillas profesionales listas para el Canvas IA",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    path: "/spaces",
    label: "Mis Espacios",
    desc: "Proyectos guardados y Canvas activos",
    icon: FolderOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    path: "/assets",
    label: "Activos & Medios",
    desc: "Imágenes y archivos generados con IA",
    icon: Monitor,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"generar" | "biblioteca" | null>(null);

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
    setOpenMenu(null);
  };

  const displayName = profile?.display_name?.split(" ")[0] || null;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  const isGenerarActive = GENERAR_COLUMNS.some((col) =>
    col.items.some((item) => isActive(item.path))
  );
  const isBibliotecaActive = BIBLIOTECA_ITEMS.some((item) => isActive(item.path));

  const dropdownPanel = "absolute top-full mt-2 z-[200] bg-white border border-zinc-200 shadow-xl shadow-zinc-200/60 rounded-2xl overflow-hidden";

  return (
    <>
      {openMenu && (
        <div className="fixed inset-0 z-[90]" onClick={() => setOpenMenu(null)} />
      )}

      <header className="fixed top-0 left-0 right-0 z-[100] h-[56px] flex items-center border-b border-zinc-200 bg-white/90 backdrop-blur-xl shadow-sm shadow-zinc-100">
        <div className="w-full max-w-[1400px] mx-auto px-5 flex items-center gap-3">

          {/* Logo */}
          <Logo size="sm" showText onClick={() => navigate("/dashboard")} />
          <div className="hidden md:block w-px h-4 bg-zinc-200 mx-1" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">

            {/* Direct items */}
            {DIRECT_ITEMS.map((item) => {
              const active = isActive(item.path);
              const locked = item.requiresPymes && !isPymes;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path, item.requiresPymes, item.label)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95",
                    active
                      ? "text-zinc-900 bg-zinc-100 border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
                    locked && "opacity-60"
                  )}
                >
                  {locked ? (
                    <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                  ) : (
                    <item.icon className={cn("w-3.5 h-3.5 shrink-0", active && "text-primary")} />
                  )}
                  {item.label}
                </button>
              );
            })}

            {/* ── Generar IA mega dropdown ── */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === "generar" ? null : "generar")}
                aria-expanded={openMenu === "generar"}
                aria-haspopup="true"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95",
                  isGenerarActive
                    ? "text-zinc-900 bg-zinc-100 border border-zinc-200"
                    : openMenu === "generar"
                    ? "text-zinc-800 bg-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                )}
              >
                <Wand2 className={cn("w-3.5 h-3.5 shrink-0", isGenerarActive && "text-primary")} />
                Generar IA
                <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform duration-200", openMenu === "generar" && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openMenu === "generar" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(dropdownPanel, "left-0 w-[560px]")}
                  >
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-primary" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                        Generar IA
                      </p>
                    </div>
                    {/* 2-column grid */}
                    <div className="grid grid-cols-2 divide-x divide-zinc-100">
                      {GENERAR_COLUMNS.map((col) => (
                        <div key={col.heading} className="p-2">
                          <p className={cn("px-3 pt-1 pb-2 text-[9px] font-black uppercase tracking-[0.25em]", col.color)}>
                            {col.heading}
                          </p>
                          {col.items.map((item) => {
                            const active = isActive(item.path);
                            return (
                              <button
                                key={item.path}
                                onClick={() => handleNav(item.path)}
                                className={cn(
                                  "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                                  active ? "bg-primary/5 border border-primary/10" : "hover:bg-zinc-50"
                                )}
                              >
                                <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", item.bg)}>
                                  <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                                </div>
                                <div>
                                  <p className={cn("text-[12px] font-semibold", active ? "text-primary" : "text-zinc-800")}>
                                    {item.label}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    {/* Footer link */}
                    <div className="px-5 py-2.5 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">Todas las herramientas de IA</span>
                      <button
                        onClick={() => handleNav("/studio")}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Ver Studio completo →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Biblioteca dropdown ── */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === "biblioteca" ? null : "biblioteca")}
                aria-expanded={openMenu === "biblioteca"}
                aria-haspopup="true"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 active:scale-95",
                  isBibliotecaActive
                    ? "text-zinc-900 bg-zinc-100 border border-zinc-200"
                    : openMenu === "biblioteca"
                    ? "text-zinc-800 bg-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                )}
              >
                <FolderOpen className={cn("w-3.5 h-3.5 shrink-0", isBibliotecaActive && "text-primary")} />
                Biblioteca
                <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform duration-200", openMenu === "biblioteca" && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openMenu === "biblioteca" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(dropdownPanel, "left-0 w-[260px]")}
                  >
                    <div className="px-4 py-2.5 border-b border-zinc-100">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Biblioteca</p>
                    </div>
                    <div className="p-2 space-y-0.5">
                      {BIBLIOTECA_ITEMS.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            className={cn(
                              "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                              active ? "bg-primary/5 border border-primary/10" : "hover:bg-zinc-50"
                            )}
                          >
                            <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", item.bg)}>
                              <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                            </div>
                            <div>
                              <p className={cn("text-[12px] font-semibold", active ? "text-primary" : "text-zinc-800")}>
                                {item.label}
                              </p>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
            <button
              onClick={() => handleNav("/pricing")}
              aria-label="Ver precios y planes"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-400 border border-zinc-200 hover:text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              <Zap className="w-3 h-3 text-primary" />
              Precios
            </button>

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
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
                <span className="hidden lg:block text-[12px] font-medium text-zinc-600 max-w-[90px] truncate">
                  {displayName ?? "Perfil"}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-[200] bg-white border border-zinc-200 shadow-lg shadow-zinc-100">
                    <div className="px-3 py-2.5 border-b border-zinc-100">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">
                        {profile?.display_name ?? "Mi Perfil"}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{profile?.email ?? ""}</p>
                    </div>
                    <div className="p-1">
                      {[
                        { label: "Mi Perfil",    icon: User,       path: "/profile"  },
                        { label: "Mis Activos",  icon: Monitor,    path: "/assets"   },
                        { label: "Planes",       icon: CreditCard, path: "/pricing"  },
                        { label: "Descargar App",icon: Download,   path: "/descargar"},
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
                        onClick={() => { onSignOut(); setUserMenuOpen(false); }}
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
              {mobileOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Menu ───────────────────────────────────────────────── */}
        {mobileOpen && (
          <div id="mobile-menu" className="fixed inset-0 top-[56px] z-40 md:hidden overflow-y-auto bg-white border-t border-zinc-200 px-4 py-5">
            {/* User card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-zinc-50 border border-zinc-200">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 truncate">{profile?.display_name ?? "Mi Perfil"}</p>
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
              {/* Direct items */}
              {DIRECT_ITEMS.map((item) => {
                const active = isActive(item.path);
                const locked = item.requiresPymes && !isPymes;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path, item.requiresPymes, item.label)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold transition-all",
                      active ? "bg-zinc-100 text-zinc-900 border border-zinc-200" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {locked ? <Lock className="w-5 h-5 text-amber-500" /> : <item.icon className={cn("w-5 h-5", active && "text-primary")} />}
                      {item.label}
                    </div>
                    {locked && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md">Pymes</span>}
                  </button>
                );
              })}

              {/* Generar IA section */}
              <div className="mt-2">
                <p className="px-4 pt-1 pb-1 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Generar IA</p>
                {GENERAR_COLUMNS.map((col) => (
                  <div key={col.heading}>
                    <p className={cn("px-4 py-1 text-[9px] font-bold uppercase tracking-widest", col.color)}>{col.heading}</p>
                    {col.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all"
                      >
                        <div className={cn("p-1.5 rounded-lg", item.bg)}>
                          <item.icon className={cn("w-4 h-4", item.color)} />
                        </div>
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Biblioteca section */}
              <div className="mt-2">
                <p className="px-4 pt-1 pb-1 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Biblioteca</p>
                {BIBLIOTECA_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all"
                  >
                    <div className={cn("p-1.5 rounded-lg", item.bg)}>
                      <item.icon className={cn("w-4 h-4", item.color)} />
                    </div>
                    {item.label}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleNav("/admin")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-red-400 bg-red-50 border border-red-100 mt-2"
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
                  onClick={() => { onSignOut(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-red-400 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" /> Cerrar sesión
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
