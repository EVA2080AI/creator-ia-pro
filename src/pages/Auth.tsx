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
    <div className="flex min-h-screen bg-[#050506] lowercase font-sans selection:bg-[#bd00ff]/30 selection:text-white">
      {/* Left — Features (hidden mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-24 relative overflow-hidden bg-[#121215]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[700px] w-[700px] rounded-full bg-[#bd00ff]/10 blur-[150px]" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#ff0071]/10 blur-[120px]" />
        </div>
        <div className="relative z-10 space-y-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-5 mb-14 group transition-all">
            <div className="flex h-13 w-13 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-[#bd00ff] to-[#ff0071] shadow-[0_0_20px_-5px_rgba(189,0,255,0.4)] group-hover:rotate-6 transition-transform">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black text-white tracking-tighter leading-none">
                creator<span className="text-[#ff0071]">_</span>ia
              </span>
              <span className="text-[9px] font-black text-[#ffb800] uppercase tracking-[0.4em] mt-2">V2.1 Industrial</span>
            </div>
          </button>

          <h2 className="text-7xl font-black text-white leading-none tracking-tighter">
            tu estudio de
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#bd00ff] to-[#ff0071]">ecosistemas ia</span>
            <br />
            autónomos.
          </h2>

          <p className="mt-8 text-slate-400 text-xl max-w-md leading-relaxed font-bold tracking-tight">
            clona, genera y despliega interfaces de alto impacto con el puente antigravity.
          </p>

          <div className="mt-12 space-y-6">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-5 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-[#bd00ff] transition-all group-hover:bg-[#bd00ff]/10 group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-black text-slate-300 lowercase tracking-tight">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-4 text-[11px] font-black text-slate-500 lowercase tracking-[0.2em]">
            <div className="w-2 h-2 rounded-full bg-[#ff0071] shadow-[0_0_12px_#ff0071]" />
            acceso_total_industrial
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center px-6 relative bg-[#050506]">
        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          {/* Mobile logo */}
          <div className="mb-14 text-center lg:hidden">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bd00ff] to-[#ff0071] shadow-[0_0_20px_-5px_rgba(189,0,255,0.4)] cursor-pointer" onClick={() => navigate("/")}>
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter lowercase">
              creator<span className="text-[#ff0071]">_</span>ia
            </h1>
          </div>

          <div className="rounded-[3rem] border border-white/5 bg-[#121215]/80 backdrop-blur-3xl p-12 shadow-[0_0_50px_-12px_rgba(189,0,255,0.15)]">
            <h2 className="mb-3 text-3xl font-black text-white tracking-tighter lowercase">
              {mode === "login" ? "acceso_nexus" : mode === "signup" ? "inicializar_cuenta" : "recuperar_acceso"}
            </h2>
            <p className="mb-12 text-[11px] text-slate-500 font-black lowercase tracking-[0.1em]">
              {mode === "login" ? "bienvenido al ecosistema industrial" : mode === "signup" ? "crea tu perfil de ingeniería creativa" : "recuperación de enlace estable"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "signup" && (
                <div className="space-y-3">
                  <Label htmlFor="displayName" className="text-slate-500 text-[10px] font-black lowercase tracking-[0.2em] ml-2">nombre</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                    <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="tu nombre" className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-[#bd00ff]/30 rounded-2xl pl-12 h-13 text-xs font-bold text-white transition-all ring-0" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-500 text-[10px] font-black lowercase tracking-[0.2em] ml-2">email</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-[#bd00ff]/30 rounded-2xl pl-12 h-13 text-xs font-bold text-white transition-all ring-0" />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-slate-500 text-[10px] font-black lowercase tracking-[0.2em] ml-2">clave_personal</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-white/5 border-white/5 focus:bg-white/[0.08] focus:border-[#bd00ff]/30 rounded-2xl pl-12 pr-12 h-13 text-xs font-bold text-white transition-all ring-0" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-[#bd00ff] transition-colors">
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={() => setMode("forgot")} className="text-[10px] font-black text-slate-600 hover:text-[#bd00ff] transition-colors lowercase tracking-tight">
                    ¿_olvidaste_clave?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-15 bg-gradient-to-r from-[#bd00ff] to-[#ff0071] text-white hover:opacity-90 rounded-2xl gap-4 font-black lowercase text-xs shadow-[0_0_20px_-5px_rgba(189,0,255,0.4)] transition-all active:scale-95 disabled:opacity-50 mt-4">
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    {mode === "login" ? "conectar_estudio" : mode === "signup" ? "solicitar_acceso" : "enviar_enlace"}
                    <ArrowRight className="h-5.5 w-5.5" />
                  </>
                )}
              </Button>
            </form>

            {mode !== "forgot" && (
              <div className="mt-10 space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <span className="relative bg-[#121215] px-4 text-[10px] font-black text-slate-600 lowercase tracking-widest">o_continuar_con</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-13 gap-3 border-white/5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white lowercase transition-all active:scale-95"
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
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-13 gap-3 border-white/5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white lowercase transition-all active:scale-95"
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
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-10 text-center">
              {mode === "forgot" ? (
                <button onClick={() => setMode("login")} className="text-[10px] font-black text-slate-600 hover:text-white transition-colors lowercase tracking-wider">
                  ← volver_al_login
                </button>
              ) : (
                <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[10px] font-black text-slate-600 hover:text-white transition-colors lowercase tracking-wider">
                  {mode === "login" ? "¿no_tienes_cuenta?_regístrate" : "¿ya_tienes_cuenta?_inicia_sesión"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <button onClick={() => navigate("/pricing")} className="text-[10px] font-black text-white hover:text-white transition-colors lowercase tracking-[0.3em] bg-gradient-to-r from-[#bd00ff]/10 to-[#ff0071]/10 px-6 py-3 rounded-2xl border border-[#bd00ff]/30 shadow-2xl shadow-[#bd00ff]/5">
              ver_planes_precios →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
