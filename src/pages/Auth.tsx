import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { safeInternalPath } from "@/lib/safe-path";
import { SEO, seoPresets } from "@/components/SEO";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowRight, Mail, Eye, EyeOff, User,
  Wand2, Loader2, Lock, Check, Code2
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

// Editor se fusionó dentro de Basalt IA (Fase 5) y Aplicaciones también
// (panel "Herramientas" en el workspace de Basalt) — 2 items reales, no 4.
const features = [
  { icon: Code2, text: "Basalt IA — apps React completas + imágenes, logos y textos con IA" },
  { icon: Wand2, text: "Canvas IA — flujos de producción visuales (Próximamente)" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  // Vuelta tras entrar: ToolLanding manda ?next=/apps/<tool> para que quien llegó
  // desde una landing buscando UNA herramienta no aterrice en el Basalt genérico.
  const next = safeInternalPath(searchParams.get("next"));
  // /auth?mode=signup (usado por el CTA "Crear cuenta gratis" de Pricing) abre
  // directo el formulario de registro en vez de caer siempre en login.
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Qué botones sociales existen de verdad en este despliegue: si el proveedor no
  // tiene credenciales, better-auth responde "Provider not found" y el usuario se
  // come un error justo al registrarse (pasaba con los tres, medido en producción).
  const [socialProviders, setSocialProviders] = useState<string[]>([]);

  const navigate = useNavigate();
  const { data: session } = useSession();

  // Punto de entrada tras iniciar sesión: el chat de Basalt (como Gemini/ChatGPT),
  // no el dashboard de métricas — eso queda como vista secundaria (⌘⇧D).

  useEffect(() => {
    let vivo = true;
    void fetch("/api/auth-providers")
      .then((r) => r.json())
      .then((j) => { if (vivo && j?.ok) setSocialProviders(j.providers ?? []); })
      .catch(() => { /* sin red: se queda sin botones sociales, el correo sigue */ });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (session?.user) navigate(next, { replace: true });
  }, [session, navigate, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(error.message);
        toast.success("Enlace enviado. Revisa tu correo.");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message);
        toast.success("Sesión iniciada correctamente.");
        navigate(next, { replace: true });
      } else {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: displayName || email.split("@")[0],
        });
        if (error) throw new Error(error.message);
        toast.success("Cuenta creada. ¡Bienvenido!");
        navigate(next, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background bg-grid-white/[0.02] font-sans selection:bg-primary/15 selection:text-foreground overflow-hidden">
      <SEO {...seoPresets.auth} />

      {/* Left Panel — Value Prop */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between px-16 py-16 relative overflow-hidden bg-muted/50 border-r border-border">
        {/* Animated glows */}
         <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ x: [0, 20, -10, 0], y: [0, -20, 10, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 h-[750px] w-[750px] rounded-full bg-primary/8 blur-[160px]"
          />
          <motion.div
            animate={{ x: [0, -15, 10, 0], y: [0, 15, -10, 0], scale: [1, 0.9, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary/6 blur-[140px]"
          />
        </div>

        {/* Top — Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Logo size="md" showText showPro onClick={() => navigate("/")} />
        </motion.div>

        {/* Center — Headline */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]"
              />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] font-display">
                Plataforma de IA generativa
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl xl:text-6xl font-bold text-foreground leading-[1.05] tracking-tight font-display"
            >
              Crea con IA.<br />
              <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                Más rápido.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-muted-foreground text-base max-w-xs leading-relaxed font-medium"
            >
              Imágenes, textos, videos, logos y más — todo en un solo lugar, con la IA más avanzada.
            </motion.p>
          </div>

          {/* Features */}
          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.45 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-5"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border shrink-0"
                >
                  <f.icon className="h-4.5 w-4.5 text-muted-foreground" />
                </motion.div>
                <span className="text-sm font-medium text-muted-foreground">{f.text}</span>
                <Check className="h-4 w-4 text-primary ml-auto shrink-0 opacity-50" />
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: "12+", label: "Herramientas" },
              { value: "5", label: "Créditos gratis" },
              { value: "AES-256", label: "Encriptación" },
            ].map((s, i) => (
               <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 text-center shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                <p className="text-2xl font-bold text-foreground font-display">{s.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 flex-col items-center justify-start lg:justify-center px-6 py-8 lg:py-12 relative">
        {/* Mobile logo + propuesta de valor — el panel de la izquierda (headline,
            features, stats) es hidden lg:flex, así que en celular/tablet no
            queda NADA de contexto del producto antes del formulario sin esto.
            Iba en position:absolute sobre una tarjeta centrada: en un iPhone 13 la
            tarjeta lo tapaba y del logo se veía media circunferencia asomando por
            detrás — la frase que da contexto no se leía NUNCA. Ahora va en el flujo,
            encima de la tarjeta (medido con el formulario de registro, que es el más
            alto). */}
        <div className="mb-6 w-full max-w-[340px] px-6 text-center lg:hidden">
          <div className="flex justify-center">
            <Logo size="sm" showText showPro onClick={() => navigate("/")} />
          </div>
          <p className="mt-3 text-[13px] font-medium leading-snug text-muted-foreground">
            Basalt IA convierte tus ideas en apps, imágenes y textos — todo en una sola conversación.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Form Card */}
          <div className="rounded-[2.5rem] border border-border bg-card p-10 shadow-xl shadow-black/5 relative overflow-hidden">

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground tracking-tight font-display">
                {mode === "login"
                  ? "Iniciar sesión"
                  : mode === "signup"
                  ? "Crear cuenta gratis"
                  : "Recuperar contraseña"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground font-medium">
                {mode === "login"
                  ? "Bienvenido de vuelta"
                  : mode === "signup"
                  ? "Empieza con 5 créditos gratis, sin tarjeta"
                  : "Ingresa tu correo y te enviaremos un enlace"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Name (signup only) */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-muted-foreground text-xs font-semibold ml-1">
                    Tu nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="¿Cómo te llamas?"
                      autoComplete="name"
                      className="bg-muted/50 border-border focus:border-primary/40 rounded-2xl pl-11 h-12 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:ring-0 focus:bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-xs font-semibold ml-1">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoComplete="email"
                    className="bg-muted/50 border-border focus:border-primary/40 rounded-2xl pl-11 h-12 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:ring-0 focus:bg-muted"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 pr-1">
                    <Label htmlFor="password" className="text-muted-foreground text-xs font-semibold">
                      Contraseña
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                      required
                      // El server (better-auth) exige 8 — ver minPasswordLength en
                      // api/_lib/auth.ts. En login NO se pre-valida longitud: una
                      // contraseña vieja más corta debe poder intentarse igual.
                      minLength={mode === "signup" ? 8 : undefined}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="bg-muted/50 border-border focus:border-primary/40 rounded-2xl pl-11 pr-12 h-12 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:ring-0 focus:bg-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="text-[11px] text-muted-foreground ml-1">
                      Usa al menos 8 caracteres.
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-3 font-bold text-sm tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
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

            {/* Social Login — solo lo que está configurado (ver /api/auth-providers) */}
            {mode !== "forgot" && socialProviders.length > 0 && (
              <div className="mt-8 space-y-5 relative z-10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-4 text-[11px] text-muted-foreground font-medium">
                    o continúa con
                  </span>
                </div>

                <div className={`grid gap-3 ${socialProviders.length === 1 ? "grid-cols-1" : socialProviders.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {socialProviders.includes("google") && <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-3 border-border bg-muted/50 hover:bg-muted hover:border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next });
                      if (error) toast.error(error.message || "Google aún no está configurado.");
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                    </svg>
                    <span className="hidden sm:inline">Google</span>
                  </Button>}

                  {socialProviders.includes("apple") && <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-3 border-border bg-muted/50 hover:bg-muted hover:border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await authClient.signIn.social({ provider: "apple", callbackURL: next });
                      if (error) toast.error(error.message || "Apple aún no está configurado.");
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="hidden sm:inline">Apple</span>
                  </Button>}

                  {socialProviders.includes("github") && <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-3 border-border bg-muted/50 hover:bg-muted hover:border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await authClient.signIn.social({ provider: "github", callbackURL: next });
                      if (error) toast.error(error.message || "GitHub aún no está configurado.");
                      setLoading(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.17 0 1.56-.01 2.82-.01 3.2 0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z" />
                    </svg>
                    <span className="hidden sm:inline">GitHub</span>
                  </Button>}
                </div>
              </div>
            )}

            {/* Switch mode */}
            <div className="mt-8 text-center relative z-10">
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="font-semibold text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
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
              className="text-xs font-medium text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              Ver planes y precios →
            </button>
          </div>

          {/* Aviso legal — visible en mobile y desktop (antes solo vivía en el
              panel izquierdo, hidden lg:flex, así que en celular nunca se veía). */}
          <p className="mt-4 text-center text-[11px] font-medium leading-relaxed text-muted-foreground">
            Al registrarte aceptas nuestros{" "}
            <button type="button" onClick={() => navigate("/terms")} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Términos de servicio
            </button>{" "}
            y{" "}
            <button type="button" onClick={() => navigate("/privacy")} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Política de privacidad
            </button>.
          </p>
        </motion.div>

        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/4 blur-[180px]" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
