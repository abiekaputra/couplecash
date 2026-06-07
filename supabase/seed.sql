-- =============================================================================
-- CoupleCash — seed data
-- Run AFTER schema.sql. Idempotent (uses ON CONFLICT DO NOTHING).
--
-- Creates:
--   1 couple: "Abieka & Semma"
--   2 auth users: abieka@couplecash.app (admin) + semma@couplecash.app (member)
--   2 profiles linked to the couple
--   1 saving goal (Rp 10.000.000 placeholder — admin can edit later)
--
-- Login from the app:
--   username: abieka  password: changeme  (admin)
--   username: semma   password: changeme
--
-- If this script fails on auth.users/auth.identities (Supabase auth schema
-- can change between versions), use the FALLBACK at the bottom of this file.
-- =============================================================================

DO $$
DECLARE
  couple_uuid UUID := 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0';
  abieka_uuid UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  semma_uuid  UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
  -- ---- Couple --------------------------------------------------------------
  INSERT INTO public.couples (id, name)
  VALUES (couple_uuid, 'Abieka & Semma')
  ON CONFLICT (id) DO NOTHING;

  -- ---- Auth users ----------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES
    (
      abieka_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'abieka@couplecash.app',
      crypt('changeme', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"abieka"}'::jsonb,
      now(),
      now()
    ),
    (
      semma_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'semma@couplecash.app',
      crypt('changeme', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"semma"}'::jsonb,
      now(),
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  -- ---- Auth identities (required for password login) ----------------------
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      abieka_uuid::TEXT,
      abieka_uuid,
      jsonb_build_object(
        'sub', abieka_uuid::TEXT,
        'email', 'abieka@couplecash.app',
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    ),
    (
      semma_uuid::TEXT,
      semma_uuid,
      jsonb_build_object(
        'sub', semma_uuid::TEXT,
        'email', 'semma@couplecash.app',
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- ---- Profiles ------------------------------------------------------------
  INSERT INTO public.profiles (id, couple_id, username, display_name, role, avatar_color)
  VALUES
    (abieka_uuid, couple_uuid, 'abieka', 'Abieka', 'admin',  '#FF8B7B'),
    (semma_uuid,  couple_uuid, 'semma',  'Semma',  'member', '#7DB9DE')
  ON CONFLICT (id) DO NOTHING;

  -- ---- Saving goal ---------------------------------------------------------
  INSERT INTO public.saving_goal (couple_id, title, target_amount)
  VALUES (couple_uuid, 'Our shared goal', 10000000)
  ON CONFLICT (couple_id) DO NOTHING;
END $$;

-- =============================================================================
-- FALLBACK
-- If the DO block above fails on auth.users or auth.identities (e.g. column
-- mismatch on a newer Supabase version), do this instead:
--
-- 1. In Supabase dashboard, go to Authentication → Users → Add user.
--    - Email: abieka@couplecash.app   Password: changeme   (auto-confirm)
--    - Email: semma@couplecash.app    Password: changeme   (auto-confirm)
-- 2. Copy each user's UUID from the dashboard.
-- 3. Run the snippet below, replacing <ABIEKA_UUID> and <SEMMA_UUID>.
-- =============================================================================

-- INSERT INTO public.couples (id, name)
-- VALUES ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'Abieka & Semma')
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO public.profiles (id, couple_id, username, display_name, role, avatar_color)
-- VALUES
--   ('<ABIEKA_UUID>', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'abieka', 'Abieka', 'admin',  '#FF8B7B'),
--   ('<SEMMA_UUID>',  'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'semma',  'Semma',  'member', '#7DB9DE');
--
-- INSERT INTO public.saving_goal (couple_id, title, target_amount)
-- VALUES ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'Our shared goal', 10000000);
