import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff, User, Wand2, ZoomIn, Eraser, Check, Rocket, Shield, Cpu, Key } from "lucide-react";
import { auth } from "@/integrations/lovable/index";

const features = [
  { icon: Wand2, text: "12+ Neural Modules" },
  { icon: ZoomIn, text: "Quantum 4K Upscale" },
  { icon: Eraser, text: "Alpha Matte Removal" },
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
        toast.success("Protocol Sent. Check your endpoint.");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Authentication Successful");
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
        toast.success("Nexus Identity Created. Verify your endpoint.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050506] font-sans selection:bg-aether-purple/30 selection:text-white overflow-hidden">
      {/* Cinematic Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-24 relative overflow-hidden bg-[#0a0a0b] border-r border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[800px] w-[800px] rounded-full bg-aether-purple/5 blur-[150px] animate-pulse" />
          <div className="absolute bottom-10 right-10 h-[600px] w-[600px] rounded-full bg-aether-blue/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 space-y-12">
          <button onClick={() => navigate("/")} className="flex items-center gap-6 mb-16 group transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-2.5xl bg-white shadow-4xl group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="h-7 w-7 text-black" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-3xl font-bold text-white tracking-tighter leading-none font-display uppercase">
                Aether <span className="opacity-40">Evolution</span>
              </span>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.6em] mt-2 font-display">System Protocol 8.0</span>
            </div>
          </button>

          <h2 className="text-7xl xl:text-8xl font-bold text-white leading-[0.85] tracking-tight font-display">
            Manifest <br /> 
            <span className="opacity-30">Vision.</span> <br />
            Orchestrate <br />
            <span className="opacity-10 text-white/50">Anything.</span>
          </h2>

          <p className="mt-10 text-white/30 text-lg max-w-sm leading-relaxed font-medium font-display translate-y-2">
            Initialize your nexus identity to access the global creative orchestration suite.
          </p>

          <div className="mt-16 space-y-8">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-6 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white/20 transition-all group-hover:bg-aether-purple/10 group-hover:border-aether-purple/20 group-hover:text-aether-purple duration-500">
                  <f.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-white/20 group-hover:text-white/60 transition-colors uppercase tracking-[0.2em] font-display">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-24 flex items-center gap-4 text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] font-display">
            <div className="w-2.5 h-2.5 rounded-full bg-aether-purple shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse" />
            Industrial Access Protocol Active
          </div>
        </div>
        
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      {/* Auth Form Panel */}
      <div className="flex flex-1 items-center justify-center px-8 relative bg-[#050506]">
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile cinematic logo */}
          <div className="mb-14 text-center lg:hidden flex flex-col items-center animate-fade-in">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white shadow-3xl cursor-pointer" onClick={() => navigate("/")}>
              <Sparkles className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tighter font-display uppercase">
              Aether <span className="opacity-40">Evolution</span>
            </h1>
          </div>

          <div className="aether-card rounded-[4rem] border border-white/5 p-16 shadow-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden backdrop-blur-3xl group">
            <h2 className="mb-4 text-4xl font-bold text-white tracking-tight font-display uppercase">
              {mode === "login" ? "Init Nexus" : mode === "signup" ? "New Cluster" : "Recovery"}
            </h2>
            <p className="mb-12 text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] font-display">
              {mode === "login" ? "Synchronizing active production clusters" : mode === "signup" ? "Create neural engineering profile" : "Establish stable recovery link"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              {mode === "signup" && (
                <div className="space-y-3">
                  <Label htmlFor="displayName" className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] ml-3 font-display">Operator ID</Label>
                  <div className="relative">
                    <User className="absolute left-7 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/10 group-focus-within:text-aether-purple transition-colors" />
                    <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="OPERATOR_NAME" className="bg-white/[0.03] border-white/5 focus:border-aether-purple/30 rounded-2.5xl pl-16 h-16 text-xs font-bold text-white transition-all ring-0 uppercase font-display placeholder:text-white/5" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] ml-3 font-display">Endpoint</Label>
                <div className="relative">
                  <Mail className="absolute left-7 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/10 group-focus-within:text-aether-purple transition-colors" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="NEURAL@ACCESS.IO" required className="bg-white/[0.03] border-white/5 focus:border-aether-purple/30 rounded-2.5xl pl-16 h-16 text-xs font-bold text-white transition-all ring-0 uppercase font-display placeholder:text-white/5" />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-3 pr-2">
                    <Label htmlFor="password" className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] font-display">Keycode</Label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-[10px] font-bold text-white/10 hover:text-white transition-colors lowercase tracking-widest font-display">
                        lost keycode?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="absolute left-7 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/10 group-focus-within:text-aether-purple transition-colors" />
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-white/[0.03] border-white/5 focus:border-aether-purple/30 rounded-2.5xl pl-16 pr-16 h-16 text-base font-bold text-white transition-all ring-0" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-7 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors p-2">
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-18 bg-white text-black hover:bg-white/90 rounded-3xl gap-5 font-bold uppercase text-xs tracking-[0.2em] shadow-4xl transition-all active:scale-95 disabled:opacity-50 mt-10 font-display">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Synchronize" : mode === "signup" ? "Request Access" : "Send Recovery"}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {mode !== "forgot" && (
              <div className="mt-14 space-y-10 relative z-10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <span className="relative bg-[#0b0b0c] px-6 text-[9px] font-bold text-white/10 uppercase tracking-[0.4em] font-display">Third-Party Sync</span>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 gap-4 border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 rounded-2.5xl text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-all active:scale-95 shadow-2xl font-display"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: REDIRECT_URL }
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-5 w-5 opacity-40 group-hover:opacity-100" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="currentColor"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                    </svg>
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 gap-4 border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 rounded-2.5xl text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-all active:scale-95 shadow-2xl font-display"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "apple",
                        options: { redirectTo: REDIRECT_URL }
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-5 w-5 opacity-40 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-14 text-center relative z-10">
              {mode === "forgot" ? (
                <button onClick={() => setMode("login")} className="text-[11px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-[0.2em] font-display">
                  ← return to init
                </button>
              ) : (
                <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[11px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-[0.2em] font-display">
                  {mode === "login" ? "Initialize new nexus identity" : "Synchronize existing nexus"}
                </button>
              )}
            </div>
            
            {/* Background Grain */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </div>

          <div className="mt-12 text-center animate-fade-in delay-500">
            <button onClick={() => navigate("/pricing")} className="group text-[10px] font-bold text-white/10 hover:text-white transition-all uppercase tracking-[0.4em] bg-white/[0.01] px-12 py-5 rounded-[2rem] border border-white/5 shadow-2xl hover:bg-white/[0.03] font-display">
              Review protocols <ArrowRight className="inline ml-3 w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Auth;
