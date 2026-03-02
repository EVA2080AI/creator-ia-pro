
-- Add data_payload column for model settings (seed, aspect_ratio, model, etc.)
ALTER TABLE public.canvas_nodes ADD COLUMN IF NOT EXISTS data_payload JSONB DEFAULT '{}';

-- Enable realtime for canvas_nodes
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_nodes;
