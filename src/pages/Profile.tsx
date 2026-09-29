import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import {
  User, Mail, Shield, Coins, LogOut, Loader2, Save,
  Calendar, CreditCard, ChevronRight, Bell, Check,
  Image, MessageSquare, Zap, Download, Link as LinkIcon, Sun, Moon,
} from "lucide-react";

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

const TX_META: Record<string, { label: string; positive: boolean }> = {
  purchase: { label: "Compra", positive: true },
  spend: { label: "Uso de IA", positive: false },
  admin_grant: { label: "Créditos de soporte", positive: true },
  admin_deduct: { label: "Ajuste de soporte", positive: false },
  refund: { label: "Reembolso", positive: true },
  bold_pending: { label: "Pago en proceso", positive: true },
  bold_approved: { label: "Pago aprobado", positive: true },
  subscription_change: { label: "Cambio de plan", positive: true },
};

const Profile = () => {
  const { user, signOut } = useAuth("/auth");
  const navigate = useNavigate();
  const { profile, loading: loadingProfile, refreshProfile } = useProfile(user?.id);
  const { resolvedTheme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [creditHistory, setCreditHistory] = useState<TransactionRow[]>([]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.displayName ?? "");
    setAvatarUrlInput(profile.avatarUrl ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/billing/transactions", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.ok) setCreditHistory((json.transactions ?? []).slice(0, 5));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      const trimmedName = fullName.trim();
      const trimmedAvatar = avatarUrlInput.trim();
      if (trimmedName && trimmedName !== (profile?.displayName ?? "")) body.displayName = trimmedName;
      if (trimmedAvatar !== (profile?.avatarUrl ?? "")) {
        if (trimmedAvatar && !/^https?:\/\//.test(trimmedAvatar)) {
          toast.error("La URL de la foto debe empezar con http:// o https://");
          setSaving(false);
          return;
        }
        body.avatarUrl = trimmedAvatar;
      }
      if (Object.keys(body).length === 0) {
        toast.info("No hay cambios que guardar");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || "Error al guardar cambios");
      } else {
        toast.success("Perfil actualizado");
        await refreshProfile();
      }
    } catch {
      toast.error("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile && !profile) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const TIER_LABELS: Record<string, string> = { free: "Free", creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme", pymes: "Pymes", admin: "Admin" };
  const tierLabel = TIER_LABELS[profile?.subscriptionTier ?? "free"] ?? "Free";
  const renewsLabel = profile?.subscriptionExpiresAt
    ? new Date(profile.subscriptionExpiresAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <>
      <Helmet><title>Perfil | Creator IA Pro</title></Helmet>

      <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Mi cuenta</p>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Perfil</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Identity card */}
            <div className="rounded-3xl bg-card/70 border border-border/60 p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Información personal</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-base">{profile?.displayName || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Correo electrónico</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                    <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Verificado</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="full-name" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Nombre completo</label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre..."
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary/40 focus:bg-card focus:outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="avatar-url" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Foto de perfil (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
                    <input
                      id="avatar-url"
                      type="url"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/mi-foto.jpg"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary/40 focus:bg-card focus:outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            {creditHistory.length > 0 && (
              <div className="rounded-3xl bg-card/70 border border-border/60 p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20 backdrop-blur-sm">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Últimas transacciones</h2>
                <div className="space-y-3">
                  {creditHistory.map((tx) => {
                    const meta = TX_META[tx.type] ?? { label: tx.type, positive: tx.amount > 0 };
                    return (
                      <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.positive ? "bg-green-500/10" : "bg-muted"}`}>
                          {tx.type === "spend" && tx.description?.startsWith("image") ? <Image className="w-3.5 h-3.5 text-muted-foreground" /> :
                           tx.type === "spend" ? <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> :
                           <Zap className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-muted-foreground truncate">{meta.label}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("es-ES")}</p>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${meta.positive ? "text-green-400" : "text-muted-foreground"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-5">

            {/* Credits card */}
            <div className="rounded-3xl bg-primary text-primary-foreground p-8">
              <div className="flex items-center justify-between mb-4">
                <Coins className="w-7 h-7 text-primary-foreground/50" />
                <span className="text-xs font-bold text-primary-foreground/60 uppercase tracking-widest">Créditos</span>
              </div>
              <div className="mb-6">
                <span className="text-6xl font-bold tracking-tight tabular-nums">{profile?.creditsBalance ?? 0}</span>
                <span className="text-sm text-primary-foreground/60 ml-2 font-medium">disponibles</span>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="w-full py-3 bg-primary-foreground/20 text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary-foreground/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Ver planes
              </button>
            </div>

            {/* Plan card */}
            <div className="rounded-3xl bg-muted/50 border border-border p-6 space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Plan actual</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{tierLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {renewsLabel ? `Se renueva el ${renewsLabel}` : "Plan activo"}
                  </p>
                </div>
              </div>
              {renewsLabel && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted border border-border text-muted-foreground text-sm font-bold hover:bg-accent transition-all"
                >
                  Renovar ahora
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {tierLabel === "Free" && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/20 transition-all"
                >
                  Mejorar mi plan
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Account info */}
            <div className="rounded-3xl bg-muted/50 border border-border p-6 space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Detalles de cuenta</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Miembro desde</p>
                    <p className="text-sm font-medium text-muted-foreground">{joinDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notificaciones</p>
                    <p className="text-sm font-medium text-muted-foreground">Activas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-400/50 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email verificado</p>
                    <p className="text-sm font-medium text-green-400/70">Confirmado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias — el toggle de modo oscuro vivía en el sidebar
                principal, compitiendo con la navegación; es una preferencia
                de cuenta, así que se movió acá (auditoría UX). */}
            <div className="rounded-3xl bg-muted/50 border border-border p-6 space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preferencias</h2>
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted border border-border text-sm font-bold text-foreground hover:bg-accent transition-all"
              >
                <div className="flex items-center gap-3">
                  {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                  {resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Download app */}
            <button
              onClick={() => navigate("/descargar")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-primary/60" />
                Descargar App
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Sign out */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;