import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, KeyRound, Loader2 } from "lucide-react";

export function AdminLoginGate() {
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
