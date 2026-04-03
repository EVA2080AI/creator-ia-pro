import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Circle, Save, Code, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface StudioCodeEditorProps {
  selectedFile: string;
  projectFiles: Record<string, StudioFile>;
  onFilesChange: (files: Record<string, StudioFile>) => void;
  isGenerating?: boolean;
  streamPreview?: string;
}

const KEYWORDS = ['import','from','export','default','const','let','var','return','function',
  'if','else','interface','type','extends','class','new','this','async','await','try','catch','throw'];
const TYPES = ['string','number','boolean','void','any','never','null','undefined','true','false'];

function highlightLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const patterns: { re: RegExp; cls: string }[] = [
    { re: /(\/\/.*)/, cls: 'text-zinc-400' },
    { re: new RegExp(`\\b(${KEYWORDS.join('|')})\\b`), cls: 'text-primary font-medium' },
    { re: /('[^']*'|"[^"]*"|`[^`]*`)/, cls: 'text-emerald-600' },
    { re: /\b(\d+)\b/, cls: 'text-amber-600' },
    { re: new RegExp(`\\b(${TYPES.join('|')})\\b`), cls: 'text-sky-600' },
    { re: /(<\/?[A-Za-z]\w*)/, cls: 'text-rose-600' },
    { re: /(className|onClick|onChange|onSubmit|href|disabled|type|value|key|ref|style|placeholder)/, cls: 'text-amber-700' },
  ];

  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    let earliest: { idx: number; len: number; cls: string; text: string } | null = null;
    for (const p of patterns) {
      const m = remaining.match(p.re);
      if (m && m.index !== undefined) {
        if (!earliest || m.index < earliest.idx) {
          earliest = { idx: m.index, len: m[0].length, cls: p.cls, text: m[0] };
        }
      }
    }
    if (earliest) {
      if (earliest.idx > 0) tokens.push(<span key={key++}>{remaining.slice(0, earliest.idx)}</span>);
      tokens.push(<span key={key++} className={earliest.cls}>{earliest.text}</span>);
      remaining = remaining.slice(earliest.idx + earliest.len);
    } else {
      tokens.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  return tokens;
}

export function StudioCodeEditor({ selectedFile, projectFiles, onFilesChange, isGenerating, streamPreview }: StudioCodeEditorProps) {
  const fileNames = Object.keys(projectFiles);
  const [openTabs, setOpenTabs] = useState<string[]>(() => fileNames.slice(0, 3));
  const [activeTab, setActiveTab] = useState(() => selectedFile || fileNames[0] || '');
  const [isEditing, setIsEditing] = useState(false);
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Resolve active file safely — never read undefined
  const resolvedTab = (activeTab && projectFiles[activeTab]) ? activeTab : (fileNames[0] ?? '');
  const file = projectFiles[resolvedTab] ?? { language: 'tsx', content: '' };
  const lines = file.content.split('\n');

  useEffect(() => {
    if (selectedFile && projectFiles[selectedFile]) {
      if (!openTabs.includes(selectedFile)) setOpenTabs((prev) => [...prev, selectedFile]);
      setActiveTab(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    const names = Object.keys(projectFiles);
    if (names.length > 0 && !names.includes(activeTab)) {
      setActiveTab(names[0]);
      setOpenTabs(names.slice(0, 3));
    }
    // Open new tabs when AI generates files
    setOpenTabs((prev) => {
      const newTabs = names.filter((n) => !prev.includes(n));
      return [...prev.filter((t) => names.includes(t)), ...newTabs].slice(0, 6);
    });
  }, [projectFiles]);

  const closeTab = (tab: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== tab);
    setOpenTabs(newTabs);
    if (activeTab === tab && newTabs.length > 0) setActiveTab(newTabs[newTabs.length - 1]);
  };

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!resolvedTab) return;
    const updated = { ...projectFiles, [resolvedTab]: { ...file, content: e.target.value } };
    onFilesChange(updated);
    setModified((prev) => new Set(prev).add(resolvedTab));
  }, [resolvedTab, file, projectFiles, onFilesChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = file.content.substring(0, start) + '  ' + file.content.substring(end);
      if (resolvedTab) onFilesChange({ ...projectFiles, [resolvedTab]: { ...file, content: newContent } });
      setModified((prev) => new Set(prev).add(resolvedTab));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      setModified((prev) => { const n = new Set(prev); n.delete(resolvedTab); return n; });
      toast.success(`${resolvedTab} guardado`);
    }
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  return (
    <div className="flex h-full flex-col bg-background relative overflow-hidden">
      {isGenerating && (
        <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-background">
          {/* animated header while generating */}
          <div className="flex items-center border-b border-border bg-card/50 px-3 py-2 gap-2 shrink-0">
            <div className="h-2 w-16 rounded-full animate-pulse bg-primary/20" />
            <div className="h-2 w-12 rounded-full animate-pulse bg-muted/40" />
          </div>
          {/* streaming code area */}
          <div className="flex-1 overflow-hidden p-4 font-mono text-[11px] leading-6 relative">
            <div className="absolute inset-0 p-4 overflow-hidden">
              <pre className="text-zinc-600 whitespace-pre-wrap break-all text-[10px] leading-5 opacity-80">
                {streamPreview || ''}
                <span className="inline-block w-2 h-4 bg-primary/40 ml-0.5 animate-pulse align-middle" />
              </pre>
            </div>
            {/* gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-background to-transparent" />
          </div>
          {/* status bar */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-t border-zinc-100 bg-white">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '240ms' }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Genesis generating code...</span>
          </div>
        </div>
      )}

      {/* Tabs Layout (GitHub Style) */}
      <div className="flex items-center border-b border-border bg-zinc-50 overflow-x-auto no-scrollbar h-11 shrink-0">
        {openTabs.filter((t) => projectFiles[t]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`group h-full flex items-center gap-2 px-4 text-xs transition-all relative shrink-0 ${
              resolvedTab === tab
                ? 'bg-white text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {/* Active Top Border - Like GitHub's tabs */}
            {resolvedTab === tab && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
            )}
            
            <Circle className={`h-1.5 w-1.5 shrink-0 ${modified.has(tab) ? 'fill-amber-400 text-amber-400' : 'fill-primary/60 text-primary/60'}`} />
            <span className="font-mono text-[11px] font-medium">{tab}</span>
            <X
              className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              onClick={(e) => closeTab(tab, e)}
            />
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div ref={lineNumbersRef} className="w-12 shrink-0 overflow-hidden bg-background py-4 text-right select-none border-r border-border/40">
          {lines.map((_, i) => (
            <div key={i} className="pr-3 text-[11px] leading-6 text-muted-foreground/30 font-mono">{i + 1}</div>
          ))}
        </div>

        {/* Syntax-highlighted view */}
        {!isEditing && (
          <div
            className="absolute inset-0 left-12 overflow-auto p-4 font-mono text-[12px] leading-6 cursor-text custom-scrollbar selection:bg-primary/20"
            onClick={() => { setIsEditing(true); requestAnimationFrame(() => textareaRef.current?.focus()); }}
          >
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre hover:bg-zinc-50 transition-colors rounded-sm px-1 -mx-1 text-zinc-800">
                <code>{highlightLine(line)}</code>
              </div>
            ))}
          </div>
        )}

        {isEditing && (
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            onScroll={syncScroll}
            onSelect={(e) => {
              const ta = e.currentTarget;
              const text = ta.value.substring(0, ta.selectionStart);
              const lineNum = text.split('\n').length;
              const col = ta.selectionStart - text.lastIndexOf('\n');
              setCursorPos({ line: lineNum, col });
            }}
            className="flex-1 resize-none bg-transparent p-4 font-mono text-[12px] leading-6 text-foreground/80 outline-none caret-primary custom-scrollbar selection:bg-primary/20"
            spellCheck={false}
            autoFocus
          />
        )}
      </div>

      {/* Status bar (GitHub Style) */}
      <div className="flex items-center justify-between border-t border-border bg-white px-4 py-1 text-[10px] text-zinc-500 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Code className="w-3 h-3" />
            <span>{file.language.toUpperCase()}</span>
          </div>
          <span>UTF-8</span>
          {modified.has(resolvedTab) && (
            <div className="flex items-center gap-1 text-amber-400">
              <Circle className="w-1.5 h-1.5 fill-current" />
              <span>Unsaved changes</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <div className="flex items-center gap-1 hover:text-foreground cursor-pointer">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Prettier</span>
          </div>
        </div>
      </div>
    </div>

  );
}
