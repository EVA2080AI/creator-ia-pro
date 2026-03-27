import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Mail, Shield, Coins,
  Settings, LogOut, Loader2, Save, Cloud,
  ChevronRight, Bell, Zap, Cpu, History, Camera
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
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
        setAvatarUrl(data.avatar_url || null);
        if ((data as any).user_settings) {
          setSettings({ ...settings, ...(data as any).user_settings });
        }
      }
      setLoading(false);
    };
    fetchProfile();
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
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("user_id", user.id);
      setAvatarUrl(publicUrl);
      toast.success("Avatar sincronizado con éxito");
    } catch (err: any) {
      toast.error(err?.message || "Error al subir avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

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
      toast.error("Protocol update synchronization failed");
    } else {
      toast.success("Nexus profile & preferences synchronized");
    }
    setSaving(false);
  };

  const handleRecharge = () => {
    navigate("/pricing");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050506]">
        <Loader2 className="h-10 w-10 animate-spin text-aether-purple shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white font-sans selection:bg-aether-purple/30 selection:text-white font-sans overflow-hidden">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <main className="container mx-auto px-8 py-24 max-w-7xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-b border-white/5 pb-16 relative">
           <div className="space-y-6 relative">
              <Badge className="bg-aether-purple/10 text-aether-purple border-aether-purple/20 font-bold px-6 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase font-display">
                Neural Zone v8.0 [Active]
              </Badge>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white uppercase leading-none font-display">
                Nexus <br /><span className="opacity-30">Identity.</span>
              </h1>
              <p className="text-white/20 font-medium max-w-lg uppercase tracking-[0.2em] text-xs leading-loose font-display italic">
                Manage your digital industrial core, manifestation credits, and neural orchestration preferences.
              </p>
           </div>
           <div className="flex gap-4">
              <Button onClick={signOut} variant="outline" className="aether-card rounded-2xl h-16 px-10 border-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all font-bold uppercase text-[10px] tracking-widest font-display">
                 <LogOut className="mr-3 h-4 w-4" />
                 Disconnect
              </Button>
           </div>
           
           {/* Glow behind header */}
           <div className="absolute -left-20 -top-20 w-[500px] h-[500px] bg-aether-purple/5 blur-[120px] pointer-events-none -z-10" />
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Core Configuration */}
          <div className="lg:col-span-2 space-y-12">
            <Card className="aether-card rounded-[3.5rem] border-white/5 p-12 overflow-hidden relative group">
              <CardHeader className="p-0 border-none space-y-6 mb-12">
                <div className="flex items-center gap-4 text-aether-purple mb-2 font-bold text-[10px] tracking-[0.4em] uppercase opacity-60 font-display">
                  <User className="h-4 w-4" />
                  Operator Credentials
                </div>
                <CardTitle className="text-4xl font-bold tracking-tight uppercase text-white font-display">Core Identity</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-10">
                {/* Avatar Upload */}
                <div className="flex items-center gap-8">
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="avatar-upload-zone w-20 h-20 rounded-[1.5rem] border border-white/10 overflow-hidden bg-white/5 flex-shrink-0"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-aether-purple animate-spin" />
                      </div>
                    ) : avatarUrl ? (
                      <>
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        <div className="avatar-overlay">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white/20" />
                        <div className="avatar-overlay">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest font-display">Avatar Operador</p>
                    <p className="text-[10px] text-white/20 font-display uppercase tracking-widest">PNG, JPG — Máx 2MB</p>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-[10px] font-bold text-aether-purple hover:text-white transition-colors uppercase tracking-widest font-display flex items-center gap-1.5 mt-2"
                    >
                      <Camera className="w-3 h-3" /> Cambiar Foto
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 md:gap-16">
                  <div className="space-y-4">
                    <Label htmlFor="email" className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] ml-4 font-display">Nexus Endpoint</Label>
                    <div className="relative">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/5" />
                       <Input 
                        id="email" 
                        value={user?.email} 
                        readOnly 
                        className="h-18 pl-18 bg-white/[0.02] border-white/5 rounded-3xl text-white/30 font-display text-sm cursor-not-allowed group-hover:bg-white/[0.04]"
                       />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="name" className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] ml-4 font-display">Operator Signature</Label>
                    <div className="relative">
                       <Cpu className="absolute left-6 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/10 group-focus-within:text-aether-purple transition-colors" />
                       <Input 
                        id="name" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="ENTER_SIGNATURE..."
                        className="h-18 pl-18 bg-white/[0.03] border-white/5 rounded-3xl text-white placeholder:text-white/5 focus:border-aether-purple/30 transition-all font-bold uppercase text-xs font-display tracking-widest"
                       />
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 flex justify-end">
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={saving}
                    className="bg-white text-black hover:bg-white/90 rounded-2.5xl h-18 px-12 font-bold uppercase text-[11px] tracking-[0.3em] shadow-4xl active:scale-95 transition-all font-display"
                  >
                    {saving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
                    Synchronize Core
                  </Button>
                </div>
              </CardContent>
              
              {/* Noise overlay */}
              <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            </Card>

            {/* Orchestration Preferences */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-white/20 uppercase tracking-[0.5em] ml-6 mb-8 font-display flex items-center gap-3">
                 <Settings className="w-3 h-3" /> Orchestration Layers
              </h3>
              
              <div className="flex items-center justify-between p-8 rounded-[2rem] aether-card border border-white/5 group hover:border-aether-purple/20 duration-500">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-aether-purple uppercase tracking-[0.4em] font-display">Neural Engine Mode</span>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Prioritize creative chaos or industrial precision.</p>
                </div>
                <Select value={settings.nexus_mode} onValueChange={(v) => setSettings({...settings, nexus_mode: v})}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10 rounded-2xl h-14 text-[10px] font-bold uppercase tracking-widest font-display text-white focus:ring-aether-purple/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0c]/90 backdrop-blur-3xl border-white/10 text-white rounded-2xl">
                    <SelectItem value="creative" className="text-[10px] font-bold uppercase tracking-widest py-3">Recursive</SelectItem>
                    <SelectItem value="precise" className="text-[10px] font-bold uppercase tracking-widest py-3">Deterministic</SelectItem>
                    <SelectItem value="fast" className="text-[10px] font-bold uppercase tracking-widest py-3">Real-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-8 rounded-[2rem] aether-card border border-white/5 group hover:border-aether-blue/20 duration-500">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-aether-blue uppercase tracking-[0.4em] font-display">Manifestation Scale</span>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest font-display">Default industrial density for new nodes.</p>
                </div>
                <Select value={settings.default_resolution} onValueChange={(v) => setSettings({...settings, default_resolution: v})}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10 rounded-2xl h-14 text-[10px] font-bold uppercase tracking-widest font-display text-white focus:ring-aether-blue/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0c]/90 backdrop-blur-3xl border-white/10 text-white rounded-2xl">
                    <SelectItem value="1024x1024" className="text-[10px] font-bold uppercase py-3">1:1 Cinematic</SelectItem>
                    <SelectItem value="1024x1792" className="text-[10px] font-bold uppercase py-3">9:16 Vertical</SelectItem>
                    <SelectItem value="1792x1024" className="text-[10px] font-bold uppercase py-3">16:9 Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="rounded-[3rem] aether-card border-white/5 p-10 group hover:border-aether-blue/10 duration-700 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-10">
                 <div className="h-20 w-20 rounded-[2rem] bg-aether-blue/10 flex items-center justify-center text-aether-blue group-hover:scale-110 transition-transform shadow-4xl shadow-aether-blue/10">
                    <Cloud className="h-10 w-10" />
                 </div>
                 <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tight font-display">Cloud Vault Integration</h3>
                    <p className="text-[11px] text-white/20 font-bold uppercase tracking-[0.2em] leading-relaxed font-display">Synchronize with Google Drive for real-time asset persistence & neural backups.</p>
                 </div>
                 <Button variant="ghost" className="h-14 px-8 aether-card border border-white/5 text-aether-blue font-bold text-[10px] uppercase tracking-widest gap-3 hover:bg-aether-blue/5 transition-all font-display">
                    Link Vault <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
            </Card>
          </div>

          {/* Industrial Utility Column */}
          <div className="space-y-12">
            <Card className="aether-card rounded-[3.5rem] bg-white border-transparent p-12 text-black relative overflow-hidden group shadow-5xl">
               <div className="absolute right-0 top-0 h-64 w-64 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between">
                     <Coins className="h-10 w-10 text-black/20" />
                     <Badge className="bg-black/5 text-black border-transparent rounded-full px-5 py-2 text-[9px] font-bold uppercase tracking-[0.4em] font-display">
                        Neural Charge
                     </Badge>
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] font-display">Active Balance</h4>
                     <div className="flex items-baseline gap-4">
                        <span className="text-8xl font-bold tracking-tighter leading-none font-display shimmer-text">{profile?.credits_balance || 0}</span>
                        <span className="text-xs font-bold text-black/20 uppercase tracking-widest font-display">units</span>
                     </div>
                  </div>
                  <Button 
                    onClick={handleRecharge}
                    className="w-full bg-black text-white hover:bg-black/90 rounded-[1.8rem] h-18 font-bold uppercase text-[11px] tracking-[0.4em] shadow-4xl active:scale-95 transition-all font-display"
                  >
                     Refill Charge
                  </Button>
               </div>
            </Card>

            <div className="space-y-8">
               <h3 className="text-xs font-bold text-white/20 uppercase tracking-[0.5em] ml-6 font-display flex items-center gap-3">
                  <Shield className="w-3 h-3" /> Security Protocol
               </h3>
               
               <Card className="rounded-[2.5rem] aether-card border-white/5 p-10 space-y-8 group hover:border-white/10 duration-700">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">Active Protocol</span>
                    <Badge className="bg-aether-purple/10 text-aether-purple border-aether-purple/20 rounded-full px-5 py-2 text-[9px] font-bold uppercase tracking-widest font-display">
                       {profile?.subscription_tier || "Primary Sync"}
                    </Badge>
                 </div>
                 
                 <div className="h-px bg-white/5 w-full" />
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest font-display group-hover/item:text-white/30 transition-colors flex items-center gap-3">
                          <History className="w-3.5 h-3.5" /> Established
                       </span>
                       <span className="text-[10px] font-bold text-white/30 uppercase font-display tracking-widest">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '---'}
                       </span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest font-display group-hover/item:text-white/30 transition-colors flex items-center gap-3">
                          <Bell className="w-3.5 h-3.5" /> Notifications
                       </span>
                       <div className="w-10 h-5 rounded-full bg-aether-purple/20 border border-aether-purple/30 relative flex items-center px-1">
                          <div className="w-3 h-3 rounded-full bg-aether-purple shadow-[0_0_8px_rgba(168,85,247,0.8)] translate-x-5" />
                       </div>
                    </div>
                 </div>

                 <div className="pt-4">
                    <div className="p-5 rounded-2.5xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                       <Zap className="h-4 w-4 text-aether-purple shrink-0 mt-0.5" />
                       <span className="text-[10px] font-bold text-white/10 uppercase leading-relaxed font-display tracking-widest">Receiving alerts for low charge and nebula system updates.</span>
                    </div>
                 </div>
               </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Background Evolution Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 h-[800px] w-[800px] rounded-full bg-aether-purple/5 blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 h-[700px] w-[700px] rounded-full bg-aether-blue/5 blur-[120px]" />
      </div>

      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
    </div>
  );
};

export default Profile;
