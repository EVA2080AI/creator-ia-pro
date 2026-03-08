
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(user_id uuid, email text, display_name text, credits_balance integer, created_at timestamp with time zone, last_sign_in timestamp with time zone, subscription_tier text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    u.email::TEXT,
    p.display_name,
    p.credits_balance,
    p.created_at,
    u.last_sign_in_at,
    p.subscription_tier
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE public.has_role(auth.uid(), 'admin')
$$;
