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

// Web Vitals reporting
if ('web-vitals' in window) {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
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
    'background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 8px;'
  );
  console.log('%c Built with ❤️ by EVA2080AI ', 'color: #8B5CF6; font-size: 14px;');
}

createRoot(document.getElementById("root")!).render(<App />);
