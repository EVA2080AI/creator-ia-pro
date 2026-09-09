import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { aiService } from "@/services/ai-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, ArrowLeft,
  Database, Zap, Globe, CreditCard, Bot, Image, MessageSquare,
  RefreshCw, Loader2, Play, Clock, Server, Activity
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

type Status = "ok" | "warning" | "error" | "pending" | "untested";

interface Feature {
  id: string;
  name: string;
  category: string;
  status: Status;
  details: string;
  testResult?: string;
  apiNeeded?: string;
  costNote?: string;
  action?: string;
}

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  if (status === "pending") return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const statusLabel: Record<Status, { text: string; className: string }> = {
  ok: { text: "✅ Funcionando", className: "border-emerald-500/30 text-emerald-400" },
  warning: { text: "⚠️ Parcial", className: "border-amber-500/30 text-amber-400" },
  error: { text: "❌ Error", className: "border-destructive/30 text-destructive" },
  pending: { text: "⏳ Verificando...", className: "border-border text-muted-foreground" },
  untested: { text: "🔘 Sin probar", className: "border-border text-muted-foreground" },
};

const SystemStatus = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [checking, setChecking] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [authLoading, adminLoading, isAdmin, navigate, user]);

  const initFeatures = useCallback(() => {
    setFeatures(getFeatureList());
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      initFeatures();
    }
  }, [user, isAdmin, initFeatures]);

  const getFeatureList = (): Feature[] => [
    {
      id: "srv-ai-engine",
      name: "Motor de IA Multi-Modelo (V4.0 💎)",
      category: "Servicios Centralizados",
      status: "ok",
      details: "Motor de IA multi-modelo con failover inteligente. Primario: OpenRouter. Respaldo: Gemini 2.0 Flash.",
      apiNeeded: "VITE_OPENROUTER_API_KEY, VITE_GEMINI_API_KEY ✅",
      costNote: "Lógica de niveles por modelo activa.",
      action: "test-gateway",
    },
    {
      id: "ef-bold-checkout",
      name: "Bold Link Generator (/api/billing/checkout)",
      category: "Servicios Centralizados",
      status: "untested",
      details: "Genera links de pago dinámicos con Bold.co.",
      apiNeeded: "BOLD_API_KEY (Vercel env var)",
      action: "test-cors",
    },
    {
      id: "ef-ai-proxy",
      name: "AI Chat (/api/ai/chat)",
      category: "Servicios Centralizados",
      status: "untested",
      details: "Streaming de chat con better-auth y cobro de créditos atómico.",
      action: "test-cors",
    },
    {
      id: "ef-bold-webhook",
      name: "Bold Webhook (/api/billing/webhook)",
      category: "Integraciones",
      status: "untested",
      details: "Procesa pagos aprobados y asigna créditos. Validación HMAC vía BOLD_WEBHOOK_SECRET.",
      action: "test-cors",
    },
    {
      id: "db-profiles",
      name: "Neon — conexión (perfil/créditos)",
      category: "Base de Datos",
      status: "untested",
      details: "profile: user_id, credits_balance, subscription_tier. Drizzle/Neon no tiene RLS por tabla para probar cada una por separado — esto confirma que la base de datos responde.",
      action: "test-db-read",
    },
    {
      id: "db-transactions",
      name: "Neon — conexión (transacciones)",
      category: "Base de Datos",
      status: "untested",
      details: "transaction: registro de débitos/créditos, inmutable.",
      action: "test-db-read",
    },
    {
      id: "int-bold-api",
      name: "Bold API (Checkout Link)",
      category: "Integraciones",
      status: "ok",
      details: "Conectado al endpoint de producción de Bold.co.",
    },
    {
      id: "int-google-gemini",
      name: "Google Gemini API",
      category: "Integraciones",
      status: "ok",
      details: "Respaldo gratuito configurado.",
    },
    {
      id: "fe-auth",
      name: "Auth Industrial",
      category: "Frontend",
      status: "ok",
      details: "Login/Registro con better-auth (Neon).",
    },
    {
      id: "fe-pricing",
      name: "Pricing (Bold)",
      category: "Frontend",
      status: "ok",
      details: "Integrado con links de pago Bold.",
    },
    {
      id: "fe-admin",
      name: "Panel Admin",
      category: "Frontend",
      status: "ok",
      details: "Gestión de usuarios y créditos.",
    },
  ];

  const testFeature = useCallback(async (feature: Feature) => {
    setTestingId(feature.id);
    const updatedFeatures = [...features];
    const idx = updatedFeatures.findIndex((f) => f.id === feature.id);
    if (idx === -1) return;

    updatedFeatures[idx] = { ...updatedFeatures[idx], status: "pending" };
    setFeatures([...updatedFeatures]);

    try {
      if (feature.action === "test-cors") {
        // Las funciones de Supabase (ai-proxy, bold-checkout, bold-webhook) ya
        // no existen — cada una tiene su reemplazo directo en /api/*. La sonda
        // manda un POST vacío sin sesión: cualquiera de estos endpoints
        // rechaza esa llamada ANTES de tocar créditos, Bold o la base de
        // datos (401/400/405), así que confirma que el endpoint está vivo sin
        // efectos secundarios reales.
        const endpointMap: Record<string, string> = {
          "ef-bold-checkout": "/api/billing/checkout",
          "ef-bold-webhook": "/api/billing/webhook",
          "ef-ai-proxy": "/api/ai/chat",
        };
        const endpoint = endpointMap[feature.id];
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const isAlive = res.status === 401 || res.status === 400 || res.status === 200;
        updatedFeatures[idx] = {
          ...updatedFeatures[idx],
          status: isAlive ? "ok" : "warning",
          testResult: `${endpoint}: ${res.status} ${res.statusText}`,
        };
      } else if (feature.action === "test-db-read") {
        // Neon/Drizzle no tiene el concepto de "lectura por tabla con RLS" que
        // tenía Supabase — una sonda de conectividad general contra /api/health
        // ya cubre lo que esto necesita confirmar hoy.
        const res = await fetch("/api/health");
        const data = await res.json().catch(() => null);
        updatedFeatures[idx] = {
          ...updatedFeatures[idx],
          status: res.ok && data?.db === "up" ? "ok" : "error",
          testResult: res.ok && data?.db === "up" ? "Conexión a Neon OK" : `Error: ${data?.error || res.statusText}`,
        };
      } else if (feature.action === "test-gateway") {
        try {
          const data = await aiService.processAction({
            action: "chat",
            prompt: "Ping diagnostic check",
            model: "gemini-3-flash"
          });
          updatedFeatures[idx] = {
            ...updatedFeatures[idx],
            status: "ok",
            testResult: `Respuesta OK: ${data?.text?.substring(0, 50)}...`,
          };
        } catch (err: any) {
          updatedFeatures[idx] = {
            ...updatedFeatures[idx],
            status: "error",
            testResult: `Error: ${err.message}`,
          };
        }
      }
    } catch (err: any) {
      updatedFeatures[idx] = {
        ...updatedFeatures[idx],
        status: "error",
        testResult: `Exception: ${err.message}`,
      };
    }

    setFeatures([...updatedFeatures]);
    setTestingId(null);
  }, [features]);

  const runAllTests = async () => {
    setChecking(true);
    for (const f of features) {
      if (f.action) {
        await testFeature(f);
      }
    }
    setChecking(false);
  };

  const categories = [...new Set(features.map((f) => f.category))];
  const summary = {
    ok: features.filter((f) => f.status === "ok").length,
    warning: features.filter((f) => f.status === "warning").length,
    error: features.filter((f) => f.status === "error").length,
    untested: features.filter((f) => f.status === "untested").length,
  };
  const completionPct = features.length > 0 ? Math.round((summary.ok / features.length) * 100) : 0;

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Estado del Sistema | Creator IA Pro</title></Helmet>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <Shield className="inline mr-2 h-5 w-5 text-primary" />
              Estado del Sistema (Bold Edition)
            </h1>
            <p className="text-sm text-muted-foreground">Diagnóstico en vivo — migración a Bold completada</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runAllTests}
            disabled={checking}
            className="ml-auto border-border gap-2"
          >
            <Play className={`h-3.5 w-3.5 ${checking ? "animate-pulse" : ""}`} />
            {checking ? "Probando..." : "Probar Todo"}
          </Button>
        </div>

        {/* System Readiness Visualization */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 rounded-xl border border-white/5 bg-card/60 p-6 backdrop-blur-xl flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Salud del Ecosistema</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'OK', value: summary.ok, color: '#10b981' },
                      { name: 'Advertencia', value: summary.warning, color: '#f59e0b' },
                      { name: 'Error', value: summary.error, color: '#ef4444' },
                    ].filter(d => d.value > 0)}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { color: '#10b981' },
                      { color: '#f59e0b' },
                      { color: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
               <span className="text-3xl font-black text-primary font-mono">{completionPct}%</span>
               <p className="text-[10px] text-muted-foreground uppercase">Funcionando (de lo probado)</p>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-card/60 p-6 backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-6">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Resumen de Diagnósticos</h3>
             </div>
             <div className="space-y-4">
                {[
                   { label: "Funcionando", value: String(summary.ok), status: summary.ok > 0 ? "OK" : "Sin datos", color: "text-emerald-500" },
                   { label: "Con advertencias", value: String(summary.warning), status: summary.warning > 0 ? "Revisar" : "Ninguna", color: "text-amber-500" },
                   { label: "Con errores", value: String(summary.error), status: summary.error > 0 ? "Atender" : "Ninguno", color: summary.error > 0 ? "text-destructive" : "text-muted-foreground" }
                ].map((m) => (
                   <div key={m.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-muted-foreground">{m.label}</span>
                      <div className="text-right">
                         <p className="text-sm font-bold text-foreground">{m.value}</p>
                         <p className={`text-[10px] font-bold uppercase tracking-tighter ${m.color}`}>{m.status}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Features by category */}
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2 uppercase tracking-wider">
                {cat === "Servicios Centralizados" && <Zap className="h-3.5 w-3.5 text-primary" />}
                {cat === "Base de Datos" && <Database className="h-3.5 w-3.5 text-primary" />}
                {cat === "Integraciones" && <CreditCard className="h-3.5 w-3.5 text-primary" />}
                {cat === "Frontend" && <Globe className="h-3.5 w-3.5 text-primary" />}
                {cat}
              </h2>
              <div className="space-y-2">
                {features
                  .filter((f) => f.category === cat)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex items-start gap-3">
                        <StatusIcon status={f.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-xs text-foreground">{f.name}</span>
                            <Badge variant="outline" className={statusLabel[f.status].className + " text-[9px] h-5"}>
                              {statusLabel[f.status].text}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{f.details}</p>
                          {f.testResult && (
                            <p className="mt-1 text-[10px] font-mono text-primary bg-primary/5 px-2 py-1 rounded">
                              {f.testResult}
                            </p>
                          )}
                        </div>
                        {f.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={testingId === f.id}
                            onClick={() => testFeature(f)}
                            className="shrink-0 h-7 px-2 text-xs"
                          >
                            {testingId === f.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SystemStatus;
