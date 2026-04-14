import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle, Plus, Download, Upload, Trash2, Power, PowerOff,
  Search, Tag, Sparkles, ChevronDown, ChevronUp, Check,
  AlertCircle, Code, Copy, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  usePluginStore,
  type GenesisPlugin,
  type GenesisTemplate,
  type TemplateCategory,
} from '@/stores';

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginManager({ isOpen, onClose }: PluginManagerProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'create'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const {
    plugins,
    templates,
    categories,
    activePluginIds,
    registerPlugin,
    unregisterPlugin,
    activatePlugin,
    deactivatePlugin,
    exportPlugin,
    importPlugin,
    searchTemplates,
    getTemplatesByCategory,
  } = usePluginStore();

  const filteredTemplates = selectedCategory === 'all'
    ? templates.filter(t =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getTemplatesByCategory(selectedCategory).filter(t =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const plugin = importPlugin(text);
        if (plugin) {
          toast.success(`Plugin ${plugin.name} importado exitosamente`);
        }
      } catch (err) {
        toast.error('Error al importar plugin');
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  }, [importPlugin]);

  const handleExport = useCallback((pluginId: string) => {
    const json = exportPlugin(pluginId);
    if (!json) {
      toast.error('No se pudo exportar el plugin');
      return;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genesis-plugin-${pluginId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Plugin exportado');
  }, [exportPlugin]);

  const handleCopyTemplate = useCallback((template: GenesisTemplate) => {
    navigator.clipboard.writeText(template.prompt);
    toast.success('Prompt copiado al portapapeles');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Puzzle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Plugin Manager</h2>
              <p className="text-sm text-zinc-500">{templates.length} templates • {plugins.length} plugins</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-6 border-b border-zinc-100">
          <div className="flex items-center gap-1">
            {(['browse', 'installed', 'create'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex"
              >
                {/* Sidebar - Categories */}
                <div className="w-64 border-r border-zinc-100 p-4 overflow-y-auto">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 mb-4">
                    <Search className="h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar templates..."
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        selectedCategory === 'all'
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-600 hover:bg-zinc-100"
                      )}
                    >
                      <span>🌐</span>
                      Todos
                      <span className="ml-auto text-xs opacity-60">{templates.length}</span>
                    </button>

                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                          selectedCategory === cat.id
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-600 hover:bg-zinc-100"
                        )}
                      >
                        <span>{cat.emoji}</span>
                        {cat.label}
                        <span className="ml-auto text-xs opacity-60">
                          {getTemplatesByCategory(cat.id).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onCopy={() => handleCopyTemplate(template)}
                      />
                    ))}
                  </div>

                  {filteredTemplates.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                      <Search className="h-12 w-12 mb-4" />
                      <p>No se encontraron templates</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'installed' && (
              <motion.div
                key="installed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full p-6 overflow-y-auto"
              >
                <div className="space-y-4">
                  {plugins.map((plugin) => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      isActive={activePluginIds.includes(plugin.id)}
                      isExpanded={expandedPlugin === plugin.id}
                      onToggle={() => setExpandedPlugin(
                        expandedPlugin === plugin.id ? null : plugin.id
                      )}
                      onActivate={() => activatePlugin(plugin.id)}
                      onDeactivate={() => deactivatePlugin(plugin.id)}
                      onExport={() => handleExport(plugin.id)}
                      onDelete={() => unregisterPlugin(plugin.id)}
                    />
                  ))}

                  {plugins.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                      <Puzzle className="h-12 w-12 mb-4" />
                      <p>No hay plugins instalados</p>
                      <button
                        onClick={() => setActiveTab('browse')}
                        className="mt-4 text-primary hover:underline"
                      >
                        Explorar templates
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'create' && (
              <CreatePluginForm
                onCreate={(plugin) => {
                  registerPlugin(plugin);
                  toast.success(`Plugin ${plugin.name} creado`);
                  setActiveTab('installed');
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-components
function TemplateCard({
  template,
  onCopy
}: {
  template: GenesisTemplate;
  onCopy: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      layout
      className="group p-4 rounded-2xl border border-zinc-200 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 truncate">{template.label}</h3>
          <p className="text-sm text-zinc-500 line-clamp-2">{template.description}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              template.complexity === 'basic' && "bg-green-100 text-green-700",
              template.complexity === 'medium' && "bg-yellow-100 text-yellow-700",
              template.complexity === 'advanced' && "bg-red-100 text-red-700"
            )}>
              {template.complexity}
            </span>
            {template.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-zinc-100 transition-all"
        >
          <Copy className="h-4 w-4 text-zinc-400" />
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-zinc-100"
          >
            <p className="text-xs text-zinc-500 font-mono line-clamp-4">
              {template.prompt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PluginCard({
  plugin,
  isActive,
  isExpanded,
  onToggle,
  onActivate,
  onDeactivate,
  onExport,
  onDelete
}: {
  plugin: GenesisPlugin;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={onToggle}
      >
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          isActive ? "bg-primary/10 text-primary" : "bg-zinc-100 text-zinc-400"
        )}
        >
          <Puzzle className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{plugin.name}</h3>
            <span className="text-xs text-zinc-400">v{plugin.version}</span>
            {plugin.isBuiltIn && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                Built-in
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">{plugin.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDeactivate(); }}
              className="p-2 rounded-lg text-green-600 hover:bg-green-50"
            >
              <Power className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onActivate(); }}
              className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100"
            >
              <PowerOff className="h-5 w-5" />
            </button>
          )}

          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-zinc-100"
          >
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2">Templates ({plugin.templates.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {plugin.templates.map((t) => (
                    <span
                      key={t.id}
                      className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-sm flex items-center gap-2"
                    >
                      {t.emoji} {t.label}
                    </span>
                  ))}
                </div>
              </div>

              {!plugin.isBuiltIn && (
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                  <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreatePluginForm({ onCreate }: { onCreate: (plugin: GenesisPlugin) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateJson, setTemplateJson] = useState('');

  const handleSubmit = () => {
    try {
      const templates = JSON.parse(templateJson);
      const plugin: GenesisPlugin = {
        id: `custom-${Date.now()}`,
        name,
        description,
        version: '1.0.0',
        author: 'User',
        templates: Array.isArray(templates) ? templates : [templates],
        isActive: true,
        isBuiltIn: false,
        installDate: new Date().toISOString(),
      };
      onCreate(plugin);
    } catch (err) {
      toast.error('JSON inválido');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full p-6 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Nombre del Plugin
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="Mi Plugin de Templates"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            placeholder="Descripción de qué hace este plugin..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Templates (JSON)
          </label>
          <textarea
            value={templateJson}
            onChange={(e) => setTemplateJson(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-mono text-sm"
            placeholder={`[\n  {\n    "id": "mi-template",\n    "label": "Mi Template",\n    "category": "saas",\n    "emoji": "🚀",\n    "description": "...",\n    "tags": ["react"],\n    "complexity": "medium",\n    "prompt": "..."\n  }\n]`}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || !templateJson}
          className="w-full py-3 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Crear Plugin
        </button>
      </div>
    </motion.div>
  );
}
