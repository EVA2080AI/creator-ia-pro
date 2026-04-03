-- ============================================================
-- Fix: admin functions were calling has_role('admin') with 1
-- argument but the function signature requires 2: (uuid, text).
-- Three functions affected: admin_list_users, admin_set_user_status,
-- admin_update_tier. All now correctly pass auth.uid() as first arg.
-- Applied: 2026-04-01
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  credits_balance integer,
  subscription_tier text,
  is_active boolean,
  created_at timestamp with time zone,
  last_sign_in timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    au.email::TEXT,
    COALESCE(
      (au.raw_user_meta_data->>'display_name')::TEXT,
      (au.raw_user_meta_data->>'full_name')::TEXT,
      au.email::TEXT
    ) AS display_name,
    p.credits_balance,
    p.subscription_tier::TEXT,
    p.is_active,
    p.created_at,
    au.last_sign_in_at AS last_sign_in
  FROM profiles p
  JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(_target_user_id uuid, _active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET is_active = _active,
      updated_at = NOW()
  WHERE user_id = _target_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_tier(_target_user_id uuid, _new_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET subscription_tier = _new_tier,
      updated_at = NOW()
  WHERE user_id = _target_user_id;

  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (_target_user_id, 'subscription_change', 0, 'Plan cambiado a ' || _new_tier);
END;
$function$;
