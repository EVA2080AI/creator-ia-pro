import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Minus, Scale, BarChart3, ListTodo, FolderOpen, User, ShieldCheck,
  Sun, Moon, LogOut, Bug, HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Logo } from "@/components/Logo";
import { ReportModal } from "@/components/tickets/ReportModal";
import { QuickGuideModal } from "@/components/basalt/QuickGuideModal";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { listAssistants, type Assistant } from "@/lib/assistants";

const EXPERTS_COLLAPSED_COUNT = 5;

export interface BasaltShellSidebarProps {
  /** Ruta actual — resalta el ítem de "Plataforma" correspondiente. Un
   *  simple `location.pathname === path` alcanza, sin matching de subrutas. */
  activePath: string;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  theme: "light" | "dark";
  setTheme: Dispatch<SetStateAction<"light" | "dark">>;
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
  const [showReport, setShowReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [experts, setExperts] = useState<Assistant[]>([]);
  const [expertsExpanded, setExpertsExpanded] = useState(false);

  useEffect(() => {
    if (autoOpenGuide) setShowGuide(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenGuide]);

  useEffect(() => {
    // "genesis" era Basalt-como-constructor — redundante ahora que Basalt lo
    // absorbió; el resto son los expertos por área (marketing, legal, etc.).
    listAssistants().then((all) => setExperts(all.filter((a) => a.slug !== "genesis")));
  }, []);

  const go = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    if (onNewChat) onNewChat();
    else navigate("/a/basalt");
    setSidebarOpen(false);
  };

  const platform = (path: string, label: string, Icon: typeof BarChart3) => {
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
        <div className="asst-side-top">
          {/* Basalt YA es el inicio — sin flecha de "volver", no hay ningún
              lado del que "volver" (pedido directo del usuario, viendo la
              UI). El panel de métricas pasa a la sección Plataforma, como
              un destino más, no como una flecha ambigua arriba. */}
          <Logo size="sm" showText onClick={() => navigate("/a/basalt")} />
        </div>
        <button className="asst-new-chat" onClick={handleNewChat}>
          <Plus className="w-4 h-4" /> Nuevo chat
        </button>

        <button className="asst-side-link" onClick={() => go("/a/arena")}>
          <Scale className="w-4 h-4" /> Arena IA
        </button>

        {beforeExperts}

        {experts.length > 0 && (
          <>
            <div className="asst-switcher-label">Expertos</div>
            <div>
              {(expertsExpanded ? experts : experts.slice(0, EXPERTS_COLLAPSED_COUNT)).map((a) => (
                <button
                  key={a.slug}
                  className="asst-switch-item"
                  onClick={() => go(`/a/${a.slug}`)}
                  title={a.tagline || a.name}
                >
                  <span className="asst-switch-dot" style={{ background: a.brand.accent || "var(--asst-txt-3)" }} />
                  {a.name}
                </button>
              ))}
              {experts.length > EXPERTS_COLLAPSED_COUNT && (
                <button
                  className="asst-side-link"
                  onClick={() => setExpertsExpanded((v) => !v)}
                  style={{ color: "var(--asst-txt-3)", fontSize: 12 }}
                >
                  {expertsExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {expertsExpanded ? "Ver menos" : `Ver ${experts.length - EXPERTS_COLLAPSED_COUNT} más`}
                </button>
              )}
            </div>
          </>
        )}

        {extraNav}

        <div className="asst-switcher-label">Plataforma</div>
        {platform("/dashboard", "Panel de métricas", BarChart3)}
        {platform("/tasks", "Tareas", ListTodo)}
        {platform("/spaces", "Proyectos", FolderOpen)}
        {platform("/profile", "Perfil", User)}
        {isAdmin && platform("/admin", "Panel Admin", ShieldCheck)}

        <div className="asst-side-bottom">
          <button className="asst-side-link" onClick={() => setShowGuide(true)}>
            <HelpCircle className="w-4 h-4" /> Guía rápida
          </button>
          <button className="asst-side-link" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
          {/* "Reportar" era un botón flotante suelto encima de todo — ahora
              es una opción que se despliega desde la cuenta (auditoría UX,
              mismo patrón que el menú de cuenta de Claude). */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="asst-side-link">
                <User className="w-4 h-4" /> Cuenta
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56 p-1.5 rounded-2xl shadow-2xl">
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => setShowReport(true)}>
                <Bug className="w-4 h-4" /> Reportar un error o mejora
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
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
