import { useMemo, useState } from "react";
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
import {
  activityLabel, matchesActivity, neverUsed, sortUsers, summarizeActivity, usageHeadline, usageLine,
  type ActivityFilter, type UserSort,
} from "../activity";

// "¿Quién lo usa?" (pedido 2026-11-20): cada filtro dice cuántas cuentas caen ahí y, al
// tocarlo, deja en la lista solo a esas personas.
// Usuario | Plan | (Balance, desde xl) | Uso | Actividad | Acción — las clases completas,
// escritas enteras para que Tailwind las encuentre. La tabla arranca en lg y no en md: entre
// 768 y 1024px el menú lateral del panel deja ~450px, y ahí cinco columnas dejaban el nombre
// en cero. Por debajo de lg cada cuenta es una tarjeta con el uso en una línea.
const GRID_COLS = "lg:grid-cols-[minmax(0,1fr)_96px_116px_112px_36px] xl:grid-cols-[minmax(0,1fr)_100px_90px_124px_124px_36px]";

const ACTIVITY_FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "hoy", label: "Activos hoy" },
  { id: "7d", label: "Últimos 7 días" },
  { id: "30d", label: "Últimos 30 días" },
  { id: "sin-uso", label: "Nunca lo usaron" },
];

function downloadUsersCsv(users: AdminUser[]) {
  downloadCsv(
    `usuarios-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Nombre", "Email", "Plan", "Créditos", "Registrado", "Cuenta habilitada", "Última actividad", "Mensajes", "Chats", "Imágenes"],
    users.map((u) => [
      u.display_name ?? "",
      u.email,
      TIERS[u.subscription_tier]?.label ?? u.subscription_tier,
      u.credits_balance,
      new Date(u.created_at).toISOString().slice(0, 10),
      u.is_active ? "sí" : "no",
      u.last_active_at ? new Date(u.last_active_at).toISOString().slice(0, 10) : "",
      u.messages ?? "",
      u.chats ?? "",
      u.images ?? "",
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

  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("todos");
  // Por defecto, quien usó la app más recientemente arriba: es la pregunta que se viene a
  // responder acá. "Registro" deja el orden que tenía antes (cuentas nuevas primero).
  const [sort, setSort] = useState<UserSort>("actividad");

  // Si el servidor no pudo calcular la actividad, los campos no vienen: se oculta todo lo
  // que depende de ellos en vez de mostrar ceros que parecerían "nadie usa la app".
  const hasActivity = users.some((u) => u.messages !== undefined);
  const summary = useMemo(() => summarizeActivity(users), [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    const visibles = users.filter(
      (u) =>
        (u.email?.toLowerCase().includes(q) || (u.display_name?.toLowerCase() || "").includes(q)) &&
        (!hasActivity || matchesActivity(u, activityFilter)),
    );
    return hasActivity ? sortUsers(visibles, sort) : visibles;
  }, [users, search, activityFilter, sort, hasActivity]);

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

      {/* Quién lo usa: filtros con su conteo + orden */}
      {hasActivity && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por actividad">
            {ACTIVITY_FILTERS.map((f) => {
              const on = activityFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActivityFilter(f.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  {f.label}
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${on ? "bg-primary-foreground/20" : "bg-muted text-foreground"}`}>{summary[f.id]}</span>
                </button>
              );
            })}
          </div>
          <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs font-bold text-muted-foreground">
            Ordenar por
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as UserSort)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-ring"
            >
              <option value="actividad">Última actividad</option>
              <option value="mensajes">Más mensajes</option>
              <option value="registro">Registro más reciente</option>
            </select>
          </label>
        </div>
      )}

      {/* Grid Header */}
      {/* Anchos medidos en producción a 1100px (un portátil): con las columnas fijas en
          520px al nombre le quedaban ~60px y se leía "Juan Se…", justo el dato que se viene
          a buscar. El saldo aparece desde xl; antes de eso está en "Gestionar créditos". */}
      <div className={`hidden lg:grid ${GRID_COLS} gap-3 px-5 py-3 bg-muted/50 border border-border rounded-t-2xl text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground`}>
        <span>Usuario</span>
        <span>Plan</span>
        <span className="hidden xl:block">Balance</span>
        <span>Uso</span>
        <span title="Lo último que hizo: entrar, escribir, generar una imagen o gastar créditos">Actividad</span>
        <span className="sr-only">Acción</span>
      </div>

      {/* User List */}
      {/* Sin la cabecera de la tabla (por debajo de lg) la lista cierra ella misma por arriba. */}
      <div className="divide-y divide-border border-x border-b border-t lg:border-t-0 border-border rounded-b-2xl rounded-t-2xl lg:rounded-t-none overflow-hidden bg-card">
        {loading && users.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">No se pudo cargar la lista: <span className="text-foreground">{loadError}</span></p>
            <button onClick={onRefresh} className="rounded-xl bg-muted px-4 py-2 text-xs font-bold text-foreground hover:bg-accent transition-all">Reintentar</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {activityFilter !== "todos" && !search ? "Nadie en este grupo." : "No se encontraron usuarios."}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isExpanded = expandedUser === u.user_id;
            const initials = (u.display_name || u.email || "?")[0].toUpperCase();
            const tier = TIERS[u.subscription_tier] || TIERS.free;
            const TierIcon = tier.icon === "Rocket" ? Rocket : tier.icon === "Crown" ? Crown : Zap;

            return (
              <div key={u.user_id} className="group flex flex-col hover:bg-muted/50 transition-colors">
                <div className={`grid grid-cols-[minmax(0,1fr)_auto] ${GRID_COLS} gap-3 items-center px-5 py-4`}>
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
                      {/* Sin columnas (teléfono y tableta): el uso va en una línea bajo el correo. */}
                      {hasActivity && (
                        <p className="lg:hidden mt-0.5 text-[11px] text-muted-foreground truncate">
                          <span className="font-bold text-foreground">{activityLabel(u.last_active_at)}</span>
                          {" · "}{neverUsed(u) ? "nunca lo usó" : `${usageHeadline(u).n} ${usageHeadline(u).label}`}
                          {u.subscription_tier !== "free" && ` · ${tier.label}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tier */}
                  <div className="hidden lg:block">
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border"
                      style={{ background: tier.color + '08', color: tier.color, borderColor: tier.color + '20' }}>
                      <TierIcon className="h-3 w-3" />
                      {tier.label}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="hidden xl:flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[13px] font-bold text-foreground font-mono tracking-tight">{u.credits_balance.toLocaleString()}</span>
                  </div>

                  {/* Uso: cuánto escribió. Quien nunca escribió ni generó nada se dice tal cual. */}
                  <div className="hidden lg:block min-w-0">
                    {!hasActivity ? (
                      <p className="text-[11px] text-muted-foreground">—</p>
                    ) : neverUsed(u) ? (
                      <p className="text-[11px] font-medium text-muted-foreground">Nunca lo usó</p>
                    ) : (
                      <>
                        <p className="text-[13px] font-bold text-foreground leading-tight">
                          {usageHeadline(u).n} <span className="text-[11px] font-medium text-muted-foreground">{usageHeadline(u).label}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{usageLine(u)}</p>
                      </>
                    )}
                  </div>

                  {/* Última actividad, y debajo desde cuándo tiene cuenta */}
                  <div className="hidden lg:block min-w-0">
                    {hasActivity && (
                      <p className="text-[13px] font-bold text-foreground leading-tight" title={u.last_active_at ? new Date(u.last_active_at).toLocaleString() : undefined}>
                        {activityLabel(u.last_active_at)}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground font-medium truncate">Alta: {new Date(u.created_at).toLocaleDateString()}</p>
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
