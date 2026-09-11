-- ====================================================================
-- CUSTECH MARKETPLACE - MIGRATION 006: ENTERPRISE CYBERSECURITY HARDENING
-- 1. Anti-Impersonation guards on all financial RPC functions
-- 2. Revocation of public execution on credit_wallet_balance
-- 3. search_path injection prevention (SET search_path = public, pg_temp)
-- 4. Storage object update/delete ownership enforcement
-- ====================================================================

-- 1. HARDEN WALLET TOP-UP (SERVICE ROLE ONLY)
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
    -- CRITICAL DEFENSE: Only service_role can invoke credit_wallet_balance
    IF current_setting('role', true) <> 'service_role' THEN
      RAISE EXCEPTION 'Access Denied: credit_wallet_balance can only be invoked by service_role.';
    END IF;

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

-- Revoke public execution to prevent unauthorized browser RPC invocation
REVOKE EXECUTE ON FUNCTION credit_wallet_balance(UUID, BIGINT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION credit_wallet_balance(UUID, BIGINT, TEXT, TEXT) TO service_role;

-- 2. HARDEN P2P WALLET TRANSFER (ANTI-IMPERSONATION)
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
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sender_balance BIGINT;
    v_recipient_balance BIGINT;
BEGIN
    -- Anti-impersonation: Non-service callers cannot transfer on behalf of others
    IF current_setting('role', true) <> 'service_role' THEN
      IF auth.uid() IS NULL OR auth.uid() <> p_sender_id THEN
        RAISE EXCEPTION 'Access Denied: You can only transfer funds from your own wallet.';
      END IF;
    END IF;

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

-- 3. HARDEN ESCROW ORDER FUNDING (ANTI-IMPERSONATION)
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
    v_order RECORD;
    v_buyer_balance BIGINT;
BEGIN
    -- Anti-impersonation
    IF current_setting('role', true) <> 'service_role' THEN
      IF auth.uid() IS NULL OR auth.uid() <> p_buyer_id THEN
        RAISE EXCEPTION 'Access Denied: You can only fund escrow orders for your own account.';
      END IF;
    END IF;

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

-- 4. HARDEN ESCROW ORDER RELEASE (ANTI-IMPERSONATION)
CREATE OR REPLACE FUNCTION release_escrow_funds(
    p_order_id UUID,
    p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_seller_balance BIGINT;
    v_actual_caller UUID;
    v_is_authorized BOOLEAN;
BEGIN
    -- Anti-impersonation: bind caller to auth.uid() when not service_role
    IF current_setting('role', true) = 'service_role' THEN
      v_actual_caller := p_caller_id;
    ELSE
      v_actual_caller := auth.uid();
    END IF;

    IF v_actual_caller IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthenticated request.');
    END IF;

    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow order not found.');
    END IF;

    -- Caller must be the buyer or an admin
    v_is_authorized := (v_order.buyer_id = v_actual_caller) OR is_admin(v_actual_caller);
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

-- 5. HARDEN ESCROW ORDER REFUND (ANTI-IMPERSONATION)
CREATE OR REPLACE FUNCTION refund_escrow_order(
    p_order_id UUID,
    p_caller_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_buyer_balance BIGINT;
    v_actual_caller UUID;
BEGIN
    -- Anti-impersonation: bind caller to auth.uid() when not service_role
    IF current_setting('role', true) = 'service_role' THEN
      v_actual_caller := p_caller_id;
    ELSE
      v_actual_caller := auth.uid();
    END IF;

    IF v_actual_caller IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthenticated request.');
    END IF;

    SELECT * INTO v_order FROM escrow_orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Escrow order not found.');
    END IF;

    -- Only admin or seller can issue a refund
    IF NOT (is_admin(v_actual_caller) OR v_order.seller_id = v_actual_caller) THEN
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
        resolved_by = v_actual_caller, 
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

-- 6. HARDEN HELPER FUNCTIONS WITH SET SEARCH_PATH
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = check_user_id
  );
$$;

-- 7. STORAGE OBJECT ACCESS CONTROLS
DROP POLICY IF EXISTS "Users can only update own uploaded objects" ON storage.objects;
CREATE POLICY "Users can only update own uploaded objects" ON storage.objects 
FOR UPDATE TO authenticated 
USING (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can only delete own uploaded objects" ON storage.objects;
CREATE POLICY "Users can only delete own uploaded objects" ON storage.objects 
FOR DELETE TO authenticated 
USING (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR is_admin(auth.uid()));

-- 8. ENSURE USERNAME COLUMN AND INDEX ON PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
UPDATE profiles SET username = referral_code WHERE username IS NULL AND referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(lower(username));

-- 9. ATOMIC WALLET WITHDRAWAL PROCEDURE (ANTI-RACE-CONDITION / DOUBLE-SPEND PROOF)
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
    -- Anti-impersonation: if called by authenticated JWT (non-service-role), ensure auth.uid() = p_user_id
    IF current_setting('role', true) <> 'service_role' AND auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'Access Denied: You cannot withdraw funds on behalf of another user.';
    END IF;

    IF p_amount_kobo <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Withdrawal amount must be greater than zero.');
    END IF;

    -- Lock wallet row FOR UPDATE to prevent race conditions
    SELECT id, balance INTO v_wallet_id, v_balance 
    FROM wallets 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Wallet not found.');
    END IF;

    IF v_balance < p_amount_kobo THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance for this withdrawal amount.');
    END IF;

    v_new_balance := v_balance - p_amount_kobo;

    UPDATE wallets 
    SET balance = v_new_balance, updated_at = NOW() 
    WHERE id = v_wallet_id;

    INSERT INTO wallet_transactions (
      wallet_id, user_id, type, amount, balance_after, reference, description, status, metadata
    ) VALUES (
      v_wallet_id, p_user_id, 'withdrawal', -p_amount_kobo, v_new_balance, p_reference, p_description, 'pending', p_metadata
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'wallet_id', v_wallet_id);
END;
$$;

