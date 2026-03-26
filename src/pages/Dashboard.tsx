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
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts';

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
        // [Industrial V3.93] Emergency Auto-Credit for Developer
        if (profile && profile.email === 'sebastian689@gmail.com' && profile.credits_balance === 0) {
           console.log("Auto-Provisioning Industrial Credits...");
           const { error } = await supabase.from("profiles")
              .update({ credits_balance: 100, subscription_tier: 'pro' })
              .eq("user_id", user.id);
           if (!error) {
              toast.success("🎁 Sistema Industrial: 100 Créditos PRO restaurados automáticamente.");
              refreshProfile();
           }
        }

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
    navigate(`/formarketing?spaceId=${data.id}`);
  };

  const stats: QuickStat[] = [
    { label: "Créditos", value: profile?.credits_balance ?? 0, icon: Coins, accent: "bg-gold/10 text-gold" },
    { label: "Plan", value: tierLabels[currentTier] || "Free", icon: CreditCard, accent: "bg-primary/10 text-primary" },
    { label: "Espacios", value: spacesCount, icon: LayoutGrid, accent: "bg-accent/10 text-accent" },
    { label: "Assets", value: assetsCount, icon: Image, accent: "bg-warning/10 text-warning" },
  ];

  const quickActions = [
    { icon: Image, label: "Generar Imagen", desc: "Crea desde texto", path: "/formarketing", accent: "bg-primary/10 text-primary" },
    { icon: Wand2, label: "Mejorar Foto", desc: "IA enhancement", path: "/tools", accent: "bg-accent/10 text-accent" },
    { icon: ZoomIn, label: "Ampliar 4x", desc: "Upscale con IA", path: "/tools", accent: "bg-warning/10 text-warning" },
    { icon: Eraser, label: "Borrar Objetos", desc: "Elimina lo que sobra", path: "/tools", accent: "bg-destructive/10 text-destructive" },
    { icon: ImagePlus, label: "Quitar Fondo", desc: "Automático con IA", path: "/tools", accent: "bg-gold/10 text-gold" },
    { icon: RotateCcw, label: "Restaurar Foto", desc: "Revive fotos antiguas", path: "/tools", accent: "bg-primary/10 text-primary" },
  ];

  const aiApps = [
    { icon: Monitor, label: "ShareScreen Pro", desc: "Extiende tu espacio P2P a dispositivos móviles. [1 Crédito]", path: "/sharescreen", accent: "bg-emerald-500/10 text-emerald-500" },
    { icon: MessageSquare, label: "AI Copywriter", desc: "Genera textos de marketing, ads y redes sociales con IA.", path: "/apps/copywriter", accent: "bg-primary/10 text-primary" },
    { icon: Megaphone, label: "Formarketing Studio", desc: "Crea flows de marketing visual con lienzo infinito.", path: "/formarketing", accent: "bg-accent/10 text-accent" },
    { icon: PenTool, label: "Logo Maker", desc: "Diseña logos profesionales con IA generativa.", path: "/apps/logo", accent: "bg-gold/10 text-gold" },
    { icon: Hash, label: "Social Media Kit", desc: "Genera contenido optimizado para cada red social.", path: "/apps/social", accent: "bg-warning/10 text-warning" },
    { icon: FileText, label: "AI Blog Writer", desc: "Artículos SEO completos generados con IA.", path: "/apps/blog", accent: "bg-destructive/10 text-destructive" },
    { icon: Type, label: "Ad Generator", desc: "Crea anuncios visuales para Google y Meta Ads.", path: "/apps/ads", accent: "bg-primary/10 text-primary" },
  ];

  const usageData = [
    { name: 'Lun', credits: 12 },
    { name: 'Mar', credits: 18 },
    { name: 'Mié', credits: 15 },
    { name: 'Jue', credits: 25 },
    { name: 'Vie', credits: 32 },
    { name: 'Sáb', credits: 28 },
    { name: 'Dom', credits: 40 },
  ];

  const toolData = [
    { name: 'Imagen', value: 45, color: '#3b82f6' },
    { name: 'Copy', value: 30, color: '#10b981' },
    { name: 'Studio', value: 25, color: '#f59e0b' },
  ];

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin-slow rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden selection:bg-[#ff0071]/30">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="container mx-auto px-6 py-10 max-w-7xl animate-fade-in">
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#ff0071] font-bold tracking-tight text-[11px] lowercase">
               <div className="w-1.5 h-1.5 rounded-full bg-[#ff0071] animate-pulse" />
               industrial_system_v7.0_active
            </div>
            <h1 className="text-5xl font-black md:text-6xl lg:text-8xl tracking-tighter text-white lowercase leading-none">
              hola, <span className="text-[#ff0071]">{profile?.display_name?.split(' ')[0] || 'creador'}</span>
            </h1>
            <p className="text-slate-400 text-xl max-w-xl leading-relaxed lowercase font-medium">
              bienvenido a tu suite de diseño <span className="text-white">v7_industrial</span>. tienes el control total de <span className="text-white font-bold">{assetsCount} assets</span> y <span className="text-white font-bold">{spacesCount} espacios</span> activos.
            </p>
          </div>
          
          <div className="flex gap-4">
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
                className="border-slate-100 bg-white gap-2 px-6 rounded-2xl h-12 text-xs font-bold lowercase tracking-tight shadow-sm hover:bg-slate-50 transition-all"
              >
                <Settings className="h-4 w-4" />
                gestionar plan
              </Button>
            )}
            <Button onClick={() => navigate("/pricing")} className="group bg-[#ff0071] text-white hover:bg-[#e60066] px-8 py-6 rounded-2xl shadow-xl shadow-[#ff0071]/20 transition-all hover:-translate-y-1 text-xs font-bold lowercase tracking-tight active:scale-95">
              <Zap className="mr-2 h-5 w-5 fill-current group-hover:animate-pulse" />
              mejorar plan
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              role="status"
              className="group relative rounded-[3rem] border border-white/5 bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-all hover:bg-white/[0.08] hover:border-[#ff0071]/30 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] ${stat.accent.replace('primary', '[#ff0071]').replace('bg-gold/10 text-gold', 'bg-[#ff0071]/10 text-[#ff0071]')} transition-transform group-hover:scale-110`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 lowercase tracking-widest opacity-80 pl-1">{stat.label}</p>
              <h3 className="text-5xl font-black mt-2 tabular-nums text-white tracking-tighter">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Industrial Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-10 mb-20">
          <div className="rounded-[3.5rem] border border-white/5 bg-white/5 p-12 backdrop-blur-2xl shadow-3xl hover:bg-white/[0.07] transition-all group">
             <div className="flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-3xl font-black tracking-tighter text-white lowercase">flujo_créditos</h3>
                   <p className="text-[10px] font-bold text-slate-500 lowercase tracking-widest">consumo industrial_v7</p>
                </div>
                <TrendingUp className="h-6 w-6 text-[#ff0071] group-hover:scale-110 transition-transform" />
             </div>
             <div className="h-[240px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff0071" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ff0071" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#94a3b8', fontSize: 10 }}
                     dy={10}
                   />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                     itemStyle={{ color: '#3b82f6' }}
                   />
                    <Area 
                      type="monotone" 
                      dataKey="credits" 
                      stroke="#ff0071" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorCredits)" 
                      animationDuration={2000}
                    />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="rounded-[3.5rem] border border-white/5 bg-white/5 p-12 backdrop-blur-2xl shadow-3xl hover:bg-white/[0.07] transition-all group">
             <div className="flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-3xl font-black tracking-tighter text-white lowercase">carga_ia</h3>
                   <p className="text-[10px] font-bold text-slate-500 lowercase tracking-widest">distribución carga motor nexus</p>
                </div>
                <Box className="h-6 w-6 text-[#ff0071] group-hover:scale-110 transition-transform" />
             </div>
             <div className="h-[240px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={toolData} layout="vertical">
                   <XAxis type="number" hide />
                   <YAxis 
                     dataKey="name" 
                     type="category" 
                     axisLine={false} 
                     tickLine={false}                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: '700' }}
                      width={90}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={28} animationDuration={2500}>
                      {toolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color === '#3b82f6' ? '#ff0071' : entry.color === '#10b981' ? '#1e293b' : '#94a3b8'} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Action Hub */}
        <div className="grid lg:grid-cols-3 gap-10 mb-20">
          {/* Main Studio Access */}
          <div 
            onClick={() => navigate("/formarketing")}
            className="lg:col-span-2 group relative overflow-hidden rounded-[4rem] border border-white/5 bg-white/5 p-16 cursor-pointer transition-all hover:bg-white/[0.08] hover:border-[#ff0071]/30 hover:shadow-3xl"
          >
             <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#ff0071]/10 blur-[120px] transition-all group-hover:bg-[#ff0071]/20 duration-1000" />
             <div className="relative z-10 space-y-8">
                <Badge className="bg-[#ff0071]/10 text-[#ff0071] border-transparent py-1.5 px-6 rounded-full text-[10px] font-black lowercase tracking-widest">nexus_studio_pro_v7.0</Badge>
                <h2 className="text-7xl font-black tracking-tighter text-white lowercase leading-[0.9]">formarketing<br /><span className="text-[#ff0071]">studio</span></h2>
                <p className="text-slate-400 text-2xl max-w-md leading-relaxed lowercase font-medium">
                   el núcleo de tu producción industrial. flujos infinitos, ia generativa y diseño ux en un solo motor.
                </p>
                <Button className="mt-8 bg-[#ff0071] text-white hover:bg-[#e60066] rounded-2xl px-12 h-16 text-sm font-black lowercase transition-all active:scale-95 shadow-2xl shadow-[#ff0071]/20">
                   inicializar_estudio
                   <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                </Button>
             </div>
             <div className="absolute bottom-12 right-12 opacity-5 transition-all group-hover:opacity-10 group-hover:scale-110 duration-1000 grayscale group-hover:grayscale-0">
                <Palette className="h-72 w-72 text-[#ff0071]" />
             </div>
          </div>

          {/* Quick Tools Panel */}
          <div className="rounded-[4rem] border border-white/5 bg-white/5 p-12 flex flex-col backdrop-blur-3xl shadow-3xl hover:bg-white/[0.08] transition-all">
             <div className="flex items-center justify-between mb-12">
                <h3 className="font-black text-3xl tracking-tighter text-white lowercase">dock_ia</h3>
                <Zap className="h-6 w-6 text-[#ff0071] animate-pulse" />
             </div>
             <div className="grid grid-cols-2 gap-6 flex-1">
                {quickActions.map((action) => (
                   <button 
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="group flex flex-col items-center justify-center gap-4 p-6 rounded-[2.5rem] border border-white/5 bg-white/5 transition-all hover:bg-white/[0.1] hover:border-[#ff0071]/30 active:scale-95"
                   >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${action.accent.replace('primary', '[#ff0071]').replace('bg-gold/10 text-gold', 'bg-[#ff0071]/10 text-[#ff0071]')} transition-transform group-hover:scale-110`}>
                         <action.icon className="h-7 w-7" />
                      </div>
                      <span className="text-[11px] font-bold text-center lowercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{action.label}</span>
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

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                  onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
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
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-[1.25rem] bg-[#ff0071]/10 flex items-center justify-center text-[#ff0071] shadow-sm">
                  <Sparkles className="h-5 w-5" />
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-slate-800 lowercase">aplicaciones <span className="text-[#ff0071]">ia</span></h2>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aiApps.map((app) => (
              <button
                key={app.label}
                onClick={() => navigate(app.path)}
                className="group flex items-start gap-5 rounded-[2.5rem] border border-slate-100 bg-white p-6 transition-all hover:border-[#ff0071]/20 hover:shadow-2xl hover:shadow-[#ff0071]/5 text-left active:scale-95"
              >
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] ${app.accent.replace('primary', '[#ff0071]')} transition-transform group-hover:scale-110 shadow-sm shadow-[#ff0071]/5`}>
                  <app.icon className="h-7 w-7" />
                </div>
                <div className="pt-1">
                  <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-[#ff0071] transition-colors lowercase">
                    {app.label}
                  </h3>
                  <p className="mt-1 text-[12px] text-slate-400 font-medium leading-relaxed lowercase">{app.desc}</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
      <footer className="mt-40 border-t border-white/5 bg-white/2 pb-24 pt-24">
         <div className="container mx-auto px-6 flex flex-col items-center gap-10 max-w-7xl">
            <div className="flex items-center gap-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff0071]/10 border border-[#ff0071]/20 shadow-2xl shadow-[#ff0071]/10">
                  <Sparkles className="h-6 w-6 text-[#ff0071]" />
               </div>
               <span className="text-2xl font-black tracking-tighter text-white lowercase">
                  creator_ia <span className="text-[#ff0071]">pro</span>
               </span>
            </div>
            <p className="text-[10px] text-slate-600 font-bold lowercase tracking-[0.3em] opacity-80">
               © {new Date().getFullYear()} industrial generation suite • pulse v7.0 industrial ebony
            </p>
         </div>
      </footer>
    </div>
  );
};

export default Dashboard;
