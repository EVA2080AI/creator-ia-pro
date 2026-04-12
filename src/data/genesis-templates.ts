/**
 * Genesis Architecture Templates
 * Pre-built, business-ready architecture prompts categorized by industry and complexity.
 * Each template generates a complete, production-ready React + TypeScript app.
 */

export interface GenesisTemplate {
  id: string;
  label: string;
  category: TemplateCategory;
  emoji: string;
  description: string;
  tags: string[];
  complexity: 'basic' | 'medium' | 'advanced';
  prompt: string;
}

export type TemplateCategory =
  | 'dashboard'
  | 'seguros'
  | 'fintech'
  | 'saas'
  | 'ecommerce'
  | 'salud'
  | 'legal'
  | 'rrhh'
  | 'logistica'
  | 'marketing';

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; emoji: string; color: string }[] = [
  { id: 'dashboard',  label: 'Dashboards',    emoji: '📊', color: 'from-violet-500 to-purple-600' },
  { id: 'seguros',    label: 'Aseguradoras',  emoji: '🛡️', color: 'from-blue-500 to-cyan-600' },
  { id: 'fintech',    label: 'Fintech',        emoji: '💰', color: 'from-emerald-500 to-green-600' },
  { id: 'saas',       label: 'SaaS / B2B',    emoji: '🚀', color: 'from-orange-500 to-red-500' },
  { id: 'ecommerce',  label: 'E-Commerce',     emoji: '🛍️', color: 'from-pink-500 to-rose-600' },
  { id: 'salud',      label: 'Salud / Clínica',emoji: '🏥', color: 'from-teal-500 to-cyan-600' },
  { id: 'legal',      label: 'Legal / Firmas', emoji: '⚖️', color: 'from-slate-500 to-zinc-600' },
  { id: 'rrhh',       label: 'RRHH / Talento', emoji: '👥', color: 'from-amber-500 to-yellow-600' },
  { id: 'logistica',  label: 'Logística',      emoji: '📦', color: 'from-indigo-500 to-blue-600' },
  { id: 'marketing',  label: 'Marketing',      emoji: '📣', color: 'from-fuchsia-500 to-pink-600' },
];

export const GENESIS_TEMPLATES: GenesisTemplate[] = [

  // ───────────────────────────────────────────────────────────
  // DASHBOARDS
  // ───────────────────────────────────────────────────────────
  {
    id: 'dashboard-ejecutivo',
    label: 'Dashboard Ejecutivo',
    category: 'dashboard',
    emoji: '📊',
    description: 'KPIs, gráficas y reportes para la alta gerencia',
    tags: ['kpi', 'reportes', 'recharts', 'dark mode'],
    complexity: 'medium',
    prompt: `Crea un Dashboard Ejecutivo completo para alta gerencia en React + TypeScript + Tailwind CSS. 
    
    Incluye:
    - Header con logo, nombre de empresa, fecha y menú de usuario con avatar
    - 4 tarjetas KPI (Ingresos del mes, Clientes activos, Tasa de conversión, NPS) con tendencia (flecha arriba/abajo y porcentaje vs mes anterior)
    - Gráfica de área animada de ingresos (últimos 12 meses) usando Recharts
    - Gráfica de barras horizontales de ventas por canal (Online, Agencias, Directo)
    - Tabla de transacciones recientes con filtro por estado (Aprobado/Pendiente/Rechazado) y paginación
    - Panel lateral derecho con actividad reciente y alertas del sistema
    - Modo oscuro elegante con gradientes sutiles, colores zinc-900/950
    - Sidebar de navegación colapsable con iconos y tooltips
    Usa datos simulados realistas (con números en COP colombianos). Diseño premium tipo Notion/Linear.`,
  },
  {
    id: 'dashboard-operacional',
    label: 'Ops Center',
    category: 'dashboard',
    emoji: '🖥️',
    description: 'Centro de operaciones en tiempo real con alertas',
    tags: ['tiempo real', 'alertas', 'mapa', 'monitoreo'],
    complexity: 'advanced',
    prompt: `Crea un Centro de Operaciones (Ops Center) en tiempo real en React + TypeScript + Tailwind CSS.

    Incluye:
    - Topbar con estado del sistema (todos los servicios en verde/rojo/amarillo), hora de actualización y botón "Actualizar"
    - Grid de 6 métricas en tiempo real: Uptime, Latencia, Requests/min, Errores, Usuarios activos, CPU uso (con barras de progreso animadas)
    - Panel de alertas críticas con prioridad alta/media/baja, botón "Reconocer" y timestamp
    - Log de eventos con scroll infinito, filtros por severidad (INFO/WARN/ERROR/CRITICAL) y búsqueda
    - Mini mapa de heat bubbles que simula carga geográfica (div con burbujas animadas por región)
    - Indicador de salud por microservicio (Auth, API, DB, Cache, Queue) con semáforos
    - Modo oscuro con fondo casi negro (zinc-950), acentos verdes para estado OK, rojos para fallas
    Simula actualizaciones automáticas con setInterval cada 3 segundos para las métricas.`,
  },

  // ───────────────────────────────────────────────────────────
  // ASEGURADORAS
  // ───────────────────────────────────────────────────────────
  {
    id: 'seguros-portal-agente',
    label: 'Portal del Agente',
    category: 'seguros',
    emoji: '🛡️',
    description: 'Gestión de pólizas y clientes para agentes de seguros',
    tags: ['pólizas', 'clientes', 'siniestros', 'CRM'],
    complexity: 'advanced',
    prompt: `Crea un Portal Web para Agentes de Seguros en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard con: pólizas vigentes, pólizas por vencer (próximos 30 días), siniestros en trámite, comisiones del mes
    - Módulo de Clientes: tabla con nombre, cédula, pólizas activas, fecha renovación, botones "Ver detalle" y "Renovar"
    - Vista de Póliza individual: cobertura, suma asegurada, deducible, beneficiarios, historial de pagos
    - Módulo de Siniestros: formulario de reporte (fecha, tipo, descripción, documentos adjuntos), tabla de seguimiento con estados (Reportado → En revisión → Aprobado/Rechazado)
    - Calculadora de primas básica (seleccionar tipo de seguro, edad, cobertura → ver prima mensual estimada)
    - Generador de cotización en PDF (simulado con window.print())
    - Sidebar con secciones: Clientes, Pólizas, Siniestros, Cotizaciones, Reportes, Configuración
    - Diseño corporativo azul/blanco, tipografía profesional, muy limpio.
    Usa datos colombianos simulados. Montos en COP.`,
  },
  {
    id: 'seguros-self-service',
    label: 'Portal Cliente Seguros',
    category: 'seguros',
    emoji: '📋',
    description: 'Self-service para asegurados: pólizas y reclamaciones',
    tags: ['autogestión', 'pólizas', 'pagos', 'siniestros'],
    complexity: 'medium',
    prompt: `Crea un Portal de AutoServicio para Asegurados (clientes de seguros) en React + TypeScript + Tailwind CSS.

    Incluye:
    - Pantalla de bienvenida con nombre del asegurado, resumen de coberturas y próximo pago
    - Mis Pólizas: cards para cada póliza (Vida, Vehículo, Hogar) con estado activa/vencida, vigencia, suma asegurada y botón "Ver détalle"
    - Mis Pagos: historial de pagos con fecha, monto, estado y botón "Descargar recibo"
    - Reportar Siniestro: formulario multi-paso (Paso 1: tipo de siniestro, Paso 2: descripción + fecha + lugar, Paso 3: documentos, Paso 4: confirmación)
    - Mis Beneficiarios: lista editable con nombre, parentesco, porcentaje
    - Solicitar Certificado de Vigencia (simulado con descarga)
    - Chat de soporte integrado (bubble icon flotante con respuestas simuladas)
    - Diseño mobile-first, colores azul corporativo y blanco, muy fácil de entender para el usuario final.`,
  },

  // ───────────────────────────────────────────────────────────
  // FINTECH
  // ───────────────────────────────────────────────────────────
  {
    id: 'fintech-wallet',
    label: 'Billetera Digital',
    category: 'fintech',
    emoji: '💳',
    description: 'Wallet con saldo, transferencias y movimientos',
    tags: ['wallet', 'transferencias', 'QR', 'fintech'],
    complexity: 'advanced',
    prompt: `Crea una aplicación de Billetera Digital (Fintech Wallet) en React + TypeScript + Tailwind CSS, diseño mobile-first.

    Incluye:
    - Pantalla principal: balance total con opción de "ocultar saldo", quick actions (Recargar, Transferir, Pagar, Solicitar)
    - Historial de movimientos con categorías (Transferencia, Recarga, Pago servicios, Retiro), monto, fecha, estado y ícono de categoría
    - Flujo de Transferencia: buscar contacto por nombre/celular, ingresar monto y nota, confirmar con código PIN (4 dígitos)
    - Pago de facturas: seleccionar empresa (electrónica, agua, gas, telefonía), ingresar referencia, monto y pagar
    - Código QR para recibir pagos (mostrar QR falso con el número de cuenta)
    - Perfil con foto, nombre, número de cuenta, límites de transacción
    - Notificaciones push simuladas con toast alerts
    - Uso de colores vibrantes estilo Nequi/Nubank: fondo oscuro, acentos morados/fucsia, tarjetas neomórficas.`,
  },
  {
    id: 'fintech-prestamos',
    label: 'Gestión de Préstamos',
    category: 'fintech',
    emoji: '🏦',
    description: 'Originación, aprobación y seguimiento de créditos',
    tags: ['crédito', 'préstamos', 'scoring', 'cobranza'],
    complexity: 'advanced',
    prompt: `Crea un Sistema de Gestión de Préstamos (Loan Management System) en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard de Analista: resumen de solicitudes del día, monto total en cartera, tasa de mora, préstamos por aprobar
    - Tabla de solicitudes de crédito con: nombre del solicitante, monto solicitado, plazo, score crediticio (gauge visual), estado (En análisis/Aprobado/Rechazado/Desembolsado)
    - Vista de solicitud individual: datos personales, ingresos, deudas actuales, historial con otras entidades, documentos adjuntos, score detallado
    - Motor de scoring visual: barras de progreso para capacidad de pago, historial crediticio, estabilidad laboral, reconocimiento de identidad
    - Calculadora de crédito: monto + plazo + tasa → tabla de amortización (cuota mensual, capital, intereses, saldo)
    - Módulo de Cobranza: clientes en mora con días de atraso, monto adeudado, acciones (Llamar, Enviar email, Marcar como compromiso de pago)
    - Diseño serio y corporativo: blanco, azul marino y verde para aprobados, rojo para rechazados.`,
  },

  // ───────────────────────────────────────────────────────────
  // SaaS / B2B
  // ───────────────────────────────────────────────────────────
  {
    id: 'saas-admin-panel',
    label: 'Admin SaaS Multi-tenant',
    category: 'saas',
    emoji: '⚙️',
    description: 'Panel de administración para plataformas SaaS',
    tags: ['multi-tenant', 'usuarios', 'suscripciones', 'métricas'],
    complexity: 'advanced',
    prompt: `Crea un Panel de Administración para una Plataforma SaaS Multi-tenant en React + TypeScript + Tailwind CSS.

    Incluye:
    - Sidebar con secciones: Overview, Tenants, Usuarios, Suscripciones, Facturación, Configuración, Soporte, Logs
    - Overview: MRR (Monthly Recurring Revenue), ARR, Churn Rate, usuarios activos hoy, nuevos tenants esta semana — todos con mini spark-lines
    - Gestión de Tenants: tabla searchable con nombre empresa, plan, usuarios, storage usado, fecha de inicio, estado, acciones (Suspender, Ver detalles, Impersonar)
    - Vista de Tenant: detalle completo — usuarios, módulos activos, uso de API calls, historial de facturación, logs de actividad
    - Gestión de Planes: crear/editar planes (Starter, Growth, Enterprise) con precio, límites de usuarios, features incluidas con checkboxes
    - Gestión de Suscripciones: próximas renovaciones, suscripciones canceladas este mes, intentos de cobro fallidos
    - Módulo de Soporte: tickets abiertos, tiempo promedio respuesta, cola de soporte asignada por agente
    - Diseño oscuro tipo Stripe Dashboard, muy detallado y profesional.`,
  },
  {
    id: 'saas-onboarding',
    label: 'Onboarding SaaS',
    category: 'saas',
    emoji: '🚀',
    description: 'Flujo de onboarding guiado para nuevos usuarios SaaS',
    tags: ['onboarding', 'wizard', 'checklist', 'UX'],
    complexity: 'medium',
    prompt: `Crea un Flujo de Onboarding para un Producto SaaS en React + TypeScript + Tailwind CSS.

    Incluye:
    - Pantalla de bienvenida con video placeholder, nombre del usuario y botón "Comenzar configuración"
    - Wizard de 5 pasos con barra de progreso superior:
      1. Perfil de empresa (nombre, industria, tamaño, logo upload)
      2. Invitar equipo (agregar emails, asignar roles — Admin/Editor/Viewer)
      3. Conectar integraciones (Slack, Google Workspace, Zapier — con toggle on/off y estado conectado)
      4. Crear primer workspace/proyecto con plantilla (elegir entre 4 opciones con preview)
      5. Tour interactivo (overlay con highlights sobre los elementos del UI real)
    - Checklist de activación (sidebar): 8 tareas de onboarding con checkbox y % de completitud
    - Tooltips de ayuda contextual en cada campo
    - Botones "Saltar este paso" y "Hacer esto después"
    - Pantalla de éxito final con confetti (canvas-confetti) y CTA a la app
    - Diseño moderno, colores brand personalizables mediante variables CSS.`,
  },

  // ───────────────────────────────────────────────────────────
  // E-COMMERCE
  // ───────────────────────────────────────────────────────────
  {
    id: 'ecommerce-admin',
    label: 'Admin Tienda Virtual',
    category: 'ecommerce',
    emoji: '🏪',
    description: 'Backoffice para gestión de productos, pedidos y reportes',
    tags: ['productos', 'pedidos', 'inventario', 'reportes'],
    complexity: 'advanced',
    prompt: `Crea el Panel de Administración de una Tienda de E-commerce en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard: ventas del día (vs ayer), pedidos pendientes, productos sin stock, ingresos de la semana con gráfica de barras
    - Gestión de Productos: tabla con imagen, nombre, SKU, precio, stock, categoría, estado (activo/inactivo), botones Editar/Archivar
    - Formulario de Producto: nombre, descripción (editor de texto simple), precio, precio tachado, stock, categoría, imágenes (hasta 5 con preview), variantes (talla/color) 
    - Gestión de Pedidos: tabla con número de pedido, cliente, items, total, estado (Pendiente/Empacando/Enviado/Entregado), fecha. Clic abre detalle del pedido
    - Vista de Pedido: resumen del cliente, items comprados, dirección de entrega, timeline de estados, notas del vendedor
    - Inventario: alertas de productos con stock < 5, reordenamiento sugerido, historial de entradas y salidas
    - Reportes: ventas por categoría (gráfica pastel), top 10 productos más vendidos, ingresos diarios del mes
    - Gestión de Clientes: tabla, vista de perfil con historial de compras
    Diseño limpio, blanco, muy organizado. Datos en COP colombianos.`,
  },

  // ───────────────────────────────────────────────────────────
  // SALUD
  // ───────────────────────────────────────────────────────────
  {
    id: 'salud-clinica-hms',
    label: 'Sistema Clínico (HMS)',
    category: 'salud',
    emoji: '🏥',
    description: 'Historia clínica, citas y consultas médicas',
    tags: ['EMR', 'citas', 'historia clínica', 'médicos'],
    complexity: 'advanced',
    prompt: `Crea un Sistema de Gestión Hospitalaria / Clínica (HMS) en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard: pacientes del día, citas por doctor, camas disponibles (si aplica), alertas médicas, guardia activa
    - Agenda de Citas: vista calendario semanal con citas por franjas horarias, color por especialidad, estado (Confirmada/Asistió/No asistió/Cancelada)
    - Módulo de Pacientes: buscar por nombre/cédula, ficha del paciente con datos demográficos, alergias, grupo sanguíneo
    - Historia Clínica (EMR): acordeones por consulta — fecha, motivo de consulta, examen físico, diagnóstico CIE-10, plan de tratamiento, fórmula médica
    - Ordenamiento de exámenes: seleccionar exámenes de laboratorio, imágenes diagnósticas — con estado (Ordenado/Resultado disponible)
    - Resultados de laboratorio: tabla de valores con rangos de referencia y alertas visuales (rojo si fuera de rango)
    - Módulo de Facturación: servicios prestados → CUFE, copago del paciente, cuenta de cobro al asegurador
    - Diseño blanco/azul médico, muy limpio, tipografía legible, accesible.`,
  },

  // ───────────────────────────────────────────────────────────
  // LEGAL
  // ───────────────────────────────────────────────────────────
  {
    id: 'legal-firma-casos',
    label: 'Firma Legal — Casos',
    category: 'legal',
    emoji: '⚖️',
    description: 'Gestión de casos, clientes y horas facturables',
    tags: ['casos', 'clientes', 'honorarios', 'documentos'],
    complexity: 'medium',
    prompt: `Crea un Sistema de Gestión para una Firma de Abogados en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard: casos activos por abogado, horas facturables de la semana, audiencias próximas (próximos 7 días), alertas de vencimientos
    - Módulo de Casos: tabla con número de caso, cliente, tipo (Civil/Penal/Laboral/Familia/Comercial), abogado asignado, estado (Activo/Cerrado/Suspendido), próxima actuación
    - Vista de Caso: partes involucradas, resumen del caso, timeline de actuaciones procesales, documentos adjuntos (contratos, demandas, autos), registro de horas
    - Agenda Judicial: calendario de audiencias y vencimientos de términos, con alertas 3 días antes
    - Módulo de Clientes: ficha de cliente, casos asociados, datos de contacto, historial de facturación
    - Registro de Tiempo: cronómetro para medir horas por tarea, categorías (Estudio, Redacción, Audiencia, Reunión), vinculación a caso
    - Facturación: generar cuenta de cobro basada en horas registradas × tarifa/hora, estado de pago
    - Diseño sobrio, navy + dorado/beige, muy profesional.`,
  },

  // ───────────────────────────────────────────────────────────
  // RRHH
  // ───────────────────────────────────────────────────────────
  {
    id: 'rrhh-hrms',
    label: 'HRMS — Gestión de Talento',
    category: 'rrhh',
    emoji: '👥',
    description: 'Nómina, vacaciones, desempeño y organigrama',
    tags: ['nómina', 'empleados', 'desempeño', 'vacaciones'],
    complexity: 'advanced',
    prompt: `Crea un Sistema de Gestión de Recursos Humanos (HRMS) en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard de RRHH: headcount total, nuevos ingresos del mes, retiros, ausentismo, vacantes abiertas, cumpleaños de hoy
    - Directorio de empleados: foto, nombre, cargo, área, email, teléfono, filtros por área/cargo/estado. Clic abre hoja de vida
    - Perfil de empleado: datos personales, información laboral (cargo, área, fecha ingreso, tipo contrato, salario), documentos (cédula, contrato, diplomas)
    - Módulo de Vacaciones: solicitar vacaciones (seleccionar fechas con calendario), ver saldo de días disponibles, historial de vacaciones, flujo de aprobación del jefe
    - Gestión de Nómina: tabla de empleados con salario base, horas extras, deducciones (salud/pensión), bonos, neto a pagar — con botón "Generar volante"
    - Evaluaciones de Desempeño: formulario 360° (autoevaluación + evaluación del jefe), indicadores por competencia con sliders, historial de evaluaciones
    - Organigrama visual: árbol jerárquico con fotos y cargos (usando CSS flexbox)
    - Reclutamiento: pipeline de candidatos por vacante (Kanban: Postulado/Revisión CV/Entrevista/Oferta/Contratado)
    - Diseño teal/blanco, muy estructurado, amigable.`,
  },

  // ───────────────────────────────────────────────────────────
  // LOGISTICA
  // ───────────────────────────────────────────────────────────
  {
    id: 'logistica-tracking',
    label: 'Tracking de Envíos',
    category: 'logistica',
    emoji: '📦',
    description: 'Seguimiento de pedidos, rutas y mensajeros',
    tags: ['tracking', 'envíos', 'mensajeros', 'rutas'],
    complexity: 'advanced',
    prompt: `Crea un Sistema de Tracking y Logística de Envíos en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard Operaciones: pedidos en tránsito, entregados hoy, pendientes de recolección, devoluciones, tiempo promedio de entrega
    - Mapa de operaciones visual (simulado con CSS grid de una ciudad, con puntos que representan mensajeros y paquetes en ruta)
    - Tabla de guías/envíos: número de guía, remitente, destinatario, ciudad origen-destino, peso, estado, mensajero asignado, fecha estimada entrega
    - Vista de Guía: timeline visual del envío (Recolectado → Centro de distribución → En ruta → Entregado) con hora en cada etapa y foto de evidencia (placeholder)
    - Asignación de rutas: asignar mensajeros a zonas, ver carga de trabajo por mensajero, optimización sugerida
    - Módulo de Mensajeros: lista de mensajeros activos, capacidad, ubicación actual, pedidos del día, historial de entregas
    - Gestión de Devoluciones: motivo de no entrega, reagendar, devolver al remitente
    - Notificaciones automáticas: cuando un paquete cambia de estado (simulado con toasts)
    - Diseño naranja/blanco estilo operacional, muy visual y de datos densos.`,
  },

  // ───────────────────────────────────────────────────────────
  // MARKETING
  // ───────────────────────────────────────────────────────────
  {
    id: 'marketing-crm',
    label: 'CRM de Ventas',
    category: 'marketing',
    emoji: '🎯',
    description: 'Pipeline de ventas, leads y seguimiento comercial',
    tags: ['CRM', 'leads', 'pipeline', 'ventas'],
    complexity: 'advanced',
    prompt: `Crea un CRM de Ventas (Customer Relationship Management) en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard de Ventas: meta del mes con gauge visual, oportunidades calientes, tasa de cierre, actividades pendientes del día
    - Pipeline Kanban: columnas (Prospecto → Calificado → Demo agendada → Propuesta enviada → Negociación → Cerrado Ganado/Perdido) con drag-like visual (sin librería drag extra, usar botones "Mover")
    - Vista de Oportunidad: empresa, contacto, valor estimado, probabilidad de cierre (slider 0-100%), actividades relacionadas (llamadas, emails, reuniones), notas, documentos adjuntos
    - Módulo de Contactos/Empresas: tabla de leads con nombre, empresa, cargo, email, teléfono, fuente de adquisición, etapa CRM, última interacción
    - Registro de Actividades: agendar llamada/reunión/email, registrar resultado, notas de la interacción, próximo paso
    - Reportes: ventas por vendedor (barras), fuentes de leads (pastel), pipeline por etapa (funnel visual CSS)
    - Metas comerciales: meta trimestral con barra de progreso por vendedor
    - Diseño vibrante estilo HubSpot/Pipedrive, azul y verde, sidebar compacto.`,
  },
  {
    id: 'marketing-campanas',
    label: 'Gestor de Campañas',
    category: 'marketing',
    emoji: '📣',
    description: 'Planifica, ejecuta y mide campañas de marketing digital',
    tags: ['campañas', 'email', 'redes sociales', 'analytics'],
    complexity: 'medium',
    prompt: `Crea un Gestor de Campañas de Marketing Digital en React + TypeScript + Tailwind CSS.

    Incluye:
    - Dashboard: campañas activas, alcance total, engagement rate, conversiones, gasto vs presupuesto, ROI general
    - Listado de Campañas: nombre, canal (Email/Instagram/Facebook/Google Ads/TikTok), estado (Borrador/Activa/Pausada/Finalizada), presupuesto, impresiones, clics, conversiones, CPC, ROAS
    - Creador de Campaña: formulario multi-paso — Nombre y objetivo, Canal y audiencia objetivo, Creativos (upload imagen placeholder + copy del anuncio), Presupuesto y duración, Revisión + Lanzar
    - Vista de Campaña: métricas detalladas con gráficas de línea (impresiones y conversiones diarias), desglose por variante A/B
    - Módulo de Contenido: calendario de publicaciones (vista mensual), crear post con imagen, texto, hashtags, programar fecha/hora
    - Audiencias guardadas: segmentos con criterios (edad, ciudad, intereses) reutilizables en campañas
    - Reporte downloadable: resumen de campaña en tabla lista para imprimir (window.print())
    - Diseño colorido y dinámico, gradientes fucsia/naranja, muy visual y moderno.`,
  },
];
