import { useState } from "react";
import { toast } from "sonner";
import { X, Loader2, UserPlus } from "lucide-react";
import { TIERS } from "../types";

export function CreateUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !name.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), subscriptionTier: tier }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Error ${res.status}`);
      toast.success(data.emailSent
        ? `Cuenta creada · le enviamos un correo para que elija su contraseña`
        : `Cuenta creada · no se pudo enviar el correo, usa "Recuperar acceso" luego`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background/50 backdrop-blur-2xl shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <p className="font-semibold text-foreground">Nuevo usuario</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label htmlFor="new-user-email" className="mb-1.5 block text-xs text-muted-foreground">Correo</label>
            <input
              id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com" autoFocus
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring transition-colors"
            />
          </div>
          <div>
            <label htmlFor="new-user-name" className="mb-1.5 block text-xs text-muted-foreground">Nombre</label>
            <input
              id="new-user-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring transition-colors"
            />
          </div>
          <div>
            <label htmlFor="new-user-tier" className="mb-1.5 block text-xs text-muted-foreground">Plan</label>
            <select
              id="new-user-tier" value={tier} onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring transition-colors"
            >
              {Object.entries(TIERS).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
            </select>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            No se pide contraseña aquí: la cuenta se crea y le llega un correo para que elija la suya.
          </p>
          <button
            onClick={submit}
            disabled={loading || !email.trim() || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
