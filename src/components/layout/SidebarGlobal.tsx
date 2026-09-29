import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutTemplate, Brain, Image, Download,
  Coins, LogOut, User, Shield, Zap, Settings, CreditCard, Sparkles,
  PanelLeftClose, PanelLeftOpen, List, Bug,
  ShieldCheck, Activity,
  Users2, Palette, Scale, Code2, type LucideIcon
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { ReportModal } from '@/components/tickets/ReportModal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { useSidebarV2 } from '@/hooks/useSidebarV2';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { toast } from 'sonner';
import { CANVAS_ENABLED } from '@/lib/features';

/** ─── Tier Hierarchy ────────────────────────────────────────────────────────── */
const TIER_LEVELS: Record<string, number> = {
  'free': 0,
  'creador': 1,
  'pro': 2,
  'agencia': 3,
  'pyme': 4,
  'pymes': 4,
  'admin': 5
};

const TIER_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  'creador': { label: 'CREADOR', color: 'text-blue-500 dark:text-blue-400',       bg: 'bg-blue-50/80 dark:bg-blue-500/10' },
  'pro':     { label: 'PRO',     color: 'text-violet-500 dark:text-violet-400',   bg: 'bg-violet-50/80 dark:bg-violet-500/10' },
  'agencia': { label: 'AGENCIA', color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50/80 dark:bg-amber-500/10' },
  'pyme':    { label: 'PYME',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-500/10' },
  'pymes':   { label: 'PYMES',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-500/10' },
  'admin':   { label: 'ADMIN',   color: 'text-red-500 dark:text-red-400',         bg: 'bg-red-50/80 dark:bg-red-500/10' },
  'soon':    { label: 'PRONTO',  color: 'text-muted-foreground', bg: 'bg-muted' },
};

interface NavItemDef {
  path: string;
  label: string;
  icon: LucideIcon;
  minTier: string;
  tab?: string;
}

/** ─── Navigation structure ────────────────────────────────────────────────────── */
// Aplicaciones se fusionó de verdad dentro de Basalt (panel "Herramientas" en
// Chat.tsx) — ya no tiene entrada propia. Basalt baja de minTier 'creador' a
// 'free' para no paywallear ese panel: las herramientas gratis que ya
// ofrecía Aplicaciones (ej. gemini-flash-image, minTier 'free' en
// src/lib/ai/models.ts) siguen siendo gratis, el gate real de créditos/tier
// por modelo no cambia — esto solo afecta si el link del sidebar es
// clickeable o muestra el toast de upsell.
//
// Inicio/Tareas/Proyectos/Perfil YA NO están acá (auditoría UX 2026-09-29):
// esas páginas se migraron al shell de Basalt (BasaltAppLayout), así que
// clickearlas desde este menú viejo saltaba de golpe a un shell totalmente
// distinto, sin transición, reseteando el tema — la misma fragmentación que
// la migración buscaba resolver. Siguen a un click de distancia: Basalt IA
// (abajo) → sección "Plataforma" de su propio sidebar.
const NAV_MAIN: NavItemDef[] = [
  { path: '/a/basalt',     label: 'Basalt IA',     icon: Brain,          minTier: 'free' },
  { path: '/a/arena',      label: 'Arena IA',      icon: Scale,          minTier: 'free' },
  { path: '/studio-flow',  label: 'Canvas IA',     icon: LayoutTemplate, minTier: CANVAS_ENABLED ? 'pro' : 'soon' },
];

const NAV_SYSTEM: NavItemDef[] = [
  { path: '/admin',          label: 'Panel Control',    icon: ShieldCheck, minTier: 'admin' },
  { path: '/admin',          label: 'Usuarios',         icon: Users2,      minTier: 'admin', tab: 'usuarios' },
  { path: '/design-system',  label: 'Sistema de Diseño', icon: Palette,   minTier: 'admin' },
  { path: '/system-status',  label: 'Estatus',          icon: Activity,    minTier: 'admin' },
];

// Roadmap es pública (minTier: 'free') — va en NAV_BOTTOM, no en NAV_SYSTEM,
// porque ese bloque solo se renderiza para admins (ver `{isAdmin && (...)}`
// más abajo). Estaba mal ubicada: los usuarios normales nunca la veían en
// el sidebar aunque la ruta siempre estuvo disponible para todos.
const NAV_BOTTOM = [
  { path: '/product-backlog', label: 'Roadmap',    icon: List },
  { path: '/pricing',         label: 'Planes',      icon: CreditCard },
  { path: '/descargar',       label: 'Descargar',   icon: Download },
];

export function SidebarGlobal({ isMobile }: { isMobile?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useAdmin(user?.id);
  const { globalExpanded, toggleGlobal } = useSidebarV2();
  const { groups, workspaceTitle } = useWorkspaceActions();

  const userTier = profile?.subscription_tier?.toLowerCase() ?? 'free';
  const userTierLevel = TIER_LEVELS[userTier] || 0;

  const isActive = (path?: string) => {
    if (!path) return false;
    const cleanPath = path.split('?')[0];
    return location.pathname === cleanPath || location.pathname.startsWith(cleanPath);
  };

  const handleNav = (path: string, minTier = 'free', label = '', tab?: string) => {
    const isPublic = ['/pricing', '/descargar', '/product-backlog'].includes(path);
    if (!user && !isPublic) {
      navigate('/auth');
      return;
    }
    if (minTier === 'soon' && !isAdmin) {
      toast(`${label} — Próximamente`, { description: 'Estamos terminando esta función. Te avisaremos cuando esté lista.' });
      return;
    }
    const requiredLevel = TIER_LEVELS[minTier] || 0;
    const canAccess = isAdmin || userTierLevel >= requiredLevel;
    if (!canAccess) {
      toast.error('Acceso Restringido', {
        description: `"${label}" requiere el plan ${minTier.toUpperCase()} o superior.`,
        action: { label: 'Mejorar Plan', onClick: () => navigate('/pricing') },
        duration: 5000,
      });
      return;
    }
    navigate(tab ? `${path}?tab=${tab}` : path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const W = globalExpanded ? 240 : 64;

  return (
    <motion.aside
      animate={{ width: isMobile ? 240 : W, x: 0 }}
      initial={{ x: isMobile ? 0 : -W }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "relative z-20 h-screen flex flex-col shrink-0 overflow-hidden",
        isMobile ? "w-full bg-background border-r-0" : "hidden md:flex border-r border-border bg-background/60 backdrop-blur-md shadow-[1px_0_20px_rgba(0,0,0,0.02)]"
      )}
      style={{ width: isMobile ? 240 : W }}
      aria-label="Navegación principal"
    >
      {/* El Sheet mobile (AppLayout.tsx) arranca en el borde real del
          viewport (top:0), sin el padding-top que sí tiene el drawer de
          Basalt para el notch/status bar — mismo bug ya resuelto ahí,
          reabierto acá (auditoría UX 2026-09-29). */}
      <div
        className="flex h-[60px] items-center gap-3 px-3 shrink-0 uppercase tracking-tighter relative"
        style={isMobile ? { paddingTop: "env(safe-area-inset-top)", height: "calc(60px + env(safe-area-inset-top))" } : undefined}
      >
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <AnimatePresence mode="wait">
          {(globalExpanded || isMobile) ? (
            <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 min-w-0 pl-1">
              <Logo size="sm" showText onClick={() => navigate('/dashboard')} />
            </motion.div>
          ) : (
            <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full flex justify-center">
              <Logo size="sm" showText={false} onClick={() => navigate('/dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
        {!isMobile && (
          <button onClick={toggleGlobal} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0">
            {globalExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto pt-2 pb-6 no-scrollbar">
        <div className="px-3 space-y-1 mb-6">
          {(globalExpanded || isMobile) && (
            <div className="pt-3 pb-1 mb-1 px-1">
              <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Principal
              </span>
            </div>
          )}
          {NAV_MAIN.map((item) => (
            <NavItem
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              active={isActive(item.path)}
              expanded={globalExpanded || isMobile}
              minTier={item.minTier}
              onClick={() => handleNav(item.path, item.minTier, item.label)}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="px-3 space-y-1 mb-6">
            {(globalExpanded || isMobile) && (
             <div className="pt-3 pb-1 mb-1 px-1">
                <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-red-500/60">
                   <Shield className="w-3 h-3" />
                   Sistema
                </span>
              </div>
            )}
            {NAV_SYSTEM.map((item) => (
              <NavItem
                key={`${item.path}-${item.label}`}
                path={item.path}
                label={item.label}
                icon={item.icon}
                active={isActive(item.path)}
                expanded={globalExpanded || isMobile}
                minTier={item.minTier}
                onClick={() => handleNav(item.path, item.minTier, item.label, item.tab)}
              />
            ))}
          </div>
        )}

        {groups.length > 0 && (
          <div className="mt-8 mb-4 px-3 space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
            {(globalExpanded || isMobile) && (
              <div className="px-1 py-1.5">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 shadow-[0_0_8px_rgba(var(--primary-rgb),0.1)]">
                  {workspaceTitle || 'Herramientas'}
                </span>
              </div>
            )}
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="space-y-1">
                  {group.actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        'group w-full flex items-center rounded-2xl transition-all duration-300 text-[12px] font-bold outline-none',
                        (globalExpanded || isMobile) ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center',
                        action.active ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground',
                        action.variant === 'primary' && !action.active && 'bg-primary/5 text-primary border border-primary/20',
                        action.disabled && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <action.icon className={cn('shrink-0 w-4 h-4', action.active ? 'text-primary-foreground' : (action.variant === 'primary' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'))} />
                      {(globalExpanded || isMobile) && <span className="truncate flex-1 text-left">{action.label}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {(globalExpanded || isMobile) && profile && (
          <div className="mx-4 mt-8 p-4 rounded-2xl bg-muted/50 border border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative group">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Créditos</span>
            </div>
            <div className="flex items-center gap-2 relative z-10 w-max bg-card/80 px-2 py-1 rounded-xl shadow-sm border border-border">
               <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
               <span className="text-[13px] font-black text-foreground tabular-nums">{profile.credits_balance?.toLocaleString() ?? '0'}</span>
            </div>
          </div>
        )}
      </nav>

      <div className="shrink-0 p-3 space-y-1 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        {NAV_BOTTOM.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            title={!(globalExpanded || isMobile) ? item.label : undefined}
            aria-label={item.label}
            className={cn('group w-full flex items-center rounded-2xl transition-all duration-300 text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted', (globalExpanded || isMobile) ? 'gap-3 px-4 py-2.5' : 'gap-0 px-0 py-2.5 justify-center')}
          >
            <item.icon className="shrink-0 w-4 h-4 transition-transform group-hover:scale-105" />
            {(globalExpanded || isMobile) && <span className="truncate flex-1 text-left leading-none mt-0.5">{item.label}</span>}
          </button>
        ))}

        {/* "Modo oscuro" vivía acá antes — es una preferencia de cuenta, no
            un destino de navegación; se movió a /profile (auditoría UX).
            Esta fila ahora es un menú desplegable (como el de Claude:
            click en la cuenta → Perfil / Reportar / Cerrar sesión) en vez
            de navegar directo y tener un botón de tickets flotando aparte. */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn('flex w-full items-center gap-2 rounded-2xl mt-3 transition-all group hover:bg-muted', (globalExpanded || isMobile) ? 'p-2' : 'p-2 justify-center')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-muted border border-border shadow-sm transition-transform group-hover:scale-95">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                </div>
                {(globalExpanded || isMobile) && (
                  <div className="flex-1 min-w-0 px-1 text-left">
                    <p className="text-[12px] font-black text-foreground truncate leading-none transition-colors">{profile?.display_name || user.email?.split('@')[0]}</p>
                    <p className="text-[9px] font-bold text-muted-foreground truncate uppercase tracking-widest mt-1.5">{profile?.subscription_tier || 'Free'}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 p-1.5 rounded-2xl bg-popover/95 backdrop-blur-xl border-border shadow-2xl">
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => setShowReport(true)}>
                <Bug className="w-4 h-4" /> Reportar un error o mejora
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer text-rose-500 focus:text-rose-500" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button onClick={() => navigate('/auth')} className={cn('flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 w-full mt-3', !(globalExpanded || isMobile) && 'justify-center')}>
            <User className="w-4 h-4" />
            {(globalExpanded || isMobile) && <span className="text-xs font-bold font-black">LOGIN</span>}
          </button>
        )}
      </div>
      <ReportModal open={showReport} onClose={() => setShowReport(false)} />
    </motion.aside>
  );
}

function NavItem({
  label, icon: Icon, active, expanded, onClick, className, minTier = 'free'
}: {
  path: string, label: string, icon: LucideIcon, active: boolean, expanded: boolean,
  onClick: () => void, className?: string, minTier?: string
}) {
  const config = TIER_CONFIG[minTier.toLowerCase()];
  return (
    <button
      onClick={onClick}
      title={!expanded ? label : undefined}
      aria-label={label}
      className={cn(
        'group w-full flex items-center rounded-2xl transition-all duration-300 text-[12px] font-bold outline-none relative overflow-hidden',
        expanded ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center',
        active ? 'bg-primary/5 text-primary border border-primary/10 shadow-[0_4px_20px_-4px_rgba(var(--primary-rgb),0.12)]' : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent',
        className
      )}
    >
      <Icon className={cn('shrink-0 transition-transform duration-300', expanded ? 'w-4 h-4' : 'w-5 h-5', active ? 'text-primary scale-105' : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground')} />
      {expanded && (
        <span className="truncate flex-1 text-left flex items-center justify-between gap-2 mt-0.5 leading-none">
          {label}
          {config && (
            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-[6px] tracking-widest shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.04)] leading-none border border-black/5", config.bg, config.color)}>{config.label}</span>
          )}
        </span>
      )}
      {active && expanded && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary shadow-[2px_0_8px_rgba(var(--primary-rgb),0.35)]" />
      )}
    </button>
  );
}
