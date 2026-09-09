import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import type { AgentSpecialist, AgentPreference } from '@/components/studio/chat/types';
export type { AgentSpecialist, AgentPreference };

// Antes persistía en la tabla `agent_preferences` de Supabase (hoy pausado e
// irrecuperable) — ahora en localStorage, con la misma forma de datos para que
// StudioChat (inyección de instrucciones en el system prompt) y
// AgentSettingsModal sigan funcionando sin cambios. Pendiente: tabla Drizzle +
// endpoint /api/preferences si se quiere persistencia entre dispositivos.
const STORAGE_PREFIX = 'creatoria:agent-preferences:';

function readStored(userId: string): AgentPreference[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    return raw ? (JSON.parse(raw) as AgentPreference[]) : [];
  } catch {
    return [];
  }
}

function writeStored(userId: string, prefs: AgentPreference[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(prefs));
  } catch {
    // localStorage lleno o bloqueado — las preferencias solo viven en memoria
  }
}

export function useAgentPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AgentPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    setPreferences(readStored(user.id));
    setLoading(false);
  }, [user]);

  const updatePreference = useCallback(async (agentId: AgentSpecialist, instructions: string, _settings: any = {}) => {
    if (!user) return;
    const next = [
      ...readStored(user.id).filter((p) => p.agent_id !== agentId),
      { agent_id: agentId, instructions },
    ];
    writeStored(user.id, next);
    setPreferences(next);
    toast.success(`Preferencias para ${agentId.toUpperCase()} guardadas`);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, loading, updatePreference, refresh: fetchPreferences };
}