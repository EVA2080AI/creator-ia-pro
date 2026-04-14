import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from 'sonner';

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
  | 'marketing'
  | 'custom';

export interface GenesisTemplate {
  id: string;
  label: string;
  category: TemplateCategory;
  emoji: string;
  description: string;
  tags: string[];
  complexity: 'basic' | 'medium' | 'advanced';
  prompt: string;
  author?: string;
  version?: string;
  createdAt?: string;
}

export interface GenesisPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  templates: GenesisTemplate[];
  hooks?: {
    onBlueprintGenerate?: string; // Function as string to be eval'd or reference
    onFileGenerate?: string;
    onProjectComplete?: string;
  };
  isActive: boolean;
  isBuiltIn: boolean;
  installDate?: string;
}

export interface PluginRegistry {
  categories: { id: TemplateCategory; label: string; emoji: string; color: string }[];
  templates: GenesisTemplate[];
  plugins: GenesisPlugin[];
  activePluginIds: string[];
}

interface PluginState extends PluginRegistry {
  // Loading State
  isLoading: boolean;
  error: string | null;

  // Actions
  registerPlugin: (plugin: GenesisPlugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  activatePlugin: (pluginId: string) => void;
  deactivatePlugin: (pluginId: string) => void;

  // Template Actions
  addTemplate: (template: GenesisTemplate) => void;
  removeTemplate: (templateId: string) => void;
  getTemplatesByCategory: (category: TemplateCategory) => GenesisTemplate[];
  getTemplateById: (id: string) => GenesisTemplate | undefined;

  // Search & Filter
  searchTemplates: (query: string) => GenesisTemplate[];
  filterByComplexity: (complexity: GenesisTemplate['complexity']) => GenesisTemplate[];
  filterByTags: (tags: string[]) => GenesisTemplate[];

  // Import/Export
  exportPlugin: (pluginId: string) => string;
  importPlugin: (jsonString: string) => GenesisPlugin | null;

  // Initialization
  initializeBuiltInPlugins: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const BUILT_IN_CATEGORIES = [
  { id: 'dashboard' as TemplateCategory, label: 'Dashboards', emoji: '📊', color: 'from-violet-500 to-purple-600' },
  { id: 'seguros' as TemplateCategory, label: 'Aseguradoras', emoji: '🛡️', color: 'from-blue-500 to-cyan-600' },
  { id: 'fintech' as TemplateCategory, label: 'Fintech', emoji: '💰', color: 'from-emerald-500 to-green-600' },
  { id: 'saas' as TemplateCategory, label: 'SaaS / B2B', emoji: '🚀', color: 'from-orange-500 to-red-500' },
  { id: 'ecommerce' as TemplateCategory, label: 'E-Commerce', emoji: '🛍️', color: 'from-pink-500 to-rose-600' },
  { id: 'salud' as TemplateCategory, label: 'Salud / Clínica', emoji: '🏥', color: 'from-teal-500 to-cyan-600' },
  { id: 'legal' as TemplateCategory, label: 'Legal / Firmas', emoji: '⚖️', color: 'from-slate-500 to-zinc-600' },
  { id: 'rrhh' as TemplateCategory, label: 'RRHH / Talento', emoji: '👥', color: 'from-amber-500 to-yellow-600' },
  { id: 'logistica' as TemplateCategory, label: 'Logística', emoji: '📦', color: 'from-indigo-500 to-blue-600' },
  { id: 'marketing' as TemplateCategory, label: 'Marketing', emoji: '📣', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'custom' as TemplateCategory, label: 'Personalizados', emoji: '✨', color: 'from-zinc-500 to-zinc-600' },
];

const BUILT_IN_TEMPLATES: GenesisTemplate[] = [
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
];

const STORAGE_KEY = 'genesis-plugins-registry';

export const usePluginStore = create<PluginState>()(
  devtools(
    (set, get) => ({
      categories: BUILT_IN_CATEGORIES,
      templates: [],
      plugins: [],
      activePluginIds: [],
      isLoading: false,
      error: null,

      initializeBuiltInPlugins: () => {
        const builtInPlugin: GenesisPlugin = {
          id: 'built-in-core',
          name: 'Genesis Core Templates',
          description: 'Templates incorporados de Genesis AI',
          version: '1.0.0',
          author: 'Genesis AI',
          templates: BUILT_IN_TEMPLATES,
          isActive: true,
          isBuiltIn: true,
          installDate: new Date().toISOString(),
        };

        set({
          plugins: [builtInPlugin],
          activePluginIds: ['built-in-core'],
          templates: BUILT_IN_TEMPLATES,
        }, false, 'initializeBuiltInPlugins');
      },

      registerPlugin: (plugin) => {
        set((state) => {
          const exists = state.plugins.find((p) => p.id === plugin.id);
          if (exists) {
            toast.error(`Plugin ${plugin.name} ya está registrado`);
            return state;
          }

          const newPlugins = [...state.plugins, plugin];
          const newTemplates = [...state.templates, ...plugin.templates];

          toast.success(`Plugin ${plugin.name} registrado`);
          return {
            plugins: newPlugins,
            templates: newTemplates,
            activePluginIds: plugin.isActive
              ? [...state.activePluginIds, plugin.id]
              : state.activePluginIds,
          };
        }, false, 'registerPlugin');
      },

      unregisterPlugin: (pluginId) => {
        set((state) => {
          const plugin = state.plugins.find((p) => p.id === pluginId);
          if (!plugin) return state;

          if (plugin.isBuiltIn) {
            toast.error('No puedes eliminar plugins incorporados');
            return state;
          }

          const newPlugins = state.plugins.filter((p) => p.id !== pluginId);
          const newTemplates = state.templates.filter((t) =>
            !plugin.templates.some((pt) => pt.id === t.id)
          );
          const newActiveIds = state.activePluginIds.filter((id) => id !== pluginId);

          toast.success(`Plugin ${plugin.name} eliminado`);
          return {
            plugins: newPlugins,
            templates: newTemplates,
            activePluginIds: newActiveIds,
          };
        }, false, 'unregisterPlugin');
      },

      activatePlugin: (pluginId) => {
        set((state) => {
          const plugin = state.plugins.find((p) => p.id === pluginId);
          if (!plugin) return state;

          const newTemplates = plugin.isActive
            ? state.templates
            : [...state.templates, ...plugin.templates];

          return {
            plugins: state.plugins.map((p) =>
              p.id === pluginId ? { ...p, isActive: true } : p
            ),
            activePluginIds: [...new Set([...state.activePluginIds, pluginId])],
            templates: newTemplates,
          };
        }, false, 'activatePlugin');
      },

      deactivatePlugin: (pluginId) => {
        set((state) => {
          const plugin = state.plugins.find((p) => p.id === pluginId);
          if (!plugin || plugin.isBuiltIn) return state;

          const newTemplates = state.templates.filter((t) =>
            !plugin.templates.some((pt) => pt.id === t.id)
          );

          return {
            plugins: state.plugins.map((p) =>
              p.id === pluginId ? { ...p, isActive: false } : p
            ),
            activePluginIds: state.activePluginIds.filter((id) => id !== pluginId),
            templates: newTemplates,
          };
        }, false, 'deactivatePlugin');
      },

      addTemplate: (template) => {
        set((state) => ({
          templates: [...state.templates, template],
        }), false, 'addTemplate');
      },

      removeTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== templateId),
        }), false, 'removeTemplate');
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter((t) => t.category === category);
      },

      getTemplateById: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      searchTemplates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().templates.filter((t) =>
          t.label.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },

      filterByComplexity: (complexity) => {
        return get().templates.filter((t) => t.complexity === complexity);
      },

      filterByTags: (tags) => {
        return get().templates.filter((t) =>
          tags.some((tag) => t.tags.includes(tag))
        );
      },

      exportPlugin: (pluginId) => {
        const plugin = get().plugins.find((p) => p.id === pluginId);
        if (!plugin) return '';

        const exportData = {
          ...plugin,
          exportDate: new Date().toISOString(),
          genesisVersion: '2.0',
        };

        return JSON.stringify(exportData, null, 2);
      },

      importPlugin: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);

          // Validation
          if (!data.id || !data.name || !Array.isArray(data.templates)) {
            toast.error('Formato de plugin inválido');
            return null;
          }

          const plugin: GenesisPlugin = {
            ...data,
            isActive: true,
            isBuiltIn: false,
            installDate: new Date().toISOString(),
          };

          get().registerPlugin(plugin);
          return plugin;
        } catch (err) {
          toast.error('Error al importar plugin');
          return null;
        }
      },

      loadFromStorage: () => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const data = JSON.parse(stored);
            set({
              plugins: data.plugins || [],
              activePluginIds: data.activePluginIds || [],
            }, false, 'loadFromStorage');
          }
        } catch (err) {
          console.error('Error loading plugins from storage:', err);
        }
      },

      saveToStorage: () => {
        try {
          const { plugins, activePluginIds } = get();
          const customPlugins = plugins.filter((p) => !p.isBuiltIn);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            plugins: customPlugins,
            activePluginIds,
          }));
        } catch (err) {
          console.error('Error saving plugins to storage:', err);
        }
      },
    }),
    { name: 'genesis-plugin-store' }
  )
);

// Auto-initialize on import
if (typeof window !== 'undefined') {
  const store = usePluginStore.getState();
  store.initializeBuiltInPlugins();
  store.loadFromStorage();

  // Auto-save on changes
  let unsubscribe: (() => void) | undefined;

  // Defer subscription to avoid circular dependency during initialization
  setTimeout(() => {
    unsubscribe = usePluginStore.subscribe((state) => {
      state.saveToStorage();
    });
  }, 0);
}
