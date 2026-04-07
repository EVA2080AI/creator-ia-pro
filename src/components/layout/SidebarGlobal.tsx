import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutTemplate, Brain, FolderOpen, Image, Download,
  Coins, LogOut, User, Shield,
  Zap, Settings, CreditCard, Sparkles,
  PanelLeftClose, PanelLeftOpen, List, Code2,
  Home, LayoutGrid, ShieldCheck, Activity, Bot,
  Users2, Palette, type LucideIcon
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { useSidebarV2 } from '@/hooks/useSidebarV2';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { toast } from 'sonner';

/** ─── Tier Hierarchy ────────────────────────────────────────────────────────── */
const TIER_LEVELS: Record<string, number> = {
  'free': 0,
  'starter': 1,
  'creator': 2,
  'pymes': 3,
  'agency': 4,
  'admin': 5
};

const TIER_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  'starter': { label: 'STARTER', color: 'text-blue-500',    bg: 'bg-blue-50/80' },
  'creator': { label: 'CREATOR', color: 'text-violet-500',  bg: 'bg-violet-50/80' },
  'pymes':   { label: 'PYMES',   color: 'text-emerald-600', bg: 'bg-emerald-50/80' },
  'agency':  { label: 'AGENCY',  color: 'text-amber-600',   bg: 'bg-amber-50/80' },
  'admin':   { label: 'ADMIN',   color: 'text-red-500',     bg: 'bg-red-50/80' },
};

interface NavItemDef {
  path: string;
  label: string;
  icon: LucideIcon;
  minTier: string;
  tab?: string;
}

/** ─── Navigation structure ────────────────────────────────────────────────────── */
const NAV_MAIN: NavItemDef[] = [
  { path: '/dashboard',    label: 'Inicio',        icon: Home,           minTier: 'free' },
  { path: '/chat',         label: 'Genesis IA',    icon: Brain,          minTier: 'starter' },
  { path: '/code',         label: 'Editor',        icon: Code2,          minTier: 'starter' },
  { path: '/studio-flow',  label: 'Canvas IA',     icon: LayoutTemplate, minTier: 'creator' },
  { path: '/hub',          label: 'Templates',     icon: Sparkles,       minTier: 'creator' },
  { path: '/spaces',       label: 'Proyectos',     icon: FolderOpen,     minTier: 'creator' },
  { path: '/tools',        label: 'Aplicaciones',  icon: LayoutGrid,     minTier: 'free' },
  { path: '/antigravity',  label: 'Antigravity',   icon: Bot,            minTier: 'pymes' },
];

const NAV_SYSTEM: NavItemDef[] = [
  { path: '/admin',          label: 'Panel Control',    icon: ShieldCheck, minTier: 'admin' },
  { path: '/admin',          label: 'Usuarios',         icon: Users2,      minTier: 'admin', tab: 'usuarios' },
  { path: '/design-system',  label: 'Sistema de Diseño', icon: Palette,   minTier: 'admin' },
  { path: '/system-status',  label: 'Estatus',          icon: Activity,    minTier: 'admin' },
  { path: '/product-backlog', label: 'Roadmap',         icon: List,        minTier: 'free' },
];

const NAV_BOTTOM = [
  { path: '/profile',         label: 'Perfil',      icon: User },
  { path: '/pricing',         label: 'Planes',      icon: CreditCard },
  { path: '/descargar',       label: 'Descargar',   icon: Download },
];

export function SidebarGlobal({ isMobile }: { isMobile?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useAdmin(user?.id);
  const { globalExpanded, toggleGlobal } = useSidebarV2();
  const { groups, workspaceTitle } = useWorkspaceActions();

  const userTier = profile?.subscription_tier?.toLowerCase() ?? 'free';
  const userTierLevel = TIER_LEVELS[userTier] || 0;

  const isActive = (path?: string) => {
    if (!path) return false;
    const cleanPath = path.split('?')[0];
    return location.pathname === cleanPath || (cleanPath !== '/dashboard' && location.pathname.startsWith(cleanPath));
  };

  const handleNav = (path: string, minTier = 'free', label = '', tab?: string) => {
    const isPublic = ['/pricing', '/descargar', '/product-backlog'].includes(path);
    if (!user && !isPublic) {
      navigate('/auth');
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
        "relative z-20 h-screen flex flex-col bg-white shrink-0",
        isMobile ? "w-full border-r-0" : "hidden md:flex border-r border-zinc-200/60 shadow-[10px_0_40px_-10px_rgba(0,0,0,0.03)] bg-white/95 backdrop-blur-xl"
      )}
      style={{ width: isMobile ? 240 : W }}
      aria-label="Navegación principal"
    >
      <div className="flex h-[56px] items-center gap-3 px-3 border-b border-zinc-100 shrink-0 uppercase tracking-tighter">
        <AnimatePresence mode="wait">
          {(globalExpanded || isMobile) ? (
            <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 min-w-0">
              <Logo size="sm" showText onClick={() => navigate('/dashboard')} />
            </motion.div>
          ) : (
            <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Logo size="sm" showText={false} onClick={() => navigate('/dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
        {!isMobile && (
          <button onClick={toggleGlobal} className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all shrink-0">
            {globalExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
        <div className="px-2 space-y-0.5 mb-6">
          {(globalExpanded || isMobile) && (
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] opacity-60">Principal</span>
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
          <div className="px-2 space-y-0.5 mb-6">
            {(globalExpanded || isMobile) && (
              <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Shield className="w-2.5 h-2.5" />
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
          <div className="mt-8 mb-4 px-2 space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
            {(globalExpanded || isMobile) && (
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
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
                        'group w-full flex items-center rounded-xl transition-all duration-150 text-[12px] font-bold outline-none',
                        (globalExpanded || isMobile) ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center',
                        action.active ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
                        action.variant === 'primary' && !action.active && 'bg-primary/5 text-primary border border-primary/20',
                        action.disabled && 'opacity-20 cursor-not-allowed'
                      )}
                    >
                      <action.icon className={cn('shrink-0 w-4 h-4', action.active ? 'text-white' : (action.variant === 'primary' ? 'text-primary' : 'text-zinc-400'))} />
                      {(globalExpanded || isMobile) && <span className="truncate flex-1 text-left">{action.label}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {(globalExpanded || isMobile) && profile && (
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Créditos</span>
            </div>
            <div className="flex items-center gap-2 relative z-10">
               <Coins className="w-4 h-4 text-primary shrink-0" />
               <span className="text-[16px] font-black text-zinc-900 tabular-nums">{profile.credits_balance?.toLocaleString() ?? '0'}</span>
            </div>
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-zinc-100 p-2 space-y-1 bg-white/50 backdrop-blur-md">
        {NAV_BOTTOM.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            title={!(globalExpanded || isMobile) ? item.label : undefined}
            aria-label={item.label}
            className={cn('group w-full flex items-center rounded-xl transition-all duration-150 text-[12px] font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50', (globalExpanded || isMobile) ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center')}
          >
            <item.icon className="shrink-0 w-4 h-4" />
            {(globalExpanded || isMobile) && <span className="truncate flex-1 text-left">{item.label}</span>}
          </button>
        ))}

        <div className={cn('flex items-center gap-2 px-2 py-2 rounded-xl mt-2 transition-all', (globalExpanded || isMobile) ? 'bg-zinc-50 border border-zinc-100 shadow-inner' : 'justify-center')}>
          {user ? (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-white border border-zinc-200 shadow-sm">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-zinc-300" />}
              </div>
              {(globalExpanded || isMobile) && (
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[11px] font-black text-zinc-900 truncate leading-tight">{profile?.display_name || user.email?.split('@')[0]}</p>
                  <p className="text-[9px] font-bold text-zinc-400 truncate uppercase tracking-widest">{profile?.subscription_tier || 'Free'}</p>
                </div>
              )}
              {(globalExpanded || isMobile) && (
                <button onClick={handleSignOut} title="Cerrar sesión" aria-label="Cerrar sesión" className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut className="w-4 h-4" /></button>
              )}
              {!(globalExpanded || isMobile) && (
                <button onClick={handleSignOut} title="Cerrar sesión" aria-label="Cerrar sesión" className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut className="w-4 h-4" /></button>
              )}
            </>
          ) : (
             <button onClick={() => navigate('/auth')} className={cn('flex items-center gap-2 text-zinc-500 hover:text-zinc-900 px-3 py-2 w-full', !(globalExpanded || isMobile) && 'justify-center')}>
              <User className="w-4 h-4" />
              {(globalExpanded || isMobile) && <span className="text-xs font-bold font-black">LOGIN</span>}
            </button>
          )}
        </div>
      </div>
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
        'group w-full flex items-center rounded-xl transition-all duration-200 text-[12.5px] font-medium outline-none relative',
        expanded ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center',
        active ? 'bg-primary/10 text-primary border border-primary/20 font-black shadow-sm' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent',
        className
      )}
    >
      <Icon className={cn('shrink-0 transition-all duration-200', expanded ? 'w-4 h-4' : 'w-5 h-5', active ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-700 group-hover:scale-110')} />
      {expanded && (
        <span className="truncate flex-1 text-left flex items-center justify-between gap-2">
          {label}
          {config && (
            <span className={cn("text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wide shrink-0 shadow-sm", config.bg, config.color)}>{config.label}</span>
          )}
        </span>
      )}
    </button>
  );
}
