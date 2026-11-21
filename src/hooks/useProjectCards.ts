import type { RefObject } from "react";
import { useAttachWhenReady } from "./useAttachWhenReady";
import type { ProjectFile } from "@/lib/project-preview";
import { findViteProblems } from "@/lib/vite-check";
import { buildArtifactDoc } from "@/lib/canvas-preview";
import { CANVAS_CHANGED_EVENT, CANVAS_OPEN_EVENT, getCanvasTarget, type CanvasKind, type CanvasTarget } from "@/lib/canvas";
import { downloadFile, downloadZip, exportToGithub, openStackblitz, projectTitle } from "@/lib/project-actions";

// Comportamiento de las tarjetas de proyecto que produce mdToHtml()
// (src/lib/markdown.ts → projectCardHtml). Las tarjetas llegan como HTML crudo
// por dangerouslySetInnerHTML, así que TODO lo interactivo vive acá con
// delegación de eventos sobre el contenedor de mensajes:
//  - hidratar el iframe: DOMPurify le saca srcdoc a cualquier iframe (no es
//    configurable), así que el código real vive como texto en los <pre><code>
//    de cada pestaña y el documento de vista previa se arma acá y se asigna
//    por JS, evitando el sanitizador. Qué documento se arma depende del tipo de
//    la tarjeta (`data-kind`): HTML, React, SVG o diagrama — ver canvas-preview.ts;
//  - pestañas, dispositivo (móvil/tablet/escritorio), recargar, pantalla
//    completa, consola (postMessage desde el iframe), ZIP, StackBlitz y Canvas.

const MAX_CONSOLE_LINES = 200;

function readFiles(card: HTMLElement): ProjectFile[] {
  return Array.from(card.querySelectorAll<HTMLElement>(".md-proj-pane[data-file]")).map((pane) => ({
    name: pane.dataset.file ?? "archivo.txt",
    lang: pane.dataset.lang ?? "",
    code: pane.querySelector("pre code")?.textContent ?? "",
  }));
}

/** Qué artefacto es esta tarjeta: el número que le puso mdToHtml dentro de su mensaje. */
function cardTarget(card: HTMLElement): CanvasTarget | null {
  const msgId = card.closest<HTMLElement>("[data-msg-id]")?.dataset.msgId;
  const index = Number(card.dataset.canvas);
  return msgId && card.dataset.canvas !== undefined && Number.isInteger(index) ? { msgId, index } : null;
}

const isGenerating = () => !!document.querySelector(".asst-send.stop");

function flash(btn: HTMLElement, text: string) {
  const original = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = original; }, 1800);
}

function activateTab(card: HTMLElement, key: string) {
  card.querySelectorAll<HTMLElement>(".md-proj-tab").forEach((t) => {
    const on = t.dataset.tab === key;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  card.querySelectorAll<HTMLElement>(".md-proj-pane").forEach((p) => p.classList.toggle("active", (p.dataset.pane ?? "") === key));
}

function attachProjectCards(el: HTMLElement): () => void {
  const built = new WeakMap<HTMLIFrameElement, string>();
  // Firma (tipo + archivos) de lo último que se pidió armar para cada iframe: armar un
  // documento es asíncrono (React y los diagramas cargan su motor aparte), y sin esto dos
  // pasadas seguidas lo armaban dos veces o una respuesta vieja pisaba a la nueva.
  const wanted = new WeakMap<HTMLIFrameElement, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearConsole = (card: HTMLElement) => {
    const lines = card.querySelector(".md-console-lines");
    if (lines) lines.textContent = "";
    const count = card.querySelector<HTMLElement>(".md-console-count");
    if (count) { count.textContent = ""; count.classList.remove("err"); }
  };

  const load = (card: HTMLElement, iframe: HTMLIFrameElement, doc: string) => {
    built.set(iframe, doc);
    clearConsole(card);
    iframe.srcdoc = doc;
  };

  // Proyectos Vite/React: qué le falta para correr con "npm install && npm run dev". No se muestra
  // mientras el modelo sigue escribiendo (faltaría "tailwind.config.js" solo porque aún no llegó).
  const showProblems = (card: HTMLElement) => {
    const box = card.querySelector<HTMLElement>(".md-proj-problems");
    if (!box) return;
    const problems = isGenerating() ? [] : findViteProblems(readFiles(card));
    box.hidden = problems.length === 0;
    box.textContent = problems.length ? `Revisa antes de ejecutarlo: ${problems.join("; ")}. Pídele a Basalt que agregue lo que falta.` : "";
  };

  /** ¿Esta tarjeta es justo lo que el Canvas tiene abierto? */
  const isOpenInCanvas = (card: HTMLElement) => {
    const open = getCanvasTarget();
    const here = cardTarget(card);
    return !!open && !!here && open.msgId === here.msgId && open.index === here.index;
  };

  // Barato y sin esperar: mientras el modelo escribe, React repone el HTML del mensaje en
  // cada trozo y la tarjeta nace de nuevo sin sus marcas. Si esto esperara al debounce de
  // hydrate, durante toda la respuesta se vería un recuadro blanco de 380px.
  //  - md-in-canvas: abierta en el Canvas → la tarjeta no pinta OTRA copia (serían dos apps corriendo);
  //  - md-pending: un componente o un diagrama a medio escribir no compila → se avisa en vez del blanco.
  const mark = () => {
    const generating = isGenerating();
    el.querySelectorAll<HTMLElement>(".md-project").forEach((card) => {
      const inCanvas = isOpenInCanvas(card);
      card.classList.toggle("md-in-canvas", inCanvas);
      card.classList.toggle("md-pending", !inCanvas && generating && (card.dataset.kind ?? "web") !== "web");
    });
  };

  const hydrate = () => {
    mark();
    el.querySelectorAll<HTMLElement>(".md-project").forEach((card) => {
      showProblems(card);
      const iframe = card.querySelector<HTMLIFrameElement>("iframe.md-preview-frame");
      if (!iframe) return;

      if (card.classList.contains("md-in-canvas")) {
        if (wanted.has(iframe)) { wanted.delete(iframe); built.delete(iframe); iframe.removeAttribute("srcdoc"); }
        return;
      }
      if (card.classList.contains("md-pending")) return;

      const kind = (card.dataset.kind ?? "web") as CanvasKind;
      const files = readFiles(card);
      const dark = card.closest("[data-asst-theme]")?.getAttribute("data-asst-theme") === "dark";
      const key = [kind, dark ? "d" : "l", ...files.map((f) => `${f.name}\u0000${f.code}`)].join("\u0001");
      if (wanted.get(iframe) === key) return;
      wanted.set(iframe, key);
      void buildArtifactDoc({ kind, files }, { dark }).then((doc) => {
        if (wanted.get(iframe) !== key || !iframe.isConnected) return;
        if (doc && built.get(iframe) !== doc) load(card, iframe, doc);
      });
    });
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>(".md-project");
    if (!card) return;

    const tab = target.closest<HTMLElement>(".md-proj-tab");
    if (tab?.dataset.tab) return activateTab(card, tab.dataset.tab);

    const device = target.closest<HTMLElement>("[data-device]");
    if (device) {
      const stage = card.querySelector<HTMLElement>(".md-proj-stage");
      if (stage) stage.dataset.device = device.dataset.device;
      card.querySelectorAll<HTMLElement>("[data-device]").forEach((b) => {
        b.classList.toggle("active", b === device);
        b.setAttribute("aria-pressed", String(b === device));
      });
      return;
    }

    const actEl = target.closest<HTMLElement>("[data-act]");
    if (!actEl) return;
    const iframe = card.querySelector<HTMLIFrameElement>("iframe.md-preview-frame");

    switch (actEl.dataset.act) {
      case "reload": {
        const doc = iframe && built.get(iframe);
        if (iframe && doc) { iframe.srcdoc = ""; requestAnimationFrame(() => load(card, iframe, doc)); }
        break;
      }
      case "fullscreen": {
        const on = card.classList.toggle("md-proj-full");
        actEl.textContent = on ? "Cerrar" : "Pantalla completa";
        break;
      }
      case "canvas": {
        const target = cardTarget(card);
        if (target) window.dispatchEvent(new CustomEvent(CANVAS_OPEN_EVENT, { detail: target }));
        break;
      }
      case "file": {
        // Descarga UN archivo con su nombre (el boton del encabezado en documentos
        // de oficina, o el "Descargar" de la barra de cada pestana de archivo).
        const pane =
          actEl.closest<HTMLElement>(".md-proj-pane[data-file]") ??
          card.querySelector<HTMLElement>(".md-proj-pane.active[data-file]") ??
          card.querySelector<HTMLElement>(".md-proj-pane[data-file]");
        const name = pane?.dataset.file;
        if (!pane || !name) break;
        downloadFile(name, pane.querySelector("pre code")?.textContent ?? "");
        flash(actEl, "Descargado ✓");
        break;
      }
      case "zip": {
        const files = readFiles(card);
        downloadZip(files).then(() => flash(actEl, "Descargado ✓"), () => flash(actEl, "Error"));
        break;
      }
      case "github": {
        // El diálogo (GitHubExportDialog, montado en la página) hace el resto. Acá solo
        // se juntan los archivos del DOM, igual que hace el ZIP.
        exportToGithub(readFiles(card));
        break;
      }
      case "stackblitz": {
        const files = readFiles(card);
        if (!openStackblitz(files, projectTitle(files))) flash(actEl, "No disponible");
        break;
      }
    }
  };

  const onMessage = (e: MessageEvent) => {
    const data = e.data as { __basalt?: number; t?: string; m?: string } | null;
    if (!data || data.__basalt !== 1) return;
    for (const iframe of el.querySelectorAll<HTMLIFrameElement>("iframe.md-preview-frame")) {
      if (iframe.contentWindow !== e.source) continue;
      const card = iframe.closest<HTMLElement>(".md-project");
      const lines = card?.querySelector(".md-console-lines");
      if (!card || !lines) return;
      const line = document.createElement("div");
      line.className = `md-console-line ${data.t ?? "log"}`;
      line.textContent = String(data.m ?? "");
      lines.appendChild(line);
      while (lines.childElementCount > MAX_CONSOLE_LINES) lines.firstElementChild?.remove();
      const count = card.querySelector<HTMLElement>(".md-console-count");
      if (count) {
        count.textContent = String(lines.childElementCount);
        if (data.t === "error") count.classList.add("err");
      }
      return;
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    el.querySelectorAll<HTMLElement>(".md-project.md-proj-full").forEach((card) => {
      card.classList.remove("md-proj-full");
      const btn = card.querySelector<HTMLElement>('[data-act="fullscreen"]');
      if (btn) btn.textContent = "Pantalla completa";
    });
  };

  // Debounce de 400ms: durante el streaming el bloque se re-renderiza varias
  // veces por segundo con el código todavía incompleto — solo interesa armar
  // la vista previa cuando el texto se asienta.
  const observer = new MutationObserver(() => {
    mark();
    if (timer) clearTimeout(timer);
    timer = setTimeout(hydrate, 400);
  });

  hydrate();
  observer.observe(el, { childList: true, subtree: true });
  el.addEventListener("click", onClick);
  window.addEventListener("message", onMessage);
  window.addEventListener(CANVAS_CHANGED_EVENT, hydrate);
  document.addEventListener("keydown", onKey);

  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
    el.removeEventListener("click", onClick);
    window.removeEventListener("message", onMessage);
    window.removeEventListener(CANVAS_CHANGED_EVENT, hydrate);
    document.removeEventListener("keydown", onKey);
  };
}

export function useProjectCards(ref: RefObject<HTMLElement | null>) {
  useAttachWhenReady(ref, attachProjectCards);
}
