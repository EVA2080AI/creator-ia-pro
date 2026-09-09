import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
  console.log('%c Built with ❤️ by EVA2080AI ', 'color: #A855F7; font-size: 14px;');
}

createRoot(document.getElementById("root")!).render(<App />);
