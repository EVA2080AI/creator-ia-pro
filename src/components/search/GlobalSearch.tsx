import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, Sparkles, Folder, FileText, Image, MessageSquare, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'project' | 'asset' | 'chat' | 'tool' | 'page';
  title: string;
  subtitle?: string;
  icon: typeof Sparkles;
  action: () => void;
  category: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Mock search data - in production this would search actual data
  const searchData: SearchResult[] = [
    { id: '1', type: 'page', title: 'Dashboard', category: 'Pages', icon: Folder, action: () => navigate('/dashboard') },
    { id: '2', type: 'page', title: 'Studio Flow', category: 'Pages', icon: Sparkles, action: () => navigate('/studio-flow') },
    { id: '3', type: 'page', title: 'Chat IA', category: 'Pages', icon: MessageSquare, action: () => navigate('/chat') },
    { id: '4', type: 'page', title: 'Tools', category: 'Pages', icon: Image, action: () => navigate('/tools') },
    { id: '5', type: 'tool', title: 'Generar Imagen', category: 'Tools', icon: Image, action: () => navigate('/tools') },
    { id: '6', type: 'tool', title: 'Generar Código', category: 'Tools', icon: Code, action: () => navigate('/tools') },
    { id: '7', type: 'page', title: 'Documentación', category: 'Pages', icon: FileText, action: () => navigate('/docs') },
    { id: '8', type: 'page', title: 'Pricing', category: 'Pages', icon: Sparkles, action: () => navigate('/pricing') },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = searchData.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100">
            <Search className="h-5 w-5 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar proyectos, assets, herramientas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
            />
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <kbd className="px-2 py-1 bg-zinc-100 rounded font-mono">⌘K</kbd>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {results.length === 0 && query && (
              <div className="p-8 text-center text-zinc-500">
                <p>No se encontraron resultados</p>
                <p className="text-sm mt-1">Intenta con otra búsqueda</p>
              </div>
            )}

            {results.length === 0 && !query && (
              <div className="p-8 text-center text-zinc-400">
                <Command className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Escribe para buscar</p>
                <div className="flex gap-2 justify-center mt-4 text-xs">
                  <span className="px-2 py-1 bg-zinc-100 rounded">↑↓ navegar</span>
                  <span className="px-2 py-1 bg-zinc-100 rounded">↵ seleccionar</span>
                  <span className="px-2 py-1 bg-zinc-100 rounded">esc cerrar</span>
                </div>
              </div>
            )}

            {results.map((result, index) => {
              const Icon = result.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={result.id}
                  onClick={() => {
                    result.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-zinc-50'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-zinc-500">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                    {result.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400 flex items-center justify-between">
            <span>{results.length} resultados</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd>
                <span>navegar</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                <span>seleccionar</span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
