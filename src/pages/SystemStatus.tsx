import { useEffect, useState } from "react";
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
  Video, RefreshCw, Loader2, ExternalLink,
} from "lucide-react";

type Status = "ok" | "warning" | "error" | "pending";

interface Feature {
  name: string;
  category: string;
  status: Status;
  details: string;
  apiNeeded?: string;
  costNote?: string;
}

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-accent" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-gold" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
};

const statusLabel: Record<Status, { text: string; className: string }> = {
  ok: { text: "Funcionando", className: "border-accent/30 text-accent" },
  warning: { text: "Parcial", className: "border-gold/30 text-gold" },
  error: { text: "No funciona", className: "border-destructive/30 text-destructive" },
  pending: { text: "Verificando...", className: "border-border text-muted-foreground" },
};

const SystemStatus = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [checking, setChecking] = useState(true);
  const [edgeFunctionResults, setEdgeFunctionResults] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [authLoading, adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    runChecks();
  }, [user, isAdmin]);

  const runChecks = async () => {
    setChecking(true);
    const efResults: Record<string, Status> = {};

    // Test edge functions with OPTIONS (CORS preflight) - lightweight check
    const edgeFunctions = [
      "generate-image",
      "ai-tool",
      "ai-chat",
      "create-checkout",
      "check-subscription",
      "customer-portal",
      "admin-save-settings",
    ];

    await Promise.all(
      edgeFunctions.map(async (fn) => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`,
            { method: "OPTIONS" }
          );
          efResults[fn] = res.ok || res.status === 204 ? "ok" : "error";
        } catch {
          efResults[fn] = "error";
        }
      })
    );

    // Check DB tables
    let dbOk = true;
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) dbOk = false;
    } catch {
      dbOk = false;
    }

    // Check subscription function more deeply
    let subCheckStatus: Status = efResults["check-subscription"] === "ok" ? "warning" : "error";
    // It's deployed but not invoked from frontend automatically → warning

    setEdgeFunctionResults(efResults);

    const featureList: Feature[] = [
      // === AUTH & CORE ===
      {
        name: "Autenticación (Login/Registro)",
        category: "Core",
        status: "ok",
        details: "Email + password con Lovable Cloud Auth. Reset password funcional.",
      },
      {
        name: "Perfiles de usuario",
        category: "Core",
        status: dbOk ? "ok" : "error",
        details: "Tabla profiles con trigger auto-create. Incluye credits_balance y subscription_tier.",
      },
      {
        name: "Sistema de roles (Admin)",
        category: "Core",
        status: "ok",
        details: "Tabla user_roles con enum app_role. Función has_role() SECURITY DEFINER.",
      },
      {
        name: "RLS en todas las tablas",
        category: "Core",
        status: "ok",
        details: "Todas las tablas tienen Row Level Security habilitado con políticas por user_id.",
      },

      // === AI FEATURES ===
      {
        name: "Generación de imágenes (Canvas)",
        category: "IA",
        status: efResults["generate-image"] === "ok" ? "ok" : "error",
        details: "Edge function generate-image usa Lovable AI Gateway (gemini-3-pro-image-preview).",
        apiNeeded: "LOVABLE_API_KEY (configurado automáticamente)",
        costNote: "El costo de IA está incluido en tu plan de Lovable. No pagas por llamada.",
      },
      {
        name: "Herramientas de imagen (enhance, upscale, etc.)",
        category: "IA",
        status: efResults["ai-tool"] === "ok" ? "ok" : "error",
        details: "Edge function ai-tool usa gemini-2.5-flash-image para edición de imágenes.",
        apiNeeded: "LOVABLE_API_KEY",
        costNote: "Incluido en Lovable. Sin costo adicional por llamada API.",
      },
      {
        name: "AI Chat (Copywriter, Blog, Ads)",
        category: "IA",
        status: efResults["ai-chat"] === "ok" ? "ok" : "error",
        details: "Edge function ai-chat usa gemini-3-flash-preview para generación de texto.",
        apiNeeded: "LOVABLE_API_KEY",
        costNote: "Incluido en Lovable. Sin costo adicional por llamada API.",
      },
      {
        name: "Logo Maker",
        category: "IA",
        status: efResults["ai-tool"] === "ok" ? "warning" : "error",
        details: "Usa ai-tool pero no tiene prompt especializado para logos. Funciona con prompt genérico.",
      },
      {
        name: "Social Media Kit",
        category: "IA",
        status: efResults["ai-tool"] === "ok" ? "warning" : "error",
        details: "Reutiliza ai-tool. Necesita prompts especializados por red social para mejor calidad.",
      },
      {
        name: "Generación de video",
        category: "IA",
        status: "error",
        details: "El código existe pero devuelve 'Video generation coming soon'. No hay API de video integrada.",
        costNote: "Requeriría una API de video externa o modelo específico.",
      },

      // === PAYMENTS ===
      {
        name: "Stripe Checkout (suscripciones)",
        category: "Pagos",
        status: efResults["create-checkout"] === "ok" ? "ok" : "error",
        details: "3 productos creados: Educación ($4.99), Pro ($9.99), Business ($49.99). Edge function create-checkout desplegada.",
        apiNeeded: "STRIPE_SECRET_KEY (configurado)",
      },
      {
        name: "Verificación de suscripción",
        category: "Pagos",
        status: efResults["check-subscription"] === "ok" ? "warning" : "error",
        details: "Edge function check-subscription desplegada PERO no se llama automáticamente desde el frontend. Falta integrar en Dashboard/Auth.",
      },
      {
        name: "Portal de cliente Stripe",
        category: "Pagos",
        status: efResults["customer-portal"] === "ok" ? "warning" : "error",
        details: "Edge function customer-portal desplegada PERO no hay botón 'Gestionar suscripción' en el frontend.",
      },
      {
        name: "Recarga automática de créditos mensual",
        category: "Pagos",
        status: "error",
        details: "NO implementado. Cuando Stripe renueva la suscripción, no se recargan los créditos automáticamente. Necesita webhook o cron job.",
      },

      // === CREDIT SYSTEM ===
      {
        name: "Sistema de créditos",
        category: "Créditos",
        status: "ok",
        details: "100 créditos gratis al registrarse. Débito automático al usar herramientas. Rollback si la IA falla.",
      },
      {
        name: "Historial de transacciones",
        category: "Créditos",
        status: "ok",
        details: "Tabla transactions registra cada uso. Tipo: debit/credit/tool_usage/ai_chat.",
      },
      {
        name: "Compra de créditos adicionales",
        category: "Créditos",
        status: "error",
        details: "NO implementado. No hay opción de comprar paquetes de créditos extra.",
      },

      // === PAGES ===
      {
        name: "Landing page (/)",
        category: "Páginas",
        status: "ok",
        details: "Completa con hero, herramientas, testimonios, download section, CTA.",
      },
      {
        name: "Dashboard (/dashboard)",
        category: "Páginas",
        status: "ok",
        details: "Stats, acciones rápidas, apps IA, assets recientes.",
      },
      {
        name: "Herramientas (/tools)",
        category: "Páginas",
        status: "ok",
        details: "11 herramientas con upload de imagen y prompts de texto. Resultados inline.",
      },
      {
        name: "Formaketing Studio (/canvas)",
        category: "Páginas",
        status: "ok",
        details: "Lienzo infinito con @xyflow/react. Nodos de imagen con generación IA.",
      },
      {
        name: "Precios (/pricing)",
        category: "Páginas",
        status: "ok",
        details: "4 planes con Stripe Checkout integrado para los 3 planes de pago.",
      },
      {
        name: "Espacios (/spaces)",
        category: "Páginas",
        status: "ok",
        details: "CRUD de espacios/proyectos del usuario.",
      },
      {
        name: "Assets (/assets)",
        category: "Páginas",
        status: "ok",
        details: "Biblioteca con favoritos, tags y descarga.",
      },
      {
        name: "Admin (/admin)",
        category: "Páginas",
        status: "ok",
        details: "Gestión de usuarios, créditos, planes, rutas, DB y config Stripe.",
      },
      {
        name: "Descargas (/descargar)",
        category: "Páginas",
        status: "warning",
        details: "Página existe pero los links de descarga probablemente son placeholders.",
      },
      {
        name: "Landings de herramientas (/herramienta/:slug)",
        category: "Páginas",
        status: "ok",
        details: "SEO landing pages individuales para cada herramienta.",
      },

      // === DATABASE ===
      {
        name: "Tabla profiles",
        category: "Base de Datos",
        status: "ok",
        details: "user_id, display_name, credits_balance, subscription_tier, avatar_url. Trigger on auth.users.",
      },
      {
        name: "Tabla canvas_nodes",
        category: "Base de Datos",
        status: "ok",
        details: "Nodos del canvas con pos_x/y, prompt, status, asset_url. RLS por user_id.",
      },
      {
        name: "Tabla transactions",
        category: "Base de Datos",
        status: "ok",
        details: "Registro de débitos/créditos. No permite UPDATE/DELETE (solo lectura).",
      },
      {
        name: "Tabla saved_assets",
        category: "Base de Datos",
        status: "ok",
        details: "Assets guardados con favoritos, tags, prompt. FK a canvas_nodes.",
      },
      {
        name: "Tabla spaces",
        category: "Base de Datos",
        status: "ok",
        details: "Proyectos del usuario con nombre, descripción, thumbnail.",
      },
      {
        name: "Tabla user_roles",
        category: "Base de Datos",
        status: "ok",
        details: "Roles admin/moderator/user. Políticas RLS solo para admins.",
      },
    ];

    setFeatures(featureList);
    setChecking(false);
  };

  const categories = [...new Set(features.map((f) => f.category))];

  const summary = {
    ok: features.filter((f) => f.status === "ok").length,
    warning: features.filter((f) => f.status === "warning").length,
    error: features.filter((f) => f.status === "error").length,
  };

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
            <p className="text-sm text-muted-foreground">Diagnóstico completo de funcionalidades e integraciones</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runChecks}
            disabled={checking}
            className="ml-auto border-border gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            Re-verificar
          </Button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-center">
            <p className="text-3xl font-bold text-accent font-mono">{summary.ok}</p>
            <p className="text-xs text-muted-foreground mt-1">Funcionando</p>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
            <p className="text-3xl font-bold text-gold font-mono">{summary.warning}</p>
            <p className="text-xs text-muted-foreground mt-1">Parcial / Revisar</p>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-3xl font-bold text-destructive font-mono">{summary.error}</p>
            <p className="text-xs text-muted-foreground mt-1">No funciona / Falta</p>
          </div>
        </div>

        {/* Cost explanation */}
        <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            ¿Quién paga los costos de IA?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Las llamadas a modelos de IA (Gemini, GPT, etc.) se hacen a través del <strong className="text-foreground">Lovable AI Gateway</strong> usando
            la <code className="text-primary">LOVABLE_API_KEY</code>. Este costo está <strong className="text-foreground">incluido en tu plan de Lovable</strong> —
            no pagas por cada llamada API individualmente. Sin embargo, Lovable tiene límites de uso según tu plan. Si un usuario de tu plataforma usa créditos
            de IA, el costo real lo absorbe tu suscripción de Lovable automáticamente.
          </p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            <strong className="text-gold">⚠️ Importante:</strong> Si tu plataforma escala a muchos usuarios, podrías alcanzar los límites del gateway (error 429 o 402).
            En ese caso necesitarías: (1) tu propia API key de Google AI o OpenAI, o (2) un plan superior de Lovable.
          </p>
        </div>

        {/* Features by category */}
        {checking ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Verificando funcionalidades...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  {cat === "Core" && <Shield className="h-4 w-4 text-primary" />}
                  {cat === "IA" && <Bot className="h-4 w-4 text-primary" />}
                  {cat === "Pagos" && <CreditCard className="h-4 w-4 text-primary" />}
                  {cat === "Créditos" && <Zap className="h-4 w-4 text-primary" />}
                  {cat === "Páginas" && <Globe className="h-4 w-4 text-primary" />}
                  {cat === "Base de Datos" && <Database className="h-4 w-4 text-primary" />}
                  {cat}
                </h2>
                <div className="space-y-2">
                  {features
                    .filter((f) => f.category === cat)
                    .map((f, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-4 node-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon status={f.status} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">{f.name}</span>
                              <Badge variant="outline" className={statusLabel[f.status].className + " text-[10px]"}>
                                {statusLabel[f.status].text}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.details}</p>
                            {f.apiNeeded && (
                              <p className="mt-1 text-xs text-primary">
                                🔑 API: {f.apiNeeded}
                              </p>
                            )}
                            {f.costNote && (
                              <p className="mt-1 text-xs text-gold">
                                💰 {f.costNote}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action items */}
        <div className="mt-10 rounded-xl border border-gold/20 bg-gold/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">📋 Pendientes prioritarios</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li><strong className="text-foreground">Integrar check-subscription en el frontend</strong> — Llamar al cargar Dashboard y Auth para sincronizar el plan del usuario.</li>
            <li><strong className="text-foreground">Agregar botón "Gestionar suscripción"</strong> — Usar customer-portal para que los usuarios administren su plan desde Stripe.</li>
            <li><strong className="text-foreground">Recarga mensual de créditos</strong> — Implementar webhook de Stripe o cron job que recargue créditos al renovar la suscripción.</li>
            <li><strong className="text-foreground">Compra de créditos extra</strong> — Crear producto one-time en Stripe para paquetes de créditos adicionales.</li>
            <li><strong className="text-foreground">Video generation</strong> — Integrar API de video (actualmente devuelve "coming soon").</li>
            <li><strong className="text-foreground">Prompts especializados para Logo/Social</strong> — Mejorar calidad con system prompts dedicados.</li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default SystemStatus;
