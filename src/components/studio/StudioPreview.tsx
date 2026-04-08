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
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-black"
          >
            <div className="absolute inset-0 opacity-[0.1]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                   backgroundSize: '40px 40px' 
                 }} />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center text-center space-y-6"
            >
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase shadow-black drop-shadow-2xl">
                GENESIS ENGINE
              </h2>
              <p className="text-[10px] md:text-xs text-zinc-400 tracking-[0.3em] font-medium uppercase">
                ARCHITECTURE VERIFIED - VITE V5.0
              </p>
              
              <div className="pt-8 flex flex-col items-center gap-3">
                 <div className="w-32 h-[2px] bg-zinc-800 rounded-full overflow-hidden relative">
                    <motion.div 
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 w-1/2 bg-white"
                    />
                 </div>
                 {streamChars > 0 && (
                   <div className="font-mono text-[10px] text-zinc-500 tracking-widest mt-2">
                     SYNC: {(streamChars / 1024).toFixed(1)} KB
                   </div>
                 )}
              </div>
            </motion.div>
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
