-- ====================================================================
-- CUSTECH MARKETPLACE - MIGRATION 004: REAL INFRASTRUCTURE & ESCROW
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project-id>/sql
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UPDATE ADMIN ROLES CONSTRAINT TO SUPPORT EXTENDED ROLES
ALTER TABLE admin_roles DROP CONSTRAINT IF EXISTS admin_roles_role_check;
ALTER TABLE admin_roles ADD CONSTRAINT admin_roles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'moderator', 'verification_officer', 'finance_admin', 'support_agent', 'campus_ambassador'));

-- 2. ENSURE LISTINGS HAS REQUIRED COLUMNS & FOREIGN KEYS
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Backfill seller_id from user_id if null
UPDATE listings SET seller_id = user_id WHERE seller_id IS NULL;

-- Link listings.user_id to profiles.user_id for automatic PostgREST joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_listings_profiles'
  ) THEN
    -- Ensure profiles user_id is unique before adding FK
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;

    ALTER TABLE listings
    ADD CONSTRAINT fk_listings_profiles
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. REAL LISTING LIKES TABLE
CREATE TABLE IF NOT EXISTS listing_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_listing_like UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_likes_listing ON listing_likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_user ON listing_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_created ON listing_likes(created_at DESC);

-- Trigger to maintain listings.likes_count accurately
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

-- 4. REAL WALLET INFRASTRUCTURE
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

-- Ensure wallet_transactions has all necessary columns
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed' 
  CHECK (status IN ('pending', 'completed', 'failed', 'reversed'));
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Automatically create a wallet for existing users who don't have one
INSERT INTO wallets (user_id, balance, locked_balance)
SELECT user_id, 0, 0 FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- Trigger to create wallet automatically when new user profile is created
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

-- 5. REAL ESCROW ORDERS TABLE & TRANSACTION STATE MACHINE
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
CREATE INDEX IF NOT EXISTS idx_escrow_orders_listing ON escrow_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_status ON escrow_orders(status);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_number ON escrow_orders(order_number);

-- 6. PLATFORM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed basic platform settings if empty
INSERT INTO platform_settings (key, value, description)
VALUES 
  ('verification_fee_kobo', '100000', 'Student verification fee in kobo (1,000 NGN)'),
  ('escrow_fee_percent', '0', 'Platform escrow protection fee percentage'),
  ('min_withdrawal_kobo', '100000', 'Minimum withdrawal balance in kobo (1,000 NGN)'),
  ('maintenance_mode', 'false', 'Global platform maintenance flag')
ON CONFLICT (key) DO NOTHING;

-- 7. ATOMIC FINANCIAL PROCEDURES (Server-side Source of Truth)

-- A. P2P Wallet Transfer Procedure
CREATE OR REPLACE FUNCTION process_wallet_transfer(
    p_sender_id UUID,
    p_recipient_id UUID,
    p_amount BIGINT,
    p_reference TEXT,
    p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_balance BIGINT;
    v_recipient_balance BIGINT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero.');
    END IF;

    IF p_sender_id = p_recipient_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot transfer funds to your own wallet.');
    END IF;

    -- Lock sender wallet row for update
    SELECT balance INTO v_sender_balance 
    FROM wallets 
    WHERE user_id = p_sender_id 
    FOR UPDATE;

    IF v_sender_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found.');
    END IF;

    IF v_sender_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance.');
    END IF;

    -- Lock recipient wallet row for update
    SELECT balance INTO v_recipient_balance 
    FROM wallets 
    WHERE user_id = p_recipient_id 
    FOR UPDATE;

    IF v_recipient_balance IS NULL THEN
        -- Auto-create recipient wallet if missing
        INSERT INTO wallets (user_id, balance, locked_balance)
        VALUES (p_recipient_id, 0, 0)
        RETURNING balance INTO v_recipient_balance;
    END IF;

    -- Perform balance updates
    UPDATE wallets 
    SET balance = balance - p_amount, updated_at = NOW() 
    WHERE user_id = p_sender_id;

    UPDATE wallets 
    SET balance = balance + p_amount, updated_at = NOW() 
    WHERE user_id = p_recipient_id;

    -- Insert debit transaction for sender
    INSERT INTO wallet_transactions (
        user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status
    ) VALUES (
        p_sender_id, p_sender_id, p_recipient_id, 'debit', -p_amount, v_sender_balance - p_amount, 
        p_reference || '-DEBIT', p_description, 'completed'
    );

    -- Insert credit transaction for recipient
    INSERT INTO wallet_transactions (
        user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status
    ) VALUES (
        p_recipient_id, p_sender_id, p_recipient_id, 'credit', p_amount, v_recipient_balance + p_amount, 
        p_reference || '-CREDIT', p_description, 'completed'
    );

    -- Send notification to recipient
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        p_recipient_id,
        'wallet_credit',
        'Wallet Credited',
        'You received a transfer of ₦' || (p_amount / 100)::text || ' into your CUSTECH wallet.',
        jsonb_build_object('sender_id', p_sender_id, 'amount', p_amount, 'reference', p_reference)
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_sender_balance - p_amount);
END;
$$;

-- B. Fund Escrow Order from Wallet
CREATE OR REPLACE FUNCTION fund_escrow_order_from_wallet(
    p_order_id UUID,
    p_buyer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_buyer_balance BIGINT;
BEGIN
    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id AND buyer_id = p_buyer_id FOR UPDATE;
    
    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow order not found or unauthorized.');
    END IF;

    IF v_order.status <> 'pending_payment' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order has already been funded or processed.');
    END IF;

    -- Check buyer wallet
    SELECT balance INTO v_buyer_balance FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
    
    IF v_buyer_balance IS NULL OR v_buyer_balance < v_order.amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance to fund this escrow order.');
    END IF;

    -- Deduct from buyer balance, move order to funded
    UPDATE wallets 
    SET balance = balance - v_order.amount, updated_at = NOW() 
    WHERE user_id = p_buyer_id;

    UPDATE escrow_orders 
    SET status = 'funded', funded_at = NOW(), updated_at = NOW() 
    WHERE id = p_order_id;

    -- Record wallet transaction
    INSERT INTO wallet_transactions (
        user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status, metadata
    ) VALUES (
        p_buyer_id, p_buyer_id, v_order.seller_id, 'debit', -v_order.amount, v_buyer_balance - v_order.amount,
        v_order.order_number || '-ESCROW-FUND', 'Escrow payment funded for order #' || v_order.order_number, 'completed',
        jsonb_build_object('order_id', p_order_id, 'listing_id', v_order.listing_id)
    );

    -- Notify seller
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_order.seller_id,
        'escrow_funded',
        'New Funded Escrow Order #' || v_order.order_number,
        'A buyer has funded order #' || v_order.order_number || '. Please prepare and deliver the item safely.',
        jsonb_build_object('order_id', p_order_id, 'order_number', v_order.order_number)
    );

    RETURN jsonb_build_object('success', true, 'order_status', 'funded');
END;
$$;

-- C. Release Escrow Order Funds to Seller Wallet
CREATE OR REPLACE FUNCTION release_escrow_funds(
    p_order_id UUID,
    p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_seller_balance BIGINT;
    v_is_authorized BOOLEAN;
BEGIN
    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow order not found.');
    END IF;

    -- Caller must be the buyer or an admin
    v_is_authorized := (v_order.buyer_id = p_caller_id) OR is_admin(p_caller_id);
    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only the buyer or an administrator can release escrow funds.');
    END IF;

    IF v_order.status NOT IN ('funded', 'in_transit', 'delivered', 'disputed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order cannot be released in status: ' || v_order.status);
    END IF;

    -- Credit seller wallet
    SELECT balance INTO v_seller_balance FROM wallets WHERE user_id = v_order.seller_id FOR UPDATE;
    IF v_seller_balance IS NULL THEN
        INSERT INTO wallets (user_id, balance, locked_balance) VALUES (v_order.seller_id, 0, 0) RETURNING balance INTO v_seller_balance;
    END IF;

    UPDATE wallets 
    SET balance = balance + v_order.amount, updated_at = NOW() 
    WHERE user_id = v_order.seller_id;

    UPDATE escrow_orders 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW() 
    WHERE id = p_order_id;

    -- Mark listing as sold if product
    IF v_order.listing_id IS NOT NULL THEN
        UPDATE listings SET status = 'sold', updated_at = NOW() WHERE id = v_order.listing_id;
    END IF;

    -- Increment seller completed deals counter
    UPDATE profiles SET completed_transactions = completed_transactions + 1 WHERE user_id = v_order.seller_id;

    -- Record transaction for seller
    INSERT INTO wallet_transactions (
        user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status, metadata
    ) VALUES (
        v_order.seller_id, v_order.buyer_id, v_order.seller_id, 'credit', v_order.amount, v_seller_balance + v_order.amount,
        v_order.order_number || '-ESCROW-RELEASE', 'Escrow funds released for order #' || v_order.order_number, 'completed',
        jsonb_build_object('order_id', p_order_id, 'listing_id', v_order.listing_id)
    );

    -- Notify seller
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_order.seller_id,
        'escrow_released',
        'Funds Released: Order #' || v_order.order_number,
        'Buyer confirmed delivery! ₦' || (v_order.amount / 100)::text || ' has been credited to your wallet.',
        jsonb_build_object('order_id', p_order_id, 'amount', v_order.amount)
    );

    RETURN jsonb_build_object('success', true, 'order_status', 'completed');
END;
$$;

-- D. Refund Escrow Order Funds to Buyer Wallet
CREATE OR REPLACE FUNCTION refund_escrow_order(
    p_order_id UUID,
    p_caller_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_buyer_balance BIGINT;
BEGIN
    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow order not found.');
    END IF;

    -- Only admin or seller can issue a refund
    IF NOT (is_admin(p_caller_id) OR v_order.seller_id = p_caller_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only an administrator or the seller can issue a refund.');
    END IF;

    IF v_order.status NOT IN ('funded', 'in_transit', 'delivered', 'disputed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order cannot be refunded in current status: ' || v_order.status);
    END IF;

    -- Credit buyer wallet
    SELECT balance INTO v_buyer_balance FROM wallets WHERE user_id = v_order.buyer_id FOR UPDATE;
    IF v_buyer_balance IS NULL THEN
        INSERT INTO wallets (user_id, balance, locked_balance) VALUES (v_order.buyer_id, 0, 0) RETURNING balance INTO v_buyer_balance;
    END IF;

    UPDATE wallets 
    SET balance = balance + v_order.amount, updated_at = NOW() 
    WHERE user_id = v_order.buyer_id;

    UPDATE escrow_orders 
    SET status = 'refunded', 
        resolution_notes = p_reason, 
        resolved_by = p_caller_id, 
        updated_at = NOW() 
    WHERE id = p_order_id;

    -- Record transaction for buyer
    INSERT INTO wallet_transactions (
        user_id, sender_id, recipient_id, type, amount, balance_after, reference, description, status, metadata
    ) VALUES (
        v_order.buyer_id, v_order.seller_id, v_order.buyer_id, 'refund', v_order.amount, v_buyer_balance + v_order.amount,
        v_order.order_number || '-ESCROW-REFUND', 'Refund for order #' || v_order.order_number || ': ' || p_reason, 'completed',
        jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
    );

    -- Notify buyer
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_order.buyer_id,
        'escrow_refunded',
        'Refund Processed: Order #' || v_order.order_number,
        '₦' || (v_order.amount / 100)::text || ' has been refunded back to your wallet. Reason: ' || p_reason,
        jsonb_build_object('order_id', p_order_id, 'amount', v_order.amount)
    );

    RETURN jsonb_build_object('success', true, 'order_status', 'refunded');
END;
$$;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES

-- listing_likes RLS
ALTER TABLE listing_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view listing likes" ON listing_likes;
CREATE POLICY "Public can view listing likes" ON listing_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like listings" ON listing_likes;
CREATE POLICY "Authenticated users can like listings" ON listing_likes 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike listings" ON listing_likes;
CREATE POLICY "Users can unlike listings" ON listing_likes 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- wallets RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet" ON wallets 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- escrow_orders RLS
ALTER TABLE escrow_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants and admins can view escrow orders" ON escrow_orders;
CREATE POLICY "Participants and admins can view escrow orders" ON escrow_orders 
FOR SELECT TO authenticated 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Buyers can create escrow orders" ON escrow_orders;
CREATE POLICY "Buyers can create escrow orders" ON escrow_orders 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = buyer_id);

-- platform_settings RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings viewable by everyone" ON platform_settings;
CREATE POLICY "Platform settings viewable by everyone" ON platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update platform settings" ON platform_settings;
CREATE POLICY "Admins can update platform settings" ON platform_settings 
FOR ALL TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 9. HARDEN STORAGE POLICIES
DROP POLICY IF EXISTS "Public can view listing images" ON storage.objects;
CREATE POLICY "Public can view listing images" ON storage.objects 
FOR SELECT USING (bucket_id IN ('listings', 'listing-images', 'avatars'));

DROP POLICY IF EXISTS "Users view own private documents, admins view all" ON storage.objects;
CREATE POLICY "Users view own private documents, admins view all" ON storage.objects 
FOR SELECT TO authenticated
USING (
  bucket_id IN ('verification-documents', 'dispute-evidence') 
  AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Authenticated users upload own folder objects" ON storage.objects;
CREATE POLICY "Authenticated users upload own folder objects" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id IN ('listings', 'listing-images', 'avatars', 'verification-documents', 'dispute-evidence')
);

DROP POLICY IF EXISTS "Users can only update own uploaded objects" ON storage.objects;
CREATE POLICY "Users can only update own uploaded objects" ON storage.objects 
FOR UPDATE TO authenticated 
USING (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can only delete own uploaded objects" ON storage.objects;
CREATE POLICY "Users can only delete own uploaded objects" ON storage.objects 
FOR DELETE TO authenticated 
USING (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR is_admin(auth.uid()));
