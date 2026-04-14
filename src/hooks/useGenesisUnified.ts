import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useProjectStore,
  useStudioStore,
  useChatStore,
  usePluginStore,
  resetAllStores,
  initializeProjectSession,
  type StudioProject,
  type StudioFile,
  type Message,
} from '@/stores';
import { aiCache } from '@/services/ai-cache';
import { aiService, MODEL_COSTS } from '@/services/ai-service';
import { useAuth } from './useAuth';

interface UseGenesisUnifiedOptions {
  projectId?: string | null;
}

export function useGenesisUnified({ projectId }: UseGenesisUnifiedOptions = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Project Store
  const {
    projects,
    activeProject,
    loading: projectsLoading,
    fetchProjects,
    createProject,
    updateProjectFiles,
    renameProject,
    deleteProject,
    duplicateProject,
    hardResetProject,
    rollbackFiles,
    canUndo,
    setActiveProject,
  } = useProjectStore();

  // Studio Store
  const {
    viewMode,
    deviceMode,
    activeFile,
    isSidebarCollapsed,
    isFullscreen,
    isSaving,
    isGenerating,
    agentPhase,
    activeSpecialist,
    streamChars,
    streamPreview,
    artifacts,
    tasks,
    logs,
    runtimeError,
    setViewMode,
    setDeviceMode,
    setActiveFile,
    setSidebarCollapsed,
    setFullscreen,
    setSaving,
    setGenerating,
    toggleSidebar,
    toggleFullscreen,
    setAgentPhase,
    setActiveSpecialist,
    setStreamChars,
    addArtifact,
    updateArtifact,
    clearArtifacts,
    addTask,
    updateTask,
    setTasks,
    clearTasks,
    addLog,
    clearLogs,
    setRuntimeError,
    clearRuntimeError,
    resetStudio,
  } = useStudioStore();

  // Chat Store
  const {
    messages,
    input,
    isStreaming,
    selectedModel,
    isArchitectMode,
    pendingImage,
    pendingUrl,
    pendingContext,
    copiedId,
    showScrollBtn,
    isScraping,
    isAutoFixing,
    setMessages,
    addMessage,
    updateMessage,
    clearMessages,
    setInput,
    setStreaming,
    setSelectedModel,
    setArchitectMode,
    setPendingImage,
    setPendingUrl,
    setPendingContext,
    clearPending,
    setCopiedId,
    setShowScrollBtn,
    setIsScraping,
    setIsAutoFixing,
    saveMessage,
    loadConversation,
    resetConversation,
  } = useChatStore();

  // Plugin Store
  const {
    templates,
    categories,
    searchTemplates,
    getTemplateById,
    getTemplatesByCategory,
  } = usePluginStore();

  // Refs for tracking
  const prevFileCountRef = useRef(0);
  const autoFixCountRef = useRef(0);
  const lastAutoFixErrorRef = useRef('');

  // Initialize on mount
  useEffect(() => {
    if (user?.id) {
      fetchProjects(user.id);
    }
  }, [user?.id, fetchProjects]);

  // Handle project selection
  useEffect(() => {
    if (!projectsLoading && projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setActiveProject(project);
        initializeProjectSession(projectId);
      } else {
        navigate('/studio');
      }
    } else if (!projectId) {
      setActiveProject(null);
    }
  }, [projectId, projects, projectsLoading, navigate, setActiveProject]);

  // Auto-select first file
  useEffect(() => {
    if (activeProject && !activeFile) {
      const files = Object.keys(activeProject.files);
      if (files.includes('App.tsx')) {
        setActiveFile('App.tsx');
      } else if (files.length > 0) {
        setActiveFile(files[0]);
      }
    }
  }, [activeProject, activeFile, setActiveFile]);

  // Reset conversation on hard reset
  useEffect(() => {
    const currentCount = Object.keys(activeProject?.files || {}).length;
    if (prevFileCountRef.current > 0 && currentCount === 0) {
      resetConversation(projectId || '');
    }
    prevFileCountRef.current = currentCount;
  }, [activeProject?.files, projectId, resetConversation]);

  // File Operations
  const handleFilesChange = useCallback(
    async (newFiles: Record<string, StudioFile>) => {
      if (!activeProject) return;
      setSaving(true);
      await updateProjectFiles(activeProject.id, newFiles);
      setSaving(false);
    },
    [activeProject, updateProjectFiles, setSaving]
  );

  const handleAddFile = useCallback(
    (name: string) => {
      if (!activeProject) return;
      const lang = name.endsWith('.tsx') || name.endsWith('.ts')
        ? 'tsx'
        : name.endsWith('.css')
        ? 'css'
        : name.endsWith('.json')
        ? 'json'
        : name.endsWith('.html')
        ? 'html'
        : 'typescript';

      const newFiles = {
        ...activeProject.files,
        [name]: { language: lang, content: `// ${name}\n` },
      };
      handleFilesChange(newFiles);
      setActiveFile(name);
    },
    [activeProject, handleFilesChange, setActiveFile]
  );

  const handleDeleteFile = useCallback(
    (name: string) => {
      if (!activeProject) return;
      const newFiles = { ...activeProject.files };
      delete newFiles[name];
      if (activeFile === name) {
        const remaining = Object.keys(newFiles);
        setActiveFile(remaining[0] ?? null);
      }
      handleFilesChange(newFiles);
    },
    [activeProject, activeFile, handleFilesChange, setActiveFile]
  );

  const handleRenameFile = useCallback(
    (oldName: string, newName: string) => {
      if (!activeProject || oldName === newName) return;
      const newFiles = { ...activeProject.files };
      newFiles[newName] = newFiles[oldName];
      delete newFiles[oldName];
      if (activeFile === oldName) {
        setActiveFile(newName);
      }
      handleFilesChange(newFiles);
    },
    [activeProject, activeFile, handleFilesChange, setActiveFile]
  );

  // Code Generation with Cache
  const generateCode = useCallback(
    async (prompt: string, options: { useCache?: boolean } = {}) => {
      if (!activeProject || !user) {
        toast.error('No active project or user');
        return null;
      }

      setGenerating(true);
      setAgentPhase('thinking');
      addLog({ type: 'info', message: `Iniciando generación: ${prompt.slice(0, 50)}...` });

      try {
        // Check cache
        if (options.useCache !== false) {
          const cached = await aiCache.get(prompt, {
            projectId: activeProject.id,
            files: Object.keys(activeProject.files),
          });

          if (cached) {
            addLog({ type: 'success', message: 'Respuesta recuperada de caché' });
            setGenerating(false);
            setAgentPhase('done');
            return cached;
          }
        }

        // Call AI service
        const response = await aiService.processAction({
          action: 'chat',
          prompt,
          model: selectedModel,
          persona: 'genesis',
        });

        // Cache the response
        const cost = MODEL_COSTS[selectedModel] || 1;
        await aiCache.set(
          prompt,
          response,
          selectedModel,
          cost,
          {
            projectId: activeProject.id,
            files: Object.keys(activeProject.files),
          },
          1000 * 60 * 60 * 24 // 24h TTL
        );

        addLog({ type: 'success', message: 'Generación completada exitosamente' });
        setAgentPhase('done');
        return response;
      } catch (err: any) {
        console.error('Generation error:', err);
        addLog({ type: 'error', message: err.message });
        setRuntimeError(err.message);
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    [activeProject, user, selectedModel, setGenerating, setAgentPhase, addLog, setRuntimeError]
  );

  // Message Handling
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!user || !activeProject) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      addMessage(userMsg);
      setInput('');
      await saveMessage(activeProject.id, 'user', text);

      // Reset auto-fix counters
      if (!text.includes('[AUTO-FIX]')) {
        autoFixCountRef.current = 0;
        lastAutoFixErrorRef.current = '';
      }

      try {
        const result = await generateCode(text);
        if (!result) return;

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.text || 'Código generado.',
          timestamp: new Date(),
          type: result.files ? 'code' : undefined,
        };

        addMessage(assistantMsg);
        await saveMessage(activeProject.id, 'assistant', assistantMsg.content);

        // Update files if present
        if (result.files && typeof result.files === 'object') {
          const newFiles = { ...activeProject.files, ...result.files };
          await handleFilesChange(newFiles);
          setViewMode('preview');
        }
      } catch (err: any) {
        toast.error(`Error: ${err.message}`);
      }
    },
    [user, activeProject, addMessage, setInput, saveMessage, generateCode, handleFilesChange, setViewMode]
  );

  // Auto-fix logic
  const handleAutoFix = useCallback(
    async (error: string) => {
      if (!error || isGenerating || !user) return;
      if (error === lastAutoFixErrorRef.current) return;
      if (autoFixCountRef.current >= 3) return;

      // Skip raw JSON errors
      if (error.includes('"explanation"') || error.includes('"files"')) {
        return;
      }

      lastAutoFixErrorRef.current = error;
      autoFixCountRef.current += 1;
      setIsAutoFixing(true);

      setTimeout(async () => {
        const fixPrompt = `[AUTO-FIX] Error detectado:
\`\`\`
${error}
\`\`\`

POR FAVOR, corrige este error analizando el estado actual de los archivos.`;

        await handleSendMessage(fixPrompt);
        setIsAutoFixing(false);
      }, 2500);
    },
    [isGenerating, user, handleSendMessage, setIsAutoFixing]
  );

  // Template operations
  const applyTemplate = useCallback(
    async (templateId: string) => {
      if (!activeProject) {
        toast.error('No hay proyecto activo');
        return;
      }

      const template = getTemplateById(templateId);
      if (!template) {
        toast.error('Template no encontrado');
        return;
      }

      setGenerating(true);
      addLog({ type: 'info', message: `Aplicando template: ${template.label}` });

      try {
        const response = await generateCode(template.prompt, { useCache: false });
        if (response?.files) {
          const newFiles = { ...activeProject.files, ...response.files };
          await handleFilesChange(newFiles);
          toast.success(`Template ${template.label} aplicado`);
        }
      } catch (err) {
        toast.error('Error aplicando template');
      } finally {
        setGenerating(false);
      }
    },
    [activeProject, getTemplateById, generateCode, handleFilesChange, setGenerating, addLog]
  );

  // Reset project
  const handleHardReset = useCallback(
    async () => {
      if (!activeProject) return false;
      const ok = await hardResetProject(activeProject.id);
      if (ok) {
        clearArtifacts();
        clearTasks();
        clearLogs();
        setActiveFile('App.tsx');
        setViewMode('preview');
      }
      return ok;
    },
    [
      activeProject,
      hardResetProject,
      clearArtifacts,
      clearTasks,
      clearLogs,
      setActiveFile,
      setViewMode,
    ]
  );

  // Navigation
  const goToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const createNewProject = useCallback(
    async (name = 'Nuevo Proyecto') => {
      if (!user?.id) return null;
      const project = await createProject(user.id, name);
      if (project) {
        navigate(`/studio?project=${project.id}`);
      }
      return project;
    },
    [user?.id, createProject, navigate]
  );

  return {
    // Project
    projects,
    activeProject,
    projectsLoading,
    setActiveProject,

    // Studio UI
    viewMode,
    deviceMode,
    activeFile,
    isSidebarCollapsed,
    isFullscreen,
    isSaving,
    isGenerating,
    agentPhase,
    activeSpecialist,
    streamChars,
    streamPreview,
    artifacts,
    tasks,
    logs,
    runtimeError,

    // Chat
    messages,
    input,
    isStreaming,
    selectedModel,
    isArchitectMode,
    pendingImage,
    pendingUrl,
    pendingContext,
    copiedId,
    showScrollBtn,
    isScraping,
    isAutoFixing,

    // Plugins
    templates,
    categories,

    // Actions
    setViewMode,
    setDeviceMode,
    setActiveFile,
    setSidebarCollapsed,
    setFullscreen,
    toggleSidebar,
    toggleFullscreen,
    setInput,
    setSelectedModel,
    setArchitectMode,
    setPendingImage,
    setPendingUrl,
    setPendingContext,
    clearPending,
    setCopiedId,
    setShowScrollBtn,

    // File operations
    handleFilesChange,
    handleAddFile,
    handleDeleteFile,
    handleRenameFile,

    // Generation
    generateCode,
    handleSendMessage,
    handleAutoFix,

    // Templates
    applyTemplate,
    searchTemplates,
    getTemplateById,
    getTemplatesByCategory,

    // Project lifecycle
    createNewProject,
    handleHardReset,
    goToDashboard,
    renameProject,
    deleteProject,
    duplicateProject: (project: StudioProject) =>
      user?.id ? duplicateProject(user.id, project) : Promise.resolve(null),
    rollbackFiles,
    canUndo,

    // Stats
    fetchProjects: () => (user?.id ? fetchProjects(user.id) : Promise.resolve()),
  };
}
