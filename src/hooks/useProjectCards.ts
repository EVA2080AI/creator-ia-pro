import type { RefObject } from "react";
import { useAttachWhenReady } from "./useAttachWhenReady";
import { buildPreviewDoc, stackblitzFields, type ProjectFile } from "@/lib/project-preview";

// Comportamiento de las tarjetas de proyecto que produce mdToHtml()
// (src/lib/markdown.ts → projectCardHtml). Las tarjetas llegan como HTML crudo
// por dangerouslySetInnerHTML, así que TODO lo interactivo vive acá con
// delegación de eventos sobre el contenedor de mensajes:
//  - hidratar el iframe: DOMPurify le saca srcdoc a cualquier iframe (no es
//    configurable), así que el código real vive como texto en los <pre><code>
//    de cada pestaña y el documento de vista previa se arma acá y se asigna
//    por JS, evitando el sanitizador;
//  - pestañas, dispositivo (móvil/tablet/escritorio), recargar, pantalla
//    completa, consola (postMessage desde el iframe), ZIP y StackBlitz.

const MAX_CONSOLE_LINES = 200;

function readFiles(card: HTMLElement): ProjectFile[] {
  return Array.from(card.querySelectorAll<HTMLElement>(".md-proj-pane[data-file]")).map((pane) => ({
    name: pane.dataset.file ?? "archivo.txt",
    lang: pane.dataset.lang ?? "",
    code: pane.querySelector("pre code")?.textContent ?? "",
  }));
}

function projectTitle(files: ProjectFile[]): string {
  const html = files.find((f) => /\.html?$/i.test(f.name));
  const fromTitle = html && /<title[^>]*>([^<]{1,60})<\/title>/i.exec(html.code)?.[1]?.trim();
  return fromTitle || "Proyecto Basalt";
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "proyecto-basalt";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function flash(btn: HTMLElement, text: string) {
  const original = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = original; }, 1800);
}

function activateTab(card: HTMLElement, key: string) {
  card.querySelectorAll<HTMLElement>(".md-proj-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === key));
  card.querySelectorAll<HTMLElement>(".md-proj-pane").forEach((p) => p.classList.toggle("active", (p.dataset.pane ?? "") === key));
}

function attachProjectCards(el: HTMLElement): () => void {
  const built = new WeakMap<HTMLIFrameElement, string>();
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

  const hydrate = () => {
    el.querySelectorAll<HTMLElement>(".md-project").forEach((card) => {
      const iframe = card.querySelector<HTMLIFrameElement>("iframe.md-preview-frame");
      if (!iframe) return;
      const doc = buildPreviewDoc(readFiles(card));
      if (doc && built.get(iframe) !== doc) load(card, iframe, doc);
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
      card.querySelectorAll<HTMLElement>("[data-device]").forEach((b) => b.classList.toggle("active", b === device));
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
      case "zip": {
        const files = readFiles(card);
        void (async () => {
          try {
            const { default: JSZip } = await import("jszip");
            const zip = new JSZip();
            files.forEach((f) => zip.file(f.name, f.code));
            download(await zip.generateAsync({ type: "blob" }), `${slug(projectTitle(files))}.zip`);
            flash(actEl, "Descargado ✓");
          } catch {
            flash(actEl, "Error");
          }
        })();
        break;
      }
      case "stackblitz": {
        const files = readFiles(card);
        const fields = stackblitzFields(files, projectTitle(files));
        if (!fields) return flash(actEl, "No disponible");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://stackblitz.com/run";
        form.target = "_blank";
        form.style.display = "none";
        for (const [name, value] of Object.entries(fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        form.remove();
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
    if (timer) clearTimeout(timer);
    timer = setTimeout(hydrate, 400);
  });

  hydrate();
  observer.observe(el, { childList: true, subtree: true });
  el.addEventListener("click", onClick);
  window.addEventListener("message", onMessage);
  document.addEventListener("keydown", onKey);

  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
    el.removeEventListener("click", onClick);
    window.removeEventListener("message", onMessage);
    document.removeEventListener("keydown", onKey);
  };
}

export function useProjectCards(ref: RefObject<HTMLElement | null>) {
  useAttachWhenReady(ref, attachProjectCards);
}
