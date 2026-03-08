import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Sparkles, LayoutGrid, Wand2, Image, Coins, Shield,
  CreditCard, LogOut, Palette, Home, Menu, X, Activity,
} from "lucide-react";

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

  const navItems = [
    { path: "/dashboard", label: "Inicio", icon: Home },
    { path: "/tools", label: "Herramientas", icon: Wand2 },
    { path: "/canvas", label: "Formaketing", icon: Palette },
    { path: "/spaces", label: "Espacios", icon: LayoutGrid },
    { path: "/assets", label: "Assets", icon: Image },
    { path: "/pricing", label: "Planes", icon: CreditCard },
  ];

  const adminItems = isAdmin
    ? [
        { path: "/admin", label: "Admin", icon: Shield },
        { path: "/system-status", label: "Sistema", icon: Activity },
      ]
    : [];

  const allItems = [...navItems, ...adminItems];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Logo */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card glow-primary">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold hidden sm:inline">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === "/tools" && location.pathname.startsWith("/apps"));
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`shrink-0 h-8 px-2.5 ${
                    isActive ? "text-foreground bg-muted/50" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`shrink-0 h-8 px-2.5 ${
                    isActive ? "text-foreground bg-muted/50" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Credits + Mobile menu + Sign out */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs hover:bg-muted transition-colors"
            >
              <Coins className="h-3 w-3 text-gold" />
              <span className="text-gold font-semibold font-mono">
                {profile?.credits_balance ?? 0}
              </span>
            </button>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground h-8 w-8 p-0 hidden md:flex">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-muted-foreground h-8 w-8 p-0"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-[57px] left-0 right-0 border-b border-border bg-card p-4 space-y-1 animate-fade-in z-50">
            {allItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-border pt-2 mt-2">
              <button
                onClick={() => { onSignOut(); setMobileOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}