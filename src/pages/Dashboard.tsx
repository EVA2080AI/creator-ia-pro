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
    if (error) { toast.error("error_creating_nexus"); return; }
    toast.success("nexus_space_initialized");
    setIsCreatingSpace(false);
    setNewSpaceName(""); setNewSpaceDesc("");
    navigate(`/formarketing?spaceId=${data.id}`);
  };

  const stats = [
    { label: "nexus_credits", value: profile?.credits_balance ?? 0, icon: Coins, color: "#ffffff", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
    { label: "system_tier", value: tierLabels[currentTier] || "Starter", icon: CreditCard, color: "#ffffff", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
    { label: "active_spaces", value: spacesCount, icon: LayoutGrid, color: "#ffffff", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
    { label: "stored_assets", value: assetsCount, icon: Image, color: "#ffffff", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
  ];

  const quickTools = [
    { icon: Image, label: "Generate_Asset", desc: "Text to image engine", path: "/formarketing", color: "#ffffff" },
    { icon: Wand2, label: "Neural_Enhancer", desc: "IA enhancement v2", path: "/tools", color: "#ffffff" },
    { icon: ZoomIn, label: "Upscale_4X", desc: "Industrial upscale", path: "/tools", color: "#ffffff" },
    { icon: Eraser, label: "Object_Eraser", desc: "Neural removal", path: "/tools", color: "#ffffff" },
    { icon: ImagePlus, label: "Alpha_Matte", desc: "Background removal", path: "/tools", color: "#ffffff" },
    { icon: RotateCcw, label: "Restoration", desc: "Heritage recovery", path: "/tools", color: "#ffffff" },
  ];

  const aiApps = [
    { icon: Megaphone, label: "nexus_studio", desc: "Multimodal infinite canvas", path: "/formarketing", color: "#ffffff" },
    { icon: MessageSquare, label: "Copy_Orchestrator", desc: "Marketing semantic engine", path: "/tools", color: "#ffffff" },
    { icon: PenTool, label: "Vector_Gen", desc: "Neural logo generation", path: "/tools", color: "#ffffff" },
    { icon: Hash, label: "Social_Module", desc: "Cross-platform distribution", path: "/tools", color: "#ffffff" },
    { icon: FileText, label: "Semantic_Writer", desc: "SEO industrial articles", path: "/tools", color: "#ffffff" },
    { icon: Type, label: "Ad_Distributor", desc: "Meta/Google ad engine", path: "/tools", color: "#ffffff" },
    { icon: Monitor, label: "ShareScreen_PRO", desc: "Industrial multi-display", path: "/sharescreen", color: "#ffffff" },
  ];

  const usageData = [
    { name: 'Mon', credits: 12 }, { name: 'Tue', credits: 18 }, { name: 'Wed', credits: 15 },
    { name: 'Thu', credits: 25 }, { name: 'Fri', credits: 32 }, { name: 'Sat', credits: 28 }, { name: 'Sun', credits: 40 },
  ];

  const toolData = [
    { name: 'Image', value: 45, color: '#ffffff' },
    { name: 'Copy', value: 30, color: '#ffffff' },
    { name: 'Nexus', value: 25, color: '#ffffff' },
  ];

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-white/10 selection:text-white">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="pt-14">
        <div className="max-w-[1400px] mx-auto px-6 py-10">

          {/* Welcome Banner */}
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">SYSTEM_V7_INDUSTRIAL_ACTIVE</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-3 lowercase">
                hello_ <span className="text-white/40">{profile?.display_name?.split(' ')[0] || 'operator'}</span>
              </h1>
              <p className="text-[12px] text-white/20 font-bold lowercase tracking-wide max-w-xl leading-relaxed">
                interface_control_node initialized. managing{' '}
                <span className="text-white/60">{assetsCount} assets</span> and{' '}
                <span className="text-white/60">{spacesCount} clusters</span> across the nexus network.
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              {subscription?.subscribed && (
                <button
                  onClick={async () => { try { await openCustomerPortal(); } catch { toast.error("auth_error"); } }}
                  className="px-6 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 transition-all lowercase"
                >
                  <Settings className="w-3.5 h-3.5 mr-2 inline" />
                  manage_nexus
                </button>
              )}
              <button onClick={() => navigate("/pricing")} className="px-8 py-3 bg-white text-black rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-2xl shadow-white/5">
                <Zap className="w-3.5 h-3.5" />
                boost_engine
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-11">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative flex flex-col p-7 border border-white/5 bg-white/[0.01] rounded-[2rem] hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-2xl transition-transform group-hover:scale-105"
                  >
                    <stat.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="w-5 h-1 rounded-full bg-white/5" />
                </div>
                <p className="text-[9px] font-black tracking-[0.3em] text-white/10 mb-2 uppercase">{stat.label}</p>
                <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                
                {/* Decorative neural line */}
                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-white/10 group-hover:w-full transition-all duration-1000" />
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-7 mb-11">
            {/* Credit Flow */}
            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">credits_neural_flow</h3>
                  <p className="text-[9px] text-white/10 mt-1 uppercase tracking-widest leading-none">CONSUMPTION_AUDIT_V7</p>
                </div>
                <TrendingUp className="w-4 h-4 text-white/20" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 900 }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.2)' }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="rgba(255,255,255,0.1)" strokeWidth={2} fill="url(#creditsGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tool Distribution */}
            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">system_load_balance</h3>
                  <p className="text-[9px] text-white/10 mt-1 uppercase tracking-widest leading-none">RESOURCE_ALLOCATION_IA</p>
                </div>
                <Box className="w-4 h-4 text-white/20" />
              </div>
              <div className="space-y-6">
                {toolData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] mb-2.5">
                      <span className="text-white/20">{item.name}</span>
                      <span className="text-white/40">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="mb-11">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">visual_processing_nodes</h2>
              <button onClick={() => navigate("/tools")} className="flex items-center gap-2 text-[9px] font-black text-white/20 hover:text-white transition-all lowercase tracking-widest">
                explore_all_nodes <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickTools.map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => navigate(tool.path)}
                  className="group flex flex-col p-6 border border-white/5 bg-white/[0.01] rounded-[2rem] hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 text-left active:scale-95"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5 bg-white/5 border border-white/5 shadow-2x transition-transform group-hover:rotate-3">
                    <tool.icon className="w-4.5 h-4.5 text-white/40" />
                  </div>
                  <p className="text-[11px] font-black text-white/80 group-hover:text-white mb-1 leading-tight lowercase tracking-tighter transition-colors">{tool.label}</p>
                  <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest leading-none">{tool.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Apps / Apps IA */}
          <div className="mb-11">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">industrial_ai_clusters</h2>
              <button onClick={() => navigate("/hub")} className="flex items-center gap-2 text-[9px] font-black text-white/20 hover:text-white transition-all lowercase tracking-widest">
                view_cluster_hub <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {aiApps.map((app) => (
                <button
                  key={app.label}
                  onClick={() => navigate(app.path)}
                  className="group flex items-start gap-4 p-6 border border-white/5 bg-white/[0.01] rounded-[2rem] hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 text-left active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/5 border border-white/5 shadow-2xl transition-transform group-hover:scale-105">
                    <app.icon className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="mt-1">
                    <p className="text-[13px] font-black text-white/80 group-hover:text-white mb-1 lowercase tracking-tighter transition-colors">{app.label}</p>
                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest leading-tight">{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Spaces / Projects */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">active_nexus_spaces</h2>
              <button
                onClick={() => setIsCreatingSpace(true)}
                className="bg-white text-black hover:bg-white/90 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-2xl shadow-white/5"
              >
                <Plus className="w-4 h-4" />
                init_new_nexus
              </button>
            </div>
            {spaces.length === 0 ? (
              <div
                className="rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01] p-16 text-center cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all group duration-700"
                onClick={() => setIsCreatingSpace(true)}
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-white text-black flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-3xl shadow-white/5">
                  <FolderPlus className="w-7 h-7" />
                </div>
                <p className="text-xl font-black text-white mb-2 lowercase tracking-tighter">initialize_first_nexus_cluster</p>
                <p className="text-[10px] text-white/10 font-bold uppercase tracking-[0.2em]">organize. automate. scale cross-canvas campaigns.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                    className="group flex flex-col p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem] hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 text-left active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-3xl shadow-white/5 transition-transform group-hover:rotate-3">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/5 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-lg font-black text-white mb-2 truncate lowercase tracking-tighter">{space.name}</p>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest truncate">{space.description || "no_system_description"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Create Space Dialog */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] text-white max-w-md p-10 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white lowercase tracking-tighter">init_nexus_cluster</DialogTitle>
            <DialogDescription className="text-white/20 text-[11px] font-bold uppercase tracking-widest leading-relaxed mt-2">
              creating a persistent workspace for multimodal cluster orchestration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">nexus_identifier</Label>
                <Input
                  id="name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="cluster_alpha_v7"
                  className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/5 rounded-xl px-5 py-6 text-sm font-bold focus:border-white/20 focus:ring-0 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSpace()}
                />
            </div>
            <div className="space-y-3">
              <Label htmlFor="desc" className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">operational_summary</Label>
                <Input
                  id="desc"
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="describe purpose of this cluster..."
                  className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/5 rounded-xl px-5 py-6 text-sm font-bold focus:border-white/20 focus:ring-0 transition-all"
                />
            </div>
          </div>
          <DialogFooter className="gap-4 mt-8">
            <button onClick={() => setIsCreatingSpace(false)} className="px-6 py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:bg-white/5 hover:text-white transition-all">
              abort
            </button>
            <button onClick={handleCreateSpace} className="flex-1 px-8 py-3 bg-white text-black rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-2xl shadow-white/10">
              <Plus className="w-3.5 h-3.5" />
              initialize_nexus
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
