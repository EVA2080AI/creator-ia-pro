import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { listSpaces, createSpace, deleteSpace, type Space } from "@/lib/spaces";
import { listAssets } from "@/lib/assets";
import { listTransactions, weeklySpend, toolBreakdown } from "@/lib/transactions";
import { toast } from "sonner";
import {
  Zap, Coins, CreditCard, LayoutGrid, Image,
  Megaphone, FileText, FolderPlus, ListTodo
} from "lucide-react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useStudioProjects } from "@/hooks/useStudioProjects";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { CheckoutBanner } from "@/components/dashboard/CheckoutBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { WelcomeOnboarding } from "@/components/dashboard/WelcomeOnboarding";
import { hasSeenWelcomeOnboarding } from "@/lib/dashboard-onboarding";
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
  const [showWelcome, setShowWelcome] = useState(false);

  const [usageData, setUsageData] = useState<any[]>([]);
  const [toolData, setToolData] = useState<any[]>([]);
  const [spacesCount, setSpacesCount] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  const checkoutSuccess = searchParams.get("checkout") === "success";
  const creditsSuccess = searchParams.get("credits") === "success";
  const currentTier = profile?.subscription_tier || "free";

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      setDataError(false);
      try {
        const flowSpaces = await listSpaces();
        const formattedFlows: DashboardProject[] = flowSpaces.map((s: Space) => ({
          id: s.id, name: s.name, description: s.description, updated_at: s.updatedAt,
          created_at: s.createdAt, type: 'flow', thumbnail_url: s.thumbnailUrl, user_id: s.userId,
          settings: s.settings,
        }));
        const formattedCode: DashboardProject[] = (studioProjects || []).map((p: any) => ({ ...p, type: 'code', thumbnail_url: null }));

        const allProjects = [...formattedCode, ...formattedFlows].sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        setSpaces(allProjects);
        setSpacesCount(flowSpaces.length);
        if (allProjects.length === 0 && !hasSeenWelcomeOnboarding()) {
          setShowWelcome(true);
        }

        const { total } = await listAssets({ limit: 1 });
        setAssetsCount(total);

        const transactions = await listTransactions();
        setUsageData(weeklySpend(transactions));
        setToolData(toolBreakdown(transactions));
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setDataError(true);
        toast.error("No se pudo cargar tu panel. Intenta recargar la página.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [user, studioProjects, profile]);

  if (authLoading || dataLoading) return <LoadingState />;

  if (dataError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm font-semibold text-stone-600">No se pudo cargar tu panel.</p>
        <p className="text-xs text-stone-400">Revisa tu conexión e intenta de nuevo.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    const space = await createSpace({ name: newSpaceName, description: newSpaceDesc });
    if (!space) { toast.error("Error al crear el espacio"); return; }
    toast.success("Espacio creado");
    setIsCreatingSpace(false);
    navigate("/studio-flow?spaceId=" + space.id);
  };

  const handleDuplicate = async (e: React.MouseEvent, project: DashboardProject) => {
    e.stopPropagation();
    if (project.type === 'code') {
      const newProj = await duplicateProject(project as any);
      if (newProj) setSpaces(prev => [{ ...newProj, type: 'code', thumbnail_url: null } as DashboardProject, ...prev]);
    } else {
      const space = await createSpace({ name: `${project.name} (Copia)`, description: project.description ?? undefined });
      if (!space) { toast.error("Error al duplicar"); return; }
      setSpaces(prev => [{
        id: space.id, name: space.name, description: space.description, updated_at: space.updatedAt,
        created_at: space.createdAt, type: 'flow', thumbnail_url: space.thumbnailUrl, user_id: space.userId,
      }, ...prev]);
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: DashboardProject) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
    if (project.type === 'code') { await deleteStudioProject(project.id); }
    else { await deleteSpace(project.id); }
    setSpaces(prev => prev.filter(p => p.id !== project.id));
    toast.success("Proyecto eliminado");
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
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Sistema Activo</span>
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
            { icon: Zap, label: "Basalt IA", desc: "Apps + Herramientas", path: "/chat" },
            { icon: Megaphone, label: "Canvas IA", desc: "Lienzo", path: "/studio-flow" },
            { icon: ListTodo, label: "Tareas", desc: "Kanban", path: "/tareas" },
            { icon: FileText, label: "Espacios", desc: "Archivos", path: "/spaces" },
          ].map((app) => (
            <button key={app.label} onClick={() => navigate(app.path)} className="p-5 bg-white border border-stone-200 rounded-2xl text-left hover:border-primary transition-all group">
              <div className={"w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-all"}>
                <app.icon className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-black text-stone-900">{app.label}</p>
              <p className="text-[9px] text-stone-400 uppercase mt-1">{app.desc}</p>
            </button>
          ))}
        </section>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500">Mis Proyectos</h2>
            <button onClick={() => setIsCreatingSpace(true)} className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg shadow-stone-200">
              + Nuevo Proyecto
            </button>
          </div>
          
          {spaces.length === 0 ? (
            <div className={"p-20 border-2 border-dashed border-stone-200 rounded-[2.5rem] text-center bg-stone-50/50"}>
              <FolderPlus className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">Crea tu primer espacio para comenzar</p>
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
                    if (space.type === 'code') navigate(`/chat?project=${space.id}`);
                    else navigate(`/studio-flow?spaceId=${space.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showWelcome && <WelcomeOnboarding onDismiss={() => setShowWelcome(false)} />}

      {/* Dialogs */}
      <Dialog open={isCreatingSpace} onOpenChange={setIsCreatingSpace}>
        <DialogContent className="rounded-[2rem] border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nuevo Espacio de Trabajo</DialogTitle>
            <DialogDescription>Asigna un nombre a tu nuevo lienzo estratégico.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nombre</Label>
              <Input value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} placeholder="Campaña 2025" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Descripción</Label>
              <Input value={newSpaceDesc} onChange={e => setNewSpaceDesc(e.target.value)} placeholder="Opcional..." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setIsCreatingSpace(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Cancelar</button>
            <button onClick={handleCreateSpace} className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Crear Espacio</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
