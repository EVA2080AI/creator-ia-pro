import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Zap, Coins, CreditCard, LayoutGrid, Image,
  Megaphone, PenTool, MessageSquare, Hash, FileText, FolderPlus,
  Code2, Brain, Map
} from "lucide-react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useStudioProjects } from "@/hooks/useStudioProjects";
import { genesisOrchestrator } from "@/services/genesis-orchestrator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Type Definitions ---
interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  created_at: string;
  type: 'flow' | 'code';
  thumbnail_url: string | null;
  user_id: string;
  files?: any;
  settings?: any;
}

const tierLabels: Record<string, string> = {
  free: "Gratis",
  pro: "Pro",
  elite: "Elite",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile(user?.id);
  const { projects: studioProjects, deleteProject: deleteStudioProject, duplicateProject } = useStudioProjects();
  
  // State
  const [spaces, setSpaces] = useState<DashboardProject[]>([]);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [openingProject, setOpeningProject] = useState<DashboardProject | null>(null);
  
  const [usageData, setUsageData] = useState<any[]>([]);
  const [toolData, setToolData] = useState<any[]>([]);
  const [spacesCount, setSpacesCount] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);

  // Derived Values
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const creditsSuccess = searchParams.get("credits") === "success";
  const currentTier = profile?.subscription_tier || "free";

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const client = supabase as any;
        
        const { data: flowSpaces } = await client
          .from("spaces")
          .select("*")
          .order("updated_at", { ascending: false });
        
        const formattedFlows: DashboardProject[] = (flowSpaces || []).map((s: any) => ({ ...s, type: 'flow' }));
        const formattedCode: DashboardProject[] = (studioProjects || []).map((p: any) => ({ ...p, type: 'code', thumbnail_url: null }));

        const allProjects = [...formattedCode, ...formattedFlows].sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        setSpaces(allProjects);
        setSpacesCount(flowSpaces?.length || 0);

        const { count } = await client
          .from("assets")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id);
          
        setAssetsCount(count || 0);

        setUsageData([
          { name: "Lun", credits: 12 }, { name: "Mar", credits: 45 },
          { name: "Mie", credits: 30 }, { name: "Jue", credits: 89 },
          { name: "Vie", credits: 56 }, { name: "Sab", credits: 110 },
          { name: "Dom", credits: 80 },
        ]);

        setToolData([
          { name: "Genesis", value: 65, color: "bg-primary" },
          { name: "Canvas", value: 25, color: "bg-emerald-400" },
          { name: "Studio", value: 10, color: "bg-purple-400" },
        ]);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      }
    };

    fetchData();
  }, [user, studioProjects, profile]);

  // Handlers
  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    const { data, error } = await supabase.from("spaces")
      .insert({ user_id: user.id, name: newSpaceName, description: newSpaceDesc })
      .select().single();
    
    if (error) { toast.error("Error creating space"); return; }
    toast.success("Espacio creado");
    setIsCreatingSpace(false);
    setNewSpaceName(""); setNewSpaceDesc("");
    navigate("/formarketing?spaceId=" + data.id);
  };

  const handleDuplicate = async (e: React.MouseEvent, project: DashboardProject) => {
    e.stopPropagation();
    if (project.type === 'code') {
      const newProj = await duplicateProject(project as any);
      if (newProj) {
        setSpaces(prev => [ { ...newProj, type: 'code', thumbnail_url: null } as DashboardProject, ...prev ]);
      }
    } else {
      const { data, error } = await supabase.from("spaces")
        .insert({ 
          user_id: user?.id, 
          name: project.name + " (Copia)", 
          description: project.description 
        })
        .select().single();
      
      if (error) { toast.error("Error al duplicar espacio"); return; }
      setSpaces(prev => [ { ...data, type: 'flow' }, ...prev ]);
      toast.success("Espacio duplicado");
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: DashboardProject) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de eliminar este proyecto?")) return;

    if (project.type === 'code') {
      await deleteStudioProject(project.id);
    } else {
      const { error } = await supabase.from("spaces").delete().eq("id", project.id);
      if (error) { toast.error("Error al eliminar espacio"); return; }
    }
    
    setSpaces(prev => prev.filter(p => p.id !== project.id));
    toast.success("Proyecto eliminado");
  };

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

  const userStats = [
    { label: "Créditos", value: profile?.credits_balance ?? 0, icon: Coins, color: "text-primary" },
    { label: "Plan", value: tierLabels[currentTier] || "Gratis", icon: CreditCard, color: "text-primary" },
    { label: "Espacios", value: spacesCount, icon: LayoutGrid, color: "text-rose-400" },
    { label: "Activos", value: assetsCount, icon: Image, color: "text-emerald-400" },
  ];

  const aiApps = [
    { icon: Zap, label: "Genesis IDE", desc: "BuilderAI", path: "/chat" },
    { icon: Megaphone, label: "Canvas IA", desc: "Lienzo", path: "/formarketing" },
    { icon: PenTool, label: "Studio", desc: "Herramientas", path: "/studio" },
    { icon: MessageSquare, label: "Chat IA", desc: "Copy", path: "/chat" },
    { icon: Hash, label: "Hub", desc: "Templates", path: "/hub" },
    { icon: FileText, label: "Espacios", desc: "Archivos", path: "/spaces" },
  ];

  return (
    <>
      <Helmet><title>Dashboard | Creator IA Pro</title></Helmet>
      <div className="max-w-[1440px] mx-auto px-6 pt-6 pb-6 space-y-6">

          {/* Checkout Banner */}
          {(checkoutSuccess || creditsSuccess) && (
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-black">{checkoutSuccess ? '¡Suscripción activada!' : '¡Créditos añadidos!'}</p>
                <p className="text-[11px] text-zinc-500">{profile?.credits_balance?.toLocaleString() ?? '--'} créditos disponibles</p>
              </div>
              <button onClick={() => navigate('/chat')} className="ml-auto px-4 py-2 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest">Ir a Genesis</button>
            </div>
          )}

          {/* Welcome Row */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-zinc-400">Activo</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Hola, <span className="text-primary">{profile?.display_name?.split(' ')[0] || 'Creator'}</span></h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {userStats.map((stat) => (
              <div key={stat.label} className="p-5 bg-white border border-zinc-200 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className={"w-11 h-11 rounded-2xl flex items-center justify-center bg-zinc-50 border border-zinc-100 " + stat.color}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-6 bg-white border border-zinc-200 rounded-2xl h-60">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest">Uso de créditos</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="credits" stroke="#A855F7" fill="#A855F720" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl">
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-6">Distribución</h3>
              <div className="space-y-4">
                {toolData.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-zinc-400">{item.name}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className={"h-full " + item.color} style={{ width: item.value + "%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {aiApps.map((app) => (
              <button key={app.label} onClick={() => navigate(app.path)} className="p-5 bg-white border border-zinc-200 rounded-2xl text-left hover:border-primary transition-all group">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <app.icon className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-black text-zinc-900">{app.label}</p>
                <p className="text-[9px] text-zinc-400 uppercase mt-1">{app.desc}</p>
              </button>
            ))}
          </div>

          {/* Local Projects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em]">Mis Proyectos</h2>
              <button onClick={() => setIsCreatingSpace(true)} className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">+ Nuevo</button>
            </div>
            {spaces.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center bg-zinc-50/50">
                <FolderPlus className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                <p className="text-sm text-zinc-400 font-medium">Crea tu primer espacio para comenzar</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {spaces.map((space) => (
                  <ProjectCard 
                    key={space.id} project={space} onDuplicate={(e) => handleDuplicate(e, space)} onDelete={(e) => handleDelete(e, space)}
                    onClick={() => { if (space.type === 'code') { setOpeningProject(space); } else { navigate("/formarketing?spaceId=" + space.id); } }}
                  />
                ))}
              </div>
            )}
          </div>
      </div>

      {/* New Space Dialog */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo espacio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="Campaña 2025" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input value={newSpaceDesc} onChange={e => setNewSpaceDesc(e.target.value)} placeholder="Opcional..." /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsCreatingSpace(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Cancelar</button>
            <button onClick={handleCreateSpace} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest">Crear</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opening Project Dialog */}
      <Dialog open={!!openingProject} onOpenChange={o => !o && setOpeningProject(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-[2rem] border-zinc-200">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400"><Code2 className="w-6 h-6" /></div>
              <div><h3 className="font-bold">{openingProject?.name}</h3><p className="text-[10px] text-zinc-400 uppercase tracking-widest">Genesis Studio Project</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { navigate("/chat?project=" + openingProject?.id); setOpeningProject(null); }} className="flex flex-col items-center gap-3 p-6 border rounded-2xl hover:border-primary transition-all"><Brain className="w-6 h-6 text-primary" /><span className="text-xs font-bold">Genesis IA</span></button>
              <button onClick={() => { navigate("/code?project=" + openingProject?.id); setOpeningProject(null); }} className="flex flex-col items-center gap-3 p-6 border rounded-2xl hover:border-emerald-500 transition-all"><Code2 className="w-6 h-6 text-emerald-500" /><span className="text-xs font-bold">Code Editor</span></button>
            </div>
            <button
               className="w-full flex items-center gap-4 p-5 border rounded-2xl hover:border-primary transition-all"
               onClick={async () => {
                 if (!openingProject) return;
                 try {
                   const blueprintFile = openingProject.files?.['blueprint.json'];
                   if (!blueprintFile) throw new Error("No blueprint");
                   const blueprint = JSON.parse(blueprintFile.content);
                   const { data: space, error: spaceErr } = await supabase.from('spaces').insert({
                     name: "🗺️ Map: " + openingProject.name,
                     user_id: user?.id,
                     settings: { genesis_project_id: openingProject.id }
                   }).select().single();
                   if (spaceErr || !space) throw spaceErr;
                   const { nodes, edges } = genesisOrchestrator.mapBlueprintToCanvasNodes(blueprint, space.id, user?.id || '');
                   await supabase.from('canvas_nodes').insert(nodes);
                   await supabase.from('canvas_nodes').insert({
                     space_id: space.id, user_id: user?.id || '', type: 'flow_metadata',
                     data_payload: { edges }, prompt: 'metadata', status: 'completed'
                   });
                   toast.success("Mapa generado");
                   navigate("/formarketing?spaceId=" + space.id);
                   setOpeningProject(null);
                 } catch (err) { console.error(err); toast.error("Error al mapear"); }
               }}
            >
              <Map className="w-5 h-5 text-zinc-400" />
              <div className="text-left"><p className="text-xs font-bold uppercase tracking-widest">Mapa Estratégico</p><p className="text-[9px] text-zinc-400">Visualiza en el Canvas</p></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
