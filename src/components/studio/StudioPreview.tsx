import { useState, useEffect, useRef, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpackConsole,
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
      setRefreshKey(r => r + 1);
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
    <div className="flex h-full flex-col overflow-hidden bg-white selection:bg-primary/10">
      <div className="flex flex-1 items-start justify-center overflow-auto relative bg-[#F8FAFC]">
        
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 overflow-hidden"
            style={{ 
              background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 1) 100%)',
              backdropFilter: 'blur(40px)'
            }}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                   backgroundSize: '40px 40px' 
                 }} />

            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.1, 0.2, 0.1],
                x: [-50, 50, -50],
                y: [30, -30, 30]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-300 rounded-full blur-[140px] pointer-events-none"
            />

            <div className="relative flex items-center justify-center mb-16 scale-110">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: 10 + (i * 3), repeat: Infinity, ease: "linear" }}
                  className="absolute rounded-full border border-zinc-100"
                  style={{ 
                    width: `${140 + (i * 50)}px`, 
                    height: `${140 + (i * 50)}px`,
                    borderColor: i === 1 ? 'rgba(59,130,246,0.1)' : 'rgba(228,228,231,0.3)',
                    borderStyle: i === 2 ? 'dashed' : 'solid'
                  }}
                />
              ))}

              <motion.div 
                animate={{ 
                  boxShadow: [
                    '0 0 0 0px rgba(59, 130, 246, 0)',
                    '0 0 0 15px rgba(59, 130, 246, 0.05)',
                    '0 0 0 0px rgba(59, 130, 246, 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative z-10 w-32 h-32 bg-white border border-zinc-100 rounded-[2.5rem] flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.05)]"
              >
                <div className="relative">
                  <Bot className="w-12 h-12 text-primary stroke-[1.25]" />
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-md"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center relative z-40"
            >
              <h3 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-4">
                Manifestando Visión
              </h3>
              
              <div className="inline-flex items-center gap-3 py-2 px-6 bg-zinc-900 text-white rounded-3xl shadow-lg">
                 <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                 <p className="text-[10px] font-black tracking-[0.2em] uppercase">
                   Secuencia v21.0 <span className="text-zinc-500 mx-1">{"\u002F"}</span> Activa
                 </p>
              </div>

              {streamChars > 0 && (
                <div className="mt-6 flex flex-col items-center gap-1">
                  <span className="text-[8px] text-zinc-400 font-bold tracking-[0.2em] uppercase">Data Stream</span>
                  <div className="font-mono text-base font-bold text-primary">
                    {(streamChars / 1024).toFixed(1)} <span className="text-[9px] text-zinc-400">KB</span>
                  </div>
                </div>
              )}
            </motion.div>

            <div className="absolute bottom-12 flex flex-col items-center gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-100 rounded-full bg-white shadow-sm">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Sincronizado</span>
               </div>
               <div className="w-16 h-[2px] bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full bg-primary"
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
            className="flex-shrink-0 flex flex-col shadow-xl rounded-2xl overflow-hidden bg-white mt-10 mb-10 border border-zinc-100"
          >
            <SandpackProvider
              key={sandpackKey}
              template="react-ts"
              files={sandpackFiles}
              theme="light"
              options={{ externalResources: ['https://cdn.tailwindcss.com'] }}
            >
              <SandpackLayout style={{ border: 'none', height: '100%' }}>
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
          <div className="flex flex-col items-center justify-center h-full text-zinc-200">
            <Zap className="w-16 h-16 mb-4 opacity-20 stroke-[1]" />
            <p className="font-bold uppercase tracking-[0.4em] text-[9px]">En Espera</p>
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
  const { logs } = useSandpackConsole();
  
  useEffect(() => {
    const lastError = logs.find(log => log.method === 'error');
    if (lastError && onError) {
      onError(lastError.data.map(d => String(d)).join(' '));
    }
  }, [logs, onError]);

  return null;
}
