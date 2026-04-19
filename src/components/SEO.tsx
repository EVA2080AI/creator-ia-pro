import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  keywords,
  ogImage = "https://creator-ia.com/og-image.jpg",
  ogType = "website",
  canonical,
  noindex = false,
}: SEOProps) {
  const siteTitle = "Creator IA Pro";
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Creator IA Pro" />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="es_CO" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Theme */}
      <meta name="theme-color" content="#8B5CF6" />
    </Helmet>
  );
}

// Preset SEO configs for common pages
export const seoPresets = {
  home: {
    title: "Crea Apps con IA en Segundos",
    description: "La plataforma definitiva para crear apps React, imágenes y contenido con IA. Usa GPT-4, Claude y Gemini. Paga en pesos colombianos con Bold.",
    keywords: "IA generativa, crear apps, React, imágenes IA, GPT-4, Claude, Gemini, Colombia",
  },
  pricing: {
    title: "Planes y Precios",
    description: "6 planes flexibles desde $0. Free, Creador, Pro, Agencia, Pyme y Empresarial. Paga en pesos colombianos con Bold.",
    keywords: "precios IA, planes GPT-4, Bold Colombia, créditos IA, suscripción IA",
  },
  auth: {
    title: "Iniciar Sesión",
    description: "Accede a Creator IA Pro. Crea apps, imágenes y texto con IA.",
    noindex: true,
  },
  dashboard: {
    title: "Dashboard",
    description: "Panel de control de Creator IA Pro. Gestiona tus proyectos, créditos y herramientas de IA.",
    noindex: true,
  },
  notFound: {
    title: "Página No Encontrada",
    description: "La página que buscas no existe. Explora Creator IA Pro.",
    noindex: true,
  },
  documentation: {
    title: "Documentación — Genesis IDE",
    description: "Guías técnicas, protocolos y estándares arquitectónicos de Creator IA Pro. Aprende a diseñar, construir y desplegar con la potencia de Genesis.",
    keywords: "documentación, Genesis IDE, API, guía, tutorial, React, Colombia",
  },
  docs: {
    title: "Documentación Neural — Genesis Studio",
    description: "Documentación técnica de Genesis Studio: Neural Cycles, Studio Flow, despliegues cloud y más.",
    keywords: "documentación, Neural Cycles, Genesis Studio, API, Colombia",
  },
  downloads: {
    title: "Descargar Creator IA Pro",
    description: "Accede a Creator IA Pro desde cualquier dispositivo. Web app disponible sin instalación. Compatible con Chrome, Safari, Firefox y Edge.",
    keywords: "descargar, web app, Chrome, Safari, Firefox, Edge, Colombia",
  },
  resetPassword: {
    title: "Restablecer Contraseña",
    description: "Restablece tu contraseña de Creator IA Pro.",
    noindex: true,
  },
  terms: {
    title: "Términos de Servicio",
    description: "Términos y condiciones de uso de Creator IA Pro. Lee nuestras políticas de uso del servicio, pagos, créditos y responsabilidades.",
    keywords: "términos, condiciones, legal, contrato, Creator IA Pro, Colombia",
  },
  privacy: {
    title: "Política de Privacidad",
    description: "Política de privacidad de Creator IA Pro. Conoce cómo protegemos tus datos personales y cumplimos con la legislación colombiana.",
    keywords: "privacidad, datos personales, protección, Ley 1581, Colombia, GDPR",
  },
  security: {
    title: "Seguridad",
    description: "Conoce nuestras medidas de seguridad: encriptación AES-256, autenticación segura, cumplimiento SOC 2 y protección de datos empresarial.",
    keywords: "seguridad, encriptación, AES-256, SOC 2, protección datos, privacidad",
  },
  contact: {
    title: "Contacto",
    description: "Contacta al equipo de Creator IA Pro. Soporte técnico, preguntas sobre planes, o consultas generales. Estamos aquí para ayudarte.",
    keywords: "contacto, soporte, ayuda, Creator IA Pro, Colombia, atención al cliente",
  },
};
