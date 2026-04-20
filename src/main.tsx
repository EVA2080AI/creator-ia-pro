console.log("--- BUNDLE START ---");
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Emergency debug: write directly to body to confirm script execution
const debugDiv = document.createElement('div');
debugDiv.style.position = 'fixed';
debugDiv.style.top = '20px';
debugDiv.style.left = '20px';
debugDiv.style.background = 'red';
debugDiv.style.color = 'white';
debugDiv.style.padding = '10px';
debugDiv.style.zIndex = '10000';
debugDiv.innerHTML = 'JS BUNDLE EXECUTING';
document.body.appendChild(debugDiv);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
  console.log("--- RENDER CALLED ---");
} else {
  console.error("CRITICAL: Root container not found");
  document.body.innerHTML += '<h1 style="color:red">ERROR: ROOT NOT FOUND</h1>';
}
