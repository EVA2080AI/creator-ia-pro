
-- Alinear créditos del plan FREE a 5 como solicitó el usuario
ALTER TABLE public.profiles ALTER COLUMN credits_balance SET DEFAULT 5;

-- Actualizar la función handle_new_user para asignar 5 créditos iniciales
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name TEXT;
  _avatar_url TEXT;
BEGIN
  -- 1. Resilient name extraction from Google/OAuth metadata
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name', 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- 2. Avatar extraction
  _avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- 3. Insert or Update profile with default values for required columns
  INSERT INTO public.profiles (
    user_id, 
    email,
    full_name, 
    avatar_url, 
    subscription_tier, 
    is_active, 
    credits_balance
  )
  VALUES (
    NEW.id, 
    NEW.email,
    _full_name,
    _avatar_url,
    'free',    -- Default Tier
    true,      -- Active by default
    5          -- Starting credits ALIGNED TO 5
  )
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;
