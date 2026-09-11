'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Safely resolves an arbitrary target string (UUID, username, referral code)
 * into a valid auth user_id to prevent Postgres 22P02 UUID syntax errors.
 */
async function resolveTargetUserId(
  client: any, 
  rawInput: string
): Promise<{ resolvedId: string; profile: any | null }> {
  if (!rawInput) return { resolvedId: rawInput, profile: null };

  const cleanInput = decodeURIComponent(rawInput).replace(/^@/, '').trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanInput);

  let query = client
    .from('profiles')
    .select('user_id, id, display_name, referral_code, username, followers_count, following_count');

  if (isUuid) {
    query = query.or(`user_id.eq.${cleanInput},id.eq.${cleanInput}`);
  } else {
    const safe = cleanInput.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    if (!safe) return { resolvedId: cleanInput, profile: null };
    query = query.or(`referral_code.ilike.${safe},username.ilike.${safe},display_name.ilike.${safe}`);
  }

  const { data: profile } = await query.maybeSingle();
  return {
    resolvedId: profile?.user_id || cleanInput,
    profile: profile || null,
  };
}

export async function toggleFollowUser(targetUserId: string): Promise<{
  success: boolean;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  message: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Please sign in to follow campus members.');
  }

  const admin = await createAdminClient();

  // Safely resolve targetUserId to valid auth user_id
  const { resolvedId: resolvedTargetId, profile: targetProfile } = await resolveTargetUserId(admin, targetUserId);

  if (!resolvedTargetId) {
    throw new Error('Student profile not found.');
  }

  if (user.id === resolvedTargetId) {
    throw new Error('You cannot follow yourself.');
  }

  // Check if a follow record already exists
  const { data: followRecord } = await admin
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', resolvedTargetId)
    .maybeSingle();

  let isFollowing = false;

  if (followRecord) {
    // UNFOLLOW ACTION
    // Try authenticated client first, then fallback to admin
    let { error: deleteError } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', resolvedTargetId);

    if (deleteError) {
      const adminRes = await admin
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', resolvedTargetId);
      deleteError = adminRes.error;
    }

    if (deleteError) {
      console.error('Error unfollowing user:', deleteError);
      throw new Error('Failed to unfollow student: ' + deleteError.message);
    }

    // Direct fallback counter decrement on profiles in case triggers are not yet applied
    try {
      await admin.rpc('decrement_profile_counters', {
        p_follower_id: user.id,
        p_following_id: resolvedTargetId,
      });
    } catch {
      // Non-critical fallback
    }

    isFollowing = false;
  } else {
    // FOLLOW ACTION
    // Try authenticated client first (satisfies auth.uid() = follower_id), then admin
    let { error: insertError } = await supabase
      .from('user_follows')
      .insert([{
        follower_id: user.id,
        following_id: resolvedTargetId,
      }]);

    if (insertError) {
      const adminRes = await admin
        .from('user_follows')
        .insert([{
          follower_id: user.id,
          following_id: resolvedTargetId,
        }]);
      insertError = adminRes.error;
    }

    if (insertError) {
      console.error('Error following user:', insertError);
      throw new Error('Failed to follow student: ' + insertError.message);
    }

    // Direct fallback counter increment on profiles
    try {
      await admin.rpc('increment_profile_counters', {
        p_follower_id: user.id,
        p_following_id: resolvedTargetId,
      });
    } catch {
      // Non-critical fallback
    }

    // Send in-app notification to the student who was followed
    try {
      const { data: myProfile } = await admin
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      await admin
        .from('notifications')
        .insert([{
          user_id: resolvedTargetId,
          type: 'user_follow',
          title: 'New Campus Follower',
          body: `${myProfile?.display_name || 'A student'} started following your campus profile.`,
          data: { follower_id: user.id },
          is_read: false,
        }]);
    } catch {
      // Non-critical notification failure
    }

    isFollowing = true;
  }

  // Fetch updated, exact counts from the database
  const [followersRes, followingRes] = await Promise.all([
    admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', resolvedTargetId),
    admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', resolvedTargetId),
  ]);

  const followersCount = typeof followersRes.count === 'number' 
    ? followersRes.count 
    : (isFollowing ? 1 : 0);
  const followingCount = typeof followingRes.count === 'number' 
    ? followingRes.count 
    : 0;

  // Revalidate profile and user paths
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath(`/profile/${resolvedTargetId}`);
  if (targetProfile?.referral_code) {
    revalidatePath(`/user/${targetProfile.referral_code}`);
  }
  if (targetProfile?.username) {
    revalidatePath(`/user/${targetProfile.username}`);
  }
  revalidatePath('/dashboard/followers');
  revalidatePath('/dashboard/following');

  return {
    success: true,
    isFollowing,
    followersCount,
    followingCount,
    message: isFollowing 
      ? `You are now following ${targetProfile?.display_name || 'this student'}`
      : `Unfollowed ${targetProfile?.display_name || 'this student'}`,
  };
}

export async function getFollowStats(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = await createAdminClient();

  const { resolvedId: resolvedTargetId, profile: targetProfile } = await resolveTargetUserId(admin, targetUserId);

  let followersCount = targetProfile?.followers_count || 0;
  let followingCount = targetProfile?.following_count || 0;
  let isFollowing = false;

  try {
    const [followersRes, followingRes, checkRes] = await Promise.all([
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', resolvedTargetId),
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', resolvedTargetId),
      user ? admin.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', resolvedTargetId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    if (typeof followersRes.count === 'number') {
      followersCount = followersRes.count;
    }
    if (typeof followingRes.count === 'number') {
      followingCount = followingRes.count;
    }
    isFollowing = !!checkRes?.data;
  } catch (err) {
    console.error('Error fetching follow stats:', err);
  }

  return { followersCount, followingCount, isFollowing };
}

export async function getFollowersAndFollowingUsers(targetUserId: string) {
  const admin = await createAdminClient();
  const { resolvedId: resolvedTargetId } = await resolveTargetUserId(admin, targetUserId);

  let followersUsers: any[] = [];
  let followingUsers: any[] = [];

  try {
    const { data: followersRows } = await admin
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', resolvedTargetId);

    const { data: followingRows } = await admin
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', resolvedTargetId);

    if (followersRows && followersRows.length > 0) {
      const ids = followersRows.map(r => r.follower_id);
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, department, verification_status')
        .in('user_id', ids);

      followersUsers = profiles || [];
    }

    if (followingRows && followingRows.length > 0) {
      const ids = followingRows.map(r => r.following_id);
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, department, verification_status')
        .in('user_id', ids);

      followingUsers = profiles || [];
    }
  } catch (err) {
    console.error('Error fetching follow lists:', err);
  }

  return { followers: followersUsers, following: followingUsers };
}

export async function getProfileStatistics(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = await createAdminClient();

  const { resolvedId: resolvedUserId, profile: prof } = await resolveTargetUserId(admin, userId);

  // 1. Listings & view counts
  const { data: listings } = await admin
    .from('listings')
    .select('id, view_count, likes_count')
    .or(`seller_id.eq.${resolvedUserId},user_id.eq.${resolvedUserId}`)
    .eq('status', 'active');

  const listingsCount = listings?.length || 0;
  const totalViews = (listings || []).reduce((acc: number, curr: any) => acc + (curr.view_count || 0), 0);
  const totalLikes = (listings || []).reduce((acc: number, curr: any) => acc + (curr.likes_count || 0), 0);

  // 2. Follow counts & check current user following status
  let followersCount = prof?.followers_count || 0;
  let followingCount = prof?.following_count || 0;
  let isFollowing = false;

  try {
    const [followersRes, followingRes, checkRes] = await Promise.all([
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', resolvedUserId),
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', resolvedUserId),
      user ? admin.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', resolvedUserId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    if (typeof followersRes.count === 'number') {
      followersCount = followersRes.count;
    }
    if (typeof followingRes.count === 'number') {
      followingCount = followingRes.count;
    }
    isFollowing = !!checkRes?.data;
  } catch (err) {
    console.error('Error fetching stats follow counts:', err);
  }

  return {
    listingsCount,
    totalViews,
    totalLikes,
    followersCount,
    followingCount,
    isFollowing,
    completedDeals: prof?.completed_transactions || 0,
    ratingAvg: Number(prof?.rating_avg || 5.0).toFixed(1),
    ratingCount: prof?.rating_count || 0,
  };
}
