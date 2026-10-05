import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Si falla la carga de un módulo partido (chunk), casi siempre es porque la pestaña
// quedó abierta sobre un despliegue anterior (los nombres con hash cambiaron) o porque
// la red parpadeó. Antes eso reventaba React y salía la pantalla de "Algo salió mal"
// (incidente real, 2026-10-05). Recargar trae el HTML nuevo con los chunks nuevos.
// El guard de sessionStorage evita el bucle: si recién recargamos y vuelve a fallar,
// se deja pasar el error para que el ErrorBoundary lo muestre.
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem("chunk_reload_at") || 0);
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem("chunk_reload_at", String(Date.now()));
  } catch { /* sin sessionStorage igual recargamos: peor es la pantalla de error */ }
  event.preventDefault();
  window.location.reload();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Prevent accidental navigation with unsaved changes
let hasUnsavedChanges = false;

export function setUnsavedChanges(value: boolean) {
  hasUnsavedChanges = value;
}

window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Console easter egg
if (import.meta.env.DEV) {
  console.log(
    '%c Creator IA Pro ',
    'background: linear-gradient(135deg, #A855F7, #7C3AED); color: white; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 8px;'
  );
  console.log('%c Built with ❤️ ', 'color: #A855F7; font-size: 14px;');
}

createRoot(document.getElementById("root")!).render(<App />);
