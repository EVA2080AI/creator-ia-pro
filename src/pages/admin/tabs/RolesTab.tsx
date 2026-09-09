import { useState } from "react";
import { toast } from "sonner";
import { Shield, Search, Loader2, CheckCircle, Plus } from "lucide-react";
import { AdminUser } from "../types";

// El único rol real hoy es `profile.is_admin` (ver db/schema/auth.ts) — el
// viejo sistema de Supabase tenía una tabla `user_roles` con "moderator"
// además de "admin", pero nada en el código actual comprueba un rol de
// moderador, así que no se recreó al migrar. Si hace falta en el futuro,
// agregar la columna a `profile` y un endpoint análogo a este.
export function RolesTab({ users, currentUserEmail, onRefresh }: {
  users: AdminUser[];
  currentUserEmail: string;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentlyAdmin }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Error ${res.status}`);
      toast.success(`Admin ${!currentlyAdmin ? 'asignado' : 'removido'}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar el rol");
    } finally {
      setBusyUserId(null);
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: '#EF444430', color: '#EF4444', background: '#EF444408' }}>
          <Shield className="h-3 w-3" />
          Admin — <span className="font-normal opacity-70">Acceso total al panel de control</span>
        </div>
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

      <div className="rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
          <span>Usuario</span>
          <span style={{ color: '#EF4444' }}>Admin</span>
        </div>
        <div className="divide-y divide-zinc-100">
          {filtered.map(u => {
            const isCurrentUser = u.email === currentUserEmail;
            const initials = (u.display_name || u.email || '?')[0].toUpperCase();
            const busy = busyUserId === u.user_id;
            const cantRevoke = isCurrentUser && u.is_admin;
            return (
              <div key={u.user_id} className={`grid grid-cols-[1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-zinc-50/50 transition-colors ${isCurrentUser ? 'bg-blue-50/30' : ''}`}>
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
                <button disabled={busy || cantRevoke}
                  onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                  title={cantRevoke ? 'No puedes remover tu propio rol de Admin' : (u.is_admin ? 'Remover Admin' : 'Asignar Admin')}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all border disabled:cursor-not-allowed ${
                    u.is_admin ? 'border-current shadow-sm' : 'border-zinc-200 text-zinc-300 hover:border-zinc-300'
                  } ${cantRevoke ? 'opacity-50' : ''}`}
                  style={u.is_admin ? { background: '#EF444415', color: '#EF4444', borderColor: '#EF444440' } : {}}
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : u.is_admin ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-zinc-400">Sin usuarios</div>}
      </div>
    </div>
  );
}
