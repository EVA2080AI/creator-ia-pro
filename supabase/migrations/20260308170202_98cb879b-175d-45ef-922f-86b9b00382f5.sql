
CREATE OR REPLACE FUNCTION public.admin_update_tier(_target_user_id uuid, _new_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET subscription_tier = _new_tier WHERE user_id = _target_user_id;
END;
$$;
