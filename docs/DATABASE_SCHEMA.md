# Creator IA Pro — Database Schema

## Overview

Base de datos PostgreSQL con Supabase. Esquema optimizado para SaaS de IA generativa con sistema de créditos, workspaces y generación multi-modal.

## Tables

### `profiles`
Datos de usuario extendidos (auth.users complement).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | uuid | PK, FK → auth.users | ID único |
| email | varchar | NOT NULL | Email del usuario |
| full_name | varchar | nullable | Nombre completo |
| avatar_url | text | nullable | URL del avatar |
| credits_balance | integer | DEFAULT 0 | Créditos disponibles |
| subscription_tier | varchar | DEFAULT 'free' | Plan actual |
| subscription_expires_at | timestamptz | nullable | Expiración plan |
| created_at | timestamptz | DEFAULT now() | Fecha creación |
| updated_at | timestamptz | DEFAULT now() | Última actualización |

**Indexes:**
- `profiles_user_id_idx` (user_id) - Búsqueda por usuario
- `profiles_email_idx` (email) - Búsqueda por email
- `profiles_subscription_idx` (subscription_tier) - Filtrado por plan

### `transactions`
Registro de todas las operaciones de créditos.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| user_id | uuid | FK → profiles.user_id | Usuario |
| type | varchar | NOT NULL | 'credit' o 'debit' |
| amount | integer | NOT NULL | Cantidad |
| description | text | nullable | Descripción |
| metadata | jsonb | nullable | Datos adicionales |
| created_at | timestamptz | DEFAULT now() | Fecha |

**Indexes:**
- `transactions_user_id_idx` (user_id) - Historial por usuario
- `transactions_created_at_idx` (created_at DESC) - Orden cronológico

### `user_roles`
Roles para RBAC (Role-Based Access Control).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Usuario |
| role | varchar | NOT NULL | 'admin', 'moderator', 'user' |
| granted_by | uuid | FK → profiles.user_id | Quién otorgó |
| created_at | timestamptz | DEFAULT now() | Fecha |

**Indexes:**
- `user_roles_user_id_idx` (user_id) - Roles del usuario
- `user_roles_role_idx` (role) - Filtrado por rol

### `spaces`
Workspaces/Proyectos del usuario.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Propietario |
| name | varchar | NOT NULL | Nombre del espacio |
| description | text | nullable | Descripción |
| icon | varchar | nullable | Icono/emoji |
| color | varchar | nullable | Color del tema |
| is_archived | boolean | DEFAULT false | Archivado |
| created_at | timestamptz | DEFAULT now() | Fecha creación |
| updated_at | timestamptz | DEFAULT now() | Última actualización |

**Indexes:**
- `spaces_user_id_idx` (user_id) - Espacios del usuario
- `spaces_archived_idx` (is_archived) - Filtrar archivados

### `saved_assets`
Biblioteca de activos generados.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Propietario |
| space_id | uuid | FK → spaces.id | Espacio (opcional) |
| type | varchar | NOT NULL | 'image', 'video', 'code', 'text' |
| name | varchar | NOT NULL | Nombre del asset |
| url | text | nullable | URL externa |
| content | text | nullable | Contenido (código/texto) |
| metadata | jsonb | nullable | Metadatos adicionales |
| prompt | text | nullable | Prompt usado |
| model | varchar | nullable | Modelo utilizado |
| is_favorite | boolean | DEFAULT false | Favorito |
| created_at | timestamptz | DEFAULT now() | Fecha |

**Indexes:**
- `saved_assets_user_id_idx` (user_id) - Assets del usuario
- `saved_assets_space_id_idx` (space_id) - Assets del espacio
- `saved_assets_type_idx` (type) - Filtrado por tipo
- `saved_assets_created_idx` (created_at DESC) - Orden cronológico

### `canvas_nodes`
Nodos del canvas visual (ForMarketing/Studio).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Propietario |
| project_id | uuid | nullable | Proyecto agrupador |
| type | varchar | NOT NULL | Tipo de nodo |
| position_x | float | NOT NULL | Posición X |
| position_y | float | NOT NULL | Posición Y |
| data | jsonb | NOT NULL | Datos del nodo |
| config | jsonb | DEFAULT '{}' | Configuración |
| status | varchar | DEFAULT 'idle' | 'idle', 'running', 'completed', 'error' |
| created_at | timestamptz | DEFAULT now() | Fecha |
| updated_at | timestamptz | DEFAULT now() | Actualización |

**Indexes:**
- `canvas_nodes_user_id_idx` (user_id) - Nodos del usuario
- `canvas_nodes_project_idx` (project_id) - Nodos del proyecto
- `canvas_nodes_status_idx` (status) - Filtrado por estado

### `studio_projects`
Proyectos del IDE (BuilderAI/Genesis).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Propietario |
| name | varchar | NOT NULL | Nombre del proyecto |
| description | text | nullable | Descripción |
| files | jsonb | DEFAULT '{}' | Archivos del proyecto |
| settings | jsonb | DEFAULT '{}' | Configuración |
| is_template | boolean | DEFAULT false | Es plantilla |
| template_category | varchar | nullable | Categoría si es template |
| github_repo | varchar | nullable | Repo conectado |
| created_at | timestamptz | DEFAULT now() | Fecha |
| updated_at | timestamptz | DEFAULT now() | Actualización |

**Indexes:**
- `studio_projects_user_id_idx` (user_id) - Proyectos del usuario
- `studio_projects_template_idx` (is_template) - Filtrar templates

### `studio_conversations`
Conversaciones del chat de Studio.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Propietario |
| project_id | uuid | FK → studio_projects.id | Proyecto asociado |
| title | varchar | nullable | Título de la conversación |
| model | varchar | nullable | Modelo usado |
| system_prompt | text | nullable | Prompt de sistema |
| metadata | jsonb | DEFAULT '{}' | Metadatos |
| created_at | timestamptz | DEFAULT now() | Fecha |
| updated_at | timestamptz | DEFAULT now() | Actualización |

**Indexes:**
- `studio_conversations_user_id_idx` (user_id) - Conversaciones del usuario
- `studio_conversations_project_idx` (project_id) - Del proyecto

### `studio_messages`
Mensajes individuales del chat.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| conversation_id | uuid | FK → studio_conversations.id | Conversación |
| role | varchar | NOT NULL | 'user', 'assistant', 'system' |
| content | text | NOT NULL | Contenido del mensaje |
| tokens_used | integer | nullable | Tokens consumidos |
| model | varchar | nullable | Modelo usado |
| latency_ms | integer | nullable | Tiempo de respuesta |
| created_at | timestamptz | DEFAULT now() | Fecha |

**Indexes:**
- `studio_messages_conversation_idx` (conversation_id) - Mensajes de la conversación
- `studio_messages_created_idx` (created_at) - Orden cronológico

### `github_connections`
Conexiones OAuth con GitHub.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | ID único |
| user_id | uuid | FK → profiles.user_id | Usuario |
| github_id | varchar | NOT NULL | ID de GitHub |
| github_username | varchar | NOT NULL | Username |
| access_token | text | NOT NULL | Token OAuth (encriptado) |
| refresh_token | text | nullable | Refresh token |
| scope | varchar | nullable | Permisos otorgados |
| created_at | timestamptz | DEFAULT now() | Fecha |
| updated_at | timestamptz | DEFAULT now() | Actualización |

**Indexes:**
- `github_connections_user_id_idx` (user_id) - Conexiones del usuario
- `github_connections_github_id_idx` (github_id) - Búsqueda por GitHub ID

## Views

### `user_stats`
Estadísticas agregadas por usuario.

```sql
CREATE VIEW user_stats AS
SELECT 
  p.user_id,
  p.email,
  p.credits_balance,
  p.subscription_tier,
  COUNT(DISTINCT s.id) as spaces_count,
  COUNT(DISTINCT sa.id) as assets_count,
  COUNT(DISTINCT sp.id) as projects_count
FROM profiles p
LEFT JOIN spaces s ON s.user_id = p.user_id
LEFT JOIN saved_assets sa ON sa.user_id = p.user_id
LEFT JOIN studio_projects sp ON sp.user_id = p.user_id
GROUP BY p.user_id, p.email, p.credits_balance, p.subscription_tier;
```

## Functions

### `deduct_credits(user_uuid, amount, description)`
Deduce créditos del usuario si tiene saldo suficiente.

```sql
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT 'Consumo de servicio'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
BEGIN
  SELECT credits_balance INTO v_balance 
  FROM profiles WHERE user_id = p_user_id;
  
  IF v_balance < p_amount THEN
    RETURN false;
  END IF;
  
  UPDATE profiles 
  SET credits_balance = credits_balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'debit', p_amount, p_description);
  
  RETURN true;
END;
$$;
```

### `add_credits(user_uuid, amount, description)`
Agrega créditos al usuario.

```sql
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT 'Recarga'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET credits_balance = credits_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'credit', p_amount, p_description);
END;
$$;
```

## RLS Policies

Todas las tablas tienen RLS (Row Level Security) habilitado.

### profiles
- `profiles_select_own`: Users can read own profile
- `profiles_update_own`: Users can update own profile
- `profiles_admin_all`: Admins can read all

### transactions
- `transactions_select_own`: Users can read own transactions
- `transactions_admin_all`: Admins can read all

### spaces
- `spaces_select_own`: Users can read own spaces
- `spaces_insert_own`: Users can create spaces
- `spaces_update_own`: Users can update own spaces
- `spaces_delete_own`: Users can delete own spaces

### saved_assets
- `assets_select_own`: Users can read own assets
- `assets_insert_own`: Users can create assets
- `assets_update_own`: Users can update own assets
- `assets_delete_own`: Users can delete own assets

## Performance Notes

- Todos los campos de búsqueda frecuente están indexados
- Las tablas `transactions` y `studio_messages` pueden crecer grandes → considerar particionamiento en el futuro
- Usar `jsonb` para campos flexibles permite índices GIN cuando sea necesario
- Soft deletes preferidos sobre hard deletes (usar `is_archived`, `deleted_at`)
