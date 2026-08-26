-- ============================================================================
-- Tareas (tablero Kanban móvil) + registro de correos enviados vía Resend
-- Fecha: 2026-08-25
-- Idempotente: se puede ejecutar más de una vez sin romper nada.
-- ============================================================================

-- ── Tabla: tasks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'todo',
  priority         TEXT NOT NULL DEFAULT 'medium',
  due_date         DATE,
  position         INTEGER NOT NULL DEFAULT 0,
  notify_email     BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_title_length       CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT tasks_description_length CHECK (description IS NULL OR char_length(description) <= 4000),
  CONSTRAINT tasks_status_check       CHECK (status IN ('todo', 'in_progress', 'done')),
  CONSTRAINT tasks_priority_check     CHECK (priority IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS tasks_user_status_position_idx ON public.tasks (user_id, status, position);
CREATE INDEX IF NOT EXISTS tasks_user_due_date_idx        ON public.tasks (user_id, due_date) WHERE due_date IS NOT NULL;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- updated_at automático (función ya existente en el proyecto)
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- completed_at se fija al pasar a 'done' y se limpia al salir de 'done'
CREATE OR REPLACE FUNCTION public.tasks_set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'done' THEN
      NEW.completed_at := now();
    END IF;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_set_completed_at ON public.tasks;
CREATE TRIGGER tasks_set_completed_at
  BEFORE INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tasks_set_completed_at();

-- ── Tabla: email_logs ────────────────────────────────────────────────────────
-- Escrita únicamente por la edge function `send-email` (service role).
-- Sirve de auditoría y para aplicar límites diarios (plan gratuito de Resend).
CREATE TABLE IF NOT EXISTS public.email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  template    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'sent',
  provider_id TEXT,
  error       TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_logs_status_check CHECK (status IN ('sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS email_logs_user_created_idx ON public.email_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_created_idx      ON public.email_logs (created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- Sin políticas de INSERT/UPDATE/DELETE para `authenticated`: solo el service role escribe.

COMMENT ON TABLE public.tasks      IS 'Tareas personales del usuario (tablero Kanban: todo / in_progress / done).';
COMMENT ON TABLE public.email_logs IS 'Registro de correos enviados por la edge function send-email (Resend).';
