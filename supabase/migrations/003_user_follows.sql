-- Migration 003: User Follows System
-- Enables users to follow each other, inspect follower/following counts, and view their campus network.

CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> following_id),
    CONSTRAINT user_follows_unique_pair UNIQUE (follower_id, following_id)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view follow connections
CREATE POLICY "Public read user_follows"
    ON user_follows
    FOR SELECT
    USING (true);

-- Authenticated users can follow others
CREATE POLICY "Users can follow others"
    ON user_follows
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = follower_id);

-- Authenticated users can unfollow others
CREATE POLICY "Users can unfollow"
    ON user_follows
    FOR DELETE
    TO authenticated
    USING (auth.uid() = follower_id);
