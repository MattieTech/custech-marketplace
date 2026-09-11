'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserSettingsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, pendingUsernameRequest: null };
  }

  const adminClient = await createAdminClient();

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, user_id, display_name, referral_code, bank_name, account_number, account_name, whatsapp_number, verification_status')
    .eq('user_id', user.id)
    .single();

  const { data: pendingReq } = await adminClient
    .from('reports')
    .select('id, reason, details, status, created_at')
    .eq('reporter_id', user.id)
    .eq('reported_type', 'username_change')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .maybeSingle();

  let parsedDetails = null;
  if (pendingReq?.details) {
    try {
      parsedDetails = typeof pendingReq.details === 'string' ? JSON.parse(pendingReq.details) : pendingReq.details;
    } catch {
      parsedDetails = pendingReq.details;
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at
    },
    profile,
    pendingUsernameRequest: pendingReq ? { ...pendingReq, parsedDetails } : null
  };
}

export async function cancelUsernameChangeRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from('reports')
    .delete()
    .eq('id', requestId)
    .eq('reporter_id', user.id)
    .eq('reported_type', 'username_change')
    .eq('status', 'pending');

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function deleteUserAccount(password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: 'Unauthorized: No active session found.' };
  }

  // 1. Verify credentials by re-authenticating
  const { error: authCheckError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password
  });

  if (authCheckError) {
    return { success: false, error: 'Incorrect password. Account deletion aborted.' };
  }

  const admin = await createAdminClient();
  const userId = user.id;

  try {
    // Guard 1: Check for active or disputed escrow transactions
    const { data: activeEscrows, error: escrowError } = await admin
      .from('escrow_orders')
      .select('id, status')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .in('status', ['funded', 'in_transit', 'delivered', 'disputed']);

    if (escrowError) {
      console.error('Error checking active escrows during deletion:', escrowError);
      return { success: false, error: 'Failed to verify account transaction status.' };
    }

    if (activeEscrows && activeEscrows.length > 0) {
      return {
        success: false,
        error: 'Cannot delete account with active or disputed escrow orders. Please complete or resolve all transactions first.'
      };
    }

    // Guard 2: Check if user has remaining wallet funds
    const { data: wallet } = await admin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (wallet && wallet.balance > 0) {
      return {
        success: false,
        error: 'Cannot delete account with remaining wallet funds. Please withdraw your balance first.'
      };
    }

    // 2. Cascade delete dependent user assets
    await admin.from('listings').delete().or(`user_id.eq.${userId},seller_id.eq.${userId}`);
    await admin.from('saved_listings').delete().eq('user_id', userId);
    await admin.from('notifications').delete().eq('user_id', userId);
    await admin.from('verification_requests').delete().eq('user_id', userId);
    await admin.from('wallet_transactions').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    await admin.from('wallets').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('user_id', userId);
    
    // Delete auth user
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
    }

    // Sign out
    await supabase.auth.signOut();

    return { success: true };
  } catch (err: any) {
    console.error('Account deletion error:', err);
    return { success: false, error: err.message || 'Failed to delete account completely.' };
  }
}
