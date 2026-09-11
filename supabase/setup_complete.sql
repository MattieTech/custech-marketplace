-- ====================================================================
-- CUSTECH MARKETPLACE - MASTER DATABASE SETUP
-- Confluence University of Science and Technology, Osara, Kogi State
-- Run this entire script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. BASE TABLES
-- ====================================================================

-- admin_roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'verification_officer', 'finance_admin', 'support_agent')),
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Helper functions
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION get_admin_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT role FROM admin_roles WHERE user_id = check_user_id LIMIT 1;
$$;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    location TEXT DEFAULT '',
    phone TEXT,
    whatsapp_number TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    matric_number TEXT,
    department TEXT,
    faculty TEXT,
    academic_level TEXT,
    hostel_address TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending_payment', 'paid', 'under_review', 'approved', 'rejected')),
    trust_level TEXT NOT NULL DEFAULT 'registered' CHECK (trust_level IN ('registered', 'custech_verified', 'trusted_seller')),
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    completed_transactions INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    username TEXT UNIQUE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('product', 'service', 'housing', 'business')),
    icon TEXT NOT NULL DEFAULT 'Package',
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. LISTINGS
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
    description TEXT NOT NULL CHECK (length(description) >= 5),
    price BIGINT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NGN',
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor', NULL)),
    location TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'expired', 'removed', 'under_review')),
    listing_type TEXT NOT NULL DEFAULT 'product' CHECK (listing_type IN ('product', 'service', 'housing', 'free', 'need')),
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LISTING IMAGES
CREATE TABLE IF NOT EXISTS listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT DEFAULT '',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SAVED LISTINGS
CREATE TABLE IF NOT EXISTS saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- 6. SERVICES
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    delivery_time TEXT,
    starting_price BIGINT DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'away'))
);

-- 7. PROPERTIES (Housing)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    property_type TEXT NOT NULL CHECK (property_type IN ('single_room', 'self_contained', 'flat', 'shared_room', 'hostel_bedspace')),
    rent_per_year BIGINT NOT NULL,
    total_package BIGINT,
    electricity_type TEXT,
    water_source TEXT,
    distance_to_campus TEXT,
    caution_deposit BIGINT DEFAULT 0,
    legal_fee BIGINT DEFAULT 0,
    inspection_fee BIGINT DEFAULT 0,
    is_verified_property BOOLEAN DEFAULT FALSE
);

-- 8. BUSINESSES
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    instagram TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DEALS
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    original_price BIGINT NOT NULL,
    deal_price BIGINT NOT NULL,
    discount_percentage INTEGER,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = check_user_id
  );
$$;

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'system', 'offer', 'location')),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    amount BIGINT NOT NULL,
    marketplace_fee BIGINT NOT NULL DEFAULT 0,
    seller_payout BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'escrow_funded', 'item_delivered', 'completed', 'disputed', 'refunded', 'cancelled')),
    payment_provider TEXT DEFAULT 'paystack',
    payment_reference TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (buyer_id != seller_id)
);

-- 12. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT CHECK (length(comment) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(reviewer_id, listing_id),
    CHECK (reviewer_id != reviewed_user_id)
);

-- 13. VERIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_method TEXT DEFAULT 'id_card' CHECK (verification_method IN ('id_card', 'manual')),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    matric_number TEXT,
    department TEXT,
    faculty TEXT,
    academic_level TEXT,
    whatsapp_number TEXT,
    hostel_address TEXT,
    emergency_contact TEXT,
    avatar_url TEXT,
    student_info JSONB DEFAULT '{}',
    id_document_path TEXT,
    payment_reference TEXT UNIQUE,
    payment_amount BIGINT NOT NULL DEFAULT 100000,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
    verification_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (verification_status IN ('pending_payment', 'paid', 'under_review', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'referral_reward', 'withdrawal', 'commission', 'refund', 'verification_payment')),
    amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    balance_after BIGINT NOT NULL DEFAULT 0,
    reference TEXT UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'invalid')),
    reward_amount BIGINT DEFAULT 0,
    reward_status TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'processing', 'paid', 'failed')),
    qualified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (referrer_id != referred_user_id)
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'awaiting_evidence', 'resolved', 'rejected', 'escalated')),
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_type TEXT NOT NULL CHECK (reported_type IN ('listing', 'user', 'service', 'housing', 'business', 'message')),
    reported_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'action_taken', 'dismissed')),
    action_taken TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. USER FOLLOWS
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
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON user_follows(created_at DESC);

-- ====================================================================
-- 2. AUTOMATIC TRIGGERS & FUNCTIONS
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', 'Student_' || substr(new.id::text, 1, 6)),
    substr(md5(random()::text), 1, 8)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_listings ON listings;
CREATE TRIGGER set_updated_at_listings BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_listing_view(listing_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_uuid;
END;
$$;

-- ====================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for clean rerun
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Listings are viewable by everyone if active" ON listings;
DROP POLICY IF EXISTS "Users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
DROP POLICY IF EXISTS "Listing images viewable by everyone" ON listing_images;
DROP POLICY IF EXISTS "Users can add images to own listings" ON listing_images;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Businesses are viewable by everyone" ON businesses;
DROP POLICY IF EXISTS "Deals are viewable by everyone" ON deals;
DROP POLICY IF EXISTS "Saved listings viewable by owner" ON saved_listings;
DROP POLICY IF EXISTS "Users can manage own saved listings" ON saved_listings;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Admins can view verification requests" ON verification_requests;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Prevent unauthorized privilege elevation on profiles
CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
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

-- Atomic wallet credit function in Kobo (service_role only)
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

REVOKE EXECUTE ON FUNCTION credit_wallet_balance(UUID, BIGINT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION credit_wallet_balance(UUID, BIGINT, TEXT, TEXT) TO service_role;

CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

CREATE POLICY "Listings are viewable by everyone if active" ON listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = seller_id);
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.uid() = user_id OR auth.uid() = seller_id);

CREATE POLICY "Listing images viewable by everyone" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Users can add images to own listings" ON listing_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND (user_id = auth.uid() OR seller_id = auth.uid()))
);

CREATE POLICY "Users can manage own saved listings" ON saved_listings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (true);
CREATE POLICY "Businesses are viewable by everyone" ON businesses FOR SELECT USING (true);
CREATE POLICY "Deals are viewable by everyone" ON deals FOR SELECT USING (true);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own verification requests" ON verification_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view verification requests" ON verification_requests FOR SELECT USING (is_admin(auth.uid()));

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE POLICY "Service role full access on user_follows" ON user_follows FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON user_follows TO authenticated, service_role;
GRANT SELECT ON user_follows TO anon;

-- ====================================================================
-- 4. STORAGE BUCKETS (Public & Private)
-- ====================================================================

INSERT INTO storage.buckets (id, name, public) VALUES
('listings', 'listings', true),
('listing-images', 'listing-images', true),
('avatars', 'avatars', true),
('verification-documents', 'verification-documents', false),
('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

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

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id IN ('listings', 'listing-images', 'avatars', 'verification-documents', 'dispute-evidence')
);

DROP POLICY IF EXISTS "Users can update own uploaded objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can only update own uploaded objects" ON storage.objects;
CREATE POLICY "Users can only update own uploaded objects" ON storage.objects 
FOR UPDATE TO authenticated 
USING (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can only delete own uploaded objects" ON storage.objects;
CREATE POLICY "Users can only delete own uploaded objects" ON storage.objects 
FOR DELETE TO authenticated 
USING (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR is_admin(auth.uid()));

-- ====================================================================
-- 5. SEED DATA: OFFICIAL CUSTECH CATEGORIES
-- ====================================================================

INSERT INTO categories (name, slug, type, icon) VALUES
-- Product Categories
('Phones & Tablets', 'phones', 'product', 'Smartphone'),
('Laptops & PCs', 'laptops', 'product', 'Laptop'),
('Electronics & Gadgets', 'electronics', 'product', 'Zap'),
('Books & Textbooks', 'books', 'product', 'BookOpen'),
('School & Lab Materials', 'school-materials', 'product', 'GraduationCap'),
('Hostel Furniture & Appliances', 'appliances', 'product', 'Refrigerator'),
('Fashion & Clothing', 'clothes', 'product', 'Shirt'),
('Shoes & Sneakers', 'shoes', 'product', 'Footprints'),
('Gaming & Consoles', 'gaming', 'product', 'Gamepad2'),
('Other Items', 'other', 'product', 'Package'),

-- Service Categories
('Web & Mobile Development', 'web-development', 'service', 'Globe'),
('Graphic Design & Branding', 'graphic-design', 'service', 'Palette'),
('Photography & Video Editing', 'photography', 'service', 'Camera'),
('Academic Tutoring', 'tutoring', 'service', 'GraduationCap'),
('Hair Styling & Barbing', 'hair-barbing', 'service', 'Scissors'),
('Laundry & Dry Cleaning', 'laundry', 'service', 'Shirt'),
('Printing & Document Typing', 'printing', 'service', 'Printer'),
('Phone & Laptop Repair', 'phone-repair', 'service', 'Wrench'),
('Food Delivery & Catering', 'food-services', 'service', 'UtensilsCrossed'),

-- Housing Categories
('Self-Contained Room', 'self-contained', 'housing', 'Home'),
('Single Room', 'single-room', 'housing', 'BedSingle'),
('One-Bedroom Flat', 'one-bedroom', 'housing', 'BedDouble'),
('Hostel Bedspace', 'hostel', 'housing', 'Building'),
('Shared Apartment', 'shared-apartment', 'housing', 'Users')
ON CONFLICT (slug) DO NOTHING;

-- ATOMIC WALLET WITHDRAWAL PROCEDURE (ANTI-RACE-CONDITION / DOUBLE-SPEND PROOF)
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
GRANT EXECUTE ON FUNCTION request_wallet_withdrawal(UUID, BIGINT, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- 21. WALLETS TABLE & AUTO-CREATION TRIGGER
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

INSERT INTO wallets (user_id, balance, locked_balance)
SELECT user_id, 0, 0 FROM profiles
ON CONFLICT (user_id) DO NOTHING;

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

-- 22. ESCROW ORDERS TABLE
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

-- 23. LISTING LIKES TABLE
CREATE TABLE IF NOT EXISTS listing_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_listing_like UNIQUE (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_listing_likes_listing ON listing_likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_user ON listing_likes(user_id);

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

-- 24. FINANCIAL RPC PROCEDURES
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

-- 25. ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages wallets" ON wallets;
CREATE POLICY "Service role manages wallets" ON wallets FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users view own wallet transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages wallet transactions" ON wallet_transactions;
CREATE POLICY "Service role manages wallet transactions" ON wallet_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE escrow_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own orders" ON escrow_orders;
CREATE POLICY "Users view own orders" ON escrow_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users create orders" ON escrow_orders;
CREATE POLICY "Users create orders" ON escrow_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "Service role manages orders" ON escrow_orders;
CREATE POLICY "Service role manages orders" ON escrow_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE listing_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view listing likes" ON listing_likes;
CREATE POLICY "Public view listing likes" ON listing_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users toggle own likes" ON listing_likes;
CREATE POLICY "Users toggle own likes" ON listing_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users remove own likes" ON listing_likes;
CREATE POLICY "Users remove own likes" ON listing_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON wallets, wallet_transactions, escrow_orders, listing_likes TO authenticated, service_role;
GRANT SELECT ON listing_likes TO anon;
