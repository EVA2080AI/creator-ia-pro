import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Scale, ListTodo, FolderOpen, User, ShieldCheck,
  Sun, Moon, LogOut, Bug, HelpCircle, Settings, Activity, LifeBuoy, CreditCard,
  LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useProfile } from "@/hooks/useProfile";
import { Logo } from "@/components/Logo";
import { ReportModal } from "@/components/tickets/ReportModal";
import { QuickGuideModal } from "@/components/basalt/QuickGuideModal";
import { ExpertsAccordion } from "./ExpertsAccordion";
import { CANVAS_ENABLED } from "@/lib/features";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { listAssistants, type Assistant } from "@/lib/assistants";

// Mismo mapa que Profile.tsx (TIER_LABELS) — se duplica acá porque es un
// objeto de 7 entradas, no amerita un módulo compartido.
const TIER_LABELS: Record<string, string> = { free: "Free", creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme", pymes: "Pymes", admin: "Admin" };

export interface BasaltShellSidebarProps {
  /** Ruta actual — resalta el ítem de "Plataforma" correspondiente. Un
   *  simple `location.pathname === path` alcanza, sin matching de subrutas. */
  activePath: string;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  theme: "light" | "dark";
  /** Plano — el único tema es el global (useTheme()), así que basta con el
   *  valor destino, no un updater funcional tipo Dispatch. */
  setTheme: (next: "light" | "dark") => void;
  /** "Nuevo chat" por defecto navega a /a/basalt (no hay chat propio en estas
   *  páginas). Basalt.tsx pasa su propio reset de conversación acá. */
  onNewChat?: () => void;
  /** Slot para contenido específico de Basalt.tsx que va ANTES de "Expertos"
   *  (hoy: el toggle de Memoria + su panel). No lo usan las páginas de
   *  Plataforma (Dashboard/Tasks/Spaces/Profile). */
  beforeExperts?: ReactNode;
  /** Slot para contenido específico de Basalt.tsx que va DESPUÉS de
   *  "Expertos" y antes de "Plataforma" (hoy: "Conversaciones"). */
  extraNav?: ReactNode;
  /** true la primera vez que un usuario nuevo entra a /a/basalt (calculado
   *  una sola vez en Basalt.tsx con hasSeenBasaltGuide()) — abre la guía
   *  rápida automáticamente sin que el usuario tenga que buscarla. */
  autoOpenGuide?: boolean;
}

/**
 * Shell de navegación de Basalt, extraído de Basalt.tsx para poder envolver
 * también /dashboard, /tasks, /spaces y /profile con la MISMA sidebar
 * (auditoría UX 2026-09-28: "todo debe estar dentro de basalt no afuera").
 *
 * Solo incluye las partes que no dependen del estado vivo del chat — Memoria
 * y Conversaciones siguen viviendo únicamente en Basalt.tsx, inyectadas acá
 * vía `beforeExperts`/`extraNav` en sus posiciones originales exactas.
 */
export function BasaltShellSidebar({
  activePath, sidebarOpen, setSidebarOpen, theme, setTheme, onNewChat, beforeExperts, extraNav, autoOpenGuide,
}: BasaltShellSidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin(user?.id);
  const { profile } = useProfile(user?.id);
  const [showReport, setShowReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [experts, setExperts] = useState<Assistant[]>([]);

  useEffect(() => {
    if (autoOpenGuide) setShowGuide(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenGuide]);

  useEffect(() => {
    // "genesis" era Basalt-como-constructor — redundante ahora que Basalt lo
    // absorbió; el resto son los expertos por área (marketing, legal, etc.).
    listAssistants().then((all) => setExperts(all.filter((a) => a.slug !== "genesis")));
  }, []);

  // Escape cierra el cajón en móvil (en escritorio el sidebar es fijo: setSidebarOpen(false) no cambia nada).
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  const go = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    if (onNewChat) onNewChat();
    else navigate("/a/basalt");
    setSidebarOpen(false);
  };

  // Mismo gate y mismo mensaje que SidebarGlobal para Canvas IA — antes esto
  // no aparecía en ningún lado del shell nuevo de Basalt (auditoría UX
  // 2026-09-29: WelcomeOnboarding lo mencionaba pero no había forma de
  // encontrarlo).
  const handleCanvasClick = () => {
    if (!CANVAS_ENABLED && !isAdmin) {
      toast("Canvas IA — Próximamente", { description: "Estamos terminando esta función. Te avisaremos cuando esté lista." });
      return;
    }
    go("/studio-flow");
  };

  const platform = (path: string, label: string, Icon: typeof ListTodo) => {
    const active = activePath === path;
    return (
      <button
        key={path}
        className={`asst-side-link ${active ? "active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => go(path)}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  };

  return (
    <>
      <nav className={`asst-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Basalt">
        <div className="asst-side-scroll">
        <div className="asst-side-top">
          {/* Basalt YA es el inicio — sin flecha de "volver", no hay ningún
              lado del que "volver" (pedido directo del usuario, viendo la
              UI). El panel de métricas pasa a la sección Plataforma, como
              un destino más, no como una flecha ambigua arriba. */}
          <Logo size="sm" showText onClick={() => go("/a/basalt")} />
        </div>
        <button className="asst-new-chat" onClick={handleNewChat}>
          <Plus className="w-4 h-4" /> Nuevo chat
        </button>

        <button className="asst-side-link" onClick={() => go("/a/arena")}>
          <Scale className="w-4 h-4" /> Arena IA
        </button>
        {/* Mientras Canvas IA no esté listo, para un usuario normal era un ítem de menú
            que solo abría un aviso de "Próximamente": ocupa lugar y no lleva a ningún
            lado (auditoría del cajón, 2026-09-30). Los admins sí lo ven para probarlo. */}
        {(CANVAS_ENABLED || isAdmin) && (
          <button className="asst-side-link" onClick={handleCanvasClick}>
            <LayoutTemplate className="w-4 h-4" /> Canvas IA
          </button>
        )}

        {beforeExperts}

        <ExpertsAccordion experts={experts} onSelect={(a) => go(`/a/${a.slug}`)} />

        {/* "Panel de métricas" y "Perfil" salieron de acá: eran los MISMOS destinos que
            "Uso" y "Configuración" del menú de cuenta, un poco más abajo. El cajón
            necesitaba 801px de alto en una pantalla de 664 (medido en un iPhone 13) y
            el pie —guía, tema y cuenta— quedaba fuera de la vista.
            Plataforma va ANTES del historial: la lista de conversaciones crece sin
            límite y dejaba "Tareas" y "Proyectos" a varios deslizamientos de distancia
            (visto en producción con 8 conversaciones). Lo fijo arriba, lo que crece
            abajo. */}
        <div className="asst-switcher-label">Plataforma</div>
        {platform("/tasks", "Tareas", ListTodo)}
        {platform("/spaces", "Proyectos", FolderOpen)}
        {isAdmin && platform("/admin", "Panel Admin", ShieldCheck)}

        {extraNav}

        </div>

        <div className="asst-side-bottom">
          <button className="asst-side-link" onClick={() => setShowGuide(true)}>
            <HelpCircle className="w-4 h-4" /> Guía rápida
          </button>
          <button className="asst-side-link" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
          {/* "Reportar" era un botón flotante suelto encima de todo — ahora
              es una opción que se despliega desde la cuenta (auditoría UX,
              mismo patrón que el menú de cuenta de Claude/Gemini: email
              arriba, Configuración/Uso/Ayuda, planes, y cerrar sesión). */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="asst-side-link" style={{ gap: 8 }}>
                <User className="w-4 h-4 shrink-0" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: "0 1 auto" }}>
                  {profile?.displayName || user?.email?.split("@")[0] || "Cuenta"}
                </span>
                <span style={{ color: "var(--asst-txt-3)", flexShrink: 0 }}>
                  · {TIER_LABELS[profile?.subscriptionTier ?? "free"] ?? "Free"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-64 p-1.5 rounded-2xl shadow-2xl">
              <DropdownMenuLabel className="px-3 py-1.5 text-[12px] font-normal truncate" style={{ color: "var(--asst-txt-3)" }}>
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => go("/profile")}>
                <Settings className="w-4 h-4" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => go("/dashboard")}>
                <Activity className="w-4 h-4" /> Uso
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => go("/help")}>
                <LifeBuoy className="w-4 h-4" /> Obtener ayuda
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => go("/pricing")}>
                <CreditCard className="w-4 h-4" /> Ver todos los planes
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => setShowReport(true)}>
                <Bug className="w-4 h-4" /> Reportar un error o mejora
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer text-rose-500 focus:text-rose-500" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ReportModal open={showReport} onClose={() => setShowReport(false)} />
          <QuickGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
        </div>
      </nav>
      <div className={`asst-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />
    </>
  );
}
