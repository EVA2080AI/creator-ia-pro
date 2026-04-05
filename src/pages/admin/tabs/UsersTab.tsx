import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, Loader2, RefreshCw, Ban, CheckCircle, 
  Coins, Zap, Rocket, Crown, UserCheck, KeyRound, 
  ChevronDown, ChevronUp 
} from "lucide-react";
import { AdminUser, TIERS } from "../types";

export function UsersTab({ 
  users, 
  onRefresh, 
  onManageCredits 
}: { 
  users: AdminUser[]; 
  onRefresh: () => void;
  onManageCredits: (user: AdminUser) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleChangeTier = async (targetUserId: string, newTier: string) => {
    setActionLoading(targetUserId + "-tier");
    const { error } = await supabase.rpc("admin_update_tier", {
      _target_user_id: targetUserId,
      _new_tier: newTier,
    });
    if (error) toast.error(error.message);
    else toast.success(`Plan → ${TIERS[newTier]?.label || newTier}`);
    onRefresh();
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
    onRefresh();
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

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            placeholder="Nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
          />
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      {/* Grid Header */}
      <div className="hidden md:grid grid-cols-[1fr_140px_120px_140px_60px] gap-4 px-5 py-3 bg-zinc-50 border border-zinc-100 rounded-t-2xl text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
        <span>Usuario</span>
        <span>Plan</span>
        <span>Balance</span>
        <span>Registrado</span>
        <span className="text-right">Acción</span>
      </div>

      {/* User List */}
      <div className="divide-y divide-zinc-100 border-x border-b border-zinc-100 rounded-b-2xl overflow-hidden bg-white">
        {filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-400">
            No se encontraron usuarios.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isExpanded = expandedUser === u.user_id;
            const initials = (u.display_name || u.email || "?")[0].toUpperCase();
            const tier = TIERS[u.subscription_tier] || TIERS.free;
            const TierIcon = tier.icon === "Rocket" ? Rocket : tier.icon === "Crown" ? Crown : Zap;

            return (
              <div key={u.user_id} className="group flex flex-col hover:bg-zinc-50/50 transition-colors">
                <div className="grid md:grid-cols-[1fr_140px_120px_140px_60px] gap-4 items-center px-5 py-4">
                  {/* User Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-sm font-bold text-zinc-600">
                        {initials}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${u.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate leading-tight">
                        {u.display_name || "Sin nombre"}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-medium truncate font-mono">{u.email}</p>
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
                    <span className="text-[13px] font-bold text-zinc-900 font-mono tracking-tight">{u.credits_balance.toLocaleString()}</span>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block">
                    <p className="text-[11px] text-zinc-400 font-medium">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Actions Toggle */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Actions */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 space-y-4">
                    <hr className="border-zinc-100 mt-0" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Credit Management */}
                      <button
                        onClick={() => onManageCredits(u)}
                        className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left hover:border-amber-400/30 hover:bg-amber-50/10 transition-all group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                          <Coins className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Gestionar Créditos</p>
                          <p className="text-[10px] text-zinc-500">Aumentar o reducir balance</p>
                        </div>
                      </button>

                      {/* Tier Management */}
                      <div className="relative group/tiers">
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left">
                          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <UserCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">Cambiar de Plan</p>
                            <p className="text-[10px] text-zinc-500">Asignar nueva suscripción</p>
                          </div>
                        </div>
                        <div className="absolute top-full left-0 right-0 mt-1 z-20 hidden group-hover/tiers:block bg-white border border-zinc-100 rounded-xl shadow-xl p-1.5 space-y-1">
                          {Object.entries(TIERS).map(([key, t]) => (
                            <button
                              key={key}
                              onClick={() => handleChangeTier(u.user_id, key)}
                              disabled={u.subscription_tier === key}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-zinc-50 text-zinc-600 disabled:opacity-30"
                            >
                              {t.label}
                              {u.subscription_tier === key && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Password Reset */}
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        disabled={actionLoading === u.email + "-reset"}
                        className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left hover:border-blue-400/30 hover:bg-blue-50/10 transition-all group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          {actionLoading === u.email + "-reset" ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Recuperar Acceso</p>
                          <p className="text-[10px] text-zinc-500">Enviar link de contraseña</p>
                        </div>
                      </button>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleSuspend(u.user_id, !u.is_active)}
                        disabled={actionLoading === u.user_id + "-suspend"}
                        className={`flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition-all group ${u.is_active ? 'hover:border-rose-400/30 hover:bg-rose-50/10' : 'hover:border-emerald-400/30 hover:bg-emerald-50/10'}`}
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${u.is_active ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {actionLoading === u.user_id + "-suspend" ? <Loader2 className="h-5 w-5 animate-spin" /> : (u.is_active ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{u.is_active ? 'Suspender Cuenta' : 'Activar Cuenta'}</p>
                          <p className="text-[10px] text-zinc-500">{u.is_active ? 'Bloquear acceso temporal' : 'Habilitar acceso normal'}</p>
                        </div>
                      </button>
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
