-- ====================================================================
-- CUSTECH MARKETPLACE - MIGRATION 008: MASTER INFRASTRUCTURE & SECURITY SYNC
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project-id>/sql
--
-- This script is 100% IDEMPOTENT and SAFE:
-- 1. Creates any missing tables (wallets, escrow_orders, listing_likes, user_follows)
-- 2. Adds all missing columns (likes_count, followers_count, following_count, seller_id)
-- 3. Installs all financial RPCs (wallet transfer, escrow funding, release, refund, withdrawal)
-- 4. Installs security triggers preventing privilege escalation on profiles
-- 5. Configures Row Level Security (RLS) policies and execution permissions
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- SECTION 1: CORE TABLES & SCHEMA COMPLETION
-- ====================================================================

-- 1. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    locked_balance BIGINT NOT NULL DEFAULT 0 CHECK (locked_balance >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Ensure wallets exist for all existing profiles
INSERT INTO wallets (user_id, balance, locked_balance)
SELECT user_id, 0, 0 FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- 2. WALLET TRANSACTIONS COLUMNS
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed' 
  CHECK (status IN ('pending', 'completed', 'failed', 'reversed'));
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. ESCROW ORDERS TABLE
CREATE TABLE IF NOT EXISTS escrow_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending_payment' 
      CHECK (status IN ('pending_payment', 'funded', 'in_transit', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'wallet' 
      CHECK (payment_method IN ('wallet', 'paystack', 'direct')),
    funded_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    disputed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    buyer_notes TEXT,
    seller_notes TEXT,
    dispute_reason TEXT,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT escrow_orders_buyer_seller_diff CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_buyer ON escrow_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_seller ON escrow_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_status ON escrow_orders(status);

-- 4. LISTING LIKES TABLE
CREATE TABLE IF NOT EXISTS listing_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_listing_like UNIQUE (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_listing_likes_listing ON listing_likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_user ON listing_likes(user_id);

-- 5. LISTINGS TABLE COLUMNS
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;
UPDATE listings SET seller_id = user_id WHERE seller_id IS NULL;

-- 6. PROFILES COUNTER COLUMNS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

-- 7. USER FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> following_id),
    CONSTRAINT user_follows_unique_pair UNIQUE (follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- ====================================================================
-- SECTION 2: AUTOMATIC COUNTER & SECURITY TRIGGERS
-- ====================================================================

-- Trigger: Auto create wallet when profile is created
CREATE OR REPLACE FUNCTION auto_create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, locked_balance)
  VALUES (NEW.user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_user_wallet ON profiles;
CREATE TRIGGER trg_auto_create_user_wallet
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION auto_create_user_wallet();

-- Trigger: Update listing likes count
CREATE OR REPLACE FUNCTION update_listing_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE listings SET likes_count = likes_count + 1 WHERE id = NEW.listing_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE listings SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_listing_likes_count ON listing_likes;
CREATE TRIGGER trg_update_listing_likes_count
AFTER INSERT OR DELETE ON listing_likes
FOR EACH ROW EXECUTE FUNCTION update_listing_likes_count();

-- Trigger: Auto maintain followers & following counters on profiles
CREATE OR REPLACE FUNCTION maintain_user_follows_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE user_id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_maintain_user_follows_counts ON user_follows;
CREATE TRIGGER trg_maintain_user_follows_counts
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION maintain_user_follows_counts();

-- Trigger: Anti-Privilege Escalation on Profiles
CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) <> 'service_role' AND (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your verification status directly.';
    END IF;
    IF NEW.trust_level IS DISTINCT FROM OLD.trust_level THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your trust level directly.';
    END IF;
    IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
      RAISE EXCEPTION 'Access Denied: You cannot alter your rating metrics.';
    END IF;
    IF NEW.completed_transactions IS DISTINCT FROM OLD.completed_transactions THEN
      RAISE EXCEPTION 'Access Denied: You cannot alter completed transactions count.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_fields ON profiles;
CREATE TRIGGER trg_protect_sensitive_profile_fields
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_sensitive_profile_fields();

-- ====================================================================
-- SECTION 3: STORED PROCEDURES (RPCs)
-- ====================================================================

-- 1. INCREMENT LISTING VIEW
CREATE OR REPLACE FUNCTION increment_listing_view(listing_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE listings
    SET view_count = view_count + 1
    WHERE id = listing_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREDIT WALLET BALANCE (Paystack top-up webhook, service_role only)
CREATE OR REPLACE FUNCTION credit_wallet_balance(
    p_user_id UUID,
    p_amount_kobo BIGINT,
    p_reference TEXT,
    p_description TEXT DEFAULT 'Wallet top-up via Paystack'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance BIGINT;
    v_wallet_id UUID;
    v_existing_tx UUID;
BEGIN
    IF current_setting('role', true) <> 'service_role' THEN
      RAISE EXCEPTION 'Access Denied: credit_wallet_balance can only be invoked by service_role.';
    END IF;

    IF p_amount_kobo <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;

    SELECT id INTO v_existing_tx FROM wallet_transactions WHERE reference = p_reference;
    IF v_existing_tx IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Already processed');
    END IF;

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

    INSERT INTO wallet_transactions (
      wallet_id, user_id, type, amount, balance_after, reference, description, status
    ) VALUES (
      v_wallet_id, p_user_id, 'credit', p_amount_kobo, v_balance, p_reference, p_description, 'completed'
    );

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
REVOKE EXECUTE ON FUNCTION credit_wallet_balance(UUID, BIGINT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION credit_wallet_balance(UUID, BIGINT, TEXT, TEXT) TO service_role;

-- 3. PROCESS WALLET TRANSFER (P2P student transfer)
CREATE OR REPLACE FUNCTION process_wallet_transfer(
    p_sender_id UUID,
    p_recipient_id UUID,
    p_amount_kobo BIGINT,
    p_reference TEXT,
    p_description TEXT DEFAULT 'Student P2P Transfer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sender_wallet_id UUID;
    v_recipient_wallet_id UUID;
    v_sender_balance BIGINT;
    v_recipient_balance BIGINT;
    v_existing_tx UUID;
    v_sender_name TEXT;
    v_recipient_name TEXT;
BEGIN
    IF current_setting('role', true) <> 'service_role' AND auth.uid() <> p_sender_id THEN
      RAISE EXCEPTION 'Access Denied: You cannot transfer funds from another account.';
    END IF;

    IF p_amount_kobo <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero.');
    END IF;

    IF p_sender_id = p_recipient_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'You cannot transfer funds to your own wallet.');
    END IF;

    SELECT id INTO v_existing_tx FROM wallet_transactions WHERE reference = p_reference;
    IF v_existing_tx IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Transaction reference has already been processed.');
    END IF;

    IF p_sender_id < p_recipient_id THEN
      SELECT id, balance INTO v_sender_wallet_id, v_sender_balance FROM wallets WHERE user_id = p_sender_id FOR UPDATE;
      SELECT id, balance INTO v_recipient_wallet_id, v_recipient_balance FROM wallets WHERE user_id = p_recipient_id FOR UPDATE;
    ELSE
      SELECT id, balance INTO v_recipient_wallet_id, v_recipient_balance FROM wallets WHERE user_id = p_recipient_id FOR UPDATE;
      SELECT id, balance INTO v_sender_wallet_id, v_sender_balance FROM wallets WHERE user_id = p_sender_id FOR UPDATE;
    END IF;

    IF v_sender_wallet_id IS NULL OR v_sender_balance < p_amount_kobo THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds in sender wallet.');
    END IF;

    IF v_recipient_wallet_id IS NULL THEN
      INSERT INTO wallets (user_id, balance, locked_balance)
      VALUES (p_recipient_id, 0, 0)
      RETURNING id, balance INTO v_recipient_wallet_id, v_recipient_balance;
    END IF;

    UPDATE wallets SET balance = balance - p_amount_kobo, updated_at = NOW() WHERE id = v_sender_wallet_id RETURNING balance INTO v_sender_balance;
    UPDATE wallets SET balance = balance + p_amount_kobo, updated_at = NOW() WHERE id = v_recipient_wallet_id RETURNING balance INTO v_recipient_balance;

    SELECT display_name INTO v_sender_name FROM profiles WHERE user_id = p_sender_id;
    SELECT display_name INTO v_recipient_name FROM profiles WHERE user_id = p_recipient_id;

    INSERT INTO wallet_transactions (wallet_id, user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status)
    VALUES (v_sender_wallet_id, p_sender_id, p_sender_id, p_recipient_id, 'transfer_out', -p_amount_kobo, v_sender_balance, p_reference, 'Sent ₦' || (p_amount_kobo / 100)::text || ' to ' || COALESCE(v_recipient_name, 'student'), 'completed');

    INSERT INTO wallet_transactions (wallet_id, user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status)
    VALUES (v_recipient_wallet_id, p_recipient_id, p_sender_id, p_recipient_id, 'transfer_in', p_amount_kobo, v_recipient_balance, p_reference || '_in', 'Received ₦' || (p_amount_kobo / 100)::text || ' from ' || COALESCE(v_sender_name, 'student'), 'completed');

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (p_recipient_id, 'wallet_transfer', 'Funds Received', 'You received ₦' || (p_amount_kobo / 100)::text || ' from ' || COALESCE(v_sender_name, 'a student') || '.', jsonb_build_object('amount', p_amount_kobo, 'sender_id', p_sender_id));

    RETURN jsonb_build_object('success', true, 'sender_new_balance', v_sender_balance, 'recipient_new_balance', v_recipient_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION process_wallet_transfer(UUID, UUID, BIGINT, TEXT, TEXT) TO authenticated, service_role;

-- 4. FUND ESCROW ORDER FROM WALLET
CREATE OR REPLACE FUNCTION fund_escrow_order_from_wallet(
    p_order_id UUID,
    p_buyer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_amount BIGINT;
    v_seller_id UUID;
    v_order_status TEXT;
    v_order_number TEXT;
    v_wallet_id UUID;
    v_balance BIGINT;
    v_new_balance BIGINT;
    v_buyer_name TEXT;
BEGIN
    IF current_setting('role', true) <> 'service_role' AND auth.uid() <> p_buyer_id THEN
      RAISE EXCEPTION 'Access Denied: You cannot fund an order on behalf of another user.';
    END IF;

    SELECT amount, seller_id, status, order_number INTO v_amount, v_seller_id, v_order_status, v_order_number
    FROM escrow_orders WHERE id = p_order_id AND buyer_id = p_buyer_id FOR UPDATE;

    IF v_amount IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order not found.');
    END IF;

    IF v_order_status <> 'pending_payment' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order is not in pending_payment status.');
    END IF;

    SELECT id, balance INTO v_wallet_id, v_balance FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;

    IF v_wallet_id IS NULL OR v_balance < v_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance to fund this order.');
    END IF;

    v_new_balance := v_balance - v_amount;
    UPDATE wallets SET balance = v_new_balance, locked_balance = locked_balance + v_amount, updated_at = NOW() WHERE id = v_wallet_id;

    UPDATE escrow_orders SET status = 'funded', funded_at = NOW(), updated_at = NOW() WHERE id = p_order_id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, reference, description, status, metadata)
    VALUES (v_wallet_id, p_buyer_id, 'escrow_lock', -v_amount, v_new_balance, 'ESCROW_' || v_order_number, 'Funds held in escrow for order #' || v_order_number, 'completed', jsonb_build_object('order_id', p_order_id));

    SELECT display_name INTO v_buyer_name FROM profiles WHERE user_id = p_buyer_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_seller_id, 'order_funded', 'Order Funded & Escrow Locked', 'A student (' || COALESCE(v_buyer_name, 'Campus Buyer') || ') funded order #' || v_order_number || '. Funds are safely locked in escrow. You can now deliver the item.', jsonb_build_object('order_id', p_order_id));

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'order_status', 'funded');
END;
$$;
GRANT EXECUTE ON FUNCTION fund_escrow_order_from_wallet(UUID, UUID) TO authenticated, service_role;

-- 5. RELEASE ESCROW FUNDS (Order completed -> payout to seller)
CREATE OR REPLACE FUNCTION release_escrow_funds(
    p_order_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_buyer_wallet_id UUID;
    v_seller_wallet_id UUID;
    v_seller_balance BIGINT;
    v_is_super_admin BOOLEAN := FALSE;
BEGIN
    SELECT is_admin(p_actor_id) INTO v_is_super_admin;
    
    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order not found.');
    END IF;

    IF current_setting('role', true) <> 'service_role' AND auth.uid() <> v_order.buyer_id AND NOT v_is_super_admin THEN
      RAISE EXCEPTION 'Access Denied: Only the buyer or an admin can release escrow funds.';
    END IF;

    IF v_order.status NOT IN ('funded', 'in_transit', 'delivered') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot release funds for order in status: ' || v_order.status);
    END IF;

    SELECT id INTO v_buyer_wallet_id FROM wallets WHERE user_id = v_order.buyer_id FOR UPDATE;
    IF v_buyer_wallet_id IS NOT NULL THEN
      UPDATE wallets SET locked_balance = GREATEST(0, locked_balance - v_order.amount), updated_at = NOW() WHERE id = v_buyer_wallet_id;
    END IF;

    SELECT id, balance INTO v_seller_wallet_id, v_seller_balance FROM wallets WHERE user_id = v_order.seller_id FOR UPDATE;
    IF v_seller_wallet_id IS NULL THEN
      INSERT INTO wallets (user_id, balance, locked_balance) VALUES (v_order.seller_id, v_order.amount, 0)
      RETURNING id, balance INTO v_seller_wallet_id, v_seller_balance;
    ELSE
      UPDATE wallets SET balance = balance + v_order.amount, updated_at = NOW() WHERE id = v_seller_wallet_id
      RETURNING balance INTO v_seller_balance;
    END IF;

    UPDATE escrow_orders SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = p_order_id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, reference, description, status, metadata)
    VALUES (v_seller_wallet_id, v_order.seller_id, 'escrow_payout', v_order.amount, v_seller_balance, 'PAYOUT_' || v_order.order_number, 'Escrow payout for order #' || v_order.order_number, 'completed', jsonb_build_object('order_id', p_order_id));

    UPDATE profiles SET completed_transactions = completed_transactions + 1 WHERE user_id IN (v_order.buyer_id, v_order.seller_id);

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_order.seller_id, 'escrow_released', 'Escrow Funds Credited!', '₦' || (v_order.amount / 100)::text || ' has been released and credited to your student wallet for order #' || v_order.order_number || '.', jsonb_build_object('order_id', p_order_id));

    RETURN jsonb_build_object('success', true, 'order_status', 'completed', 'seller_balance', v_seller_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION release_escrow_funds(UUID, UUID) TO authenticated, service_role;

-- 6. REFUND ESCROW ORDER (Dispute resolved -> refund to buyer)
CREATE OR REPLACE FUNCTION refund_escrow_order(
    p_order_id UUID,
    p_actor_id UUID,
    p_reason TEXT DEFAULT 'Dispute resolved in buyer favor'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_buyer_wallet_id UUID;
    v_buyer_balance BIGINT;
    v_is_super_admin BOOLEAN := FALSE;
BEGIN
    SELECT is_admin(p_actor_id) INTO v_is_super_admin;

    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order not found.');
    END IF;

    IF current_setting('role', true) <> 'service_role' AND auth.uid() <> v_order.seller_id AND NOT v_is_super_admin THEN
      RAISE EXCEPTION 'Access Denied: Only the seller or an authorized admin can authorize a refund.';
    END IF;

    IF v_order.status NOT IN ('funded', 'in_transit', 'delivered', 'disputed') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot refund order in status: ' || v_order.status);
    END IF;

    SELECT id, balance INTO v_buyer_wallet_id, v_buyer_balance FROM wallets WHERE user_id = v_order.buyer_id FOR UPDATE;
    IF v_buyer_wallet_id IS NULL THEN
      INSERT INTO wallets (user_id, balance, locked_balance) VALUES (v_order.buyer_id, v_order.amount, 0)
      RETURNING id, balance INTO v_buyer_wallet_id, v_buyer_balance;
    ELSE
      UPDATE wallets SET balance = balance + v_order.amount, locked_balance = GREATEST(0, locked_balance - v_order.amount), updated_at = NOW()
      WHERE id = v_buyer_wallet_id RETURNING balance INTO v_buyer_balance;
    END IF;

    UPDATE escrow_orders SET status = 'refunded', resolution_notes = p_reason, resolved_by = p_actor_id, updated_at = NOW() WHERE id = p_order_id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, reference, description, status, metadata)
    VALUES (v_buyer_wallet_id, v_order.buyer_id, 'escrow_refund', v_order.amount, v_buyer_balance, 'REFUND_' || v_order.order_number, 'Refund for order #' || v_order.order_number, 'completed', jsonb_build_object('order_id', p_order_id));

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_order.buyer_id, 'escrow_refunded', 'Order Refunded', '₦' || (v_order.amount / 100)::text || ' has been returned to your wallet for order #' || v_order.order_number || '.', jsonb_build_object('order_id', p_order_id));

    RETURN jsonb_build_object('success', true, 'order_status', 'refunded', 'buyer_balance', v_buyer_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION refund_escrow_order(UUID, UUID, TEXT) TO authenticated, service_role;

-- 7. REQUEST WALLET WITHDRAWAL
CREATE OR REPLACE FUNCTION request_wallet_withdrawal(
    p_user_id UUID,
    p_amount_kobo BIGINT,
    p_reference TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet_id UUID;
    v_balance BIGINT;
    v_new_balance BIGINT;
BEGIN
    IF current_setting('role', true) <> 'service_role' AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Access Denied: You cannot withdraw funds on behalf of another user.';
    END IF;

    IF p_amount_kobo <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Withdrawal amount must be greater than zero.');
    END IF;

    SELECT id, balance INTO v_wallet_id, v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;

    IF v_wallet_id IS NULL OR v_balance < p_amount_kobo THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance for this withdrawal amount.');
    END IF;

    v_new_balance := v_balance - p_amount_kobo;
    UPDATE wallets SET balance = v_new_balance, updated_at = NOW() WHERE id = v_wallet_id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, reference, description, status, metadata)
    VALUES (v_wallet_id, p_user_id, 'withdrawal', -p_amount_kobo, v_new_balance, p_reference, p_description, 'pending', p_metadata);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'wallet_id', v_wallet_id);
END;
$$;
GRANT EXECUTE ON FUNCTION request_wallet_withdrawal(UUID, BIGINT, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- ====================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages wallets" ON wallets;
CREATE POLICY "Service role manages wallets" ON wallets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Wallet Transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users view own wallet transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages wallet transactions" ON wallet_transactions;
CREATE POLICY "Service role manages wallet transactions" ON wallet_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Escrow Orders
ALTER TABLE escrow_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own orders" ON escrow_orders;
CREATE POLICY "Users view own orders" ON escrow_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users create orders" ON escrow_orders;
CREATE POLICY "Users create orders" ON escrow_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "Service role manages orders" ON escrow_orders;
CREATE POLICY "Service role manages orders" ON escrow_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Listing Likes
ALTER TABLE listing_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view listing likes" ON listing_likes;
CREATE POLICY "Public view listing likes" ON listing_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users toggle own likes" ON listing_likes;
CREATE POLICY "Users toggle own likes" ON listing_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users remove own likes" ON listing_likes;
CREATE POLICY "Users remove own likes" ON listing_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON wallets, wallet_transactions, escrow_orders, listing_likes TO authenticated, service_role;
GRANT SELECT ON listing_likes TO anon;
