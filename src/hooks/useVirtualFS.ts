import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getVFS, disposeVFS, type FileNode, type VirtualFS } from '@/fs';
import type { StudioFile } from '@/stores';

interface UseVirtualFSOptions {
  projectId: string;
  enabled?: boolean;
}

interface UseVirtualFSReturn {
  vfs: VirtualFS | null;
  isReady: boolean;
  isMigrating: boolean;
  migrateFromLegacy: (files: Record<string, StudioFile>) => Promise<void>;
  readFile: (path: string) => Promise<{ content: string; language: string } | null>;
  writeFile: (path: string, content: string, language?: string) => Promise<void>;
  deleteFile: (path: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  listFiles: () => Promise<FileNode[]>;
  getAsRecord: () => Promise<Record<string, StudioFile>>;
  createSnapshot: (message: string) => Promise<string>;
  restoreSnapshot: (snapshotId: string) => Promise<boolean>;
  diffWithLegacy: (legacyFiles: Record<string, StudioFile>) => Promise<{
    added: string[];
    modified: string[];
    deleted: string[];
  }>;
}

export function useVirtualFS({ projectId, enabled = true }: UseVirtualFSOptions): UseVirtualFSReturn {
  const [isReady, setIsReady] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const vfsRef = useRef<VirtualFS | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const initVFS = async () => {
      try {
        vfsRef.current = getVFS(projectId);
        await vfsRef.current.init();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize VFS:', err);
        toast.error('Error inicializando sistema de archivos');
      }
    };

    initVFS();

    return () => {
      // Don't dispose on unmount to preserve state between renders
      // Only dispose when project changes
    };
  }, [projectId, enabled]);

  // Dispose old VFS when project changes
  useEffect(() => {
    return () => {
      disposeVFS(projectId);
      vfsRef.current = null;
    };
  }, [projectId]);

  const migrateFromLegacy = useCallback(
    async (files: Record<string, StudioFile>) => {
      if (!vfsRef.current || !isReady) return;

      setIsMigrating(true);
      try {
        // Create root directory
        await vfsRef.current.mkdir('src');

        // Migrate each file
        for (const [path, file] of Object.entries(files)) {
          try {
            // Ensure parent directories exist
            const parts = path.split('/');
            let currentPath = '';
            for (let i = 0; i < parts.length - 1; i++) {
              currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
              const exists = await vfsRef.current.exists(currentPath);
              if (!exists) {
                await vfsRef.current.mkdir(currentPath);
              }
            }

            // Write file
            await vfsRef.current.write(path, file.content, file.language);
          } catch (err) {
            console.warn(`Failed to migrate file ${path}:`, err);
          }
        }

        // Create initial snapshot
        await vfsRef.current.createSnapshot('Migration from legacy storage');

        toast.success('Migración completada');
      } catch (err) {
        console.error('Migration failed:', err);
        toast.error('Error en migración');
      } finally {
        setIsMigrating(false);
      }
    },
    [isReady]
  );

  const readFile = useCallback(
    async (path: string): Promise<{ content: string; language: string } | null> => {
      if (!vfsRef.current || !isReady) return null;

      const node = await vfsRef.current.read(path);
      if (!node || node.type !== 'file' || !node.content) {
        return null;
      }

      return {
        content: node.content,
        language: node.language || 'text',
      };
    },
    [isReady]
  );

  const writeFile = useCallback(
    async (path: string, content: string, language?: string) => {
      if (!vfsRef.current || !isReady) {
        throw new Error('VFS not initialized');
      }

      await vfsRef.current.write(path, content, language);
    },
    [isReady]
  );

  const deleteFile = useCallback(
    async (path: string): Promise<boolean> => {
      if (!vfsRef.current || !isReady) return false;

      return await vfsRef.current.delete(path);
    },
    [isReady]
  );

  const renameFile = useCallback(
    async (oldPath: string, newPath: string) => {
      if (!vfsRef.current || !isReady) {
        throw new Error('VFS not initialized');
      }

      await vfsRef.current.rename(oldPath, newPath);
    },
    [isReady]
  );

  const listFiles = useCallback(async (): Promise<FileNode[]> => {
    if (!vfsRef.current || !isReady) return [];

    return await vfsRef.current.getTree();
  }, [isReady]);

  const getAsRecord = useCallback(async (): Promise<Record<string, StudioFile>> => {
    if (!vfsRef.current || !isReady) {
      return {};
    }

    const tree = await vfsRef.current.getTree();
    const record: Record<string, StudioFile> = {};

    for (const node of tree) {
      if (node.type === 'file' && node.content !== undefined) {
        record[node.path] = {
          content: node.content,
          language: node.language || 'text',
        };
      }
    }

    return record;
  }, [isReady]);

  const createSnapshot = useCallback(
    async (message: string): Promise<string> => {
      if (!vfsRef.current || !isReady) {
        throw new Error('VFS not initialized');
      }

      const snapshot = await vfsRef.current.createSnapshot(message);
      return snapshot.id;
    },
    [isReady]
  );

  const restoreSnapshot = useCallback(
    async (snapshotId: string): Promise<boolean> => {
      if (!vfsRef.current || !isReady) return false;

      return await vfsRef.current.restoreSnapshot(snapshotId);
    },
    [isReady]
  );

  const diffWithLegacy = useCallback(
    async (legacyFiles: Record<string, StudioFile>) => {
      const vfsFiles = await getAsRecord();

      const added: string[] = [];
      const modified: string[] = [];
      const deleted: string[] = [];

      // Find added and modified
      for (const [path, file] of Object.entries(vfsFiles)) {
        if (!(path in legacyFiles)) {
          added.push(path);
        } else if (file.content !== legacyFiles[path].content) {
          modified.push(path);
        }
      }

      // Find deleted
      for (const path of Object.keys(legacyFiles)) {
        if (!(path in vfsFiles)) {
          deleted.push(path);
        }
      }

      return { added, modified, deleted };
    },
    [getAsRecord]
  );

  return {
    vfs: vfsRef.current,
    isReady,
    isMigrating,
    migrateFromLegacy,
    readFile,
    writeFile,
    deleteFile,
    renameFile,
    listFiles,
    getAsRecord,
    createSnapshot,
    restoreSnapshot,
    diffWithLegacy,
  };
}

/**
 * Hook de bridge que sincroniza entre legacy Record y VFS
 * Mientras se migra completamente, mantiene ambos sincronizados
 */
export function useVirtualFSBridge(
  projectId: string,
  legacyFiles: Record<string, StudioFile>,
  onLegacyChange: (files: Record<string, StudioFile>) => void
) {
  const vfs = useVirtualFS({ projectId, enabled: true });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Migrate on first load
  useEffect(() => {
    if (vfs.isReady && Object.keys(legacyFiles).length > 0) {
      // Check if VFS is empty
      vfs.listFiles().then((files) => {
        if (files.length === 0) {
          vfs.migrateFromLegacy(legacyFiles);
        }
      });
    }
  }, [vfs.isReady, legacyFiles]);

  // Sync from legacy to VFS
  const syncToVFS = useCallback(async () => {
    if (!vfs.isReady || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    try {
      const diff = await vfs.diffWithLegacy(legacyFiles);

      // Apply changes
      for (const path of diff.added) {
        await vfs.writeFile(path, legacyFiles[path].content, legacyFiles[path].language);
      }

      for (const path of diff.modified) {
        await vfs.writeFile(path, legacyFiles[path].content, legacyFiles[path].language);
      }

      for (const path of diff.deleted) {
        await vfs.deleteFile(path);
      }

      setSyncStatus('idle');
    } catch (err) {
      setSyncStatus('error');
      console.error('Sync failed:', err);
    }
  }, [vfs, legacyFiles, syncStatus]);

  // Sync from VFS to legacy
  const syncFromVFS = useCallback(async () => {
    if (!vfs.isReady) return;

    const files = await vfs.getAsRecord();
    onLegacyChange(files);
  }, [vfs, onLegacyChange]);

  return {
    ...vfs,
    syncToVFS,
    syncFromVFS,
    syncStatus,
  };
}
