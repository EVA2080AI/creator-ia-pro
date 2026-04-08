import { useState, useEffect, useRef, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from '@codesandbox/sandpack-react';
import {
  Zap, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    if (!isGenerating && JSON.stringify(prevFilesRef.current) !== JSON.stringify(files)) {
      prevFilesRef.current = files;
      setSandpackKey(k => k + 1);
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
      if (e.data.type === 'FIGMA_BRIDGE_READY') {
        // Bridge is ready
      }
      if (e.data.type === 'FIGMA_EXTRACT_RESULT') {
        const json = JSON.stringify(e.data.data, null, 2);
        navigator.clipboard.writeText(json).then(() => { 
          toast.success('¡Copiado para Figma con éxito!'); 
        });
      }
      if (e.data.type === 'FIGMA_EXTRACT_ERROR') {
        toast.error('Error al exportar capas: ' + e.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const hasContent = Object.keys(files).length > 0;
  const frameWidth: Record<DeviceMode, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };
  const frameHeight: Record<DeviceMode, string | undefined> = { desktop: undefined, tablet: '1024px', mobile: '812px' };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white font-sans selection:bg-primary/10">
      <div className="flex flex-1 items-start justify-center overflow-auto relative bg-[#F8FAFC]">
        {/* Cinematic Loading Overlay - Clean AI Light Version */}
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 overflow-hidden"
            style={{ 
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0.98) 100%)',
              backdropFilter: 'blur(32px)'
            }}
          >
            {/* Ambient Background Orbs */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [-10, 10, -10] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div 
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2], x: [10, -10, 10] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-purple-50/50 rounded-full blur-[140px] pointer-events-none"
            />

            {/* Core Animation Unit */}
            <div className="relative flex items-center justify-center mb-16">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute w-64 h-64 border border-zinc-200 border-dashed rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-52 h-52 border border-zinc-100 border-t-primary/30 rounded-full"
              />
              <motion.div 
                animate={{ 
                  scale: [0.98, 1.02, 0.98],
                  boxShadow: [
                    '0 20px 50px -12px rgba(0, 0, 0, 0.05)',
                    '0 30px 60px -12px rgba(59, 130, 246, 0.12)',
                    '0 20px 50px -12px rgba(0, 0, 0, 0.05)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-32 h-32 bg-white border border-zinc-100 rounded-[3rem] flex items-center justify-center shadow-lg"
              >
                <div className="relative">
                  <Bot className="w-12 h-12 text-primary stroke-[1.5]" />
                  <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </motion.div>

              <motion.div 
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[-20px] right-[-20px] h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent z-20 blur-[1px]"
              />
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center relative z-40 max-w-sm"
            >
              <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-3">Génesis está creando</h3>
              <div className="flex items-center justify-center gap-4 py-2 px-6 bg-white/50 rounded-2xl border border-zinc-100 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-zinc-500 font-medium text-xs tracking-[0.2em] uppercase">
                  Sincronizando Arquitectura
                </p>
              </div>
              
              {streamChars > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 font-mono text-[10px] text-zinc-400 tracking-widest uppercase"
                >
                  Procesando flujo: <span className="text-primary font-bold">{(streamChars / 1024).toFixed(1)} KB</span>
                </motion.div>
              )}
            </motion.div>

            <div className="absolute bottom-12 flex flex-col items-center gap-3">
               <p className="text-[10px] text-zinc-400 uppercase tracking-[0.4em] font-bold opacity-50">
                Protocolo Soberano v21.0
               </p>
               <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full bg-primary/40"
                  />
               </div>
            </div>
          </motion.div>
        )}

        {hasContent ? (
          <div
            key={refreshKey}
            style={{
              width: deviceMode === 'desktop' ? '100%' : frameWidth[deviceMode],
              height: deviceMode === 'desktop' ? '100%' : frameHeight[deviceMode],
              transformOrigin: 'top center',
            }}
            className="flex-shrink-0 flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-white mt-8 mb-8 border border-zinc-100"
          >
            <SandpackProvider
              key={sandpackKey}
              template="react-ts"
              files={sandpackFiles}
              theme="light"
              options={{ externalResources: ['https://cdn.tailwindcss.com'] }}
            >
              <SandpackLayout style={{ border: 'none', borderRadius: 0, height: '100%' }}>
                <SandpackPreview 
                  showOpenInCodeSandbox={false} 
                  showRefreshButton={false} 
                  style={{ height: '100%', background: '#FFFFFF' }} 
                />
              </SandpackLayout>
              <SandpackErrorBridge onError={onError} />
            </SandpackProvider>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-300">
            <Zap className="w-20 h-20 mb-6 opacity-10 stroke-[1]" />
            <p className="font-semibold uppercase tracking-[0.3em] text-[10px]">Esperando Instrucciones</p>
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

function SandpackErrorBridge({ onError }: { onError?: (error: string) => void }) {
  const { console: consoleLogs } = useSandpackConsole();
  
  useEffect(() => {
    const lastError = consoleLogs.find(log => log.method === 'error');
    if (lastError && onError) {
      onError(lastError.data.map(d => String(d)).join(' '));
    }
  }, [consoleLogs, onError]);

  return null;
}
