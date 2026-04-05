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
    { id: 'init-1', type: 'info', content: 'Genesis Shell v10.0.4.5-stable (Professional Ed.)' },
    { id: 'init-2', type: 'info', content: 'Iniciando conexión con Core API...' },
    { id: 'init-3', type: 'success', content: 'Conectado a Genesis Cloud Engine. Listo.' },
    { id: 'init-4', type: 'output', content: 'Escribe "help" para ver los comandos disponibles.' },
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
    setHistory(prev => [...prev, { id: crypto.randomUUID(), type: 'input', content: trimmed, prefix: '>' }]);
    setCmdHistory(prev => [trimmed, ...prev]);
    setHistoryIdx(-1);

    const [cmd, ...args] = trimmed.split(/\s+/);
    const cmdLower = cmd.toLowerCase();

    // Virtual Shell Logic
    switch (cmdLower) {
      case 'help':
        addLines([
          'Comandos disponibles:',
          '  ls              Lista los archivos del proyecto',
          '  cat <archivo>   Muestra el contenido de un archivo',
          '  genesis fix     Inicia el bucle de auto-corrección IA',
          '  genesis stats   Muestra estadísticas del proyecto',
          '  clear           Limpia la terminal',
          '  pwd             Muestra el directorio actual (virtual)',
          '  whoami          Muestra la identidad del usuario',
          '  help            Muestra este mensaje'
        ], 'output');
        break;

      case 'ls':
        const fileList = Object.keys(files).map(f => `  ${f}`).join('\n');
        addLines([fileList || 'No hay archivos.'], 'output');
        break;

      case 'pwd':
        addLines(['/Users/genesis/project'], 'output');
        break;

      case 'whoami':
        addLines(['genesis_operator_alpha'], 'output');
        break;

      case 'cat':
        if (!args[0]) {
          addLines(['Error: Especifica un nombre de archivo (ej: cat App.tsx)'], 'error');
        } else {
          const file = files[args[0]];
          if (file) {
            addLines([file.content], 'output');
          } else {
            addLines([`Error: El archivo "${args[0]}" no existe.`], 'error');
          }
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'antigravity':
        addLines([
          'Accediendo a Antigravity Strategic Core...',
          'ESTADO: Activo y Sincronizado',
          'VINCULACIÓN: Master Brain Protocol 8.0',
          'DIRECTIVA: Maximizar impacto de mercado mediante ejecución técnica superior.'
        ], 'info');
        window.dispatchEvent(new CustomEvent('GENESIS_LOG', { 
           detail: { message: 'Consulta de estado iniciada por Antigravity Core.', type: 'info', source: 'Antigravity' } 
        }));
        break;

      case 'genesis':
        if (args[0] === 'fix') {
          addLines(['Iniciando protocolo de reparación autónoma GENESIS-FIX...'], 'info');
          onFix?.();
        } else if (args[0] === 'stats') {
          const totalChars = Object.values(files).reduce((acc, f) => acc + f.content.length, 0);
          addLines([
            'PROYECTO: GENESIS-ACTIVE-SYNC',
            `ARCHIVOS: ${Object.keys(files).length}`,
            `TAMAÑO: ${totalChars.toLocaleString()} caracteres`,
            `INTEGRIDAD: 98.4% (Sin errores críticos)`,
            'DENSIDAD IA: Optimizada'
          ], 'info');
        } else if (args[0] === 'consult') {
          addLines(['Sincronizando con Antigravity para consultoría estratégica...'], 'info');
          window.dispatchEvent(new CustomEvent('GENESIS_LOG', { 
            detail: { message: 'Iniciando canal de comunicación binaria con Antigravity Engine...', type: 'info', source: 'Bridge' } 
          }));
          // Simulate AI delay
          setTimeout(() => {
             window.dispatchEvent(new CustomEvent('GENESIS_LOG', { 
                detail: { message: 'Antigravity responde: Requiere análisis de viabilidad técnica para escalar la arquitectura.', type: 'success', source: 'Antigravity' } 
             }));
          }, 2000);
        } else {
          addLines(['Comando genesis incompleto. Usa "genesis fix", "genesis stats" o "genesis consult".'], 'error');
        }
        break;

      default:
        addLines([`Comando no reconocido: ${cmdLower}`], 'error');
    }

    onCommand?.(cmdLower, args);
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
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = historyIdx + 1;
      if (newIdx < cmdHistory.length) {
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = historyIdx - 1;
      if (newIdx >= 0) {
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#050505] rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl relative group"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Title Bar */}
      <div className="h-10 bg-zinc-900/50 border-b border-zinc-900/80 flex items-center justify-between px-4 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Genesis Shell (zsh)</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="h-1.5 w-1.5 rounded-full bg-rose-500/30 border border-rose-500/50" />
           <div className="h-1.5 w-1.5 rounded-full bg-amber-500/30 border border-amber-500/50" />
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] custom-scrollbar selection:bg-primary/30"
      >
        <div className="space-y-1.5">
          {history.map((line) => (
            <div key={line.id} className="flex gap-2 group/line">
              {line.prefix && (
                <span className="text-primary font-black shrink-0">{line.prefix}</span>
              )}
              <pre className={cn(
                "whitespace-pre-wrap break-all leading-relaxed",
                line.type === 'error' ? "text-rose-400" :
                line.type === 'success' ? "text-emerald-400" :
                line.type === 'info' ? "text-indigo-400" :
                line.type === 'input' ? "text-white font-bold" :
                "text-zinc-400 font-medium"
              )}>
                {line.content}
              </pre>
            </div>
          ))}
          
          {/* Input Line */}
          <div className="flex gap-2 items-center">
            <span className="text-primary font-black shrink-0">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none text-white font-bold caret-primary"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.03] to-transparent opacity-50" />
      
      {/* Scanline Effect (subtle) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] mix-blend-overlay">
        <div className="h-[2px] w-full bg-white animate-scanline" />
      </div>

      <style>{`
        @keyframes scanline {
          from { transform: translateY(-100%); }
          to { transform: translateY(1000%); }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
      `}</style>
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
