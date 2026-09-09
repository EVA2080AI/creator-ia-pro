import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePageTracking } from "@/hooks/useAnalytics";
import { useSession } from "@/lib/auth-client";

// Redirect /canvas → /studio-flow preserving query params
const CanvasRedirect = () => {
  const loc = useLocation();
  return <Navigate to={`/studio-flow${loc.search}`} replace />;
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
    { key: 't', meta: true, shift: true, handler: () => navigate('/tareas') },
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
      const publicPaths = ["/", "/auth", "/pricing", "/descargar", "/product-backlog", "/terms", "/privacy", "/security", "/contact", "/help", "/documentation", "/docs", "/cookies"];
      const isPublic = publicPaths.some(p =>
        window.location.pathname === p || window.location.pathname.startsWith("/herramienta")
      );
      if (!isPublic) {
        toast.error("Tu sesión expiró. Por favor inicia sesión nuevamente.");
        navigate("/auth", { replace: true });
      }
    }
  }, [session, navigate]);

  return (
    <>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <PerformanceMonitor enabled={import.meta.env.DEV} />
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
const Tools        = lazy(() => import("./pages/Tools"));
const Admin        = lazy(() => import("./pages/Admin"));
const Formarketing = lazy(() => import("./pages/Formarketing"));
const Profile      = lazy(() => import("./pages/Profile"));
const Chat         = lazy(() => import("./pages/Chat"));
const ShareScreen  = lazy(() => import("./pages/ShareScreen"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const CodeIDE      = lazy(() => import("./pages/CodeIDE"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const Tasks        = lazy(() => import("./pages/Tasks"));
const AssistantPage = lazy(() => import("./pages/Assistant"));

// Light loading screen — no dark bg
const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-white" role="status" aria-live="polite">
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
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
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
                  <Route path="/a/:slug" element={<AssistantPage />} />

                  {/* ── Redirects ── */}
                  <Route path="/canvas"  element={<CanvasRedirect />} />
                  <Route path="/studio"  element={<Navigate to="/chat" replace />} />
                  <Route path="/genesis" element={<Navigate to="/chat"   replace />} />

                  {/* ── Platform routes (wrapped in AppLayout) ── */}
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard"    element={<Dashboard />} />
                    <Route path="/spaces"       element={<Spaces />} />
                    <Route path="/tareas"       element={<Tasks />} />
                    <Route path="/tasks"        element={<Navigate to="/tareas" replace />} />
                    <Route path="/assets"       element={<Navigate to="/spaces" replace />} />
                    <Route path="/tools"        element={<Tools />} />
                    <Route path="/apps/:appId"  element={<Tools />} />
                    <Route path="/admin"        element={<Admin />} />
                    <Route path="/studio-flow"  element={<Formarketing />} />
                    <Route path="/formarketing" element={<Navigate to="/studio-flow" replace />} />
                    <Route path="/profile"      element={<Profile />} />
                    <Route path="/hub"          element={<Navigate to="/spaces" replace />} />
                    {/* Antigravity se fusionó dentro de Genesis — mismo motor (StudioChat) sin la piel cosmética. */}
                    <Route path="/antigravity"  element={<Navigate to="/chat" replace />} />
                    <Route path="/chat"         element={<Chat />} />
                    <Route path="/sharescreen"  element={<ShareScreen />} />
                    <Route path="/system-status" element={<SystemStatus />} />
                    <Route path="/design-system" element={<DesignSystem />} />
                    <Route path="/ide"          element={<CodeIDE />} />
                    <Route path="/code"         element={<CodeIDE />} />
                    <Route path="/code-editor"  element={<CodeIDE />} />
                  </Route>

                  {/* ── 404 ── */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;