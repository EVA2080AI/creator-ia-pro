import { useState, useEffect, useRef, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  Zap, Bot, AlertCircle, X, TerminalSquare, Loader2
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
  isGenerating = false,
  streamChars = 0,
  supabaseConfig,
  onError,
  viewMode,
  onToggleViewMode,
  isSidebarCollapsed,
  onToggleSidebar,
}: StudioPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sandpackKey, setSandpackKey] = useState(0);
  const prevFilesRef = useRef<Record<string, StudioFile>>({});
  const [compilationStatus, setCompilationStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');

  // When files change from generating or manual edits, reset status
  useEffect(() => {
    if (!isGenerating && JSON.stringify(prevFilesRef.current) !== JSON.stringify(files)) {
      prevFilesRef.current = files;
      setSandpackKey(k => k + 1);
      setRefreshKey(r => r + 1);
      setCompilationStatus('compiling');
    }
  }, [isGenerating, files]);

  const isVanillaHtml = useMemo(() => {
    const vals = Object.values(files);
    return vals.some(f => f.language === 'html' || f.language === 'javascript') && 
           !vals.some(f => f.language === 'tsx' || f.language === 'jsx');
  }, [files]);
  
  const sandpackFiles = useMemo(() => 
    toSandpackFiles(files, supabaseConfig, isVanillaHtml), 
    [files, supabaseConfig, isVanillaHtml]
  );
  
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
  const frameWidth: Record<DeviceMode, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };
  const frameHeight: Record<DeviceMode, string | undefined> = { desktop: undefined, tablet: '1024px', mobile: '812px' };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white selection:bg-primary/10 relative">
      <div className="flex flex-1 items-start justify-center overflow-auto relative bg-[#FAFAFA]">
        
        {/* DOT GRID BACKGROUND */}
        <div className="absolute inset-0 opacity-[0.4]" 
             style={{ 
               backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }} />

        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FAFAFA]/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="relative z-10 flex flex-col items-center max-w-sm w-full bg-white p-8 rounded-3xl shadow-2xl border border-zinc-100"
              >
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200 flex items-center justify-center mb-6">
                  <TerminalSquare className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-2">
                  Construyendo Visión...
                </h2>
                <p className="text-sm text-zinc-500 mb-6 text-center leading-relaxed">
                  Génesis Engine está ensamblando y orquestando la arquitectura solicitada.
                </p>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                   <motion.div 
                     className="h-full bg-zinc-900"
                     animate={{ width: ["0%", "100%"] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   />
                </div>
                {streamChars > 0 && (
                  <div className="font-mono text-[10px] text-zinc-400 mt-4 uppercase tracking-wider font-semibold">
                    {streamChars} Bytes Procesados
                  </div>
                )}
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
            key={refreshKey}
            style={{
              width: deviceMode === 'desktop' ? '100%' : frameWidth[deviceMode],
              height: deviceMode === 'desktop' ? '100%' : frameHeight[deviceMode],
              transformOrigin: 'top center',
            }}
            className={\`\${deviceMode === 'desktop' ? 'h-full w-full' : 'my-8 rounded-3xl shadow-2xl shadow-black/5'} flex-shrink-0 flex flex-col overflow-hidden bg-white border border-zinc-200/60 z-10 relative\`}
          >
            <SandpackProvider
              key={sandpackKey}
              template={isVanillaHtml ? "static" : "react-ts"}
              files={sandpackFiles}
              theme="light"
              options={{ externalResources: isVanillaHtml ? [] : ['https://cdn.tailwindcss.com'] }}
            >
              <div className="relative h-full w-full bg-white">
                
                {/* ── SUBTLE COMPILATION TOAST ── */}
                <AnimatePresence>
                  {compilationStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-2xl shadow-xl shadow-red-500/20 font-medium text-xs pointer-events-auto"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="max-w-[200px] md:max-w-md truncate">Problema detectado. Revisa tus logs o pide soporte.</span>
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
                      Ensamblando módulos...
                    </motion.div>
                  )}
                </AnimatePresence>

                <SandpackLayout style={{ border: 'none', height: '100%', background: 'transparent' }}>
                  <SandpackPreview 
                    showOpenInCodeSandbox={false} 
                    showRefreshButton={false} 
                    showSandpackErrorOverlay={true}
                    style={{ height: '100%', background: 'transparent' }} 
                  />
                </SandpackLayout>
                <SandpackErrorBridge 
                  onError={onError} 
                  onStatusChange={setCompilationStatus} 
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
