import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

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

const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      <Loader2 className="relative h-10 w-10 animate-spin-slow text-primary" />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/canvas" element={<Canvas />} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
