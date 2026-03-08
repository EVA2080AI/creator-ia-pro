import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  LayoutGrid,
  Image,
  Coins,
  Shield,
  CreditCard,
  LogOut,
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

  const navItems = [
    { path: "/spaces", label: "Spaces", icon: LayoutGrid },
    { path: "/canvas", label: "Canvas", icon: Sparkles },
    { path: "/assets", label: "Assets", icon: Image },
    { path: "/pricing", label: "Planes", icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card glow-primary">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold">
            <span className="gradient-text">Canvas</span>
            <span className="text-foreground">AI</span>
          </span>
        </button>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={
                location.pathname === item.path
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              <item.icon className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          ))}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className={
                location.pathname === "/admin"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              <Shield className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
        </nav>

        {/* Credits + Sign out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
            <Coins className="h-3.5 w-3.5 text-gold" />
            <span className="text-gold font-semibold font-mono">
              {profile?.credits_balance ?? 0}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
