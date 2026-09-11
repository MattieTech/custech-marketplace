-- ====================================================================
-- CUSTECH MARKETPLACE - MIGRATION 005: SECURITY & SCHEMA FIXES
-- Protects sensitive profile columns from client elevation
-- Adds atomic idempotent wallet credit procedure
-- Adds foreign key constraints for safe PostgREST joins
-- ====================================================================

-- 1. PREVENT CLIENT PRIVILEGE ESCALATION ON PROFILES
CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If request is from an authenticated or anonymous client (not service_role/superuser)
  IF current_setting('role', true) <> 'service_role' AND (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'You are not permitted to change your verification status directly.';
    END IF;
    IF NEW.trust_level IS DISTINCT FROM OLD.trust_level THEN
      RAISE EXCEPTION 'You are not permitted to change your trust level directly.';
    END IF;
    IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
      RAISE EXCEPTION 'You are not permitted to modify your rating metrics.';
    END IF;
    IF NEW.completed_transactions IS DISTINCT FROM OLD.completed_transactions THEN
      RAISE EXCEPTION 'You are not permitted to alter completed transactions count.';
    END IF;
    IF (to_jsonb(NEW) ? 'role') AND (to_jsonb(OLD) ? 'role') THEN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'You cannot grant yourself administrative roles.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_fields ON profiles;
CREATE TRIGGER trg_protect_sensitive_profile_fields
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_sensitive_profile_fields();

-- 2. ATOMIC IDEMPOTENT WALLET CREDIT PROCEDURE (Always in KOBO)
CREATE OR REPLACE FUNCTION credit_wallet_balance(
    p_user_id UUID,
    p_amount_kobo BIGINT,
    p_reference TEXT,
    p_description TEXT DEFAULT 'Wallet top-up via Paystack'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance BIGINT;
    v_wallet_id UUID;
    v_existing_tx UUID;
BEGIN
    IF p_amount_kobo <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;

    -- Idempotency check: Don't process reference twice
    SELECT id INTO v_existing_tx FROM wallet_transactions WHERE reference = p_reference;
    IF v_existing_tx IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Already processed');
    END IF;

    -- Ensure wallet exists and lock for update
    SELECT id, balance INTO v_wallet_id, v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_wallet_id IS NULL THEN
      INSERT INTO wallets (user_id, balance, locked_balance)
      VALUES (p_user_id, p_amount_kobo, 0)
      RETURNING id, balance INTO v_wallet_id, v_balance;
    ELSE
      UPDATE wallets
      SET balance = balance + p_amount_kobo, updated_at = NOW()
      WHERE id = v_wallet_id
      RETURNING balance INTO v_balance;
    END IF;

    -- Insert wallet transaction ledger entry in Kobo
    INSERT INTO wallet_transactions (
      wallet_id, user_id, type, amount, balance_after, reference, description, status
    ) VALUES (
      v_wallet_id, p_user_id, 'credit', p_amount_kobo, v_balance, p_reference, p_description, 'completed'
    );

    -- Notify student
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      p_user_id,
      'wallet_credit',
      'Wallet Funded Successfully',
      'Your wallet has been credited with ₦' || (p_amount_kobo / 100)::text || '. Current balance: ₦' || (v_balance / 100)::text || '.',
      jsonb_build_object('amount', p_amount_kobo, 'reference', p_reference)
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_balance);
END;
$$;

-- 3. ENSURE POSTGREST FOREIGN KEYS FOR TRANSACTIONS & DISPUTES
DO $$
BEGIN
  -- Link disputes opened_by to profiles user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_disputes_opened_by_profiles'
  ) THEN
    ALTER TABLE disputes 
    ADD CONSTRAINT fk_disputes_opened_by_profiles 
    FOREIGN KEY (opened_by) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- Link transactions buyer_id and seller_id to profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_buyer_profiles'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT fk_transactions_buyer_profiles 
    FOREIGN KEY (buyer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_seller_profiles'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT fk_transactions_seller_profiles 
    FOREIGN KEY (seller_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;
