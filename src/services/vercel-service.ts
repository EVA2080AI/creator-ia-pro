import { toast } from "sonner";
import type { StudioFile } from "@/hooks/useStudioProjects";

/**
 * Vercel Service — Deployment & Domain Management
 *
 * This service interacts directly with the Vercel REST API to deploy the generated
 * code to a live URL, and allows purchasing custom domains using the team's Vercel account.
 */

// We get the token from environment variables (fallback: Admin settings in production)
const VERCEL_TOKEN = import.meta.env.VITE_VERCEL_TOKEN || import.meta.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = import.meta.env.VITE_VERCEL_TEAM_ID || "";

export const vercelService = {
  /**
   * Deploy a Genesis project directly to Vercel
   */
  async deployProject(projectName: string, files: Record<string, StudioFile>, framework: string = "vite") {
    if (!VERCEL_TOKEN) {
      toast.error("Vercel no está configurado. Por favor, añade VITE_VERCEL_TOKEN.");
      throw new Error("Missing Vercel Token");
    }

    // Format files for Vercel Deployments API
    const vercelFiles = Object.entries(files).map(([path, file]) => {
      // Vercel expects base64 if there are binary files, but for text utf-8 is fine
      return {
        file: path.replace(/^\//, ""), // remove leading slash
        data: file.content,
      };
    });

    // We also need to add package.json if it doesn't exist, to ensure Vercel knows how to build it
    if (!files["package.json"] && !files["/package.json"]) {
      vercelFiles.push({
        file: "package.json",
        data: JSON.stringify({
          name: projectName.replace(/\s+/g, '-').toLowerCase(),
          version: "1.0.0",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview"
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0"
          },
          devDependencies: {
            vite: "^5.0.0"
          }
        }, null, 2),
      });
    }

    const payload = {
      name: projectName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().substring(0, 50) || "genesis-app",
      files: vercelFiles,
      projectSettings: {
        framework: framework === "react" ? "vite" : framework || null,
      },
    };

    let url = "https://api.vercel.com/v13/deployments";
    if (VERCEL_TEAM_ID) url += `?teamId=${VERCEL_TEAM_ID}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Vercel Deploy Error]", data);
      throw new Error(data.error?.message || "Error al desplegar en Vercel");
    }

    return {
      url: `https://${data.url}`,
      id: data.id,
      readyState: data.readyState,
    };
  },

  /**
   * Check domain price and availability before buying
   */
  async checkDomainPrice(domain: string) {
    if (!VERCEL_TOKEN) throw new Error("Missing Vercel Token");

    let url = `https://api.vercel.com/v5/domains/price?name=${encodeURIComponent(domain)}`;
    if (VERCEL_TEAM_ID) url += `&teamId=${VERCEL_TEAM_ID}`;

    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${VERCEL_TOKEN}` },
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Error al consultar precio del dominio");
    
    return data; // { price: 20, period: 1 } (price in dollars)
  },

  /**
   * Buy a domain using the Vercel account billing
   * NOTE: We should deduct credits from the user in `creditService` BEFORE calling this!
   */
  async buyDomain(domain: string, expectedPrice: number) {
    if (!VERCEL_TOKEN) throw new Error("Missing Vercel Token");

    let url = "https://api.vercel.com/v5/domains/buy";
    if (VERCEL_TEAM_ID) url += `?teamId=${VERCEL_TEAM_ID}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain, expectedPrice }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Error al comprar el dominio");

    return data;
  },
};
