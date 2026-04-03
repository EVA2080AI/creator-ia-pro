import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";

// Redirect /canvas → /studio-flow preserving query params
const CanvasRedirect = () => {
  const loc = useLocation();
  return <Navigate to={`/studio-flow${loc.search}`} replace />;
};

// Global auth session watcher — handles token expiry and forced sign-out
function AuthWatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        const publicPaths = ["/", "/auth", "/pricing", "/descargar", "/product-backlog"];
        const isPublic = publicPaths.some(p =>
          window.location.pathname === p || window.location.pathname.startsWith("/herramienta")
        );
        if (!isPublic) {
          toast.error("Tu sesión expiró. Por favor inicia sesión nuevamente.");
          navigate("/auth", { replace: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return null;
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
const NotFound     = lazy(() => import("./pages/NotFound"));

// Auth — rendered inside AppLayout
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const Spaces       = lazy(() => import("./pages/Spaces"));
const Assets       = lazy(() => import("./pages/Assets"));
const Tools        = lazy(() => import("./pages/Tools"));
const Admin        = lazy(() => import("./pages/Admin"));
const Formarketing = lazy(() => import("./pages/Formarketing"));
const Profile      = lazy(() => import("./pages/Profile"));
const Hub          = lazy(() => import("./pages/Hub"));
const Antigravity  = lazy(() => import("./pages/Antigravity"));
const Chat         = lazy(() => import("./pages/Chat"));
const ShareScreen  = lazy(() => import("./pages/ShareScreen"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const CodeIDE      = lazy(() => import("./pages/CodeIDE"));

// Light loading screen — no dark bg
const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-white">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse" />
      <Loader2 className="relative h-9 w-9 animate-spin text-primary" />
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
            <Sonner />
            <BrowserRouter>
              <AuthWatcher />
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* ── Public routes (no AppLayout) ── */}
                  <Route path="/"                     element={<Index />} />
                  <Route path="/auth"                 element={<Auth />} />
                  <Route path="/herramienta/:toolSlug" element={<ToolLanding />} />
                  <Route path="/reset-password"       element={<ResetPassword />} />

                  {/* ── Redirects ── */}
                  <Route path="/canvas"  element={<CanvasRedirect />} />
                  <Route path="/studio"  element={<Navigate to="/tools"  replace />} />
                  <Route path="/genesis" element={<Navigate to="/chat"   replace />} />

                  {/* ── Platform routes (wrapped in AppLayout) ── */}
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard"    element={<Dashboard />} />
                    <Route path="/pricing"      element={<Pricing />} />
                    <Route path="/descargar"    element={<Downloads />} />
                    <Route path="/product-backlog" element={<ProductBacklog />} />
                    <Route path="/spaces"       element={<Spaces />} />
                    <Route path="/assets"       element={<Navigate to="/spaces" replace />} />
                    <Route path="/tools"        element={<Tools />} />
                    <Route path="/apps/:appId"  element={<Tools />} />
                    <Route path="/admin"        element={<Admin />} />
                    <Route path="/formarketing" element={<Navigate to="/studio-flow" replace />} />
                    <Route path="/studio-flow" element={<Formarketing />} />
                    <Route path="/profile"      element={<Profile />} />
                    <Route path="/hub"          element={<Hub />} />
                    <Route path="/antigravity"  element={<Antigravity />} />
                    <Route path="/chat"         element={<Chat />} />
                    <Route path="/sharescreen"  element={<ShareScreen />} />
                    <Route path="/system-status" element={<SystemStatus />} />
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
