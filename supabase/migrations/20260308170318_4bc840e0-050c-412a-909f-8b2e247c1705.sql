
ALTER TABLE public.canvas_nodes ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL;
