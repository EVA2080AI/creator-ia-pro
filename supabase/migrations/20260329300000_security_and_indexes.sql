-- ============================================================
-- Sprint 1 S6: Security hardening + indexes + app_settings
-- ============================================================

-- ── app_settings table (for admin-save-settings function) ──
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '""',
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "app_settings: admin read"
  ON app_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "app_settings: admin write"
  ON app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ── demo_usage RLS (keyed by fingerprint, not user_id) ──────
ALTER TABLE IF EXISTS demo_usage ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated + anon reads (fingerprint is the key, no user_id)
DROP POLICY IF EXISTS "demo_usage: public access" ON demo_usage;
CREATE POLICY "demo_usage: public access"
  ON demo_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── Missing indexes on user_id foreign keys ─────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_spaces_user_id
  ON spaces (user_id);

CREATE INDEX IF NOT EXISTS idx_studio_projects_user_id
  ON studio_projects (user_id);

CREATE INDEX IF NOT EXISTS idx_studio_conversations_user_id
  ON studio_conversations (user_id);

CREATE INDEX IF NOT EXISTS idx_studio_conversations_project_id
  ON studio_conversations (project_id);

-- ── Sprint D5: Fix canvas_nodes.type CHECK constraint ───────
ALTER TABLE canvas_nodes
  DROP CONSTRAINT IF EXISTS canvas_nodes_type_check;

ALTER TABLE canvas_nodes
  ADD CONSTRAINT canvas_nodes_type_check
  CHECK (type IN (
    'image', 'video', 'text', 'ui', 'media',
    'character', 'model', 'video_model', 'layout', 'campaign', 'bridge'
  ));

-- ── Sprint E1: asset_ratings table ──────────────────────────
CREATE TABLE IF NOT EXISTS asset_ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id      UUID REFERENCES saved_assets(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  feedback_text TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE asset_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_ratings: own rows"
  ON asset_ratings FOR ALL
  USING (auth.uid() = user_id);

-- ── Sprint E2: usage_events table ───────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  event_data  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events: own rows"
  ON usage_events FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id
  ON usage_events (user_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_type
  ON usage_events (event_type, created_at DESC);

-- ── Sprint E5: error_logs table ──────────────────────────────
CREATE TABLE IF NOT EXISTS error_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message   TEXT NOT NULL,
  component_stack TEXT,
  url             TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs; service role inserts via ErrorBoundary
CREATE POLICY "error_logs: admin read"
  ON error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "error_logs: authenticated insert"
  ON error_logs FOR INSERT
  WITH CHECK (true);
