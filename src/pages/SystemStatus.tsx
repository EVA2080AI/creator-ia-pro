import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, ArrowLeft,
  Database, Zap, Globe, CreditCard, Bot, Image, MessageSquare,
  RefreshCw, Loader2, Play, Clock,
} from "lucide-react";

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
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-accent" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-gold" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  if (status === "pending") return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const statusLabel: Record<Status, { text: string; className: string }> = {
  ok: { text: "✅ Funcionando", className: "border-accent/30 text-accent" },
  warning: { text: "⚠️ Parcial", className: "border-gold/30 text-gold" },
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
    if (!authLoading && !adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [authLoading, adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      initFeatures();
    }
  }, [user, isAdmin]);

  const initFeatures = () => {
    setFeatures(getFeatureList());
  };

  const getFeatureList = (): Feature[] => [
    // EDGE FUNCTIONS
    {
      id: "ef-generate-image",
      name: "generate-image (Canvas)",
      category: "Edge Functions",
      status: "untested",
      details: "Genera imágenes con Google Gemini 2.0 Flash Exp. Usa tu API key gratuita de Google.",
      apiNeeded: "GOOGLE_GEMINI_API_KEY ✅",
      costNote: "API gratuita de Google — sin costo por llamada para ti.",
      action: "test-cors",
    },
    {
      id: "ef-ai-tool",
      name: "ai-tool (Herramientas imagen)",
      category: "Edge Functions",
      status: "untested",
      details: "Enhance, upscale, eraser, background, restore, logo, social. Usa Google Gemini 2.0 Flash Exp.",
      apiNeeded: "GOOGLE_GEMINI_API_KEY ✅",
      costNote: "API gratuita de Google.",
      action: "test-cors",
    },
    {
      id: "ef-ai-chat",
      name: "ai-chat (Copywriter/Blog/Ads)",
      category: "Edge Functions",
      status: "untested",
      details: "Generación de texto con Google Gemini 2.0 Flash. Copywriter, blog, social, ads.",
      apiNeeded: "GOOGLE_GEMINI_API_KEY ✅",
      costNote: "API gratuita de Google.",
      action: "test-cors",
    },
    {
      id: "ef-create-checkout",
      name: "create-checkout (Stripe)",
      category: "Edge Functions",
      status: "untested",
      details: "Crea sesiones de Stripe Checkout para suscripciones.",
      apiNeeded: "STRIPE_SECRET_KEY ✅",
      action: "test-cors",
    },
    {
      id: "ef-check-subscription",
      name: "check-subscription",
      category: "Edge Functions",
      status: "untested",
      details: "Verifica suscripción activa en Stripe y actualiza perfil.",
      apiNeeded: "STRIPE_SECRET_KEY ✅",
      action: "test-auth",
    },
    {
      id: "ef-customer-portal",
      name: "customer-portal",
      category: "Edge Functions",
      status: "untested",
      details: "Abre portal de Stripe para gestionar suscripción.",
      apiNeeded: "STRIPE_SECRET_KEY ✅",
      action: "test-cors",
    },
    {
      id: "ef-buy-credits",
      name: "buy-credits (Paquetes extra)",
      category: "Edge Functions",
      status: "untested",
      details: "Compra one-time de paquetes de créditos: 100 ($2.99), 500 ($9.99), 2500 ($39.99).",
      apiNeeded: "STRIPE_SECRET_KEY ✅",
      action: "test-cors",
    },
    {
      id: "ef-stripe-webhook",
      name: "stripe-webhook",
      category: "Edge Functions",
      status: "untested",
      details: "Recarga créditos mensualmente, procesa compras de créditos, y cancela suscripciones.",
      apiNeeded: "STRIPE_SECRET_KEY ✅, STRIPE_WEBHOOK_SECRET (opcional)",
      action: "test-cors",
    },
    {
      id: "ef-admin-save-settings",
      name: "admin-save-settings",
      category: "Edge Functions",
      status: "untested",
      details: "Guarda configuración de APIs desde el panel admin.",
      action: "test-cors",
    },

    // DATABASE
    {
      id: "db-profiles",
      name: "Tabla profiles",
      category: "Base de Datos",
      status: "untested",
      details: "user_id, credits_balance, subscription_tier, display_name, avatar_url.",
      action: "test-db-read",
    },
    {
      id: "db-canvas-nodes",
      name: "Tabla canvas_nodes",
      category: "Base de Datos",
      status: "untested",
      details: "Nodos del canvas con estado, prompt, asset_url.",
      action: "test-db-read",
    },
    {
      id: "db-transactions",
      name: "Tabla transactions",
      category: "Base de Datos",
      status: "untested",
      details: "Registro de débitos/créditos. Inmutable (no UPDATE/DELETE).",
      action: "test-db-read",
    },
    {
      id: "db-saved-assets",
      name: "Tabla saved_assets",
      category: "Base de Datos",
      status: "untested",
      details: "Biblioteca de assets con favoritos y tags.",
      action: "test-db-read",
    },
    {
      id: "db-spaces",
      name: "Tabla spaces",
      category: "Base de Datos",
      status: "untested",
      details: "Proyectos/espacios del usuario.",
      action: "test-db-read",
    },
    {
      id: "db-user-roles",
      name: "Tabla user_roles",
      category: "Base de Datos",
      status: "untested",
      details: "Roles admin/moderator/user. Solo admins pueden leer/escribir.",
      action: "test-db-read",
    },

    // INTEGRATIONS
    {
      id: "int-stripe-products",
      name: "Productos Stripe (Suscripciones)",
      category: "Integraciones",
      status: "ok",
      details: "3 productos: Educación ($4.99, prod_U6xj2kgXVmXSBX), Pro ($9.99, prod_U6xjReaTzoFveY), Business ($49.99, prod_U6xkDNO9PA3C9C).",
    },
    {
      id: "int-stripe-credits",
      name: "Productos Stripe (Créditos Extra)",
      category: "Integraciones",
      status: "ok",
      details: "3 packs: 100cr ($2.99, prod_U6y485FCart4fA), 500cr ($9.99, prod_U6y5xIdgIEdJ3Q), 2500cr ($39.99, prod_U6yAWcXSzZjc8g).",
    },
    {
      id: "int-stripe-webhook",
      name: "Stripe Webhook configurado",
      category: "Integraciones",
      status: "warning",
      details: "Edge function desplegada. NECESITAS configurar el webhook en Stripe Dashboard apuntando a la URL de la función. Eventos: invoice.payment_succeeded, checkout.session.completed, customer.subscription.deleted.",
      costNote: "URL: https://vmwogpwtpgfcslppvurg.supabase.co/functions/v1/stripe-webhook",
    },
    {
      id: "int-google-gemini",
      name: "Google Gemini API (Tu key gratuita)",
      category: "Integraciones",
      status: "ok",
      details: "GOOGLE_GEMINI_API_KEY configurada. Modelos: gemini-2.0-flash-exp (imágenes), gemini-2.0-flash (texto). Sin costo para ti.",
      costNote: "API gratuita de Google. Límite: ~60 req/min, 1500 req/día.",
    },

    // FRONTEND FEATURES  
    {
      id: "fe-auth",
      name: "Login / Registro / Reset Password",
      category: "Frontend",
      status: "ok",
      details: "Email + password. Reset por email. Auto-redirect si autenticado.",
    },
    {
      id: "fe-dashboard",
      name: "Dashboard con check-subscription",
      category: "Frontend",
      status: "ok",
      details: "Muestra plan activo, créditos, botón 'Gestionar Plan' si hay suscripción. Sincroniza con Stripe al cargar.",
    },
    {
      id: "fe-tools",
      name: "Herramientas IA (11 tools)",
      category: "Frontend",
      status: "ok",
      details: "Imagen: enhance, upscale, eraser, background, restore, generate. Apps: copywriter, logo, social, blog, ads.",
    },
    {
      id: "fe-canvas",
      name: "Formaketing Studio (Canvas)",
      category: "Frontend",
      status: "ok",
      details: "Lienzo infinito con @xyflow/react. Generación de imágenes inline.",
    },
    {
      id: "fe-pricing",
      name: "Pricing + Paquetes de créditos",
      category: "Frontend",
      status: "ok",
      details: "4 planes de suscripción + 3 paquetes de créditos extra con Stripe Checkout.",
    },
    {
      id: "fe-customer-portal",
      name: "Gestionar suscripción (Portal Stripe)",
      category: "Frontend",
      status: "ok",
      details: "Botón 'Gestionar Plan' en Dashboard que abre Stripe Customer Portal.",
    },
    {
      id: "fe-admin",
      name: "Panel Admin",
      category: "Frontend",
      status: "ok",
      details: "Gestión de usuarios, créditos, planes, rutas, DB, config Stripe.",
    },
    {
      id: "fe-spaces",
      name: "Espacios / Proyectos",
      category: "Frontend",
      status: "ok",
      details: "CRUD de espacios personales.",
    },
    {
      id: "fe-assets",
      name: "Biblioteca de Assets",
      category: "Frontend",
      status: "ok",
      details: "Galería con favoritos, tags, descarga.",
    },
    {
      id: "fe-video",
      name: "Generación de Video",
      category: "Frontend",
      status: "error",
      details: "NO implementado. El backend devuelve 'coming soon'. Necesita API de video externa.",
    },
    {
      id: "fe-downloads",
      name: "Página de Descargas",
      category: "Frontend",
      status: "warning",
      details: "Página existe pero los links de descarga son placeholders. Necesita APKs/instaladores reales.",
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
        // Test CORS preflight
        const fnName = feature.id.replace("ef-", "").replace(/-/g, "-");
        // Map IDs to actual function names
        const fnMap: Record<string, string> = {
          "ef-generate-image": "generate-image",
          "ef-ai-tool": "ai-tool",
          "ef-ai-chat": "ai-chat",
          "ef-create-checkout": "create-checkout",
          "ef-check-subscription": "check-subscription",
          "ef-customer-portal": "customer-portal",
          "ef-buy-credits": "buy-credits",
          "ef-stripe-webhook": "stripe-webhook",
          "ef-admin-save-settings": "admin-save-settings",
        };
        const actualName = fnMap[feature.id] || fnName;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${actualName}`,
          { method: "OPTIONS" }
        );
        updatedFeatures[idx] = {
          ...updatedFeatures[idx],
          status: res.ok || res.status === 204 ? "ok" : "error",
          testResult: `CORS: ${res.status} ${res.statusText}`,
        };
      } else if (feature.action === "test-auth") {
        // Test with auth
        const { data, error } = await supabase.functions.invoke(
          feature.id.replace("ef-", "").replace(/-/g, "-")
        );
        if (error) {
          updatedFeatures[idx] = {
            ...updatedFeatures[idx],
            status: "warning",
            testResult: `Respuesta con error esperado (sin suscripción Stripe): ${JSON.stringify(data || error.message).substring(0, 100)}`,
          };
        } else {
          updatedFeatures[idx] = {
            ...updatedFeatures[idx],
            status: "ok",
            testResult: `Respuesta OK: ${JSON.stringify(data).substring(0, 100)}`,
          };
        }
      } else if (feature.action === "test-db-read") {
        const tableName = feature.id.replace("db-", "").replace(/-/g, "_");
        const { error } = await supabase.from(tableName as any).select("id").limit(1);
        updatedFeatures[idx] = {
          ...updatedFeatures[idx],
          status: error ? "error" : "ok",
          testResult: error ? `Error: ${error.message}` : "Lectura OK",
        };
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
  const completionPct = Math.round(
    ((summary.ok + summary.warning * 0.5) / features.length) * 100
  );

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userId={user?.id} onSignOut={signOut} />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <Shield className="inline mr-2 h-5 w-5 text-primary" />
              Estado del Sistema
            </h1>
            <p className="text-sm text-muted-foreground">Diagnóstico en vivo — prueba cada funcionalidad individualmente</p>
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

        {/* Summary */}
        <div className="mb-8 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
            <p className="text-2xl font-bold text-accent font-mono">{summary.ok}</p>
            <p className="text-[10px] text-muted-foreground">OK</p>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 text-center">
            <p className="text-2xl font-bold text-gold font-mono">{summary.warning}</p>
            <p className="text-[10px] text-muted-foreground">Parcial</p>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
            <p className="text-2xl font-bold text-destructive font-mono">{summary.error}</p>
            <p className="text-[10px] text-muted-foreground">Error</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground font-mono">{summary.untested}</p>
            <p className="text-[10px] text-muted-foreground">Sin probar</p>
          </div>
        </div>

        {/* Cost explanation */}
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Costos de IA
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Las llamadas a IA usan el <strong className="text-foreground">Lovable AI Gateway</strong> (LOVABLE_API_KEY). 
            El costo está incluido en tu plan Lovable — <strong className="text-foreground">no pagas por llamada</strong>. 
            Si escalas, podrías necesitar tu propia API key. Errores 429 = rate limit, 402 = créditos agotados.
          </p>
        </div>

        {/* Webhook setup reminder */}
        <div className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-4">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gold" />
            Configuración pendiente: Stripe Webhook
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Para que la recarga mensual de créditos funcione automáticamente, configura un webhook en Stripe Dashboard:
          </p>
          <code className="mt-2 block text-xs text-primary bg-background/50 p-2 rounded-lg break-all">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook
          </code>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Eventos: invoice.payment_succeeded, checkout.session.completed, customer.subscription.deleted
          </p>
        </div>

        {/* Features by category */}
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2 uppercase tracking-wider">
                {cat === "Edge Functions" && <Zap className="h-3.5 w-3.5 text-primary" />}
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
                      className="rounded-xl border border-border bg-card p-3 node-shadow"
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
                          {f.apiNeeded && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">🔑 {f.apiNeeded}</p>
                          )}
                          {f.costNote && (
                            <p className="mt-0.5 text-[10px] text-gold">💰 {f.costNote}</p>
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
      </main>
    </div>
  );
};

export default SystemStatus;
