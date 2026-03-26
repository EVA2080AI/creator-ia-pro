import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Sparkles, LayoutGrid, Wand2, Image, Coins, Shield,
  CreditCard, LogOut, Palette, Home, Menu, X, Activity, MonitorDown, Code, User,
  ChevronDown, Zap, Rocket, BookOpen, Layers, Settings
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userId?: string;
  onSignOut: () => void;
}

export function AppHeader({ userId, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile(userId);
  const { isAdmin } = useAdmin(userId);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuGroups = [
    {
      label: "Nexus Studio",
      icon: Rocket,
      items: [
        { path: "/formarketing", label: "Studio", icon: Palette, description: "Lienzo industrial de creación" },
        { path: "/spaces", label: "Espacios", icon: LayoutGrid, description: "Organiza proyectos y marcas" },
        { path: "/tools", label: "Herramientas", icon: Wand2, description: "Utilidades de IA rápida" },
      ]
    },
    {
      label: "Recursos",
      icon: BookOpen,
      items: [
        { path: "/assets", label: "Biblioteca", icon: Image, description: "Tus generaciones guardadas" },
        { path: "/descargar", label: "Presets", icon: MonitorDown, description: "Centro de descargas" },
      ]
    },
    {
      label: "Cuenta",
      icon: User,
      items: [
        { path: "/pricing", label: "Planes", icon: CreditCard, description: "Suscripción y créditos" },
        { path: "/profile", label: "Perfil", icon: Settings, description: "Ajustes de Nexus V7" },
        { path: "/developer", label: "API", icon: Code, description: "Acceso para desarrolladores" },
      ]
    }
  ];

  const adminItems = isAdmin
    ? [
        { path: "/admin", label: "Admin", icon: Shield },
        { path: "/system-status", label: "Sistema", icon: Activity },
      ]
    : [];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="ir al inicio"
            className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[#ff0071] shadow-xl shadow-[#ff0071]/20 group-hover:scale-105 transition-transform rotate-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black hidden sm:inline text-white leading-none tracking-tighter">
                creator_ia <span className="text-[#ff0071]">pro</span>
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 hidden sm:inline">V7.0 PULSE</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {menuGroups.map((group) => (
                  <NavigationMenuItem key={group.label}>
                    <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white font-black lowercase tracking-widest text-[10px] h-10 px-4 rounded-full transition-all">
                      <group.icon className="h-3.5 w-3.5 mr-2 text-[#ff0071]" />
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-6 grid-cols-1 bg-[#0a0a0b]/95 border border-white/5 backdrop-blur-3xl rounded-[2rem] shadow-3xl">
                        {group.items.map((item) => (
                           <li key={item.path}>
                              <NavigationMenuLink asChild>
                                <button
                                  onClick={() => handleNav(item.path)}
                                  className={cn(
                                    "flex w-full items-center gap-4 select-none space-y-1 rounded-2xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/5 group/item",
                                    location.pathname === item.path && "bg-[#ff0071]/10 border-[#ff0071]/20"
                                  )}
                                >
                                  <div className="p-2.5 rounded-xl bg-white/5 group-hover/item:scale-110 group-hover/item:bg-[#ff0071]/10 transition-all shadow-lg">
                                    <item.icon className="h-4.5 w-4.5 text-[#ff0071]" />
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className="text-[11px] font-black leading-none text-white lowercase tracking-widest">{item.label}</span>
                                    <p className="line-clamp-2 text-[9px] leading-snug text-slate-500 mt-1.5 lowercase italic tracking-tight">
                                      {item.description}
                                    </p>
                                  </div>
                                </button>
                              </NavigationMenuLink>
                           </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
                
                {isAdmin && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent text-destructive hover:text-destructive font-black lowercase tracking-widest text-[10px] h-10 px-4 rounded-full">
                      <Shield className="h-3.5 w-3.5 mr-2" />
                      Admin
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                       <ul className="grid w-[200px] gap-2 p-4 bg-[#0a0a0b]/95 border border-white/5 backdrop-blur-3xl rounded-2xl shadow-3xl">
                          {adminItems.map(item => (
                             <li key={item.path}>
                                <button onClick={() => handleNav(item.path)} className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-[10px] font-black lowercase tracking-widest text-slate-400 hover:text-white">
                                   <item.icon className="h-3.5 w-3.5" />
                                   {item.label}
                                </button>
                             </li>
                          ))}
                       </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Credits + Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-2.5 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-black text-slate-400 hover:bg-white/10 hover:border-[#ff0071]/30 hover:text-white transition-all shadow-2xl"
            >
              <Coins className="h-3.5 w-3.5 text-[#ff0071]" />
              <span className="font-mono tracking-tighter">
                {profile?.credits_balance ?? 0}
              </span>
            </button>
            
            <div className="h-4 w-px bg-white/10 mx-2" />

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSignOut} 
              aria-label="cerrar sesión"
              className="text-slate-300 hover:text-[#ff0071] hover:bg-[#ff0071]/5 h-9 w-9 p-0 rounded-full hidden md:flex transition-all"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "cerrar menú" : "abrir menú"}
              className="md:hidden text-slate-400 hover:text-slate-900 h-9 w-9 p-0 rounded-xl bg-slate-50"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-[#050506]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-[68px] left-4 right-4 border border-white/5 bg-[#0a0a0b]/95 backdrop-blur-3xl p-4 rounded-[2rem] space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-500 z-50 max-h-[80vh] overflow-y-auto">
            {menuGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                 <div className="px-5 py-2 flex items-center gap-3">
                    <group.icon className="h-4 w-4 text-[#ff0071]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{group.label}</span>
                 </div>
                 {group.items.map((item) => {
                   const isActive = location.pathname === item.path;
                   return (
                     <button
                       key={item.path}
                       onClick={() => handleNav(item.path)}
                       className={`flex w-full items-center gap-4 rounded-2xl px-5 py-3 text-[10px] font-black lowercase tracking-widest transition-all ${
                         isActive
                           ? "bg-[#ff0071] text-white shadow-xl shadow-[#ff0071]/20"
                           : "text-slate-400 hover:text-white hover:bg-white/5"
                       }`}
                     >
                       <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#ff0071]'}`} />
                       {item.label}
                     </button>
                   );
                 })}
              </div>
            ))}
            <div className="border-t border-white/5 pt-2 mt-2">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-xs font-black lowercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}