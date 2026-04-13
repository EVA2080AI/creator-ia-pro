import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileCode, FileText, ChevronRight, Plus, Trash2,
  Folder, FolderOpen, FolderPlus, Pencil, Check, X
} from 'lucide-react';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { cn } from '@/lib/utils';

interface StudioFileTreeProps {
  files: Record<string, StudioFile>;
  selectedFile: string;
  onSelect: (file: string) => void;
  onAddFile?: (name: string) => void;
  onDeleteFile?: (name: string) => void;
  onRenameFile?: (oldName: string, newName: string) => void;
  onAddFolder?: (folderPath: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

// ── Protected files that cannot be deleted or renamed ────────────────────────
const PROTECTED = new Set(['App.tsx', 'index.html', 'package.json', 'vite.config.ts', 'main.tsx']);

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts'))
    return <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
  if (name.endsWith('.css'))
    return <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
  if (name.endsWith('.json'))
    return <FileText className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  if (name.endsWith('.html'))
    return <FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />;
  return <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />;
};

function buildFileTree(files: Record<string, StudioFile>): FileNode[] {
  const tree: FileNode[] = [];
  const paths = Object.keys(files).sort();

  paths.forEach(path => {
    const parts = path.split('/');
    let currentLevel = tree;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');
      let node = currentLevel.find(n => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };
        currentLevel.push(node);
      }
      if (node.children) currentLevel = node.children;
    });
  });

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => { if (n.children) sortNodes(n.children); });
  };

  sortNodes(tree);
  return tree;
}

// ── Inline editable label ─────────────────────────────────────────────────────
function InlineRename({
  initial,
  onConfirm,
  onCancel,
}: { initial: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const confirm = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== initial) onConfirm(trimmed);
    else onCancel();
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0 pr-1" onClick={e => e.stopPropagation()}>
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 min-w-0 bg-black/5 border border-primary/40 rounded px-1.5 py-0.5 text-xs text-zinc-900 outline-none font-mono"
      />
      <button onClick={confirm} className="p-0.5 rounded text-emerald-400 hover:bg-white/10 shrink-0">
        <Check className="h-3 w-3" />
      </button>
      <button onClick={onCancel} className="p-0.5 rounded text-zinc-400 hover:bg-black/5 shrink-0">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudioFileTree({
  files,
  selectedFile,
  onSelect,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onAddFolder,
}: StudioFileTreeProps) {
  const [addingFile, setAddingFile] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ src: true });
  const [hovered, setHovered] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const tree = useMemo(() => buildFileTree(files), [files]);

  const toggleFolder = (path: string) =>
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));

  const handleAddFile = () => {
    const name = newName.trim();
    if (!name) { setAddingFile(false); return; }
    const finalName = name.includes('.') ? name : `${name}.tsx`;
    onAddFile?.(finalName);
    setNewName('');
    setAddingFile(false);
  };

  const handleAddFolder = () => {
    const name = newName.trim();
    if (!name) { setAddingFolder(false); return; }
    // Create a placeholder file inside the folder to materialize it
    const placeholder = `${name}/.gitkeep`;
    onAddFile?.(placeholder);
    setNewName('');
    setAddingFolder(false);
  };

  const handleDelete = (path: string) => {
    if (deleteConfirm === path) {
      onDeleteFile?.(path);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(path);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleRename = (oldPath: string, newBaseName: string) => {
    const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/') + 1) : '';
    const newPath = dir + newBaseName;
    onRenameFile?.(oldPath, newPath);
    setRenamingPath(null);
  };

  const renderNode = (node: FileNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedFolders[node.path] ?? false;
    const isSelected = selectedFile === node.path;
    const isHovered = hovered === node.path;
    const isRenaming = renamingPath === node.path;
    const isDelConfirm = deleteConfirm === node.path;
    const isProtected = PROTECTED.has(node.name);

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-2 py-1 cursor-pointer hover:bg-black/[0.04] transition-colors text-zinc-400 hover:text-zinc-900 relative group/folder"
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => toggleFolder(node.path)}
            onMouseEnter={() => setHovered(node.path)}
            onMouseLeave={() => setHovered(null)}
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform duration-200 shrink-0", isExpanded && "rotate-90")} />
            {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-sky-400 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-sky-500 shrink-0" />}
            <span className="text-xs font-semibold truncate">{node.name}</span>
          </div>
          {isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onMouseEnter={() => setHovered(node.path)}
        onMouseLeave={() => { setHovered(null); if (deleteConfirm === node.path) setDeleteConfirm(null); }}
        className={cn(
          "group flex items-center justify-between gap-1 py-1 cursor-pointer transition-all relative",
          isSelected
            ? 'bg-primary/10 text-primary font-bold'
            : 'text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900'
        )}
        style={{ paddingLeft: `${depth * 12 + (node.path.includes('/') ? 28 : 12)}px`, paddingRight: '8px' }}
        onClick={() => !isRenaming && onSelect(node.path)}
      >
        {isSelected && <div className="absolute left-0 w-0.5 h-full bg-primary rounded-full" />}

        {/* Icon + name / rename input */}
        <div className="flex items-center gap-1.5 overflow-hidden min-w-0 flex-1">
          {getFileIcon(node.name)}
          {isRenaming ? (
            <InlineRename
              initial={node.name}
              onConfirm={newName => handleRename(node.path, newName)}
              onCancel={() => setRenamingPath(null)}
            />
          ) : (
            <span className="text-xs font-mono truncate">{node.name}</span>
          )}
        </div>

        {/* Action buttons on hover */}
        {isHovered && !isRenaming && (
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Rename */}
            {!isProtected && onRenameFile && (
              <button
                onClick={e => { e.stopPropagation(); setRenamingPath(node.path); }}
                className="p-1 rounded hover:bg-black/10 text-zinc-300 hover:text-zinc-900 transition-all"
                title="Renombrar"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {/* Delete */}
            {!isProtected && onDeleteFile && (
              <button
                onClick={e => { e.stopPropagation(); handleDelete(node.path); }}
                className={cn(
                  "p-1 rounded transition-all text-white/30",
                  isDelConfirm
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "hover:bg-rose-500/20 hover:text-rose-400"
                )}
                title={isDelConfirm ? "Confirma: clic de nuevo para borrar" : "Eliminar"}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] bg-black/20 shrink-0">
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">Quantum Explorer</span>
        <div className="flex items-center gap-1">
          {onAddFolder && (
            <button
              onClick={() => { setAddingFolder(true); setAddingFile(false); setNewName(''); }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
              title="Nueva carpeta"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          )}
          {onAddFile && (
            <button
              onClick={() => { setAddingFile(true); setAddingFolder(false); setNewName(''); }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
              title="Nuevo archivo"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex flex-col py-1.5 flex-1 overflow-y-auto custom-scrollbar">
        {tree.map(node => renderNode(node))}

        {/* New file input */}
        {addingFile && (
          <div className="px-3 py-1.5 flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddFile();
                if (e.key === 'Escape') { setAddingFile(false); setNewName(''); }
              }}
              onBlur={handleAddFile}
              placeholder="nombre.tsx"
              className="flex-1 bg-black/5 border border-primary/30 rounded-lg px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-300 outline-none focus:border-primary/60 font-mono"
            />
          </div>
        )}

        {/* New folder input */}
        {addingFolder && (
          <div className="px-3 py-1.5 flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') { setAddingFolder(false); setNewName(''); }
              }}
              onBlur={handleAddFolder}
              placeholder="nombre-carpeta"
              className="flex-1 bg-white/5 border border-sky-500/30 rounded-lg px-2 py-1 text-xs text-white placeholder:text-white/20 outline-none focus:border-sky-500/60 font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
}
