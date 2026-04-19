import { motion } from "framer-motion";
import { Scale, FileText, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "acceptance",
      title: "1. Aceptación de los Términos",
      content: `Al acceder y utilizar Creator IA Pro (en adelante, "la Plataforma"), aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.

La Plataforma es operada por Creator IA Pro, ubicada en Colombia. Estos Términos constituyen un acuerdo legalmente vinculante entre tú y Creator IA Pro.`
    },
    {
      id: "service",
      title: "2. Descripción del Servicio",
      content: `Creator IA Pro proporciona herramientas de inteligencia artificial generativa para:

• Generación de código y aplicaciones React
• Creación y edición de imágenes con IA
• Generación de texto y contenido de marketing
• Canvas visual para flujos de trabajo creativos

El servicio utiliza modelos de IA de terceros (Google Gemini, OpenAI, Anthropic) y está sujeto a sus propios términos de uso.`
    },
    {
      id: "accounts",
      title: "3. Cuentas de Usuario",
      content: `Para acceder a ciertas funciones, debes crear una cuenta proporcionando información precisa y completa. Eres responsable de:

• Mantener la confidencialidad de tu contraseña
• Todas las actividades que ocurran bajo tu cuenta
• Notificarnos inmediatamente de cualquier uso no autorizado

Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos o que presenten actividad sospechosa.`
    },
    {
      id: "credits",
      title: "4. Sistema de Créditos",
      content: `La Plataforma opera con un sistema de "Neural Cycles" (créditos):

• Los créditos se adquieren mediante planes de suscripción o pagos individuales
• Los créditos no son reembolsables excepto en caso de errores del sistema
• Las operaciones fallidas por error nuestro reembolsan créditos automáticamente
• Los créditos no tienen fecha de vencimiento mientras la cuenta esté activa
• Nos reservamos el derecho de modificar los costos de operaciones con previo aviso`
    },
    {
      id: "payment",
      title: "5. Pagos y Facturación",
      content: `Los pagos son procesados a través de Bold.co (Colombia):

• Aceptamos pagos en pesos colombianos (COP)
• Los precios incluyen impuestos aplicables según la legislación colombiana
• Las suscripciones se renuevan automáticamente unless canceladas
• Las cancelaciones son efectivas al final del período de facturación actual
• No realizamos reembolsos por cambio de opinión`
    },
    {
      id: "content",
      title: "6. Contenido Generado",
      content: `Respecto al contenido generado mediante nuestras herramientas de IA:

• Tienes los derechos de uso del contenido generado para fines legales
• No garantizamos que el contenido generado sea único o no infrinja derechos de terceros
• Eres responsable de verificar la originalidad y legalidad del contenido generado
• No uses la Plataforma para generar contenido ilegal, difamatorio, discriminatorio o que infrinja derechos de autor
• Nos reservamos el derecho de eliminar contenido que viole estas políticas`
    },
    {
      id: "prohibited",
      title: "7. Usos Prohibidos",
      content: `Queda estrictamente prohibido utilizar la Plataforma para:

• Generar malware, virus o código malicioso
• Crear contenido que promueva violencia, odio o discriminación
• Suplantar la identidad de personas u organizaciones
• Violar derechos de propiedad intelectual
• Realizar ingeniería inversa del sistema
• Acceder a áreas restringidas del sistema
• Sobrecargar intencionalmente la infraestructura
• Vender o revender acceso a la Plataforma sin autorización`
    },
    {
      id: "availability",
      title: "8. Disponibilidad del Servicio",
      content: `Nos esforzamos por mantener el 99.9% de uptime, pero no garantizamos disponibilidad ininterrumpida:

• Podemos realizar mantenimiento programado con previo aviso
• No somos responsables por fallas fuera de nuestro control (fuerza mayor, fallas de proveedores de IA)
• El acceso puede ser suspendido por violaciones de estos términos
• Los datos de usuario pueden migrarse entre servidores para optimización`
    },
    {
      id: "liability",
      title: "9. Limitación de Responsabilidad",
      content: `Hasta el máximo permitido por la ley aplicable:

• Creator IA Pro no será responsable por daños indirectos, incidentales o consecuentes
• Nuestra responsabilidad total no excederá el monto pagado por el servicio en los últimos 12 meses
• No garantizamos resultados específicos del uso de nuestras herramientas de IA
• El uso de la Plataforma es bajo tu propio riesgo`
    },
    {
      id: "modifications",
      title: "10. Modificaciones",
      content: `Nos reservamos el derecho de:

• Modificar estos términos en cualquier momento con previo aviso de 30 días
• Actualizar funcionalidades, precios y políticas
• Descontinuar el servicio con aviso de 60 días

Las modificaciones entran en vigor al publicarse en esta página. El uso continuado constituye aceptación.`
    },
    {
      id: "governing",
      title: "11. Ley Aplicable",
      content: `Estos términos se rigen por las leyes de la República de Colombia:

• Cualquier disputa se resolverá en los tribunales de Bogotá, Colombia
• Ambas partes renuncian a cualquier jurisdicción alternativa
• Si alguna cláusula es inválida, las demás permanecen en vigor
• El incumplimiento de alguna cláusula no constituye renuncia de derechos`
    },
    {
      id: "contact",
      title: "12. Contacto",
      content: `Para consultas sobre estos términos:

• Email: legal@creator-ia.com
• Dirección: Bogotá, Colombia
• Tiempo de respuesta: 5-7 días hábiles

Última actualización: 18 de abril de 2026`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Términos de Servicio"
        description="Términos y condiciones de uso de Creator IA Pro. Lee nuestras políticas de uso del servicio, pagos, créditos y responsabilidades."
        keywords="términos, condiciones, legal, contrato, Creator IA Pro, Colombia"
        canonical="https://creator-ia.com/terms"
      />

      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-zinc-50 border-b border-zinc-100">
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
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Legal</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter mb-6 italic">
              Términos de Servicio
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed">
              Al utilizar Creator IA Pro, aceptas estos términos y condiciones.
              Por favor, léelos cuidadosamente antes de continuar.
            </p>

            <div className="flex items-center gap-4 mt-8 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Versión 2.1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Vigente desde: 18 Abr 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            {/* Alert */}
            <div className="mb-12 p-6 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Importante</h3>
                <p className="text-sm text-amber-700">
                  Estos términos constituyen un contrato legalmente vinculante. Al registrarte o utilizar
                  la Plataforma, confirmas que has leído, comprendido y aceptado estar sujeto a estos términos.
                  Si tienes alguna pregunta, contacta a nuestro equipo legal antes de continuar.
                </p>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-12">
              {sections.map((section, idx) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  id={section.id}
                  className="scroll-mt-24"
                >
                  <h2 className="text-xl font-black text-zinc-900 mb-4 tracking-tight">
                    {section.title}
                  </h2>
                  <div className="prose prose-zinc max-w-none">
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-16 p-8 rounded-3xl bg-zinc-950 text-white text-center"
            >
              <h3 className="text-xl font-black mb-3">¿Preguntas sobre nuestros términos?</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Nuestro equipo legal está disponible para aclarar cualquier duda sobre estos términos.
              </p>
              <Button
                onClick={() => navigate("/contact")}
                className="bg-white text-zinc-950 hover:bg-zinc-100"
              >
                Contactar Legal
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
