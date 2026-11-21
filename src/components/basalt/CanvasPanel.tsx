import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check, Copy, Download, ExternalLink, FileText, Maximize2, Minimize2, Monitor, Printer, RotateCw, Smartphone, Tablet, Wrench, X,
} from "lucide-react";
import { KIND_LABEL, WHOLE_MESSAGE, fileSlug, hasPreview, type CanvasArtifact, type CanvasTarget } from "@/lib/canvas";
import { buildArtifactDoc } from "@/lib/canvas-preview";
import { PREVIEW_SANDBOX } from "@/lib/project-preview";
import { canStackblitz, download, downloadFile, downloadZip, exportToGithub, openStackblitz } from "@/lib/project-actions";
import { printDocument, wordDocument } from "@/lib/doc-export";
import { mdToHtml } from "@/lib/markdown";
import { useCopyCodeButtons } from "@/hooks/useCopyCodeButtons";
import { useProjectCards } from "@/hooks/useProjectCards";
import type { CanvasVersion } from "@/hooks/useCanvas";

// El Canvas: lo que Basalt construye, grande y al lado del chat (en un teléfono, a pantalla
// completa). Pedido de Sebastián (2026-11-21): "implementa un visualizador tipo canvas,
// porque el que hay es solo html". Muestra páginas, componentes y proyectos React, SVG,
// diagramas y —desde «Abrir como documento»— una respuesta entera para leerla, imprimirla
// o bajarla en Word.
//
// No guarda copia del código: recibe el artefacto ya resuelto desde el hilo (useCanvas), así
// que mientras el modelo escribe se ve el código llegar y, al terminar, pasa solo a la vista
// previa. Todo lo generado corre en un iframe aislado (PREVIEW_SANDBOX), igual que en la tarjeta.

type Tab = "preview" | "code";
type Device = "desktop" | "tablet" | "mobile";
interface LogLine { t: string; m: string }

interface Props {
  artifact: CanvasArtifact;
  target: CanvasTarget;
  /** Todo lo que se puede abrir en esta conversación (para saltar entre versiones). */
  versions: CanvasVersion[];
  /** El modelo sigue escribiendo este artefacto. */
  streaming: boolean;
  theme: string;
  onSelect: (t: CanvasTarget) => void;
  onClose: () => void;
  /** Deja un texto en el compositor, SIN enviarlo (pedir que arregle un error). */
  onAsk: (text: string) => void;
}

const WIDTH_KEY = "basalt:canvas-width";
const MIN_WIDTH = 360;

const DEVICES: { id: Device; label: string; Icon: typeof Monitor }[] = [
  { id: "mobile", label: "Móvil", Icon: Smartphone },
  { id: "tablet", label: "Tablet", Icon: Tablet },
  { id: "desktop", label: "Escritorio", Icon: Monitor },
];

function readWidth(): number | undefined {
  try {
    const n = Number(localStorage.getItem(WIDTH_KEY));
    return Number.isFinite(n) && n >= MIN_WIDTH ? n : undefined;
  } catch {
    return undefined;
  }
}

/** La respuesta dibujada como documento. Componente aparte porque sus tarjetas y botones de
 *  copiar necesitan los mismos enganches que el hilo, y solo existen cuando hay documento. */
function DocView({ markdown, msgId }: { markdown: string; msgId: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useCopyCodeButtons(ref);
  useProjectCards(ref);
  const html = useMemo(() => mdToHtml(markdown), [markdown]);
  return (
    <div className="asst-canvas-docwrap" ref={ref}>
      <article className="asst-md asst-canvas-doc" data-msg-id={msgId} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export function CanvasPanel({ artifact, target, versions, streaming, theme, onSelect, onClose, onAsk }: Props) {
  const { kind, files, title } = artifact;
  const isDoc = kind === "doc";
  const canPreview = hasPreview(kind);
  const sized = kind === "web" || kind === "react";

  const [picked, setPicked] = useState<Tab | null>(null);
  const [pickedFile, setPickedFile] = useState<number | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [doc, setDoc] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [reloads, setReloads] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState<number | undefined>(readWidth);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const codeRef = useRef<HTMLPreElement | null>(null);

  // Mientras se escribe se ve el código llegar; al terminar, la vista previa. Si el usuario
  // eligió una pestaña, manda su elección.
  const tab: Tab = picked ?? (isDoc || (canPreview && !streaming) ? "preview" : "code");
  // Con varios archivos, mientras se escribe se sigue al último (el que está llegando).
  const fileIdx = Math.min(pickedFile ?? (streaming ? files.length - 1 : 0), files.length - 1);
  const file = files[fileIdx] ?? files[0];

  const darkStage = (kind === "svg" || kind === "mermaid") && theme === "dark";
  const signature = useMemo(() => files.map((f) => `${f.name}\u0000${f.code}`).join("\u0001"), [files]);

  useEffect(() => {
    if (!canPreview || streaming) return;
    let alive = true;
    void buildArtifactDoc({ kind, files }, { dark: darkStage }).then((built) => {
      if (!alive) return;
      setLogs([]);
      setDoc(built);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` es el contenido de `files`
  }, [kind, signature, streaming, canPreview, darkStage]);

  // Consola: el iframe no comparte origen, así que sus console.* y errores llegan por postMessage.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { __basalt?: number; t?: string; m?: string } | null;
      if (!d || d.__basalt !== 1 || e.source !== frameRef.current?.contentWindow) return;
      setLogs((l) => [...l.slice(-199), { t: d.t ?? "log", m: String(d.m ?? "") }]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (streaming && tab === "code" && codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [streaming, tab, file?.code]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !rootRef.current?.contains(document.activeElement)) return;
      if (expanded) setExpanded(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onClose]);

  // Arrastrar el borde izquierdo cambia el ancho. Mientras se arrastra el iframe no recibe
  // el puntero (si no, se "traga" el movimiento apenas el cursor pasa por encima).
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    let last = width;
    const onMove = (ev: PointerEvent) => {
      last = Math.round(Math.min(Math.max(window.innerWidth - ev.clientX, MIN_WIDTH), window.innerWidth * 0.72));
      setWidth(last);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try { if (last) localStorage.setItem(WIDTH_KEY, String(last)); } catch { /* sin storage */ }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file?.code ?? "");
      setCopied(true);
    } catch {
      /* sin permiso de portapapeles: no se promete lo que no pasó */
    }
  };

  const errors = useMemo(() => [...new Set(logs.filter((l) => l.t === "error").map((l) => l.m))], [logs]);
  const askFix = () => {
    setExpanded(false); // a pantalla completa el chat queda tapado y no se vería dónde quedó el texto
    onAsk(`La vista previa de «${title}» muestra este error:\n\n${errors.slice(0, 4).join("\n")}\n\nCorrígelo y entrégame de nuevo el código completo.`);
  };

  const downloadMain = () => {
    if (kind === "mermaid") {
      const svg = /<svg[\s\S]*<\/svg>/i.exec(doc ?? "")?.[0];
      if (svg) return download(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "diagrama.svg");
    }
    if (files.length === 1) return downloadFile(files[0].name, files[0].code);
    void downloadZip(files, title);
  };

  const versionKey = `${target.msgId}:${target.index}`;
  const showVersions = target.index !== WHOLE_MESSAGE && versions.length > 1;

  return (
    <aside
      ref={rootRef}
      className={`asst-canvas${expanded ? " expanded" : ""}${dragging ? " dragging" : ""}`}
      style={width && !expanded ? { width } : undefined}
      aria-label={`Canvas: ${title}`}
    >
      <div className="asst-canvas-grip" onPointerDown={startResize} role="separator" aria-orientation="vertical" aria-label="Cambiar el ancho del Canvas" />

      <header className="asst-canvas-head">
        <span className="asst-canvas-kind">{KIND_LABEL[kind]}</span>
        <h2 className="asst-canvas-title" title={title}>{title}</h2>
        {streaming && <span className="asst-canvas-live" role="status">Escribiendo…</span>}
        {showVersions && (
          <select
            className="asst-canvas-versions"
            aria-label="Cambiar a otra cosa creada en esta conversación"
            value={versionKey}
            onChange={(e) => {
              const v = versions.find((x) => `${x.msgId}:${x.index}` === e.target.value);
              if (v) onSelect({ msgId: v.msgId, index: v.index });
            }}
          >
            {versions.map((v, i) => (
              <option key={`${v.msgId}:${v.index}`} value={`${v.msgId}:${v.index}`}>
                {i + 1} de {versions.length} · {v.artifact.title}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="asst-icon-btn asst-canvas-expand" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Volver al lado del chat" : "Ocupar toda la pantalla"} title={expanded ? "Volver al lado del chat" : "Pantalla completa"}>
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button type="button" className="asst-icon-btn" onClick={onClose} aria-label="Cerrar el Canvas" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="asst-canvas-bar">
        {(canPreview || isDoc) && (
          <div className="asst-canvas-tabs" role="tablist" aria-label="Qué ver">
            <button type="button" role="tab" aria-selected={tab === "preview"} className={`asst-canvas-tab${tab === "preview" ? " active" : ""}`} onClick={() => setPicked("preview")}>
              {isDoc ? "Documento" : "Vista previa"}
            </button>
            <button type="button" role="tab" aria-selected={tab === "code"} className={`asst-canvas-tab${tab === "code" ? " active" : ""}`} onClick={() => setPicked("code")}>
              {isDoc ? "Markdown" : "Código"}
            </button>
          </div>
        )}

        {tab === "preview" && canPreview && (
          <div className="asst-canvas-tools">
            {sized && DEVICES.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={`asst-canvas-tool${device === id ? " active" : ""}`} aria-pressed={device === id} onClick={() => setDevice(id)} aria-label={`Ver como ${label}`} title={label}>
                <Icon className="w-4 h-4" aria-hidden />
              </button>
            ))}
            <button type="button" className="asst-canvas-tool" onClick={() => setReloads((n) => n + 1)} aria-label="Recargar la vista previa" title="Recargar">
              <RotateCw className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}

        <div className="asst-canvas-actions">
          <button type="button" className="asst-act" onClick={() => void copy()} title={isDoc ? "Copiar el texto" : `Copiar ${file?.name ?? "el código"}`}>
            {copied ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
            <span>{copied ? "Copiado" : "Copiar"}</span>
          </button>
          {isDoc ? (
            <>
              <button type="button" className="asst-act" onClick={() => downloadFile(`${fileSlug(title)}.doc`, wordDocument(title, files[0].code))} title="Descargar para abrir en Word">
                <FileText className="w-3.5 h-3.5" aria-hidden /><span>Word</span>
              </button>
              <button type="button" className="asst-act" onClick={() => printDocument(title, files[0].code)} title="Imprimir o guardar como PDF">
                <Printer className="w-3.5 h-3.5" aria-hidden /><span>Imprimir</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="asst-act" onClick={downloadMain} title={files.length === 1 ? `Descargar ${files[0].name}` : "Descargar todos los archivos en un ZIP"}>
                <Download className="w-3.5 h-3.5" aria-hidden /><span>{files.length === 1 ? "Descargar" : "ZIP"}</span>
              </button>
              {canStackblitz(files) && (
                <button type="button" className="asst-act" onClick={() => openStackblitz(files, title)} title="Ejecutarlo en StackBlitz, sin instalar nada">
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden /><span>StackBlitz</span>
                </button>
              )}
              {(sized || kind === "code") && (
                <button type="button" className="asst-act" onClick={() => exportToGithub(files, title)} title="Crear un repositorio en tu GitHub con estos archivos">
                  <span>GitHub</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="asst-canvas-body">
        {tab === "preview" && isDoc && <DocView markdown={files[0].code} msgId={target.msgId} />}

        {tab === "preview" && canPreview && (
          <div className="asst-canvas-stage" data-device={sized ? device : "desktop"}>
            {streaming ? (
              <p className="asst-canvas-wait">La vista previa aparece cuando Basalt termine de escribir.</p>
            ) : doc === null ? (
              <p className="asst-canvas-wait">Preparando la vista previa…</p>
            ) : (
              <iframe key={reloads} ref={frameRef} className="asst-canvas-frame" title={`Vista previa: ${title}`} sandbox={PREVIEW_SANDBOX} srcDoc={doc} />
            )}
          </div>
        )}

        {tab === "code" && (
          <div className="asst-canvas-code">
            {files.length > 1 && (
              <div className="asst-canvas-files" role="tablist" aria-label="Archivos">
                {files.map((f, i) => (
                  <button key={f.name} type="button" role="tab" aria-selected={i === fileIdx} className={`md-proj-tab${i === fileIdx ? " active" : ""}`} onClick={() => setPickedFile(i)}>
                    {f.name}
                  </button>
                ))}
              </div>
            )}
            <pre ref={codeRef} tabIndex={0} aria-label={`Código de ${file?.name ?? "el archivo"}`}><code>{file?.code ?? ""}</code></pre>
          </div>
        )}
      </div>

      {tab === "preview" && canPreview && !streaming && logs.length > 0 && (
        <details className="asst-canvas-console" open={errors.length > 0 || undefined}>
          <summary>
            Consola <span className={`md-console-count${errors.length ? " err" : ""}`}>{logs.length}</span>
            {errors.length > 0 && (
              <button type="button" className="asst-canvas-fix" onClick={(e) => { e.preventDefault(); askFix(); }} title="Deja el error escrito en el chat para que Basalt lo corrija">
                <Wrench className="w-3.5 h-3.5" aria-hidden /> Pedir que lo arregle
              </button>
            )}
          </summary>
          <div className="md-console-lines">
            {logs.map((l, i) => <div key={i} className={`md-console-line ${l.t}`}>{l.m}</div>)}
          </div>
        </details>
      )}
    </aside>
  );
}
