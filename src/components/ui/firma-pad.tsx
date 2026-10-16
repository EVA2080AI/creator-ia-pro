// Captura de firma manuscrita — réplica del FirmaPad del proyecto Faro (Cruz
// Roja Santander), adaptada a esta app: en vez de inputs de formulario (server
// actions de Next), entrega el trazo por callback como data URL PNG.
//
// Dos modos: dibujar en canvas (mouse o táctil) o cargar una imagen de la firma.
// En "cargar", la imagen se redibuja en un canvas oculto para entregarla SIEMPRE
// como PNG, que es lo único que acepta el servidor (api/firmar/[token].ts).
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FirmaPadProps {
  /** Recibe la firma como data URL PNG, o null cuando se limpia. */
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function FirmaPad({ onChange, disabled = false }: FirmaPadProps) {
  const [modo, setModo] = useState<"dibujar" | "cargar">("dibujar");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  // Ref y no solo estado: end() necesita saber si de verdad hubo trazo en este
  // mismo tick (un toque sin movimiento exportaría un PNG en blanco como "firma").
  const huboTinta = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [tieneFirma, setTieneFirma] = useState(false);
  const [archivoNombre, setArchivoNombre] = useState("");

  // Dimensiona el canvas al tamaño real × DPR (nítido en retina). Si está oculto
  // mide 0×0: se deja quieto y se dimensiona al primer trazo (lección del #361 en
  // Faro: un canvas 0×0 exporta «data:,» y la firma viaja vacía).
  const asegurarTamano = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * ratio), h = Math.round(rect.height * ratio);
    if (w === 0 || h === 0) return false;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
    }
    return true;
  }, []);
  useEffect(() => {
    if (modo !== "dibujar") return;
    asegurarTamano();
  }, [modo, asegurarTamano]);

  const posFromEvent = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const start = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      e.preventDefault();
      if (!asegurarTamano()) return;
      drawing.current = true;
      last.current = posFromEvent(e);
      try {
        canvasRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // sin captura de puntero el trazo se dibuja igual
      }
    },
    [posFromEvent, asegurarTamano, disabled],
  );

  const move = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !last.current) return;
      const p = posFromEvent(e);
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      huboTinta.current = true;
      if (!tieneFirma) setTieneFirma(true);
    },
    [posFromEvent, tieneFirma],
  );

  const end = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      drawing.current = false;
      last.current = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Guardar PRIMERO: releasePointerCapture puede lanzar y no debe perderse el trazo.
      // Sin tinta real (toque sin movimiento) o sin píxeles («data:,») no hay firma.
      onChange(huboTinta.current && canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL("image/png") : null);
      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch {
        // la firma ya quedó entregada arriba
      }
    },
    [onChange],
  );

  const limpiar = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    huboTinta.current = false;
    setTieneFirma(false);
    setArchivoNombre("");
    onChange(null);
  }, [onChange]);

  const cambiarModo = (m: "dibujar" | "cargar") => {
    setModo(m);
    limpiar();
  };

  // Modo cargar: la imagen (png/jpg/webp…) se normaliza a PNG vía canvas.
  const onArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setArchivoNombre("");
      onChange(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // 600×240 máx: suficiente resolución para estamparla en el PDF.
      const escala = Math.min(600 / img.width, 240 / img.height, 1);
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(img.width * escala));
      off.height = Math.max(1, Math.round(img.height * escala));
      off.getContext("2d")?.drawImage(img, 0, 0, off.width, off.height);
      onChange(off.toDataURL("image/png"));
      setArchivoNombre(file.name);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setArchivoNombre("");
      onChange(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => cambiarModo("dibujar")}
          className={cn("flex-1 rounded-md px-3 py-1.5", modo === "dibujar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background")}
        >
          Dibujar firma
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("cargar")}
          className={cn("flex-1 rounded-md px-3 py-1.5", modo === "cargar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background")}
        >
          Cargar imagen
        </button>
      </div>

      {modo === "dibujar" ? (
        <>
          <div className="relative">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="h-40 w-full touch-none cursor-crosshair rounded-lg border border-border bg-white"
              style={{ touchAction: "none" }}
            />
            {!tieneFirma && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Firma aquí (mouse o pantalla táctil)
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-xs", tieneFirma ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
              {tieneFirma ? "Firma capturada" : "Firma obligatoria"}
            </span>
            <button
              type="button"
              onClick={limpiar}
              className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-red-400 hover:text-red-500"
            >
              Limpiar
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-background p-4 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={onArchivo}
            disabled={disabled}
            className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
          />
          <p className={cn("mt-2 text-xs", archivoNombre ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {archivoNombre ? `Archivo: ${archivoNombre}` : "Sube una foto o escaneo de tu firma"}
          </p>
        </div>
      )}
    </div>
  );
}
