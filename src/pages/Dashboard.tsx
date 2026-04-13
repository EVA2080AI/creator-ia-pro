import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
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
import { LoadingState } from "@/components/dashboard/LoadingState";
import { CheckoutBanner } from "@/components/dashboard/CheckoutBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartSection } from "@/components/dashboard/ChartSection";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Types ---
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

const TIER_LABELS: Record<string, string> = {
  free: "Gratis",
  pro: "Pro",
  elite: "Elite",
};

// --- Main Dashboard ---

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile(user?.id);
  const { projects: studioProjects, deleteProject: deleteStudioProject, duplicateProject } = useStudioProjects();
  
  const [spaces, setSpaces] = useState<DashboardProject[]>([]);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [openingProject, setOpeningProject] = useState<DashboardProject | null>(null);
  
  const [usageData, setUsageData] = useState<any[]>([]);
  const [toolData, setToolData] = useState<any[]>([]);
  const [spacesCount, setSpacesCount] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);

  const checkoutSuccess = searchParams.get("checkout") === "success";
  const creditsSuccess = searchParams.get("credits") === "success";
  const currentTier = profile?.subscription_tier || "free";

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const { data: flowSpaces } = await supabase.from("spaces").select("*").order("updated_at", { ascending: false });
        const formattedFlows: DashboardProject[] = (flowSpaces || []).map((s: any) => ({ ...s, type: 'flow' }));
        const formattedCode: DashboardProject[] = (studioProjects || []).map((p: any) => ({ ...p, type: 'code', thumbnail_url: null }));

        const allProjects = [...formattedCode, ...formattedFlows].sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        setSpaces(allProjects);
        setSpacesCount(flowSpaces?.length || 0);

        const { count } = await supabase.from("saved_assets").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
        setAssetsCount(count || 0);

        setUsageData([
          { name: "Lun", credits: 12 }, { name: "Mar", credits: 45 }, { name: "Mie", credits: 30 },
          { name: "Jue", credits: 89 }, { name: "Vie", credits: 56 }, { name: "Sab", credits: 110 },
          { name: "Dom", credits: 80 },
        ]);

        setToolData([
          { name: "Genesis", value: 65, color: "bg-primary" },
          { name: "Canvas", value: 25, color: "bg-emerald-400" },
          { name: "Studio", value: 10, color: "bg-purple-400" },
        ]);
      } catch (err) { console.error("Dashboard Fetch Error:", err); }
    };
    fetchData();
  }, [user, studioProjects, profile]);

  if (authLoading) return <LoadingState />;

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    const { data, error } = await supabase.from("spaces")
      .insert({ user_id: user.id, name: newSpaceName, description: newSpaceDesc })
      .select().single();
    
    if (error) { toast.error("Error creating space"); return; }
    toast.success("Espacio creado");
    setIsCreatingSpace(false);
    navigate("/formarketing?spaceId=" + data.id);
  };

  const handleDuplicate = async (e: React.MouseEvent, project: DashboardProject) => {
    e.stopPropagation();
    if (project.type === 'code') {
      const newProj = await duplicateProject(project as any);
      if (newProj) setSpaces(prev => [{ ...newProj, type: 'code', thumbnail_url: null } as DashboardProject, ...prev]);
    } else {
      const { data, error } = await supabase.from("spaces")
        .insert({ user_id: user?.id, name: `${project.name} (Copia)`, description: project.description })
        .select().single();
      if (error) { toast.error("Error al duplicar"); return; }
      setSpaces(prev => [{ ...data, type: 'flow' }, ...prev]);
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: DashboardProject) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
    if (project.type === 'code') { await deleteStudioProject(project.id); } 
    else { await supabase.from("spaces").delete().eq("id", project.id); }
    setSpaces(prev => prev.filter(p => p.id !== project.id));
    toast.success("Proyecto eliminado");
  };

  const handleMapBlueprint = async () => {
    if (!openingProject) return;
    try {
      const blueprintFile = openingProject.files?.['blueprint.json'];
      if (!blueprintFile) throw new Error("No blueprint found");
      const blueprint = JSON.parse(blueprintFile.content);
      const { data: space, error: spaceErr } = await supabase.from('spaces').insert({
        name: `🗺️ Map: ${openingProject.name}`,
        user_id: user?.id,
        settings: { genesis_project_id: openingProject.id }
      }).select().single();
      if (spaceErr || !space) throw spaceErr;
      const { nodes, edges } = genesisOrchestrator.mapBlueprintToCanvasNodes(blueprint, space.id, user?.id || '');
      
      // Fix type mismatches for data_payload by casting to any
      await supabase.from('canvas_nodes').insert(nodes as any);
      await supabase.from('canvas_nodes').insert({
        space_id: space.id,
        user_id: user?.id || '',
        type: 'flow_metadata',
        data_payload: { edges } as any,
        prompt: 'metadata',
        status: 'completed'
      } as any);
      
      toast.success("Mapa generado");
      navigate(`/formarketing?spaceId=${space.id}`);
      setOpeningProject(null);
    } catch (err) { console.error(err); toast.error("Error al mapear"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{"Dashboard | Creator IA Pro"}</title></Helmet>
      
      <main className="max-w-[1440px] mx-auto px-6 pt-6 pb-20 space-y-8">
        {/* Header & Notifications */}
        <section className="space-y-6">
          {(checkoutSuccess || creditsSuccess) && (
            <CheckoutBanner 
              checkoutSuccess={checkoutSuccess} 
              creditsSuccess={creditsSuccess} 
              balance={profile?.credits_balance ?? 0}
              onAction={() => navigate('/chat')}
            />
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Sistema Activo</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Hola, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Creator'}</span>
            </h1>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Créditos" value={profile?.credits_balance ?? 0} icon={Coins} colorClass="text-primary" />
          <StatCard label="Plan" value={TIER_LABELS[currentTier] || "Gratis"} icon={CreditCard} colorClass="text-primary" />
          <StatCard label="Espacios" value={spacesCount} icon={LayoutGrid} colorClass="text-rose-400" />
          <StatCard label="Activos" value={assetsCount} icon={Image} colorClass="text-emerald-400" />
        </section>

        {/* Analytics Section */}
        <ChartSection usageData={usageData} toolData={toolData} />

        {/* Quick Tools */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Zap, label: "Genesis IDE", desc: "BuilderAI", path: "/studio" },
            { icon: Megaphone, label: "Canvas IA", desc: "Lienzo", path: "/formarketing" },
            { icon: PenTool, label: "Studio", desc: "Herramientas", path: "/tools" },
            { icon: MessageSquare, label: "Chat IA", desc: "Copy", path: "/chat" },
            { icon: Hash, label: "Hub", desc: "Templates", path: "/hub" },
            { icon: FileText, label: "Espacios", desc: "Archivos", path: "/spaces" },
          ].map((app) => (
            <button key={app.label} onClick={() => navigate(app.path)} className="p-5 bg-white border border-zinc-200 rounded-2xl text-left hover:border-primary transition-all group">
              <div className={"w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-all"}>
                <app.icon className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-black text-zinc-900">{app.label}</p>
              <p className="text-[9px] text-zinc-400 uppercase mt-1">{app.desc}</p>
            </button>
          ))}
        </section>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">Mis Proyectos</h2>
            <button onClick={() => setIsCreatingSpace(true)} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200">
              + Nuevo Proyecto
            </button>
          </div>
          
          {spaces.length === 0 ? (
            <div className={"p-20 border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-center bg-zinc-50/50"}>
              <FolderPlus className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Crea tu primer espacio para comenzar</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {spaces.map((space) => (
                <ProjectCard 
                  key={space.id} 
                  project={space as any} 
                  onDuplicate={(e) => handleDuplicate(e, space)} 
                  onDelete={(e) => handleDelete(e, space)}
                  onClick={() => {
                    if (space.type === 'code') navigate(`/studio?project=${space.id}`);
                    else navigate(`/formarketing?spaceId=${space.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Dialogs */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="rounded-[2rem] border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nuevo Espacio de Trabajo</DialogTitle>
            <DialogDescription>Asigna un nombre a tu nuevo lienzo estratégico.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nombre</Label>
              <Input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="Campaña 2025" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descripción</Label>
              <Input value={newSpaceDesc} onChange={e => setNewSpaceDesc(e.target.value)} placeholder="Opcional..." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setIsCreatingSpace(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cancelar</button>
            <button onClick={handleCreateSpace} className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Crear Espacio</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openingProject} onOpenChange={open => !open && setOpeningProject(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-[2.5rem] border-zinc-200">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{openingProject?.name}</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Genesis Studio Project</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate(`/studio?project=${openingProject?.id}`)} className="flex flex-col items-center gap-3 p-6 border border-zinc-100 bg-zinc-50 rounded-2xl hover:border-primary hover:bg-white transition-all group">
                <Brain className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Genesis Studio</span>
              </button>
              <button onClick={() => navigate(`/code?project=${openingProject?.id}`)} className="flex flex-col items-center gap-3 p-6 border border-zinc-100 bg-zinc-50 rounded-2xl hover:border-emerald-500 hover:bg-white transition-all group">
                <Code2 className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Editor Pro</span>
              </button>
            </div>

            <button
               className="w-full flex items-center gap-4 p-5 border border-zinc-100 bg-zinc-50 rounded-2xl hover:border-primary hover:bg-white transition-all text-left"
               onClick={handleMapBlueprint}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                <Map className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">Mapa Estratégico</p>
                <p className="text-[10px] text-zinc-400">Generar visualización en el Canvas</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
