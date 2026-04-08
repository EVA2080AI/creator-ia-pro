import { aiService } from "./ai-service";
import { ProjectType, ScaffoldOptions } from "./scaffold-service";

export interface ProjectBlueprint {
  projectName: string;
  description: string;
  niche: string;
  colorPalette: { primary: string; secondary: string; accent: string; bg: string };
  pages: { name: string; slug: string; components: string[]; purpose: string }[];
  sharedComponents: { name: string; role: string }[];
  techStack: { deps: string[]; framework: ProjectType };
}

export class GenesisOrchestrator {
  private static instance: GenesisOrchestrator;

  static getInstance() {
    if (!this.instance) this.instance = new GenesisOrchestrator();
    return this.instance;
  }

  /**
   * Phase 1: Architecting — Generate the Blueprint
   */
  async architectProject(prompt: string, type: ProjectType): Promise<ProjectBlueprint> {
    const architectPrompt = `# ROLE: Architect — Genesis V16.0
Analyze the user prompt and generate an INDUSTRIAL BLUEPRINT for a web project.
Return ONLY JSON.

# USER PROMPT:
${prompt}

# RULES:
- Framework: ${type}
- Design System: Aether V9.0 (Glassmorphism, High-Fidelity)
- Pages: At least 3 specialized pages based on the niche.
- Components: Identify specific components per page.

# JSON FORMAT:
{
  "projectName": "string",
  "description": "Short but professional branding description",
  "niche": "e.g. Fintech, E-commerce, Luxury",
  "colorPalette": { "primary": "hex", "secondary": "hex", "accent": "hex", "bg": "hex" },
  "pages": [ { "name": "string", "slug": "string", "components": ["List"], "purpose": "string" } ],
  "sharedComponents": [ { "name": "string", "role": "string" } ],
  "techStack": { "deps": ["lucide-react", "framer-motion"], "framework": "${type}" }
}`;

    const res = await aiService.processAction({
      action: "chat",
      prompt: architectPrompt,
      model: "gemini-3.1-pro-high" // Gemini 2.5 Pro — available to more tiers, 3 credits
    });

    try {
      const blueprintText = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(blueprintText);
    } catch (e) {
      console.error("[GenesisOrchestrator] Failed to parse blueprint:", e);
      throw new Error("Genesis no pudo consolidar la arquitectura inicial. Intenta un prompt detallado.");
    }
  }

  /**
   * Phase 2: Synthesis — Generate individual file contents based on Blueprint
   */
  async synthesizeFile(blueprint: ProjectBlueprint, filePath: string, context: string): Promise<string> {
    const synthesisPrompt = `# ROLE: Senior Engineer — Genesis Synthesis V16.0
Write the FULL code for the file: ${filePath}
Project: ${blueprint.projectName} (${blueprint.niche})
Tech Stack: ${blueprint.techStack.framework}

# BLUEPRINT CONTEXT:
${JSON.stringify(blueprint)}

# FILE CONTEXT / PURPOSE:
${context}

# CODING STANDARDS (Genesis Synthesis V16.0):
- Use Tailwind CSS with Aether V9.0 iridescent styles.
- Use Framer Motion for premium micro-animations.
- High-fidelity components only. No placeholders or empty divs.
- SPEED OPTIMIZATION: If real content is not immediately critical for a component, use HIGH-FIDELITY MOCK DATA.
- IMAGES: Use curated Unsplash URLs (e.g., from the niche: ${blueprint.niche}).
- TEXTS: Use "Lorem Premium" or professional placeholders to maintain visual vibe.
- No comments explaining what you did. Just the code.
- Always include "export default" for main page/component files.

# OUTPUT:
Return ONLY the raw code for ${filePath}.`;

    const res = await aiService.processAction({
      action: "chat",
      prompt: synthesisPrompt,
      model: "gemini-3-flash" // Fast synthesis — 1 credit, runs many files efficiently
    });

    return res.text.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
  }

  /**
   * Phase 3: Strategic Map — Convert Blueprint JSON → Canvas Nodes + Edges
   * Returns nodes and edges ready to be persisted to `canvas_nodes` table.
   */
  mapBlueprintToCanvasNodes(
    blueprint: ProjectBlueprint,
    spaceId: string,
    userId: string
  ): {
    nodes: Array<{
      id: string;
      space_id: string;
      user_id: string;
      type: string;
      prompt: string;
      status: string;
      data_payload: Record<string, unknown>;
      pos_x: number;
      pos_y: number;
    }>;
    edges: Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string }>;
  } {
    const nodes: ReturnType<typeof this.mapBlueprintToCanvasNodes>['nodes'] = [];
    const edges: ReturnType<typeof this.mapBlueprintToCanvasNodes>['edges'] = [];

    // Root project node — centered at top
    const rootId = crypto.randomUUID();
    nodes.push({
      id: rootId,
      space_id: spaceId,
      user_id: userId,
      type: 'blueprint_project',
      prompt: blueprint.projectName,
      status: 'loading',
      pos_x: 400,
      pos_y: 60,
      data_payload: {
        projectName: blueprint.projectName,
        description: blueprint.description,
        niche: blueprint.niche,
        colorPalette: blueprint.colorPalette,
        techStack: blueprint.techStack,
        status: 'ready',
      },
    });

    // Page nodes — spread horizontally below the root
    const pageCount = blueprint.pages.length;
    const pageSpacing = 320;
    const startX = 400 - ((pageCount - 1) * pageSpacing) / 2;

    blueprint.pages.forEach((page, idx) => {
      const pageId = crypto.randomUUID();
      nodes.push({
        id: pageId,
        space_id: spaceId,
        user_id: userId,
        type: 'blueprint_page',
        prompt: page.name,
        status: 'loading',
        pos_x: startX + idx * pageSpacing,
        pos_y: 360,
        data_payload: {
          pageName: page.name,
          slug: page.slug,
          purpose: page.purpose,
          components: page.components,
          accentColor: blueprint.colorPalette?.primary || '#6366f1',
          status: 'idle',
          isShared: false,
        },
      });

      edges.push({
        id: crypto.randomUUID(),
        source: rootId,
        target: pageId,
        sourceHandle: 'pages-out',
        targetHandle: 'project-in',
      });
    });

    // Shared component nodes — to the right of page nodes
    blueprint.sharedComponents?.forEach((comp, idx) => {
      const compId = crypto.randomUUID();
      nodes.push({
        id: compId,
        space_id: spaceId,
        user_id: userId,
        type: 'blueprint_page',
        prompt: comp.name,
        status: 'loading',
        pos_x: startX + pageCount * pageSpacing + 80,
        pos_y: 200 + idx * 220,
        data_payload: {
          pageName: comp.name,
          purpose: comp.role,
          components: [],
          accentColor: blueprint.colorPalette?.secondary || '#8b5cf6',
          status: 'idle',
          isShared: true,
        },
      });

      edges.push({
        id: crypto.randomUUID(),
        source: rootId,
        target: compId,
        sourceHandle: 'shared-out',
        targetHandle: 'project-in',
      });
    });

    return { nodes, edges };
  }

  /**
   * Phase 4: Reverse Sync — Convert Canvas Nodes + Edges → Blueprint JSON
   */
  mapCanvasNodesToBlueprint(nodes: any[], edges: any[]): ProjectBlueprint {
    const projectNode = nodes.find(n => n.type === 'blueprint_project');
    const pageNodes = nodes.filter(n => n.type === 'blueprint_page');

    if (!projectNode) {
      throw new Error("No se encontró el nodo raíz del proyecto en el Canvas.");
    }

    const data = projectNode.data || projectNode.data_payload || {};

    const blueprint: ProjectBlueprint = {
      projectName: data.projectName || projectNode.prompt || "Nuevo Proyecto",
      description: data.description || "Generado desde Canvas",
      niche: data.niche || "General",
      colorPalette: data.colorPalette || { primary: "#6366f1", secondary: "#8b5cf6", accent: "#f43f5e", bg: "#09090b" },
      techStack: data.techStack || { deps: ["lucide-react", "framer-motion"], framework: "vite-react-tailwind" },
      pages: [],
      sharedComponents: []
    };

    pageNodes.forEach(node => {
      const pData = node.data || node.data_payload || {};
      if (pData.isShared) {
        blueprint.sharedComponents.push({
          name: pData.pageName || node.prompt || "Componente",
          role: pData.purpose || ""
        });
      } else {
        blueprint.pages.push({
          name: pData.pageName || node.prompt || "Página",
          slug: pData.slug || (pData.pageName || node.prompt || "").toLowerCase().replace(/\s+/g, '-'),
          purpose: pData.purpose || "",
          components: pData.components || []
        });
      }
    });

    return blueprint;
  }

  /**
   * Phase 5: Persistence — Apply Blueprint to Project Files
   * Updates the `blueprint.json` within the project's file map.
   */
  async applyBlueprintToProjectFiles(
    projectId: string,
    blueprint: ProjectBlueprint,
    currentFiles: Record<string, { content: string; language: string }>
  ): Promise<Record<string, { content: string; language: string }>> {
    const updatedFiles = { ...currentFiles };
    
    updatedFiles['blueprint.json'] = {
      language: 'json',
      content: JSON.stringify(blueprint, null, 2)
    };

    return updatedFiles;
  }
}


export const genesisOrchestrator = GenesisOrchestrator.getInstance();

