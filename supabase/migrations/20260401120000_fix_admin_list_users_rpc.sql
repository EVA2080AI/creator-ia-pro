-- Fix the admin_list_users RPC which threw "column does not exist"
-- We safely extract the display name directly from the auth.users metadata
-- preventing any missing column errors or shadowing issues.

DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  credits_balance integer,
  subscription_tier text,
  created_at timestamp with time zone,
  last_sign_in timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    p.created_at,
    au.last_sign_in_at AS last_sign_in
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE public.has_role('admin'::app_role, auth.uid());
$$;
