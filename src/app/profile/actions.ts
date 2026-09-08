'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFollowUser(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Please sign in to follow campus members.');
  }

  const admin = await createAdminClient();

  // Resolve targetUserId to valid auth user_id if profiles.id or username was passed
  let resolvedTargetId = targetUserId;
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('user_id, id, display_name')
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId},referral_code.ilike.${targetUserId}`)
    .maybeSingle();

  if (targetProfile?.user_id) {
    resolvedTargetId = targetProfile.user_id;
  }

  if (user.id === resolvedTargetId) {
    throw new Error('You cannot follow yourself.');
  }

  // Check user_follows table
  const { data: followRecord } = await admin
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', resolvedTargetId)
    .maybeSingle();

  let isFollowing = false;

  if (followRecord) {
    // UNFOLLOW
    await admin
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', resolvedTargetId);

    isFollowing = false;
  } else {
    // FOLLOW
    await admin
      .from('user_follows')
      .insert([{
        follower_id: user.id,
        following_id: resolvedTargetId,
      }]);

    // Record notification for the user who was followed
    const { data: myProfile } = await admin
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    try {
      await admin
        .from('notifications')
        .insert([{
          user_id: resolvedTargetId,
          type: 'user_follow',
          title: 'New Campus Follower',
          body: (myProfile?.display_name || 'A student') + ' started following your profile.',
          data: { follower_id: user.id },
          is_read: false,
        }]);
    } catch {
      // Non-critical notification failure
    }

    isFollowing = true;
  }

  // Revalidate profile pages
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath(`/profile/${resolvedTargetId}`);
  revalidatePath('/dashboard/followers');
  revalidatePath('/dashboard/following');

  return {
    isFollowing,
    message: isFollowing 
      ? `You are now following ${targetProfile?.display_name || 'this user'}`
      : `Unfollowed ${targetProfile?.display_name || 'this user'}`,
  };
}

export async function getFollowStats(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = await createAdminClient();

  // Resolve targetUserId
  let resolvedTargetId = targetUserId;
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('user_id')
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId},referral_code.ilike.${targetUserId}`)
    .maybeSingle();

  if (targetProfile?.user_id) {
    resolvedTargetId = targetProfile.user_id;
  }

  let followersCount = 0;
  let followingCount = 0;
  let isFollowing = false;

  try {
    const [followersRes, followingRes, checkRes] = await Promise.all([
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', resolvedTargetId),
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', resolvedTargetId),
      user ? admin.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', resolvedTargetId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    followersCount = followersRes.count || 0;
    followingCount = followingRes.count || 0;
    isFollowing = !!checkRes?.data;
  } catch (err) {
    console.error('Error fetching follow stats:', err);
  }

  return { followersCount, followingCount, isFollowing };
}

export async function getFollowersAndFollowingUsers(targetUserId: string) {
  const admin = await createAdminClient();

  // Resolve targetUserId
  let resolvedTargetId = targetUserId;
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('user_id')
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId},referral_code.ilike.${targetUserId}`)
    .maybeSingle();

  if (targetProfile?.user_id) {
    resolvedTargetId = targetProfile.user_id;
  }

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
  const admin = await createAdminClient();

  let resolvedUserId = userId;
  const { data: prof } = await admin
    .from('profiles')
    .select('user_id, completed_transactions, trust_level, rating_avg, rating_count')
    .or(`user_id.eq.${userId},id.eq.${userId},referral_code.ilike.${userId}`)
    .maybeSingle();

  if (prof?.user_id) {
    resolvedUserId = prof.user_id;
  }

  // 1. Listings & view counts
  const { data: listings } = await admin
    .from('listings')
    .select('id, view_count, likes_count')
    .or(`seller_id.eq.${resolvedUserId},user_id.eq.${resolvedUserId}`)
    .eq('status', 'active');

  const listingsCount = listings?.length || 0;
  const totalViews = (listings || []).reduce((acc: number, curr: any) => acc + (curr.view_count || 0), 0);
  const totalLikes = (listings || []).reduce((acc: number, curr: any) => acc + (curr.likes_count || 0), 0);

  // 2. Follow counts
  const [followersRes, followingRes] = await Promise.all([
    admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', resolvedUserId),
    admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', resolvedUserId),
  ]);

  return {
    listingsCount,
    totalViews,
    totalLikes,
    followersCount: followersRes.count || 0,
    followingCount: followingRes.count || 0,
    completedDeals: prof?.completed_transactions || 0,
    ratingAvg: Number(prof?.rating_avg || 5.0).toFixed(1),
    ratingCount: prof?.rating_count || 0,
  };
}
