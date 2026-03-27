-- Add space_id to saved_assets for per-space asset organization
ALTER TABLE public.saved_assets
  ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS saved_assets_space_id_idx ON public.saved_assets(space_id);
