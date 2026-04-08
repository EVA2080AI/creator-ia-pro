import { useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { genesisOrchestrator } from '@/services/genesis-orchestrator';
import { useStudioProjects } from '@/hooks/useStudioProjects';

/**
 * useCanvasSync
 * Bi-directional synchronization between Canvas (Strategic Map) 
 * and Genesis Studio Blueprint.
 */
export const useCanvasSync = (
  spaceId: string | null,
  user: any,
  nodes: Node[],
  edges: Edge[]
) => {
  const { updateProjectFiles, getProjectFiles } = useStudioProjects();
  const lastSyncRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!spaceId || !user || nodes.length === 0) return;

    // 1. Debounced synchronization
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        // 2. Resolve target project from space settings
        const { data: space } = await supabase
          .from('spaces')
          .select('settings')
          .eq('id', spaceId)
          .single();

        // Cast settings to expected object shape to resolve type error
        const settings = space?.settings as { genesis_project_id?: string } | null;
        const projectId = settings?.genesis_project_id;
        if (!projectId) return;

        // 3. Map Canvas to Blueprint
        const blueprint = genesisOrchestrator.mapCanvasNodesToBlueprint(nodes, edges);
        const blueprintStr = JSON.stringify(blueprint);

        // Avoid redundant updates
        if (blueprintStr === lastSyncRef.current) return;

        // 4. Update Project Files
        const currentFiles = await getProjectFiles(projectId);
        if (!currentFiles) return;

        const updatedFiles = await genesisOrchestrator.applyBlueprintToProjectFiles(
          projectId,
          blueprint,
          currentFiles
        );

        await updateProjectFiles(projectId, updatedFiles);
        lastSyncRef.current = blueprintStr;
        
        console.log('[Sync] Blueprint updated for project:', projectId);
      } catch (err) {
        console.error('[Sync] Error during reverse sync:', err);
      }
    }, 3000); // 3-second debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges, spaceId, user]);
};
