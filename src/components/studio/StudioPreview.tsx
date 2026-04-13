import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  Zap, Bot, AlertCircle, X, Terminal, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import type { StudioFile } from '@/hooks/useStudioProjects';
import type { SupabaseConfig } from './StudioCloud';
import { StudioViewToolbar } from './StudioViewToolbar';
import { toSandpackFiles } from './utils/sandpack-utils';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StudioPreviewProps {
  files: Record<string, StudioFile>;
  deviceMode?: DeviceMode;
  onDeviceModeChange?: (mode: DeviceMode) => void;
  isGenerating?: boolean;
  streamChars?: number;
  streamPreview?: string;
  supabaseConfig?: SupabaseConfig | null;
  onError?: (error: string) => void;
  viewMode: 'preview' | 'code';
  onToggleViewMode: (mode: 'preview' | 'code') => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onShare?: () => void;
}

export function StudioPreview({
  files,
  deviceMode = 'desktop',
  onDeviceModeChange,
  isGenerating = false,
  streamChars = 0,
  supabaseConfig,
  onError,
  viewMode,
  onToggleViewMode,
  isSidebarCollapsed,
  onToggleSidebar,
  isFullscreen,
  onToggleFullscreen,
  onShare,
}: StudioPreviewProps) {
  const [sandpackKey, setSandpackKey] = useState(0);
  const [showConsole, setShowConsole] = useState(false);
  const prevFilesRef = useRef<string>('');
  const [compilationStatus, setCompilationStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isGenerating && Object.keys(files).length > 0) {
      const currentFilesHash = JSON.stringify(Object.keys(files).sort());
      if (prevFilesRef.current !== currentFilesHash) {
        prevFilesRef.current = currentFilesHash;
        setSandpackKey(k => k + 1);
        setCompilationStatus('compiling');
      }
    }
  }, [isGenerating, files]);

  const isVanillaHtml = useMemo(() => {
    const vals = Object.values(files);
    const hasTJSX = vals.some(f => f.language === 'tsx' || f.language === 'jsx');
    const hasHtml = vals.some(f => f.language === 'html' || f.language === 'javascript');
    return hasHtml && !hasTJSX;
  }, [files]);
  
  const sandpackFiles = useMemo(() => {
    return toSandpackFiles(files, supabaseConfig, isVanillaHtml);
  }, [files, supabaseConfig, isVanillaHtml]);
  
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'FIGMA_EXTRACT_RESULT') {
        const json = JSON.stringify(e.data.data, null, 2);
        navigator.clipboard.writeText(json).then(() => { 
          toast.success('¡Copiado con éxito!'); 
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const hasContent = Object.keys(files).length > 0;
  
  const frameWidth: Record<DeviceMode, string> = { 
    desktop: '100%', 
    tablet: '768px', 
    mobile: '375px' 
  };
  
  const frameHeight: Record<DeviceMode, string | undefined> = { 
    desktop: undefined, 
    tablet: '1024px', 
    mobile: '812px' 
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white relative">
      <div className="flex flex-1 items-start justify-center overflow-auto relative bg-[#FAFAFA]">
        
        <div 
          className="absolute inset-0 opacity-[0.4] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FAFAFA]/95 backdrop-blur-md overflow-hidden"
            >
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div 
                   className="w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                   animate={{ y: ['0vh', '100vh'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <motion.div 
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="relative z-10 flex flex-col items-center max-w-sm w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-zinc-100"
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-[1.75rem] shadow-2xl flex items-center justify-center mb-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <Zap className="w-10 h-10 text-white relative z-10 animate-pulse" />
                </div>
                
                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900 uppercase">
                    Generando IA
                  </h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                    Capacidades Inteligentes Activas
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      className="h-full bg-zinc-900 rounded-full"
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Procesando</span>
                    {streamChars > 0 && (
                      <span className="font-mono text-[10px] text-primary font-black">
                        {streamChars.toLocaleString()} BYTES
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasContent ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
            style={{
              width: (deviceMode === 'desktop' || viewMode === 'code') ? '100%' : frameWidth[deviceMode],
              height: (deviceMode === 'desktop' || viewMode === 'code') ? '100%' : frameHeight[deviceMode],
              transformOrigin: 'top center',
            }}
            className={`${(deviceMode === 'desktop' || viewMode === 'code') ? 'h-full w-full' : 'my-8 rounded-[2.5rem] shadow-2xl shadow-black/10'} flex-shrink-0 flex flex-col overflow-hidden bg-white border border-zinc-200/60 z-10 relative transition-all duration-300`}
          >
            <SandpackProvider
              key={sandpackKey}
              template={isVanillaHtml ? "static" : "react-ts"}
              files={sandpackFiles}
              theme="light"
              customSetup={{
                dependencies: {
                  "lucide-react": "latest",
                  "framer-motion": "latest",
                  "recharts": "latest",
                  "date-fns": "latest",
                  "clsx": "latest",
                  "tailwind-merge": "latest"
                }
              }}
              options={{ 
                externalResources: isVanillaHtml ? [] : ['https://cdn.tailwindcss.com'] 
              }}
            >
              <div className="relative h-full w-full bg-white">
                <AnimatePresence>
                  {compilationStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-2xl shadow-xl shadow-red-500/20 font-medium text-xs pointer-events-auto"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="max-w-[200px] md:max-w-md truncate">Problema detectado. Revisa tus logs.</span>
                      <button 
                        onClick={() => setCompilationStatus('idle')} 
                        className="ml-2 hover:bg-white/20 p-1.5 rounded-xl transition-colors"
                      >
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </motion.div>
                  )}
                  {compilationStatus === 'compiling' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-xl font-medium text-[11px] pointer-events-none"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                      Ensamblando...
                    </motion.div>
                  )}
                </AnimatePresence>

                <SandpackLayout style={{ border: 'none', height: '100%', background: 'transparent', flexDirection: 'column' }}>
                  <div className="flex flex-1 w-full h-full overflow-hidden relative">
                    {viewMode === 'code' && (
                      <div className="flex-1 h-full w-full bg-zinc-50/50">
                        <SandpackCodeEditor 
                          style={{ height: '100%' }} 
                          showTabs={true} 
                          showLineNumbers={true}
                        />
                      </div>
                    )}
                    {viewMode === 'preview' && (
                      <div className="flex-1 flex flex-col relative w-full h-full">
                        <SandpackPreview 
                          showOpenInCodeSandbox={true} 
                          showRefreshButton={true} 
                          showSandpackErrorOverlay={true}
                          style={{ flex: showConsole ? '0 0 60%' : '1 1 100%', background: 'transparent' }} 
                        />
                        {showConsole && (
                          <div className="flex-shrink-0 h-[40%] bg-zinc-950 border-t border-zinc-200/50 overflow-hidden">
                            <SandpackConsole style={{ height: '100%', background: 'transparent' }} />
                          </div>
                        )}
                        <button 
                          onClick={() => setShowConsole(!showConsole)}
                          className="absolute bottom-4 right-4 z-50 bg-zinc-900 text-white px-3 py-2 text-[10px] uppercase tracking-widest font-bold rounded-xl shadow-lg shadow-black/20 flex items-center gap-2 hover:bg-zinc-800 transition-colors"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          {showConsole ? 'Ocultar Logs' : 'Ver Logs'}
                        </button>
                      </div>
                    )}
                  </div>
                </SandpackLayout>
                <SandpackErrorBridge 
                  onError={onError} 
                  onStatusChange={(status) => setCompilationStatus(status)} 
                />
              </div>
            </SandpackProvider>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 z-10">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-black/5 border border-zinc-100 flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-zinc-300" />
            </div>
            <p className="font-bold uppercase tracking-widest text-[11px] text-zinc-500 mb-2">Editor en Reposo</p>
            <p className="text-zinc-400 text-xs text-center max-w-[200px] leading-relaxed">
              Describe lo que deseas construir para inicializar el motor.
            </p>
          </div>
        )}
      </div>
      <StudioViewToolbar 
        viewMode={viewMode} 
        onToggleViewMode={onToggleViewMode} 
        isSidebarCollapsed={isSidebarCollapsed} 
        onToggleSidebar={onToggleSidebar}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onShare={onShare}
      />
    </div>
  );
}

function SandpackErrorBridge({ 
  onError,
  onStatusChange 
}: { 
  onError?: (error: string) => void,
  onStatusChange?: (status: 'compiling' | 'success' | 'error') => void 
}) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    const status = sandpack?.status;
    const error = sandpack?.error;
    
    if (status === 'idle' || status === 'running') {
      onStatusChange?.(error ? 'error' : 'success');
    } else {
      onStatusChange?.('compiling');
    }

    if (error?.message && onError) {
      onError(error.message);
    }
  }, [sandpack?.status, sandpack?.error, onError, onStatusChange]);

  return null;
}
