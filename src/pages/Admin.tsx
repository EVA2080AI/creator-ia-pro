import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AppHeader } from "@/components/AppHeader";
import { adminService } from "@/services/billing-service";
import { toast } from "sonner";
import {
  Shield, Users, Search, Loader2, RefreshCw, Ban, CheckCircle,
  KeyRound, Coins, LayoutDashboard, Database, Zap, Settings,
  Eye, EyeOff, Save, Crown, GraduationCap, Building2, X,
  Plus, Minus, RotateCcw, History, ChevronDown, ChevronUp,
  TrendingUp, UserCheck, Star, Package,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in: string | null;
  subscription_tier: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TIERS: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  free:      { label: "Free",       color: "#6B7280", icon: Zap },
  starter:   { label: "Starter",    color: "#4ADE80", icon: Package },
  creator:   { label: "Creator",    color: "#A855F7", icon: Star },
  agency:    { label: "Agency",     color: "#F59E0B", icon: Building2 },
  educacion: { label: "Educación",  color: "#60A5FA", icon: GraduationCap },
  pro:       { label: "Pro",        color: "#EC4899", icon: Crown },
  business:  { label: "Business",   color: "#F59E0B", icon: Building2 },
};

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  admin_grant:  { label: "Carga Admin",   color: "#4ADE80" },
  admin_deduct: { label: "Deducción",     color: "#EF4444" },
  refund:       { label: "Reembolso",     color: "#60A5FA" },
  spend:        { label: "Uso",           color: "#F59E0B" },
  purchase:     { label: "Compra",        color: "#A855F7" },
};

// ─── Credit Modal ─────────────────────────────────────────────────────────────

function CreditModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<"add" | "deduct" | "refund" | "history">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setTxLoading(true);
    const { data, error } = await supabase.rpc("admin_get_transactions", {
      _target_user_id: user.user_id,
      _limit: 30,
    });
    if (!error) setTxs((data as Transaction[]) || []);
    setTxLoading(false);
  }, [user.user_id]);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  const runOp = async () => {
    const n = parseInt(amount);
    if (!n || n <= 0) { toast.error("Monto inválido"); return; }

    const fnMap = {
      add:    "admin_add_credits",
      deduct: "admin_deduct_credits",
      refund: "admin_refund_credits",
    } as const;

    const fn = fnMap[tab as keyof typeof fnMap];
    if (!fn) return;

    setLoading(true);
    const { data, error } = await supabase.rpc(fn, {
      _target_user_id: user.user_id,
      _amount: n,
      _reason: reason || undefined,
    });

    if (error) {
      toast.error(error.message);
    } else {
      const opLabels = { add: "Créditos agregados", deduct: "Créditos deducidos", refund: "Reembolso aplicado" };
      toast.success(`${opLabels[tab as keyof typeof opLabels]} · Nuevo balance: ${(data as number).toLocaleString()}`);
      setAmount("");
      setReason("");
      onDone();
    }
    setLoading(false);
  };

  const TABS = [
    { key: "add",     label: "Agregar",   icon: Plus,      color: "#4ADE80" },
    { key: "deduct",  label: "Deducir",   icon: Minus,     color: "#EF4444" },
    { key: "refund",  label: "Reembolso", icon: RotateCcw, color: "#60A5FA" },
    { key: "history", label: "Historial", icon: History,   color: "#A855F7" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c0f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <div>
            <p className="font-semibold text-white">{user.display_name || user.email}</p>
            <p className="text-xs text-white/40 font-mono">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-bold text-white font-mono">{user.credits_balance.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors"
                style={{ color: isActive ? t.color : "rgba(255,255,255,0.35)", borderBottom: isActive ? `2px solid ${t.color}` : "2px solid transparent" }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5">
          {tab !== "history" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-white/50">Créditos</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={tab === "add" ? "Ej: 50000" : "Ej: 1000"}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/50">
                  Razón {tab !== "refund" && <span className="text-white/25">(opcional)</span>}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tab === "refund" ? "Motivo del reembolso" : "Descripción (opcional)"}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <button
                onClick={runOp}
                disabled={loading || !amount}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: tab === "add" ? "#4ADE8015" : tab === "deduct" ? "#EF444415" : "#60A5FA15",
                  border: `1px solid ${tab === "add" ? "#4ADE8030" : tab === "deduct" ? "#EF444430" : "#60A5FA30"}`,
                  color: tab === "add" ? "#4ADE80" : tab === "deduct" ? "#EF4444" : "#60A5FA",
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {tab === "add" ? "Agregar créditos" : tab === "deduct" ? "Deducir créditos" : "Aplicar reembolso"}
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {txLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                </div>
              ) : txs.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/30">Sin transacciones</p>
              ) : (
                txs.map((tx) => {
                  const meta = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "#6B7280" };
                  return (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                      <div className="min-w-0">
                        <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: meta.color + "15", color: meta.color }}>
                          {meta.label}
                        </span>
                        {tx.description && (
                          <p className="mt-0.5 truncate text-xs text-white/40">{tx.description}</p>
                        )}
                        <p className="text-[10px] text-white/25">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <span className="ml-3 font-mono text-sm font-bold" style={{ color: tx.amount >= 0 ? "#4ADE80" : "#EF4444" }}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "overview" | "settings">("users");
  const [creditModalUser, setCreditModalUser] = useState<AdminUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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

  const handleChangeTier = async (targetUserId: string, newTier: string) => {
    setActionLoading(targetUserId + "-tier");
    const { error } = await supabase.rpc("admin_update_tier", {
      _target_user_id: targetUserId,
      _new_tier: newTier,
    });
    if (error) toast.error(error.message);
    else toast.success(`Plan → ${TIERS[newTier]?.label || newTier}`);
    await fetchUsers();
    setActionLoading(null);
  };

  const handleSuspend = async (targetUserId: string, activate: boolean) => {
    setActionLoading(targetUserId + "-suspend");
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
    setActionLoading(email + "-reset");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Email de recuperación enviado`);
    setActionLoading(null);
  };

  const handleSaveStripeKey = async () => {
    if (!stripeKey.trim()) { toast.error("Clave inválida"); return; }
    setSavingSettings(true);
    try {
      await adminService.saveSettings({ STRIPE_SECRET_KEY: stripeKey });
      toast.success("Clave de Stripe guardada");
      setStripeKey("");
    } catch (err: any) {
      toast.error(err.message || "Error guardando");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  // Stats
  const totalCredits = users.reduce((s, u) => s + (u.credits_balance || 0), 0);
  const tierCounts = users.reduce((acc, u) => {
    acc[u.subscription_tier] = (acc[u.subscription_tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const paidUsers = users.filter(u => !["free", "educacion"].includes(u.subscription_tier)).length;

  const routes = [
    "/", "/auth", "/dashboard", "/tools", "/formarketing", "/pricing",
    "/spaces", "/assets", "/admin", "/system-status", "/reset-password",
    "/descargar", "/herramienta/:slug", "/profile", "/hub", "/chat",
  ];

  const tables = [
    { name: "profiles",      desc: "Datos de usuario, créditos y plan" },
    { name: "transactions",  desc: "Registro de débitos y créditos" },
    { name: "user_roles",    desc: "Roles (admin / moderator / user)" },
    { name: "canvas_nodes",  desc: "Nodos del lienzo" },
    { name: "spaces",        desc: "Proyectos del usuario" },
    { name: "saved_assets",  desc: "Biblioteca personal de assets" },
  ];

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <Loader2 className="h-8 w-8 animate-spin text-[#A855F7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* Credit modal */}
      {creditModalUser && (
        <CreditModal
          user={creditModalUser}
          onClose={() => setCreditModalUser(null)}
          onDone={() => { fetchUsers(); }}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A855F7]/10">
            <Shield className="h-4.5 w-4.5 text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Panel Admin</h1>
            <p className="text-xs text-white/35">Creator IA Pro · Control total</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Usuarios", value: users.length, icon: Users, color: "#A855F7" },
            { label: "Pagos activos", value: paidUsers, icon: TrendingUp, color: "#4ADE80" },
            { label: "Créditos totales", value: totalCredits.toLocaleString(), icon: Coins, color: "#F59E0B" },
            { label: "Rutas activas", value: routes.length, icon: LayoutDashboard, color: "#60A5FA" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: s.color + "15" }}>
                  <Icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold text-white leading-none">{s.value}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tier breakdown */}
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(TIERS).map(([key, cfg]) => {
            const count = tierCounts[key] || 0;
            if (!count) return null;
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: cfg.color + "30", color: cfg.color, background: cfg.color + "0A" }}>
                <Icon className="h-3 w-3" />
                {cfg.label} · {count}
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
          {[
            { key: "users" as const,    icon: Users,          label: "Usuarios" },
            { key: "overview" as const, icon: LayoutDashboard, label: "Sistema" },
            { key: "settings" as const, icon: Settings,        label: "Config" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: isActive ? "#A855F7" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* ── Users tab ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                <input
                  placeholder="Buscar por email o nombre…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none focus:border-white/15 transition-colors"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* User cards */}
            {loadingUsers ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-white/30">Sin resultados</div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => {
                  const tier = TIERS[u.subscription_tier] || TIERS.free;
                  const TierIcon = tier.icon;
                  const isExpanded = expandedUser === u.user_id;
                  const isBusy = (key: string) => actionLoading === key;

                  return (
                    <div key={u.user_id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      {/* Row */}
                      <div className="flex items-center gap-3 p-4">
                        {/* Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ background: tier.color + "20", color: tier.color }}>
                          {(u.display_name || u.email)?.[0]?.toUpperCase() || "?"}
                        </div>

                        {/* Identity */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-white">{u.display_name || u.email}</span>
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{ background: tier.color + "15", color: tier.color }}>
                              <TierIcon className="h-2.5 w-2.5" />
                              {tier.label}
                            </span>
                          </div>
                          <p className="truncate text-xs text-white/35 font-mono">{u.email}</p>
                        </div>

                        {/* Credits badge */}
                        <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5">
                          <Coins className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-mono text-sm font-bold text-white">{u.credits_balance.toLocaleString()}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCreditModalUser(u)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors"
                            title="Gestionar créditos"
                          >
                            <Coins className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.05] bg-white/[0.01] p-4 space-y-4">
                          {/* Meta */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            <span className="text-white/35">Registro</span>
                            <span className="text-white/70">{new Date(u.created_at).toLocaleDateString()}</span>
                            <span className="text-white/35">Último login</span>
                            <span className="text-white/70">{u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : "—"}</span>
                            <span className="text-white/35">ID</span>
                            <span className="text-white/40 font-mono truncate">{u.user_id}</span>
                          </div>

                          {/* Change tier */}
                          <div>
                            <p className="mb-2 text-xs text-white/40">Cambiar plan</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(TIERS).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                const isActive = u.subscription_tier === key;
                                return (
                                  <button
                                    key={key}
                                    disabled={isActive || isBusy(u.user_id + "-tier")}
                                    onClick={() => handleChangeTier(u.user_id, key)}
                                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-default"
                                    style={{
                                      background: isActive ? cfg.color + "20" : "rgba(255,255,255,0.03)",
                                      border: `1px solid ${isActive ? cfg.color + "50" : "rgba(255,255,255,0.07)"}`,
                                      color: isActive ? cfg.color : "rgba(255,255,255,0.45)",
                                    }}
                                  >
                                    {isBusy(u.user_id + "-tier") ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Icon className="h-3 w-3" />
                                    )}
                                    {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              disabled={isBusy(u.email + "-reset")}
                              onClick={() => handleResetPassword(u.email)}
                              className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
                            >
                              {isBusy(u.email + "-reset") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                              Reset password
                            </button>
                            <button
                              disabled={isBusy(u.user_id + "-suspend")}
                              onClick={() => handleSuspend(u.user_id, false)}
                              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            >
                              {isBusy(u.user_id + "-suspend") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                              Suspender
                            </button>
                            <button
                              disabled={isBusy(u.user_id + "-suspend")}
                              onClick={() => handleSuspend(u.user_id, true)}
                              className="flex items-center gap-1.5 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40"
                            >
                              {isBusy(u.user_id + "-suspend") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                              Activar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-white/25">
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""}
              {search && ` · filtrado de ${users.length}`}
            </p>
          </div>
        )}

        {/* ── Overview tab ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white/60 uppercase tracking-widest">Rutas del Frontend</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <span className="font-mono text-sm text-white/70">{r}</span>
                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-bold text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      live
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold text-white/60 uppercase tracking-widest">Tablas de Base de Datos</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((t) => (
                  <div key={t.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-3.5 w-3.5 text-[#A855F7]" />
                      <span className="font-mono text-sm font-semibold text-white">{t.name}</span>
                    </div>
                    <p className="text-xs text-white/35">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <div className="max-w-xl space-y-4">
            {/* Stripe key */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635BFF]/15">
                  <Settings className="h-4 w-4 text-[#635BFF]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Stripe</p>
                  <p className="text-xs text-white/35">Pasarela de pagos</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-white/50">Stripe Secret Key</label>
                <div className="relative">
                  <input
                    type={showStripeKey ? "text" : "password"}
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    placeholder="sk_live_…"
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] py-2.5 pl-4 pr-10 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeKey(!showStripeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-white/25">Almacenada de forma segura, solo accesible desde backend.</p>
              </div>

              <button
                onClick={handleSaveStripeKey}
                disabled={savingSettings || !stripeKey.trim()}
                className="flex items-center gap-2 rounded-xl bg-[#635BFF]/15 border border-[#635BFF]/30 px-4 py-2.5 text-sm font-semibold text-[#635BFF] hover:bg-[#635BFF]/20 transition-colors disabled:opacity-40"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar clave
              </button>
            </div>

            {/* Platform info */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
              <p className="font-semibold text-white">Plataforma</p>
              {[
                ["Nombre", "Creator IA Pro"],
                ["Rutas activas", routes.length],
                ["Tablas DB", tables.length],
                ["Usuarios totales", users.length],
                ["Planes activos (pagos)", paidUsers],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-white/40">{label}</span>
                  <span className="font-medium text-white">{String(val)}</span>
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
