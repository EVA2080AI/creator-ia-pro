# Creator IA Pro — Integraciones Industriales (v19.0)

Bienvenido al ecosistema de integración de **Génesis v19**. Creator IA Pro no solo genera código; orquestra soluciones completas conectando tu proyecto con servicios de élite, pasarelas de pago y automatizaciones avanzadas.

## 🔗 Conectores Compartidos (Shared Connectors)
Los Conectores Compartidos añaden capacidades de tiempo de ejecución a tu aplicación publicada. Génesis gestiona la infraestructura de estos conectores para que tú solo te concentres en la lógica.

| Servicio | Capacidad | Uso Principal |
| :--- | :--- | :--- |
| **Genesis Cloud** | Backend | Base de datos, Auth y Almacenamiento (Supabase native). |
| **Genesis AI** | Inteligencia | Resúmenes, Chatbots y análisis de documentos integrados. |
| **Stripe** | Pagos | Suscripciones y cobros únicos (Módulo Managed). |
| **Resend** | Email | Envío de correos transaccionales y marketing. |
| **ElevenLabs** | Voz | Generación de audio y Text-to-Speech de alta calidad. |
| **Slack / Telegram** | Alertas | Notificaciones de eventos y bots de interacción. |
| **Firecrawl** | Scraping | Extracción de datos estructurados de cualquier sitio web. |
| **Shopify** | Ecommerce | Gestión de tiendas, productos y pedidos. |
| **AWS S3** | Storage | Almacenamiento masivo de archivos en buckets de Amazon. |
| **Contentful** | CMS | Gestión de contenido headless para aplicaciones dinámicas. |
| **Perplexity** | Research | Búsqueda en tiempo real con citas verificables. |

### 🛠️ Configuración Gateway
La autenticación se maneja automáticamente. Una vez que conectas un servicio en **Configuración → Conectores**, Génesis inyecta de forma segura los secretos en tus Edge Functions sin exponerlos en el frontend.

---

## 🧠 Conectores Personales (MCP Servers)
Usa datos reales de tus herramientas de gestión como contexto para que Génesis cree aplicaciones más inteligentes.

- **GitHub/GitLab**: Sincroniza y colabora en el código fuente directamente.
- **Linear / Jira**: Importa tickets y especificaciones para generar funcionalidades.
- **Notion**: Referencia documentos y bases de conocimiento para guiar el comportamiento de tu app.
- **PostHog / Amplitude**: Usa analíticas de producto para informar nuevas iteraciones.

---

## 🏗️ Integración de APIs Personalizadas
Génesis puede integrar cualquier API externa siguiendo este flujo:

1. **APIs sin Auth**: Llamadas directas desde el frontend (ej: Chuck Norris API).
2. **APIs Autenticadas**: Génesis crea automáticamente una **Edge Function** en Supabase para proteger tu API Key y evitar que se filtre en el navegador.

### 🔐 Gestión de Secretos
Añade tus llaves en la pestaña **Cloud → Secretos**. Estos valores se inyectan encriptados en el entorno de ejecución de tus funciones.

---

## 🛡️ Seguridad, Analíticas y Auditoría
Génesis v19.0 proporciona visibilidad total sobre tu proyecto:
- **Pentesting Proactivo (Aikido)**: Habilita tests de penetración impulsados por IA para identificar vulnerabilidades reales (SQL Injection, XSS, broken auth) antes de salir a producción.
- **Project Analytics**: Monitorización en tiempo real de tráfico, visitantes únicos y comportamiento de usuario (Dashboard nativo).
- **Audit Logs**: Registro inmutable de todos los cambios en el código y la infraestructura para cumplimiento SOC2/ISO27001.

### 🔐 Gestión de Entornos (Test vs Live)
Génesis permite separar entornos de datos de forma segura:
- **Entorno Test**: Infraestructura de pruebas con datos ficticios.
- **Entorno Live**: Configuración de producción para usuarios reales.
Pasa tus proyectos de Test a Live con validación de seguridad de un solo clic.

---

---

## ⚡ Manual de Prompting: El "Playbook" de Génesis (v19.5)

Este manual define las estrategias de élite para obtener resultados excepcionales y consistentes. Utiliza estas tácticas para transformar ideas vagas en interfaces pulidas.

### Fase 1: Sentar los Cimientos
1.  **Planifica antes de pedir**: Define el Producto, el Usuario (Persona) y la Acción Clave (CTA). No construyas a ciegas.
2.  **Mapa de Viaje Visual**: Piensa en transiciones (Héroe → Trust → Confianza → Acción). Cada sección debe tener un propósito.
3.  **Diseño primero**: Establece el lenguaje visual (Minimal, Premium, Disruptivo) antes de la lógica. "No se llega al buen diseño pidiendo; se diseña desde el prompt".

### Fase 2: Pensamiento Sistémico
4.  **Prompts por Componente**: No pidas una página entera. Construye por bloques (Lego style). Un prompt por componente = máxima señal, mínimo ruido.
5.  **Diseño con Contenido Real**: Evita el "Lorem Ipsum". El contenido real define los límites del diseño (espaciado, jerarquía).
6.  **Vocabulario Atómico**: Habla en "átomos" (Botones, Cards, Modales, Badges). Genesis piensa en estructuras nativas.
7.  **Palabras Clave (Buzzwords)**: Usa términos como `glassmorphism`, `cinematic`, `expressive` o `premium` para guiar la estética.

### Fase 3: Construcción con Precisión
8.  **Patrones de Layout**: Usa estructuras repetibles (Héroe → Cards → Footer). Crea tu propia librería de patrones.
9.  **Visuales vía URL**: Incluye demos de producto o clips de Midjourney mediante URLs directas para realismo instantáneo.
10. **Edición por Capas (Edit Button)**: Usa la función de edición para realizar ajustes quirúrgicos sin destruir lo que ya funciona. Trata las ediciones como "overrides" de diseño.

### Fase 4: Iteración y Despliegue
11. **Diseño Consciente de Cloud**: Anticipa la lógica de autenticación (Auth) y datos dinámicos. ¿Qué ve el usuario si está logueado? ¿Qué pasa si no hay datos?
12. **Control de Versiones Humano**: No confíes solo en el autoguardado. Piensa en hitos. Duplica versiones antes de cambios críticos.

> [!IMPORTANT]
> **Preguntas Aclaratorias**: Siempre pide a Génesis que te haga preguntas antes de empezar un plan complejo. Especialmente en **Plan Mode**. De esta forma, Génesis llenará los vacíos antes de escribir código.

---

> [!TIP]
> **Sincronización de Esquema**: Cada vez que inicies una sesión, Génesis validará tu esquema de base de datos para asegurar que no haya cambios que rompan la aplicación actual.
