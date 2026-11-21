// De un artefacto del Canvas al documento HTML que corre en el iframe aislado. Un solo
// camino para la tarjeta del chat (useProjectCards) y para el panel (CanvasPanel): lo que
// se ve en uno es lo que se ve en el otro.
//
// Lo pesado se carga solo cuando hace falta: el transpilador de React (sucrase) y mermaid
// son trozos aparte del bundle, y quien solo conversa nunca los descarga.
import type { CanvasArtifact } from "./canvas";
import { PREVIEW_SHIM, buildPreviewDoc } from "./project-preview";
import { bundleReact } from "./react-bundle";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

// Fondo ajedrezado: un SVG con fondo transparente o trazos blancos se perdía sobre blanco liso.
const STAGE_CSS =
  `html,body{height:100%;margin:0}` +
  `body{display:grid;place-items:center;padding:24px;box-sizing:border-box;` +
  `background:#fff conic-gradient(#f1f1f3 25%,#fff 0 50%,#f1f1f3 0 75%,#fff 0) 0 0/20px 20px}` +
  `body.dark{background:#16181a conic-gradient(#1f2224 25%,#16181a 0 50%,#1f2224 0 75%,#16181a 0) 0 0/20px 20px}` +
  `svg{max-width:100%;max-height:calc(100vh - 48px)}svg[viewBox]{width:min(100%,760px);height:auto}` +
  `pre{align-self:start;justify-self:stretch;margin:0;padding:16px;border-radius:12px;background:#fff;color:#b3261e;` +
  `font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}`;

const stageDoc = (body: string, dark = false) =>
  `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
  `${PREVIEW_SHIM}<style>${STAGE_CSS}</style></head><body${dark ? ' class="dark"' : ""}>${body}</body></html>`;

/** Un SVG suelto, centrado. El prólogo `<?xml ?>` no es HTML: se quita. */
export function svgDoc(code: string, dark = false): string {
  return stageDoc(code.replace(/^\s*<\?xml[^>]*\?>\s*/i, "").replace(/^\s*<!DOCTYPE[^>]*>\s*/i, ""), dark);
}

export function messageDoc(title: string, detail: string): string {
  const text = `${title}\n\n${detail}`;
  return stageDoc(`<pre>${escapeHtml(text)}</pre><script>console.error(${jsonForScript(text)})</script>`);
}

let mermaidSeq = 0;

/** El diagrama se dibuja ACÁ (mermaid ya es dependencia de la app) y al iframe solo viaja el
 *  SVG: así no depende de un CDN y un diagrama mal escrito da un error legible. */
async function mermaidDoc(code: string, dark: boolean): Promise<string> {
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "default", fontFamily: "Inter, system-ui, sans-serif" });
  const id = `basalt-mmd-${++mermaidSeq}`;
  try {
    await mermaid.parse(code);
    const { svg } = await mermaid.render(id, code);
    return stageDoc(svg, dark);
  } catch (e) {
    return messageDoc("El diagrama tiene un error de sintaxis", e instanceof Error ? e.message : String(e));
  } finally {
    // mermaid deja su lienzo de trabajo colgado del <body> cuando falla.
    document.getElementById(id)?.remove();
    document.getElementById("d" + id)?.remove();
  }
}

/**
 * Documento listo para `iframe.srcdoc`, o null si el artefacto no tiene nada que mostrar
 * (un proyecto que el navegador no puede ejecutar, un documento). Nunca rechaza: un fallo
 * al preparar la vista previa vuelve como un documento que lo explica.
 */
export async function buildArtifactDoc(artifact: Pick<CanvasArtifact, "kind" | "files">, opts: { dark?: boolean } = {}): Promise<string | null> {
  const first = artifact.files[0];
  try {
    switch (artifact.kind) {
      case "web":
        return buildPreviewDoc(artifact.files);
      case "svg":
        return first ? svgDoc(first.code, opts.dark) : null;
      case "mermaid":
        return first ? await mermaidDoc(first.code, !!opts.dark) : null;
      case "react": {
        const { transform } = await import("sucrase");
        return bundleReact(artifact.files, transform).html;
      }
      default:
        return null;
    }
  } catch (e) {
    return messageDoc("No se pudo preparar la vista previa", e instanceof Error ? e.message : String(e));
  }
}
