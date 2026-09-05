-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- 22. admin_roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'verification_officer', 'finance_admin', 'support_agent')),
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper functions for RLS
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

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = check_user_id
  );
$$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    location TEXT DEFAULT '',
    phone TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending_payment', 'paid', 'under_review', 'approved', 'rejected')),
    trust_level TEXT NOT NULL DEFAULT 'registered' CHECK (trust_level IN ('registered', 'custech_verified', 'trusted_seller')),
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    completed_transactions INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. categories
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

-- 3. listings
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
    description TEXT NOT NULL CHECK (length(description) >= 10),
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

-- 4. listing_images
CREATE TABLE IF NOT EXISTS listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. saved_listings
CREATE TABLE IF NOT EXISTS saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- 6. services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    delivery_time TEXT,
    starting_price BIGINT DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'away'))
);

-- 7. properties
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    property_type TEXT NOT NULL CHECK (property_type IN ('single_room', 'self_contained', 'one_bedroom', 'two_bedroom', 'shared_apartment', 'hostel', 'student_accommodation')),
    rent BIGINT NOT NULL DEFAULT 0,
    additional_fees JSONB DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    rooms INTEGER DEFAULT 1,
    distance_from_campus TEXT,
    availability_date DATE,
    landlord_verified BOOLEAN DEFAULT FALSE,
    agent_verified BOOLEAN DEFAULT FALSE,
    property_verified BOOLEAN DEFAULT FALSE
);

-- 8. conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. conversation_participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 10. messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('scam', 'fake_listing', 'fake_property', 'fake_account', 'harassment', 'stolen_goods', 'suspicious_payment', 'fake_review', 'prohibited_item', 'impersonation', 'other')),
    description TEXT NOT NULL CHECK (length(description) >= 10),
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    payment_reference TEXT UNIQUE,
    payment_provider TEXT DEFAULT 'paystack',
    payment_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (buyer_id != seller_id)
);

-- 12. reviews
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

-- 13. verification_requests
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
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

-- 15. wallet_transactions
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

-- 16. referrals
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

-- 17. notifications
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

-- 18. disputes
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

-- 19. businesses
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    services TEXT[] DEFAULT '{}',
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. deals
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    terms TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS listings_category_id_idx ON listings(category_id);
CREATE INDEX IF NOT EXISTS listings_user_id_idx ON listings(user_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings(status);
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_id_idx ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS transactions_seller_id_idx ON transactions(seller_id);

-- Functions and Triggers

-- 1. auto_create_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User_' || substr(new.id::text, 1, 8)),
    substr(md5(random()::text), 1, 8)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_listings
  BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_verification_requests
  BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_disputes
  BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_businesses
  BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. update_user_rating
CREATE OR REPLACE FUNCTION update_user_rating_avg()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles
    SET rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewed_user_id = NEW.reviewed_user_id),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = NEW.reviewed_user_id)
    WHERE user_id = NEW.reviewed_user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewed_user_id = OLD.reviewed_user_id), 0),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = OLD.reviewed_user_id)
    WHERE user_id = OLD.reviewed_user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating_avg();

-- 4. increment_view_count
CREATE OR REPLACE FUNCTION increment_listing_view(listing_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_uuid;
END;
$$;

-- RLS setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- profiles RLS
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- categories RLS
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- listings RLS
CREATE POLICY "Listings are viewable by everyone if active" ON listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.uid() = user_id);

-- listing_images RLS
CREATE POLICY "Listing images viewable by everyone" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Users can add images to own listings" ON listing_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete images from own listings" ON listing_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);

-- saved_listings RLS
CREATE POLICY "Users can manage own saved listings" ON saved_listings FOR ALL USING (auth.uid() = user_id);

-- services RLS
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Users can manage own services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);

-- properties RLS
CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (true);
CREATE POLICY "Users can manage own properties" ON properties FOR ALL USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);

-- conversations RLS
CREATE POLICY "Participants can view conversations" ON conversations FOR SELECT USING (
  is_conversation_participant(id, auth.uid())
);

-- conversation_participants RLS
CREATE POLICY "Participants can view participants" ON conversation_participants FOR SELECT USING (
  is_conversation_participant(conversation_id, auth.uid())
);

-- messages RLS
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (
  is_conversation_participant(conversation_id, auth.uid())
);
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (
  is_conversation_participant(conversation_id, auth.uid()) AND sender_id = auth.uid()
);

-- reports RLS
CREATE POLICY "Users can see own reports, admins see all" ON reports FOR SELECT USING (
  reporter_id = auth.uid() OR is_admin(auth.uid())
);
CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- reviews RLS
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND reviewer_id != reviewed_user_id
);
CREATE POLICY "Reviewer can delete own review" ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- verification_requests RLS
CREATE POLICY "Users see own, admins see all" ON verification_requests FOR SELECT USING (
  user_id = auth.uid() OR is_admin(auth.uid())
);
CREATE POLICY "Users can insert verification requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update verification requests" ON verification_requests FOR UPDATE USING (is_admin(auth.uid()));

-- transactions RLS
CREATE POLICY "Participants and admins can see transactions" ON transactions FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin(auth.uid())
);
-- No direct user insert for transactions, use service role

-- wallet_transactions RLS
CREATE POLICY "Users can see own wallet transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
-- No insert/update/delete for users directly

-- referrals RLS
CREATE POLICY "Users can see their referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);

-- notifications RLS
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- disputes RLS
CREATE POLICY "Involved parties and admins can see disputes" ON disputes FOR SELECT USING (
  opened_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM transactions WHERE id = transaction_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())) OR
  is_admin(auth.uid())
);
CREATE POLICY "Buyer or seller can open dispute" ON disputes FOR INSERT WITH CHECK (
  opened_by = auth.uid() AND
  EXISTS (SELECT 1 FROM transactions WHERE id = transaction_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "Admins can update disputes" ON disputes FOR UPDATE USING (is_admin(auth.uid()));

-- businesses RLS
CREATE POLICY "Businesses are viewable by everyone" ON businesses FOR SELECT USING (true);
CREATE POLICY "Users can manage own business" ON businesses FOR ALL USING (auth.uid() = user_id);

-- deals RLS
CREATE POLICY "Deals are viewable by everyone" ON deals FOR SELECT USING (true);
CREATE POLICY "Business owners can manage deals" ON deals FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid())
);

-- audit_logs RLS
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (is_admin(auth.uid()));
-- No insert/update/delete for users directly

-- admin_roles RLS
CREATE POLICY "Admins can view admin roles" ON admin_roles FOR SELECT USING (is_admin(auth.uid()));

-- SEED DATA: Categories
INSERT INTO categories (name, slug, type, icon) VALUES
('Phones', 'phones', 'product', 'Smartphone'),
('Laptops', 'laptops', 'product', 'Laptop'),
('Electronics', 'electronics', 'product', 'Zap'),
('Clothes', 'clothes', 'product', 'Shirt'),
('Shoes', 'shoes', 'product', 'Footprints'),
('Books', 'books', 'product', 'BookOpen'),
('School Materials', 'school-materials', 'product', 'GraduationCap'),
('Furniture', 'furniture', 'product', 'Armchair'),
('Food', 'food', 'product', 'UtensilsCrossed'),
('Accessories', 'accessories', 'product', 'Watch'),
('Gaming', 'gaming', 'product', 'Gamepad2'),
('Appliances', 'appliances', 'product', 'Refrigerator'),
('Handcrafted', 'handcrafted', 'product', 'Palette'),
('Other', 'other', 'product', 'Package');

INSERT INTO categories (name, slug, type, icon) VALUES
('Web Development', 'web-development', 'service', 'Globe'),
('Graphic Design', 'graphic-design', 'service', 'Palette'),
('Video Editing', 'video-editing', 'service', 'Film'),
('Photography', 'photography', 'service', 'Camera'),
('Tutoring', 'tutoring', 'service', 'GraduationCap'),
('Hair/Barbing', 'hair-barbing', 'service', 'Scissors'),
('Makeup', 'makeup', 'service', 'Sparkles'),
('Laundry', 'laundry', 'service', 'Shirt'),
('Printing', 'printing', 'service', 'Printer'),
('CV Design', 'cv-design', 'service', 'FileText'),
('Phone Repair', 'phone-repair', 'service', 'Wrench'),
('Laptop Repair', 'laptop-repair', 'service', 'Monitor'),
('Delivery', 'delivery', 'service', 'Truck'),
('Food Services', 'food-services', 'service', 'UtensilsCrossed'),
('Fashion/Tailoring', 'fashion-tailoring', 'service', 'Scissors');

INSERT INTO categories (name, slug, type, icon) VALUES
('Single Room', 'single-room', 'housing', 'BedSingle'),
('Self-Contained', 'self-contained', 'housing', 'Home'),
('One-Bedroom', 'one-bedroom', 'housing', 'BedDouble'),
('Two-Bedroom', 'two-bedroom', 'housing', 'Hotel'),
('Shared Apartment', 'shared-apartment', 'housing', 'Users'),
('Hostel', 'hostel', 'housing', 'Building');
