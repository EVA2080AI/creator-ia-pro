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

## 🛡️ Seguridad y Auditoría (Aikido)
Habilita tests de penetración impulsados por IA para identificar vulnerabilidades reales (SQL Injection, XSS, broken auth) antes de salir a producción. Genera reportes de seguridad para SOC 2 e ISO 27001 con un solo clic.

---

> [!TIP]
> **Orquestación Automática**: Simplemente di a Génesis: *"Génesis, integra los pagos con Stripe para este ecommerce"* y él se encargará de activar el conector, crear las tablas de pedidos y desplegar el Edge Function de checkout.
