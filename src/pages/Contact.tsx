import { motion } from "framer-motion";
import { Mail, MessageCircle, Clock, MapPin, Phone, ArrowLeft, Send, HelpCircle, BookOpen, MessageSquare } from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success("Mensaje enviado. Te responderemos pronto.");
    setFormData({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Respuesta en 24-48 horas",
      value: "hola@creator-ia.com",
      action: "mailto:hola@creator-ia.com"
    },
    {
      icon: MessageCircle,
      title: "Discord",
      description: "Comunidad y soporte en tiempo real",
      value: "Unirse al servidor",
      action: "https://discord.gg/creator-ia"
    },
    {
      icon: Clock,
      title: "Horario",
      description: "Lunes a Viernes",
      value: "9:00 AM - 6:00 PM (COT)",
      action: null
    },
    {
      icon: MapPin,
      title: "Ubicación",
      description: "Bogotá, Colombia",
      value: "Zona T, Chapinero",
      action: null
    }
  ];

  const faqCategories = [
    {
      icon: HelpCircle,
      title: "Ayuda General",
      description: "Preguntas comunes sobre la plataforma",
      path: "/documentation"
    },
    {
      icon: BookOpen,
      title: "Documentación",
      description: "Guías técnicas y tutoriales",
      path: "/docs"
    },
    {
      icon: MessageSquare,
      title: "Soporte Técnico",
      description: "Reportar problemas técnicos",
      path: "mailto:support@creator-ia.com"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Contacto — Creator IA Pro"
        description="Contacta al equipo de Creator IA Pro. Soporte técnico, preguntas sobre planes, o consultas generales. Estamos aquí para ayudarte."
        keywords="contacto, soporte, ayuda, Creator IA Pro, Colombia, atención al cliente"
        canonical="https://creator-ia.com/contact"
      />

      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-white">
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
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Contacto</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter mb-6 italic">
              Estamos Aquí para Ayudarte
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed">
              ¿Tienes preguntas sobre Creator IA Pro? Nuestro equipo está listo para responder
              tus consultas sobre planes, soporte técnico o alianzas comerciales.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 border-b border-zinc-100">
        <div className="container px-6 mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, idx) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 text-center hover:border-primary/20 transition-colors"
                >
                  <div className="inline-flex p-3 rounded-xl bg-white border border-zinc-200 mb-4">
                    <method.icon className="h-5 w-5 text-zinc-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-1">{method.title}</h3>
                  <p className="text-xs text-zinc-500 mb-3">{method.description}</p>
                  {method.action ? (
                    <a
                      href={method.action}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-zinc-700">{method.value}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-3 italic">
                Envíanos un Mensaje
              </h2>
              <p className="text-zinc-500">
                Completa el formulario y te responderemos lo antes posible
              </p>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Nombre</label>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Email</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Asunto</label>
                <Input
                  type="text"
                  placeholder="¿Sobre qué nos contactas?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje aquí..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-bold uppercase tracking-widest"
              >
                {loading ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-400 text-center">
                Al enviar este formulario, aceptas nuestra{" "}
                <a href="/privacy" className="text-primary hover:underline">Política de Privacidad</a>
              </p>
            </motion.form>
          </div>
        </div>
      </section>

      {/* FAQ Links */}
      <section className="py-24 bg-zinc-50 border-t border-zinc-100">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-3 italic">
                Recursos de Ayuda
              </h2>
              <p className="text-zinc-500">
                Explora estos recursos para encontrar respuestas rápidas
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {faqCategories.map((cat, idx) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => cat.path.startsWith("mailto:") ? window.location.href = cat.path : navigate(cat.path)}
                  className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-primary/30 cursor-pointer transition-all group"
                >
                  <div className="inline-flex p-3 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors mb-4">
                    <cat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-2">{cat.title}</h3>
                  <p className="text-sm text-zinc-500">{cat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
