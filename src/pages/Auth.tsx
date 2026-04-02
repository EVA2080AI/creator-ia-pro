import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowRight, Mail, Eye, EyeOff, User, Image,
  FileText, Wand2, Loader2, Lock, Check, Code2
} from "lucide-react";
import { Logo } from "@/components/Logo";

const features = [
  { icon: Code2, text: "Genesis IDE — genera apps React completas con IA" },
  { icon: Image, text: "Studio — imágenes, logos, videos y más" },
  { icon: Wand2, text: "Canvas creativo — flujos de producción visuales" },
];

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const REDIRECT_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
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
        toast.success("Enlace enviado. Revisa tu correo.");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada correctamente.");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: REDIRECT_URL,
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Verifica tu correo para continuar.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background bg-grid-white/[0.02] font-sans selection:bg-primary/15 selection:text-zinc-900 overflow-hidden">

      {/* Left Panel — Value Prop */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between px-16 py-16 relative overflow-hidden bg-zinc-50 border-r border-zinc-200">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[700px] w-[700px] rounded-full bg-primary/6 blur-[160px]" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        {/* Top — Logo */}
        <div className="relative z-10">
          <Logo size="md" showText showPro onClick={() => navigate("/")} />
        </div>

        {/* Center — Headline */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] font-display">
                Plataforma de IA generativa
              </span>
            </div>
            <h2 className="text-5xl xl:text-6xl font-bold text-zinc-900 leading-[1.05] tracking-tight font-display">
              Crea con IA.<br />
              <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                Más rápido.
              </span>
            </h2>
            <p className="text-zinc-400 text-base max-w-xs leading-relaxed font-medium">
              Imágenes, textos, videos, logos y más — todo en un solo lugar, con la IA más avanzada.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 shrink-0">
                  <f.icon className="h-4.5 w-4.5 text-zinc-400" />
                </div>
                <span className="text-sm font-medium text-zinc-400">{f.text}</span>
                <Check className="h-4 w-4 text-primary ml-auto shrink-0 opacity-50" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: "12+", label: "Herramientas" },
              { value: "$12", label: "Starter/mes" },
              { value: "4.6", label: "Claude" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors rounded-2xl border border-zinc-200 p-4 text-center">
                <p className="text-2xl font-bold text-zinc-900 font-display">{s.value}</p>
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-[11px] font-medium text-zinc-300 leading-relaxed">
            Al registrarte aceptas nuestros{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-zinc-400 transition-colors">
              Términos de servicio
            </span>{" "}
            y{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-zinc-400 transition-colors">
              Política de privacidad
            </span>.
          </p>
        </div>

        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 relative">
        {/* Mobile logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:hidden">
          <Logo size="sm" showText showPro onClick={() => navigate("/")} />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Form Card */}
          <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-10 shadow-xl shadow-zinc-200 animate-in fade-in slide-in-from-bottom-6 duration-700 relative overflow-hidden">

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight font-display">
                {mode === "login"
                  ? "Iniciar sesión"
                  : mode === "signup"
                  ? "Crear cuenta gratis"
                  : "Recuperar contraseña"}
              </h2>
              <p className="mt-1.5 text-sm text-zinc-400 font-medium">
                {mode === "login"
                  ? "Bienvenido de vuelta"
                  : mode === "signup"
                  ? "Empieza con 10 créditos gratis, sin tarjeta"
                  : "Te enviamos un enlace a tu correo"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Name (signup only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-zinc-400 text-xs font-semibold ml-1">
                    Tu nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="¿Cómo te llamas?"
                      autoComplete="name"
                      className="bg-zinc-50 border-zinc-200 focus:border-primary/40 rounded-2xl pl-11 h-12 text-sm text-zinc-900 placeholder:text-zinc-300 transition-all focus:ring-0 focus:bg-zinc-100"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400 text-xs font-semibold ml-1">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoComplete="email"
                    className="bg-zinc-50 border-zinc-200 focus:border-primary/40 rounded-2xl pl-11 h-12 text-sm text-zinc-900 placeholder:text-zinc-300 transition-all focus:ring-0 focus:bg-zinc-100"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 pr-1">
                    <Label htmlFor="password" className="text-zinc-400 text-xs font-semibold">
                      Contraseña
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-zinc-300 hover:text-primary transition-colors font-medium"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="bg-zinc-50 border-zinc-200 focus:border-primary/40 rounded-2xl pl-11 pr-12 h-12 text-sm text-zinc-900 placeholder:text-zinc-300 transition-all focus:ring-0 focus:bg-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="text-[11px] text-zinc-300 ml-1">
                      Usa al menos 6 caracteres.
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-2xl gap-3 font-bold text-sm tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === "login"
                      ? "Entrar"
                      : mode === "signup"
                      ? "Crear cuenta gratis"
                      : "Enviar enlace"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Social Login */}
            {mode !== "forgot" && (
              <div className="mt-8 space-y-5 relative z-10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <span className="relative bg-white px-4 text-[11px] text-zinc-400 font-medium">
                    o continúa con
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-3 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-white/15 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-all active:scale-[0.98]"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: REDIRECT_URL },
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                    </svg>
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-3 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-white/15 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-all active:scale-[0.98]"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "apple",
                        options: { redirectTo: REDIRECT_URL },
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple
                  </Button>
                </div>
              </div>
            )}

            {/* Switch mode */}
            <div className="mt-8 text-center relative z-10">
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm font-medium text-zinc-300 hover:text-zinc-900 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              ) : (
                <p className="text-sm text-zinc-300">
                  {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="font-semibold text-zinc-500 hover:text-primary transition-colors underline underline-offset-2"
                  >
                    {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
                  </button>
                </p>
              )}
            </div>

            {/* Background */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </div>

          {/* Bottom link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/pricing")}
              className="text-xs font-medium text-zinc-300 hover:text-zinc-400 transition-colors"
            >
              Ver planes y precios →
            </button>
          </div>
        </div>

        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/4 blur-[180px]" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
