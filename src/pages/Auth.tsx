import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff, User, Wand2, ZoomIn, Eraser, Check } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

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
            100 créditos gratis al registrarte
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
