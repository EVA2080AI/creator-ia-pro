
-- 1. Actualizar la función handle_new_user para capturar mejor la información de OAuth (Google, etc.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
 BEGIN
   INSERT INTO public.profiles (user_id, display_name, avatar_url, credits_balance)
   VALUES (
     NEW.id, 
     COALESCE(
       NEW.raw_user_meta_data->>'display_name', 
       NEW.raw_user_meta_data->>'full_name', 
       NEW.raw_user_meta_data->>'name', 
       NEW.email
     ),
     NEW.raw_user_meta_data->>'avatar_url',
     10
   )
   ON CONFLICT (user_id) DO UPDATE SET
     display_name = EXCLUDED.display_name,
     avatar_url = EXCLUDED.avatar_url;
   RETURN NEW;
 END;
 $function$;
