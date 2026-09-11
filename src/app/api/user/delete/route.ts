import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const password = body.password;

    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
    }

    // Verify password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (authError) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    const admin = await createAdminClient();
    const userId = user.id;

    // Guard 1: Check if user has active or disputed escrow transactions
    const { data: activeEscrows, error: escrowError } = await admin
      .from('escrow_orders')
      .select('id, status')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .in('status', ['funded', 'in_transit', 'delivered', 'disputed']);

    if (escrowError) {
      console.error('Error checking active escrows during deletion:', escrowError);
      return NextResponse.json({ error: 'Failed to verify account transaction status' }, { status: 500 });
    }

    if (activeEscrows && activeEscrows.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with active or disputed escrow orders. Please complete or resolve all transactions first.' },
        { status: 400 }
      );
    }

    // Guard 2: Check if user has remaining wallet funds
    const { data: wallet } = await admin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (wallet && wallet.balance > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with remaining wallet funds. Please withdraw your balance first.' },
        { status: 400 }
      );
    }

    // Safe to cascade delete user-owned data
    await admin.from('listings').delete().or(`user_id.eq.${userId},seller_id.eq.${userId}`);
    await admin.from('saved_listings').delete().eq('user_id', userId);
    await admin.from('notifications').delete().eq('user_id', userId);
    await admin.from('verification_requests').delete().eq('user_id', userId);
    await admin.from('wallet_transactions').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    await admin.from('wallets').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('user_id', userId);
    await admin.auth.admin.deleteUser(userId);

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Account deletion API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
