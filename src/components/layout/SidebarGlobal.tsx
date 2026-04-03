import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate, Brain, FolderOpen, Image, Download,
  ChevronDown, Coins, LogOut, User, Shield,
  Wand2, Hash, Megaphone, PenLine, Zap,
  Settings, History, CreditCard, Monitor, Sparkles,
  PanelLeftClose, PanelLeftOpen, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { useSidebarV2 } from '@/hooks/useSidebarV2';
import { toast } from 'sonner';

// ── Navigation structure ──────────────────────────────────────────────────────
const NAV_MAIN = [
  { path: '/dashboard',    label: 'Dashboard',     icon: Monitor,    requiresPymes: false },
  { path: '/chat',         label: 'Genesis IA',     icon: Brain,       requiresPymes: false },
  { path: '/formarketing', label: 'Canvas IA',      icon: LayoutTemplate, requiresPymes: true },
  { path: '/code',         label: 'Code IDE',       icon: Terminal,    requiresPymes: true },
  { path: '/tools',        label: 'Herramientas',   icon: Wand2,       requiresPymes: false },
  { path: '/hub',          label: 'Plantillas',     icon: Sparkles,    requiresPymes: false },
  { path: '/spaces',       label: 'Mis Espacios',   icon: FolderOpen,  requiresPymes: false },
  { path: '/assets',       label: 'Activos',        icon: Image,       requiresPymes: false },
];

const NAV_BOTTOM = [
  { path: '/profile',  label: 'Mi Perfil', icon: User },
  { path: '/pricing',  label: 'Planes',    icon: CreditCard },
  { path: '/descargar',label: 'Descargar', icon: Download },
];

export function SidebarGlobal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useAdmin(user?.id);
  const { globalExpanded, toggleGlobal, toggleContextual, activeContextual } = useSidebarV2();

  const isPymes = ['pymes', 'agency', 'admin'].includes(
    profile?.subscription_tier?.toLowerCase() ?? 'free'
  );

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleNav = (path: string, requiresPymes = false, label = '') => {
    if (requiresPymes && !isPymes) {
      toast.error('Funcionalidad exclusiva', {
        description: `"${label}" es exclusivo del plan Pymes.`,
        action: { label: 'Ver planes', onClick: () => navigate('/pricing') },
        duration: 6000,
      });
      return;
    }
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const W = globalExpanded ? 240 : 64;

  return (
    <motion.aside
      animate={{ width: W }}
      transition={{ duration: 0.22, ease: [0.32, 0, 0.08, 1] }}
      className="relative z-20 flex h-screen flex-col border-r border-zinc-200 bg-white overflow-hidden shrink-0"
      style={{ width: W }}
      aria-label="Navegación principal"
    >
      {/* ── Header ── */}
      <div className="flex h-[56px] items-center gap-3 px-3 border-b border-zinc-100 shrink-0">
        <AnimatePresence mode="wait">
          {globalExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0"
            >
              <Logo size="sm" showText onClick={() => navigate('/dashboard')} />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Logo size="sm" showText={false} onClick={() => navigate('/dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleGlobal}
          aria-label={globalExpanded ? 'Colapsar menú' : 'Expandir menú'}
          className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all shrink-0"
          title={globalExpanded ? 'Colapsar (⌘\\)' : 'Expandir (⌘\\)'}
        >
          {globalExpanded
            ? <PanelLeftClose className="w-4 h-4" />
            : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Scrollable nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 no-scrollbar">
        <div className="px-2 space-y-0.5">
          {NAV_MAIN.map((item) => {
            const active = isActive(item.path);
            const locked = item.requiresPymes && !isPymes;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path, item.requiresPymes, item.label)}
                aria-current={active ? 'page' : undefined}
                title={!globalExpanded ? item.label : undefined}
                className={cn(
                  'group w-full flex items-center rounded-xl transition-all duration-150 text-[12.5px] font-medium',
                  globalExpanded ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center',
                  active
                    ? 'bg-primary/8 text-primary border border-primary/15'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50',
                  locked && 'opacity-50'
                )}
              >
                <item.icon className={cn(
                  'shrink-0 transition-colors',
                  globalExpanded ? 'w-4 h-4' : 'w-4.5 h-4.5',
                  active ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-600'
                )} />
                {globalExpanded && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {globalExpanded && locked && (
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
                    Pymes
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div className="my-3 mx-3 h-px bg-zinc-100" />

        {/* ── Genesis IA trigger ── */}
        <div className="px-2 space-y-0.5">
          <button
            onClick={() => toggleContextual('genesis')}
            title={!globalExpanded ? 'Genesis IA' : undefined}
            className={cn(
              'group w-full flex items-center rounded-xl transition-all duration-150 text-[12.5px] font-medium',
              globalExpanded ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center',
              activeContextual === 'genesis'
                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            )}
          >
            <Sparkles className={cn(
              'shrink-0 w-4 h-4 transition-colors',
              activeContextual === 'genesis' ? 'text-violet-600' : 'text-zinc-400 group-hover:text-zinc-600'
            )} />
            {globalExpanded && <span className="truncate flex-1 text-left">Asistente IA</span>}
          </button>

          <button
            onClick={() => toggleContextual('history')}
            title={!globalExpanded ? 'Historial' : undefined}
            className={cn(
              'group w-full flex items-center rounded-xl transition-all duration-150 text-[12.5px] font-medium',
              globalExpanded ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center',
              activeContextual === 'history'
                ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            )}
          >
            <History className="shrink-0 w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            {globalExpanded && <span className="truncate flex-1 text-left">Historial</span>}
          </button>
        </div>

        {/* ── Credits bar ── */}
        {globalExpanded && profile && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-primary/5 border border-primary/12">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Créditos</span>
              <button onClick={() => navigate('/pricing')} className="text-[10px] font-bold text-primary hover:underline">
                + Añadir
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[13px] font-bold text-zinc-800 tabular-nums font-mono">
                {profile.credits_balance?.toLocaleString() ?? '—'}
              </span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, ((profile.credits_balance ?? 0) / 50000) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-zinc-100 p-2 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            title={!globalExpanded ? item.label : undefined}
            className={cn(
              'group w-full flex items-center rounded-xl transition-all duration-150 text-[12px] font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50',
              globalExpanded ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center'
            )}
          >
            <item.icon className="shrink-0 w-3.5 h-3.5 transition-colors" />
            {globalExpanded && <span className="truncate flex-1 text-left">{item.label}</span>}
          </button>
        ))}

        {isAdmin && (
          <button
            onClick={() => handleNav('/admin')}
            title={!globalExpanded ? 'Admin' : undefined}
            className={cn(
              'group w-full flex items-center rounded-xl text-[12px] font-medium text-red-400 hover:bg-red-50 transition-all',
              globalExpanded ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center'
            )}
          >
            <Shield className="shrink-0 w-3.5 h-3.5" />
            {globalExpanded && <span className="flex-1 text-left">Admin</span>}
          </button>
        )}

        {/* User row */}
        <div className={cn(
          'flex items-center gap-2 px-2 py-2 rounded-xl mt-1',
          globalExpanded ? 'bg-zinc-50 border border-zinc-100' : 'justify-center'
        )}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <User className="w-3.5 h-3.5 text-zinc-400" />}
          </div>
          {globalExpanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-zinc-800 truncate">
                  {profile?.display_name?.split(' ')[0] ?? 'Usuario'}
                </p>
                <p className="text-[10px] text-zinc-400 truncate capitalize">
                  {profile?.subscription_tier ?? 'free'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                aria-label="Cerrar sesión"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
