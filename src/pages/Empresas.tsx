// Landing B2B "/empresas" — el brochure que Andrés comparte con empresas para
// ofrecer Creator IA Pro (pedido de Sebastián 2026-10-20). La inscripción
// reutiliza /api/contact (Resend → hola@creator-ia.com): nada se guarda en
// nuestra base y el señuelo anti-bot es el mismo de /contact. Acepta
// ?ref=<quien-comparte> (p. ej. /empresas?ref=andres) y lo anota en el correo
// para saber de dónde vino el lead.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  Loader2,
  MessagesSquare,
  MonitorPlay,
  Rocket,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useReducedMotion } from "@/hooks/useUserPreferences";
import { validarContacto } from "@/lib/contact";

const BENEFICIOS = [
  {
    icon: Sparkles,
    title: "Los mejores modelos, un solo lugar",
    desc: "GPT-5, Claude, Gemini y más desde un mismo chat. Tu equipo cambia de modelo con un clic, sin contratar cada proveedor por separado.",
  },
  {
    icon: FileText,
    title: "Contratos y documentos al chat",
    desc: "Sube un PDF o Word y pregunta: resúmenes, riesgos, cláusulas. El contenido viaja en la petición y no queda archivado en nuestros servidores.",
  },
  {
    icon: Rocket,
    title: "Sitios y apps sin programar",
    desc: "Describe lo que necesitas y Basalt construye un sitio multi-archivo con vista previa, consola y exportación lista para publicar.",
  },
  {
    icon: Users2,
    title: "Para todo tu equipo",
    desc: "El plan Pyme incluye usuarios adicionales del equipo: tu gerente de cuenta deja cada espacio configurado y listo para trabajar.",
  },
  {
    icon: CreditCard,
    title: "Pagos locales, cero sorpresas",
    desc: "Bold en pesos colombianos: tarjeta, PSE o Bre-B. Nunca cobramos automático — cada renovación la decides tú.",
  },
  {
    icon: ShieldCheck,
    title: "Acompañamiento real",
    desc: "Soporte prioritario y gerente de cuenta dedicado en el plan Pyme. Hablas con personas, no con un robot de tickets.",
  },
];

const PASOS = [
  { n: "1", title: "Inscribe tu empresa", desc: "Llena el formulario de abajo — toma dos minutos y no te compromete a nada." },
  { n: "2", title: "Te contactamos", desc: "Te escribimos para entender lo que necesitan, con demostración guiada si la quieren." },
  { n: "3", title: "Tu equipo crea", desc: "Activamos el plan y tu empresa queda produciendo con IA desde el primer día." },
];

const PLAN_PYME = [
  "20.000 créditos mensuales",
  "Todo lo del plan Agencia",
  "Usuarios adicionales del equipo",
  "Integraciones y API disponibles",
  "Gerente de cuenta dedicado",
];

const PLAN_EMPRESARIAL = [
  "Volumen de créditos a la medida",
  "Infraestructura dedicada",
  "SLA personalizado y soporte enterprise",
  "Integración con tus herramientas actuales",
  "Facturación corporativa y NIT",
];

// Capturas reales del producto, no ilustraciones: salen de
// `node scripts/mobile-shots.mjs <ruta> <salida.png> --device "Desktop Chrome HiDPI"`
// contra el build de producción con la API simulada, así que lo que se ve aquí
// es exactamente lo que verá la empresa al entrar.
const CAPTURAS = [
  {
    icon: MessagesSquare,
    src: "/capturas/chat-contrato.webp",
    ruta: "/a/basalt",
    kicker: "Documentos",
    title: "Sube un contrato y pregúntale lo que quieras",
    desc: "Resumen, riesgos y cláusulas en segundos, en el mismo chat donde tu equipo ya trabaja. El archivo viaja en la petición y no queda archivado en nuestros servidores.",
  },
  {
    icon: Scale,
    src: "/capturas/arena-modelos.webp",
    ruta: "/a/arena",
    kicker: "Comparar modelos",
    title: "El mismo encargo a varios modelos, lado a lado",
    desc: "Tu equipo manda un prompt a Claude, GPT, Gemini o Llama al tiempo y se queda con la mejor respuesta. Cada columna cobra lo que cobre su modelo, y varios no cobran nada.",
  },
  {
    icon: LayoutDashboard,
    src: "/capturas/panel-consumo.webp",
    ruta: "/dashboard",
    kicker: "Control del gasto",
    title: "Siempre sabes en qué se van los créditos",
    desc: "Saldo, plan y consumo de los últimos siete días, con el detalle por módulo. Sin facturas sorpresa a fin de mes ni conversiones a dólares.",
  },
  {
    icon: ListChecks,
    src: "/capturas/tareas-equipo.webp",
    ruta: "/tasks",
    kicker: "Trabajo del equipo",
    title: "Lo que salga del chat queda en un tablero",
    desc: "Tareas con responsable, prioridad y fecha, más espacios de trabajo compartidos. La IA propone y el equipo hace seguimiento en el mismo lugar.",
  },
];

// Las entradas con desplazamiento se apagan con "reducir movimiento" (ajuste del
// sistema o de la cuenta): queda solo el fundido, que no marea a nadie.
const entrada = (reducido: boolean, dx = 0, dy = 24) => ({
  initial: reducido ? { opacity: 0 } : { opacity: 0, x: dx, y: dy },
  whileInView: { opacity: 1, x: 0, y: 0 },
  viewport: { once: true, margin: "-80px" },
});

// Marco de navegador para las capturas: sin él se leen como fotos sueltas y no
// como pantallas del producto.
function Captura({ src, alt, ruta, prioridad = false }: { src: string; alt: string; ruta: string; prioridad?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/10">
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
        <span className="ml-2 truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">creator-ia.com{ruta}</span>
      </div>
      <img
        src={src}
        alt={alt}
        width={1600}
        height={900}
        loading={prioridad ? "eager" : "lazy"}
        decoding="async"
        className="block w-full"
      />
    </div>
  );
}

export default function Empresas() {
  const [params] = useSearchParams();
  // Quién compartió el enlace (/empresas?ref=andres) — solo letras/números/guiones.
  const ref = useMemo(() => (params.get("ref") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40), [params]);
  const reducido = useReducedMotion();

  const [empresa, setEmpresa] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [website, setWebsite] = useState(""); // señuelo anti-bot, invisible
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim()) return void toast.error("¿Cómo se llama tu empresa?");
    if (empresa.trim().length > 100) return void toast.error("El nombre de la empresa supera los 100 caracteres.");

    // Mismo contrato que /contact: el asunto lleva la empresa y el cuerpo va
    // estructurado para que el correo se lea de un vistazo.
    const payload = {
      name: nombre,
      email,
      subject: `Inscripción empresa: ${empresa.trim()}`.slice(0, 150),
      message: [
        `Empresa: ${empresa.trim()}`,
        `Contacto: ${nombre.trim()}`,
        `Teléfono: ${telefono.trim() || "—"}`,
        `Origen: ${ref ? `referido "${ref}"` : "directo"}`,
        "",
        mensaje.trim() || "Sin detalle adicional.",
      ].join("\n"),
    };
    const problema = validarContacto(payload);
    if (problema) return void toast.error(problema);

    setEnviando(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, website }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setEnviado(true);
        toast.success("Inscripción enviada. Te contactaremos muy pronto.");
      } else if (res.status === 503) {
        toast.error("El formulario no está disponible ahora mismo.", {
          description: "Escríbenos a hola@creator-ia.com y te respondemos por ahí.",
        });
      } else {
        toast.error(json?.error || "No se pudo enviar la inscripción.", {
          description: "También puedes escribirnos directo a hola@creator-ia.com.",
          action: {
            label: "Abrir correo",
            onClick: () => {
              window.location.href = `mailto:hola@creator-ia.com?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.message)}`;
            },
          },
        });
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
        title="Creator IA para Empresas"
        description="Lleva la IA a tu empresa: los mejores modelos en un solo lugar, planes Pyme y Empresarial con pagos en pesos (Bold) y acompañamiento real. Inscríbete y te contactamos."
        keywords="IA para empresas, inteligencia artificial pymes, Colombia, Creator IA Pro, plan pyme"
        canonical="https://creator-ia.com/empresas"
      />

      <LandingHeader themed />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Para empresas</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display leading-[1.02] mb-6">
              Ponle IA a tu empresa,<br className="hidden sm:block" /> en pesos y sin enredos.
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mb-10">
              Una sola plataforma para que tu equipo escriba, analice documentos, genere imágenes
              y construya con IA — pagando en pesos colombianos con Bold, sin cobros automáticos
              ni tarjetas internacionales.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#inscripcion"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/90 transition-all"
              >
                Inscribir mi empresa <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center rounded-2xl border border-zinc-200 dark:border-zinc-700 px-7 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Ver planes y precios
              </Link>
            </div>
          </motion.div>

          {/* La primera pantalla del producto, para que se vea de qué se habla
              antes de pedirle los datos a nadie. */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl" aria-hidden="true" />
            <motion.div
              animate={reducido ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Captura
                src="/capturas/basalt-inicio.webp"
                ruta="/a/basalt"
                alt="Pantalla de inicio de Basalt con atajos para construir una app, analizar un contrato o crear una pieza gráfica."
                prioridad
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Video: qué es la plataforma, sin leer nada */}
      <section className="py-20 border-b border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto max-w-5xl">
          <motion.div {...entrada(reducido)} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-6">
              <MonitorPlay className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">17 segundos</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-4">
              Míralo en acción
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Un contrato analizado y una portada generada, desde el mismo chat. Sin instalar nada
              y sin que nadie del equipo tenga que saber de IA.
            </p>
          </motion.div>
          <motion.div
            {...entrada(reducido, 0, 16)}
            className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 shadow-2xl shadow-zinc-900/15 aspect-video"
          >
            {/* Sin pista de audio: se reproduce solo en bucle, y con "reducir
                movimiento" espera a que la persona le dé play. */}
            <video
              controls
              muted
              playsInline
              preload="metadata"
              autoPlay={!reducido}
              loop={!reducido}
              poster="/capturas/promo-poster.webp"
              className="w-full h-full object-cover"
            >
              <source src="/promo-landing.mp4" type="video/mp4" />
              Tu navegador no reproduce video HTML5.
            </video>
          </motion.div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20">
        <div className="container px-6 mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-12 max-w-2xl">
            Lo que tu empresa recibe desde el día uno
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFICIOS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-sm"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-primary/10 border border-primary/20 p-3">
                  <b.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100 mb-2">{b.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pantallas reales del producto */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto">
          <motion.div {...entrada(reducido)} className="max-w-2xl mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Pantallas reales</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mt-4">
              Lo que verá tu equipo
            </h2>
          </motion.div>

          <div className="space-y-20 lg:space-y-28">
            {CAPTURAS.map((c, i) => (
              <div key={c.src} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <motion.div
                  {...entrada(reducido, i % 2 === 0 ? -28 : 28, 0)}
                  transition={{ duration: 0.55 }}
                  className={i % 2 === 1 ? "lg:order-last" : undefined}
                >
                  <div className="mb-5 inline-flex items-center gap-2.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-2">
                    <c.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{c.kicker}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-4 leading-tight">
                    {c.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{c.desc}</p>
                </motion.div>
                <motion.div {...entrada(reducido, i % 2 === 0 ? 28 : -28, 0)} transition={{ duration: 0.55, delay: 0.1 }}>
                  <Captura src={c.src} ruta={c.ruta} alt={c.title} />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 border-b border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-12">
            Así de simple
          </h2>
          <div className="relative">
            {/* La línea se dibuja al entrar en pantalla y une los tres pasos. */}
            <motion.div
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reducido ? 0 : 0.9, ease: "easeInOut" }}
              className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px origin-left bg-gradient-to-r from-primary/50 via-primary/50 to-primary/10 sm:block"
            />
            <div className="relative grid sm:grid-cols-3 gap-6">
              {PASOS.map((p, i) => (
                <motion.div
                  key={p.n}
                  {...entrada(reducido, 0, 20)}
                  transition={{ duration: 0.5, delay: reducido ? 0 : 0.15 * i }}
                  className="rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-7"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-lg font-black text-primary font-display">
                    {p.n}
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100 mt-4 mb-2">{p.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planes para empresas */}
      <section className="py-20">
        <div className="container px-6 mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-4">
            Planes pensados para negocios
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-12">
            ¿Equipo pequeño o quieres probar primero?{" "}
            <Link to="/pricing" className="text-primary font-bold hover:underline">Mira todos los planes desde $0</Link>.
          </p>
          <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-display">Pyme</h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Para negocios</span>
              </div>
              <p className="text-4xl font-black text-zinc-900 dark:text-zinc-100 font-display tracking-tighter mb-1">$1.499.900</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">COP / mes · 20.000 créditos</p>
              <ul className="space-y-3">
                {PLAN_PYME.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-display">Empresarial</h3>
                <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400">A medida</span>
              </div>
              <p className="text-4xl font-black text-zinc-900 dark:text-zinc-100 font-display tracking-tight mb-1">A medida</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Volumen, soporte y facturación a la medida de tu organización</p>
              <ul className="space-y-3">
                {PLAN_EMPRESARIAL.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Inscripción */}
      <section id="inscripcion" className="scroll-mt-28 py-20 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <div className="container px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display mb-4">
                Inscribe tu empresa
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                Déjanos los datos y te contactamos para activar a tu equipo — con demostración
                guiada si la quieren y sin ningún compromiso.
              </p>
              <ul className="space-y-4">
                {["Respuesta de una persona real, no un bot", "Demostración guiada para tu equipo", "Sin permanencia: cada renovación la decides tú"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {enviado ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-950 p-10 text-center">
                <div className="mx-auto mb-5 inline-flex rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-display mb-2">¡Inscripción enviada!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                  Gracias{nombre.trim() ? `, ${nombre.trim().split(" ")[0]}` : ""}. Te escribiremos a{" "}
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{email.trim()}</span> muy pronto.
                </p>
                <Link to="/pricing" className="text-sm font-bold text-primary hover:underline">
                  Mientras tanto, mira los planes →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 space-y-5 shadow-sm">
                <div className="space-y-2">
                  <label htmlFor="emp-empresa" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Empresa</label>
                  <Input id="emp-empresa" type="text" placeholder="Nombre de tu empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required autoComplete="organization" maxLength={100} className="h-12" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="emp-nombre" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tu nombre</label>
                    <Input id="emp-nombre" type="text" placeholder="¿Quién nos escribe?" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" maxLength={100} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="emp-telefono" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Teléfono <span className="text-zinc-500 dark:text-zinc-400">(opcional)</span></label>
                    <Input id="emp-telefono" type="tel" placeholder="+57 ..." value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" maxLength={30} className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="emp-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Correo de contacto</label>
                  <Input id="emp-email" type="email" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" maxLength={200} className="h-12" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="emp-mensaje" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¿Qué quieren lograr con IA? <span className="text-zinc-500 dark:text-zinc-400">(opcional)</span></label>
                  <Textarea id="emp-mensaje" placeholder="Cuéntanos del equipo y lo que necesitan…" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={4000} rows={4} />
                </div>
                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/90 transition-all disabled:opacity-60"
                >
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  {enviando ? "Enviando…" : "Enviar inscripción"}
                </button>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                  Al enviar aceptas nuestra <Link to="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">Política de Privacidad</Link>. No guardamos tus datos en bases de marketing.
                </p>
                {/* Señuelo anti-bot: fuera de pantalla y del orden de tabulación. Va de último
                    para no regalarle el margen de space-y-5 al primer campo visible. */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-0 h-px w-px opacity-0"
                />
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer themed />
    </div>
  );
}
