import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Users, Search, Loader2, RefreshCw,
  Ban, CheckCircle, KeyRound, Coins, LayoutDashboard,
  Database, Zap, Settings, Eye, EyeOff, Save, Crown,
  GraduationCap, Building2,
} from "lucide-react";

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in: string | null;
  subscription_tier: string;
}

const tierConfig: Record<string, { label: string; icon: typeof Zap; className: string }> = {
  free: { label: "Free", icon: Zap, className: "border-border text-muted-foreground" },
  pro: { label: "Pro", icon: Crown, className: "border-primary/30 text-primary" },
  education: { label: "Educación", icon: GraduationCap, className: "border-accent/30 text-accent" },
  business: { label: "Business", icon: Building2, className: "border-gold/30 text-gold" },
};

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "overview" | "db" | "settings">("users");

  const [stripeKey, setStripeKey] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error("Error cargando usuarios");
    else setUsers((data as AdminUser[]) || []);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin) {
      toast.error("Acceso denegado");
      navigate("/dashboard");
    }
  }, [authLoading, adminLoading, isAdmin, navigate]);

  const handleSuspend = async (targetUserId: string, activate: boolean) => {
    setActionLoading(targetUserId);
    const { error } = await supabase.rpc("admin_set_user_status", {
      _target_user_id: targetUserId, _active: activate,
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
      _target_user_id: targetUserId, _new_balance: newBalance,
    });
    if (error) toast.error(error.message);
    else toast.success("Créditos actualizados");
    await fetchUsers();
    setActionLoading(null);
  };

  const handleChangeTier = async (targetUserId: string, newTier: string) => {
    setActionLoading(targetUserId + "-tier");
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: newTier } as any)
      .eq("user_id", targetUserId);
    if (error) toast.error(error.message);
    else toast.success(`Plan cambiado a ${tierConfig[newTier]?.label || newTier}`);
    await fetchUsers();
    setActionLoading(null);
  };

  const handleSaveStripeKey = async () => {
    if (!stripeKey.trim()) {
      toast.error("Ingresa una clave de Stripe válida");
      return;
    }
    setSavingSettings(true);
    try {
      const { error } = await supabase.functions.invoke("admin-save-settings", {
        body: { key: "STRIPE_SECRET_KEY", value: stripeKey },
      });
      if (error) throw error;
      toast.success("Clave de Stripe guardada correctamente");
      setStripeKey("");
    } catch (err: any) {
      toast.error(err.message || "Error guardando la configuración");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const tierCounts = users.reduce((acc, u) => {
    acc[u.subscription_tier] = (acc[u.subscription_tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const routes = [
    { path: "/", label: "Landing", status: "live" },
    { path: "/auth", label: "Autenticación", status: "live" },
    { path: "/dashboard", label: "Dashboard", status: "live" },
    { path: "/tools", label: "Herramientas IA", status: "live" },
    { path: "/canvas", label: "Formaketing Studio", status: "live" },
    { path: "/pricing", label: "Precios", status: "live" },
    { path: "/spaces", label: "Espacios", status: "live" },
    { path: "/assets", label: "Biblioteca Assets", status: "live" },
    { path: "/admin", label: "Admin Dashboard", status: "live" },
    { path: "/reset-password", label: "Reset Password", status: "live" },
    { path: "/descargar", label: "Descargar App", status: "live" },
    { path: "/herramienta/:slug", label: "Landings de Herramientas", status: "live" },
  ];

  const tables = [
    { name: "profiles", desc: "Datos de usuario, créditos y plan de suscripción" },
    { name: "canvas_nodes", desc: "Nodos del lienzo con estado y assets" },
    { name: "transactions", desc: "Registro de débitos y créditos" },
    { name: "user_roles", desc: "Roles de usuario (admin/moderator/user)" },
    { name: "spaces", desc: "Proyectos organizados del usuario" },
    { name: "saved_assets", desc: "Biblioteca personal de assets" },
  ];

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            <span className="gradient-text">Creator IA</span> Admin
          </h1>
          <Badge variant="outline" className="border-primary/30 text-primary ml-2">Admin</Badge>
        </div>

        {/* Plan distribution summary */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(tierConfig).map(([key, cfg]) => {
            const TierIcon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 node-shadow">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${key === 'free' ? 'bg-muted' : key === 'pro' ? 'bg-primary/10' : key === 'education' ? 'bg-accent/10' : 'bg-gold/10'}`}>
                  <TierIcon className={`h-4 w-4 ${key === 'free' ? 'text-muted-foreground' : key === 'pro' ? 'text-primary' : key === 'education' ? 'text-accent' : 'text-gold'}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground font-mono">{tierCounts[key] || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {[
            { key: "users" as const, icon: Users, label: "Usuarios" },
            { key: "overview" as const, icon: LayoutDashboard, label: "Rutas" },
            { key: "db" as const, icon: Database, label: "Base de Datos" },
            { key: "settings" as const, icon: Settings, label: "Configuración" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por email o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-card border-border pl-10" />
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
                    <TableHead className="text-muted-foreground">Plan</TableHead>
                    <TableHead className="text-muted-foreground">Créditos</TableHead>
                    <TableHead className="text-muted-foreground">Registro</TableHead>
                    <TableHead className="text-muted-foreground">Último Login</TableHead>
                    <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const tier = tierConfig[u.subscription_tier] || tierConfig.free;
                      const TierIcon = tier.icon;
                      return (
                        <TableRow key={u.user_id} className="border-border">
                          <TableCell className="font-mono text-sm text-foreground">{u.email}</TableCell>
                          <TableCell className="text-foreground">{u.display_name || "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={u.subscription_tier || "free"}
                              onValueChange={(val) => handleChangeTier(u.user_id, val)}
                              disabled={actionLoading === u.user_id + "-tier"}
                            >
                              <SelectTrigger className="h-7 w-[120px] border-border text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">
                                  <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Free</span>
                                </SelectItem>
                                <SelectItem value="pro">
                                  <span className="flex items-center gap-1.5"><Crown className="h-3 w-3 text-primary" /> Pro</span>
                                </SelectItem>
                                <SelectItem value="education">
                                  <span className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3 text-accent" /> Educación</span>
                                </SelectItem>
                                <SelectItem value="business">
                                  <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-gold" /> Business</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={u.credits_balance > 0 ? "border-accent/30 text-accent" : "border-destructive/30 text-destructive"}>
                                {u.credits_balance}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actionLoading === u.user_id + "-credits"}
                                onClick={() => {
                                  const val = prompt("Nuevo balance de créditos:", String(u.credits_balance));
                                  if (val !== null) handleUpdateCredits(u.user_id, parseInt(val) || 0);
                                }}>
                                <Coins className="h-3.5 w-3.5 text-gold" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" disabled={actionLoading === u.email} onClick={() => handleResetPassword(u.email)} className="text-muted-foreground hover:text-foreground">
                                {actionLoading === u.email ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                                <span className="ml-1.5 hidden lg:inline">Reset</span>
                              </Button>
                              {u.credits_balance > 0 ? (
                                <Button variant="ghost" size="sm" disabled={actionLoading === u.user_id} onClick={() => handleSuspend(u.user_id, false)} className="text-destructive hover:text-destructive">
                                  {actionLoading === u.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                                  <span className="ml-1.5 hidden lg:inline">Suspender</span>
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" disabled={actionLoading === u.user_id} onClick={() => handleSuspend(u.user_id, true)} className="text-accent hover:text-accent">
                                  {actionLoading === u.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                  <span className="ml-1.5 hidden lg:inline">Activar</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">Total: {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""}</p>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Rutas del Frontend</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((r) => (
                <div key={r.path} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 node-shadow">
                  <div>
                    <p className="font-mono text-sm text-foreground">{r.path}</p>
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                  </div>
                  <Badge variant="outline" className="border-accent/30 text-accent">
                    <Zap className="mr-1 h-3 w-3" />{r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "db" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Esquema de Base de Datos</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((t) => (
                <div key={t.name} className="rounded-xl border border-border bg-card p-4 node-shadow">
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

        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-foreground">Configuración de Plataforma</h2>

            <div className="rounded-xl border border-border bg-card p-6 node-shadow space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Stripe — Pasarela de Pagos</h3>
                  <p className="text-xs text-muted-foreground">Configura tu clave secreta de Stripe para habilitar pagos.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Stripe Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showStripeKey ? "text" : "password"}
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    placeholder="sk_live_..."
                    className="bg-muted border-border pr-10"
                  />
                  <button type="button" onClick={() => setShowStripeKey(!showStripeKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/70">
                  La clave se almacena de forma segura y solo es accesible desde funciones backend.
                </p>
              </div>

              <Button onClick={handleSaveStripeKey} disabled={savingSettings || !stripeKey.trim()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Clave
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 node-shadow space-y-3">
              <h3 className="font-semibold text-foreground">Información de Plataforma</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plataforma</span>
                  <span className="text-foreground font-medium">Creator IA Pro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rutas activas</span>
                  <span className="text-foreground font-medium">{routes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tablas DB</span>
                  <span className="text-foreground font-medium">{tables.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuarios totales</span>
                  <span className="text-foreground font-medium">{users.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
