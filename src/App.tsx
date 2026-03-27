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
import { CreditProgressBar } from "@/components/CreditProgressBar";

// Global ambient glassmorphism background — excluded on Studio/Canvas
function GlobalAmbient() {
  const loc = useLocation();
  const isCanvas = loc.pathname.startsWith("/formarketing") || loc.pathname === "/canvas";
  if (isCanvas) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Purple top-left orb */}
      <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-aether-purple/[0.06] blur-[130px]" />
      {/* Blue top-right orb */}
      <div className="absolute top-[10%] right-[-5%] h-[50vh] w-[50vh] rounded-full bg-aether-blue/[0.04] blur-[110px]" />
      {/* Rose bottom-center orb */}
      <div className="absolute bottom-[5%] left-[30%] h-[40vh] w-[40vh] rounded-full bg-rose-500/[0.03] blur-[100px] animate-pulse" />
      {/* Noise grain */}
      <div
        className="fixed inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}

// Redirect /canvas → /formarketing preserving query params
const CanvasRedirect = () => {
  const loc = useLocation();
  return <Navigate to={`/formarketing${loc.search}`} replace />;
};

// Global auth session watcher — handles token expiry and forced sign-out
function AuthWatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        const publicPaths = ["/", "/auth", "/pricing", "/descargar", "/product-backlog"];
        const isPublic = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith("/herramienta"));
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

// Lazy loading of pages for bundle optimization (V3.3)
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Spaces = lazy(() => import("./pages/Spaces"));
const Assets = lazy(() => import("./pages/Assets"));
const Tools = lazy(() => import("./pages/Tools"));
const Admin = lazy(() => import("./pages/Admin"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ToolLanding = lazy(() => import("./pages/ToolLanding"));
const Downloads = lazy(() => import("./pages/Downloads"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const ProductBacklog = lazy(() => import("./pages/ProductBacklog"));
const ShareScreen = lazy(() => import("./pages/ShareScreen"));
const Formarketing = lazy(() => import("./pages/Formarketing"));
const Profile = lazy(() => import("./pages/Profile"));
const Hub = lazy(() => import("./pages/Hub"));
const Chat = lazy(() => import("./pages/Chat"));

const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#09090b]">
    <div className="relative">
      <div className="absolute inset-0 bg-[#EC4699]/20 blur-2xl rounded-full animate-pulse" />
      <Loader2 className="relative h-10 w-10 animate-spin-slow text-[#EC4699]" />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Aggressive Domain Guard: Force primary domain in production (V4.6)
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    // If it's a Vercel URL and NOT the final domain, redirect
    const isWrongDomain = hostname.includes("vercel.app") && hostname !== "creator-ia.com";

    if (!isLocal && isWrongDomain) {
      const targetUrl = `https://creator-ia.com${window.location.pathname}${window.location.search}${window.location.hash}`;
      console.log("Domain Guard: Correcting context to:", targetUrl);
      window.location.replace(targetUrl);
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
            <GlobalAmbient />
            <CreditProgressBar />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/canvas" element={<CanvasRedirect />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/spaces" element={<Spaces />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/apps/:appId" element={<Tools />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/descargar" element={<Downloads />} />
                <Route path="/herramienta/:toolSlug" element={<ToolLanding />} />
                <Route path="/system-status" element={<SystemStatus />} />
                <Route path="/product-backlog" element={<ProductBacklog />} />
                <Route path="/sharescreen" element={<ShareScreen />} />
                <Route path="/formarketing" element={<Formarketing />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/hub" element={<Hub />} />
                <Route path="/chat" element={<Chat />} />
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
