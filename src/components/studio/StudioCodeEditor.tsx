import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Circle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface StudioCodeEditorProps {
  selectedFile: string;
  projectFiles: Record<string, StudioFile>;
  onFilesChange: (files: Record<string, StudioFile>) => void;
}

const KEYWORDS = ['import','from','export','default','const','let','var','return','function',
  'if','else','interface','type','extends','class','new','this','async','await','try','catch','throw'];
const TYPES = ['string','number','boolean','void','any','never','null','undefined','true','false'];

function highlightLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const patterns: { re: RegExp; cls: string }[] = [
    { re: /(\/\/.*)/, cls: 'text-white/30' },
    { re: new RegExp(`\\b(${KEYWORDS.join('|')})\\b`), cls: 'text-aether-purple' },
    { re: /('[^']*'|"[^"]*"|`[^`]*`)/, cls: 'text-green-400' },
    { re: /\b(\d+)\b/, cls: 'text-yellow-400' },
    { re: new RegExp(`\\b(${TYPES.join('|')})\\b`), cls: 'text-aether-blue' },
    { re: /(<\/?[A-Za-z]\w*)/, cls: 'text-rose-400' },
    { re: /(className|onClick|onChange|onSubmit|href|disabled|type|value|key|ref|style|placeholder)/, cls: 'text-yellow-300' },
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

export function StudioCodeEditor({ selectedFile, projectFiles, onFilesChange }: StudioCodeEditorProps) {
  const fileNames = Object.keys(projectFiles);
  const [openTabs, setOpenTabs] = useState<string[]>(() => fileNames.slice(0, 3));
  const [activeTab, setActiveTab] = useState(selectedFile || fileNames[0] || 'App.tsx');
  const [isEditing, setIsEditing] = useState(false);
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const file = projectFiles[activeTab] || projectFiles[fileNames[0]] || { language: 'tsx', content: '' };
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
    const updated = { ...projectFiles, [activeTab]: { ...file, content: e.target.value } };
    onFilesChange(updated);
    setModified((prev) => new Set(prev).add(activeTab));
  }, [activeTab, file, projectFiles, onFilesChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = file.content.substring(0, start) + '  ' + file.content.substring(end);
      onFilesChange({ ...projectFiles, [activeTab]: { ...file, content: newContent } });
      setModified((prev) => new Set(prev).add(activeTab));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      setModified((prev) => { const n = new Set(prev); n.delete(activeTab); return n; });
      toast.success(`${activeTab} guardado`);
    }
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  return (
    <div className="flex h-full flex-col bg-[#1c1c22]">
      {/* Tabs */}
      <div className="flex items-center border-b border-white/[0.05] bg-[#16161b] overflow-x-auto no-scrollbar">
        {openTabs.filter((t) => projectFiles[t]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`group flex items-center gap-2 px-4 py-2.5 text-sm border-r border-white/[0.05] transition-colors shrink-0 ${
              activeTab === tab
                ? 'bg-[#1c1c22] text-white border-b-2 border-b-aether-purple'
                : 'text-white/30 hover:text-white/70 hover:bg-white/[0.02]'
            }`}
          >
            <Circle className={`h-1.5 w-1.5 shrink-0 ${modified.has(tab) ? 'fill-yellow-400 text-yellow-400' : 'fill-aether-blue/60 text-aether-blue/60'}`} />
            <span className="font-mono text-[11px]">{tab}</span>
            <X
              className="h-3 w-3 opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-opacity"
              onClick={(e) => closeTab(tab, e)}
            />
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div ref={lineNumbersRef} className="w-12 shrink-0 overflow-hidden bg-[#1c1c22] py-4 text-right select-none border-r border-white/[0.03]">
          {lines.map((_, i) => (
            <div key={i} className="pr-3 text-[11px] leading-6 text-white/15 font-mono">{i + 1}</div>
          ))}
        </div>

        {/* Syntax-highlighted view */}
        {!isEditing && (
          <div
            className="absolute inset-0 left-12 overflow-auto p-4 font-mono text-[12px] leading-6 cursor-text"
            onClick={() => { setIsEditing(true); requestAnimationFrame(() => textareaRef.current?.focus()); }}
          >
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre hover:bg-white/[0.015] transition-colors">
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
            className="flex-1 resize-none bg-transparent p-4 font-mono text-[12px] leading-6 text-white/80 outline-none caret-aether-purple"
            spellCheck={false}
            autoFocus
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-white/[0.05] bg-[#16161b] px-4 py-1 text-[10px] text-white/20 font-mono">
        <div className="flex items-center gap-4">
          <span>{file.language.toUpperCase()}</span>
          <span>UTF-8</span>
          {modified.has(activeTab) && <span className="text-yellow-400">● Sin guardar</span>}
        </div>
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
      </div>
    </div>
  );
}
