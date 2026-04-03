import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  LayoutTemplate, Brain, FolderOpen, Image, Download,
  ChevronDown, Coins, LogOut, User, Shield,
  Wand2, Hash, Megaphone, PenLine, Zap,
  Settings, History, CreditCard, Monitor, Sparkles,
  PanelLeftClose, PanelLeftOpen, Terminal, List, Code2,
  Home, LayoutGrid, Share2, ShieldCheck, Activity, Bot, ChevronUp
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { useSidebarV2 } from '@/hooks/useSidebarV2';
import { useWorkspaceActions } from '@/hooks/useWorkspaceActions';
import { toast } from 'sonner';

// ── Navigation structure ──────────────────────────────────────────────────────
const NAV_MAIN = [
  { path: '/dashboard',    label: 'Inicio',        icon: Home,           requiresPymes: false },
  { 
    id: 'group-studio',
    label: 'Studio Flow',   
    icon: LayoutTemplate, 
    requiresPymes: true,
    subItems: [
      { path: '/studio-flow', label: 'Canvas IA', icon: LayoutTemplate },
      { path: '/hub',         label: 'Templates', icon: Sparkles },
      { path: '/spaces',      label: 'Proyectos', icon: FolderOpen },
    ]
  },
  { path: '/code',         label: 'Editor',        icon: Code2,          requiresPymes: false },
  { path: '/tools',        label: 'Aplicaciones',  icon: LayoutGrid,     requiresPymes: false },
  { path: '/antigravity',  label: 'Antigravity',   icon: Bot,            requiresPymes: false },
];

const NAV_SOCIAL = [
  { path: '/assets',       label: 'Activos',       icon: Image,          requiresPymes: false },
  { path: '/sharescreen',  label: 'Compartir',     icon: Share2,         requiresPymes: false },
  { path: '/history',      label: 'Historial',     icon: History,        requiresPymes: false },
];

const NAV_SYSTEM = [
  { path: '/admin',         label: 'Panel Control', icon: ShieldCheck,   requiresPymes: false },
  { path: '/system-status', label: 'Estatus',       icon: Activity,      requiresPymes: false },
  { path: '/product-backlog', label: 'Roadmap',     icon: List,          requiresPymes: false },
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
  const { globalExpanded, toggleGlobal, expandGlobal } = useSidebarV2();
  const { groups, workspaceTitle } = useWorkspaceActions();

  // Acordión Menu State
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isPymes = ['pymes', 'agency', 'admin'].includes(
    profile?.subscription_tier?.toLowerCase() ?? 'free'
  );

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const isGroupActive = (subItems: any[]) => subItems.some(item => isActive(item.path));

  // Automatically open group if a child is active initially
  useEffect(() => {
    const newGroups = { ...openGroups };
    for (const item of NAV_MAIN) {
      if (item.subItems && isGroupActive(item.subItems)) {
        newGroups[item.id!] = true;
      }
    }
    setOpenGroups(newGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleNav = (path: string, requiresPymes = false, label = '') => {
    const isPublic = ['/pricing', '/descargar', '/product-backlog'].includes(path);
    if (!user && !isPublic) {
      navigate('/auth');
      return;
    }
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

  const toggleGroup = (id: string) => {
    // Si el sidebar principal está colapsado, abrirlo
    if (!globalExpanded && !isMobile) {
      expandGlobal();
    }
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const W = globalExpanded ? 240 : 64;

  return (
    <motion.aside
      animate={{ 
        width: isMobile ? 240 : W,
        x: 0 
      }}
      initial={{ x: isMobile ? 0 : -W }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "relative z-20 h-screen flex flex-col bg-white shrink-0",
        isMobile ? "w-full border-r-0" : "hidden md:flex border-r border-zinc-200/60 shadow-[10px_0_40px_-10px_rgba(0,0,0,0.03)] bg-white/95 backdrop-blur-xl"
      )}
      style={{ width: isMobile ? 240 : W }}
      aria-label="Navegación principal"
    >
      {/* ── Header ── */}
      <div className="flex h-[56px] items-center gap-3 px-3 border-b border-zinc-100 shrink-0 uppercase tracking-tighter">
        <AnimatePresence mode="wait">
          {(globalExpanded || isMobile) ? (
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
        {!isMobile && (
          <button
            onClick={toggleGlobal}
            aria-label={globalExpanded ? 'Colapsar menú' : 'Expandir menú'}
            className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all shrink-0"
          >
            {globalExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
        {/* 1. PRINCIPAL */}
        <div className="px-2 space-y-0.5 mb-6">
          {(globalExpanded || isMobile) && (
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] opacity-60">Principal</span>
            </div>
          )}
          {NAV_MAIN.map((item) => {
            if (item.subItems) {
              const activeGroup = isGroupActive(item.subItems);
              const isOpen = openGroups[item.id!];
              
              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup(item.id!)}
                    className={cn(
                      'group w-full flex items-center rounded-xl transition-all duration-200 text-[12.5px] font-medium outline-none',
                      (globalExpanded || isMobile) ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center',
                      activeGroup
                        ? 'bg-primary/10 text-primary border border-primary/20 font-black shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
                    )}
                  >
                    <item.icon className={cn(
                      'shrink-0 transition-all duration-200',
                      (globalExpanded || isMobile) ? 'w-4 h-4' : 'w-5 h-5',
                      activeGroup ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-700 group-hover:scale-110'
                    )} />
                    {(globalExpanded || isMobile) && (
                      <>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-50" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50" />}
                      </>
                    )}
                    {(globalExpanded || isMobile) && activeGroup && !isOpen && (
                      <motion.div 
                        layoutId="active-nav-glow" 
                        className="w-1.5 h-1.5 rounded-full bg-primary ml-2"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {(globalExpanded || isMobile) && isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-9 pr-1 pt-0.5 pb-1 space-y-0.5 border-l-2 border-primary/10 ml-4">
                          {item.subItems.map((subItem) => {
                            const subActive = isActive(subItem.path);
                            return (
                              <button
                                key={subItem.path}
                                onClick={() => handleNav(subItem.path, item.requiresPymes, subItem.label)}
                                className={cn(
                                  'group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-all duration-150',
                                  subActive 
                                    ? 'bg-primary/5 text-primary font-bold' 
                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                )}
                              >
                                {subItem.icon && (
                                  <subItem.icon className={cn(
                                    "w-3.5 h-3.5 shrink-0", 
                                    subActive ? "text-primary" : "text-zinc-400"
                                  )} />
                                )}
                                <span className={cn("truncate flex-1 text-left", !subItem.icon && "pl-1.5")}>
                                  {subItem.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Regular items
            return (
              <NavItem 
                key={item.path} 
                path={item.path!}
                label={item.label}
                icon={item.icon}
                active={isActive(item.path)} 
                expanded={globalExpanded || isMobile}
                isPymes={isPymes}
                onClick={() => handleNav(item.path!, item.requiresPymes, item.label)} 
              />
            );
          })}
        </div>

        {/* 2. CONTENIDO & SOCIAL */}
        <div className="px-2 space-y-0.5 mb-6">
          {(globalExpanded || isMobile) && (
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] opacity-60">Contenido</span>
            </div>
          )}
          {NAV_SOCIAL.map((item) => (
            <NavItem 
              key={item.path} 
              path={item.path}
              label={item.label}
              icon={item.icon}
              active={isActive(item.path)} 
              expanded={globalExpanded || isMobile}
              isPymes={isPymes}
              onClick={() => handleNav(item.path, item.requiresPymes, item.label)} 
            />
          ))}
          <NavItem 
            path="/chat"
            label="Genesis IA"
            icon={Brain}
            active={isActive('/chat')}
            expanded={globalExpanded || isMobile}
            isPymes={isPymes}
            className="text-primary hover:bg-primary/5"
            onClick={() => navigate('/chat')}
          />
        </div>

        {/* 3. SISTEMA (Admin Only) */}
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
                key={item.path} 
                path={item.path}
                label={item.label}
                icon={item.icon}
                active={isActive(item.path)} 
                expanded={globalExpanded || isMobile}
                isPymes={isPymes}
                onClick={() => handleNav(item.path, item.requiresPymes, item.label)} 
              />
            ))}
          </div>
        )}

        {/* Workspace Contextual Actions */}
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
                        action.active
                          ? 'bg-zinc-900 text-white shadow-lg'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
                        action.variant === 'primary' && !action.active && 'bg-primary/5 text-primary border border-primary/20',
                        action.disabled && 'opacity-20 cursor-not-allowed'
                      )}
                    >
                      <action.icon className={cn(
                        'shrink-0 w-4 h-4',
                        action.active ? 'text-white' : (action.variant === 'primary' ? 'text-primary' : 'text-zinc-400')
                      )} />
                      {(globalExpanded || isMobile) && <span className="truncate flex-1 text-left">{action.label}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credits bar */}
        {(globalExpanded || isMobile) && profile && (
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Créditos</span>
            </div>
            <div className="flex items-center gap-2 relative z-10">
               <Coins className="w-4 h-4 text-primary shrink-0" />
               <span className="text-[16px] font-black text-zinc-900 tabular-nums">
                 {profile.credits_balance?.toLocaleString() ?? '0'}
               </span>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-zinc-100 p-2 space-y-1 bg-white/50 backdrop-blur-md">
        {NAV_BOTTOM.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={cn(
              'group w-full flex items-center rounded-xl transition-all duration-150 text-[12px] font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50',
              (globalExpanded || isMobile) ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center'
            )}
          >
            <item.icon className="shrink-0 w-4 h-4" />
            {(globalExpanded || isMobile) && <span className="truncate flex-1 text-left">{item.label}</span>}
          </button>
        ))}

        <div className={cn(
          'flex items-center gap-2 px-2 py-2 rounded-xl mt-2 transition-all',
          (globalExpanded || isMobile) ? 'bg-zinc-50 border border-zinc-100 shadow-inner' : 'justify-center'
        )}>
          {user ? (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-white border border-zinc-200 shadow-sm">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-4 h-4 text-zinc-300" />}
              </div>
              {(globalExpanded || isMobile) && (
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[11px] font-black text-zinc-900 truncate leading-tight">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 truncate uppercase tracking-widest">
                    {profile?.subscription_tier || 'Free'}
                  </p>
                </div>
              )}
              {(globalExpanded || isMobile) && (
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
             <button
              onClick={() => navigate('/auth')}
              className={cn(
                'flex items-center gap-2 text-zinc-500 hover:text-zinc-900 px-3 py-2 w-full',
                !(globalExpanded || isMobile) && 'justify-center'
              )}
            >
              <User className="w-4 h-4" />
              {(globalExpanded || isMobile) && <span className="text-xs font-bold font-black">LOGIN</span>}
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

// ── NavItem Subcomponent ──
function NavItem({ 
  path, label, icon: Icon, active, expanded, onClick, className 
}: { 
  path: string, label: string, icon: any, active: boolean, expanded: boolean, 
  isPymes: boolean, onClick: () => void, className?: string 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full flex items-center rounded-xl transition-all duration-200 text-[12.5px] font-medium outline-none',
        expanded ? 'gap-3 px-3 py-2.5' : 'gap-0 px-0 py-2.5 justify-center',
        active
          ? 'bg-primary/10 text-primary border border-primary/20 font-black shadow-sm'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent',
        className
      )}
    >
      <Icon className={cn(
        'shrink-0 transition-all duration-200',
        expanded ? 'w-4 h-4' : 'w-5 h-5',
        active ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-700 group-hover:scale-110'
      )} />
      {expanded && <span className="truncate flex-1 text-left">{label}</span>}
      {expanded && active && (
        <motion.div 
          layoutId="active-nav-glow" 
          className="w-1.5 h-1.5 rounded-full bg-primary ml-2"
        />
      )}
    </button>
  );
}
