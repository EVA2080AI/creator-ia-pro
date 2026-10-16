// Acuerdos con firma electrónica — réplica interna del módulo de firmas del
// proyecto Faro (Cruz Roja): el admin sube el PDF del acuerdo, define los
// firmantes y reparte un enlace único por persona; el documento firmado queda
// guardado aquí. API en api/acuerdos.ts y api/firmar/[token].ts.
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ClipboardCopy, Download, FilePlus2, FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Firmante {
  id: string;
  nombre: string;
  rol: string;
  documento: string | null;
  email: string | null;
  token: string;
  firmaUrl: string | null;
  firmadoAt: string | null;
}

interface Acuerdo {
  id: string;
  titulo: string;
  pdfUrl: string;
  pdfFirmadoUrl: string | null;
  hashSha256: string;
  estado: "pendiente" | "parcial" | "firmado";
  createdAt: string;
  firmantes: Firmante[];
}

const ESTADO_LABEL: Record<Acuerdo["estado"], string> = { pendiente: "Pendiente", parcial: "Firmas parciales", firmado: "Firmado" };
const ESTADO_STYLE: Record<Acuerdo["estado"], string> = {
  pendiente: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  parcial: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
  firmado: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
};

interface FirmanteForm { nombre: string; rol: string; documento: string; email: string }
const FIRMANTE_VACIO: FirmanteForm = { nombre: "", rol: "", documento: "", email: "" };
const MAX_PDF_MB = 3;

export function AcuerdosTab() {
  const [acuerdos, setAcuerdos] = useState<Acuerdo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [pdf, setPdf] = useState<{ nombre: string; dataUrl: string } | null>(null);
  const [firmantes, setFirmantes] = useState<FirmanteForm[]>([{ ...FIRMANTE_VACIO }, { ...FIRMANTE_VACIO }]);
  const [creando, setCreando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null); // id en confirmación de borrado

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/acuerdos", { credentials: "include" });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) setAcuerdos(body.acuerdos);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const onPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return void toast.error("El acuerdo debe ser un PDF.");
    if (file.size > MAX_PDF_MB * 1024 * 1024) return void toast.error(`El PDF supera los ${MAX_PDF_MB} MB.`);
    const reader = new FileReader();
    reader.onload = () => setPdf({ nombre: file.name, dataUrl: String(reader.result) });
    reader.onerror = () => toast.error("No se pudo leer el archivo.");
    reader.readAsDataURL(file);
  };

  const setCampo = (i: number, campo: keyof FirmanteForm, valor: string) =>
    setFirmantes((prev) => prev.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));

  const puedeCrear = useMemo(
    () => !!titulo.trim() && !!pdf && firmantes.some((f) => f.nombre.trim() && f.rol.trim()),
    [titulo, pdf, firmantes],
  );

  const crear = async () => {
    if (!puedeCrear || creando || !pdf) return;
    // Una fila a medio llenar no se descarta en silencio: o está vacía del todo o está completa.
    const aMedias = firmantes.filter(
      (f) => (f.nombre.trim() || f.rol.trim() || f.documento.trim() || f.email.trim()) && !(f.nombre.trim() && f.rol.trim()),
    );
    if (aMedias.length) {
      toast.error("Hay firmantes a medio llenar: cada uno necesita al menos nombre y rol (o deja la fila vacía).");
      return;
    }
    const listos = firmantes.filter((f) => f.nombre.trim() && f.rol.trim());
    setCreando(true);
    try {
      const res = await fetch("/api/acuerdos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          pdfDataUrl: pdf.dataUrl,
          firmantes: listos.map((f) => ({ nombre: f.nombre.trim(), rol: f.rol.trim(), documento: f.documento.trim() || null, email: f.email.trim() || null })),
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        toast.success("Acuerdo creado. Copia y envía el enlace de cada firmante.");
        setMostrarForm(false);
        setTitulo("");
        setPdf(null);
        setFirmantes([{ ...FIRMANTE_VACIO }, { ...FIRMANTE_VACIO }]);
        await load();
      } else {
        toast.error(body?.error ?? "No se pudo crear el acuerdo.");
      }
    } catch {
      toast.error("No se pudo crear el acuerdo. Revisa tu conexión.");
    } finally {
      setCreando(false);
    }
  };

  const copiarEnlace = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/firmar/${token}`);
      toast.success("Enlace de firma copiado.");
    } catch {
      toast.error("No se pudo copiar. Revisa los permisos del portapapeles.");
    }
  };

  const eliminar = async (id: string) => {
    try {
      const res = await fetch(`/api/acuerdos?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        toast.success("Acuerdo eliminado.");
        setAcuerdos((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error(body?.error ?? "No se pudo eliminar.");
      }
    } finally {
      setBorrando(null);
    }
  };

  const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary";

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          Sube un acuerdo en PDF, define quiénes firman y envíale a cada uno su enlace único. El PDF final queda con la constancia de firmas.
        </p>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground"
        >
          {mostrarForm ? <X className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
          {mostrarForm ? "Cancelar" : "Nuevo acuerdo"}
        </button>
      </div>

      {mostrarForm && (
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-bold text-muted-foreground">Título</label>
              <input className={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Acuerdo de Participación Económica — …" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-bold text-muted-foreground">PDF del acuerdo (máx. {MAX_PDF_MB} MB)</label>
              <input type="file" accept="application/pdf" onChange={onPdf}
                className="w-full text-[13px] text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground" />
              {pdf && <p className="mt-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">{pdf.nombre}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] font-bold text-muted-foreground">Firmantes (nombre y rol tal como deben quedar en la constancia)</p>
            {firmantes.map((f, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
                <input className={input} placeholder="Nombre completo" value={f.nombre} onChange={(e) => setCampo(i, "nombre", e.target.value)} />
                <input className={input} placeholder="Rol (Inversionista…)" value={f.rol} onChange={(e) => setCampo(i, "rol", e.target.value)} />
                <input className={input} placeholder="C.C. No. …" value={f.documento} onChange={(e) => setCampo(i, "documento", e.target.value)} />
                <input className={input} placeholder="Correo (opcional)" value={f.email} onChange={(e) => setCampo(i, "email", e.target.value)} />
                <button
                  type="button"
                  onClick={() => setFirmantes((prev) => prev.filter((_, j) => j !== i))}
                  disabled={firmantes.length <= 1}
                  className="rounded-xl border border-border px-3 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                  aria-label="Quitar firmante"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {firmantes.length < 6 && (
              <button
                type="button"
                onClick={() => setFirmantes((prev) => [...prev, { ...FIRMANTE_VACIO }])}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary"
              >
                <Plus className="h-4 w-4" /> Agregar firmante
              </button>
            )}
          </div>

          <button
            onClick={crear}
            disabled={!puedeCrear || creando}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
            Crear acuerdo y generar enlaces
          </button>
        </div>
      )}

      {!acuerdos.length ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card py-20 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-[13px] font-bold text-muted-foreground">Sin acuerdos todavía. Crea el primero con “Nuevo acuerdo”.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {acuerdos.map((a) => (
            <div key={a.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-snug">{a.titulo}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">Creado el {fecha(a.createdAt)} · huella {a.hashSha256.slice(0, 12)}…</p>
                </div>
                <span className={cn("rounded-full border px-3 py-1 text-[12px] font-bold", ESTADO_STYLE[a.estado])}>{ESTADO_LABEL[a.estado]}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {a.firmantes.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                    {f.firmadoAt
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="font-bold">{f.nombre}</span>
                    <span className="text-muted-foreground">· {f.rol}{f.documento ? ` · ${f.documento}` : ""}</span>
                    {f.firmadoAt ? (
                      <span className="text-[12px] text-emerald-600 dark:text-emerald-400">Firmó el {fecha(f.firmadoAt)}</span>
                    ) : (
                      <button
                        onClick={() => void copiarEnlace(f.token)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[12px] font-bold text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" /> Copiar enlace de firma
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={a.pdfUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground">
                  <FileText className="h-3.5 w-3.5" /> PDF original
                </a>
                {a.pdfFirmadoUrl && (
                  <a href={a.pdfFirmadoUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground">
                    <Download className="h-3.5 w-3.5" /> PDF firmado
                  </a>
                )}
                <span className="flex-1" />
                {borrando === a.id ? (
                  <span className="inline-flex items-center gap-2 text-[12px]">
                    <span className="font-bold text-red-500">¿Eliminar este acuerdo y sus firmas?</span>
                    <button onClick={() => void eliminar(a.id)} className="rounded-full bg-red-500 px-3 py-1 font-bold text-white">Sí, eliminar</button>
                    <button onClick={() => setBorrando(null)} className="rounded-full border border-border px-3 py-1 font-bold text-muted-foreground">No</button>
                  </span>
                ) : (
                  <button onClick={() => setBorrando(a.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:border-red-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
