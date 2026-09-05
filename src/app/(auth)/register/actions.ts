'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function linkNewUserReferral({
  userId,
  username,
  displayName,
  referrerCode
}: {
  userId: string;
  username: string;
  displayName: string;
  referrerCode?: string;
}) {
  try {
    const admin = await createAdminClient();
    const cleanUsername = username.trim().toLowerCase();

    // 1. Ensure profile has the chosen username as referral_code
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        referral_code: cleanUsername,
        display_name: displayName.trim()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating user profile referral code:', profileError);
    }

    // 2. If referrer code provided, link referral
    if (referrerCode && referrerCode.trim()) {
      const cleanRef = referrerCode.trim().toLowerCase();
      
      // Find referrer user ID
      const { data: referrerProfile } = await admin
        .from('profiles')
        .select('user_id, referral_code')
        .ilike('referral_code', cleanRef)
        .maybeSingle();

      if (referrerProfile && referrerProfile.user_id !== userId) {
        // Insert into referrals table
        await admin
          .from('referrals')
          .insert({
            referrer_id: referrerProfile.user_id,
            referred_user_id: userId,
            referral_code: cleanRef,
            status: 'pending',
            reward_amount: 50000 // 500 NGN represented in kobo or naira
          })
          .select()
          .maybeSingle();
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('linkNewUserReferral error:', err);
    return { success: false, error: err.message };
  }
}
