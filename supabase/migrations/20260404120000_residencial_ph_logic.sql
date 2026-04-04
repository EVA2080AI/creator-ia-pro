
-- 1. Update app_role enum for ResidencialPH
DO $$ 
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'propietario';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contador';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Condominios Table
CREATE TABLE IF NOT EXISTS public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  torres INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Unidades Table (Apartments/Units)
CREATE TABLE IF NOT EXISTS public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  torre TEXT,
  propietario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mora_actual DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Pagos Residencial Table
CREATE TABLE IF NOT EXISTS public.pagos_residencial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido')),
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Asambleas Table
CREATE TABLE IF NOT EXISTS public.asambleas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL,
  link_reunion TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Documentos Residencial Table
CREATE TABLE IF NOT EXISTS public.documentos_residencial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT, -- 'acta', 'reglamento', 'financiero'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Notificaciones Residencial Table
CREATE TABLE IF NOT EXISTS public.notificaciones_residencial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Add phone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS condominio_id UUID REFERENCES public.condominios(id);

-- Enable RLS
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_residencial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asambleas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_residencial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_residencial ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Placeholder - will be more granular per role)
CREATE POLICY "Permitir lectura autenticada a condominios" ON public.condominios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura autenticada a unidades" ON public.unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura autenticada a pagos" ON public.pagos_residencial FOR SELECT TO authenticated USING (true);

-- Functions for Dashboard stats
CREATE OR REPLACE FUNCTION public.get_condominio_stats(_condominio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_unidades', (SELECT count(*) FROM public.unidades WHERE condominio_id = _condominio_id),
    'unidades_al_dia', (SELECT count(*) FROM public.unidades u JOIN public.pagos_residencial p ON p.unidad_id = u.id WHERE u.condominio_id = _condominio_id AND p.estado = 'pagado' AND p.fecha_pago > now() - interval '30 days'),
    'recaudo_mes', (SELECT coalesce(sum(monto), 0) FROM public.pagos_residencial p JOIN public.unidades u ON u.id = p.unidad_id WHERE u.condominio_id = _condominio_id AND p.estado = 'pagado' AND p.fecha_pago > date_trunc('month', now())),
    'cartera_mora', (SELECT coalesce(sum(monto), 0) FROM public.pagos_residencial p JOIN public.unidades u ON u.id = p.unidad_id WHERE u.condominio_id = _condominio_id AND p.estado = 'pendiente')
  ) INTO result;
  RETURN result;
END;
$$;
