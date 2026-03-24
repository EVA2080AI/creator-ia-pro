import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles, Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw,
  Palette, Image, Video, LayoutGrid, ArrowRight, Coins,
  TrendingUp, Clock, Star, MessageSquare, FileText,
  PenTool, Megaphone, Type, Hash, CreditCard, Settings, Monitor
} from "lucide-react";

interface QuickStat {
  label: string;
  value: string | number;
  icon: typeof Sparkles;
  accent: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const { subscription, checkSubscription, openCustomerPortal } = useSubscription(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [spacesCount, setSpacesCount] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);

  // Handle checkout success redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("¡Suscripción activada! Tus créditos se han recargado.");
      checkSubscription();
      refreshProfile();
    }
    if (searchParams.get("credits") === "success") {
      toast.success("¡Créditos comprados! Tu balance se ha actualizado.");
      refreshProfile();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [assets, spaces, recent] = await Promise.all([
        supabase.from("saved_assets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("spaces").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("saved_assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
      ]);
      setAssetsCount(assets.count || 0);
      setSpacesCount(spaces.count || 0);
      setRecentAssets(recent.data || []);
    };
    load();
  }, [user]);

  const tierLabels: Record<string, string> = {
    free: "Starter",
    educacion: "Educación",
    pro: "Pro",
    business: "Business",
  };

  const currentTier = profile?.subscription_tier || "free";

  const stats: QuickStat[] = [
    { label: "Créditos", value: profile?.credits_balance ?? 0, icon: Coins, accent: "bg-gold/10 text-gold" },
    { label: "Plan", value: tierLabels[currentTier] || "Free", icon: CreditCard, accent: "bg-primary/10 text-primary" },
    { label: "Espacios", value: spacesCount, icon: LayoutGrid, accent: "bg-accent/10 text-accent" },
    { label: "Assets", value: assetsCount, icon: Image, accent: "bg-warning/10 text-warning" },
  ];

  const quickActions = [
    { icon: Image, label: "Generar Imagen", desc: "Crea desde texto", path: "/canvas", accent: "bg-primary/10 text-primary" },
    { icon: Wand2, label: "Mejorar Foto", desc: "IA enhancement", path: "/tools", accent: "bg-accent/10 text-accent" },
    { icon: ZoomIn, label: "Ampliar 4x", desc: "Upscale con IA", path: "/tools", accent: "bg-warning/10 text-warning" },
    { icon: Eraser, label: "Borrar Objetos", desc: "Elimina lo que sobra", path: "/tools", accent: "bg-destructive/10 text-destructive" },
    { icon: ImagePlus, label: "Quitar Fondo", desc: "Automático con IA", path: "/tools", accent: "bg-gold/10 text-gold" },
    { icon: RotateCcw, label: "Restaurar Foto", desc: "Revive fotos antiguas", path: "/tools", accent: "bg-primary/10 text-primary" },
  ];

  const aiApps = [
    { icon: Monitor, label: "ShareScreen Pro", desc: "Extiende tu espacio P2P a dispositivos móviles. [1 Crédito]", path: "/sharescreen", accent: "bg-emerald-500/10 text-emerald-500" },
    { icon: MessageSquare, label: "AI Copywriter", desc: "Genera textos de marketing, ads y redes sociales con IA.", path: "/apps/copywriter", accent: "bg-primary/10 text-primary" },
    { icon: Megaphone, label: "Formaketing Studio", desc: "Crea flows de marketing visual con lienzo infinito.", path: "/canvas", accent: "bg-accent/10 text-accent" },
    { icon: PenTool, label: "Logo Maker", desc: "Diseña logos profesionales con IA generativa.", path: "/apps/logo", accent: "bg-gold/10 text-gold" },
    { icon: Hash, label: "Social Media Kit", desc: "Genera contenido optimizado para cada red social.", path: "/apps/social", accent: "bg-warning/10 text-warning" },
    { icon: FileText, label: "AI Blog Writer", desc: "Artículos SEO completos generados con IA.", path: "/apps/blog", accent: "bg-destructive/10 text-destructive" },
    { icon: Type, label: "Ad Generator", desc: "Crea anuncios visuales para Google y Meta Ads.", path: "/apps/ads", accent: "bg-primary/10 text-primary" },
  ];

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin-slow rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[150px]" />
      </div>

      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              ¡Hola, <span className="gradient-text">{profile?.display_name || "Creator"}</span>!
            </h1>
            <p className="mt-1 text-muted-foreground">
              Bienvenido a tu estudio de IA generativa. ¿Qué quieres crear hoy?
            </p>
          </div>
          {subscription?.subscribed && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await openCustomerPortal();
                } catch {
                  toast.error("Error al abrir el portal de suscripción");
                }
              }}
              className="border-border gap-2 hidden sm:flex"
            >
              <Settings className="h-3.5 w-3.5" />
              Gestionar Plan
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 node-shadow">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.accent}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground font-mono">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subscription info banner */}
        {subscription?.subscribed && subscription.subscription_end && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Plan {tierLabels[subscription.tier] || subscription.tier} activo
                </p>
                <p className="text-xs text-muted-foreground">
                  Próxima renovación: {new Date(subscription.subscription_end).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await openCustomerPortal();
                } catch {
                  toast.error("Error al abrir el portal");
                }
              }}
              className="text-primary"
            >
              Gestionar →
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Acciones Rápidas</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/tools")} className="text-primary gap-1">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 node-shadow hover:border-primary/20 hover:-translate-y-0.5 transition-all"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.accent} group-hover:scale-110 transition-transform`}>
                  <a.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-foreground">{a.label}</span>
                <span className="text-[10px] text-muted-foreground">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Applications */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Aplicaciones <span className="gradient-text">IA</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              Más apps próximamente
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiApps.map((app) => (
              <button
                key={app.label}
                onClick={() => navigate(app.path)}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 node-shadow hover:border-primary/20 transition-all text-left"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${app.accent}`}>
                  <app.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {app.label}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{app.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Assets */}
        {recentAssets.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                <Clock className="mr-2 inline h-4 w-4 text-muted-foreground" />
                Recientes
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/assets")} className="text-primary gap-1">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card node-shadow hover:border-primary/20 transition-all"
                  onClick={() => navigate("/assets")}
                >
                  <div className="aspect-square">
                    <img src={asset.asset_url} alt={asset.prompt || ""} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  {asset.is_favorite && (
                    <div className="absolute top-1.5 left-1.5">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-card p-8 text-center node-shadow">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">
            ¿Listo para crear algo <span className="gradient-text">increíble</span>?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Usa el Formaketing Studio para crear flows de marketing visual o prueba nuestras herramientas de IA.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={() => navigate("/canvas")} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Palette className="h-4 w-4" />
              Formaketing Studio
            </Button>
            <Button onClick={() => navigate("/tools")} variant="outline" className="border-border gap-2">
              <Wand2 className="h-4 w-4" />
              Herramientas IA
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
