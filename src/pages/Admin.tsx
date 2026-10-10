import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Shield, Users, Loader2, Zap, Settings,
  BarChart2, Activity, Rocket, Image, Video,
  Code2, FileText, Globe, DollarSign, LogOut,
  ChevronRight, LayoutDashboard, Database, KeyRound, Ticket,
  ListTodo, Server
} from "lucide-react";
import { AdminUser } from "./admin/types";
import { CreditModal } from "./admin/components/CreditModal";
import { AdminBootstrap } from "./admin/components/AdminBootstrap";
import { UsersTab } from "./admin/tabs/UsersTab";
import { RolesTab } from "./admin/tabs/RolesTab";
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { FinanceTab } from "./admin/tabs/FinanceTab";
import { SettingsTab } from "./admin/tabs/SettingsTab";
import { CredentialsTab } from "./admin/tabs/CredentialsTab";
import { TicketsTab } from "./admin/tabs/TicketsTab";
import { useAdminData, useAdminAnalytics, useAdminFinance } from "./admin/hooks/useAdminData";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"users" | "roles" | "analytics" | "finance" | "overview" | "settings" | "credentials" | "tickets">("users");
  const [creditModalUser, setCreditModalUser] = useState<AdminUser | null>(null);

  const { users, loadingUsers, fetchUsers } = useAdminData(!!isAdmin);
  const { data: analyticsData, loading: loadingAnalytics } = useAdminAnalytics(!!isAdmin, activeTab);
  const { data: financeData, loading: loadingFinance, error: financeError } = useAdminFinance(!!isAdmin, activeTab);

  // Sync tab from URL query param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    if (tab === "usuarios") setActiveTab("users");
    else if (tab === "roles") setActiveTab("roles");
    else if (tab === "analytics") setActiveTab("analytics");
    else if (tab === "finanzas") setActiveTab("finance");
    else if (tab === "config") setActiveTab("settings");
    else if (tab === "credenciales") setActiveTab("credentials");
    else if (tab === "tickets") setActiveTab("tickets");
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const searchParams = new URLSearchParams(window.location.search);
    const tabMap = { users: "usuarios", roles: "roles", analytics: "analytics", finance: "finanzas", settings: "config", overview: "overview", credentials: "credenciales", tickets: "tickets" };
    searchParams.set("tab", tabMap[tab]);
    window.history.replaceState(null, "", `${window.location.pathname}?${searchParams.toString()}`);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    { path: "/a/basalt", desc: "Basalt — chat + constructor de apps/IDE + Herramientas, todo embebido" },
    { path: "/chat", desc: "Redirect legacy → /a/basalt" },
    { path: "/spaces", desc: "Mis espacios (Google Drive)" },
    { path: "/studio-flow", desc: "Canvas IA (ReactFlow)" },
    { path: "/hub", desc: "Plantillas y templates" },
    { path: "/tools", desc: "Redirect legacy → /a/basalt?panel=tools" },
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
    { name: "studio_projects", desc: "Proyectos BuilderAI (Basalt)", rows: null },
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
    { id: "finance", label: "Finanzas", icon: DollarSign },
    { id: "credentials", label: "Credenciales", icon: KeyRound },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "settings", label: "Infraestructura", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Helmet>
        <title>Admin Panel | Platform Operations</title>
      </Helmet>

      {/* ── Navbar ── */}
      <header className="h-[60px] border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/10">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground tracking-tight leading-none uppercase">Ecosistema Creator</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Operaciones Industriales</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Accesos directos a /product-backlog (tickets) y /system-status (estado real
              de servicios externos): viven como pantallas separadas pero el admin es el
              lugar donde el super-admin espera verlo todo (pedido 2026-10-10). */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Link
              to="/product-backlog"
              className="h-9 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all inline-flex items-center gap-2 text-xs font-bold"
            >
              <ListTodo className="h-3.5 w-3.5" />
              Backlog
            </Link>
            <Link
              to="/system-status"
              className="h-9 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all inline-flex items-center gap-2 text-xs font-bold"
            >
              <Server className="h-3.5 w-3.5" />
              Estado
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6 mr-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Estado Núcleo</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Sistemas Operativos</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-2 text-xs font-bold"
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
          <p className="px-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Módulos de Gestión</p>
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
                    ? "bg-card border-border shadow-sm text-foreground border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-accent"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                {tab.label}
                {active && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />}
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
                onRefresh={fetchUsers}
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab
                data={analyticsData}
                loading={loadingAnalytics}
              />
            )}
            {activeTab === "finance" && (
              <FinanceTab
                tiers={analyticsData?.tiers}
                loading={loadingAnalytics}
                finance={financeData}
                financeLoading={loadingFinance}
                financeError={financeError}
              />
            )}
            {activeTab === "credentials" && (
              <CredentialsTab />
            )}
            {activeTab === "tickets" && (
              <TicketsTab />
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
