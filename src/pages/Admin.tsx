import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { adminService } from "@/services/billing-service";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Shield, Users, Search, Loader2, RefreshCw, Ban, CheckCircle,
  KeyRound, Coins, LayoutDashboard, Database, Zap, Settings,
  Eye, EyeOff, Save, Crown, GraduationCap, Building2, X,
  Plus, Minus, RotateCcw, History, ChevronDown, ChevronUp,
  TrendingUp, UserCheck, Star, Package, BarChart2, Activity,
  Code2, Image, Video, FileText, Terminal, CreditCard, Globe,
  AlertTriangle, CheckCircle2, DollarSign, Users2, Layers, Rocket,
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

const TIERS: Record<string, { label: string; color: string; icon: any }> = {
  free:      { label: "Free",       color: "#6B7280", icon: Zap },
  starter:   { label: "Starter",    color: "#4ADE80", icon: Zap },
  creator:   { label: "Creator",    color: "#A855F7", icon: Rocket },
  pymes:     { label: "Pymes",      color: "#F59E0B", icon: Crown },
};

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  admin_grant:  { label: "Carga Admin",   color: "#A855F7" },
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
    const { data, error } = await (supabase.rpc as any)("admin_get_transactions", {
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
    const { data, error } = await (supabase.rpc as any)(fn, {
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
    { key: "add",     label: "Agregar",   icon: Plus,      color: "#A855F7" },
    { key: "deduct",  label: "Deducir",   icon: Minus,     color: "#EF4444" },
    { key: "refund",  label: "Reembolso", icon: RotateCcw, color: "#60A5FA" },
    { key: "history", label: "Historial", icon: History,   color: "#A855F7" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-background/50 backdrop-blur-2xl shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <p className="font-semibold text-zinc-900">{user.display_name || user.email}</p>
            <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-bold text-zinc-900 font-mono">{user.credits_balance.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors"
                style={{ color: isActive ? t.color : "rgba(113,113,122,1)", borderBottom: isActive ? `2px solid ${t.color}` : "2px solid transparent" }}
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
                <label htmlFor="admin-credits" className="mb-1.5 block text-xs text-zinc-500">Créditos</label>
                <input
                  id="admin-credits"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={tab === "add" ? "Ej: 50000" : "Ej: 1000"}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="admin-reason" className="mb-1.5 block text-xs text-zinc-500">
                  Razón {tab !== "refund" && <span className="text-zinc-500">(opcional)</span>}
                </label>
                <input
                  id="admin-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tab === "refund" ? "Motivo del reembolso" : "Descripción (opcional)"}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
              </div>
              <button
                onClick={runOp}
                disabled={loading || !amount}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: tab === "add" ? "#A855F715" : tab === "deduct" ? "#EF444415" : "#60A5FA15",
                  border: `1px solid ${tab === "add" ? "#A855F730" : tab === "deduct" ? "#EF444430" : "#60A5FA30"}`,
                  color: tab === "add" ? "#A855F7" : tab === "deduct" ? "#EF4444" : "#60A5FA",
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
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : txs.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">Sin transacciones</p>
              ) : (
                txs.map((tx) => {
                  const meta = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "#6B7280" };
                  return (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                      <div className="min-w-0">
                        <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: meta.color + "15", color: meta.color }}>
                          {meta.label}
                        </span>
                        {tx.description && (
                          <p className="mt-0.5 truncate text-xs text-zinc-400">{tx.description}</p>
                        )}
                        <p className="text-[10px] text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <span className="ml-3 font-mono text-sm font-bold" style={{ color: tx.amount >= 0 ? "#A855F7" : "#EF4444" }}>
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

// ─── Admin Login Gate ─────────────────────────────────────────────────────────
// Shown when no session is active. Embeds a minimal email+password login
// scoped to this page — no redirect away from /admin.

function AdminLoginGate() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    // On success, onAuthStateChange in useAuth() will update user → page re-renders
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-zinc-50 p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 mx-auto">
            <Shield className="h-7 w-7 text-zinc-900" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Acceso Admin</h1>
          <p className="text-xs text-zinc-400">Inicia sesión con tu cuenta de administrador</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            aria-label="Correo electrónico"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-300 transition-colors"
          />
          <input
            type="password"
            required
            aria-label="Contraseña"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-[#A855F7]/40 transition-colors"
          />
          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Entrar al panel
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="w-full text-xs text-zinc-500 hover:text-zinc-400 transition-colors text-center"
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

// ─── Admin Bootstrap ──────────────────────────────────────────────────────────
// Shown when the logged-in user has no admin role.
// Calls bootstrap_admin() RPC which only succeeds when 0 admins exist.

function AdminBootstrap({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleBootstrap = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("bootstrap_admin" as any);
    setLoading(false);
    if (error) { setResult("error:" + error.message); return; }
    if (data === "ok") { toast.success("¡Admin activado! Recargando..."); setTimeout(onSuccess, 1200); }
    else if (data === "admin_exists") setResult("admin_exists");
    else setResult("error:" + data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-background/50 backdrop-blur-2xl p-10 text-center space-y-6 shadow-2xl shadow-black/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 mx-auto">
          <Shield className="h-8 w-8 text-zinc-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Panel Admin</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Tu cuenta aún no tiene el rol de administrador.
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{user?.email}</p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-400 text-xs hover:text-zinc-500 hover:bg-zinc-100 transition-all"
        >
          Cambiar cuenta
        </button>

        {result === "admin_exists" ? (
          <div className="space-y-3 text-left">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400/80 space-y-2">
              <p className="font-bold text-amber-400">Ya existe un administrador</p>
              <p>Si eres el propietario del proyecto, ejecuta este SQL en el <a href="https://supabase.com/dashboard/project/zfzkohjdwggctogehlkw/sql/new" target="_blank" rel="noopener noreferrer" className="underline text-amber-300">Editor SQL de Supabase</a> para otorgarte acceso:</p>
              <pre className="bg-black/40 rounded-xl p-3 text-[10px] text-green-400 font-mono break-all whitespace-pre-wrap select-all">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user?.id}', 'admin')
ON CONFLICT DO NOTHING;`}
              </pre>
              <p className="text-zinc-400">Tu ID: <span className="text-zinc-500 font-mono select-all">{user?.id}</span></p>
            </div>
            <button
              onClick={onSuccess}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-500 font-semibold text-sm hover:bg-zinc-100 transition-all"
            >
              <RotateCcw className="h-4 w-4" /> Ya lo hice — Recargar
            </button>
          </div>
        ) : result?.startsWith("error:") ? (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
            {result.replace("error:", "")}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400/80 text-left space-y-1">
              <p className="font-bold text-amber-400">Primera configuración</p>
              <p>Si aún no hay ningún administrador en el sistema, puedes activar tu cuenta como admin aquí. Esta opción se deshabilita automáticamente una vez que existe un admin.</p>
            </div>
            <button
              onClick={handleBootstrap}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Activar mi cuenta como Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Admin = () => {
  // No automatic redirect — Admin handles its own auth states
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "analytics" | "overview" | "settings">("users");
  const [creditModalUser, setCreditModalUser] = useState<AdminUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [boldApiKey, setBoldApiKey] = useState("");
  const [boldWebhookSecret, setBoldWebhookSecret] = useState("");
  const [showBoldKeys, setShowBoldKeys] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    totalSpend: number;
    recentUsers: number;
    toolUsage: { name: string; count: number; color: string }[];
    dailyCredits: { name: string; credits: number }[];
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      setLoadError(error.message || "No se pudo cargar la lista de usuarios.");
    } else {
      setUsers((data as AdminUser[]) || []);
    }
    setLoadingUsers(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
      const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      const [txRes, newUsersRes] = await Promise.all([
        supabase.from("transactions").select("amount, type, description, created_at")
          .gte("created_at", thirtyDaysAgo)
          .not("type", "in", '("subscription_reload","credit_purchase")'),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo),
      ]);

      const txs = txRes.data || [];
      let totalSpend = 0;
      let image = 0, video = 0, text = 0, canvas = 0, studio = 0;
      const dayMap: Record<string, { name: string; credits: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        dayMap[d.toDateString()] = { name: DAY_LABELS[d.getDay()], credits: 0 };
      }
      txs.forEach((tx: any) => {
        const abs = Math.abs(tx.amount || 0);
        totalSpend += abs;
        const desc = (tx.description || "").toLowerCase();
        if (desc.includes("image") || desc.includes("imagen") || desc.includes("logo")) image++;
        else if (desc.includes("video")) video++;
        else if (desc.includes("studio") || desc.includes("code") || desc.includes("builderai")) studio++;
        else if (desc.includes("canvas") || desc.includes("formarketing")) canvas++;
        else text++;
        const key = new Date(tx.created_at).toDateString();
        if (dayMap[key]) dayMap[key].credits += abs;
      });

      setAnalyticsData({
        totalSpend,
        recentUsers: newUsersRes.count || 0,
        toolUsage: [
          { name: "Imagen IA",   count: image,  color: "#A855F7" },
          { name: "Texto / Copy",count: text,   color: "#60A5FA" },
          { name: "Video",       count: video,  color: "#F59E0B" },
          { name: "BuilderAI",   count: studio, color: "#A855F7" },
          { name: "Canvas",      count: canvas, color: "#EC4899" },
        ],
        dailyCredits: Object.values(dayMap),
      });
    } catch (e) {
      console.error("Analytics error:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (isAdmin && activeTab === "analytics") fetchAnalytics();
  }, [isAdmin, activeTab, fetchAnalytics]);

  // No automatic redirect — show bootstrap screen if not admin

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

  const handleSaveBoldSettings = async () => {
    if (!boldApiKey.trim() && !boldWebhookSecret.trim()) { toast.error("Ingresa al menos una clave"); return; }
    setSavingSettings(true);
    try {
      const settings: any = {};
      if (boldApiKey.trim()) settings.BOLD_API_KEY = boldApiKey;
      if (boldWebhookSecret.trim()) settings.BOLD_WEBHOOK_SECRET = boldWebhookSecret;
      
      await adminService.saveSettings(settings);
      toast.success("Configuración de Bold guardada");
      setBoldApiKey("");
      setBoldWebhookSecret("");
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
    { path: "/",                  desc: "Landing pública" },
    { path: "/auth",              desc: "Login / registro" },
    { path: "/dashboard",         desc: "Panel del usuario" },
    { path: "/chat",              desc: "Genesis — BuilderAI IDE" },
    { path: "/studio",            desc: "Studio creativo" },
    { path: "/spaces",            desc: "Mis espacios (Google Drive)" },
    { path: "/formarketing",      desc: "Canvas IA (ReactFlow)" },
    { path: "/hub",               desc: "Plantillas y templates" },
    { path: "/tools",             desc: "Herramientas IA" },
    { path: "/assets",            desc: "Biblioteca de activos" },
    { path: "/pricing",           desc: "Planes y precios" },
    { path: "/profile",           desc: "Perfil de usuario" },
    { path: "/admin",             desc: "Panel administrativo" },
    { path: "/system-status",     desc: "Estado del sistema" },
    { path: "/reset-password",    desc: "Recuperar contraseña" },
    { path: "/descargar",         desc: "Descargar app" },
    { path: "/herramienta/:slug", desc: "Landing de herramienta" },
    { path: "/sharescreen",       desc: "Compartir pantalla" },
  ];

  const tables = [
    { name: "profiles",             desc: "Datos de usuario, créditos y plan",     rows: users.length },
    { name: "transactions",         desc: "Registro de débitos y créditos",        rows: null },
    { name: "user_roles",           desc: "Roles (admin / moderator / user)",      rows: null },
    { name: "spaces",               desc: "Proyectos del usuario",                  rows: null },
    { name: "saved_assets",         desc: "Biblioteca personal de assets",          rows: null },
    { name: "canvas_nodes",         desc: "Nodos del lienzo ForMarketing",          rows: null },
    { name: "studio_projects",      desc: "Proyectos BuilderAI (Genesis)",          rows: null },
    { name: "studio_conversations", desc: "Conversaciones del IDE",                 rows: null },
    { name: "studio_messages",      desc: "Mensajes del chat de Studio",            rows: null },
    { name: "github_connections",   desc: "Repos conectados de GitHub",             rows: null },
  ];

  const edgeFunctions = [
    { name: "ai-proxy",          desc: "Texto e imagen IA (OpenRouter)",      icon: Zap,      color: "#A855F7" },
    { name: "media-proxy",       desc: "Edición de imagen (Replicate)",       icon: Image,    color: "#60A5FA" },
    { name: "video-gen",         desc: "Generación de video (Replicate)",     icon: Video,    color: "#F59E0B" },
    { name: "studio-generate",   desc: "BuilderAI — generación de código",    icon: Code2,    color: "#A855F7" },
    { name: "bold-webhook",      desc: "Webhook de pagos Bold.co",            icon: Shield,     color: "#F59E0B" },
    { name: "bold-checkout",     desc: "Generador de checkout Bold",          icon: DollarSign,   color: "#A855F7" },
    { name: "admin-settings",    desc: "Guardar configuración de plataforma", icon: Settings, color: "#6B7280" },
    { name: "deploy-hook",       desc: "Redeployment automático (Vercel)",    icon: Globe,    color: "#60A5FA" },
  ];

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return <AdminLoginGate />;
  }

  // ── Logged in but no admin role → bootstrap or access denied ──────────────
  if (!isAdmin) {
    return <AdminBootstrap user={user} onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-background text-zinc-900 selection:bg-primary/20">
      <Helmet><title>Admin | Creator IA Pro</title></Helmet>

      {creditModalUser && (
        <CreditModal
          user={creditModalUser}
          onClose={() => setCreditModalUser(null)}
          onDone={fetchUsers}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200">
              <Shield className="h-5 w-5 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Panel Admin</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-[11px] font-semibold text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Usuarios", value: users.length, icon: Users, color: "#FFFFFF" },
            { label: "Planes pagos", value: paidUsers, icon: TrendingUp, color: "#A855F7" },
            { label: "Créditos totales", value: totalCredits.toLocaleString(), icon: Coins, color: "#F59E0B" },
            { label: "Conversión", value: users.length ? `${Math.round((paidUsers/users.length)*100)}%` : "0%", icon: BarChart2, color: "#60A5FA" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: s.color + "18" }}>
                  <Icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-zinc-900 leading-none">{s.value}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 w-fit overflow-x-auto">
          {([
            { key: "users" as const,     icon: Users,           label: "Usuarios" },
            { key: "analytics" as const, icon: BarChart2,       label: "Analytics" },
            { key: "overview" as const,  icon: LayoutDashboard, label: "Sistema" },
            { key: "settings" as const,  icon: Settings,        label: "Config" },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Users tab ── */}
        {activeTab === "users" && (
          <div className="space-y-3">

            {/* Tier pills */}
            {users.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(TIERS).map(([key, cfg]) => {
                  const count = tierCounts[key] || 0;
                  if (!count) return null;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                      style={{ borderColor: cfg.color + "35", color: cfg.color, background: cfg.color + "0C" }}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label} · {count}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search + refresh */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  placeholder="Buscar por email o nombre…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                title="Recargar"
              >
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* States */}
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                <p className="text-sm text-zinc-400">Cargando usuarios…</p>
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-center space-y-3">
                <X className="h-6 w-6 text-rose-400 mx-auto" />
                <p className="text-sm font-semibold text-rose-400">Error al cargar usuarios</p>
                <p className="text-xs text-zinc-400 font-mono">{loadError}</p>
                <button
                  onClick={fetchUsers}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reintentar
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-400">
                {search ? "Sin resultados para esta búsqueda" : "No hay usuarios registrados"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => {
                  const tier = TIERS[u.subscription_tier] || TIERS.free;
                  const TierIcon = tier.icon;
                  const isExpanded = expandedUser === u.user_id;
                  const isBusy = (key: string) => actionLoading === key;
                  const initials = (u.display_name || u.email || "?")[0].toUpperCase();

                  return (
                    <div key={u.user_id} className="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden transition-all">

                      {/* Card row */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                        onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                      >
                        {/* Avatar */}
                        <div
                          className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold"
                          style={{ background: tier.color + "20", color: tier.color }}
                        >
                          {initials}
                        </div>

                        {/* Identity */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-zinc-900 truncate">
                              {u.display_name || u.email}
                            </span>
                            <span
                              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0"
                              style={{ background: tier.color + "18", color: tier.color }}
                            >
                              <TierIcon className="h-2.5 w-2.5" />
                              {tier.label}
                            </span>
                          </div>
                          {u.display_name && (
                            <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">{u.email}</p>
                          )}
                        </div>

                        {/* Credits */}
                        <div
                          className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-amber-400/[0.07] border border-amber-400/10 shrink-0"
                          onClick={(e) => { e.stopPropagation(); setCreditModalUser(u); }}
                          title="Gestionar créditos"
                        >
                          <Coins className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-mono text-sm font-bold text-zinc-900">{u.credits_balance.toLocaleString()}</span>
                        </div>

                        {/* Expand icon */}
                        <div className="text-zinc-500">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="border-t border-zinc-200 bg-black/20 p-4 space-y-5">

                          {/* Meta info */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                            <div>
                              <p className="text-zinc-400 mb-0.5">Registro</p>
                              <p className="text-zinc-600">{new Date(u.created_at).toLocaleDateString("es-CO")}</p>
                            </div>
                            <div>
                              <p className="text-zinc-400 mb-0.5">Último acceso</p>
                              <p className="text-zinc-600">{u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString("es-CO") : "—"}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <p className="text-zinc-400 mb-0.5">Créditos</p>
                              <button
                                onClick={() => setCreditModalUser(u)}
                                className="flex items-center gap-1 text-amber-400 font-semibold hover:text-amber-300 transition-colors"
                              >
                                <Coins className="h-3 w-3" />
                                {u.credits_balance.toLocaleString()} · Gestionar
                              </button>
                            </div>
                            <div className="col-span-2">
                              <p className="text-zinc-400 mb-0.5">User ID</p>
                              <p className="text-zinc-400 font-mono text-[10px] break-all select-all">{u.user_id}</p>
                            </div>
                          </div>

                          {/* Change plan */}
                          <div>
                            <p className="text-xs text-zinc-400 mb-2 font-medium">Cambiar plan</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(TIERS).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                const active = u.subscription_tier === key;
                                const busy = isBusy(u.user_id + "-tier");
                                return (
                                  <button
                                    key={key}
                                    disabled={active || busy}
                                    onClick={() => handleChangeTier(u.user_id, key)}
                                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-default"
                                    style={{
                                      background: active ? cfg.color + "22" : "rgba(255,255,255,0.04)",
                                      border: `1px solid ${active ? cfg.color + "55" : "rgba(255,255,255,0.08)"}`,
                                      color: active ? cfg.color : "rgba(255,255,255,0.45)",
                                    }}
                                  >
                                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                                    {cfg.label}
                                    {active && <span className="ml-0.5 opacity-60">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200">
                            <button
                              disabled={isBusy(u.email + "-reset")}
                              onClick={() => handleResetPassword(u.email)}
                              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all disabled:opacity-40"
                            >
                              {isBusy(u.email + "-reset") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                              Enviar reset password
                            </button>
                            <button
                              disabled={isBusy(u.user_id + "-suspend")}
                              onClick={() => handleSuspend(u.user_id, false)}
                              className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                            >
                              {isBusy(u.user_id + "-suspend") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                              Suspender
                            </button>
                            <button
                              disabled={isBusy(u.user_id + "-suspend")}
                              onClick={() => handleSuspend(u.user_id, true)}
                              className="flex items-center gap-1.5 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-40"
                            >
                              {isBusy(u.user_id + "-suspend") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                              Activar cuenta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <p className="text-xs text-zinc-500 px-1">
                  {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""}
                  {search && ` · filtrado de ${users.length}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Analytics tab ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[#A855F7]" />
              </div>
            ) : analyticsData ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Créditos consumidos (30d)", value: analyticsData.totalSpend.toLocaleString(), icon: Activity, color: "#A855F7" },
                    { label: "Nuevos usuarios (7d)",     value: analyticsData.recentUsers, icon: Users, color: "#A855F7" },
                    { label: "Revenue estimado",          value: `$${(paidUsers * 19).toLocaleString()}`, icon: DollarSign, color: "#F59E0B" },
                    { label: "Tasa conversión",           value: users.length ? `${Math.round((paidUsers/users.length)*100)}%` : "0%", icon: TrendingUp, color: "#60A5FA" },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: s.color + "18" }}>
                          <Icon className="h-4 w-4" style={{ color: s.color }} />
                        </div>
                        <div>
                          <p className="font-mono text-xl font-bold text-zinc-900 leading-none">{s.value}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{s.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Credit usage per day (sparkline) */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.2em]">Consumo de créditos</h3>
                      <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest">Últimos 7 días · todas las cuentas</p>
                    </div>
                    <Activity className="h-4 w-4 text-[#A855F7]" />
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {analyticsData.dailyCredits.map((d, i) => {
                      const max = Math.max(...analyticsData.dailyCredits.map(x => x.credits), 1);
                      const pct = (d.credits / max) * 100;
                      return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                          <div
                            className="w-full rounded-t-lg bg-[#A855F7]/40 hover:bg-[#A855F7]/70 transition-all min-h-[4px]"
                            style={{ height: `${Math.max(pct, 5)}%` }}
                            title={`${d.credits.toLocaleString()} créditos`}
                          />
                          <span className="text-[9px] text-zinc-500 font-bold">{d.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tool usage breakdown */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.2em]">Uso por herramienta</h3>
                      <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest">Últimos 30 días</p>
                    </div>
                    <Layers className="h-4 w-4 text-zinc-500" />
                  </div>
                  {analyticsData.toolUsage.every(t => t.count === 0) ? (
                    <p className="text-xs text-zinc-400 text-center py-6">Sin actividad en este período</p>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.toolUsage.map((tool) => {
                        const total = analyticsData.toolUsage.reduce((s, t) => s + t.count, 0) || 1;
                        const pct = Math.round((tool.count / total) * 100);
                        return (
                          <div key={tool.name}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-zinc-500 font-medium">{tool.name}</span>
                              <span className="text-zinc-400 font-mono">{tool.count} · {pct}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: tool.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tier distribution */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.2em] mb-4">Distribución de planes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(TIERS).map(([key, cfg]) => {
                      const count = tierCounts[key] || 0;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
                          style={{ borderColor: cfg.color + "25", background: cfg.color + "08" }}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                          <div>
                            <p className="text-sm font-bold text-zinc-900 tabular-nums">{count}</p>
                            <p className="text-[10px]" style={{ color: cfg.color + "AA" }}>{cfg.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-zinc-400 mb-4">No se pudieron cargar los analytics</p>
                <button onClick={fetchAnalytics} className="inline-flex items-center gap-2 text-xs text-[#A855F7] hover:underline">
                  <RefreshCw className="h-3.5 w-3.5" /> Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Overview tab ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* Edge Functions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Edge Functions · Supabase</h2>
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-[11px] font-semibold text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {edgeFunctions.length} activas
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {edgeFunctions.map((fn) => {
                  const Icon = fn.icon;
                  return (
                    <div key={fn.name} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: fn.color + "15" }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: fn.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-zinc-900 truncate">{fn.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{fn.desc}</p>
                      </div>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DB Tables */}
            <div>
              <h2 className="mb-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">Tablas · PostgreSQL</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((t) => (
                  <div key={t.name} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Database className="h-3.5 w-3.5 text-[#A855F7]" />
                      <span className="font-mono text-sm font-semibold text-zinc-900">{t.name}</span>
                      {t.rows !== null && (
                        <span className="ml-auto text-[10px] font-mono text-zinc-400">{t.rows}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Frontend routes */}
            <div>
              <h2 className="mb-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">Rutas del Frontend · {routes.length} páginas</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map((r) => (
                  <div key={r.path} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-zinc-600 block truncate">{r.path}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{r.desc}</span>
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-green-500/10 border border-green-500/15 px-2.5 py-0.5 text-[10px] font-bold text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      live
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <div className="max-w-lg space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Bold.co</p>
                  <p className="text-xs text-zinc-400">Pasarela de pagos Industrial</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="bold-api-key" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Bold API Key</label>
                  <div className="relative">
                    <input
                      id="bold-api-key"
                      type={showBoldKeys ? "text" : "password"}
                      value={boldApiKey}
                      onChange={(e) => setBoldApiKey(e.target.value)}
                      placeholder="Identidad de Bold..."
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#F59E0B]/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bold-webhook-secret" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Bold Webhook Secret</label>
                  <div className="relative">
                    <input
                      id="bold-webhook-secret"
                      type={showBoldKeys ? "text" : "password"}
                      value={boldWebhookSecret}
                      onChange={(e) => setBoldWebhookSecret(e.target.value)}
                      placeholder="Llave secreta de Bold..."
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#F59E0B]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBoldKeys(!showBoldKeys)}
                      aria-label={showBoldKeys ? "Ocultar llaves Bold" : "Mostrar llaves Bold"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      {showBoldKeys ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Configura estas llaves desde tu panel de Bold.co para habilitar cobros e integración con webhooks.</p>
              </div>

              <button
                onClick={handleSaveBoldSettings}
                disabled={savingSettings || (!boldApiKey.trim() && !boldWebhookSecret.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Actualizar Configuración
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-3">
              <p className="font-semibold text-zinc-900">Plataforma</p>
              {[
                ["Nombre", "Creator IA Pro"],
                ["Rutas activas", routes.length],
                ["Tablas DB", tables.length],
                ["Usuarios totales", users.length],
                ["Planes pagos", paidUsers],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-center justify-between text-sm py-0.5">
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-900">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
