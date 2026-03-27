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
  FolderPlus, Star, Box, Eye, ChevronRight, Rocket
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
      toast.success("Subscription activated! Your credits have been recharged.");
      checkSubscription();
      refreshProfile();
    }
    if (searchParams.get("credits") === "success") {
      toast.success("Credits purchased! Your balance has been updated.");
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

  const tierLabels: Record<string, string> = { free: "Starter", educacion: "Educación", pro: "Premium", business: "Enterprise" };
  const currentTier = profile?.subscription_tier || "free";

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    const { data, error } = await supabase.from("spaces")
      .insert({ user_id: user.id, name: newSpaceName, description: newSpaceDesc })
      .select().single();
    if (error) { toast.error("Error creating space"); return; }
    toast.success("Nexus Space Initialized");
    setIsCreatingSpace(false);
    setNewSpaceName(""); setNewSpaceDesc("");
    navigate(`/formarketing?spaceId=${data.id}`);
  };

  const stats = [
    { label: "Neural Credits", value: profile?.credits_balance ?? 0, icon: Coins, color: "text-aether-purple" },
    { label: "System Tier", value: tierLabels[currentTier] || "Starter", icon: CreditCard, color: "text-aether-blue" },
    { label: "Active Spaces", value: spacesCount, icon: LayoutGrid, color: "text-rose-400" },
    { label: "Stored Assets", value: assetsCount, icon: Image, color: "text-emerald-400" },
  ];

  const quickTools = [
    { icon: Image, label: "Generate Asset", desc: "Text to image engine", path: "/formarketing" },
    { icon: Wand2, label: "Neural Enhancer", desc: "AI quality v2", path: "/tools" },
    { icon: ZoomIn, label: "Quantum Upscale", desc: "4K Industrial scaling", path: "/tools" },
    { icon: Eraser, label: "Object Eraser", desc: "Neural removal", path: "/tools" },
    { icon: ImagePlus, label: "Alpha Matte", desc: "Background removal", path: "/tools" },
    { icon: RotateCcw, label: "Restoration", desc: "Asset recovery", path: "/tools" },
  ];

  const aiApps = [
    { icon: Megaphone, label: "Creator Studio", desc: "Infinite creative canvas", path: "/formarketing" },
    { icon: MessageSquare, label: "Copy Orchestrator", desc: "Semantic copy engine", path: "/tools" },
    { icon: PenTool, label: "Vector Gen", desc: "Neural brand design", path: "/tools" },
    { icon: Hash, label: "Social Hub", desc: "Campaign distribution", path: "/tools" },
    { icon: FileText, label: "Semantic Writer", desc: "Industrial SEO articles", path: "/tools" },
    { icon: Type, label: "Ad Distributor", desc: "Meta/Google ad engine", path: "/tools" },
  ];

  const usageData = [
    { name: 'Mon', credits: 12 }, { name: 'Tue', credits: 18 }, { name: 'Wed', credits: 15 },
    { name: 'Thu', credits: 25 }, { name: 'Fri', credits: 32 }, { name: 'Sat', credits: 28 }, { name: 'Sun', credits: 40 },
  ];

  const toolData = [
    { name: 'Visual', value: 45, color: 'bg-aether-purple' },
    { name: 'Copy', value: 30, color: 'bg-aether-blue' },
    { name: 'System', value: 25, color: 'bg-rose-400' },
  ];

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <div className="w-10 h-10 rounded-full border-t-2 border-aether-purple animate-spin shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-aether-purple/30 selection:text-white font-sans">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="pt-20">
        <div className="max-w-[1440px] mx-auto px-8 py-12">

          {/* Welcome Banner */}
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-display">System Active</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 font-display">
                Hello, <span className="bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">{profile?.display_name?.split(' ')[0] || 'Creator'}</span>
              </h1>
              <p className="text-base text-white/40 max-w-2xl leading-relaxed font-medium">
                Your creative ecosystem is fully operational. You've orchestrated <span className="text-white font-bold">{assetsCount} neural assets</span> across <span className="text-white font-bold">{spacesCount} nexus spaces</span> this month.
              </p>
            </div>
            <div className="flex gap-4 shrink-0 pb-1">
              {subscription?.subscribed && (
                <button
                  onClick={async () => { try { await openCustomerPortal(); } catch { toast.error("System error"); } }}
                  className="px-8 py-4 rounded-2xl aether-card text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all border border-white/5"
                >
                  <Settings className="w-4 h-4 mr-2 inline" />
                  Orchestration
                </button>
              )}
              <button 
                onClick={() => navigate("/pricing")} 
                className="px-10 py-4 bg-white text-black rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] group"
              >
                <Zap className="w-4 h-4 group-hover:fill-current" />
                Creator Pro Plus
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative flex flex-col p-8 aether-card rounded-[2.5rem] hover:border-white/10 transition-all duration-500 overflow-hidden border border-white/5"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner transition-all group-hover:scale-110 group-hover:rotate-3 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-white/20 tabular-nums">LIVE</div>
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/20 mb-2 uppercase font-display">{stat.label}</p>
                <p className="text-5xl font-bold text-white tracking-tighter font-display tabular-nums">{stat.value}</p>
                
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:w-full transition-all duration-1000" />
              </div>
            ))}
          </div>

          {/* Analytics Section */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Credit Flow */}
            <div className="lg:col-span-2 p-10 aether-card rounded-[3rem] border border-white/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-[0.3em] font-display">Neural Consumption</h3>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest font-display">Real-time resource audit</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5">
                  <TrendingUp className="w-5 h-5 text-aether-purple" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <defs>
                      <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 600 }} dy={15} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,10,11,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(20px)' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="#A855F7" strokeWidth={3} fill="url(#creditsGrad)" dot={{ r: 4, fill: '#A855F7', strokeWidth: 2, stroke: '#050506' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Load Balance */}
            <div className="p-10 aether-card rounded-[3rem] border border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-[0.3em] font-display">Node Balance</h3>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest font-display">Resource Allocation</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5">
                  <Box className="w-5 h-5 text-aether-blue" />
                </div>
              </div>
              <div className="space-y-8">
                {toolData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.1em] mb-3">
                      <span className="text-white/40">{item.name}</span>
                      <span className="text-white/80 tabular-nums">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${item.color} shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Efficiency Rating</p>
                 <p className="text-3xl font-bold mt-2 font-display text-white">98.4%</p>
              </div>
            </div>
          </div>

          {/* Industrial AI Clusters */}
          <div className="mb-16">
            <div className="flex items-end justify-between mb-10 px-2">
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-white uppercase tracking-[0.5em] font-display">Industrial AI Clusters</h2>
                <div className="h-1 w-20 bg-aether-purple rounded-full" />
              </div>
              <button onClick={() => navigate("/hub")} className="flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-white transition-all tracking-widest uppercase">
                Explore Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {aiApps.map((app) => (
                <button
                  key={app.label}
                  onClick={() => navigate(app.path)}
                  className="group flex items-start gap-5 p-7 aether-card rounded-[2.5rem] border border-white/5 hover:border-aether-purple/20 hover:scale-[1.03] transition-all duration-500 text-left active:scale-95"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/5 border border-white/5 shadow-2xl transition-all group-hover:bg-aether-purple/10 group-hover:border-aether-purple/20">
                    <app.icon className="w-6 h-6 text-white/40 group-hover:text-aether-purple transition-colors" />
                  </div>
                  <div className="mt-1">
                    <p className="text-base font-bold text-white/90 group-hover:text-white mb-1 tracking-tight font-display">{app.label}</p>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nexus Spaces */}
          <div className="mb-20">
            <div className="flex items-end justify-between mb-10 px-2">
               <div className="space-y-2">
                 <h2 className="text-xs font-bold text-white uppercase tracking-[0.5em] font-display">Active Nexus Spaces</h2>
                 <div className="h-1 w-20 bg-aether-blue rounded-full" />
               </div>
              <button
                onClick={() => setIsCreatingSpace(true)}
                className="bg-white text-black hover:bg-white/90 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                <Plus className="w-4.5 h-4.5" />
                Initialize Space
              </button>
            </div>
            {spaces.length === 0 ? (
              <div
                className="rounded-[4rem] border border-dashed border-white/10 bg-white/[0.01] p-24 text-center cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all group duration-700"
                onClick={() => setIsCreatingSpace(true)}
              >
                <div className="w-20 h-20 rounded-[2rem] bg-white text-black flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-3xl">
                  <FolderPlus className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight font-display">Initialize First Nexus Cluster</h3>
                <p className="text-sm text-white/20 font-medium uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">Organize scripts, neural assets, and infinite canvas campaigns in persistent production clusters.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => navigate(`/formarketing?spaceId=${space.id}`)}
                    className="group flex flex-col p-10 aether-card rounded-[3rem] border border-white/5 hover:border-aether-blue/30 hover:scale-[1.02] transition-all duration-500 text-left active:scale-95 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6">
                        <LayoutGrid className="w-6 h-6" />
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 text-white/20 group-hover:text-white/80 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-2xl font-bold text-white tracking-tight font-display">{space.name}</p>
                       <p className="text-xs text-white/30 font-medium line-clamp-2 leading-relaxed">{space.description || "Operational Nexus environment without a defined protocol."}</p>
                    </div>
                    
                    {/* Visual noise background for cards */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Create Space Dialog */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="bg-[#0a0a0b]/95 border border-white/10 rounded-[3rem] text-white max-w-lg p-12 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          <DialogHeader className="mb-10 text-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-aether-blue/20 text-aether-blue flex items-center justify-center mx-auto mb-6 border border-aether-blue/20">
               <Rocket className="w-8 h-8" />
            </div>
            <DialogTitle className="text-3xl font-bold text-white tracking-tight font-display">Initialize Nexus</DialogTitle>
            <DialogDescription className="text-white/30 text-sm font-medium leading-relaxed mt-4">
              Create a high-fidelity environment for parallel creative orchestration and multimodal campaign production.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-display ml-1">Space Protocol Identifier</Label>
                <Input
                  id="name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. Project Odyssey"
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 rounded-2xl px-6 py-7 text-base font-bold focus:border-aether-blue/40 focus:ring-0 transition-all shadow-inner"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSpace()}
                />
            </div>
            <div className="space-y-3">
              <Label htmlFor="desc" className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-display ml-1">Operational Protocol</Label>
                <Input
                  id="desc"
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="Describe the mission objective..."
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 rounded-2xl px-6 py-7 text-base font-bold focus:border-aether-blue/40 focus:ring-0 transition-all shadow-inner"
                />
            </div>
          </div>
          <DialogFooter className="gap-5 mt-12">
            <button onClick={() => setIsCreatingSpace(false)} className="px-8 py-4 rounded-2xl border border-white/5 text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white hover:bg-white/5 transition-all flex-1">
              Abort Mission
            </button>
            <button onClick={handleCreateSpace} className="flex-[1.5] px-10 py-4 bg-white text-black rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
              <Plus className="w-5 h-5" />
              Init Nexus Space
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
