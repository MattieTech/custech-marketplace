"use server";

import { createClient } from "@/lib/supabase/server";

const REFERRAL_REWARD = 500; // Naira

export async function getReferralStats() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        referralCode: '',
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalEarned: 0,
        pendingRewards: 0
      };
    }

    // Get user's profile referral code (username)
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .maybeSingle();

    const referralCode = profile?.referral_code || user.user_metadata?.username || user.user_metadata?.referral_code || '';

    const { data: referrals } = await supabase
      .from('referrals')
      .select('status, reward_amount, reward_status')
      .eq('referrer_id', user.id);

    if (!referrals || referrals.length === 0) {
      return {
        referralCode,
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalEarned: 0,
        pendingRewards: 0
      };
    }

    const totalReferrals = referrals.length;
    const qualifiedReferrals = referrals.filter(r => r.status === 'qualified' || r.status === 'rewarded').length;
    const totalEarned = referrals
      .filter(r => r.reward_status === 'paid' || r.status === 'rewarded')
      .reduce((acc, r) => acc + (Number(r.reward_amount) || 0), 0);
    const pendingRewards = referrals
      .filter(r => r.status === 'qualified' && r.reward_status !== 'paid')
      .reduce((acc, r) => acc + (Number(r.reward_amount) || REFERRAL_REWARD * 100), 0);

    return {
      referralCode,
      totalReferrals,
      qualifiedReferrals,
      totalEarned,
      pendingRewards
    };
  } catch (err) {
    console.error('getReferralStats error:', err);
    return {
      referralCode: '',
      totalReferrals: 0,
      qualifiedReferrals: 0,
      totalEarned: 0,
      pendingRewards: 0
    };
  }
}

export async function getReferralHistory() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        id,
        referred_user_id,
        referral_code,
        status,
        reward_amount,
        reward_status,
        created_at
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
    
    return referrals || [];
  } catch (err) {
    console.error('getReferralHistory error:', err);
    return [];
  }
}
