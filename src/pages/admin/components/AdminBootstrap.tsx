import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, RotateCcw, Loader2 } from "lucide-react";

export function AdminBootstrap({ user, onSuccess }: { user: any; onSuccess: () => void }) {
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
