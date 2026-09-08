'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { initializeTransaction } from '@/lib/paystack';

export type RecipientInfo = {
  userId: string;
  displayName: string;
  department: string | null;
  matricNumber: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  referralCode: string | null;
};

export type WalletData = {
  balance: number;
  lockedBalance: number;
  pendingEscrowBalance: number;
  currency: string;
  bankDetails: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
  transactions: any[];
};

export async function getWalletData(): Promise<{ success: boolean; data?: WalletData; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 1. Get or create wallet
    let { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!wallet) {
      const adminClient = await createAdminClient();
      const { data: newWallet } = await adminClient
        .from('wallets')
        .insert({ user_id: user.id, balance: 0, locked_balance: 0 })
        .select('*')
        .single();
      wallet = newWallet;
    }

    // 2. Get user profile for bank details
    const { data: profile } = await supabase
      .from('profiles')
      .select('bank_name, account_number, account_name')
      .eq('user_id', user.id)
      .maybeSingle();

    // 3. Get pending escrow balance (seller incoming orders that are funded/in_transit/delivered)
    const { data: pendingOrders } = await supabase
      .from('escrow_orders')
      .select('amount')
      .eq('seller_id', user.id)
      .in('status', ['funded', 'in_transit', 'delivered']);

    const pendingEscrowBalance = pendingOrders?.reduce((acc, order) => acc + Number(order.amount), 0) || 0;

    // 4. Get wallet transactions
    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      success: true,
      data: {
        balance: Number(wallet?.balance || 0),
        lockedBalance: Number(wallet?.locked_balance || 0),
        pendingEscrowBalance,
        currency: wallet?.currency || 'NGN',
        bankDetails: {
          bankName: profile?.bank_name || null,
          accountNumber: profile?.account_number || null,
          accountName: profile?.account_name || null,
        },
        transactions: transactions || [],
      },
    };
  } catch (error: any) {
    console.error('getWalletData error:', error);
    return { success: false, error: error.message || 'Failed to load wallet data' };
  }
}

/**
 * Requirement 11: Recipient Identity Check before P2P transfer
 * Allows searching by:
 * - Direct User UUID
 * - Referral Code (e.g. CUSTECH-...)
 * - Matriculation Number
 * - Username
 */
export async function searchRecipient(query: string): Promise<{ success: boolean; recipient?: RecipientInfo; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { success: false, error: 'Please provide a search term (User ID, referral code, or matric number)' };
    }

    const adminClient = await createAdminClient();

    // Try finding by UUID if format matches
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

    let match = null;

    if (isUuid) {
      const { data } = await adminClient
        .from('profiles')
        .select('user_id, display_name, department, matric_number, avatar_url, is_verified, referral_code')
        .eq('user_id', cleanQuery)
        .maybeSingle();
      match = data;
    }

    // Try finding by referral code
    if (!match) {
      const { data } = await adminClient
        .from('profiles')
        .select('user_id, display_name, department, matric_number, avatar_url, is_verified, referral_code')
        .ilike('referral_code', cleanQuery)
        .maybeSingle();
      match = data;
    }

    // Try finding by matric number
    if (!match) {
      const { data } = await adminClient
        .from('profiles')
        .select('user_id, display_name, department, matric_number, avatar_url, is_verified, referral_code')
        .ilike('matric_number', cleanQuery)
        .maybeSingle();
      match = data;
    }

    // Try finding by username
    if (!match) {
      const { data } = await adminClient
        .from('profiles')
        .select('user_id, display_name, department, matric_number, avatar_url, is_verified, referral_code')
        .ilike('username', cleanQuery)
        .maybeSingle();
      match = data;
    }

    if (!match) {
      return { success: false, error: 'No student account found with the provided details. Check the User ID or referral code.' };
    }

    if (match.user_id === user.id) {
      return { success: false, error: 'You cannot send a transfer to your own account.' };
    }

    return {
      success: true,
      recipient: {
        userId: match.user_id,
        displayName: match.display_name || 'CUSTECH Student',
        department: match.department || null,
        matricNumber: match.matric_number ? `${match.matric_number.slice(0, 4)}****` : null,
        avatarUrl: match.avatar_url || null,
        isVerified: !!match.is_verified,
        referralCode: match.referral_code || null,
      },
    };
  } catch (error: any) {
    console.error('searchRecipient error:', error);
    return { success: false, error: error.message || 'Error checking recipient identity' };
  }
}

/**
 * Executes an atomic P2P transfer between students
 */
export async function sendP2PTransfer(
  recipientId: string,
  amountNaira: number,
  description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!recipientId || recipientId === user.id) {
      return { success: false, error: 'Invalid recipient specified' };
    }

    if (!amountNaira || isNaN(amountNaira) || amountNaira <= 0) {
      return { success: false, error: 'Transfer amount must be greater than ₦0' };
    }

    const adminClient = await createAdminClient();
    const reference = `P2P-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transferDesc = description?.trim() || 'P2P student transfer';

    // Call atomic RPC
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('process_wallet_transfer', {
      p_sender_id: user.id,
      p_recipient_id: recipientId,
      p_amount: Math.round(amountNaira),
      p_reference: reference,
      p_description: transferDesc,
    });

    if (rpcError) {
      console.error('process_wallet_transfer RPC error:', rpcError);
      return { success: false, error: rpcError.message || 'Transfer processing failed.' };
    }

    if (!rpcResult?.success) {
      return { success: false, error: rpcResult?.error || 'Transfer failed.' };
    }

    revalidatePath('/dashboard/wallet');
    return { success: true, newBalance: rpcResult.new_balance };
  } catch (error: any) {
    console.error('sendP2PTransfer error:', error);
    return { success: false, error: error.message || 'Transfer failed' };
  }
}

/**
 * Initializes a Paystack transaction to fund the student's wallet
 */
export async function initializeWalletFunding(
  amountNaira: number
): Promise<{ success: boolean; authorizationUrl?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!amountNaira || amountNaira < 100) {
      return { success: false, error: 'Minimum wallet funding amount is ₦100' };
    }

    const amountKobo = Math.round(amountNaira * 100);
    const reference = `WF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://custechmarketplace.com';

    const paystackRes = await initializeTransaction({
      email: user.email || 'student@custech.edu.ng',
      amountKobo,
      reference,
      metadata: {
        type: 'wallet_funding',
        userId: user.id,
        amountNaira,
      },
      callbackUrl: `${origin}/dashboard/wallet?funded=true`,
    });

    if (!paystackRes.status || !paystackRes.data?.authorization_url) {
      return { success: false, error: paystackRes.message || 'Failed to initialize payment gateway' };
    }

    return { success: true, authorizationUrl: paystackRes.data.authorization_url };
  } catch (error: any) {
    console.error('initializeWalletFunding error:', error);
    return { success: false, error: error.message || 'Failed to initialize funding' };
  }
}

/**
 * Submits a withdrawal request to the student's registered bank account
 */
export async function requestWithdrawal(
  amountNaira: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!amountNaira || amountNaira < 1000) {
      return { success: false, error: 'Minimum withdrawal amount is ₦1,000' };
    }

    const adminClient = await createAdminClient();

    // Check bank details
    const { data: profile } = await adminClient
      .from('profiles')
      .select('bank_name, account_number, account_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.account_number || !profile?.bank_name) {
      return {
        success: false,
        error: 'Please configure your bank payout details in Settings before requesting a withdrawal.',
      };
    }

    // Check wallet balance
    const { data: wallet } = await adminClient
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet || Number(wallet.balance) < amountNaira) {
      return { success: false, error: 'Insufficient wallet balance for this withdrawal amount.' };
    }

    const newBalance = Number(wallet.balance) - amountNaira;
    const reference = `WDR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Debit wallet
    await adminClient
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    // Record pending withdrawal transaction
    await adminClient
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: 'withdrawal',
        amount: -amountNaira,
        balance_after: Math.round(newBalance),
        reference,
        description: `Withdrawal to ${profile.bank_name} (${profile.account_number})`,
        status: 'pending',
        metadata: {
          bank_name: profile.bank_name,
          account_number: profile.account_number,
          account_name: profile.account_name,
        },
      });

    // Notify student
    await adminClient.from('notifications').insert({
      user_id: user.id,
      title: 'Withdrawal Request Submitted',
      body: `Your withdrawal request of ₦${amountNaira.toLocaleString()} to ${profile.bank_name} (${profile.account_number}) is being processed.`,
      type: 'withdrawal_pending',
    });

    revalidatePath('/dashboard/wallet');
    return { success: true };
  } catch (error: any) {
    console.error('requestWithdrawal error:', error);
    return { success: false, error: error.message || 'Withdrawal request failed' };
  }
}
