-- =============================================================================
-- CoupleCash — database schema
-- Run in Supabase SQL Editor as a single batch.
-- Idempotent: safe to re-run after edits.
-- =============================================================================

-- ---- Extensions -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---- updated_at trigger -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- ---- couples ----------------------------------------------------------------
-- One household. This app expects exactly one row.
CREATE TABLE IF NOT EXISTS public.couples (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'CoupleCash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- profiles ---------------------------------------------------------------
-- One row per auth user. Stores role and display info.
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id    UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  avatar_color TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_couple_idx ON public.profiles (couple_id);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- transactions -----------------------------------------------------------
-- Single source of truth for balance and savings math.
--   Saving deposit  = type=expense, category=saving (saldo user ↓, savings ↑)
--   Saving withdraw = type=income,  category=saving (saldo user ↑, savings ↓)
CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id        UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category         TEXT NOT NULL CHECK (
    category IN ('income', 'food', 'shop', 'transport', 'fun', 'bills', 'saving')
  ),
  amount           NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  note             TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- type and category must be consistent
  CONSTRAINT transactions_type_category_consistent CHECK (
    (type = 'income'  AND category IN ('income', 'saving')) OR
    (type = 'expense' AND category IN ('food', 'shop', 'transport', 'fun', 'bills', 'saving'))
  )
);
CREATE INDEX IF NOT EXISTS transactions_couple_date_idx
  ON public.transactions (couple_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS transactions_couple_user_date_idx
  ON public.transactions (couple_id, user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS transactions_couple_cat_idx
  ON public.transactions (couple_id, type, category);

DROP TRIGGER IF EXISTS transactions_set_updated_at ON public.transactions;
CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- saving_goal ------------------------------------------------------------
-- One active goal per couple (UNIQUE on couple_id enforces this).
CREATE TABLE IF NOT EXISTS public.saving_goal (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     UUID NOT NULL UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'Our shared goal',
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS saving_goal_set_updated_at ON public.saving_goal;
CREATE TRIGGER saving_goal_set_updated_at
  BEFORE UPDATE ON public.saving_goal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- recurring_templates ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category      TEXT NOT NULL CHECK (
    category IN ('income', 'food', 'shop', 'transport', 'fun', 'bills', 'saving')
  ),
  amount        NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  note          TEXT,
  day_of_month  INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  active        BOOLEAN NOT NULL DEFAULT true,
  last_run_date DATE,
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT recurring_type_category_consistent CHECK (
    (type = 'income'  AND category IN ('income', 'saving')) OR
    (type = 'expense' AND category IN ('food', 'shop', 'transport', 'fun', 'bills', 'saving'))
  )
);
CREATE INDEX IF NOT EXISTS recurring_active_idx
  ON public.recurring_templates (couple_id) WHERE active = true;

DROP TRIGGER IF EXISTS recurring_set_updated_at ON public.recurring_templates;
CREATE TRIGGER recurring_set_updated_at
  BEFORE UPDATE ON public.recurring_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- RLS HELPER FUNCTIONS
-- SECURITY DEFINER bypasses RLS on profiles to avoid recursive policy checks.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auth_couple_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- ---- couples ----------------------------------------------------------------
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS couples_select_own ON public.couples;
CREATE POLICY couples_select_own
  ON public.couples FOR SELECT TO authenticated
  USING (id = public.auth_couple_id());

-- ---- profiles ---------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_couple ON public.profiles;
CREATE POLICY profiles_select_couple
  ON public.profiles FOR SELECT TO authenticated
  USING (couple_id = public.auth_couple_id());

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND couple_id = public.auth_couple_id());

-- ---- transactions -----------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactions_select_couple ON public.transactions;
CREATE POLICY transactions_select_couple
  ON public.transactions FOR SELECT TO authenticated
  USING (couple_id = public.auth_couple_id());

-- Insert: must be own couple. Saving category requires admin.
DROP POLICY IF EXISTS transactions_insert_couple ON public.transactions;
CREATE POLICY transactions_insert_couple
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.auth_couple_id()
    AND (category <> 'saving' OR public.auth_is_admin())
  );

-- Update: either party can edit any transaction in the couple.
DROP POLICY IF EXISTS transactions_update_couple ON public.transactions;
CREATE POLICY transactions_update_couple
  ON public.transactions FOR UPDATE TO authenticated
  USING (couple_id = public.auth_couple_id())
  WITH CHECK (
    couple_id = public.auth_couple_id()
    AND (category <> 'saving' OR public.auth_is_admin())
  );

-- Delete: either party can delete any transaction in the couple.
DROP POLICY IF EXISTS transactions_delete_couple ON public.transactions;
CREATE POLICY transactions_delete_couple
  ON public.transactions FOR DELETE TO authenticated
  USING (couple_id = public.auth_couple_id());

-- ---- saving_goal ------------------------------------------------------------
ALTER TABLE public.saving_goal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saving_goal_select_couple ON public.saving_goal;
CREATE POLICY saving_goal_select_couple
  ON public.saving_goal FOR SELECT TO authenticated
  USING (couple_id = public.auth_couple_id());

DROP POLICY IF EXISTS saving_goal_update_admin ON public.saving_goal;
CREATE POLICY saving_goal_update_admin
  ON public.saving_goal FOR UPDATE TO authenticated
  USING (couple_id = public.auth_couple_id() AND public.auth_is_admin())
  WITH CHECK (couple_id = public.auth_couple_id() AND public.auth_is_admin());

-- ---- recurring_templates ----------------------------------------------------
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recurring_select_couple ON public.recurring_templates;
CREATE POLICY recurring_select_couple
  ON public.recurring_templates FOR SELECT TO authenticated
  USING (couple_id = public.auth_couple_id());

DROP POLICY IF EXISTS recurring_insert_admin ON public.recurring_templates;
CREATE POLICY recurring_insert_admin
  ON public.recurring_templates FOR INSERT TO authenticated
  WITH CHECK (couple_id = public.auth_couple_id() AND public.auth_is_admin());

DROP POLICY IF EXISTS recurring_update_admin ON public.recurring_templates;
CREATE POLICY recurring_update_admin
  ON public.recurring_templates FOR UPDATE TO authenticated
  USING (couple_id = public.auth_couple_id() AND public.auth_is_admin())
  WITH CHECK (couple_id = public.auth_couple_id() AND public.auth_is_admin());

DROP POLICY IF EXISTS recurring_delete_admin ON public.recurring_templates;
CREATE POLICY recurring_delete_admin
  ON public.recurring_templates FOR DELETE TO authenticated
  USING (couple_id = public.auth_couple_id() AND public.auth_is_admin());
