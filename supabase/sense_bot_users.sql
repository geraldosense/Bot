-- Executar uma vez no Supabase: SQL Editor → New query → Run
-- Dashboard: https://supabase.com/dashboard → teu project → SQL Editor

CREATE TABLE IF NOT EXISTS public.sense_bot_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB NOT NULL DEFAULT '{"can_request_vip":false,"can_view_active_users":false,"can_manage_admins":false}'::jsonb,
  vip_approved_at TIMESTAMPTZ,
  vip_approved_by TEXT,
  vip_request JSONB,
  vip_revocation_request JSONB,
  last_login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sense_bot_users_email_idx ON public.sense_bot_users (LOWER(email));
CREATE INDEX IF NOT EXISTS sense_bot_users_role_idx ON public.sense_bot_users (role);

ALTER TABLE public.sense_bot_users ENABLE ROW LEVEL SECURITY;

-- Migração (executar se a tabela já existir):
-- ALTER TABLE public.sense_bot_users ADD COLUMN IF NOT EXISTS vip_revocation_request JSONB;

DROP POLICY IF EXISTS "server_only" ON public.sense_bot_users;
