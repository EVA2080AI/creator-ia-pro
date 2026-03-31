import { useState } from 'react';
import { FileCode, FileText, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface StudioFileTreeProps {
  files: Record<string, StudioFile>;
  selectedFile: string;
  onSelect: (file: string) => void;
  onAddFile?: (name: string) => void;
  onDeleteFile?: (name: string) => void;
}

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />;
  if (name.endsWith('.css')) return <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
  if (name.endsWith('.json')) return <FileText className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  return <FileText className="h-3.5 w-3.5 text-white/40 shrink-0" />;
};

export function StudioFileTree({ files, selectedFile, onSelect, onAddFile, onDeleteFile }: StudioFileTreeProps) {
  const [addingFile, setAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  const handleAddFile = () => {
    const name = newFileName.trim();
    if (!name) { setAddingFile(false); return; }
    const finalName = name.includes('.') ? name : `${name}.tsx`;
    onAddFile?.(finalName);
    setNewFileName('');
    setAddingFile(false);
  };

  const fileNames = Object.keys(files).sort((a, b) => {
    if (a === 'App.tsx') return -1;
    if (b === 'App.tsx') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/20">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] font-display">Explorer</span>
        <button
          onClick={() => setAddingFile(true)}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          title="New file"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col py-2 flex-1 overflow-y-auto custom-scrollbar">
        {fileNames.map((name) => (
          <div
            key={name}
            onMouseEnter={() => setHovered(name)}
            onMouseLeave={() => setHovered(null)}
            className={`group flex items-center justify-between gap-2 px-4 py-1.5 cursor-pointer transition-all relative ${
              selectedFile === name
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
            onClick={() => onSelect(name)}
          >
            {/* Active Indicator Line */}
            {selectedFile === name && (
              <div className="absolute left-0 w-0.5 h-full bg-primary" />
            )}
            
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              {getFileIcon(name)}
              <span className="text-xs font-mono truncate">{name}</span>
            </div>

            {hovered === name && onDeleteFile && name !== 'App.tsx' && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFile(name); }}
                className="p-1 rounded hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

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
