import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  ChevronRight, 
  Zap, 
  Activity, 
  Sparkles,
  Command,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface StudioTerminalProps {
  files: Record<string, StudioFile>;
  onCommand?: (cmd: string, args: string[]) => void;
  onFix?: () => void;
}

interface TermLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  prefix?: string;
}

export const StudioTerminal: React.FC<StudioTerminalProps> = ({ 
  files, 
  onCommand,
  onFix 
}) => {
  const [history, setHistory] = useState<TermLine[]>([
    { id: 'init-1', type: 'info', content: 'AI_CORE_SHELL V1.0.0-PRO [ACTIVE]' },
    { id: 'init-2', type: 'info', content: 'ESTABLISHING_NEURAL_BRIDGE... [OK]' },
    { id: 'init-3', type: 'success', content: 'COGNITIVE_LINK_STABLE. SYSTEM_OPERATIONAL.' },
    { id: 'init-4', type: 'output', content: 'TYPE "HELP" FOR COMMAND_DIRECTORY' },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Add to UI history (echo)
    setHistory(prev => [...prev, { id: crypto.randomUUID(), type: 'input', content: trimmed, prefix: 'ROOT@AI_CORE:~#' }]);
    setCmdHistory(prev => [trimmed, ...prev]);
    setHistoryIdx(-1);

    const [cmd, ...args] = trimmed.split(/\s+/);
    const cmdLower = cmd.toLowerCase();

    // Virtual Shell Logic
    switch (cmdLower) {
      case 'help':
        addLines([
          'AVAILABLE_COMMANDS:',
          '  ls              List active project architecture',
          '  cat <file>      Read file content in buffer',
          '  fix             Initialize AI auto-correction',
          '  stats           Display project heuristics',
          '  clear           Flush console buffer',
          '  pwd             Print virtual working directory',
          '  whoami          Display operator identity',
          '  help            Access this directory'
        ], 'output');
        break;

      case 'ls':
        const fileList = Object.keys(files).map(f => `  ${f}`).join('\n');
        addLines([fileList || 'NO_FILES_FOUND'], 'output');
        break;

      case 'pwd':
        addLines(['/ARCHITECTURE/CURRENT_PROJECT'], 'output');
        break;

      case 'whoami':
        addLines(['OPERATOR_001'], 'output');
        break;

      case 'cat':
        if (!args[0]) {
          addLines(['ERROR: SPECIFY_FILENAME_PARAMETER'], 'error');
        } else {
          const file = files[args[0]];
          if (file) {
            addLines([file.content], 'output');
          } else {
            addLines([`ERROR: FILE_NOT_FOUND: "${args[0]}"`], 'error');
          }
        }
        break;

      case 'fix':
        addLines(['INITIALIZING_AI_REPAIR_PROTOCOL...', 'ANALYZING_SANDBOX_ERRORS...'], 'info');
        onFix?.();
        break;

      case 'stats':
         const totalChars = Object.values(files).reduce((acc, f) => acc + f.content.length, 0);
         addLines([
           'PROJECT_HEURISTICS:',
           `  FILES: ${Object.keys(files).length}`,
           `  SIZE: ${totalChars.toLocaleString()} CHARS`,
           `  LATENCY: 12MS`,
           `  COLLECTIVE: AI_BRIDGE_ENABLED`
         ], 'success');
        break;

      case 'clear':
        setHistory([]);
        break;

      default:
        addLines([`SHELL: COMMAND_NOT_FOUND: ${cmdLower}`], 'error');
    }

    onCommand?.(cmdLower, args);
    setInput('');
  };

  const addLines = (lines: string[], type: TermLine['type']) => {
    setHistory(prev => [
      ...prev,
      ...lines.map(line => ({ id: crypto.randomUUID(), type, content: line }))
    ]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
       e.preventDefault();
       const next = historyIdx + 1;
       if (next < cmdHistory.length) {
         setHistoryIdx(next);
         setInput(cmdHistory[next]);
       }
    } else if (e.key === 'ArrowDown') {
       e.preventDefault();
       const next = historyIdx - 1;
       if (next >= 0) {
         setHistoryIdx(next);
         setInput(cmdHistory[next]);
       } else {
         setHistoryIdx(-1);
         setInput('');
       }
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#050505] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group/term selection:bg-primary/30"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50" />
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 h-12 bg-white/5 border-b border-white/5 relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">ROOT://AI_CORE_SHELL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              <span className="text-[8px] font-black text-primary uppercase">PID_432.0</span>
           </div>
           <Monitor className="w-3.5 h-3.5 text-zinc-600" />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-1.5 custom-scrollbar relative z-10"
      >
        {history.map((line) => (
          <div 
            key={line.id} 
            className="flex gap-3 animate-in fade-in duration-300"
          >
            {line.prefix && (
              <span className="text-primary font-black shrink-0 tracking-tighter italic">{line.prefix}</span>
            )}
            <pre className={cn(
              "whitespace-pre-wrap break-all leading-relaxed",
              line.type === 'error' ? "text-rose-400" : 
              line.type === 'success' ? "text-emerald-400" : 
              line.type === 'info' ? "text-primary italic" : 
              line.type === 'input' ? "text-white font-black" : "text-zinc-400 font-medium"
            )}>
              {line.content}
            </pre>
          </div>
        ))}
        
        <div className="flex gap-3 items-center text-white">
          <span className="text-primary font-black shrink-0 tracking-tighter italic">ROOT@AI_CORE:~#</span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full bg-transparent border-none outline-none font-black italic p-0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            {input === '' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-primary/80 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function CommandLineIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
