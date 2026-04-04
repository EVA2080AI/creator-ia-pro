import { useState, useMemo } from 'react';
import { 
  FileCode, 
  FileText, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Folder, 
  FolderOpen 
} from 'lucide-react';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { cn } from '@/lib/utils';

interface StudioFileTreeProps {
  files: Record<string, StudioFile>;
  selectedFile: string;
  onSelect: (file: string) => void;
  onAddFile?: (name: string) => void;
  onDeleteFile?: (name: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />;
  if (name.endsWith('.css')) return <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
  if (name.endsWith('.json')) return <FileText className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  return <FileText className="h-3.5 w-3.5 text-white/40 shrink-0" />;
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
          children: isFile ? undefined : []
        };
        currentLevel.push(node);
      }
      
      if (node.children) {
        currentLevel = node.children;
      }
    });
  });

  // Sort: Folders first, then alphabetically
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

export function StudioFileTree({ files, selectedFile, onSelect, onAddFile, onDeleteFile }: StudioFileTreeProps) {
  const [addingFile, setAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'src': true });
  const [hovered, setHovered] = useState<string | null>(null);

  const tree = useMemo(() => buildFileTree(files), [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleAddFile = () => {
    const name = newFileName.trim();
    if (!name) { setAddingFile(false); return; }
    const finalName = name.includes('.') ? name : `${name}.tsx`;
    onAddFile?.(finalName);
    setNewFileName('');
    setAddingFile(false);
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders[node.path];
    const isSelected = selectedFile === node.path;
    const isHovered = hovered === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-secondary/30 transition-colors text-muted-foreground hover:text-foreground"
            style={{ paddingLeft: `${depth * 12 + 16}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform duration-300", isExpanded && "rotate-90")} />
            {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-sky-400" /> : <Folder className="h-3.5 w-3.5 text-sky-500" />}
            <span className="text-xs font-semibold">{node.name}</span>
          </div>
          {isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onMouseEnter={() => setHovered(node.path)}
        onMouseLeave={() => setHovered(null)}
        className={cn(
          "group flex items-center justify-between gap-2 px-4 py-1 cursor-pointer transition-all relative shrink-0",
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
        )}
        style={{ paddingLeft: `${depth * 12 + (node.path.includes('/') ? 32 : 16)}px` }}
        onClick={() => onSelect(node.path)}
      >
        {isSelected && <div className="absolute left-0 w-0.5 h-full bg-primary" />}
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          {getFileIcon(node.name)}
          <span className="text-xs font-mono truncate">{node.name}</span>
        </div>

        {isHovered && onDeleteFile && node.name !== 'App.tsx' && node.name !== 'index.html' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteFile(node.path); }}
            className="p-1 rounded hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all shrink-0"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/5 shrink-0">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-display">Quantum Explorer</span>
        <button
          onClick={() => setAddingFile(true)}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col py-2 flex-1 overflow-y-auto custom-scrollbar no-scrollbar-x">
        {tree.map(node => renderNode(node))}

        {addingFile && (
          <div className="px-3 py-1.5">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFile();
                if (e.key === 'Escape') { setAddingFile(false); setNewFileName(''); }
              }}
              onBlur={handleAddFile}
              placeholder="nombre.tsx"
              className="w-full bg-white/5 border border-primary/30 rounded-lg px-2 py-1 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
