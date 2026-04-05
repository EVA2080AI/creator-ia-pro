import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Message } from '@/components/studio/chat/types';
import type { UIArtifact, UIPlanTask, UILog } from '@/components/studio/StudioArtifactsPanel';

interface UseStudioChatMessagesProps {
  projectId: string | null;
  user: any;
  setArtifacts: (a: UIArtifact[]) => void;
  setTasks: (t: UIPlanTask[]) => void;
  setLogs: (l: (prev: UILog[]) => UILog[]) => void;
}

export function useStudioChatMessages({
  projectId,
  user,
  setArtifacts,
  setTasks,
  setLogs
}: UseStudioChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [convHistory, setConvHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  
  const initialLoadRef = useRef(false);

  const addLog = useCallback((message: string, type: UILog['type'] = 'info') => {
    const newLog: UILog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev]);
  }, [setLogs]);

  const ensureConversation = useCallback(async (pid: string) => {
    if (!user) return null;
    try {
      const { data: existing } = await supabase
        .from('studio_conversations')
        .select('id')
        .eq('project_id', pid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) return existing.id;

      const { data: created, error } = await supabase
        .from('studio_conversations')
        .insert({ project_id: pid, user_id: user.id, title: 'Chat Principal' })
        .select('id')
        .single();
      
      if (error) throw error;
      return created.id;
    } catch (err) {
      console.error("[useStudioChatMessages] Error ensuring conversation:", err);
      return null;
    }
  }, [user]);

  const saveToSupabase = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!user || !activeConversationId) return;
    try {
      await supabase.from('studio_messages').insert({
        conversation_id: activeConversationId,
        role,
        content,
      });
    } catch (err) {
      console.error("[useStudioChatMessages] Error saving message:", err);
    }
  }, [user, activeConversationId]);

  const loadHistory = useCallback(async () => {
    if (!projectId || !user) return;
    
    const convId = await ensureConversation(projectId);
    if (!convId) return;
    setActiveConversationId(convId);

    const { data: history, error } = await supabase
      .from('studio_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("[useStudioChatMessages] Error loading history:", error);
      return;
    }

    if (history && history.length > 0) {
      const mapped: Message[] = history.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at)
      }));
      setMessages(mapped);
      setConvHistory(mapped.map(m => ({ role: m.role, content: m.content })).slice(-16));
    } else {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '✨ ¡Bienvenido a Génesis! Estoy listo para evolucionar tu visión. ¿Qué construiremos hoy?',
        timestamp: new Date()
      }]);
      setConvHistory([]);
    }
  }, [projectId, user, ensureConversation]);

  // Unified loading effect
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Artifact & Task Extraction — use stable IDs derived from msg.id + index to avoid UUID churn
  useEffect(() => {
    const newArtifacts: UIArtifact[] = [];
    const newTasks: UIPlanTask[] = [];

    messages.forEach(m => {
      // Improved Mermaid Regex: Case-insensitive and handles extra spaces
      const mermaidMatches = [...m.content.matchAll(/```[Mm]ermaid\s*([\s\S]*?)```/g)];
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
        const listSitemap = m.content.match(/\* \/(\w+)? \(.*\)/g);
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
      const taskMatches = Array.from(m.content.matchAll(/^\[( |x|X|\/|-)\] (.+)$/gm));
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

  return {
    messages,
    setMessages,
    convHistory,
    setConvHistory,
    activeConversationId,
    saveToSupabase,
    addLog,
    loadHistory
  };
}
