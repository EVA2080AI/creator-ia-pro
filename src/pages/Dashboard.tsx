import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw,
  Palette, Image, Video, LayoutGrid, ArrowRight, Coins,
  TrendingUp, MessageSquare, FileText, PenTool, Megaphone,
  Type, Hash, CreditCard, Settings, Monitor, Zap, Plus,
  FolderPlus, Star, Box, Eye, ChevronRight
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

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

  const tierLabels: Record<string, string> = { free: "Starter", educacion: "Educación", pro: "Pro", business: "Business" };
  const currentTier = profile?.subscription_tier || "free";

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    const { data, error } = await supabase.from("spaces")
      .insert({ user_id: user.id, name: newSpaceName, description: newSpaceDesc })
      .select().single();
    if (error) { toast.error("Error al crear espacio"); return; }
    toast.success("Proyecto creado con éxito");
    setIsCreatingSpace(false);
    setNewSpaceName(""); setNewSpaceDesc("");
    navigate(`/formarketing?spaceId=${data.id}`);
  };

  const stats = [
    { label: "CRÉDITOS", value: profile?.credits_balance ?? 0, icon: Coins, color: "#ffb800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.2)" },
    { label: "PLAN", value: tierLabels[currentTier] || "Free", icon: CreditCard, color: "#bd00ff", bg: "rgba(189,0,255,0.1)", border: "rgba(189,0,255,0.2)" },
    { label: "ESPACIOS", value: spacesCount, icon: LayoutGrid, color: "#00c2ff", bg: "rgba(0,194,255,0.1)", border: "rgba(0,194,255,0.2)" },
    { label: "ASSETS", value: assetsCount, icon: Image, color: "#00e5a0", bg: "rgba(0,229,160,0.1)", border: "rgba(0,229,160,0.2)" },
  ];

  const quickTools = [
    { icon: Image, label: "Generar Imagen", desc: "Crea desde texto", path: "/formarketing", color: "#bd00ff" },
    { icon: Wand2, label: "Mejorar Foto", desc: "IA enhancement", path: "/tools", color: "#00c2ff" },
    { icon: ZoomIn, label: "Ampliar 4x", desc: "Upscale con IA", path: "/tools", color: "#ffb800" },
    { icon: Eraser, label: "Borrar Objetos", desc: "Elimina lo que sobra", path: "/tools", color: "#ff0071" },
    { icon: ImagePlus, label: "Quitar Fondo", desc: "Automático con IA", path: "/tools", color: "#00e5a0" },
    { icon: RotateCcw, label: "Restaurar Foto", desc: "Revive fotos antiguas", path: "/tools", color: "#bd00ff" },
  ];

  const aiApps = [
    { icon: Megaphone, label: "Formarketing Studio", desc: "Lienzo infinito de marketing visual", path: "/formarketing", color: "#bd00ff" },
    { icon: MessageSquare, label: "AI Copywriter", desc: "Textos de marketing y ads", path: "/tools", color: "#00c2ff" },
    { icon: PenTool, label: "Logo Maker", desc: "Logos con IA generativa", path: "/tools", color: "#ffb800" },
    { icon: Hash, label: "Social Media Kit", desc: "Contenido para redes sociales", path: "/tools", color: "#00e5a0" },
    { icon: FileText, label: "AI Blog Writer", desc: "Artículos SEO con IA", path: "/tools", color: "#ff0071" },
    { icon: Type, label: "Ad Generator", desc: "Anuncios para Meta y Google Ads", path: "/tools", color: "#bd00ff" },
    { icon: Monitor, label: "ShareScreen Pro", desc: "Extiende tu pantalla a dispositivos", path: "/sharescreen", color: "#00c2ff" },
  ];

  const usageData = [
    { name: 'Lun', credits: 12 }, { name: 'Mar', credits: 18 }, { name: 'Mié', credits: 15 },
    { name: 'Jue', credits: 25 }, { name: 'Vie', credits: 32 }, { name: 'Sáb', credits: 28 }, { name: 'Dom', credits: 40 },
  ];

  const toolData = [
    { name: 'Imagen', value: 45, color: '#00c2ff' },
    { name: 'Copy', value: 30, color: '#00e5a0' },
    { name: 'Studio', value: 25, color: '#bd00ff' },
  ];

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <div className="w-8 h-8 rounded-full border-2 border-[#bd00ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="pt-14">
        <div className="max-w-[1400px] mx-auto px-6 py-10">

          {/* Welcome Banner */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#bd00ff] animate-pulse shadow-[0_0_8px_rgba(189,0,255,0.8)]" />
                <span className="text-xs font-semibold text-[#bd00ff] uppercase tracking-widest">INDUSTRIAL SYSTEM ACTIVE</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                Hola, <span className="brand-gradient-text">{profile?.display_name?.split(' ')[0] || 'Creador'}</span>
              </h1>
              <p className="text-sm text-white/45 font-medium">
                Bienvenido a tu suite de diseño industrial. Tienes el control total de{' '}
                <span className="text-white font-semibold">{assetsCount} assets</span> y{' '}
                <span className="text-white font-semibold">{spacesCount} espacios</span>.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              {subscription?.subscribed && (
                <button
                  onClick={async () => { try { await openCustomerPortal(); } catch { toast.error("Error al abrir portal"); } }}
                  className="btn-ghost"
                >
                  <Settings className="w-3.5 h-3.5 mr-1.5 inline" />
                  Gestionar Plan
                </button>
              )}
              <button onClick={() => navigate("/pricing")} className="btn-brand flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Mejorar Plan
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-card"
                style={{ borderColor: stat.border }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="w-5 h-1 rounded-full bg-white/10" />
                </div>
                <p className="text-[10px] font-bold tracking-widest text-white/35 mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Credit Flow */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Flujo de Créditos</h3>
                  <p className="text-xs text-white/40 mt-0.5">Consumo industrial · Últimos 7 días</p>
                </div>
                <TrendingUp className="w-4 h-4 text-[#00c2ff]" />
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c2ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00c2ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} dy={8} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#0f0f12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      itemStyle={{ color: '#00c2ff' }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="#00c2ff" strokeWidth={2} fill="url(#creditsGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tool Distribution */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Actividad por Herramienta</h3>
                  <p className="text-xs text-white/40 mt-0.5">Distribución de carga IA</p>
                </div>
                <Box className="w-4 h-4 text-[#bd00ff]" />
              </div>
              <div className="space-y-4">
                {toolData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/60 font-medium">{item.name}</span>
                      <span className="font-semibold text-white/80">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${item.value}%`, background: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Herramientas de Imagen</h2>
              <button onClick={() => navigate("/tools")} className="flex items-center gap-1 text-xs text-white/45 hover:text-white transition-colors">
                Ver todo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickTools.map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => navigate(tool.path)}
                  className="tool-card text-left group"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${tool.color}15`, border: `1px solid ${tool.color}25` }}>
                    <tool.icon className="w-4 h-4" style={{ color: tool.color }} />
                  </div>
                  <p className="text-xs font-semibold text-white mb-1 leading-tight">{tool.label}</p>
                  <p className="text-[10px] text-white/40 leading-tight">{tool.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Apps / Apps IA */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Apps de IA</h2>
              <button onClick={() => navigate("/hub")} className="flex items-center gap-1 text-xs text-white/45 hover:text-white transition-colors">
                Ver todo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {aiApps.map((app) => (
                <button
                  key={app.label}
                  onClick={() => navigate(app.path)}
                  className="tool-card text-left group flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${app.color}15`, border: `1px solid ${app.color}25` }}>
                    <app.icon className="w-4.5 h-4.5" style={{ color: app.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{app.label}</p>
                    <p className="text-[11px] text-white/40 leading-snug">{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Spaces / Projects */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Mis Espacios</h2>
              <button
                onClick={() => setIsCreatingSpace(true)}
                className="btn-brand flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Espacio
              </button>
            </div>
            {spaces.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center cursor-pointer hover:border-[rgba(189,0,255,0.3)] hover:bg-[rgba(189,0,255,0.03)] transition-all group"
                onClick={() => setIsCreatingSpace(true)}
              >
                <div className="w-12 h-12 rounded-2xl bg-[rgba(189,0,255,0.1)] border border-[rgba(189,0,255,0.2)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FolderPlus className="w-5 h-5 text-[#bd00ff]" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Crea tu primer espacio</p>
                <p className="text-xs text-white/35">Organiza tus proyectos y campañas en un lienzo infinito</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                    className="tool-card text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#bd00ff]/20 to-[#ff0071]/20 border border-[rgba(189,0,255,0.2)] flex items-center justify-center">
                        <LayoutGrid className="w-4 h-4 text-[#bd00ff]" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1 truncate">{space.name}</p>
                    <p className="text-xs text-white/35 truncate">{space.description || "Sin descripción"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Create Space Dialog */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="bg-[#0f0f12] border-[rgba(255,255,255,0.08)] rounded-2xl text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nuevo Espacio</DialogTitle>
            <DialogDescription className="text-white/45 text-sm">
              Crea un espacio de trabajo para organizar tus proyectos y campañas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nombre del espacio</Label>
              <Input
                id="name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Ej: Campaña Q2 2025"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[rgba(189,0,255,0.4)] focus:ring-[rgba(189,0,255,0.15)]"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSpace()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-semibold text-white/60 uppercase tracking-wider">Descripción (opcional)</Label>
              <Input
                id="desc"
                value={newSpaceDesc}
                onChange={(e) => setNewSpaceDesc(e.target.value)}
                placeholder="Describe el propósito de este espacio..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-[rgba(189,0,255,0.4)]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setIsCreatingSpace(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={handleCreateSpace} className="btn-brand flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Crear Espacio
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
