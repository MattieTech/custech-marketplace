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

  // Resolve targetUserId to valid auth user_id if profiles.id was passed
  let resolvedTargetId = targetUserId;
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('user_id, id, display_name')
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
    .maybeSingle();

  if (targetProfile?.user_id) {
    resolvedTargetId = targetProfile.user_id;
  }

  if (user.id === resolvedTargetId) {
    throw new Error('You cannot follow yourself.');
  }

  // 1. Try checking user_follows table first
  let alreadyFollowing = false;
  let useFollowsTable = true;

  try {
    const { data: followRecord, error: checkErr } = await admin
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', resolvedTargetId)
      .maybeSingle();

    if (checkErr) {
      useFollowsTable = false;
    } else {
      alreadyFollowing = !!followRecord;
    }
  } catch {
    useFollowsTable = false;
  }

  // Fallback to notifications follow records if user_follows table not present
  if (!useFollowsTable) {
    const { data: notifRecords } = await admin
      .from('notifications')
      .select('id')
      .eq('user_id', resolvedTargetId)
      .eq('type', 'user_follow')
      .contains('data', { follower_id: user.id });

    alreadyFollowing = (notifRecords && notifRecords.length > 0) || false;
  }

  let isFollowing = false;

  if (alreadyFollowing) {
    // UNFOLLOW
    if (useFollowsTable) {
      await admin
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', resolvedTargetId);
    } else {
      await admin
        .from('notifications')
        .delete()
        .eq('user_id', resolvedTargetId)
        .eq('type', 'user_follow')
        .contains('data', { follower_id: user.id });
    }
    isFollowing = false;
  } else {
    // FOLLOW
    if (useFollowsTable) {
      await admin
        .from('user_follows')
        .insert([{
          follower_id: user.id,
          following_id: resolvedTargetId,
        }]);
    }

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
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
    .maybeSingle();

  if (targetProfile?.user_id) {
    resolvedTargetId = targetProfile.user_id;
  }

  let followersCount = 0;
  let followingCount = 0;
  let isFollowing = false;

  // Try user_follows table first
  try {
    const [followersRes, followingRes, checkRes] = await Promise.all([
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', resolvedTargetId),
      admin.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', resolvedTargetId),
      user ? admin.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', resolvedTargetId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    if (!followersRes.error && !followingRes.error) {
      followersCount = followersRes.count || 0;
      followingCount = followingRes.count || 0;
      isFollowing = !!checkRes?.data;
      return { followersCount, followingCount, isFollowing };
    }
  } catch {}

  // Fallback to notifications follow records
  try {
    const { count: fCount } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', resolvedTargetId)
      .eq('type', 'user_follow');

    followersCount = fCount || 0;

    if (user) {
      const { data: hasFollowed } = await admin
        .from('notifications')
        .select('id')
        .eq('user_id', resolvedTargetId)
        .eq('type', 'user_follow')
        .contains('data', { follower_id: user.id })
        .limit(1);

      isFollowing = !!(hasFollowed && hasFollowed.length > 0);
    }
  } catch {}

  return { followersCount, followingCount, isFollowing };
}

export async function getFollowersAndFollowingUsers(targetUserId: string) {
  const admin = await createAdminClient();

  // Resolve targetUserId
  let resolvedTargetId = targetUserId;
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('user_id')
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
    .maybeSingle();

  if (targetProfile?.user_id) {
    resolvedTargetId = targetProfile.user_id;
  }

  let followersUsers: any[] = [];
  let followingUsers: any[] = [];

  // Try user_follows table
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

    if (followersUsers.length > 0 || followingUsers.length > 0) {
      return { followers: followersUsers, following: followingUsers };
    }
  } catch {}

  // Fallback to notifications follow records
  try {
    const { data: notifFollowers } = await admin
      .from('notifications')
      .select('data')
      .eq('user_id', resolvedTargetId)
      .eq('type', 'user_follow');

    if (notifFollowers && notifFollowers.length > 0) {
      const followerIds = notifFollowers
        .map(n => n.data?.follower_id)
        .filter(Boolean);

      if (followerIds.length > 0) {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, user_id, display_name, avatar_url, department, verification_status')
          .in('user_id', followerIds);

        followersUsers = profiles || [];
      }
    }
  } catch {}

  return { followers: followersUsers, following: followingUsers };
}
