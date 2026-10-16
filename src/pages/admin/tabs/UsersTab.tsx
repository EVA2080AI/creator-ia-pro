import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Search, Loader2, RefreshCw, Ban, CheckCircle,
  Coins, Zap, Rocket, Crown, UserCheck, KeyRound,
  ChevronDown, ChevronUp, UserPlus, Trash2, AlertTriangle, Download
} from "lucide-react";
import { AdminUser, TIERS } from "../types";
import { CreateUserModal } from "../components/CreateUserModal";
import { downloadCsv } from "../csv";

function downloadUsersCsv(users: AdminUser[]) {
  downloadCsv(
    `usuarios-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Nombre", "Email", "Plan", "Créditos", "Registrado", "Activo"],
    users.map((u) => [
      u.display_name ?? "",
      u.email,
      TIERS[u.subscription_tier]?.label ?? u.subscription_tier,
      u.credits_balance,
      new Date(u.created_at).toISOString().slice(0, 10),
      u.is_active ? "sí" : "no",
    ]),
  );
}

export function UsersTab({
  users,
  loading,
  loadError,
  onRefresh,
  onManageCredits
}: {
  users: AdminUser[];
  loading?: boolean;
  loadError?: string | null;
  onRefresh: () => void;
  onManageCredits: (user: AdminUser) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleChangeTier = async (targetUserId: string, newTier: string) => {
    setActionLoading(targetUserId + "-tier");
    const res = await fetch(`/api/admin/users/${targetUserId}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionTier: newTier }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) toast.error(data?.error || "Error al cambiar el plan");
    else toast.success(`Plan → ${TIERS[newTier]?.label || newTier}`);
    onRefresh();
    setActionLoading(null);
  };

  const handleSuspend = async (targetUserId: string, activate: boolean) => {
    setActionLoading(targetUserId + "-suspend");
    const res = await fetch(`/api/admin/users/${targetUserId}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: activate }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) toast.error(data?.error || "Error al cambiar el estado de la cuenta");
    else toast.success(activate ? "Cuenta activada" : "Cuenta suspendida");
    onRefresh();
    setActionLoading(null);
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(email + "-reset");
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message || "Error al enviar el correo");
    else toast.success(`Email de recuperación enviado`);
    setActionLoading(null);
  };

  const handleDelete = async (targetUserId: string) => {
    setActionLoading(targetUserId + "-delete");
    const res = await fetch(`/api/admin/users/${targetUserId}`, { method: "DELETE", credentials: "include" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) toast.error(data?.error || "Error al borrar el usuario");
    else { toast.success("Usuario borrado"); onRefresh(); }
    setConfirmDelete(null);
    setActionLoading(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            aria-label="Buscar por nombre o email"
            placeholder="Nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            aria-label="Actualizar"
            className="flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent transition-all active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          {users.length > 0 && (
            <button
              onClick={() => downloadUsersCsv(users)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
              aria-label="Descargar CSV"
              title="Descargar CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            aria-label="Nuevo usuario"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nuevo usuario</span>
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); onRefresh(); }} />
      )}

      {/* Grid Header */}
      <div className="hidden md:grid grid-cols-[1fr_140px_120px_140px_60px] gap-4 px-5 py-3 bg-muted/50 border border-border rounded-t-2xl text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
        <span>Usuario</span>
        <span>Plan</span>
        <span>Balance</span>
        <span>Registrado</span>
        <span className="text-right">Acción</span>
      </div>

      {/* User List */}
      <div className="divide-y divide-border border-x border-b border-border rounded-b-2xl overflow-hidden bg-card">
        {loading && users.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">No se pudo cargar la lista: <span className="text-foreground">{loadError}</span></p>
            <button onClick={onRefresh} className="rounded-xl bg-muted px-4 py-2 text-xs font-bold text-foreground hover:bg-accent transition-all">Reintentar</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            No se encontraron usuarios.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isExpanded = expandedUser === u.user_id;
            const initials = (u.display_name || u.email || "?")[0].toUpperCase();
            const tier = TIERS[u.subscription_tier] || TIERS.free;
            const TierIcon = tier.icon === "Rocket" ? Rocket : tier.icon === "Crown" ? Crown : Zap;

            return (
              <div key={u.user_id} className="group flex flex-col hover:bg-muted/50 transition-colors">
                <div className="grid md:grid-cols-[1fr_140px_120px_140px_60px] gap-4 items-center px-5 py-4">
                  {/* User Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border text-sm font-bold text-muted-foreground">
                        {initials}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${u.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-tight">
                        {u.display_name || "Sin nombre"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate font-mono">{u.email}</p>
                    </div>
                  </div>

                  {/* Tier */}
                  <div className="hidden md:block">
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border"
                      style={{ background: tier.color + '08', color: tier.color, borderColor: tier.color + '20' }}>
                      <TierIcon className="h-3 w-3" />
                      {tier.label}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[13px] font-bold text-foreground font-mono tracking-tight">{u.credits_balance.toLocaleString()}</span>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block">
                    <p className="text-[11px] text-muted-foreground font-medium">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Actions Toggle */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                      aria-label={`Acciones de ${u.email}`}
                      aria-expanded={isExpanded}
                      className={`h-10 w-10 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Actions */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 space-y-4">
                    <hr className="border-border mt-0" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Credit Management */}
                      <button
                        onClick={() => onManageCredits(u)}
                        className="flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-amber-400/30 hover:bg-amber-50/10 transition-all group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                          <Coins className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Gestionar Créditos</p>
                          <p className="text-[10px] text-muted-foreground">Aumentar o reducir balance</p>
                        </div>
                      </button>

                      {/* Cambiar de plan: <select> nativo — el menú anterior solo
                          abría con hover (inusable en táctil y con teclado). */}
                      <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-left cursor-pointer focus-within:border-ring transition-colors">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground">Cambiar de Plan</p>
                          <select
                            value={TIERS[u.subscription_tier] ? u.subscription_tier : "free"}
                            onChange={(e) => handleChangeTier(u.user_id, e.target.value)}
                            aria-label={`Plan de ${u.email}`}
                            className="mt-0.5 w-full bg-transparent text-[11px] font-bold text-muted-foreground outline-none cursor-pointer"
                          >
                            {Object.entries(TIERS).map(([key, t]) => (
                              <option key={key} value={key}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </label>

                      {/* Password Reset */}
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        disabled={actionLoading === u.email + "-reset"}
                        className="flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-blue-400/30 hover:bg-blue-50/10 transition-all group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          {actionLoading === u.email + "-reset" ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Recuperar Acceso</p>
                          <p className="text-[10px] text-muted-foreground">Enviar link de contraseña</p>
                        </div>
                      </button>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleSuspend(u.user_id, !u.is_active)}
                        disabled={actionLoading === u.user_id + "-suspend"}
                        className={`flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-all group ${u.is_active ? 'hover:border-rose-400/30 hover:bg-rose-50/10' : 'hover:border-emerald-400/30 hover:bg-emerald-50/10'}`}
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${u.is_active ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'}`}>
                          {actionLoading === u.user_id + "-suspend" ? <Loader2 className="h-5 w-5 animate-spin" /> : (u.is_active ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{u.is_active ? 'Suspender Cuenta' : 'Activar Cuenta'}</p>
                          <p className="text-[10px] text-muted-foreground">{u.is_active ? 'Bloquear acceso temporal' : 'Habilitar acceso normal'}</p>
                        </div>
                      </button>

                      {/* Delete */}
                      {confirmDelete === u.user_id ? (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10 p-3">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                          <p className="flex-1 text-[10px] font-bold text-red-600 dark:text-red-400">¿Borrar para siempre?</p>
                          <button
                            onClick={() => handleDelete(u.user_id)}
                            disabled={actionLoading === u.user_id + "-delete"}
                            className="rounded-lg bg-red-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-red-600"
                          >
                            {actionLoading === u.user_id + "-delete" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sí"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-muted-foreground hover:bg-muted">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(u.user_id)}
                          className="flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-red-400/30 hover:bg-red-50/10 transition-all group"
                        >
                          <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <Trash2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Borrar cuenta</p>
                            <p className="text-[10px] text-muted-foreground">Elimina todo, sin vuelta atrás</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
