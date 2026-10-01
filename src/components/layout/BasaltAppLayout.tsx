import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { BasaltShellSidebar } from "./BasaltShellSidebar";
import { useTheme } from "@/hooks/useTheme";
import { BASALT_ASSISTANT as A } from "@/lib/basalt";
import { brandCssVars } from "@/lib/assistants";
import "@/pages/Assistant.css";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Panel de métricas",
  "/tasks": "Tareas",
  "/tareas": "Tareas",
  "/spaces": "Proyectos",
  "/assets": "Proyectos",
  "/hub": "Proyectos",
  "/profile": "Perfil",
  "/sharescreen": "ShareScreen",
};

/**
 * Envoltorio de layout para /dashboard, /tasks, /spaces y /profile — las
 * mete dentro del MISMO shell que Basalt (sidebar `asst-*`) en vez del shell
 * "global" (AppLayout + SidebarGlobal), que sigue existiendo solo para
 * /admin, /chat, /sharescreen, /system-status y /design-system (auditoría
 * UX 2026-09-28: "todo debe estar dentro de basalt no afuera").
 *
 * Estructura calcada de Basalt.tsx (`.asst-app` > `nav.asst-sidebar` +
 * `main.asst-main`), reemplazando el hilo de chat por un `<Outlet />` que
 * renderiza la página ruteada sin cambios internos.
 */
export function BasaltAppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mismo tema global que el resto de la app (antes: estado local propio,
  // desincronizado del toggle de Basalt y del de Perfil — auditoría UX
  // 2026-09-29, "el menú de cuenta se ve oscuro sobre una página clara").
  const { resolvedTheme: theme, setTheme } = useTheme();

  const title = PAGE_TITLES[location.pathname] ?? "Creator IA Pro";

  return (
    <div className="asst-app" data-asst-theme={theme} style={brandCssVars(A.brand) as React.CSSProperties}>
      <BasaltShellSidebar
        activePath={location.pathname}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
        setTheme={setTheme}
      />

      <main id="main-content" className="asst-main">
        <header className="asst-topbar">
          <button
            className="asst-icon-btn asst-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            style={{ display: sidebarOpen ? "none" : undefined }}
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="asst-brand-name">{title}</div>
        </header>

        <div className="asst-shell-scroller">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
