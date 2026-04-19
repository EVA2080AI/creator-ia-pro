import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Globe, UserX, ArrowLeft, CheckCircle2 } from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "overview",
      title: "1. Resumen de Privacidad",
      content: `En Creator IA Pro, tu privacidad es nuestra prioridad. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.

Principios fundamentales:
• Solo recopilamos datos necesarios para el funcionamiento del servicio
• Nunca vendemos tu información personal a terceros
• Implementamos medidas de seguridad de nivel empresarial
• Tienes control total sobre tus datos personales
• Cumplimos con la Ley de Protección de Datos Personales de Colombia (Ley 1581 de 2012)`
    },
    {
      id: "collected",
      title: "2. Información que Recopilamos",
      content: `Datos de cuenta:
• Nombre y dirección de correo electrónico
• Información de perfil (avatar, biografía opcional)
• Fecha de registro y último acceso
• Historial de suscripciones y pagos

Datos de uso:
• Operaciones realizadas en la plataforma (prompts, imágenes generadas)
• Créditos consumidos y adquiridos
• Proyectos y espacios creados
• Preferencias de configuración

Datos técnicos:
• Dirección IP (anonimizada)
• Tipo de navegador y sistema operativo
• Logs de errores y rendimiento
• Cookies y tecnologías similares`
    },
    {
      id: "usage",
      title: "3. Cómo Usamos tu Información",
      content: `Usamos tus datos para:

• Proporcionar y mantener el servicio de Creator IA Pro
• Procesar pagos y gestionar tu suscripción
• Personalizar tu experiencia de usuario
• Mejorar nuestros algoritmos y modelos de IA
• Detectar y prevenir fraudes o uso indebido
• Enviar notificaciones importantes sobre tu cuenta
• Soporte técnico y atención al cliente

No usamos tus datos para:
• Vender publicidad personalizada
• Compartir con terceros para marketing
• Entrenar modelos de IA con tus datos sin consentimiento
• Acceder a contenido privado de tus proyectos sin autorización`
    },
    {
      id: "storage",
      title: "4. Almacenamiento y Seguridad",
      content: `Tu información se almacena de forma segura:

• Bases de datos encriptadas en reposo y tránsito (AES-256)
• Servidores ubicados en infraestructura segura (Supabase/Vercel)
• Backups automatizados diarios con encriptación
• Acceso restringido solo a personal autorizado
• Auditorías de seguridad regulares
• Cumplimiento de estándares SOC 2 Type II

Retención de datos:
• Datos de cuenta: mientras la cuenta esté activa + 1 año después de eliminación
• Contenido generado: mientras el proyecto exista + 30 días
• Logs de actividad: 90 días para análisis de seguridad
• Datos de pagos: 5 años según requerimientos legales colombianos`
    },
    {
      id: "sharing",
      title: "5. Compartición de Datos",
      content: `No vendemos tu información personal. Solo compartimos datos con:

Proveedores de servicios:
• Supabase (autenticación y base de datos)
• Bold.co (procesamiento de pagos)
• Google Cloud (procesamiento de IA via API)
• Vercel (hosting y edge functions)

Cada proveedor está sujeto a acuerdos de confidencialidad y solo tiene acceso a los datos necesarios para su función específica.

Obligaciones legales:
• Podemos divulgar información si es requerido por ley
• Para proteger nuestros derechos legales
• En caso de fusión o adquisición (con notificación previa)`
    },
    {
      id: "ai",
      title: "6. Datos e Inteligencia Artificial",
      content: `Respecto al contenido procesado por IA:

• Los prompts y contenido generado se procesan via APIs de terceros (Google, OpenAI)
• No almacenamos permanentemente las conversaciones con el chat de IA
• Los modelos de IA no se entrenan con tus datos específicos
• Puedes solicitar la eliminación de tu historial de generaciones
• Las imágenes generadas se almacenan temporalmente para tu acceso

Contenido de terceros:
• No somos responsables por el contenido que subas a la plataforma
• Debes asegurar que tienes derechos para usar cualquier contenido que subas
• Implementamos filtros de contenido inapropiado pero no garantizamos detección del 100%`
    },
    {
      id: "rights",
      title: "7. Tus Derechos de Privacidad",
      content: `Como usuario de Creator IA Pro, tienes derecho a:

• Acceder: Solicitar una copia de tus datos personales
• Rectificar: Corregir información inexacta o incompleta
• Eliminar: Solicitar la eliminación de tu cuenta y datos
• Portabilidad: Exportar tus datos en formato estándar
• Restricción: Limitar el procesamiento de tus datos
• Oposición: Oponerte al procesamiento para marketing

Para ejercer estos derechos:
• Email: privacy@creator-ia.com
• Tiempo de respuesta: 10 días hábiles
• Identificación requerida para proteger tu privacidad`
    },
    {
      id: "cookies",
      title: "8. Cookies y Tecnologías Similares",
      content: `Utilizamos cookies para:

Cookies esenciales:
• Autenticación de sesión
• Preferencias de seguridad
• Funcionalidad básica de la plataforma

Cookies de rendimiento:
• Análisis de uso anónimo
• Mejora de velocidad y rendimiento
• Detección de errores

Cookies de funcionalidad:
• Preferencias de idioma
• Configuraciones de interfaz
• Recordar tus preferencias

Puedes deshabilitar cookies en tu navegador, pero esto puede afectar la funcionalidad de la plataforma.`
    },
    {
      id: "children",
      title: "9. Privacidad de Menores",
      content: `Creator IA Pro no está dirigido a menores de 18 años:

• No recopilamos intencionalmente datos de menores de edad
• Si descubrimos datos de menores, los eliminamos inmediatamente
• Los padres pueden contactarnos para eliminar información de sus hijos
• Recomendamos supervisión parental para menores que usen herramientas de IA`
    },
    {
      id: "changes",
      title: "10. Cambios a esta Política",
      content: `Podemos actualizar esta política de privacidad:

• Cambios significativos: notificación por email 30 días antes
• Cambios menores: actualización en esta página con fecha revisada
• Recomendamos revisar esta política periódicamente
• El uso continuado después de cambios constituye aceptación

Historial de versiones:
• v2.0 - 18 Abril 2026: Actualización integral
• v1.0 - 1 Enero 2026: Versión inicial`
    },
    {
      id: "contact",
      title: "11. Contacto de Privacidad",
      content: `Para consultas sobre privacidad:

• Email: privacy@creator-ia.com
• Responsable: Oficial de Protección de Datos
• Ubicación: Bogotá, Colombia
• Autoridad de supervisión: Superintendencia de Industria y Comercio

Para denuncias sobre protección de datos:
• Superintendencia de Industria y Comercio de Colombia
• Línea gratuita: 01 800 910 165`
    }
  ];

  const features = [
    { icon: Lock, title: "Encriptación", desc: "AES-256 en reposo y tránsito" },
    { icon: Eye, title: "Transparencia", desc: "Sabemos qué datos tenemos y por qué" },
    { icon: UserX, title: "Control", desc: "Exporta o elimina tus datos cuando quieras" },
    { icon: Globe, title: "Cumplimiento", desc: "Ley 1581 de 2012 de Colombia" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Política de Privacidad"
        description="Política de privacidad de Creator IA Pro. Conoce cómo protegemos tus datos personales y cumplimos con la legislación colombiana."
        keywords="privacidad, datos personales, protección, Ley 1581, Colombia, GDPR"
        canonical="https://creator-ia.com/privacy"
      />

      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-zinc-50 to-white">
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
              <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 italic">Privacidad</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter mb-6 italic">
              Política de Privacidad
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed">
              Tu privacidad es fundamental. Esta política explica cómo recopilamos,
              usamos y protegemos tu información personal conforme a la ley colombiana.
            </p>

            <div className="flex items-center gap-4 mt-8 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Versión 2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Actualizado: 18 Abr 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 border-b border-zinc-100">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex p-3 rounded-2xl bg-zinc-50 border border-zinc-100 mb-3">
                  <feature.icon className="h-5 w-5 text-zinc-600" />
                </div>
                <h3 className="font-bold text-zinc-900 text-sm">{feature.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
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
              className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white text-center"
            >
              <h3 className="text-xl font-black mb-3">¿Preguntas sobre tu privacidad?</h3>
              <p className="text-emerald-200 mb-6 max-w-md mx-auto">
                Nuestro equipo de privacidad está disponible para aclarar cualquier duda
                sobre cómo manejamos tus datos.
              </p>
              <Button
                onClick={() => navigate("/contact")}
                className="bg-white text-emerald-900 hover:bg-emerald-50"
              >
                Contactar Equipo de Privacidad
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
