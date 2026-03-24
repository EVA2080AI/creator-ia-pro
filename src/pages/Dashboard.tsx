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
  PenTool, Megaphone, Type, Hash, CreditCard, Settings, Monitor, Zap, Plus, FolderPlus,
  Box, Eye
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [spaces, setSpaces] = useState<any[]>([]);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [assetsCount, setAssetsCount] = useState(0);
  const [spacesCount, setSpacesCount] = useState(0);

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

    const fetchData = async () => {
      setLoading(true);
      try {
        const [assetsCountData, spacesCountData, recentAssetsData, spacesData] = await Promise.all([
          supabase.from("saved_assets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("spaces").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("canvas_nodes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
          supabase.from("spaces").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
        ]);

        setAssetsCount(assetsCountData.count || 0);
        setSpacesCount(spacesCountData.count || 0);
        setSpaces(spacesData.data || []);
        setRecentAssets(recentAssetsData.data || []);

      } catch (e) {
        console.error("Error fetching dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const tierLabels: Record<string, string> = {
    free: "Starter",
    educacion: "Educación",
    pro: "Pro",
    business: "Business",
  };

  const currentTier = profile?.subscription_tier || "free";

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    
    const { data, error } = await supabase
      .from("spaces")
      .insert({
        user_id: user.id,
        name: newSpaceName,
        description: newSpaceDesc
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear espacio");
      return;
    }

    toast.success("Proyecto creado con éxito");
    setIsCreatingSpace(false);
    setNewSpaceName("");
    setNewSpaceDesc("");
    navigate(`/canvas?spaceId=${data.id}`);
  };

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
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="container mx-auto px-6 py-10 max-w-7xl animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-[10px] uppercase">
               <Zap className="h-3 w-3" />
               Industrial System Active
            </div>
            <h1 className="text-4xl font-black md:text-5xl lg:text-6xl tracking-tighter">
              Hola, <span className="gradient-text">{profile?.display_name?.split(' ')[0] || 'Creador'}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Bienvenido a tu suite de diseño industrial. Tienes el control total de <span className="text-foreground font-semibold">{assetsCount} assets</span> y <span className="text-foreground font-semibold">{spacesCount} espacios</span>.
            </p>
          </div>
          
          <div className="flex gap-3">
            {subscription?.subscribed && (
              <Button 
                onClick={async () => {
                  try {
                    await openCustomerPortal();
                  } catch {
                    toast.error("Error al abrir el portal de suscripción");
                  }
                }}
                variant="outline"
                className="border-white/10 bg-white/5 gap-2 px-6 rounded-2xl h-12"
              >
                <Settings className="h-4 w-4" />
                Gestionar Plan
              </Button>
            )}
            <Button onClick={() => navigate("/pricing")} className="group bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
              <Zap className="mr-2 h-5 w-5 fill-current group-hover:animate-pulse" />
              Mejorar Plan
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="group relative rounded-3xl border border-white/5 bg-card/60 p-6 backdrop-blur-xl transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.accent} shadow-inner transition-transform group-hover:scale-110`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest opacity-60">{stat.label}</p>
              <h3 className="text-3xl font-black mt-1 tabular-nums">{stat.value}</h3>
              <div className="absolute top-4 right-6 h-1 w-8 rounded-full bg-white/5 overflow-hidden">
                 <div className="h-full bg-primary/40 w-1/2 group-hover:w-full transition-all duration-700" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Hub */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Main Studio Access */}
          <div 
            onClick={() => navigate("/canvas")}
            className="lg:col-span-2 group relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 cursor-pointer transition-all hover:border-primary/40 hover:shadow-3xl hover:shadow-primary/10"
          >
             <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px] transition-all group-hover:bg-primary/30" />
             <div className="relative z-10 space-y-4">
                <Badge className="bg-primary/20 text-primary border-primary/30 py-1 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest">Lienzo Infinito V3.1</Badge>
                <h2 className="text-4xl font-black tracking-tighter">Formaketing Studio</h2>
                <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                   Diseña flujos de marketing visual, genera interfaces UX/UI y assets generativos en un mismo entorno industrial.
                </p>
                <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90 rounded-2xl px-8 h-12 font-bold group">
                   Entrar al Estudio
                   <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
             </div>
             <div className="absolute bottom-10 right-10 opacity-20 transition-all group-hover:opacity-40 group-hover:scale-110 duration-500">
                <Palette className="h-40 w-40 text-primary" />
             </div>
          </div>

          {/* Quick Tools Panel */}
          <div className="rounded-[32px] border border-white/5 bg-card/60 p-8 flex flex-col backdrop-blur-xl transition-all hover:border-white/10">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-xl tracking-tight">Acceso Rápido</h3>
                <Settings className="h-5 w-5 text-muted-foreground opacity-40" />
             </div>
             <div className="grid grid-cols-2 gap-4 flex-1">
                {quickActions.map((action) => (
                   <button 
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 transition-all hover:bg-primary/10 hover:border-primary/20"
                   >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.accent} shadow-sm group-hover:scale-110 transition-transform`}>
                         <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-center uppercase tracking-wider opacity-80">{action.label}</span>
                   </button>
                ))}
             </div>
          </div>
        </div>

        {/* Workspaces Section (NEW V3.2) */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                Mis <span className="gradient-text">Proyectos</span>
                <Badge variant="outline" className="text-[10px] py-0">{spaces.length}</Badge>
              </h2>
            </div>

            <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 gap-2 font-bold rounded-xl pr-4">
                  <FolderPlus className="h-4 w-4" />
                  Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 shadow-2xl rounded-3xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">Crear Nuevo Espacio</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Organiza tus diseños en un entorno industrial dedicado.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-60">Nombre del Proyecto</Label>
                    <Input 
                      id="name" 
                      placeholder="Ej: Campaña Verano 2026" 
                      className="bg-white/5 border-white/10 rounded-xl"
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider opacity-60">Descripción (Opcional)</Label>
                    <Input 
                      id="desc" 
                      placeholder="Breve descripción técnica..." 
                      className="bg-white/5 border-white/10 rounded-xl"
                      value={newSpaceDesc}
                      onChange={(e) => setNewSpaceDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateSpace} className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl font-bold h-11">
                    Inicializar Espacio Industrial
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {spaces.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center text-center bg-white/2 cursor-pointer hover:bg-white/5 transition-all" onClick={() => setIsCreatingSpace(true)}>
                <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 text-muted-foreground/40">
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-muted-foreground">No tienes proyectos activos</h3>
                <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">Crea tu primer espacio para empezar a diseñar con IA Pro.</p>
              </div>
            ) : (
              spaces.map((space) => (
                <div 
                  key={space.id}
                  onClick={() => navigate(`/canvas?spaceId=${space.id}`)}
                  className="group relative flex flex-col rounded-[28px] border border-white/5 bg-card/60 p-6 transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Box className="h-5 w-5" />
                    </div>
                    <div className="flex h-1.5 w-6 rounded-full bg-white/5 overflow-hidden">
                       <div className="h-full bg-primary/40 w-1/3 group-hover:w-full transition-all duration-1000" />
                    </div>
                  </div>
                  <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{space.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 opacity-60 group-hover:opacity-100 leading-relaxed">
                    {space.description || "Entorno de diseño activo V3.2"}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="text-[10px] font-mono text-muted-foreground opacity-40 uppercase tracking-widest">{new Date(space.updated_at).toLocaleDateString()}</div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all">
                       <Eye className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Applications Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-4 w-4" />
               </div>
               <h2 className="text-2xl font-black tracking-tight">Aplicaciones <span className="gradient-text">IA</span></h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiApps.map((app) => (
              <button
                key={app.label}
                onClick={() => navigate(app.path)}
                className="group flex items-start gap-4 rounded-[24px] border border-white/5 bg-card/40 p-5 transition-all hover:border-primary/20 hover:bg-card/60 text-left backdrop-blur-sm"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${app.accent} transition-transform group-hover:scale-110 shadow-sm`}>
                  <app.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {app.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed opacity-70 group-hover:opacity-100">{app.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Assets */}
        {recentAssets.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <Clock className="h-4 w-4" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Recientes</h2>
               </div>
               <Button variant="ghost" size="sm" onClick={() => navigate("/assets")} className="text-primary hover:text-primary/80 gap-2 font-bold text-xs uppercase tracking-widest">
                 Ver galería <ArrowRight className="h-3.5 w-3.5" />
               </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-card/60 transition-all hover:border-primary/30 hover:-translate-y-1 shadow-2xl"
                  onClick={() => navigate("/assets")}
                >
                  <img src={asset.asset_url} alt={asset.prompt || ""} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                     <span className="text-[10px] text-white font-medium truncate">{asset.prompt || 'Sin prompt'}</span>
                  </div>
                  {asset.is_favorite && (
                    <div className="absolute top-2 left-2 drop-shadow-lg">
                      <Star className="h-4 w-4 fill-gold text-gold" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 bg-card/40 backdrop-blur-xl">
         <div className="container mx-auto px-6 py-12 flex flex-col items-center gap-6 max-w-7xl">
            <div className="flex items-center gap-2.5">
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
               </div>
               <span className="text-sm font-bold tracking-tight">
                  <span className="gradient-text">Creator IA</span>
                  <span className="text-foreground"> Pro</span>
               </span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium opacity-50">
               © {new Date().getFullYear()} Industrial Generation Suite • V3.1
            </p>
         </div>
      </footer>
    </div>
  );
};

export default Dashboard;
