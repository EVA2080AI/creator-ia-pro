import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff, User, Wand2, ZoomIn, Eraser, Check } from "lucide-react";
import { auth } from "@/integrations/lovable/index";

const features = [
  { icon: Wand2, text: "12+ herramientas IA" },
  { icon: ZoomIn, text: "Upscale hasta 4x" },
  { icon: Eraser, text: "Elimina fondos y objetos" },
];

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const REDIRECT_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? `${window.location.origin}/dashboard`
    : "https://creator-ia.com/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: REDIRECT_URL.replace("/dashboard", "/reset-password"),
        });
        if (error) throw error;
        toast.success("¡Email enviado! Revisa tu bandeja.");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { 
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: REDIRECT_URL
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050506] font-sans selection:bg-white/10 selection:text-white">
      {/* Left — Features (hidden mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-24 relative overflow-hidden bg-[#0a0a0b]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[700px] w-[700px] rounded-full bg-white/[0.03] blur-[150px]" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
        </div>
        <div className="relative z-10 space-y-12">
          <button onClick={() => navigate("/")} className="flex items-center gap-6 mb-16 group transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-3xl shadow-white/10 group-hover:rotate-6 transition-transform">
              <Sparkles className="h-7 w-7 text-black" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xl font-black text-white tracking-tighter leading-none lowercase">
                nexus_ <span className="text-white/40">system_v7</span>
              </span>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] mt-2">Industrial_grade_core</span>
            </div>
          </button>

          <h2 className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter lowercase">
            neural_
            <br />
            <span className="text-white/40">studio_</span>
            <br />
            cluster.
          </h2>

          <p className="mt-10 text-white/20 text-sm max-w-sm leading-relaxed font-bold lowercase tracking-wide">
            orchestrate, generate, and deploy high-density interfaces with the antigravity bridge engine.
          </p>

          <div className="mt-14 space-y-7">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-6 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white/40 transition-all group-hover:bg-white/10 group-hover:scale-105">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-20 flex items-center gap-4 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse" />
            industrial_access_granted
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center px-6 relative bg-[#050506]">
        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          {/* Mobile logo */}
          <div className="mb-14 text-center lg:hidden">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-3xl shadow-white/10 cursor-pointer" onClick={() => navigate("/")}>
              <Sparkles className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter lowercase">
              nexus_ <span className="text-white/40">system</span>
            </h1>
          </div>

          <div className="rounded-[3.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl p-14 shadow-3xl shadow-white/5">
            <h2 className="mb-4 text-3xl font-black text-white tracking-tighter lowercase">
              {mode === "login" ? "init_nexus" : mode === "signup" ? "register_account" : "recovery_node"}
            </h2>
            <p className="mb-14 text-[9px] text-white/10 font-black uppercase tracking-[0.3em] leading-none">
              {mode === "login" ? "access granted to industrial active clusters" : mode === "signup" ? "create neural engineering profile" : "establish stable recovery link"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-7">
              {mode === "signup" && (
                <div className="space-y-3">
                  <Label htmlFor="displayName" className="text-white/10 text-[9px] font-black uppercase tracking-[0.3em] ml-2">identifier</Label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-white/10" />
                    <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="OPERATOR_NAME" className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-white/20 rounded-2xl pl-14 h-14 text-[10px] font-black text-white transition-all ring-0 uppercase" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-white/10 text-[9px] font-black uppercase tracking-[0.3em] ml-2">neural_endpoint</Label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-white/10" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ENDPOINT@NEXUS.COM" required className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-white/20 rounded-2xl pl-14 h-14 text-[10px] font-black text-white transition-all ring-0 uppercase" />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white/10 text-[9px] font-black uppercase tracking-[0.3em] ml-2">access_key</Label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-white/10" />
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-white/20 rounded-2xl pl-14 pr-14 h-14 text-xs font-black text-white transition-all ring-0" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={() => setMode("forgot")} className="text-[9px] font-black text-white/10 hover:text-white transition-colors lowercase tracking-widest">
                    recover_access_node_?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-[1.5rem] gap-4 font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl shadow-white/5 transition-all active:scale-95 disabled:opacity-50 mt-6">
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <>
                    {mode === "login" ? "initialize_nexus" : mode === "signup" ? "request_cluster_access" : "send_recovery_node"}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {mode !== "forgot" && (
              <div className="mt-12 space-y-8">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <span className="relative bg-[#050506] px-5 text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">alternative_orchestration</span>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 gap-4 border-white/5 bg-white/[0.02] hover:bg-white/5 rounded-2xl text-[10px] font-black text-white/40 hover:text-white lowercase tracking-widest transition-all active:scale-95 shadow-2xl"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: REDIRECT_URL,
                        }
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" fillOpacity="0.4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" fillOpacity="0.3"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" fillOpacity="0.2"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" fillOpacity="0.3"/>
                    </svg>
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 gap-4 border-white/5 bg-white/[0.02] hover:bg-white/5 rounded-2xl text-[10px] font-black text-white/40 hover:text-white lowercase tracking-widest transition-all active:scale-95 shadow-2xl"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "apple",
                        options: {
                          redirectTo: REDIRECT_URL,
                        }
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.4">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-12 text-center">
              {mode === "forgot" ? (
                <button onClick={() => setMode("login")} className="text-[10px] font-black text-white/20 hover:text-white transition-colors lowercase tracking-[0.2em]">
                  ← return_to_init
                </button>
              ) : (
                <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[10px] font-black text-white/20 hover:text-white transition-colors lowercase tracking-[0.2em]">
                  {mode === "login" ? "initialize_new_nexus_identity" : "authenticate_existing_nexus"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button onClick={() => navigate("/pricing")} className="text-[9px] font-black text-white/10 hover:text-white transition-colors uppercase tracking-[0.5em] bg-white/[0.01] px-10 py-4.5 rounded-[1.5rem] border border-white/5 shadow-3xl shadow-white/5 transition-all active:scale-95 hover:bg-white/[0.03]">
              review_nexus_tiers →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Auth;
