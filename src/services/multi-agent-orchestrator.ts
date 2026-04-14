import { aiService, MODEL_COSTS } from './ai-service';
import { aiCache } from './ai-cache';

export type AgentRole = 'conductor' | 'architect' | 'ux_designer' | 'frontend_dev' | 'backend_dev' | 'qa_engineer';

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  cost: number;
  capabilities: string[];
  maxTokens: number;
}

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'user' | 'all';
  content: string;
  type: 'request' | 'response' | 'delegate' | 'review';
  timestamp: number;
  attachments?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedTo: AgentRole;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  output?: any;
  startedAt?: number;
  completedAt?: number;
}

export interface OrchestrationResult {
  blueprint: ProjectBlueprint;
  tasks: AgentTask[];
  messages: AgentMessage[];
  totalCost: number;
  duration: number;
}

export interface ProjectBlueprint {
  projectName: string;
  description: string;
  niche: string;
  architecture: {
    pattern: string;
    frontend: string;
    backend?: string;
    database?: string;
  };
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  pages: Array<{
    name: string;
    slug: string;
    purpose: string;
    components: string[];
    layout: string;
  }>;
  sharedComponents: Array<{
    name: string;
    role: string;
  }>;
  techStack: {
    framework: string;
    deps: string[];
    devDeps: string[];
  };
  fileStructure: Record<string, string>;
}

// Agent Definitions
const AGENTS: Record<AgentRole, Agent> = {
  conductor: {
    id: 'conductor',
    role: 'conductor',
    name: 'Genesis Conductor',
    description: 'Orquesta la comunicación entre agentes y coordina el flujo de trabajo',
    model: 'google/gemini-2.5-pro-preview-03-25',
    cost: 3,
    capabilities: ['orchestration', 'planning', 'coordination'],
    maxTokens: 4096,
    systemPrompt: `Eres Genesis Conductor, el coordinador maestro de un equipo de IA especializada.
Tu trabajo es:
1. Analizar requerimientos del usuario
2. Descomponer el trabajo en tareas especializadas
3. Delegar a los agentes correctos
4. Sincronizar resultados entre agentes
5. Entregar un producto coherente y completo

Habla en español. Sé conciso y directo.`,
  },
  architect: {
    id: 'architect',
    role: 'architect',
    name: 'System Architect',
    description: 'Diseña la arquitectura del sistema, estructura de archivos y decisiones técnicas',
    model: 'google/gemini-2.5-pro-preview-03-25',
    cost: 3,
    capabilities: ['system_design', 'architecture', 'tech_decisions'],
    maxTokens: 4096,
    systemPrompt: `Eres un Arquitecto de Software Senior con 20 años de experiencia.
Tu especialidad es diseñar sistemas escalables, mantenibles y bien estructurados.

Entregables:
- Arquitectura del sistema
- Estructura de archivos y carpetas
- Stack tecnológico justificado
- Patrones de diseño recomendados
- Consideraciones de escalabilidad

Responde SOLO con JSON válido.`,
  },
  ux_designer: {
    id: 'ux_designer',
    role: 'ux_designer',
    name: 'UX Designer',
    description: 'Diseña la experiencia de usuario, flujos, wireframes y especificaciones visuales',
    model: 'anthropic/claude-3.5-sonnet',
    cost: 5,
    capabilities: ['ux_design', 'user_flows', 'wireframes', 'accessibility'],
    maxTokens: 4096,
    systemPrompt: `Eres un Diseñador UX Senior especializado en crear experiencias intuitivas.

Entregables:
- Flujos de usuario
- Wireframes descriptivos
- Especificaciones de interacción
- Paleta de colores y tipografía
- Consideraciones de accesibilidad

Sé creativo pero práctico.`,
  },
  frontend_dev: {
    id: 'frontend_dev',
    role: 'frontend_dev',
    name: 'Frontend Developer',
    description: 'Implementa componentes React, estilos y lógica de UI',
    model: 'google/gemini-2.5-pro-preview-03-25',
    cost: 3,
    capabilities: ['react', 'typescript', 'tailwind', 'animations'],
    maxTokens: 8192,
    systemPrompt: `Eres un Frontend Developer experto en React, TypeScript y Tailwind CSS.
Genera código de producción listo, no placeholders.

Reglas:
- Componentes funcionales con hooks
- TypeScript estricto
- Tailwind para estilos
- Framer Motion para animaciones
- Código limpio y documentado
- CERO comentarios "TODO" o placeholders

Entrega archivos completos y funcionales.`,
  },
  backend_dev: {
    id: 'backend_dev',
    role: 'backend_dev',
    name: 'Backend Developer',
    description: 'Implementa APIs, lógica de servidor y base de datos',
    model: 'anthropic/claude-3.5-sonnet',
    cost: 5,
    capabilities: ['api_design', 'database', 'supabase', 'security'],
    maxTokens: 4096,
    systemPrompt: `Eres un Backend Developer especializado en Supabase y APIs REST.

Entregables:
- Esquema de base de datos
- APIs RESTful
- Políticas de seguridad (RLS)
- Edge Functions si aplica
- Documentación de endpoints

Prioriza seguridad y performance.`,
  },
  qa_engineer: {
    id: 'qa_engineer',
    role: 'qa_engineer',
    name: 'QA Engineer',
    description: 'Revisa calidad, detecta errores y sugiere mejoras',
    model: 'google/gemini-2.0-flash-001',
    cost: 1,
    capabilities: ['code_review', 'testing', 'bug_detection'],
    maxTokens: 4096,
    systemPrompt: `Eres un QA Engineer meticuloso.

Tareas:
- Revisar código generado
- Detectar errores potenciales
- Sugerir mejoras
- Verificar consistencia
- Identificar edge cases

Sé crítico pero constructivo.`,
  },
};

class MultiAgentOrchestrator {
  private messages: AgentMessage[] = [];
  private tasks: AgentTask[] = [];
  private totalCost = 0;
  private startTime = 0;

  async orchestrate(userPrompt: string, options: {
    complexity?: 'basic' | 'medium' | 'advanced';
    enableBackend?: boolean;
    useCache?: boolean;
  } = {}): Promise<OrchestrationResult> {
    this.startTime = Date.now();
    this.messages = [];
    this.tasks = [];
    this.totalCost = 0;

    const { complexity = 'medium', enableBackend = false, useCache = true } = options;

    try {
      // Phase 1: Conductor analyzes and plans
      const plan = await this.runConductor(userPrompt, complexity, enableBackend);

      // Phase 2: Architect designs system
      const blueprint = await this.runArchitect(plan, enableBackend);

      // Phase 3: UX Designer creates specifications
      const uxSpecs = await this.runUXDesigner(blueprint);

      // Phase 4: Frontend Developer implements
      const frontendCode = await this.runFrontendDev(blueprint, uxSpecs);

      // Phase 5: Backend Developer (if needed)
      let backendCode;
      if (enableBackend) {
        backendCode = await this.runBackendDev(blueprint);
      }

      // Phase 6: QA Review
      const review = await this.runQAReview({
        blueprint,
        frontendCode,
        backendCode,
      });

      // Phase 7: Apply fixes if needed
      if (review.issues.length > 0) {
        await this.applyFixes(review.issues, { frontendCode, backendCode });
      }

      // Compile final blueprint with code
      const finalBlueprint: ProjectBlueprint = {
        ...blueprint,
        fileStructure: {
          ...frontendCode,
          ...(backendCode || {}),
        },
      };

      return {
        blueprint: finalBlueprint,
        tasks: this.tasks,
        messages: this.messages,
        totalCost: this.totalCost,
        duration: Date.now() - this.startTime,
      };
    } catch (error) {
      console.error('Orchestration failed:', error);
      throw error;
    }
  }

  private async runConductor(
    userPrompt: string,
    complexity: string,
    enableBackend: boolean
  ): Promise<{ plan: string; agentsNeeded: AgentRole[] }> {
    const agent = AGENTS.conductor;

    const prompt = `Analiza este requerimiento y crea un plan de trabajo:

REQUERIMIENTO: ${userPrompt}
COMPLEJIDAD: ${complexity}
BACKEND REQUERIDO: ${enableBackend ? 'Sí' : 'No'}

1. Resume el proyecto en 2-3 oraciones
2. Lista los agentes necesarios en orden de ejecución
3. Define dependencias entre tareas

Responde en JSON: { "summary": string, "agents": string[], "dependencies": string[][] }`;

    const response = await this.callAgent(agent, prompt);

    try {
      const plan = JSON.parse(response);
      return {
        plan: plan.summary,
        agentsNeeded: plan.agents as AgentRole[],
      };
    } catch {
      return {
        plan: response,
        agentsNeeded: ['architect', 'ux_designer', 'frontend_dev'],
      };
    }
  }

  private async runArchitect(
    plan: { plan: string; agentsNeeded: AgentRole[] },
    enableBackend: boolean
  ): Promise<ProjectBlueprint> {
    const agent = AGENTS.architect;

    const prompt = `Diseña la arquitectura para este proyecto:

${plan.plan}

REQUERIMIENTOS:
- Frontend: React + TypeScript + Tailwind CSS
${enableBackend ? '- Backend: Supabase (PostgreSQL + Auth + Edge Functions)' : ''}
- Diseño: Aether V9.0 (Glassmorphism, Premium)

Entrega SOLO este JSON válido:
{
  "projectName": string,
  "description": string,
  "niche": string,
  "architecture": {
    "pattern": string,
    "frontend": string,
    "backend": string | null,
    "database": string | null
  },
  "colorPalette": { "primary": string, "secondary": string, "accent": string, "bg": string },
  "pages": [{ "name": string, "slug": string, "purpose": string, "components": string[], "layout": string }],
  "sharedComponents": [{ "name": string, "role": string }],
  "techStack": { "framework": string, "deps": string[], "devDeps": string[] },
  "fileStructure": Record<string, string>
}`;

    const response = await this.callAgent(agent, prompt);

    try {
      const json = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(json) as ProjectBlueprint;
    } catch (error) {
      console.error('Failed to parse architect response:', error);
      throw new Error('Arquitecto no pudo generar JSON válido');
    }
  }

  private async runUXDesigner(blueprint: ProjectBlueprint): Promise<any> {
    const agent = AGENTS.ux_designer;

    const prompt = `Diseña la UX para: ${blueprint.projectName}

PÁGINAS REQUERIDAS:
${blueprint.pages.map(p => `- ${p.name}: ${p.purpose}`).join('\n')}

PALETA DE COLORES:
${JSON.stringify(blueprint.colorPalette, null, 2)}

Entrega:
1. Flujo de usuario principal
2. Especificaciones de cada página
3. Componentes UI necesarios
4. Interacciones clave
5. Responsive breakpoints

Responde en JSON estructurado.`;

    return this.callAgent(agent, prompt);
  }

  private async runFrontendDev(
    blueprint: ProjectBlueprint,
    uxSpecs: any
  ): Promise<Record<string, string>> {
    const agent = AGENTS.frontend_dev;
    const files: Record<string, string> = {};

    // Generate shared components first
    for (const component of blueprint.sharedComponents) {
      const prompt = `Genera el componente ${component.name} (${component.role}) para ${blueprint.projectName}.

CONTEXTO:
- Proyecto: ${blueprint.projectName}
- Estilo: ${blueprint.niche}
- Colores: ${JSON.stringify(blueprint.colorPalette)}

REQUISITOS:
- Componente React + TypeScript
- Tailwind CSS con colores del proyecto
- Props tipadas
- Animaciones con Framer Motion si aplica
- Export default

Entrega SOLO el código, sin explicaciones.`;

      const code = await this.callAgent(agent, prompt);
      files[`src/components/${component.name}.tsx`] = this.extractCode(code);
    }

    // Generate pages
    for (const page of blueprint.pages) {
      const prompt = `Genera la página completa ${page.name} (${page.slug}) para ${blueprint.projectName}.

PÁGINA: ${page.name}
PROPÓSITO: ${page.purpose}
COMPONENTES: ${page.components.join(', ')}
LAYOUT: ${page.layout}

PALETA: ${JSON.stringify(blueprint.colorPalette)}

Requisitos:
- Página React completa y funcional
- Importa componentes necesarios
- Usa datos de ejemplo realistas
- Responsive design
- Sin placeholders

Entrega SOLO el código.`;

      const code = await this.callAgent(agent, prompt);
      files[`src/pages/${page.slug === '/' ? 'Index' : page.slug}.tsx`] = this.extractCode(code);
    }

    // Generate App.tsx
    const appPrompt = `Genera el App.tsx principal para ${blueprint.projectName}.

PÁGINAS: ${blueprint.pages.map(p => p.name).join(', ')}
ROUTING: React Router

Requisitos:
- Importa todas las páginas
- Configura rutas
- Layout con navegación
- Entrega SOLO el código.`;

    const appCode = await this.callAgent(agent, appPrompt);
    files['App.tsx'] = this.extractCode(appCode);

    return files;
  }

  private async runBackendDev(blueprint: ProjectBlueprint): Promise<Record<string, string>> {
    const agent = AGENTS.backend_dev;

    const prompt = `Diseña el backend para: ${blueprint.projectName}

Entrega:
1. Esquema SQL de tablas necesarias
2. Políticas RLS de Supabase
3. Edge Functions si aplica
4. Tipos TypeScript para la base de datos

Responde con JSON: { "schema.sql": string, "policies.sql": string, "types.ts": string }`;

    const response = await this.callAgent(agent, prompt);

    try {
      return JSON.parse(response);
    } catch {
      return {
        'schema.sql': response,
        'policies.sql': '-- Generate policies based on schema',
        'types.ts': '// Database types',
      };
    }
  }

  private async runQAReview(code: {
    blueprint: ProjectBlueprint;
    frontendCode: Record<string, string>;
    backendCode?: Record<string, string>;
  }): Promise<{ issues: any[] }> {
    const agent = AGENTS.qa_engineer;

    const prompt = `Revisa este código generado:

PROYECTO: ${code.blueprint.projectName}
ARCHIVOS: ${Object.keys(code.frontendCode).join(', ')}

Identifica:
1. Errores de sintaxis potenciales
2. Imports faltantes
3. Variables no definidas
4. Problemas de tipos TypeScript
5. Mejoras sugeridas

Responde en JSON: { "issues": [{ "file": string, "severity": "error" | "warning", "message": string, "suggestion": string }] }`;

    const response = await this.callAgent(agent, prompt);

    try {
      return JSON.parse(response);
    } catch {
      return { issues: [] };
    }
  }

  private async applyFixes(
    issues: any[],
    code: { frontendCode: Record<string, string>; backendCode?: Record<string, string> }
  ): Promise<void> {
    const agent = AGENTS.frontend_dev;

    for (const issue of issues.filter((i) => i.severity === 'error')) {
      const currentCode = code.frontendCode[issue.file] || '';

      const prompt = `Corrige este error en ${issue.file}:

ERROR: ${issue.message}

CÓDIGO ACTUAL:
\`\`\`
${currentCode}
\`\`\`

Entrega SOLO el código corregido completo.`;

      const fixedCode = await this.callAgent(agent, prompt);
      code.frontendCode[issue.file] = this.extractCode(fixedCode);
    }
  }

  private async callAgent(agent: Agent, prompt: string): Promise<string> {
    // Check cache first
    const cacheKey = `${agent.role}_${this.hashPrompt(prompt)}`;
    const cached = await aiCache.get(cacheKey);

    if (cached) {
      return cached.response;
    }

    // Track task
    const task: AgentTask = {
      id: crypto.randomUUID(),
      title: `${agent.name}: ${prompt.slice(0, 50)}...`,
      description: prompt,
      assignedTo: agent.role,
      status: 'in_progress',
      dependencies: [],
      startedAt: Date.now(),
    };
    this.tasks.push(task);

    // Call AI
    const response = await aiService.processAction({
      action: 'chat',
      prompt,
      model: agent.model,
      persona: 'genesis',
    });

    // Update cost
    this.totalCost += agent.cost;

    // Complete task
    task.status = 'completed';
    task.completedAt = Date.now();

    // Cache result
    await aiCache.set(
      cacheKey,
      { response: response.text },
      agent.model,
      agent.cost,
      {},
      1000 * 60 * 60 * 24
    );

    return response.text || '';
  }

  private extractCode(response: string): string {
    // Extract code from markdown blocks
    const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    return response.trim();
  }

  private hashPrompt(prompt: string): string {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  getAgents(): Agent[] {
    return Object.values(AGENTS);
  }

  getAgent(role: AgentRole): Agent | undefined {
    return AGENTS[role];
  }
}

// Singleton
export const multiAgentOrchestrator = new MultiAgentOrchestrator();
