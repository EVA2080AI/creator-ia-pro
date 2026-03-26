import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, Mail, Shield, Coins, CreditCard, 
  Settings, LogOut, Loader2, Save, Cloud, 
  ChevronRight, Sparkles, Bell
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = () => {
  const { user, signOut } = useAuth("/auth");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [settings, setSettings] = useState<any>({
    nexus_mode: 'creative',
    default_resolution: '1024x1024',
    auto_save_cloud: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        if ((data as any).user_settings) {
          setSettings({ ...settings, ...(data as any).user_settings });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        user_settings: settings
      } as any)
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Error al actualizar perfil");
    } else {
      toast.success("Perfil y preferencias actualizados");
    }
    setSaving(false);
  };

  const handleRecharge = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'conectando con pasarela de pago...',
        success: 'redireccionando a stripe checkout (industrial_v7)...',
        error: 'error de conexión',
      }
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020203]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4ff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white font-sans selection:bg-[#d4ff00]/30 selection:text-[#020203]">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-12">
           <div className="space-y-4">
              <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border-transparent font-black px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">
                user_zone_v8.0
              </Badge>
              <h1 className="text-5xl font-black tracking-tighter text-white lowercase leading-none">
                perfil_de_<span className="text-[#d4ff00]">usuario</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-md lowercase leading-relaxed">
                gestiona tu identidad digital, créditos y preferencias industriales en el ecosistema creator ia pro.
              </p>
           </div>
           <div className="flex gap-3">
              <Button onClick={signOut} variant="outline" className="rounded-2xl h-12 px-6 border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-bold lowercase">
                 <LogOut className="mr-2 h-4 w-4" />
                 cerrar_sesión
              </Button>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2.5rem] border-white/5 bg-[#080809]/60 backdrop-blur-2xl shadow-2xl p-4 overflow-hidden group">
              <CardHeader className="pb-8">
                <div className="flex items-center gap-3 text-[#d4ff00] mb-2 font-black text-xs tracking-widest uppercase opacity-60">
                  <User className="h-4 w-4" />
                  información_personal
                </div>
                <CardTitle className="text-2xl font-black tracking-tight lowercase text-white">detalles de cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">dirección_email</Label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                       <Input 
                        id="email" 
                        value={user?.email} 
                        readOnly 
                        className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl text-slate-400 font-mono text-sm cursor-not-allowed"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">nombre_público</Label>
                    <Input 
                      id="name" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="tu nombre..."
                      className="h-14 bg-white/5 border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:ring-[#d4ff00]/20 focus:border-[#d4ff00]/40 transition-all font-black lowercase"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={saving}
                    className="bg-[#d4ff00] hover:bg-[#c4eb00] text-[#020203] rounded-2xl h-12 px-8 font-black lowercase shadow-2xl shadow-[#d4ff00]/20 active:scale-95 transition-all"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    guardar_cambios_perfil
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#080809]/40 border border-white/5">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#d4ff00] uppercase tracking-widest">nexus_core_mode</span>
                  <p className="text-[11px] text-slate-500 font-bold">prioriza creatividad o precisión visual.</p>
                </div>
                <Select value={settings.nexus_mode} onValueChange={(v) => setSettings({...settings, nexus_mode: v})}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10 rounded-xl h-10 text-[10px] font-black lowercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#020203] border-white/10 text-white">
                    <SelectItem value="creative" className="text-[10px] font-black">creativo</SelectItem>
                    <SelectItem value="precise" className="text-[10px] font-black">preciso</SelectItem>
                    <SelectItem value="fast" className="text-[10px] font-black">veloz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">resolución_default</span>
                  <p className="text-[11px] text-slate-400">tamaño estándar para nuevas generaciones.</p>
                </div>
                <Select value={settings.default_resolution} onValueChange={(v) => setSettings({...settings, default_resolution: v})}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10 rounded-xl h-10 text-[10px] font-black lowercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                    <SelectItem value="1024x1024" className="text-[10px] font-bold">1:1 square</SelectItem>
                    <SelectItem value="1024x1792" className="text-[10px] font-bold">9:16 vertical</SelectItem>
                    <SelectItem value="1792x1024" className="text-[10px] font-bold">16:9 cinematic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="rounded-[2.5rem] border-white/5 bg-[#080809]/60 backdrop-blur-2xl p-8 hover:bg-white/[0.07] transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform shadow-2xl shadow-blue-500/10">
                 <Cloud className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black lowercase mb-2">integración_nube</h3>
              <p className="text-xs text-slate-500 font-bold lowercase mb-6 leading-relaxed">conecta google drive para respaldos automáticos de activos.</p>
              <Button variant="ghost" className="p-0 h-auto text-blue-500 font-black text-xs lowercase gap-2 hover:bg-transparent">
                 vincular_cuenta <ChevronRight className="h-3 w-3" />
              </Button>
            </Card>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-white/5 bg-[#d4ff00] shadow-2xl shadow-[#d4ff00]/20 p-8 text-[#020203] relative overflow-hidden group">
               <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-3xl group-hover:bg-white/30 transition-all" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <Coins className="h-8 w-8 text-[#020203]" />
                     <Badge className="bg-[#020203]/10 text-[#020203] border-transparent backdrop-blur-md rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                        balance_actual
                     </Badge>
                  </div>
                  <div>
                     <span className="text-6xl font-black tracking-tighter leading-none">{profile?.credits_balance || 0}</span>
                     <span className="text-sm font-black opacity-60 ml-2">credits</span>
                  </div>
                  <Button 
                    onClick={handleRecharge}
                    className="w-full bg-[#020203] text-white hover:bg-slate-900 rounded-2xl h-12 font-black lowercase shadow-2xl active:scale-95 transition-all mt-4"
                  >
                     recargar_créditos
                  </Button>
               </div>
            </Card>

            <Card className="rounded-[2.5rem] border-white/5 bg-white/5 backdrop-blur-2xl p-8 space-y-6">
               <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] tracking-widest uppercase opacity-60">
                 <Shield className="h-3.5 w-3.5" />
                 seguridad_y_nivel
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-black text-slate-500 lowercase">plan_actual</span>
                     <Badge className="bg-[#d4ff00]/10 text-[#d4ff00] border-transparent rounded-full px-3 py-1 text-[10px] font-black uppercase">
                        {profile?.subscription_tier || "free_user"}
                     </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-300 lowercase">miembro_desde</span>
                     <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '---'}
                     </span>
                  </div>
               </div>

               <div className="pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">notificaciones_activas</h4>
                   <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <Bell className="h-4 w-4 text-[#d4ff00]" />
                      <span className="text-[10px] font-black text-slate-500 lowercase leading-tight">recibir alertas de balance bajo y actualizaciones nebula.</span>
                   </div>
               </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
