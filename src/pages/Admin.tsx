import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Logo } from "@/components/Logo";
import {
  Shield, Users, Loader2, Zap, Settings,
  BarChart2, Activity, Rocket, Image, Video,
  Code2, FileText, Globe, DollarSign, LogOut,
  ChevronRight, LayoutDashboard, Database, KeyRound, Ticket,
  ListTodo, Server, FileSignature
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
import { AcuerdosTab } from "./admin/tabs/AcuerdosTab";
import { useAdminData, useAdminAnalytics, useAdminFinance } from "./admin/hooks/useAdminData";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"users" | "roles" | "analytics" | "finance" | "overview" | "settings" | "credentials" | "tickets" | "acuerdos">("users");
  const [creditModalUser, setCreditModalUser] = useState<AdminUser | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // En móvil la barra de tabs es horizontal con scroll: cuando el usuario toca
  // una tab fuera de vista, la mantenemos visible dentro del contenedor.
  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  const { users, loadingUsers, loadError, fetchUsers } = useAdminData(!!isAdmin);
  const { data: analyticsData, loading: loadingAnalytics, error: analyticsError, refresh: refreshAnalytics } = useAdminAnalytics(!!isAdmin, activeTab);
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
    else if (tab === "acuerdos") setActiveTab("acuerdos");
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const searchParams = new URLSearchParams(window.location.search);
    const tabMap = { users: "usuarios", roles: "roles", analytics: "analytics", finance: "finanzas", settings: "config", overview: "overview", credentials: "credenciales", tickets: "tickets", acuerdos: "acuerdos" };
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
    { name: "studio-generate", desc: "Generación de código (BuilderAI)", icon: Code2, color: "#A855F7" },
    { name: "bold-webhook", desc: "Pagos Bold.co", icon: Shield, color: "#F59E0B" },
    { name: "admin-settings", desc: "Ajustes de la plataforma", icon: Settings, color: "#6B7280" },
  ];

  const TABS = [
    { id: "users", label: "Usuarios", icon: Users },
    { id: "roles", label: "Seguridad", icon: Shield },
    { id: "analytics", label: "Métricas", icon: BarChart2 },
    { id: "finance", label: "Finanzas", icon: DollarSign },
    { id: "credentials", label: "Credenciales", icon: KeyRound },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "acuerdos", label: "Acuerdos", icon: FileSignature },
    { id: "settings", label: "Infraestructura", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Helmet>
        <title>Panel Admin | Creator IA Pro</title>
      </Helmet>

      {/* ── Navbar ── */}
      <header className="h-[60px] border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Sin AppLayout (y sin sidebar global) el logo es la salida de vuelta
            a la app, en desktop y en móvil. */}
        <Link to="/a/basalt" title="Volver a la app" className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="h-4 w-px bg-border" aria-hidden />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Admin</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Accesos directos a /product-backlog (tickets) y /system-status (estado real
              de servicios externos): viven como pantallas separadas pero el admin es el
              lugar donde el super-admin espera verlo todo (pedido 2026-10-10). En móvil
              solo el icono (cuadrado 9x9), con texto desde md+. */}
          <div className="flex items-center gap-1 md:gap-2 md:mr-2">
            <Link
              to="/product-backlog"
              aria-label="Backlog"
              title="Backlog"
              className="h-9 w-9 md:w-auto md:px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all inline-flex items-center justify-center md:justify-start gap-2 text-xs font-bold"
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Backlog</span>
            </Link>
            <Link
              to="/system-status"
              aria-label="Estado del sistema"
              title="Estado del sistema"
              className="h-9 w-9 md:w-auto md:px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all inline-flex items-center justify-center md:justify-start gap-2 text-xs font-bold"
            >
              <Server className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Estado</span>
            </Link>
          </div>
          <button
            onClick={() => signOut()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="h-9 w-9 md:w-auto md:px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center md:justify-start gap-2 text-xs font-bold"
          >
            <span className="hidden md:inline">Cerrar Sesión</span>
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full p-4 md:p-8 gap-4 md:gap-8">
        {/* Sidebar Navigation — vertical en desktop, tira horizontal scrolleable en móvil */}
        <aside ref={navRef} className="w-full md:w-[260px] md:space-y-1 md:block flex gap-2 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <p className="hidden md:block px-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Módulos de Gestión</p>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all group whitespace-nowrap",
                  active
                    ? "bg-card border-border shadow-sm text-foreground border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                <div className={cn(
                  "h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg flex items-center justify-center transition-all shrink-0",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-accent"
                )}>
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </div>
                {tab.label}
                {active && <ChevronRight className="hidden md:block ml-auto h-4 w-4 text-muted-foreground" />}
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
                loading={loadingUsers}
                loadError={loadError}
                onRefresh={fetchUsers} 
                onManageCredits={setCreditModalUser} 
              />
            )}
            {activeTab === "roles" && (
              <RolesTab
                users={users}
                loading={loadingUsers}
                loadError={loadError}
                currentUserEmail={user.email!}
                onRefresh={fetchUsers}
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab
                data={analyticsData}
                loading={loadingAnalytics}
                error={analyticsError}
                onRetry={refreshAnalytics}
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
            {activeTab === "acuerdos" && (
              <AcuerdosTab />
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
