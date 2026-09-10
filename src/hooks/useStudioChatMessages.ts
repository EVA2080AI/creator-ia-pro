import { useState, useCallback, useEffect } from 'react';
import type { Message } from '@/components/studio/chat/types';
import type { UIArtifact, UIPlanTask, UILog } from '@/components/studio/StudioArtifactsPanel';

// El servidor persiste la respuesta cruda del modelo (con bloques
// <file path="...">…</file>). Al recargar, cada bloque se compacta a una
// referencia legible — el código completo vive en los archivos del proyecto.
const compactFileBlocks = (raw: string): string =>
  raw.replace(
    /<file\s+path\s*=\s*["']([^"']+)["']\s*>[\s\S]*?(?:<\/file>|$)/gi,
    (_m, path: string) => `\n> 📦 \`${path}\`\n`
  );

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '✨ ¡Bienvenido a Basalt! Estoy listo para evolucionar tu visión. ¿Qué construiremos hoy?',
  timestamp: new Date()
};

interface UseStudioChatMessagesProps {
  projectId: string | null;
  /** Solo se usa `.id` — evita atarse al tipo `User` de un proveedor de auth concreto. */
  user: { id: string } | null;
  setArtifacts: (a: UIArtifact[]) => void;
  setTasks: (t: UIPlanTask[]) => void;
  setLogs: React.Dispatch<React.SetStateAction<UILog[]>>;
}

// Historial del chat de Genesis: lectura de /api/projects/:id/messages
// (Drizzle/Neon). La persistencia la hace el propio /api/ai/chat al final del
// stream — el cliente solo aporta el conversationId (generado aquí si es el
// primer mensaje del proyecto).
export function useStudioChatMessages({
  projectId,
  user,
  setArtifacts,
  setTasks,
  setLogs
}: UseStudioChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [convHistory, setConvHistory] = useState<Message[]>([]);

  const addLog = useCallback((message: string, type: UILog['type'] = 'info') => {
    const newLog: UILog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev]);
  }, [setLogs]);

  const loadHistory = useCallback(async () => {
    if (!projectId || !user) {
      setMessages([WELCOME]);
      setConvHistory([]);
      setActiveConversationId(null);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, { credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setMessages([WELCOME]);
        setConvHistory([]);
        return;
      }
      // Primer mensaje del proyecto: el cliente genera el id de conversación
      // y lo envía en cada llamada a /api/ai/chat (lo crea el servidor).
      setActiveConversationId(json.conversationId ?? crypto.randomUUID());

      const history: { id: string; role: string; content: string; createdAt: string }[] = json.messages ?? [];
      if (history.length > 0) {
        const mapped: Message[] = history.map(m => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.role === 'assistant' ? compactFileBlocks(m.content) : m.content,
          timestamp: new Date(m.createdAt)
        }));
        setMessages(mapped);
        setConvHistory(mapped.slice(-16));
      } else {
        setMessages([WELCOME]);
        setConvHistory([]);
      }
    } catch {
      setMessages([WELCOME]);
      setConvHistory([]);
    }
  }, [projectId, user]);

  // Unified loading effect
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Artifact & Task Extraction — use stable IDs derived from msg.id + index to avoid UUID churn
  useEffect(() => {
    const newArtifacts: UIArtifact[] = [];
    const newTasks: UIPlanTask[] = [];

    messages.forEach(m => {
      const content = m.content || '';
      // Improved Mermaid Regex: Case-insensitive and handles extra spaces
      const mermaidMatches = [...content.matchAll(/```[Mm]ermaid\s*([\s\S]*?)```/g)];
      mermaidMatches.forEach((match, idx) => {
        newArtifacts.push({
          id: `${m.id}-mermaid-${idx}`,   // ← Stable ID based on message + index
          type: 'mermaid',
          title: 'Arquitectura Sugerida',
          content: match[1].trim()
        });
      });

      // Sitemap Fallback
      if (newArtifacts.filter(a => a.type === 'mermaid').length === 0) {
        const listSitemap = content.match(/\* \/(\w+)? \(.*\)/g);
        if (listSitemap && listSitemap.length > 2) {
           newArtifacts.push({
             id: `${m.id}-sitemap`,       // ← Stable ID
             type: 'text',
             title: 'Sitemap Detectado (Lista)',
             content: listSitemap.join('\n')
           });
        }
      }

      // Improved Task Regex: Handle variations in symbols ([], [ ], [x], [/], [-])
      const taskMatches = Array.from(content.matchAll(/^\[( |x|X|\/|-)\] (.+)$/gm));
      taskMatches.forEach((match, idx) => {
        const symbol = (match[1] as string).toLowerCase();
        newTasks.push({
          id: `${m.id}-task-${idx}`,       // ← Stable ID
          text: (match[2] as string).trim(),
          status: symbol === 'x' ? 'completed' : symbol === '/' ? 'in-progress' : 'pending'
        });
      });
    });

    setArtifacts(newArtifacts);
    setTasks(newTasks);
  }, [messages, setArtifacts, setTasks]);

  const resetConversation = useCallback(() => {
    setMessages([WELCOME]);
    setConvHistory([]);
  }, []);

  return {
    messages,
    setMessages,
    convHistory,
    setConvHistory,
    activeConversationId,
    addLog,
    loadHistory,
    resetConversation
  };
}