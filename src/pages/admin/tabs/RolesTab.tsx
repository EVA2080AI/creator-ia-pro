import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Search, Loader2, CheckCircle, Plus } from "lucide-react";
import { AdminUser } from "../types";
import type { PostgrestResponse } from "@supabase/supabase-js";

// ─── Custom Types for Missing RPCs ──────────────────────────────────────────
interface SupabaseCustom {
  rpc(name: string, args: Record<string, any>): Promise<PostgrestResponse<any>>;
}

const ROLES_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  admin:     { label: 'Admin',     color: '#EF4444', desc: 'Acceso total al panel de control' },
  moderator: { label: 'Moderador', color: '#F59E0B', desc: 'Puede moderar contenido de usuarios' },
};

export function RolesTab({ users, currentUserEmail }: {
  users: AdminUser[];
  currentUserEmail: string;
}) {
  const [search, setSearch] = useState('');
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleActionLoading, setRoleActionLoading] = useState<string | null>(null);

  const fetchAllRoles = useCallback(async () => {
    setLoadingRoles(true);
    const result: Record<string, string[]> = {};
    const sb = (supabase as unknown) as SupabaseCustom;
    
    await Promise.all(
      users.map(async (u) => {
        const { data } = await sb.rpc('admin_get_user_roles', { _target_user_id: u.user_id });
        result[u.user_id] = (data || []).map((r: { role: string }) => r.role);
      })
    );
    setUserRoles(result);
    setLoadingRoles(false);
  }, [users]);

  useEffect(() => { fetchAllRoles(); }, [fetchAllRoles]);

  const handleToggleRole = async (userId: string, role: string, currentlyHas: boolean) => {
    const key = `${userId}-${role}`;
    setRoleActionLoading(key);
    const sb = (supabase as unknown) as SupabaseCustom;
    
    const { error } = await sb.rpc('admin_set_role', {
      _target_user_id: userId,
      _role: role,
      _grant: !currentlyHas,
    });
    
    if (error) toast.error(error.message);
    else {
      toast.success(`Rol "${role}" ${!currentlyHas ? 'asignado' : 'removido'}`);
      await fetchAllRoles();
    }
    setRoleActionLoading(null);
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {Object.entries(ROLES_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: cfg.color + '30', color: cfg.color, background: cfg.color + '08' }}>
            <Shield className="h-3 w-3" />
            {cfg.label} — <span className="font-normal opacity-70">{cfg.desc}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          placeholder="Buscar usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
        />
      </div>

      {loadingRoles ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
            <span>Usuario</span>
            {Object.entries(ROLES_CONFIG).map(([key, cfg]) => (
              <span key={key} style={{ color: cfg.color }}>{cfg.label}</span>
            ))}
          </div>
          <div className="divide-y divide-zinc-100">
            {filtered.map(u => {
              const roles = userRoles[u.user_id] || [];
              const isCurrentUser = u.email === currentUserEmail;
              const initials = (u.display_name || u.email || '?')[0].toUpperCase();
              return (
                <div key={u.user_id} className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-zinc-50/50 transition-colors ${isCurrentUser ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {u.display_name || u.email}
                        {isCurrentUser && <span className="ml-2 text-[9px] font-black text-blue-400 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">TÚ</span>}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{u.email}</p>
                    </div>
                  </div>
                  {Object.entries(ROLES_CONFIG).map(([roleKey, cfg]) => {
                    const hasRole = roles.includes(roleKey);
                    const k = `${u.user_id}-${roleKey}`;
                    const busy = roleActionLoading === k;
                    const cantRevoke = roleKey === 'admin' && isCurrentUser;
                    return (
                      <button key={roleKey} disabled={busy || cantRevoke}
                        onClick={() => handleToggleRole(u.user_id, roleKey, hasRole)}
                        title={cantRevoke ? 'No puedes remover tu propio rol de Admin' : (hasRole ? `Remover ${cfg.label}` : `Asignar ${cfg.label}`)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all border disabled:cursor-not-allowed ${
                          hasRole ? 'border-current shadow-sm' : 'border-zinc-200 text-zinc-300 hover:border-zinc-300'
                        } ${cantRevoke ? 'opacity-50' : ''}`}
                        style={hasRole ? { background: cfg.color + '15', color: cfg.color, borderColor: cfg.color + '40' } : {}}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : hasRole ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && <div className="py-12 text-center text-sm text-zinc-400">Sin usuarios</div>}
        </div>
      )}
    </div>
  );
}
