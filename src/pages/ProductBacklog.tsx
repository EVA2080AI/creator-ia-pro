import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, CheckCircle2, Circle, AlertTriangle, Clock,
  Sparkles, Shield, CreditCard, Palette, Wand2, Users,
  Globe, Smartphone, Zap, BarChart3, Bug, Rocket,
} from "lucide-react";

type Status = "done" | "partial" | "todo" | "blocked";
type Priority = "P0" | "P1" | "P2" | "P3";
type Team = "Frontend" | "Backend" | "Full-Stack" | "Design" | "DevOps" | "QA";

interface Feature {
  name: string;
  module: string;
  status: Status;
  completion: number; // 0-100
  team: Team;
  priority: Priority;
  notes: string;
  sprint?: string;
}

const features: Feature[] = [
  // AUTH & USERS
  { name: "Registro email/contraseña", module: "Auth", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "Funcional con confirmación email" },
  { name: "Login con Google OAuth", module: "Auth", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "Via Lovable Cloud Auth" },
  { name: "Login con Apple OAuth", module: "Auth", status: "done", completion: 100, team: "Full-Stack", priority: "P1", notes: "Via Lovable Cloud Auth" },
  { name: "Recuperar contraseña", module: "Auth", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "Email con link de reset" },
  { name: "Perfil de usuario", module: "Auth", status: "partial", completion: 60, team: "Frontend", priority: "P1", notes: "Falta edición de avatar y nombre desde UI" },
  { name: "Roles (admin/user/mod)", module: "Auth", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "user_roles con has_role() SECURITY DEFINER" },

  // CANVAS / FORMAKETING STUDIO
  { name: "Lienzo infinito ReactFlow", module: "Canvas", status: "done", completion: 100, team: "Frontend", priority: "P0", notes: "Zoom, pan, minimap, controles" },
  { name: "Nodos IA (imagen)", module: "Canvas", status: "done", completion: 90, team: "Full-Stack", priority: "P0", notes: "Genera con Gemini, guarda en assets. Falta upload de imagen base." },
  { name: "Nodos IA (video)", module: "Canvas", status: "todo", completion: 5, team: "Full-Stack", priority: "P2", notes: "Placeholder listo, generación no implementada" },
  { name: "Persistencia de posición", module: "Canvas", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "Drag & drop persiste en DB" },
  { name: "Suscripción realtime nodos", module: "Canvas", status: "done", completion: 100, team: "Full-Stack", priority: "P1", notes: "Actualización automática status" },
  { name: "Espacios/Proyectos", module: "Canvas", status: "done", completion: 85, team: "Full-Stack", priority: "P1", notes: "CRUD completo. Falta thumbnails automáticos." },
  { name: "Conexión entre nodos", module: "Canvas", status: "partial", completion: 40, team: "Frontend", priority: "P2", notes: "Edges visuales existen pero no hay lógica de flujo" },

  // AI TOOLS
  { name: "Mejorar Imagen (enhance)", module: "AI Tools", status: "done", completion: 90, team: "Backend", priority: "P0", notes: "Gemini 2.0 Flash. Resultados variables según input." },
  { name: "Ampliar 4x (upscale)", module: "AI Tools", status: "done", completion: 90, team: "Backend", priority: "P0", notes: "Funcional vía Gemini" },
  { name: "Borrar Objetos (eraser)", module: "AI Tools", status: "done", completion: 85, team: "Backend", priority: "P1", notes: "Funcional. Prompt opcional para especificar qué borrar." },
  { name: "Quitar Fondo", module: "AI Tools", status: "done", completion: 85, team: "Backend", priority: "P1", notes: "Funcional. A veces no genera transparencia real." },
  { name: "Restaurar Foto", module: "AI Tools", status: "done", completion: 85, team: "Backend", priority: "P1", notes: "Funcional vía Gemini" },
  { name: "Texto a Imagen", module: "AI Tools", status: "done", completion: 95, team: "Backend", priority: "P0", notes: "Canvas + Tools page. Usa Gemini image gen." },
  { name: "Logo Maker", module: "AI Tools", status: "done", completion: 80, team: "Backend", priority: "P1", notes: "Genera via Gemini. Calidad variable." },
  { name: "Social Media Kit", module: "AI Tools", status: "done", completion: 80, team: "Backend", priority: "P1", notes: "Genera imágenes. Falta generación de calendarios." },

  // AI APPS (text)
  { name: "AI Copywriter", module: "AI Apps", status: "done", completion: 90, team: "Backend", priority: "P0", notes: "Gemini chat. Genera copy marketing." },
  { name: "AI Blog Writer", module: "AI Apps", status: "done", completion: 90, team: "Backend", priority: "P1", notes: "Genera artículos SEO con estructura" },
  { name: "Ad Generator", module: "AI Apps", status: "done", completion: 90, team: "Backend", priority: "P1", notes: "Google Ads + Meta Ads copy" },

  // PAYMENTS
  { name: "Bold.co Checkout (Industrial)", module: "Pagos", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "Generación de links dinámicos vía Edge Function" },
  { name: "Bold.co Webhook (Secure)", module: "Pagos", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "Hardening con HMAC-SHA256 y carga atómica de créditos" },
  { name: "Deducción de créditos", module: "Pagos", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "Todas las tools y canvas deducen correctamente" },
  { name: "Rollback créditos en error", module: "Pagos", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "Si IA falla, créditos se devuelven" },

  // ADMIN
  { name: "Panel Admin - listar usuarios", module: "Admin", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "RPC admin_list_users" },
  { name: "Admin - cambiar tier", module: "Admin", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "RPC admin_update_tier" },
  { name: "Admin - ajustar créditos", module: "Admin", status: "done", completion: 100, team: "Full-Stack", priority: "P0", notes: "RPC admin_update_credits" },
  { name: "Admin - ban/unban usuario", module: "Admin", status: "done", completion: 100, team: "Full-Stack", priority: "P1", notes: "RPC admin_set_user_status" },
  { name: "Admin - configuración global", module: "Admin", status: "partial", completion: 50, team: "Full-Stack", priority: "P2", notes: "Falta guardar settings en DB (Google API key se muestra)" },

  // LANDING & MARKETING
  { name: "Landing page (Index)", module: "Marketing", status: "done", completion: 95, team: "Frontend", priority: "P0", notes: "Hero, tools, testimonios, CTA, apps móviles" },
  { name: "Landing por herramienta", module: "Marketing", status: "done", completion: 85, team: "Frontend", priority: "P1", notes: "12 herramientas con demo interactivo. Demos de imagen son ejemplos estáticos." },
  { name: "Página de Precios", module: "Marketing", status: "done", completion: 95, team: "Frontend", priority: "P0", notes: "4 planes + 3 packs créditos + FAQ" },
  { name: "Página de Descargas", module: "Marketing", status: "partial", completion: 30, team: "Frontend", priority: "P3", notes: "UI lista pero no hay apps nativas reales" },
  { name: "SEO / Meta tags", module: "Marketing", status: "partial", completion: 40, team: "Frontend", priority: "P2", notes: "Falta meta tags dinámicos por página, OG images, sitemap" },

  // LIBRARY & ASSETS
  { name: "Biblioteca de assets", module: "Assets", status: "done", completion: 90, team: "Full-Stack", priority: "P0", notes: "Galería con búsqueda, favoritos, eliminar" },
  { name: "Descarga de assets", module: "Assets", status: "partial", completion: 70, team: "Frontend", priority: "P1", notes: "Funciona para URLs. Base64 grandes pueden fallar." },
  { name: "Auto-guardado al generar", module: "Assets", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "Toda generación se guarda en saved_assets" },

  // INFRA & SECURITY
  { name: "RLS en todas las tablas", module: "Seguridad", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "profiles, canvas_nodes, saved_assets, spaces, transactions" },
  { name: "Edge Functions con auth", module: "Seguridad", status: "done", completion: 100, team: "Backend", priority: "P0", notes: "Todas verifican JWT" },
  { name: "Rate limiting IA", module: "Seguridad", status: "partial", completion: 40, team: "Backend", priority: "P1", notes: "Depende del rate limit de Google API (~60/min). No hay rate limit propio." },
  { name: "Almacenamiento en Storage", module: "Infra", status: "todo", completion: 10, team: "Backend", priority: "P1", notes: "Imágenes se guardan como base64/URLs, no en Storage bucket" },
  { name: "Error Boundary global", module: "Infra", status: "done", completion: 100, team: "Frontend", priority: "P0", notes: "Captura errores React" },
  { name: "System Status page", module: "Infra", status: "done", completion: 80, team: "Full-Stack", priority: "P2", notes: "Health checks de edge functions" },

  // UX / RESPONSIVE
  { name: "Responsive mobile", module: "UX", status: "partial", completion: 70, team: "Frontend", priority: "P1", notes: "Dashboard y tools OK. Canvas poco optimizado para mobile." },
  { name: "Dark mode", module: "UX", status: "done", completion: 100, team: "Frontend", priority: "P0", notes: "Tema oscuro por defecto, design tokens" },
  { name: "Loading states", module: "UX", status: "done", completion: 90, team: "Frontend", priority: "P0", notes: "Spinners, skeletons en mayoría de páginas" },
  { name: "Toast notifications", module: "UX", status: "done", completion: 100, team: "Frontend", priority: "P0", notes: "Sonner para success, error, info" },
];

// BACKLOG: features not yet started or blocked
interface BacklogItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  effort: "S" | "M" | "L" | "XL";
  team: Team;
  sprint: string;
  icon: typeof Sparkles;
}

const backlog: BacklogItem[] = [
  { id: "BL-001", title: "Storage Bucket para imágenes", description: "Migrar de base64/URLs a Supabase Storage para mejor rendimiento y descarga confiable.", priority: "P1", effort: "L", team: "Backend", sprint: "Sprint 5", icon: Shield },
  { id: "BL-002", title: "Rate Limiter propio", description: "Implementar rate limiting por usuario (requests/min) para prevenir abuso de la API gratuita.", priority: "P1", effort: "M", team: "Backend", sprint: "Sprint 5", icon: Shield },
  { id: "BL-003", title: "SEO dinámico por página", description: "Meta tags, OG images, sitemap.xml, robots.txt optimizado para cada herramienta.", priority: "P2", effort: "M", team: "Frontend", sprint: "Sprint 6", icon: Globe },
  { id: "BL-004", title: "Edición de perfil completa", description: "UI para cambiar avatar, nombre, email de notificación desde el dashboard.", priority: "P1", effort: "S", team: "Frontend", sprint: "Sprint 5", icon: Users },
  { id: "BL-005", title: "Generación de Video IA", description: "Integrar modelo de video (Google Veo o similar) para nodos de video en canvas.", priority: "P2", effort: "XL", team: "Full-Stack", sprint: "Sprint 7", icon: Sparkles },
  { id: "BL-006", title: "Canvas: Flujo entre nodos", description: "Lógica de conexión: output de un nodo como input del siguiente (pipelines).", priority: "P2", effort: "L", team: "Full-Stack", sprint: "Sprint 6", icon: Palette },
  { id: "BL-007", title: "Bold Webhooks E2E test", description: "Testeo end-to-end del flujo completo de pago → webhook → créditos recargados con producción real.", priority: "P0", effort: "S", team: "QA", sprint: "Sprint 5", icon: CreditCard },
  { id: "BL-008", title: "Demo real con IA para landing", description: "Reemplazar demos estáticos de herramientas de imagen con procesamiento real limitado (1 demo gratis).", priority: "P1", effort: "L", team: "Full-Stack", sprint: "Sprint 6", icon: Wand2 },
  { id: "BL-009", title: "Canvas responsive (mobile)", description: "Optimizar canvas para tablets/móviles con gestos táctiles.", priority: "P2", effort: "L", team: "Frontend", sprint: "Sprint 7", icon: Smartphone },
  { id: "BL-010", title: "Analytics dashboard admin", description: "Métricas de uso: generaciones/día, usuarios activos, revenue, churn rate.", priority: "P2", effort: "L", team: "Full-Stack", sprint: "Sprint 7", icon: BarChart3 },
  { id: "BL-011", title: "Verificación académica (Educación)", description: "Flujo para verificar email .edu o documento para plan Educación.", priority: "P2", effort: "M", team: "Full-Stack", sprint: "Sprint 7", icon: Users },
  { id: "BL-012", title: "Exportar campaña desde canvas", description: "Exportar flows de marketing como PDF/imagen del canvas completo.", priority: "P2", effort: "M", team: "Frontend", sprint: "Sprint 6", icon: Rocket },
];

const statusConfig: Record<Status, { icon: typeof CheckCircle2; color: string; label: string }> = {
  done: { icon: CheckCircle2, color: "text-green-400", label: "Completado" },
  partial: { icon: AlertTriangle, color: "text-amber-400", label: "Parcial" },
  todo: { icon: Circle, color: "text-muted-foreground", label: "Pendiente" },
  blocked: { icon: Bug, color: "text-destructive", label: "Bloqueado" },
};

const priorityColors: Record<Priority, string> = {
  P0: "bg-destructive/20 text-destructive border-destructive/30",
  P1: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  P2: "bg-primary/20 text-primary border-primary/30",
  P3: "bg-muted text-muted-foreground border-border",
};

const effortColors: Record<string, string> = {
  S: "bg-green-500/20 text-green-400",
  M: "bg-amber-500/20 text-amber-400",
  L: "bg-orange-500/20 text-orange-400",
  XL: "bg-destructive/20 text-destructive",
};

const ProductBacklog = () => {
  const navigate = useNavigate();

  const totalCompletion = Math.round(features.reduce((sum, f) => sum + f.completion, 0) / features.length);
  const doneCount = features.filter(f => f.status === "done").length;
  const partialCount = features.filter(f => f.status === "partial").length;
  const todoCount = features.filter(f => f.status === "todo").length;

  const modules = [...new Set(features.map(f => f.module))];
  const moduleStats = modules.map(mod => {
    const modFeatures = features.filter(f => f.module === mod);
    const avg = Math.round(modFeatures.reduce((s, f) => s + f.completion, 0) / modFeatures.length);
    return { module: mod, features: modFeatures.length, completion: avg };
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Product Backlog | Creator IA Pro</title></Helmet>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Product Backlog — <span className="gradient-text">Creator IA Pro</span>
          </h1>
          <p className="text-xs text-muted-foreground">Matriz de funcionalidades & Sprint Backlog</p>
        </div>
      </header>

      <main id="main-content" className="relative z-10 mx-auto max-w-7xl px-6 py-8 space-y-10">
        {/* SUMMARY */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-4xl font-bold text-foreground font-mono">{totalCompletion}%</p>
            <p className="text-xs text-muted-foreground mt-1">Progreso Global</p>
            <Progress value={totalCompletion} className="mt-3 h-2" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-4xl font-bold text-green-400 font-mono">{doneCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-4xl font-bold text-amber-400 font-mono">{partialCount}</p>
            <p className="text-xs text-muted-foreground mt-1">En Progreso</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-4xl font-bold text-muted-foreground font-mono">{todoCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
          </div>
        </section>

        {/* MODULE BREAKDOWN */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">📊 Progreso por Módulo</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moduleStats.sort((a, b) => a.completion - b.completion).map(ms => (
              <div key={ms.module} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{ms.module}</span>
                  <span className={`text-sm font-mono font-bold ${ms.completion >= 90 ? "text-green-400" : ms.completion >= 60 ? "text-amber-400" : "text-destructive"}`}>
                    {ms.completion}%
                  </span>
                </div>
                <Progress value={ms.completion} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{ms.features} funcionalidades</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE MATRIX */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">🗂️ Matriz de Funcionalidades</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Funcionalidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Módulo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">%</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Equipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Notas</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => {
                  const sc = statusConfig[f.status];
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <sc.icon className={`h-4 w-4 ${sc.color}`} />
                          <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{f.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs border-border">{f.module}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-mono text-xs font-bold ${f.completion >= 90 ? "text-green-400" : f.completion >= 60 ? "text-amber-400" : "text-destructive"}`}>
                          {f.completion}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-xs ${priorityColors[f.priority]}`}>{f.priority}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.team}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[250px] truncate">{f.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* SPRINT BACKLOG */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">🚀 Backlog Priorizado (Próximos Sprints)</h2>
          <div className="space-y-3">
            {backlog.map(item => (
              <div key={item.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={`text-xs ${priorityColors[item.priority]}`}>{item.priority}</Badge>
                    <Badge className={`text-xs ${effortColors[item.effort]}`}>Esfuerzo: {item.effort}</Badge>
                    <Badge variant="outline" className="text-xs border-border">{item.team}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.sprint}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RISK MATRIX */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">⚠️ Riesgos Identificados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { risk: "API Google gratuita tiene límite 60 req/min", impact: "Alto", mitigation: "Implementar rate limiter propio + cola de espera", color: "border-destructive/30 bg-destructive/5" },
              { risk: "Base64 en DB hace assets pesados", impact: "Medio", mitigation: "Migrar a Storage bucket (BL-001)", color: "border-amber-500/30 bg-amber-500/5" },
              { risk: "Demos de imagen no son reales", impact: "Medio", mitigation: "Implementar demo real limitado (BL-008). Ya marcados como 'ejemplo'.", color: "border-amber-500/30 bg-amber-500/5" },
              { risk: "Webhook Bold sin llaves de producción", impact: "Alto", mitigation: "Solicitar BOLD_WEBHOOK_SECRET al cliente", color: "border-destructive/30 bg-destructive/5" },
              { risk: "Página de Descargas tiene links ficticios", impact: "Bajo", mitigation: "Agregar 'Próximamente' badges o remover página", color: "border-border bg-muted/20" },
              { risk: "No hay backup de datos de usuario", impact: "Alto", mitigation: "Configurar backup automático de DB", color: "border-destructive/30 bg-destructive/5" },
            ].map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.color}`}>
                <p className="text-sm font-medium text-foreground">{r.risk}</p>
                <p className="text-xs text-muted-foreground mt-1">Impacto: {r.impact}</p>
                <p className="text-xs text-accent mt-0.5">→ {r.mitigation}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductBacklog;
