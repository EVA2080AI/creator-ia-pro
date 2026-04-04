import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type AgentSpecialist = 'ux' | 'frontend' | 'backend' | 'devops' | 'game';

export interface AgentPreference {
  agent_id: AgentSpecialist;
  instructions: string;
  settings: any;
}

export function useAgentPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AgentPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('agent_preferences')
        .select('agent_id, instructions, settings')
        .eq('user_id', user.id);

      if (error) throw error;
      setPreferences(data || []);
    } catch (err: any) {
      console.error('[useAgentPreferences] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreference = async (agentId: AgentSpecialist, instructions: string, settings: any = {}) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('agent_preferences')
        .upsert({
          user_id: user.id,
          agent_id: agentId,
          instructions,
          settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, agent_id' });

      if (error) throw error;
      
      toast.success(`Preferencias para ${agentId.toUpperCase()} guardadas`);
      await fetchPreferences();
    } catch (err: any) {
      toast.error('Error al guardar preferencias');
      console.error('[useAgentPreferences] Error updating:', err);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, loading, updatePreference, refresh: fetchPreferences };
}
