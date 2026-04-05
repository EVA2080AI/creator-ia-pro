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
      model: "claude-3.5-sonnet" // Senior Architect choice
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

# CODING STANDARDS:
- Use Tailwind CSS with Aether V9.0 iridescent styles.
- Use Framer Motion for premium micro-animations.
- High-fidelity components only. No placeholders.
- Real content (Copywriting) relevant to ${blueprint.niche}.
- No comments explaining what you did. Just the code.

# OUTPUT:
Return ONLY the raw code for ${filePath}.`;

    const res = await aiService.processAction({
      action: "chat",
      prompt: synthesisPrompt,
      model: "gpt-oss-120b" // Power Synthesis choice
    });

    return res.text.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
  }
}

export const genesisOrchestrator = GenesisOrchestrator.getInstance();
