-- ==========================================
-- RECONSTRUCCIÓN DEL ESQUEMA: Creator IA Pro
-- Generado por: Antigravity Master Agent
-- ==========================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLAS BASE

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    credits_balance INTEGER DEFAULT 100,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role DEFAULT 'user'::app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- DEMO_USAGE (Para control de trials/créditos sin login)
CREATE TABLE IF NOT EXISTS demo_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint TEXT NOT NULL UNIQUE,
    trials_used INTEGER DEFAULT 0,
    last_trial_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SPACES (Formaketing Lienzos)
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CANVAS_NODES (Nodos dentro de un Space)
CREATE TABLE IF NOT EXISTS canvas_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    pos_x NUMERIC NOT NULL DEFAULT 0,
    pos_y NUMERIC NOT NULL DEFAULT 0,
    width INTEGER DEFAULT 256,
    height INTEGER DEFAULT 256,
    asset_url TEXT,
    data_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SAVED_ASSETS
CREATE TABLE IF NOT EXISTS saved_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES canvas_nodes(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    asset_url TEXT NOT NULL,
    prompt TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTIONS (Historial de uso de créditos)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES canvas_nodes(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- ej. 'generation', 'upscale', 'purchase'
    amount INTEGER NOT NULL, -- Negativo para uso, positivo para recarga
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. SEGURIDAD A NIVEL DE FILAS (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para SPACES
CREATE POLICY "Users can view their own spaces" ON spaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spaces" ON spaces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own spaces" ON spaces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own spaces" ON spaces FOR DELETE USING (auth.uid() = user_id);

-- Políticas para CANVAS_NODES
CREATE POLICY "Users can view their own nodes" ON canvas_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own nodes" ON canvas_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nodes" ON canvas_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own nodes" ON canvas_nodes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para SAVED_ASSETS
CREATE POLICY "Users can view their own assets" ON saved_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own assets" ON saved_assets FOR ALL USING (auth.uid() = user_id);

-- Políticas para TRANSACTIONS
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
-- NOTA: Solo funciones edge/admin deberían poder insertar transacciones. Si se requiere app-side, descomentar:
-- CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para DEMO_USAGE
CREATE POLICY "Anyone can view demo usage" ON demo_usage FOR SELECT USING (true);
CREATE POLICY "Anyone can insert demo usage" ON demo_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update demo usage" ON demo_usage FOR UPDATE USING (true);

-- ==========================================
-- 5. FUNCIONES Y TRIGGERS
-- ==========================================

-- Función para verificar si un usuario tiene un rol
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID DEFAULT auth.uid()) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear profile automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, credits_balance)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 100); -- Da 100 créditos iniciales

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_canvas_nodes_updated_at BEFORE UPDATE ON canvas_nodes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
