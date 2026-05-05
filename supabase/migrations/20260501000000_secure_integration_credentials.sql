-- ─── Secure integration_configs credentials ──────────────────────────────────
-- The initial setup.sql granted anon full SELECT on integration_configs,
-- which would expose stored API keys to any client with the anon key.
-- This migration replaces that policy with a role-segregated model.

-- 1. Drop the overly-permissive anon policy
DROP POLICY IF EXISTS "anon_all_integration_configs" ON integration_configs;

-- 2. Service role gets full access (used by all edge functions)
DROP POLICY IF EXISTS "service_role_all_integration_configs" ON integration_configs;
CREATE POLICY "service_role_all_integration_configs" ON integration_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Anon can INSERT / UPDATE integration configs from the UI (saving new credentials)
--    but cannot SELECT the credentials column directly.
DROP POLICY IF EXISTS "anon_insert_integration_configs" ON integration_configs;
CREATE POLICY "anon_insert_integration_configs" ON integration_configs
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_integration_configs" ON integration_configs;
CREATE POLICY "anon_update_integration_configs" ON integration_configs
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Anon SELECT is served through a view that strips credentials.
--    The frontend calls this view; the service role (edge function) hits the base table.
DROP VIEW IF EXISTS integration_configs_public;
CREATE VIEW integration_configs_public AS
  SELECT
    id,
    integration_id,
    name,
    provider,
    category,
    status,
    '{}'::jsonb AS credentials,
    last_sync_at,
    sync_status,
    error_message,
    created_at,
    updated_at
  FROM integration_configs;

-- Grant anon SELECT on the masked view only
GRANT SELECT ON integration_configs_public TO anon;

-- 5. Authenticated users (dealership staff logged in via Supabase Auth) get full access
DROP POLICY IF EXISTS "authenticated_all_integration_configs" ON integration_configs;
CREATE POLICY "authenticated_all_integration_configs" ON integration_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Done ─────────────────────────────────────────────────────────────────────
