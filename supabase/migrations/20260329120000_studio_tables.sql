-- Studio Projects: stores AI-generated code projects per user
CREATE TABLE IF NOT EXISTS public.studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Nuevo Proyecto',
  description TEXT,
  files JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own studio projects"
  ON public.studio_projects FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own studio projects"
  ON public.studio_projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own studio projects"
  ON public.studio_projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own studio projects"
  ON public.studio_projects FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Studio Conversations: chat history per project
CREATE TABLE IF NOT EXISTS public.studio_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nueva conversación',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own studio conversations"
  ON public.studio_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Studio Messages: individual messages per conversation
CREATE TABLE IF NOT EXISTS public.studio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.studio_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own conversations"
  ON public.studio_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.studio_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON public.studio_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.studio_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- GitHub Connections: store GitHub PAT per user for repo push
CREATE TABLE IF NOT EXISTS public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  github_username TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own github connection"
  ON public.github_connections FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_studio_projects_updated_at
  BEFORE UPDATE ON public.studio_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_conversations_updated_at
  BEFORE UPDATE ON public.studio_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_github_connections_updated_at
  BEFORE UPDATE ON public.github_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
