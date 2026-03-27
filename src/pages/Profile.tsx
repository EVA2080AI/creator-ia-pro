import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import {
  User, Mail, Shield, Coins, Settings, LogOut, Loader2, Save,
  Camera, Calendar, CreditCard, ChevronRight, Bell, Check,
  Image, MessageSquare, Zap, Download
} from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth("/auth");
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile]               = useState<any>(null);
  const [displayName, setDisplayName]       = useState("");
  const [avatarUrl, setAvatarUrl]           = useState<string | null>(null);
  const [creditHistory, setCreditHistory]   = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [{ data: prof }, { data: history }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (prof) {
        setProfile(prof);
        setDisplayName(prof.display_name || "");
        setAvatarUrl(prof.avatar_url || null);
      }
      if (history) setCreditHistory(history);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB para el avatar"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("user_id", user.id);
      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil actualizada");
    } catch (err: any) {
      toast.error(err?.message || "Error al subir imagen");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: displayName } as any).eq("user_id", user?.id);
    if (error) toast.error("Error al guardar cambios");
    else { toast.success("Perfil actualizado"); setProfile((p: any) => ({ ...p, display_name: displayName })); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <Loader2 className="h-8 w-8 animate-spin text-aether-purple" />
      </div>
    );
  }

  const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", creator: "Creator", agency: "Agency", educacion: "Educación", pro: "Pro", business: "Business" };
  const tierLabel = TIER_LABELS[profile?.subscription_tier ?? "free"] ?? "Free";
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-2">Mi cuenta</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">Perfil</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Identity card */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-8">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Información personal</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 group"
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-aether-purple animate-spin" />
                    </div>
                  ) : avatarUrl ? (
                    <>
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <User className="w-7 h-7 text-white/20" />
                      <span className="text-[9px] text-white/20 font-bold group-hover:text-white/40 transition-colors">Subir</span>
                    </div>
                  )}
                </button>
                <div>
                  <p className="font-semibold text-white text-base">{profile?.display_name || "Sin nombre"}</p>
                  <p className="text-sm text-white/40 mt-0.5">{user?.email}</p>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs text-aether-purple hover:text-white transition-colors mt-2 font-medium"
                  >
                    Cambiar foto
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Correo electrónico</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <Mail className="w-4 h-4 text-white/20 shrink-0" />
                    <span className="text-sm text-white/40">{user?.email}</span>
                    <span className="ml-auto text-[10px] font-bold text-aether-purple bg-aether-purple/10 px-2 py-0.5 rounded-full">Verificado</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Nombre para mostrar</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tu nombre..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 focus:border-aether-purple/40 focus:outline-none text-sm text-white placeholder:text-white/20 transition-colors"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            {creditHistory.length > 0 && (
              <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-8">
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Últimas transacciones</h2>
                <div className="space-y-3">
                  {creditHistory.map((tx: any) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-green-500/10" : "bg-white/5"}`}>
                        {tx.action === "image" || tx.action === "generate" ? <Image className="w-3.5 h-3.5 text-white/40" /> :
                         tx.action === "chat" ? <MessageSquare className="w-3.5 h-3.5 text-white/40" /> :
                         <Zap className="w-3.5 h-3.5 text-white/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/70 truncate capitalize">{tx.action || "Acción"}</p>
                        <p className="text-xs text-white/30">{new Date(tx.created_at).toLocaleDateString("es-ES")}</p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${tx.amount > 0 ? "text-green-400" : "text-white/40"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-5">

            {/* Credits card */}
            <div className="rounded-3xl bg-white text-black p-8">
              <div className="flex items-center justify-between mb-4">
                <Coins className="w-7 h-7 text-black/30" />
                <span className="text-xs font-bold text-black/30 uppercase tracking-widest">Créditos</span>
              </div>
              <div className="mb-6">
                <span className="text-6xl font-bold tracking-tight tabular-nums">{profile?.credits_balance ?? 0}</span>
                <span className="text-sm text-black/30 ml-2 font-medium">disponibles</span>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="w-full py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-black/80 transition-all active:scale-95"
              >
                Recargar créditos
              </button>
            </div>

            {/* Plan card */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">Plan actual</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-aether-purple/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-aether-purple" />
                </div>
                <div>
                  <p className="font-bold text-white">{tierLabel}</p>
                  <p className="text-xs text-white/30">Plan activo</p>
                </div>
              </div>
              {tierLabel === "Free" && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-aether-purple/10 border border-aether-purple/20 text-aether-purple text-sm font-bold hover:bg-aether-purple/20 transition-all"
                >
                  Actualizar a Starter o superior
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Account info */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">Detalles de cuenta</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-white/20 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Miembro desde</p>
                    <p className="text-sm font-medium text-white/70">{joinDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-white/20 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Notificaciones</p>
                    <p className="text-sm font-medium text-white/70">Activas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-400/50 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Email verificado</p>
                    <p className="text-sm font-medium text-green-400/70">Confirmado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download app */}
            <button
              onClick={() => navigate("/descargar")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-aether-blue/60" />
                Descargar App
              </div>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </button>

            {/* Sign out */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/5 text-sm font-medium text-white/30 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
