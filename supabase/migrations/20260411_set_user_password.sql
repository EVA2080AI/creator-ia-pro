
-- Establecer contraseña manual para el usuario
-- 1. Actualiza el hash de la contraseña en auth.users usando pgcrypto (estándar en Supabase)
-- 2. Asegura que el correo esté marcado como verificado para permitir el acceso inmediato

DO $$
BEGIN
    -- Intentamos actualizar la contraseña
    UPDATE auth.users
    SET encrypted_password = crypt('123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW(),
        recovery_sent_at = NULL,
        last_sign_in_at = COALESCE(last_sign_in_at, NOW()),
        raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
    WHERE email = 'arz0485diana@gmail.com.co';

    IF NOT FOUND THEN
        RAISE NOTICE 'Usuario arz0485diana@gmail.com.co no encontrado. Para crear un usuario nuevo desde cero vía SQL se requieren campos adicionales obligatorios de Supabase Auth.';
    ELSE
        RAISE NOTICE 'Contraseña establecida exitosamente para arz0485diana@gmail.com.co';
    END IF;
END $$;
