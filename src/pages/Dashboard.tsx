import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw,
  Image, LayoutGrid, ArrowRight, Coins,
  TrendingUp, MessageSquare, FileText, PenTool, Megaphone,
  Type, Hash, CreditCard, Settings, Zap, Plus,
  FolderPlus, Box, ChevronRight, Rocket
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const { subscription, checkSubscription, openCustomerPortal } = useSubscription(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [assetsCount, setAssetsCount] = useState(0);
  const [spacesCount, setSpacesCount] = useState(0);
  const [usageData, setUsageData] = useState<{ name: string; credits: number }[]>([]);
  const [toolData, setToolData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("¡Suscripción activada! Tus créditos han sido recargados.");
      checkSubscription();
      refreshProfile();
    }
    if (searchParams.get("credits") === "success") {
      toast.success("¡Créditos comprados! Tu saldo ha sido actualizado.");
      refreshProfile();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [assetsCountData, spacesCountData, spacesData, txnsData] = await Promise.all([
          supabase.from("saved_assets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("spaces").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("spaces").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(8),
          supabase.from("transactions").select("amount, type, description, created_at")
            .eq("user_id", user.id).gte("created_at", sevenDaysAgo)
            .not("type", "in", '("subscription_reload","credit_purchase")'),
        ]);
        setAssetsCount(assetsCountData.count || 0);
        setSpacesCount(spacesCountData.count || 0);
        setSpaces(spacesData.data || []);

        const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayMap: Record<string, { name: string; credits: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          dayMap[d.toDateString()] = { name: DAY_LABELS[d.getDay()], credits: 0 };
        }
        let visual = 0, copy = 0, system = 0;
        (txnsData.data || []).forEach((tx: any) => {
          const key = new Date(tx.created_at).toDateString();
          if (dayMap[key]) dayMap[key].credits += Math.abs(tx.amount || 0);
          const desc = (tx.description || "").toLowerCase();
          if (desc.includes("image") || desc.includes("imagen") || desc.includes("logo") || desc.includes("video")) visual++;
          else if (desc.includes("text") || desc.includes("texto") || desc.includes("copy") || desc.includes("blog") || desc.includes("social") || desc.includes("ads") || desc.includes("chat")) copy++;
          else system++;
        });
        setUsageData(Object.values(dayMap));
        const total = visual + copy + system || 1;
        setToolData([
          { name: 'Visual', value: Math.round((visual / total) * 100), color: 'bg-aether-purple' },
          { name: 'Copy',   value: Math.round((copy   / total) * 100), color: 'bg-aether-blue' },
          { name: 'System', value: Math.round((system / total) * 100), color: 'bg-rose-400' },
        ]);
      } catch (e) {
        console.error("Error fetching dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const tierLabels: Record<string, string> = { free: "Free", starter: "Starter", creator: "Creator", agency: "Agency", educacion: "Educación", pro: "Pro", business: "Business" };
  const currentTier = profile?.subscription_tier || "free";
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const creditsSuccess = searchParams.get("credits") === "success";

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    const { data, error } = await supabase.from("spaces")
      .insert({ user_id: user.id, name: newSpaceName, description: newSpaceDesc })
      .select().single();
    if (error) { toast.error("Error creating space"); return; }
    toast.success("Espacio creado");
    setIsCreatingSpace(false);
    setNewSpaceName(""); setNewSpaceDesc("");
    navigate(`/formarketing?spaceId=${data.id}`);
  };

  const stats = [
    { label: "Créditos", value: profile?.credits_balance ?? 0, icon: Coins, color: "text-aether-purple" },
    { label: "Plan", value: tierLabels[currentTier] || "Gratis", icon: CreditCard, color: "text-aether-blue" },
    { label: "Espacios", value: spacesCount, icon: LayoutGrid, color: "text-rose-400" },
    { label: "Activos", value: assetsCount, icon: Image, color: "text-emerald-400" },
  ];

  const aiApps = [
    { icon: Zap,        label: "Genesis IDE",   desc: "BuilderAI · Lovable", path: "/chat"         },
    { icon: Megaphone,  label: "Canvas IA",     desc: "Lienzo creativo",     path: "/formarketing" },
    { icon: PenTool,    label: "Studio",        desc: "Herramientas creativas",path: "/studio"     },
    { icon: MessageSquare, label: "Chat IA",   desc: "Copy & texto",        path: "/chat"          },
    { icon: Hash,       label: "Hub",           desc: "Templates listos",    path: "/hub"           },
    { icon: FileText,   label: "Mis Espacios",  desc: "Google Drive IA",     path: "/spaces"        },
  ];

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050506]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-white/5 border-t-aether-purple animate-spin" />
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">Accediendo al Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-aether-purple/30 selection:text-white font-sans">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="pt-16">
        <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">

          {/* Post-checkout success banner */}
          {(checkoutSuccess || creditsSuccess) && (
            <div className="relative overflow-hidden rounded-2xl border border-aether-purple/30 bg-aether-purple/8 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(74,222,128,0.06) 0%, transparent 70%)' }} />
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-aether-purple/20 border border-aether-purple/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-aether-purple" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-white font-display">
                    {checkoutSuccess ? '¡Suscripción activada!' : '¡Créditos añadidos!'}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {checkoutSuccess
                      ? `Plan ${tierLabels[currentTier]} · ${profile?.credits_balance?.toLocaleString() ?? '—'} créditos cargados`
                      : `${profile?.credits_balance?.toLocaleString() ?? '—'} créditos disponibles`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aether-purple text-black text-[12px] font-black uppercase tracking-widest hover:bg-aether-purple/90 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ir a Genesis
                </button>
                <button
                  onClick={() => navigate('/studio')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[12px] font-bold text-white/60 hover:text-white hover:border-white/25 transition-all"
                >
                  Studio →
                </button>
              </div>
            </div>
          )}

          {/* Welcome Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] font-display">System Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display">
                Hola, <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{profile?.display_name?.split(' ')[0] || 'Creator'}</span>
              </h1>
            </div>
            <div className="flex gap-2 shrink-0">
              {subscription?.subscribed ? (
                <>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="px-4 py-2 rounded-xl aether-card text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-all border border-white/5"
                  >
                    <Coins className="w-3.5 h-3.5 mr-1.5 inline" />
                    + Créditos
                  </button>
                  <button
                    onClick={async () => { try { await openCustomerPortal(); } catch { toast.error("Error abriendo portal"); } }}
                    className="px-4 py-2 rounded-xl aether-card text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-all border border-white/5"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5 inline" />
                    Plan
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate("/pricing")}
                  className="px-5 py-2 bg-aether-purple text-black rounded-xl flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:bg-aether-purple/90 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade
                </button>
              )}
            </div>
          </div>

          {/* Stats — horizontal row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group flex items-center gap-3 p-4 aether-card rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 shrink-0 transition-all group-hover:scale-110 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-white/25 uppercase font-display truncate">{stat.label}</p>
                  <p className="text-xl font-bold text-white tracking-tight font-display tabular-nums truncate">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Analytics — 2/3 + 1/3 */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Credit chart */}
            <div className="lg:col-span-2 p-5 aether-card rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] font-display">Uso de créditos</h3>
                  <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-widest font-display">Últimos 7 días</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <TrendingUp className="w-4 h-4 text-aether-purple" />
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600 }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,10,11,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="#4ADE80" strokeWidth={2} fill="url(#creditsGrad)" dot={{ r: 3, fill: '#4ADE80', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution */}
            <div className="p-5 aether-card rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] font-display">Distribución</h3>
                  <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-widest font-display">Por tipo</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <Box className="w-4 h-4 text-aether-blue" />
                </div>
              </div>
              {toolData.every(d => d.value === 0) ? (
                <p className="text-[10px] text-white/20 text-center font-bold uppercase tracking-widest mt-8">Sin actividad reciente</p>
              ) : (
                <div className="space-y-4">
                  {toolData.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5">
                        <span className="text-white/40">{item.name}</span>
                        <span className="text-white/70 tabular-nums">{item.value}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Genesis CTA */}
          <div
            onClick={() => navigate("/chat")}
            className="group cursor-pointer relative overflow-hidden rounded-2xl border border-aether-purple/20 bg-gradient-to-r from-aether-purple/10 via-aether-blue/5 to-transparent p-5 hover:border-aether-purple/40 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-aether-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
                  <span className="text-[10px] font-bold text-aether-purple/70 uppercase tracking-[0.2em] font-display">Genesis · BuilderAI</span>
                </div>
                <h2 className="text-xl font-bold text-white font-display tracking-tight">¿Qué vas a crear hoy?</h2>
                <p className="text-xs text-white/30 mt-1">Describe tu idea y Genesis la construye en segundos</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-aether-purple text-white rounded-xl text-xs font-bold uppercase tracking-widest group-hover:bg-aether-purple/80 transition-all active:scale-95 font-display">
                <Rocket className="w-3.5 h-3.5" />
                Crear
              </div>
            </div>
          </div>

          {/* AI Tools */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.4em] font-display">Accesos rápidos</h2>
              <button onClick={() => navigate("/hub")} className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white transition-all tracking-widest uppercase font-display">
                Hub <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {aiApps.map((app) => (
                <button
                  key={app.label}
                  onClick={() => navigate(app.path)}
                  className="group flex flex-col gap-3 p-4 aether-card rounded-xl border border-white/5 hover:border-aether-purple/25 hover:scale-[1.02] transition-all duration-300 text-left active:scale-95"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 transition-all group-hover:bg-aether-purple/10 group-hover:border-aether-purple/20">
                    <app.icon className="w-4 h-4 text-white/40 group-hover:text-aether-purple transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/80 group-hover:text-white tracking-tight font-display leading-tight">{app.label}</p>
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5 font-display">{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Spaces */}
          <div className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.4em] font-display">Mis Espacios</h2>
              <button
                onClick={() => setIsCreatingSpace(true)}
                className="bg-white text-black hover:bg-white/90 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 font-display"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo
              </button>
            </div>

            {spaces.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all group"
                onClick={() => setIsCreatingSpace(true)}
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:scale-110 transition-all">
                  <FolderPlus className="w-6 h-6 text-white/30 group-hover:text-black" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 font-display">Crea tu primer espacio</h3>
                <p className="text-xs text-white/30">Organiza proyectos, activos e ideas en un solo lugar</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                    className="group flex items-center gap-3 p-4 aether-card rounded-xl border border-white/5 hover:border-aether-blue/30 hover:scale-[1.02] transition-all duration-300 text-left active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-aether-blue/10 group-hover:border-aether-blue/20 transition-all">
                      <LayoutGrid className="w-4 h-4 text-white/30 group-hover:text-aether-blue transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate font-display">{space.name}</p>
                      <p className="text-[10px] text-white/25 truncate font-medium">{space.description || "Sin descripción"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/15 shrink-0 group-hover:text-aether-blue group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Create Space Dialog */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="bg-[#0a0a0b]/95 border border-white/10 rounded-3xl text-white max-w-md p-8 backdrop-blur-3xl">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-aether-blue/20 text-aether-blue flex items-center justify-center mb-4 border border-aether-blue/20">
              <Rocket className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white tracking-tight font-display">Nuevo espacio</DialogTitle>
            <DialogDescription className="text-white/30 text-sm font-medium leading-relaxed mt-2">
              Organiza tus proyectos creativos y campañas en un espacio independiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-display">Nombre</Label>
              <Input
                id="name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="ej. Campaña Verano 2025"
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 rounded-xl px-4 h-12 font-medium focus:border-aether-blue/40 focus:ring-0"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSpace()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-display">Descripción (opcional)</Label>
              <Input
                id="desc"
                value={newSpaceDesc}
                onChange={(e) => setNewSpaceDesc(e.target.value)}
                placeholder="Contexto del proyecto..."
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 rounded-xl px-4 h-12 font-medium focus:border-aether-blue/40 focus:ring-0"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 mt-6">
            <button onClick={() => setIsCreatingSpace(false)} className="px-5 py-2.5 rounded-xl border border-white/5 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-all flex-1 font-display">
              Cancelar
            </button>
            <button onClick={handleCreateSpace} className="flex-[1.5] px-6 py-2.5 bg-white text-black rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 font-display">
              <Plus className="w-4 h-4" />
              Crear
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
