import { motion } from "framer-motion";
import {
  HelpCircle,
  Book,
  MessageSquare,
  Video,
  FileText,
  Zap,
  Search,
  ArrowLeft,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Help = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      icon: Book,
      title: "Documentación",
      description: "Guías técnicas completas",
      path: "/documentation",
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
    },
    {
      icon: MessageSquare,
      title: "Soporte",
      description: "Contacta a nuestro equipo",
      path: "/contact",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    },
    {
      icon: FileText,
      title: "Términos",
      description: "Términos de servicio",
      path: "/terms",
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
    },
    {
      icon: Zap,
      title: "Estado",
      description: "Estado del sistema",
      path: "/system-status",
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
    },
  ];

  const faqs = [
    {
      question: "¿Cómo empiezo a usar Creator IA Pro?",
      answer:
        "Crea una cuenta gratuita en /auth y recibe 5 créditos para explorar. Desde el Dashboard, accede a Genesis IDE para crear apps o Studio para imágenes y texto.",
      category: "Primeros pasos",
    },
    {
      question: "¿Qué son los Neural Cycles (créditos)?",
      answer:
        "Son nuestra unidad de cómputo. Cada operación de IA consume créditos según su complejidad: generación de texto (~1-5), imágenes (~10-50), código (~5-20). Los créditos no tienen vencimiento.",
      category: "Facturación",
    },
    {
      question: "¿Cómo compro más créditos?",
      answer:
        "Ve a /pricing y selecciona un plan o pack de créditos. Los pagos se procesan via Bold.co en pesos colombianos. Los créditos se acreditan instantáneamente.",
      category: "Facturación",
    },
    {
      question: "¿Puedo cancelar mi suscripción?",
      answer:
        "Sí, puedes cancelar en cualquier momento desde tu perfil. La cancelación es efectiva al final del período de facturación actual. No hay reembolsos por cambio de opinión.",
      category: "Facturación",
    },
    {
      question: "¿Qué modelos de IA están disponibles?",
      answer:
        "Ofrecemos GPT-4, Claude 3.5, Gemini Pro, FLUX Pro, Stable Diffusion y más. La disponibilidad varía según tu plan. Los planes superiores incluyen modelos premium.",
      category: "Técnico",
    },
    {
      question: "¿Mis datos están seguros?",
      answer:
        "Implementamos encriptación AES-256, cumplimos con la Ley 1581 de Colombia y certificaciones SOC 2. Nunca vendemos tus datos. Ver /privacy y /security.",
      category: "Seguridad",
    },
    {
      question: "¿Puedo usar el contenido generado comercialmente?",
      answer:
        "Sí, tienes derechos de uso completo sobre el contenido que generas. Sin embargo, eres responsable de verificar que no infrinja derechos de terceros.",
      category: "Legal",
    },
    {
      question: "¿Cómo funciona el Canvas IA?",
      answer:
        "El Canvas (Studio Flow) es un lienzo visual donde conectas nodos de IA para crear flujos de trabajo. Arrastra nodos, conéctalos y ejecuta el flujo completo.",
      category: "Técnico",
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const categories = [...new Set(faqs.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Centro de Ayuda — Creator IA Pro"
        description="Encuentra respuestas a tus preguntas sobre Creator IA Pro. Guías, FAQs, documentación y soporte."
        keywords="ayuda, soporte, FAQ, preguntas frecuentes, Creator IA Pro, tutorial"
        canonical="https://creator-ia.com/help"
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
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                Centro de Ayuda
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter mb-6 italic">
              ¿Cómo podemos ayudarte?
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed mb-8">
              Encuentra respuestas rápidas o explora nuestra documentación para
              sacar el máximo provecho de Creator IA Pro.
            </p>

            {/* Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar en la ayuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 border-b border-zinc-100">
        <div className="container px-6 mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((cat, idx) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(cat.path)}
                  className="p-6 rounded-2xl border cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div
                    className={`inline-flex p-3 rounded-xl mb-4 ${cat.color}`}
                  >
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-1">{cat.title}</h3>
                  <p className="text-xs text-zinc-500">{cat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-3 italic">
                Preguntas Frecuentes
              </h2>
              <p className="text-zinc-500">
                Respuestas a las dudas más comunes
              </p>
            </div>

            {/* Category filters */}
            {!searchQuery && (
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className="px-4 py-2 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium hover:bg-zinc-200 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFaqs.map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white border border-zinc-200 flex-shrink-0">
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary mb-2 block">
                        {faq.category}
                      </span>
                      <h3 className="font-bold text-zinc-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">
                  No encontramos resultados para "{searchQuery}"
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Limpiar búsqueda
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-zinc-950 text-white">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-black tracking-tighter mb-4 italic">
              ¿No encontraste lo que buscabas?
            </h2>
            <p className="text-zinc-400 mb-8">
              Nuestro equipo de soporte está listo para ayudarte con cualquier
              pregunta.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/contact")}
                className="bg-white text-zinc-950 hover:bg-zinc-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar mensaje
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "https://discord.gg/creator-ia")
                }
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Comunidad Discord
              </Button>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-left max-w-lg mx-auto">
              <h3 className="font-bold mb-4 text-sm">
                Horario de atención
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• Soporte por chat: 24/7 (respuesta en 24h)</li>
                <li>• Email: Lunes a Viernes, 9AM - 6PM (COT)</li>
                <li>• Planes Enterprise: Soporte prioritario 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Help;
