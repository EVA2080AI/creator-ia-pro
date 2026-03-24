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
          redirectTo: `${window.location.origin}/reset-password`,
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
          options: { data: { display_name: displayName || email.split("@")[0] } },
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
    <div className="flex min-h-screen bg-background">
      {/* Left — Features (hidden mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[150px]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card glow-primary">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </div>

          <h2 className="text-4xl font-bold text-foreground leading-tight">
            Tu estudio de
            <br />
            <span className="gradient-text">IA generativa</span>
            <br />
            profesional
          </h2>

          <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
            Genera, mejora y transforma contenido visual con inteligencia artificial. Todo en una sola plataforma.
          </p>

          <div className="mt-8 space-y-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-accent" />
            10 créditos gratis al registrarte
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center px-6 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card glow-primary cursor-pointer" onClick={() => navigate("/")}>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 node-shadow">
            <h2 className="mb-1 text-xl font-bold text-foreground">
              {mode === "login" ? "Bienvenido de vuelta" : mode === "signup" ? "Crea tu cuenta" : "Recuperar contraseña"}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {mode === "login" ? "Accede a tu estudio creativo" : mode === "signup" ? "Empieza a crear con IA" : "Te enviaremos un enlace de recuperación"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-muted-foreground text-xs">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" className="bg-muted border-border pl-10 h-11" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-muted-foreground text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="bg-muted border-border pl-10 h-11" />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-muted-foreground text-xs">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-muted border-border pl-10 pr-10 h-11" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    {mode === "login" ? "Iniciar Sesión" : mode === "signup" ? "Crear Cuenta" : "Enviar Email"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Ocultado temporalmente por el usuario (SSO no configurado)
            {mode !== "forgot" && (
              <div className="mt-4 space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-3 text-xs text-muted-foreground">o continúa con</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2 border-border bg-muted hover:bg-muted/80"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await auth.signInWithOAuth("google", {
                        redirect_uri: `${window.location.origin}/dashboard`,
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                    className="h-11 gap-2 border-border bg-muted hover:bg-muted/80"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await auth.signInWithOAuth("apple", {
                        redirect_uri: `${window.location.origin}/dashboard`,
                      });
                      if (error) toast.error(error.message);
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </div>
            )}
            */ }

            <div className="mt-6 text-center">
              {mode === "forgot" ? (
                <button onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  ← Volver al login
                </button>
              ) : (
                <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <button onClick={() => navigate("/pricing")} className="text-xs text-primary hover:text-primary/80 transition-colors">
              Ver planes y precios →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
