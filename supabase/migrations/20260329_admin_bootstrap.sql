-- Bootstrap admin function: grants admin role to the calling user
-- ONLY works when no admin exists in the system (safe one-time bootstrap)
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block if any admin already exists
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN 'admin_exists';
  END IF;

  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RETURN 'not_authenticated';
  END IF;

  -- Grant admin role to the calling user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;
