import { motion } from "framer-motion";
import { Cookie, Settings, Shield, CheckCircle2, ArrowLeft, Info } from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Cookies = () => {
  const navigate = useNavigate();

  const cookieTypes = [
    {
      id: "essential",
      title: "Cookies Esenciales",
      description: "Necesarias para el funcionamiento básico del sitio. No se pueden desactivar.",
      examples: ["session_id", "csrf_token", "auth_token"],
      required: true,
      duration: "Sesión / 1 año"
    },
    {
      id: "functional",
      title: "Cookies Funcionales",
      description: "Recuerdan tus preferencias para personalizar tu experiencia.",
      examples: ["language", "theme", "user_preferences"],
      required: false,
      duration: "1 año"
    },
    {
      id: "analytics",
      title: "Cookies Analíticas",
      description: "Nos ayudan a entender cómo interactúas con el sitio para mejorarlo.",
      examples: ["_ga", "_gid", "page_views"],
      required: false,
      duration: "2 años"
    },
    {
      id: "marketing",
      title: "Cookies de Marketing",
      description: "Utilizadas para mostrarte publicidad relevante (actualmente no utilizadas).",
      examples: ["ad_preferences", "campaign_data"],
      required: false,
      duration: "90 días"
    }
  ];

  const thirdParties = [
    {
      name: "Supabase",
      purpose: "Autenticación y base de datos",
      privacyUrl: "https://supabase.com/privacy"
    },
    {
      name: "Vercel",
      purpose: "Hosting y edge functions",
      privacyUrl: "https://vercel.com/legal/privacy-policy"
    },
    {
      name: "Bold.co",
      purpose: "Procesamiento de pagos",
      privacyUrl: "https://bold.co/privacidad"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Política de Cookies"
        description="Política de cookies de Creator IA Pro. Conoce qué cookies utilizamos y cómo gestionar tus preferencias."
        keywords="cookies, política de cookies, privacidad, GDPR, consentimiento"
        canonical="https://creator-ia.com/cookies"
      />

      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Button
              variant="ghost"
              className="mb-6 text-zinc-500 hover:text-zinc-900 -ml-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-200">
                <Cookie className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 italic">Cookies</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter mb-6 italic">
              Política de Cookies
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed">
              Utilizamos cookies para mejorar tu experiencia. Esta página explica qué cookies
              usamos, para qué sirven y cómo puedes gestionar tus preferencias.
            </p>

            <div className="flex items-center gap-4 mt-8 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Versión 1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Actualizado: 18 Abr 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            {/* What are cookies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">
                ¿Qué son las Cookies?
              </h2>
              <p className="text-zinc-600 leading-relaxed mb-4">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas
                un sitio web. Sirven para recordar tus preferencias, mantener tu sesión activa y
                comprender cómo interactúas con el sitio.
              </p>
              <p className="text-zinc-600 leading-relaxed">
                Creator IA Pro utiliza cookies de manera responsable y transparente, cumpliendo con
                la normativa colombiana (Ley 1581 de 2012) y el Reglamento General de Protección de
                Datos de la UE (GDPR).
              </p>
            </motion.div>

            {/* Cookie Types */}
            <div className="space-y-6 mb-16">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                Tipos de Cookies que Utilizamos
              </h2>

              {cookieTypes.map((type, idx) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-zinc-900">{type.title}</h3>
                    {type.required ? (
                      <span className="px-2 py-1 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase">
                        Obligatoria
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                        Opcional
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 mb-3">{type.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {type.examples.map((example) => (
                      <code key={example} className="px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-xs">
                        {example}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">Duración: {type.duration}</p>
                </motion.div>
              ))}
            </div>

            {/* Third Parties */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">
                Cookies de Terceros
              </h2>
              <p className="text-zinc-600 mb-6">
                Algunos de nuestros proveedores de servicios pueden utilizar cookies:
              </p>

              <div className="space-y-3">
                {thirdParties.map((party) => (
                  <div
                    key={party.name}
                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm">{party.name}</h4>
                      <p className="text-xs text-zinc-500">{party.purpose}</p>
                    </div>
                    <a
                      href={party.privacyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Ver política →
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Manage Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                  Gestionar Preferencias
                </h2>
              </div>
              <p className="text-zinc-600 mb-6">
                Puedes gestionar tus preferencias de cookies en cualquier momento desde la
                configuración de tu navegador. Ten en cuenta que desactivar ciertas cookies
                puede afectar la funcionalidad del sitio.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="border-amber-300"
                >
                  Solicitar cambio de preferencias
                </Button>
              </div>
            </motion.div>

            {/* Browser Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">
                Configuración del Navegador
              </h2>
              <p className="text-zinc-600 mb-4">
                La mayoría de navegadores permiten controlar las cookies a través de sus configuraciones:
              </p>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Firefox:</strong> Preferencias → Privacidad → Cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Safari:</strong> Preferencias → Privacidad → Cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Edge:</strong> Configuración → Cookies y permisos de sitio</span>
                </li>
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-zinc-950 text-white text-center"
            >
              <Shield className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-black mb-3">¿Preguntas sobre Cookies?</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Si tienes dudas sobre nuestra política de cookies o cómo gestionar tus preferencias,
                nuestro equipo está disponible para ayudarte.
              </p>
              <Button
                onClick={() => navigate("/contact")}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                Contactar Soporte
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cookies;
