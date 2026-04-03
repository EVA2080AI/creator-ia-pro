import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
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
  const { user, loading: authLoading } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const { subscription, checkSubscription } = useSubscription(user?.id);
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
          { name: 'Visual', value: Math.round((visual / total) * 100), color: 'bg-primary' },
          { name: 'Copy',   value: Math.round((copy   / total) * 100), color: 'bg-primary' },
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

  const tierLabels: Record<string, string> = { free: "Gratis", starter: "Starter", creator: "Creator", pymes: "Pymes" };
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
    { label: "Créditos", value: profile?.credits_balance ?? 0, icon: Coins, color: "text-primary" },
    { label: "Plan", value: tierLabels[currentTier] || "Gratis", icon: CreditCard, color: "text-primary" },
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
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl border-2 border-zinc-200 border-t-primary animate-spin" />
          <p className="text-[11px] text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Dashboard | Creator IA Pro</title></Helmet>
      <main id="main-content" className="min-h-screen bg-background text-foreground font-sans">
        <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6 space-y-5">

          {/* Post-checkout success banner */}
          {(checkoutSuccess || creditsSuccess) && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/8 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="absolute inset-0 pointer-events-none bg-background/5" />
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-zinc-900 font-display">
                    {checkoutSuccess ? '¡Suscripción activada!' : '¡Créditos añadidos!'}
                  </p>
                  <p className="text-[11px] text-zinc-400">
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ir a Genesis
                </button>
                <button
                  onClick={() => navigate('/studio')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-[12px] font-bold text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all"
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
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-400">Activo</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display">
                Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{profile?.display_name?.split(' ')[0] || 'Creator'}</span>
              </h1>
            </div>
            <div className="flex gap-2 shrink-0">
              {subscription?.tier && subscription.tier !== "free" ? (
                <>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-all text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900"
                  >
                    <Coins className="w-3.5 h-3.5 mr-1.5 inline" />
                    + Créditos
                  </button>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-all text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5 inline" />
                    Plan
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate("/pricing")}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade Pro
                </button>
              )}
            </div>
          </div>

          {/* Stats — horizontal row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.06)" }}
                className="group flex items-center gap-4 p-5 bg-white border border-zinc-200/60 transition-all duration-300 rounded-[2rem] shadow-sm"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-zinc-50 border border-zinc-100 shrink-0 transition-all group-hover:scale-110 group-hover:bg-white ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase truncate mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-black text-zinc-900 tracking-tight font-display tabular-nums truncate">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analytics — 2/3 + 1/3 */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Credit chart */}
            <div className="lg:col-span-2 p-5 bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.2em] font-display">Uso de créditos</h3>
                  <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest font-display">Últimos 7 días</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-100">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 9, fontWeight: 600 }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '11px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      labelStyle={{ color: '#71717a', marginBottom: '2px' }}
                      itemStyle={{ color: '#18181b' }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="#2563eb" strokeWidth={2} fill="url(#creditsGrad)" dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution */}
            <div className="p-5 bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.2em] font-display">Distribución</h3>
                  <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest font-display">Por tipo</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-100">
                  <Box className="w-4 h-4 text-primary" />
                </div>
              </div>
              {toolData.every(d => d.value === 0) ? (
                <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest mt-8">Sin actividad reciente</p>
              ) : (
                <div className="space-y-4">
                  {toolData.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5">
                        <span className="text-zinc-400">{item.name}</span>
                        <span className="text-zinc-600 tabular-nums">{item.value}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            whileHover={{ scale: 1.005 }}
            onClick={() => navigate("/chat")}
            className="group cursor-pointer relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-white p-7 hover:border-primary/40 transition-all duration-500 shadow-xl shadow-primary/5"
          >
            <div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                   <Rocket className="w-8 h-8 text-primary group-hover:animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Genesis · BuilderAI</span>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">¿Qué vas a crear hoy?</h2>
                  <p className="text-[13px] text-zinc-500 mt-1 font-medium">Describe tu idea y Genesis la construye en segundos con preview en vivo</p>
                </div>
              </div>
              <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] group-hover:bg-primary transition-all active:scale-95 shadow-lg shadow-zinc-900/10">
                Lanzar Genesis
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          {/* AI Tools */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.4em] font-display">Accesos rápidos</h2>
              <button onClick={() => navigate("/hub")} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-all tracking-widest uppercase font-display">
                Hub <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {aiApps.map((app, i) => (
                <motion.button
                  key={app.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.4 + i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(app.path)}
                  className="group flex flex-col gap-4 p-5 bg-white border border-zinc-200/60 rounded-2xl text-left shadow-sm transition-all"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-50 border border-zinc-100 transition-all group-hover:bg-primary/5 group-hover:border-primary/20">
                    <app.icon className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-zinc-900 tracking-tight leading-tight">{app.label}</p>
                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.1em] mt-1 opacity-70 group-hover:opacity-100 transition-opacity">{app.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Spaces */}
          <div className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.4em] font-display">Mis Espacios</h2>
              <button
                onClick={() => setIsCreatingSpace(true)}
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 font-display"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo
              </button>
            </div>

            {spaces.length === 0 ? (
              <div
                className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center cursor-pointer hover:border-zinc-300 hover:bg-zinc-50 transition-all group"
                onClick={() => setIsCreatingSpace(true)}
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:scale-110 transition-all">
                  <FolderPlus className="w-6 h-6 text-zinc-400 group-hover:text-black" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 mb-1 font-display">Crea tu primer espacio</h3>
                <p className="text-xs text-zinc-400">Organiza proyectos, activos e ideas en un solo lugar</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                    className="group flex items-center gap-3 p-5 bg-white border border-zinc-200/60 hover:border-zinc-300 transition-all rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] duration-300 text-left active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                      <LayoutGrid className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-black text-zinc-900 truncate">{space.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate font-bold uppercase tracking-widest mt-0.5">{space.description || "Sin descripción"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Create Space Dialog */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="max-w-md p-8">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-primary flex items-center justify-center mb-4 border border-zinc-200">
              <Rocket className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight font-display">Nuevo espacio</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm font-medium leading-relaxed mt-2">
              Organiza tus proyectos creativos y campañas en un espacio independiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-display">Nombre</Label>
              <Input
                id="name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="ej. Campaña Verano 2025"
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-200 rounded-xl px-4 h-12 font-medium focus:border-primary/40 focus:ring-0"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSpace()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-display">Descripción (opcional)</Label>
              <Input
                id="desc"
                value={newSpaceDesc}
                onChange={(e) => setNewSpaceDesc(e.target.value)}
                placeholder="Contexto del proyecto..."
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-200 rounded-xl px-4 h-12 font-medium focus:border-primary/40 focus:ring-0"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 mt-6">
            <button onClick={() => setIsCreatingSpace(false)} className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all flex-1">
              Cancelar
            </button>
            <button onClick={handleCreateSpace} className="flex-[1.5] px-6 py-2.5 bg-primary text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-sm">
              <Plus className="w-4 h-4" />
              Crear Space
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
