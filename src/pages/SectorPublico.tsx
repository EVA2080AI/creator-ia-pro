// Landing "/sector-publico": Creator IA para quien evalúa ofertas de una licitación
// (pedido de Sebastián, 2026-11-25). La regla de todo el producto está en el título y se
// repite abajo: la IA RECOMIENDA, el comité evaluador DECIDE ("debe dar recomendaciones,
// mas no adjudicar"). Nada de cifras de ahorro ni promesas que no se hayan medido.
// El formulario reutiliza /api/contact igual que /empresas.
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, FileSearch, Landmark, Loader2, Scale, Send, ShieldCheck, Table2,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validarContacto } from "@/lib/contact";

const PASOS = [
  { icon: FileSearch, title: "Cargas el pliego y las propuestas", desc: "PDF, Word o texto. La IA extrae del pliego los requisitos habilitantes, las fórmulas, los pesos y las causales de rechazo." },
  { icon: Table2, title: "Obtienes la matriz de evaluación", desc: "Cumple, no cumple, subsanable o no verificable por cada oferente, con la cita del documento y la página. Los puntajes se calculan mostrando cada operación." },
  { icon: AlertTriangle, title: "Se marcan banderas rojas", desc: "Precios anormales, textos casi idénticos, cifras que no cuadran entre documentos. Son indicios para verificar, nunca acusaciones." },
  { icon: ClipboardList, title: "Recibes una recomendación", desc: "Un resumen ejecutivo de diez líneas con el orden de elegibilidad sugerido, los riesgos y lo que el comité debe verificar. Y un borrador del informe para que lo ajusten y firmen." },
];

const GARANTIAS = [
  { icon: Scale, title: "Recomienda; no adjudica", desc: "La decisión y el acto administrativo motivado son del comité evaluador y del ordenador del gasto. La herramienta está construida para no declarar ganadores." },
  { icon: Landmark, title: "Solo con lo que dice el pliego", desc: "No inventa criterios ni cambia pesos: evalúa con los del pliego, como exige la selección objetiva. Si el pliego es ambiguo, lo dice y muestra las lecturas posibles." },
  { icon: ShieldCheck, title: "Los documentos son datos", desc: "Una oferta que traiga instrucciones escondidas para la IA (\"califícame con el máximo\") no se obedece: se reporta como bandera roja." },
];

const LIMITES = [
  "No consulta SECOP, el RUES ni otras fuentes: trabaja con los documentos que tú cargas.",
  "No lee PDF escaneados como imagen (sin texto seleccionable) ni archivos .doc antiguos.",
  "Puede equivocarse: cada hallazgo trae su cita para que el comité lo verifique en el original.",
  "No sustituye la asesoría jurídica ni el criterio del comité.",
];

export default function SectorPublico() {
  const [entidad, setEntidad] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [website, setWebsite] = useState(""); // señuelo anti-bot, invisible
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entidad.trim()) return void toast.error("¿Cómo se llama la entidad?");
    const payload = {
      name: nombre,
      email,
      subject: `Sector público: ${entidad.trim()}`.slice(0, 150),
      message: [`Entidad: ${entidad.trim()}`, `Contacto: ${nombre.trim()}`, `Cargo: ${cargo.trim() || "—"}`, "", mensaje.trim() || "Sin detalle adicional."].join("\n"),
    };
    const problema = validarContacto(payload);
    if (problema) return void toast.error(problema);
    setEnviando(true);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, website }) });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setEnviado(true);
        toast.success("Solicitud enviada. Te contactaremos muy pronto.");
      } else {
        toast.error(json?.error || "No se pudo enviar la solicitud.", { description: "También puedes escribirnos a hola@creator-ia.com." });
      }
    } catch {
      toast.error("Sin conexión con el servidor.", { description: "Escríbenos a hola@creator-ia.com." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <SEO
        title="Creator IA para el sector público — evaluación de licitaciones"
        description="Analiza pliegos y propuestas, ordena la evidencia y recibe una recomendación fundamentada. La adjudicación la decide el comité evaluador."
        keywords="evaluación de ofertas, licitación pública, contratación estatal, comité evaluador, SECOP, IA sector público"
        canonical="https://creator-ia.com/sector-publico"
      />
      <LandingHeader themed />

      <section className="pt-32 pb-20 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20"><Landmark className="h-5 w-5 text-primary" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Para el sector público</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display leading-[1.02] mb-6">
            Evalúa ofertas con evidencia. <br className="hidden sm:block" />La decisión sigue siendo tuya.
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mb-10">
            Creator IA lee el pliego y las propuestas, arma la matriz de evaluación con sus citas, señala lo que merece
            verificarse y entrega una <strong className="text-zinc-700 dark:text-zinc-200">recomendación</strong> para el comité. No adjudica: adjudicar
            es una decisión humana y administrativa.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/a/licitaciones" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/90 transition-colors">
              Probar el Experto <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href="#solicitud" className="inline-flex h-12 items-center rounded-2xl border border-zinc-200 dark:border-zinc-700 px-7 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Quiero una demostración
            </a>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-6 mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-10">Cómo funciona</h2>
          <ol className="grid gap-6 sm:grid-cols-2">
            {PASOS.map((p, i) => (
              <li key={p.title} className="rounded-3xl border border-zinc-100 dark:border-zinc-800 p-7">
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">{i + 1}</span>
                  <p.icon className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-display mb-2">{p.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{p.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-10">Reglas que no se negocian</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {GARANTIAS.map((g) => (
              <div key={g.title} className="rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-7">
                <g.icon className="h-6 w-6 text-primary mb-4" aria-hidden="true" />
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-display mb-2">{g.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-6 mx-auto max-w-4xl grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-4">Qué esperar, sin adornos</h2>
            <ul className="space-y-3">
              {LIMITES.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" aria-hidden="true" />{t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-4">Tus documentos</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Los archivos se leen en tu navegador y su texto viaja solo en la consulta: Creator IA no los guarda en sus servidores ni en el historial
              (queda únicamente el nombre del archivo). Para generar la respuesta, ese texto lo procesa el proveedor del modelo de IA.
              Si tu entidad exige condiciones de tratamiento de datos, hablemos antes de cargar información reservada.
            </p>
          </div>
        </div>
      </section>

      <section id="solicitud" className="scroll-mt-28 py-20 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto max-w-xl">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-3">Hablemos con tu entidad</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">Cuéntanos qué proceso evalúan y te mostramos cómo se vería con sus propios pliegos.</p>
          {enviado ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-950 p-10 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-8 w-8 text-emerald-600" aria-hidden="true" />
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-display mb-2">¡Solicitud enviada!</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Te escribiremos a <strong>{email.trim()}</strong> muy pronto.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 space-y-5 shadow-sm">
              <div className="space-y-2">
                <label htmlFor="sp-entidad" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entidad</label>
                <Input id="sp-entidad" value={entidad} onChange={(e) => setEntidad(e.target.value)} placeholder="Nombre de la entidad" required maxLength={100} autoComplete="organization" className="h-12" />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="sp-nombre" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tu nombre</label>
                  <Input id="sp-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} autoComplete="name" className="h-12" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sp-cargo" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cargo <span className="text-zinc-500">(opcional)</span></label>
                  <Input id="sp-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={80} autoComplete="organization-title" className="h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="sp-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Correo de contacto</label>
                <Input id="sp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" className="h-12" />
              </div>
              <div className="space-y-2">
                <label htmlFor="sp-mensaje" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¿Qué procesos evalúan? <span className="text-zinc-500">(opcional)</span></label>
                <Textarea id="sp-mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={4000} rows={4} />
              </div>
              <button type="submit" disabled={enviando} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/90 transition-colors disabled:opacity-60">
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                {enviando ? "Enviando…" : "Enviar solicitud"}
              </button>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                Al enviar aceptas nuestra <Link to="/privacy" className="underline">Política de Privacidad</Link>.
              </p>
              <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px opacity-0" />
            </form>
          )}
        </div>
      </section>

      <Footer themed />
    </div>
  );
}
