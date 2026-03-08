import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Canvas from "./pages/Canvas";
import Pricing from "./pages/Pricing";
import Spaces from "./pages/Spaces";
import Assets from "./pages/Assets";
import Tools from "./pages/Tools";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ToolLanding from "./pages/ToolLanding";
import Downloads from "./pages/Downloads";
import SystemStatus from "./pages/SystemStatus";
import ProductBacklog from "./pages/ProductBacklog";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
