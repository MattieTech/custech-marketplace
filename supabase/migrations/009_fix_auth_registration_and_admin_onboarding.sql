-- ====================================================================
-- CUSTECH MARKETPLACE - MIGRATION 009: FIX AUTH REGISTRATION & ADMIN ONBOARDING
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/flozbereqrooyqmqalnu/sql
-- ====================================================================

-- 1. Ensure wallets unique constraint on user_id exists for safe idempotent inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.wallets'::regclass AND contype = 'u' AND conname = 'wallets_user_id_key'
  ) THEN
    -- Check if a unique constraint on user_id already exists under any name
    IF NOT EXISTS (
      SELECT 1 FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'public.wallets'::regclass AND i.indisunique = true AND a.attname = 'user_id'
    ) THEN
      ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Grant public schema permissions to supabase_auth_admin (required for signup triggers)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON TABLE public.wallets TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 3. Fix auto_create_user_wallet trigger function (Hardened with explicit schema and exception safety)
CREATE OR REPLACE FUNCTION public.auto_create_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, locked_balance, currency)
  VALUES (NEW.user_id, 0, 0, 'NGN')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never crash profile creation if wallet already exists or fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_user_wallet ON public.profiles;
CREATE TRIGGER trg_auto_create_user_wallet
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_create_user_wallet();

-- 4. Fix handle_new_user trigger on auth.users (Bulletproofed with search_path and exception fallback)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_display_name TEXT;
  v_username TEXT;
  v_referral_code TEXT;
BEGIN
  -- Extract user metadata
  v_display_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'name',
    'Student_' || substr(new.id::text, 1, 6)
  );

  v_username := COALESCE(
    new.raw_user_meta_data->>'username',
    'student_' || substr(new.id::text, 1, 6)
  );

  v_referral_code := COALESCE(
    new.raw_user_meta_data->>'referral_code',
    v_username,
    substr(md5(random()::text), 1, 8)
  );

  -- Safe upsert into profiles
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, username, referral_code)
    VALUES (
      new.id,
      v_display_name,
      v_username,
      v_referral_code
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
      username = COALESCE(EXCLUDED.username, profiles.username),
      referral_code = COALESCE(EXCLUDED.referral_code, profiles.referral_code);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: insert minimal profile row if username/referral_code has collision
    BEGIN
      INSERT INTO public.profiles (user_id, display_name, referral_code)
      VALUES (
        new.id,
        v_display_name,
        substr(md5(random()::text || new.id::text), 1, 8)
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Log warning but NEVER abort the auth transaction
      RAISE WARNING 'handle_new_user profile creation notice: %', SQLERRM;
    END;
  END;

  -- Ensure wallet is initialized immediately
  BEGIN
    INSERT INTO public.wallets (user_id, balance, locked_balance, currency)
    VALUES (new.id, 0, 0, 'NGN')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN new;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.auto_create_user_wallet() TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- Recreate trigger cleanly on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure admin_roles has unique constraint on user_id for clean 1-role per user assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.admin_roles'::regclass AND contype = 'u' AND conname = 'admin_roles_user_id_key'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'public.admin_roles'::regclass AND i.indisunique = true AND a.attname = 'user_id'
    ) THEN
      ALTER TABLE public.admin_roles ADD CONSTRAINT admin_roles_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
