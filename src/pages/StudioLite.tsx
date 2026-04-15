import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';

// Hooks
import { useGenesisLite } from '@/hooks/useGenesisLite';

// Components
import { StudioChatLite } from '@/components/studio/StudioChatLite';
import { StudioPreview } from '@/components/studio/StudioPreview';
import { StudioCodeEditor } from '@/components/studio/StudioCodeEditor';
import { StudioFileTree } from '@/components/studio/StudioFileTree';

// Utils
import { cn } from '@/lib/utils';

export default function StudioLite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project');

  const genesis = useGenesisLite(projectId);

  // Welcome screen when no project
  if (!genesis.project && !genesis.isLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
        <Helmet><title>Studio | Genesis IA</title></Helmet>

        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10"
        >
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
            GENESIS
          </h1>
          <p className="text-zinc-500 mb-8 text-sm max-w-md">
            Crea sitios web con IA. Escribe lo que necesitas y genera código React en segundos.
          </p>

          <button
            onClick={() => genesis.createProject('Mi Proyecto')}
            className="group px-8 py-4 bg-white text-black rounded-2xl font-semibold text-sm
                       hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Crear Proyecto
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (genesis.isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Helmet><title>Studio | Genesis IA</title></Helmet>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!genesis.project) return null;

  return (
    <div className="h-screen w-full bg-zinc-50 flex overflow-hidden">
      <Helmet><title>Studio | Genesis IA</title></Helmet>

      {/* Chat Sidebar */}
      <div className="w-[400px] shrink-0 border-r border-zinc-200 bg-white">
        <StudioChatLite
          projectName={genesis.project.name}
          projectFiles={genesis.project.files}
          messages={genesis.messages}
          isGenerating={genesis.isGenerating}
          streamContent={genesis.streamContent}
          viewMode={genesis.viewMode}
          selectedModel={genesis.selectedModel}
          onSendMessage={genesis.handleSendMessage}
          onViewModeChange={genesis.setViewMode}
          onBack={() => navigate('/studio')}
          onRename={genesis.renameProject}
          onDelete={genesis.deleteProject}
          onImportHtml={genesis.importHtml}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {genesis.viewMode === 'preview' ? (
          <div className="h-full w-full p-8 bg-zinc-100">
            <div className="h-full w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              {Object.keys(genesis.project.files).length > 0 ? (
                <StudioPreview
                  files={genesis.project.files}
                  viewMode="preview"
                  onToggleViewMode={() => genesis.setViewMode('code')}
                  isSidebarCollapsed={true}
                  onToggleSidebar={() => {}}
                  isFullscreen={false}
                  onToggleFullscreen={() => {}}
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400">
                  <Sparkles className="h-12 w-12 mb-4 text-zinc-300" />
                  <p className="text-sm">Aún no hay código</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Escribe un prompt en el chat para empezar
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex bg-[#080808]">
            <div className="w-64 shrink-0 border-r border-white/10">
              <StudioFileTree
                files={genesis.project.files}
                selectedFile={genesis.activeFile || ''}
                onSelect={(f) => genesis.setActiveFile(f)}
                onAddFile={(name) => {
                  const newFiles = {
                    ...genesis.project.files,
                    [name]: { language: 'tsx', content: `// ${name}\n` }
                  };
                  genesis.updateFiles(newFiles);
                }}
                onDeleteFile={(name) => {
                  const newFiles = { ...genesis.project.files };
                  delete newFiles[name];
                  genesis.updateFiles(newFiles);
                }}
                onRenameFile={() => {}}
              />
            </div>
            <div className="flex-1">
              {genesis.activeFile && genesis.project.files[genesis.activeFile] ? (
                <StudioCodeEditor
                  selectedFile={genesis.activeFile}
                  projectFiles={genesis.project.files}
                  onFilesChange={genesis.updateFiles}
                  isGenerating={genesis.isGenerating}
                  streamPreview={genesis.streamContent}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-600">
                  <p className="text-sm">Selecciona un archivo</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
