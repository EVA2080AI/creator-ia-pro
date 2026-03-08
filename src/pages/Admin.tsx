import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Users,
  Search,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Ban,
  CheckCircle,
  KeyRound,
  Coins,
  LayoutDashboard,
  Database,
  Zap,
} from "lucide-react";

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in: string | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth("/auth");
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "overview" | "db">("users");

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      toast.error("Error cargando usuarios");
    } else {
      setUsers((data as AdminUser[]) || []);
    }
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin) {
      toast.error("Acceso denegado");
      navigate("/canvas");
    }
  }, [authLoading, adminLoading, isAdmin, navigate]);

  const handleSuspend = async (targetUserId: string, activate: boolean) => {
    setActionLoading(targetUserId);
    const { error } = await supabase.rpc("admin_set_user_status", {
      _target_user_id: targetUserId,
      _active: activate,
    });
    if (error) toast.error(error.message);
    else toast.success(activate ? "Cuenta activada" : "Cuenta suspendida");
    await fetchUsers();
    setActionLoading(null);
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Email de recuperación enviado a ${email}`);
    setActionLoading(null);
  };

  const handleUpdateCredits = async (targetUserId: string, newBalance: number) => {
    setActionLoading(targetUserId + "-credits");
    const { error } = await supabase.rpc("admin_update_credits", {
      _target_user_id: targetUserId,
      _new_balance: newBalance,
    });
    if (error) toast.error(error.message);
    else toast.success("Créditos actualizados");
    await fetchUsers();
    setActionLoading(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const routes = [
    { path: "/", label: "Landing", status: "live" },
    { path: "/auth", label: "Autenticación", status: "live" },
    { path: "/canvas", label: "Canvas IA", status: "live" },
    { path: "/pricing", label: "Precios", status: "live" },
    { path: "/spaces", label: "Spaces Explorer", status: "live" },
    { path: "/assets", label: "Asset Library", status: "live" },
    { path: "/admin", label: "Admin Dashboard", status: "live" },
  ];

  const tables = [
    { name: "profiles", desc: "Datos de usuario y créditos" },
    { name: "canvas_nodes", desc: "Nodos del lienzo con estado y assets" },
    { name: "transactions", desc: "Registro de débitos y créditos" },
    { name: "user_roles", desc: "Roles de usuario (admin/moderator/user)" },
    { name: "spaces", desc: "Proyectos organizados del usuario" },
    { name: "saved_assets", desc: "Biblioteca personal de assets" },
  ];

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/canvas")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Admin
          </Badge>
        </div>
      </header>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {[
            { key: "users" as const, icon: Users, label: "Usuarios" },
            { key: "overview" as const, icon: LayoutDashboard, label: "Rutas" },
            { key: "db" as const, icon: Database, label: "Base de Datos" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-card border-border pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchUsers} className="border-border">
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card node-shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Nombre</TableHead>
                    <TableHead className="text-muted-foreground">Créditos</TableHead>
                    <TableHead className="text-muted-foreground">Registro</TableHead>
                    <TableHead className="text-muted-foreground">Último Login</TableHead>
                    <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin-slow text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.user_id} className="border-border">
                        <TableCell className="font-mono text-sm text-foreground">{u.email}</TableCell>
                        <TableCell className="text-foreground">{u.display_name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                u.credits_balance > 0
                                  ? "border-success/30 text-success"
                                  : "border-destructive/30 text-destructive"
                              }
                            >
                              {u.credits_balance}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={actionLoading === u.user_id + "-credits"}
                              onClick={() => {
                                const val = prompt("Nuevo balance de créditos:", String(u.credits_balance));
                                if (val !== null) handleUpdateCredits(u.user_id, parseInt(val) || 0);
                              }}
                            >
                              <Coins className="h-3.5 w-3.5 text-gold" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {u.last_sign_in
                            ? new Date(u.last_sign_in).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === u.email}
                              onClick={() => handleResetPassword(u.email)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {actionLoading === u.email ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1.5 hidden lg:inline">Reset</span>
                            </Button>
                            {u.credits_balance > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === u.user_id}
                                onClick={() => handleSuspend(u.user_id, false)}
                                className="text-destructive hover:text-destructive"
                              >
                                {actionLoading === u.user_id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Ban className="h-3.5 w-3.5" />
                                )}
                                <span className="ml-1.5 hidden lg:inline">Suspender</span>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === u.user_id}
                                onClick={() => handleSuspend(u.user_id, true)}
                                className="text-success hover:text-success"
                              >
                                {actionLoading === u.user_id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                <span className="ml-1.5 hidden lg:inline">Activar</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Total: {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Routes Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Rutas del Frontend</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((r) => (
                <div
                  key={r.path}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 node-shadow"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">{r.path}</p>
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                  </div>
                  <Badge variant="outline" className="border-success/30 text-success">
                    <Zap className="mr-1 h-3 w-3" />
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === "db" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Esquema de Base de Datos</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-border bg-card p-4 node-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-primary" />
                    <p className="font-mono text-sm font-semibold text-foreground">{t.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
