import { motion } from "framer-motion";
import { Shield, Lock, Key, Server, CheckCircle2, AlertTriangle, FileCheck, ArrowLeft, ExternalLink } from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Security = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Lock,
      title: "Encriptación de Extremo a Extremo",
      description: "Todos los datos se transmiten y almacenan con encriptación AES-256. Conexiones SSL/TLS 1.3 obligatorias.",
      status: "Activo"
    },
    {
      icon: Key,
      title: "Autenticación Segura",
      description: "OAuth 2.0 + JWT con tokens de corta duración. Soporte para MFA (autenticación de dos factores).",
      status: "Activo"
    },
    {
      icon: Server,
      title: "Infraestructura Segura",
      description: "Servidores en centros de datos con certificación SOC 2 Type II. Redes aisladas y monitoreo 24/7.",
      status: "Activo"
    },
    {
      icon: Shield,
      title: "Protección contra Amenazas",
      description: "Detección de intrusiones, protección DDoS, escaneo de vulnerabilidades automatizado.",
      status: "Activo"
    },
    {
      icon: FileCheck,
      title: "Backups y Recuperación",
      description: "Backups diarios encriptados en múltiples ubicaciones. RTO de 4 horas, RPO de 1 hora.",
      status: "Activo"
    },
    {
      icon: AlertTriangle,
      title: "Respuesta a Incidentes",
      description: "Equipo de respuesta 24/7. SLA de detección < 15 minutos. Notificación a usuarios en 24 horas.",
      status: "Activo"
    }
  ];

  const certifications = [
    { name: "SOC 2 Type II", description: "Auditoría de controles de seguridad" },
    { name: "ISO 27001", description: "Gestión de seguridad de la información" },
    { name: "GDPR Compliant", description: "Reglamento general de protección de datos" },
    { name: "Ley 1581", description: "Protección de datos personales Colombia" },
  ];

  const practices = [
    {
      title: "Desarrollo Seguro",
      items: [
        "Code reviews obligatorios antes de cada deploy",
        "Escaneo de dependencias vulnerables (Snyk)",
        "Análisis estático de código (SonarQube)",
        "Entornos de staging aislados"
      ]
    },
    {
      title: "Control de Acceso",
      items: [
        "Principio de mínimo privilegio",
        "Acceso a producción solo vía VPN",
        "Rotación de credenciales cada 90 días",
        "Logs de auditoría de todas las acciones"
      ]
    },
    {
      title: "Protección de Datos",
      items: [
        "Datos sensibles siempre encriptados",
        "Mascaramiento de datos en logs",
        "Anonimización de IPs en analytics",
        "Política de retención estricta"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Seguridad — Creator IA Pro"
        description="Conoce nuestras medidas de seguridad: encriptación AES-256, autenticación segura, cumplimiento SOC 2 y protección de datos empresarial."
        keywords="seguridad, encriptación, AES-256, SOC 2, protección datos, privacidad"
        canonical="https://creator-ia.com/security"
      />

      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-zinc-950 text-white">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Button
              variant="ghost"
              className="mb-6 text-zinc-400 hover:text-white -ml-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 italic">Seguridad</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 italic">
              Seguridad de Nivel Empresarial
            </h1>

            <p className="text-xl text-zinc-400 leading-relaxed">
              Tu información merece la mejor protección. Implementamos los más altos estándares
              de seguridad para garantizar la confidencialidad e integridad de tus datos.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">99.99% Uptime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-24">
        <div className="container px-6 mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-4 italic">
                Infraestructura de Seguridad
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Múltiples capas de protección para garantizar la seguridad de tu información
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 group-hover:border-emerald-200 transition-colors">
                      <feature.icon className="h-5 w-5 text-zinc-700 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      {feature.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="container px-6 mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-3 italic">
                Certificaciones y Cumplimiento
              </h2>
              <p className="text-zinc-500">
                Cumplimos con los estándares internacionales más estrictos
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {certifications.map((cert, idx) => (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white border border-zinc-200 text-center"
                >
                  <FileCheck className="h-6 w-6 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-bold text-zinc-900 text-sm mb-1">{cert.name}</h3>
                  <p className="text-xs text-zinc-500">{cert.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-24">
        <div className="container px-6 mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-4 italic">
                Prácticas de Seguridad
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Nuestro equipo sigue rigurosos protocolos de seguridad en cada etapa del desarrollo
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {practices.map((practice, idx) => (
                <motion.div
                  key={practice.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-zinc-900 border-b border-zinc-200 pb-3">
                    {practice.title}
                  </h3>
                  <ul className="space-y-3">
                    {practice.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Report Security Issue */}
      <section className="py-24 bg-zinc-950 text-white">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black tracking-tighter mb-4 italic">
              Reportar una Vulnerabilidad
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Si has descubierto una vulnerabilidad de seguridad, por favor repórtala de manera responsable.
              Valoramos la contribución de la comunidad de seguridad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = "mailto:security@creator-ia.com"}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Reportar por Email
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/contact")}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              >
                Contactar Soporte
              </Button>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-left">
              <h3 className="font-bold mb-3 text-sm">Información de Contacto de Seguridad</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• Email: security@creator-ia.com</li>
                <li>• Respuesta esperada: 24-48 horas</li>
                <li>• Reconocimiento en Hall of Fame para reportes válidos</li>
                <li>• No realices pruebas que dañen usuarios o infraestructura</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;
