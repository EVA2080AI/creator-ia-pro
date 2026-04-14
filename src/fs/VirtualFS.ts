import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { EventEmitter } from 'events';

export interface FileNode {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  content?: string;
  language?: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  size: number;
  isDeleted?: boolean;
}

export interface FileChange {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  oldPath?: string;
  node: FileNode;
  timestamp: number;
}

export interface FileSnapshot {
  id: string;
  projectId: string;
  message: string;
  changes: FileChange[];
  createdAt: number;
  parentSnapshotId?: string;
}

interface VFSDB extends DBSchema {
  files: {
    key: string;
    value: FileNode;
    indexes: {
      'by-path': string;
      'by-parent': string;
      'by-project': string;
    };
  };
  changes: {
    key: string;
    value: FileChange;
    indexes: {
      'by-project': string;
      'by-timestamp': number;
    };
  };
  snapshots: {
    key: string;
    value: FileSnapshot;
    indexes: {
      'by-project': string;
      'by-parent': string;
    };
  };
}

export type ChangeCallback = (change: FileChange) => void;
export type WatchCallback = (path: string, node: FileNode | null) => void;

class VirtualFS extends EventEmitter {
  private db: IDBPDatabase<VFSDB> | null = null;
  private projectId: string;
  private watchers: Map<string, Set<WatchCallback>> = new Map();
  private changeHistory: FileChange[] = [];
  private maxHistorySize = 1000;

  constructor(projectId: string) {
    super();
    this.projectId = projectId;
  }

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<VFSDB>(`genesis-vfs-${this.projectId}`, 1, {
      upgrade(db) {
        // Files store
        const filesStore = db.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('by-path', 'path', { unique: true });
        filesStore.createIndex('by-parent', 'parentId');
        filesStore.createIndex('by-project', ['id', 'parentId']);

        // Changes store
        const changesStore = db.createObjectStore('changes', { keyPath: 'timestamp' });
        changesStore.createIndex('by-project', 'node.parentId');
        changesStore.createIndex('by-timestamp', 'timestamp');

        // Snapshots store
        const snapshotsStore = db.createObjectStore('snapshots', { keyPath: 'id' });
        snapshotsStore.createIndex('by-project', 'projectId');
        snapshotsStore.createIndex('by-parent', 'parentSnapshotId');
      },
    });

    // Load initial state
    await this.loadFromIndexedDB();
  }

  // File Operations
  async read(path: string): Promise<FileNode | null> {
    await this.init();
    if (!this.db) return null;

    const tx = this.db.transaction('files');
    const index = tx.store.index('by-path');
    const node = await index.get(path);

    return node && !node.isDeleted ? node : null;
  }

  async readContent(path: string): Promise<string | null> {
    const node = await this.read(path);
    return node?.content || null;
  }

  async write(path: string, content: string, language?: string): Promise<FileNode> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const existing = await this.read(path);
    const now = Date.now();

    let node: FileNode;
    if (existing) {
      node = {
        ...existing,
        content,
        language: language || existing.language,
        updatedAt: now,
        size: new Blob([content]).size,
      };
    } else {
      const parts = path.split('/').filter(Boolean);
      const name = parts.pop() || path;
      const parentPath = parts.join('/') || '/';
      const parent = parentPath !== '/' ? await this.read(parentPath) : null;

      node = {
        id: crypto.randomUUID(),
        path,
        name,
        type: 'file',
        content,
        language: language || this.detectLanguage(name),
        parentId: parent?.id || null,
        createdAt: now,
        updatedAt: now,
        size: new Blob([content]).size,
      };
    }

    await this.db.put('files', node);

    const change: FileChange = {
      type: existing ? 'update' : 'create',
      path,
      node,
      timestamp: now,
    };

    await this.recordChange(change);
    this.emit('change', change);
    this.notifyWatchers(path, node);

    return node;
  }

  async delete(path: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const node = await this.read(path);
    if (!node) return false;

    const deletedNode: FileNode = {
      ...node,
      isDeleted: true,
      updatedAt: Date.now(),
    };

    await this.db.put('files', deletedNode);

    const change: FileChange = {
      type: 'delete',
      path,
      node: deletedNode,
      timestamp: Date.now(),
    };

    await this.recordChange(change);
    this.emit('change', change);
    this.notifyWatchers(path, null);

    return true;
  }

  async rename(oldPath: string, newPath: string): Promise<FileNode | null> {
    await this.init();
    if (!this.db) return null;

    const node = await this.read(oldPath);
    if (!node) return null;

    // Check if target exists
    const existing = await this.read(newPath);
    if (existing) {
      throw new Error(`File already exists at ${newPath}`);
    }

    const parts = newPath.split('/').filter(Boolean);
    const name = parts.pop() || newPath;
    const parentPath = parts.join('/') || '/';
    const parent = parentPath !== '/' ? await this.read(parentPath) : null;

    const renamedNode: FileNode = {
      ...node,
      path: newPath,
      name,
      parentId: parent?.id || null,
      updatedAt: Date.now(),
    };

    await this.db.put('files', renamedNode);

    const change: FileChange = {
      type: 'rename',
      path: newPath,
      oldPath,
      node: renamedNode,
      timestamp: Date.now(),
    };

    await this.recordChange(change);
    this.emit('change', change);
    this.notifyWatchers(oldPath, null);
    this.notifyWatchers(newPath, renamedNode);

    return renamedNode;
  }

  // Directory Operations
  async mkdir(path: string): Promise<FileNode> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const existing = await this.read(path);
    if (existing) return existing;

    const parts = path.split('/').filter(Boolean);
    const name = parts.pop() || path;
    const parentPath = parts.join('/') || '/';
    const parent = parentPath !== '/' ? await this.read(parentPath) : null;

    const node: FileNode = {
      id: crypto.randomUUID(),
      path,
      name,
      type: 'directory',
      parentId: parent?.id || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: 0,
    };

    await this.db.put('files', node);

    const change: FileChange = {
      type: 'create',
      path,
      node,
      timestamp: Date.now(),
    };

    await this.recordChange(change);
    this.emit('change', change);

    return node;
  }

  async readdir(path: string): Promise<FileNode[]> {
    await this.init();
    if (!this.db) return [];

    const parent = await this.read(path);
    const parentId = parent?.id || null;

    const tx = this.db.transaction('files');
    const index = tx.store.index('by-parent');
    const all = await index.getAll(parentId);

    return all.filter((n) => !n.isDeleted);
  }

  // Tree Operations
  async getTree(): Promise<FileNode[]> {
    await this.init();
    if (!this.db) return [];

    const tx = this.db.transaction('files');
    const all = await tx.store.getAll();

    return all.filter((n) => !n.isDeleted);
  }

  async getFilesAsRecord(): Promise<Record<string, { content: string; language: string }>> {
    const tree = await this.getTree();
    const record: Record<string, { content: string; language: string }> = {};

    for (const node of tree) {
      if (node.type === 'file' && node.content !== undefined) {
        record[node.path] = {
          content: node.content,
          language: node.language || 'text',
        };
      }
    }

    return record;
  }

  // Diff Operations
  async diff(snapshots: [string, string]): Promise<FileChange[]> {
    await this.init();
    if (!this.db) return [];

    const [fromSnapshot, toSnapshot] = snapshots;

    // Get all changes between snapshots
    const tx = this.db.transaction('changes');
    const index = tx.store.index('by-timestamp');

    const fromTime = parseInt(fromSnapshot);
    const toTime = parseInt(toSnapshot);

    const changes: FileChange[] = [];
    const range = IDBKeyRange.bound(fromTime, toTime);

    let cursor = await index.openCursor(range);
    while (cursor) {
      changes.push(cursor.value);
      cursor = await cursor.continue();
    }

    return changes;
  }

  // Snapshot Operations
  async createSnapshot(message: string): Promise<FileSnapshot> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const snapshot: FileSnapshot = {
      id: crypto.randomUUID(),
      projectId: this.projectId,
      message,
      changes: [...this.changeHistory],
      createdAt: Date.now(),
    };

    await this.db.put('snapshots', snapshot);

    // Clear history after snapshot
    this.changeHistory = [];

    this.emit('snapshot', snapshot);

    return snapshot;
  }

  async getSnapshots(): Promise<FileSnapshot[]> {
    await this.init();
    if (!this.db) return [];

    const tx = this.db.transaction('snapshots');
    const index = tx.store.index('by-project');
    return index.getAll(this.projectId);
  }

  async restoreSnapshot(snapshotId: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const snapshot = await this.db.get('snapshots', snapshotId);
    if (!snapshot) return false;

    // Apply changes in reverse
    for (let i = snapshot.changes.length - 1; i >= 0; i--) {
      const change = snapshot.changes[i];

      switch (change.type) {
        case 'create':
          await this.delete(change.path);
          break;
        case 'update':
        case 'delete':
          // Would need to store previous state for proper restore
          break;
        case 'rename':
          if (change.oldPath) {
            await this.rename(change.path, change.oldPath);
          }
          break;
      }
    }

    return true;
  }

  // Watch Operations
  watch(path: string, callback: WatchCallback): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }

    this.watchers.get(path)!.add(callback);

    return () => {
      this.watchers.get(path)?.delete(callback);
    };
  }

  private notifyWatchers(path: string, node: FileNode | null): void {
    // Notify exact path watchers
    this.watchers.get(path)?.forEach((cb) => cb(path, node));

    // Notify parent directory watchers
    const parentPath = path.split('/').slice(0, -1).join('/') || '/';
    this.watchers.get(parentPath)?.forEach((cb) => cb(path, node));
  }

  // Utility Methods
  async exists(path: string): Promise<boolean> {
    return (await this.read(path)) !== null;
  }

  async stat(path: string): Promise<Partial<FileNode> | null> {
    const node = await this.read(path);
    if (!node) return null;

    return {
      size: node.size,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      type: node.type,
    };
  }

  async size(): Promise<number> {
    const tree = await this.getTree();
    return tree.reduce((acc, node) => acc + (node.size || 0), 0);
  }

  async count(): Promise<number> {
    const tree = await this.getTree();
    return tree.filter((n) => n.type === 'file').length;
  }

  // Import/Export
  async exportToJSON(): Promise<string> {
    const tree = await this.getTree();
    return JSON.stringify({
      projectId: this.projectId,
      exportedAt: Date.now(),
      files: tree,
    }, null, 2);
  }

  async importFromJSON(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid import format');
    }

    for (const node of data.files) {
      await this.db?.put('files', node);
    }
  }

  // Private Methods
  private async recordChange(change: FileChange): Promise<void> {
    if (!this.db) return;

    this.changeHistory.push(change);

    // Trim history if needed
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }

    await this.db.put('changes', change);
  }

  private async loadFromIndexedDB(): Promise<void> {
    // Any initialization after DB is ready
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const langMap: Record<string, string> = {
      tsx: 'tsx',
      ts: 'typescript',
      jsx: 'jsx',
      js: 'javascript',
      css: 'css',
      scss: 'scss',
      json: 'json',
      html: 'html',
      md: 'markdown',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      php: 'php',
      rb: 'ruby',
    };

    return langMap[ext || ''] || 'text';
  }
}

// Factory for project-specific VFS instances
const vfsInstances = new Map<string, VirtualFS>();

export function getVFS(projectId: string): VirtualFS {
  if (!vfsInstances.has(projectId)) {
    vfsInstances.set(projectId, new VirtualFS(projectId));
  }
  return vfsInstances.get(projectId)!;
}

export function disposeVFS(projectId: string): void {
  const vfs = vfsInstances.get(projectId);
  if (vfs) {
    vfs.removeAllListeners();
    vfsInstances.delete(projectId);
  }
}

export function clearAllVFS(): void {
  for (const [id, vfs] of vfsInstances) {
    vfs.removeAllListeners();
  }
  vfsInstances.clear();
}

export { VirtualFS };
