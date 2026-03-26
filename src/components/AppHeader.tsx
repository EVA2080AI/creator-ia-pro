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
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[1200px] animate-in slide-in-from-top-8 duration-700">
      <div className="nebula-glass rounded-[2rem] px-8 py-4 flex items-center justify-between shadow-3xl bg-[#080809]/80 backdrop-blur-3xl border border-white/5">
        
        {/* Logo Section */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-4 hover:opacity-80 transition-all group shrink-0"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4ff00] shadow-2xl shadow-[#d4ff00]/20 group-hover:rotate-12 transition-transform">
             <Rocket className="h-5 w-5 text-[#020203]" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
             <h1 className="text-lg font-black tracking-tighter text-white leading-none">nexo<span className="text-[#d4ff00]">_</span>terminal</h1>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5">Nebula V8.0</span>
          </div>
        </button>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              {menuGroups.map((group) => (
                <NavigationMenuItem key={group.label}>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white font-black lowercase tracking-[0.15em] text-[10px] h-9 px-4 rounded-xl transition-all border-none focus:bg-white/5 data-[state=open]:bg-white/5">
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[450px] gap-4 p-8 grid-cols-1 bg-[#080809]/95 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-3xl">
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map((item) => (
                           <li key={item.path}>
                              <NavigationMenuLink asChild>
                                <button
                                  onClick={() => handleNav(item.path)}
                                  className={cn(
                                    "flex w-full items-center gap-5 select-none space-y-1 rounded-2xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/5 group/item",
                                    location.pathname === item.path && "bg-[#d4ff00]/5 border-[#d4ff00]/10"
                                  )}
                                >
                                  <div className="p-3 rounded-xl bg-white/5 group-hover/item:scale-110 group-hover/item:bg-[#d4ff00]/10 transition-all">
                                    <item.icon className="h-4.5 w-4.5 text-[#d4ff00]" />
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className="text-[11px] font-black leading-none text-white lowercase tracking-widest">{item.label}</span>
                                    <p className="line-clamp-1 text-[10px] leading-snug text-slate-500 mt-2 lowercase italic font-medium">
                                      {item.description}
                                    </p>
                                  </div>
                                </button>
                              </NavigationMenuLink>
                           </li>
                        ))}
                      </div>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 bg-white/5 px-4 py-2 rounded-xl border border-white/5 mr-2">
             <Coins className="h-3.5 w-3.5 text-[#d4ff00]" />
             <span className="text-[10px] font-black text-white tracking-widest leading-none">1,240</span>
          </div>

          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 p-1.5 pr-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group shrink-0"
          >
            <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
               <User className="h-4 w-4 text-slate-400 group-hover:text-[#d4ff00] transition-colors" />
            </div>
            <span className="hidden sm:block text-[10px] font-black text-white lowercase tracking-tighter">perfil_id</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/5"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Terminal Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-[#020203]/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="absolute inset-x-4 top-[100px] nebula-glass rounded-[2.5rem] p-8 space-y-8 shadow-3xl animate-in slide-in-from-top-8 duration-700">
            {menuGroups.map((group) => (
              <div key={group.label} className="space-y-4">
                 <div className="px-2 flex items-center gap-3">
                    <group.icon className="h-4 w-4 text-[#d4ff00]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{group.label}</span>
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                   {group.items.map((item) => (
                     <button
                       key={item.path}
                       onClick={() => handleNav(item.path)}
                       className={cn(
                         "flex w-full items-center gap-5 rounded-2xl px-5 py-4 text-[10px] font-black lowercase tracking-widest transition-all",
                         location.pathname === item.path
                           ? "bg-[#d4ff00] text-[#020203] shadow-2xl shadow-[#d4ff00]/20"
                           : "text-slate-400 hover:text-white hover:bg-white/5"
                       )}
                     >
                       <item.icon className="h-4.5 w-4.5" />
                       {item.label}
                     </button>
                   ))}
                 </div>
              </div>
            ))}
            <div className="pt-6 border-t border-white/5">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="flex w-full items-center gap-5 rounded-2xl px-5 py-4 text-[10px] font-black lowercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="h-4.5 w-4.5" />
                cerrar_sesion_terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}