
-- Granting PYME access to specific user
-- 1. Ensure the user exists and find their ID
-- 2. Update their profile tier to 'pyme'

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'arz0485diana@gmail.com.co';

    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET subscription_tier = 'pyme',
            updated_at = NOW()
        WHERE user_id = target_user_id;

        -- Also ensure they have a decent credit balance if they are just starting
        UPDATE public.profiles
        SET credits_balance = GREATEST(credits_balance, 500)
        WHERE user_id = target_user_id;

        -- Record the transaction
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (target_user_id, 'credit', 0, 'Acceso PYME otorgado manualmente por soporte');
        
        RAISE NOTICE 'Access granted for user %', target_user_id;
    ELSE
        RAISE NOTICE 'User arz0485diana@gmail.com.co not found in auth.users';
    END IF;
END $$;
