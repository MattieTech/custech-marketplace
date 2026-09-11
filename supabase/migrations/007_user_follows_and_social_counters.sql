-- ====================================================================
-- CUSTECH MARKETPLACE - MIGRATION 007: USER FOLLOWS & SOCIAL COUNTERS
-- Guarantees the user_follows table exists, adds followers_count & following_count
-- columns on profiles, and installs automated trigger sync to prevent counter drift.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> following_id),
    CONSTRAINT user_follows_unique_pair UNIQUE (follower_id, following_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON user_follows(created_at DESC);

-- 2. ADD COUNTER COLUMNS ON PROFILES IF MISSING
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

-- 3. TRIGGER TO AUTOMATICALLY MAINTAIN FOLLOW COUNTERS
CREATE OR REPLACE FUNCTION maintain_user_follows_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment followers_count for target user
        UPDATE profiles
        SET followers_count = followers_count + 1
        WHERE user_id = NEW.following_id;

        -- Increment following_count for actor user
        UPDATE profiles
        SET following_count = following_count + 1
        WHERE user_id = NEW.follower_id;

        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement followers_count for target user
        UPDATE profiles
        SET followers_count = GREATEST(0, followers_count - 1)
        WHERE user_id = OLD.following_id;

        -- Decrement following_count for actor user
        UPDATE profiles
        SET following_count = GREATEST(0, following_count - 1)
        WHERE user_id = OLD.follower_id;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_maintain_user_follows_counts ON user_follows;
CREATE TRIGGER trg_maintain_user_follows_counts
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION maintain_user_follows_counts();

-- 4. BACKFILL CURRENT EXACT COUNTS
UPDATE profiles p
SET followers_count = (
    SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = p.user_id
),
following_count = (
    SELECT COUNT(*) FROM user_follows uf WHERE uf.follower_id = p.user_id
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read user_follows" ON user_follows;
CREATE POLICY "Public read user_follows"
    ON user_follows
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
CREATE POLICY "Users can follow others"
    ON user_follows
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow"
    ON user_follows
    FOR DELETE
    TO authenticated
    USING (auth.uid() = follower_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access on user_follows" ON user_follows;
CREATE POLICY "Service role full access on user_follows"
    ON user_follows
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

GRANT ALL ON user_follows TO authenticated, service_role;
GRANT SELECT ON user_follows TO anon;
