import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'code' | 'plan' | 'image';
  files?: string[];
  imagePreview?: string;
  blob?: Blob;
  planStatus?: 'pending' | 'approved' | 'rejected';
  originalPrompt?: string;
  projectFilesMap?: Map<string, any>;
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // Current Session
  messages: Message[];
  input: string;
  isStreaming: boolean;
  selectedModel: string;
  isArchitectMode: boolean;

  // Pending Attachments
  pendingImage: string | null;
  pendingUrl: string | null;
  pendingContext: { name: string; content: string } | null;

  // UI State
  copiedId: string | null;
  showScrollBtn: boolean;
  isScraping: boolean;
  isAutoFixing: boolean;

  // Actions
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  setInput: (input: string) => void;
  setStreaming: (streaming: boolean) => void;
  setSelectedModel: (model: string) => void;
  setArchitectMode: (mode: boolean) => void;

  setPendingImage: (image: string | null) => void;
  setPendingUrl: (url: string | null) => void;
  setPendingContext: (context: { name: string; content: string } | null) => void;
  clearPending: () => void;

  setCopiedId: (id: string | null) => void;
  setShowScrollBtn: (show: boolean) => void;
  setIsScraping: (scraping: boolean) => void;
  setIsAutoFixing: (fixing: boolean) => void;

  // Async Actions
  saveMessage: (projectId: string, role: 'user' | 'assistant', content: string) => Promise<void>;
  loadConversation: (projectId: string) => Promise<void>;
  resetConversation: (projectId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      messages: [],
      input: '',
      isStreaming: false,
      selectedModel: 'google/gemini-2.0-flash-001',
      isArchitectMode: false,
      pendingImage: null,
      pendingUrl: null,
      pendingContext: null,
      copiedId: null,
      showScrollBtn: false,
      isScraping: false,
      isAutoFixing: false,

      setMessages: (messages) => {
        if (typeof messages === 'function') {
          set((state) => ({ messages: messages(state.messages) }), false, 'setMessages');
        } else {
          set({ messages }, false, 'setMessages');
        }
      },

      addMessage: (message) => set(
        (state) => ({ messages: [...state.messages, message] }),
        false,
        'addMessage'
      ),

      updateMessage: (id, updates) => set(
        (state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          )
        }),
        false,
        'updateMessage'
      ),

      clearMessages: () => set({ messages: [] }, false, 'clearMessages'),

      setInput: (input) => set({ input }, false, 'setInput'),
      setStreaming: (isStreaming) => set({ isStreaming }, false, 'setStreaming'),
      setSelectedModel: (selectedModel) => set({ selectedModel }, false, 'setSelectedModel'),
      setArchitectMode: (isArchitectMode) => set({ isArchitectMode }, false, 'setArchitectMode'),

      setPendingImage: (pendingImage) => set({ pendingImage }, false, 'setPendingImage'),
      setPendingUrl: (pendingUrl) => set({ pendingUrl }, false, 'setPendingUrl'),
      setPendingContext: (pendingContext) => set({ pendingContext }, false, 'setPendingContext'),
      clearPending: () => set({ pendingImage: null, pendingUrl: null, pendingContext: null }, false, 'clearPending'),

      setCopiedId: (copiedId) => set({ copiedId }, false, 'setCopiedId'),
      setShowScrollBtn: (showScrollBtn) => set({ showScrollBtn }, false, 'setShowScrollBtn'),
      setIsScraping: (isScraping) => set({ isScraping }, false, 'setIsScraping'),
      setIsAutoFixing: (isAutoFixing) => set({ isAutoFixing }, false, 'setIsAutoFixing'),

      saveMessage: async (projectId, role, content) => {
        if (!projectId) return;

        try {
          await supabase.from('studio_conversations').insert({
            project_id: projectId,
            role,
            content,
            created_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error saving message:', err);
        }
      },

      loadConversation: async (projectId) => {
        if (!projectId) {
          set({ messages: [] });
          return;
        }

        try {
          const { data, error } = await supabase
            .from('studio_conversations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Error loading conversation:', error);
            return;
          }

          const messages = (data || []).map((msg: any) => ({
            id: msg.id || crypto.randomUUID(),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));

          set({ messages }, false, 'loadConversation');
        } catch (err) {
          console.error('Error loading conversation:', err);
        }
      },

      resetConversation: async (projectId) => {
        set({ messages: [] });
        if (projectId) {
          try {
            await supabase
              .from('studio_conversations')
              .delete()
              .eq('project_id', projectId);
          } catch (err) {
            console.error('Error resetting conversation:', err);
          }
        }
      }
    }),
    { name: 'genesis-chat-store' }
  )
);
