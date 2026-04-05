import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { 
  Shield, Users, Loader2, Zap, Settings, 
  BarChart2, Activity, Rocket, Image, Video, 
  Code2, FileText, Globe, DollarSign, LogOut,
  ChevronRight, LayoutDashboard, Database
} from "lucide-react";
import { AdminUser } from "./admin/types";
import { CreditModal } from "./admin/components/CreditModal";
import { AdminLoginGate } from "./admin/components/AdminLoginGate";
import { AdminBootstrap } from "./admin/components/AdminBootstrap";
import { UsersTab } from "./admin/tabs/UsersTab";
import { RolesTab } from "./admin/tabs/RolesTab";
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { SettingsTab } from "./admin/tabs/SettingsTab";
import { useAdminData, useAdminAnalytics } from "./admin/hooks/useAdminData";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"users" | "roles" | "analytics" | "overview" | "settings">("users");
  const [creditModalUser, setCreditModalUser] = useState<AdminUser | null>(null);

  const { users, loadingUsers, fetchUsers } = useAdminData(!!isAdmin);
  const { data: analyticsData, loading: loadingAnalytics } = useAdminAnalytics(!!isAdmin, activeTab);

  // Sync tab from URL query param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    if (tab === "usuarios") setActiveTab("users");
    else if (tab === "roles") setActiveTab("roles");
    else if (tab === "analytics") setActiveTab("analytics");
    else if (tab === "config") setActiveTab("settings");
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const searchParams = new URLSearchParams(window.location.search);
    const tabMap = { users: "usuarios", roles: "roles", analytics: "analytics", settings: "config", overview: "overview" };
    searchParams.set("tab", tabMap[tab]);
    window.history.replaceState(null, "", `${window.location.pathname}?${searchParams.toString()}`);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  // Email allowlist — only the platform owner
  const ADMIN_EMAILS = ['sebastian689@gmail.com'];
  if (!isAdmin && !ADMIN_EMAILS.includes(user.email ?? '')) {
    return <AdminBootstrap user={user} onSuccess={() => window.location.reload()} />;
  }

  const routes = [
    { path: "/", desc: "Landing pública" },
    { path: "/auth", desc: "Login / registro" },
    { path: "/dashboard", desc: "Panel del usuario" },
    { path: "/chat", desc: "Genesis — BuilderAI IDE" },
    { path: "/studio", desc: "Studio creativo" },
    { path: "/spaces", desc: "Mis espacios (Google Drive)" },
    { path: "/formarketing", desc: "Canvas IA (ReactFlow)" },
    { path: "/hub", desc: "Plantillas y templates" },
    { path: "/tools", desc: "Herramientas IA" },
    { path: "/assets", desc: "Biblioteca de activos" },
    { path: "/pricing", desc: "Planes y precios" },
    { path: "/profile", desc: "Perfil de usuario" },
    { path: "/admin", desc: "Panel administrativo" },
    { path: "/system-status", desc: "Estado del sistema" },
    { path: "/reset-password", desc: "Recuperar contraseña" },
    { path: "/descargar", desc: "Descargar app" },
    { path: "/herramienta/:slug", desc: "Landing de herramienta" },
    { path: "/sharescreen", desc: "Compartir pantalla" },
  ];

  const tables = [
    { name: "profiles", desc: "Datos de usuario, créditos y plan", rows: users.length },
    { name: "transactions", desc: "Registro de débitos y créditos", rows: null },
    { name: "user_roles", desc: "Roles (admin / moderator / user)", rows: null },
    { name: "spaces", desc: "Proyectos del usuario", rows: null },
    { name: "saved_assets", desc: "Biblioteca personal de assets", rows: null },
    { name: "canvas_nodes", desc: "Nodos del lienzo ForMarketing", rows: null },
    { name: "studio_projects", desc: "Proyectos BuilderAI (Genesis)", rows: null },
    { name: "studio_conversations", desc: "Conversaciones del IDE", rows: null },
    { name: "studio_messages", desc: "Mensajes del chat de Studio", rows: null },
    { name: "github_connections", desc: "Repos conectados de GitHub", rows: null },
  ];

  const edgeFunctions = [
    { name: "ai-proxy", desc: "Texto e imagen IA (OpenRouter)", icon: Zap, color: "#A855F7" },
    { name: "media-proxy", desc: "Edición de imagen (Replicate)", icon: Image, color: "#60A5FA" },
    { name: "video-gen", desc: "Video (Replicate)", icon: Video, color: "#F59E0B" },
    { name: "studio-generate", desc: "BuilderAI coding", icon: Code2, color: "#A855F7" },
    { name: "bold-webhook", desc: "Pagos Bold.co", icon: Shield, color: "#F59E0B" },
    { name: "admin-settings", desc: "Settings platform", icon: Settings, color: "#6B7280" },
  ];

  const TABS = [
    { id: "users", label: "Usuarios", icon: Users },
    { id: "roles", label: "Seguridad", icon: Shield },
    { id: "analytics", label: "Métricas", icon: BarChart2 },
    { id: "settings", label: "Infraestructura", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <Helmet>
        <title>Admin Panel | Platform Operations</title>
      </Helmet>

      {/* ── Navbar ── */}
      <header className="h-[60px] border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-zinc-900 tracking-tight leading-none uppercase">Ecosistema Creator</h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Operaciones Industriales</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-6 mr-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Estado Núcleo</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600">Sistemas Operativos</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="h-9 px-4 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all flex items-center gap-2 text-xs font-bold"
          >
            Cerrar Sesión
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full p-4 md:p-8 gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-[260px] space-y-1">
          <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Módulos de Gestión</p>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                  active 
                    ? "bg-white border-zinc-200 shadow-sm text-zinc-900 border" 
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                {tab.label}
                {active && <ChevronRight className="ml-auto h-4 w-4 text-zinc-300" />}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-transparent rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "users" && (
              <UsersTab 
                users={users} 
                onRefresh={fetchUsers} 
                onManageCredits={setCreditModalUser} 
              />
            )}
            {activeTab === "roles" && (
              <RolesTab 
                users={users} 
                currentUserEmail={user.email!} 
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab 
                data={analyticsData} 
                loading={loadingAnalytics} 
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab 
                routes={routes} 
                tables={tables} 
                edgeFunctions={edgeFunctions} 
              />
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {creditModalUser && (
        <CreditModal
          user={creditModalUser}
          onClose={() => setCreditModalUser(null)}
          onDone={() => {
            setCreditModalUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default Admin;
