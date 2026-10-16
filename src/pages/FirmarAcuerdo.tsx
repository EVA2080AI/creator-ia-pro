// Página pública de firma — /firmar/:token. El token del enlace identifica al
// firmante (sin cuenta ni login). Muestra el PDF, la identidad con la que va a
// quedar la firma y el pad para firmar; al enviar, api/firmar/[token] guarda la
// evidencia y, con la última firma, genera el PDF sellado.
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, Download, ExternalLink, Loader2, PenLine, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { FirmaPad } from "@/components/ui/firma-pad";
import { Logo } from "@/components/Logo";
import { SEO } from "@/components/SEO";

interface DatosFirma {
  acuerdo: { titulo: string; pdfUrl: string; estado: "pendiente" | "parcial" | "firmado"; pdfFirmadoUrl: string | null; hashSha256: string };
  firmante: { nombre: string; rol: string; documento: string | null; yaFirmo: boolean };
  firmantes: Array<{ nombre: string; rol: string; firmo: boolean }>;
}

const FirmarAcuerdo = () => {
  const { token } = useParams<{ token: string }>();
  const [datos, setDatos] = useState<DatosFirma | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [firma, setFirma] = useState<string | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // true solo cuando falló la RED (reintentable); un 4xx del API es enlace inválido.
  const [esRed, setEsRed] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const res = await fetch(`/api/firmar/${token}`);
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        setDatos(body);
        setError(null);
        setEsRed(false);
      } else {
        setError(body?.error ?? "Este enlace de firma no existe o fue retirado.");
        setEsRed(false);
      }
    } catch {
      setError("No se pudo cargar el acuerdo. Revisa tu conexión e intenta de nuevo.");
      setEsRed(true);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { void cargar(); }, [cargar]);

  const firmar = async () => {
    if (!firma || !acepta || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/firmar/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaDataUrl: firma, acepta }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        toast.success("Firma registrada. Gracias.");
        await cargar(true);
      } else {
        toast.error(body?.error ?? "No se pudo registrar la firma. Intenta de nuevo.");
        if (res.status === 409) await cargar(true);
      }
    } catch {
      toast.error("No se pudo registrar la firma. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Firma electrónica" description="Firma de acuerdos de Creator IA Pro." noindex={true} />
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-4">
          <Logo size="md" showText showPro />
        </div>
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary">
          <PenLine className="h-4 w-4" /> Firma electrónica · Creator IA Pro
        </p>

        {cargando ? (
          <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error || !datos ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-[15px] font-bold">{esRed ? "No se pudo cargar" : "Enlace no disponible"}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">{error}</p>
            {esRed && (
              <button
                type="button"
                onClick={() => void cargar()}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground"
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <h1 className="text-xl font-bold leading-snug sm:text-2xl">{datos.acuerdo.titulo}</h1>

            {/* Documento */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <p className="text-[13px] font-bold text-muted-foreground">Documento a firmar</p>
                <a
                  href={datos.acuerdo.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3.5 text-[13px] font-bold text-primary hover:bg-muted"
                >
                  Abrir en otra pestaña <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <object data={datos.acuerdo.pdfUrl} type="application/pdf" title={datos.acuerdo.titulo} aria-label={`Documento a firmar: ${datos.acuerdo.titulo}`} className="h-[55vh] min-h-[320px] w-full sm:h-[460px]">
                <p className="p-5 text-[13px] text-muted-foreground">
                  Tu navegador no muestra PDF incrustados: ábrelo con el enlace de arriba.
                </p>
              </object>
            </div>

            {/* Firmantes */}
            <div className="rounded-3xl border border-border bg-card p-5">
              <p className="mb-3 text-[13px] font-bold text-muted-foreground">Firmantes</p>
              <ul className="space-y-2">
                {datos.firmantes.map((f) => (
                  <li key={`${f.nombre}-${f.rol}`} className="flex items-center gap-2 text-[13px]">
                    {f.firmo
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="font-bold">{f.nombre}</span>
                    <span className="text-muted-foreground">· {f.rol} · {f.firmo ? "Firmó" : "Pendiente"}</span>
                  </li>
                ))}
              </ul>
            </div>

            {datos.firmante.yaFirmo ? (
              <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-500/40 dark:bg-emerald-500/10">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-[15px] font-bold">Tu firma quedó registrada</p>
                {datos.acuerdo.estado === "firmado" && datos.acuerdo.pdfFirmadoUrl ? (
                  <a
                    href={datos.acuerdo.pdfFirmadoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground"
                  >
                    <Download className="h-4 w-4" /> Descargar el acuerdo firmado
                  </a>
                ) : (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Cuando firmen todas las partes, el documento final quedará disponible en este mismo enlace.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-5">
                <p className="text-[13px] font-bold text-muted-foreground">Firmas como</p>
                <p className="mt-1 text-[15px] font-bold">{datos.firmante.nombre}</p>
                <p className="text-[13px] text-muted-foreground">
                  {datos.firmante.rol}{datos.firmante.documento ? ` · ${datos.firmante.documento}` : ""}
                </p>

                <div className="mt-4">
                  <FirmaPad onChange={setFirma} disabled={enviando} />
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-2.5 py-1 text-[13px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={acepta}
                    onChange={(e) => setAcepta(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <span>
                    Declaro que soy <b className="text-foreground">{datos.firmante.nombre}</b>, que leí el documento y que
                    este trazo es mi firma electrónica, con plena validez entre las partes (Ley 527 de 1999 y
                    Decreto 2364 de 2012, Colombia).
                  </span>
                </label>

                <button
                  type="button"
                  onClick={firmar}
                  disabled={!firma || !acepta || enviando}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                  Firmar el acuerdo
                </button>
              </div>
            )}

            <p className="flex items-start gap-2 px-1 text-[11.5px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              La firma queda asociada al documento mediante su huella SHA-256 ({datos.acuerdo.hashSha256.slice(0, 16)}…),
              con fecha, hora, IP y dispositivo. El PDF final incluye la constancia de firma de cada parte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmarAcuerdo;
