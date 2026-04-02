/**
 * useStudioActions — Centralized Studio Action Hook (Industrial V4.0)
 *
 * Standardizes all Genesis IDE button/action logic into a single
 * reusable hook. Every topbar button, overflow menu item, and
 * contextual action should go through this hook.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { boldService } from '@/services/billing-service';
import { CREDIT_PLANS } from '@/services/billing-service';
import { generateProject, downloadBlob, type ScaffoldOptions, type ScaffoldResult } from '@/services/scaffold-service';
import type { StudioFile } from '@/hooks/useStudioProjects';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseStudioActionsReturn {
  // Export & Sharing
  exportZip: (files: Record<string, StudioFile>, projectName: string) => Promise<void>;
  copyShareLink: () => void;

  // GitHub
  pushToGithub: (params: {
    files: Record<string, StudioFile>;
    token: string;
    repo: string;
    projectName: string;
  }) => Promise<void>;
  pushingGithub: boolean;

  // Navigation
  goToProjects: () => void;
  goToPricing: () => void;
  goToAdmin: () => void;

  // Credit Purchase (Lovable-style)
  purchasePlan: (planId: string) => Promise<void>;
  purchasingPlan: boolean;

  // Multi-Page Project Generation
  generateMultiPageProject: (opts: ScaffoldOptions) => Promise<ScaffoldResult | null>;
  generatingProject: boolean;

  // Utility
  plans: typeof CREDIT_PLANS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioActions(): UseStudioActionsReturn {
  const navigate = useNavigate();
  const [pushingGithub, setPushingGithub] = useState(false);
  const [purchasingPlan, setPurchasingPlan] = useState(false);
  const [generatingProject, setGeneratingProject] = useState(false);

  // ── Export ZIP ──────────────────────────────────────────────────────────────
  const exportZip = useCallback(async (files: Record<string, StudioFile>, projectName: string) => {
    try {
      const zip = new JSZip();
      Object.entries(files).forEach(([name, file]) => {
        zip.file(name, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`);
      toast.success('ZIP descargado correctamente');
    } catch (err) {
      console.error('[Studio] ZIP export error:', err);
      toast.error('Error al generar el ZIP');
    }
  }, []);

  // ── Share Link ─────────────────────────────────────────────────────────────
  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado al portapapeles');
  }, []);

  // ── Push to GitHub ─────────────────────────────────────────────────────────
  const pushToGithub = useCallback(async (params: {
    files: Record<string, StudioFile>;
    token: string;
    repo: string;
    projectName: string;
  }) => {
    const { files, token, repo, projectName } = params;
    if (!token || !repo) {
      toast.error('Configura token y repositorio');
      return;
    }

    setPushingGithub(true);
    try {
      const parts = repo.includes('/') ? repo.split('/') : ['', repo];
      const owner = parts[0];
      const repoName = parts[1];
      if (!owner || !repoName) {
        toast.error('Formato: usuario/repositorio');
        return;
      }

      // Check if repo exists, create if not
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (!repoCheck.ok) {
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ name: repoName, description: projectName, private: false, auto_init: true }),
        });
        if (!createRes.ok) {
          toast.error('No se pudo crear el repositorio');
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
      }

      // Push each file
      const pushFile = async ([filename, file]: [string, StudioFile]) => {
        const content = btoa(unescape(encodeURIComponent(file.content)));
        const shaRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filename}`, {
          headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
        });
        const sha = shaRes.ok ? (await shaRes.json())?.sha : undefined;
        const pushRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filename}`, {
          method: 'PUT',
          headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ message: `feat: update ${filename} via Genesis`, content, ...(sha ? { sha } : {}) }),
        });
        if (!pushRes.ok) throw new Error(filename);
      };

      const results = await Promise.allSettled(Object.entries(files).map(pushFile));
      const pushed = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) toast.warning(`${pushed} enviados, ${failed} fallaron — revisa el token`);
      else toast.success(`${pushed} archivos enviados a github.com/${owner}/${repoName}`);
    } catch {
      toast.error('Error al enviar a GitHub');
    } finally {
      setPushingGithub(false);
    }
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToProjects = useCallback(() => navigate('/chat'), [navigate]);
  const goToPricing = useCallback(() => navigate('/pricing'), [navigate]);
  const goToAdmin = useCallback(() => navigate('/admin'), [navigate]);

  const purchasePlan = useCallback(async (planId: string) => {
    setPurchasingPlan(true);
    try {
      await boldService.purchaseCredits(planId);
    } catch (err: unknown) {
      console.error('[Billing] Error de pago:', err);
      toast.error('No se pudo procesar el pago o la compra está cancelada.');
      setPurchasingPlan(false);
    }
  }, []);

  // ── Generate Multi-Page Project ────────────────────────────────────────────
  const generateMultiPageProject = useCallback(async (opts: ScaffoldOptions): Promise<ScaffoldResult | null> => {
    setGeneratingProject(true);
    try {
      const result = await generateProject(opts);
      downloadBlob(result.blob, `${opts.projectName.replace(/\s+/g, '-').toLowerCase()}.zip`);
      toast.success(`Proyecto "${opts.projectName}" generado (${result.fileCount} archivos)`);
      return result;
    } catch (err: any) {
      console.error('[Scaffold] Generation error:', err);
      toast.error(err?.message || 'Error al generar el proyecto');
      return null;
    } finally {
      setGeneratingProject(false);
    }
  }, []);

  return {
    exportZip,
    copyShareLink,
    pushToGithub,
    pushingGithub,
    goToProjects,
    goToPricing,
    goToAdmin,
    purchasePlan,
    purchasingPlan,
    generateMultiPageProject,
    generatingProject,
    plans: CREDIT_PLANS,
  };
}
