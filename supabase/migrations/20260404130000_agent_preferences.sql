-- Agent Preferences: store individual specialist instructions per user
CREATE TABLE IF NOT EXISTS public.agent_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id TEXT NOT NULL CHECK (agent_id IN ('ux', 'frontend', 'backend', 'devops')),
  instructions TEXT NOT NULL DEFAULT '',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

ALTER TABLE public.agent_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own agent preferences"
  ON public.agent_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_agent_preferences_updated_at
  BEFORE UPDATE ON public.agent_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
