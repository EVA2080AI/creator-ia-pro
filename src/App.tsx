import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
// Los dos shells y el buscador se cargan aparte a propósito: estáticos metían en el
// paquete inicial los dos sidebars con sus modales, Assistant.css entero y —por tres
// archivos de esa cadena— framer-motion completa, que el chat ni siquiera usa.
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then((m) => ({ default: m.AppLayout })));
const BasaltAppLayout = lazy(() => import("@/components/layout/BasaltAppLayout").then((m) => ({ default: m.BasaltAppLayout })));
const GlobalSearch = lazy(() => import("@/components/search/GlobalSearch").then((m) => ({ default: m.GlobalSearch })));
// Solo existe en desarrollo; antes el módulo viajaba igual a producción.
const PerformanceMonitor = import.meta.env.DEV
  ? lazy(() => import("@/components/performance/PerformanceMonitor").then((m) => ({ default: m.PerformanceMonitor })))
  : null;
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePageTracking } from "@/hooks/useAnalytics";
import { authClient, useSession } from "@/lib/auth-client";
import { ThemeProvider } from "@/hooks/useTheme";

// Redirect /canvas → /studio-flow preserving query params
const CanvasRedirect = () => {
  const loc = useLocation();
  return <Navigate to={`/studio-flow${loc.search}`} replace />;
};

// Redirect legacy Editor aliases (/ide, /code, /code-editor) → /a/basalt
// preservando query params (?project=). El constructor de apps ya no es una
// pantalla aparte (/chat) — se embebe dentro del shell de Basalt, que sabe
// activar ese modo si detecta ?project=/?panel=/?prompt= al montar (ver
// Basalt.tsx). Fusión real de Genesis IA + Editor, Fase 5; /chat eliminado
// como destino propio, 2026-09-29.
const ChatRedirect = () => {
  const loc = useLocation();
  return <Navigate to={`/a/basalt${loc.search}`} replace />;
};

// Redirect /tools y /apps/:appId → /a/basalt?panel=tools, preservando el
// ?tool= seleccionado (o resolviéndolo desde :appId) — Aplicaciones se
// fusionó de verdad dentro de Basalt como panel "Herramientas", mismo
// patrón que la fusión de Editor en Fase 5. El componente Tools sigue
// existiendo, embebido dentro del constructor de Basalt.
const APP_ID_TO_TOOL: Record<string, string> = {
  copywriter: "copywriter", logo: "logo", social: "social",
  blog: "blog", ads: "ads", enhance: "enhance",
  "remove-bg": "background", style: "style", upscale: "upscale", product: "product",
};
const ToolsRedirect = () => {
  const loc = useLocation();
  const { appId } = useParams();
  const params = new URLSearchParams(loc.search);
  params.set("panel", "tools");
  if (appId && APP_ID_TO_TOOL[appId]) params.set("tool", APP_ID_TO_TOOL[appId]);
  return <Navigate to={`/a/basalt?${params.toString()}`} replace />;
};

// /chat ya no es una pantalla separada — todo lo que hacía (construir apps,
// panel de Herramientas, proyectos) vive embebido dentro de /a/basalt
// (pedido directo del usuario, 2026-09-29: "/chat bórralo es obsoleto").
// Preserva la query string para no perder ?prompt=/?project=/?panel= de
// links viejos.
const BasaltBuildRedirect = () => {
  const loc = useLocation();
  return <Navigate to={`/a/basalt${loc.search}`} replace />;
};

// Global auth session watcher — handles token expiry and forced sign-out
function AuthWatcher() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useSession();
  // undefined = aún no observada; null/boolean = estado previo
  const hadSessionRef = useRef<boolean | undefined>(undefined);

  // Track page views for analytics
  usePageTracking();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', meta: true, handler: () => setSearchOpen(true) },
    { key: 'p', meta: true, shift: true, handler: () => navigate('/profile') },
    { key: 'd', meta: true, shift: true, handler: () => navigate('/dashboard') },
    { key: 't', meta: true, shift: true, handler: () => navigate('/tasks') },
    { key: 'h', meta: true, shift: true, handler: () => navigate('/help') },
  ]);

  useEffect(() => {
    const hasSession = !!session;
    if (hadSessionRef.current === undefined) {
      // Primera observación: solo registra el estado inicial
      hadSessionRef.current = hasSession;
      return;
    }
    const wasAuthenticated = hadSessionRef.current;
    hadSessionRef.current = hasSession;
    if (wasAuthenticated && !hasSession) {
      // useSession() (better-auth) puede devolver data:null por un instante
      // durante una revalidación en segundo plano o un blip de red, no solo
      // por un logout real. Sin re-confirmar esto con una llamada directa,
      // ese falso positivo sacaba al usuario a /auth a mitad de una
      // conversación, perdiendo lo que estuviera escribiendo — reproducido
      // en vivo y coincide con un reporte real ("escribe y se reinicia",
      // 2026-09-29). Si la re-confirmación falla (red caída de verdad) se
      // opta por NO navegar — quedarse en la pantalla es menos disruptivo
      // que un falso "tu sesión expiró".
      authClient.getSession({ query: {} }).then(({ data }) => {
        if (data) { hadSessionRef.current = true; return; }
        const publicPaths = ["/", "/auth", "/pricing", "/descargar", "/product-backlog", "/terms", "/privacy", "/security", "/contact", "/help", "/documentation", "/docs", "/cookies"];
        const isPublic = publicPaths.some(p =>
          window.location.pathname === p || window.location.pathname.startsWith("/herramienta")
        );
        if (!isPublic) {
          toast.error("Tu sesión expiró. Por favor inicia sesión nuevamente.");
          navigate("/auth", { replace: true });
        }
      }).catch(() => { /* red caída — no se navega, ver comentario arriba */ });
    }
  }, [session, navigate]);

  return (
    <>
      {/* El buscador solo se descarga cuando de verdad se abre (atajo de teclado). */}
      {searchOpen && (
        <Suspense fallback={null}>
          <GlobalSearch isOpen onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
      {PerformanceMonitor && (
        <Suspense fallback={null}>
          <PerformanceMonitor enabled />
        </Suspense>
      )}
    </>
  );
}

// ── Lazy pages ───────────────────────────────────────────────────────────────
// Public
const Index        = lazy(() => import("./pages/Index"));
const Auth         = lazy(() => import("./pages/Auth"));
const Pricing      = lazy(() => import("./pages/Pricing"));
const Downloads    = lazy(() => import("./pages/Downloads"));
const ToolLanding  = lazy(() => import("./pages/ToolLanding"));
const ProductBacklog = lazy(() => import("./pages/ProductBacklog"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound      = lazy(() => import("./pages/NotFound"));

// Legal pages
const Terms         = lazy(() => import("./pages/Terms"));
const Privacy       = lazy(() => import("./pages/Privacy"));
const Security      = lazy(() => import("./pages/Security"));
const Contact       = lazy(() => import("./pages/Contact"));
const Help          = lazy(() => import("./pages/Help"));
const Cookies       = lazy(() => import("./pages/Cookies"));

// Auth — rendered inside AppLayout
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const Spaces       = lazy(() => import("./pages/Spaces"));
const Admin        = lazy(() => import("./pages/Admin"));
const CanvasGate   = lazy(() => import("./pages/CanvasComingSoon"));
const Profile      = lazy(() => import("./pages/Profile"));
const ShareScreen  = lazy(() => import("./pages/ShareScreen"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const Tasks        = lazy(() => import("./pages/Tasks"));
const AssistantPage = lazy(() => import("./pages/Assistant"));
const ExpertEditorPage = lazy(() => import("./pages/ExpertEditor"));
const BasaltPage    = lazy(() => import("./pages/Basalt"));
const ArenaPage     = lazy(() => import("./pages/Arena"));

const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background" role="status" aria-live="polite">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse" />
      <Loader2 className="relative h-9 w-9 animate-spin text-primary" />
      <span className="sr-only">Cargando plataforma...</span>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Domain Guard: force primary domain in production
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    const isWrongDomain = hostname.includes("vercel.app") && hostname !== "creator-ia.com";
    if (!isLocal && isWrongDomain) {
      window.location.replace(
        `https://creator-ia.com${window.location.pathname}${window.location.search}${window.location.hash}`
      );
    }
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              {/* Saltar al contenido: el ancla #main-content ya existía en los dos
                  shells, pero no había ningún enlace que llevara a ella. Solo se ve
                  al tabular, que es cuando sirve. */}
              <a href="#main-content" className="asst-skip-link">Saltar al contenido</a>
              <AuthWatcher />
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* ── Public routes (no AppLayout) ── */}
                  <Route path="/"                     element={<Index />} />
                  <Route path="/home"                 element={<Navigate to="/" replace />} />
                  <Route path="/inicio"               element={<Navigate to="/" replace />} />
                  <Route path="/auth"                 element={<Auth />} />
                  <Route path="/pricing"              element={<Pricing />} />
                  <Route path="/descargar"            element={<Downloads />} />
                  <Route path="/product-backlog"      element={<ProductBacklog />} />
                  <Route path="/herramienta/:toolSlug" element={<ToolLanding />} />
                  <Route path="/reset-password"       element={<ResetPassword />} />
                  {/* /documentation y /docs eran dos páginas decorativas distintas sin
                      contenido real (botones sin onClick, copy de marketing genérico) —
                      /help ya tenía FAQ funcional de verdad. Consolidadas en una sola. */}
                  <Route path="/documentation"        element={<Navigate to="/help" replace />} />
                  <Route path="/docs"                 element={<Navigate to="/help" replace />} />
                  <Route path="/landing-test"         element={<Navigate to="/" replace />} />

                  {/* Legal pages */}
                  <Route path="/terms"                element={<Terms />} />
                  <Route path="/privacy"              element={<Privacy />} />
                  <Route path="/security"             element={<Security />} />
                  <Route path="/contact"              element={<Contact />} />
                  <Route path="/help"                 element={<Help />} />
                  <Route path="/cookies"              element={<Cookies />} />

                  {/* Demos retiradas (Lumina Bistro) */}
                  <Route path="/menu"              element={<Navigate to="/" replace />} />
                  <Route path="/customize"         element={<Navigate to="/" replace />} />
                  <Route path="/summary"           element={<Navigate to="/" replace />} />
                  <Route path="/success"           element={<Navigate to="/" replace />} />

                  {/* Nebula Finance — retirado */}
                  <Route path="/nebula"            element={<Navigate to="/dashboard" replace />} />

                  {/* Asistentes personalizables — shell propio, sin AppLayout */}
                  <Route path="/a/basalt" element={<BasaltPage />} />
                  <Route path="/basalt"   element={<Navigate to="/a/basalt" replace />} />
                  {/* Arena vive bajo el mismo prefijo /a/ que Basalt y los Expertos — es
                      la misma familia de producto (auditoría de IA, 2026-09-28). */}
                  <Route path="/a/arena" element={<ArenaPage />} />
                  <Route path="/arena"   element={<Navigate to="/a/arena" replace />} />
                  <Route path="/a/:slug" element={<AssistantPage />} />

                  {/* ── Redirects ── */}
                  <Route path="/canvas"  element={<CanvasRedirect />} />
                  <Route path="/studio"  element={<Navigate to="/a/basalt" replace />} />
                  <Route path="/genesis" element={<Navigate to="/a/basalt" replace />} />
                  <Route path="/chat"    element={<BasaltBuildRedirect />} />

                  {/* ── Platform routes que viven DENTRO del shell de Basalt ──
                      Panel de métricas, Tareas, Proyectos y Perfil son ahora
                      "un destino más" del sidebar de Basalt, no un producto
                      aparte con su propio shell (auditoría UX, 2026-09-28:
                      "todo debe estar dentro de basalt no afuera"). */}
                  <Route element={<BasaltAppLayout />}>
                    <Route path="/dashboard"    element={<Dashboard />} />
                    <Route path="/spaces"       element={<Spaces />} />
                    {/* /tasks es la canónica ahora — /tareas era la única URL logueada
                        del sitio en español sin razón de SEO (privada, disallow en
                        robots.txt); auditoría de IA, 2026-09-28. */}
                    <Route path="/tasks"        element={<Tasks />} />
                    <Route path="/tareas"       element={<Navigate to="/tasks" replace />} />
                    <Route path="/assets"       element={<Navigate to="/spaces" replace />} />
                    <Route path="/profile"      element={<Profile />} />
                    {/* "Mis expertos": crear el tuyo o duplicar uno de los 11 y ajustarlo.
                        La API existía desde hacía semanas sin pantalla que la usara. */}
                    <Route path="/expertos/nuevo" element={<ExpertEditorPage />} />
                    <Route path="/expertos/:slug" element={<ExpertEditorPage />} />
                    <Route path="/hub"          element={<Navigate to="/spaces" replace />} />
                    {/* ShareScreen es una herramienta independiente (P2P, sin relación
                        con Admin) — a diferencia de /system-status y /design-system,
                        que quedan agrupados con Admin bajo "Sistema" en el shell legado,
                        migrarla sola no genera un salto de shell entre páginas que van
                        juntas (auditoría UX 2026-09-29). */}
                    <Route path="/sharescreen"  element={<ShareScreen />} />
                  </Route>

                  {/* ── Platform routes (wrapped in AppLayout) ── */}
                  <Route element={<AppLayout />}>
                    {/* Aplicaciones se fusionó de verdad dentro de Basalt como panel
                        "Herramientas" — ver Tools.tsx embebido en Chat.tsx. */}
                    <Route path="/tools"        element={<ToolsRedirect />} />
                    <Route path="/apps/:appId"  element={<ToolsRedirect />} />
                    <Route path="/admin"        element={<Admin />} />
                    <Route path="/studio-flow"  element={<CanvasGate />} />
                    <Route path="/formarketing" element={<Navigate to="/studio-flow" replace />} />
                    {/* Antigravity se fusionó dentro de Genesis de verdad — no solo la ruta,
                        el prompt separado también se eliminó (ver Fase 5 de la restructuración). */}
                    <Route path="/antigravity"  element={<Navigate to="/a/basalt" replace />} />
                    <Route path="/system-status" element={<SystemStatus />} />
                    <Route path="/design-system" element={<DesignSystem />} />
                    {/* Editor se fusionó de verdad dentro de Genesis IA — era un subconjunto
                        de Chat.tsx sin preview ni deploy real. Ver Fase 5 de la restructuración. */}
                    <Route path="/ide"          element={<ChatRedirect />} />
                    <Route path="/code"         element={<ChatRedirect />} />
                    <Route path="/code-editor"  element={<ChatRedirect />} />
                  </Route>

                  {/* ── 404 ── */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;