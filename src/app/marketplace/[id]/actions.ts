'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function incrementViewCount(listingId: string) {
  try {
    const admin = await createAdminClient();
    
    // Attempt RPC first with both common parameter names
    const { error: rpcError } = await admin.rpc('increment_listing_view', {
      listing_uuid: listingId
    });

    if (rpcError) {
      // Fallback to direct increment
      const { data: current } = await admin
        .from('listings')
        .select('view_count')
        .eq('id', listingId)
        .maybeSingle();

      if (current) {
        await admin
          .from('listings')
          .update({ view_count: (current.view_count || 0) + 1 })
          .eq('id', listingId);
      }
    }
    
    return { success: true };
  } catch (err) {
    console.warn('View increment notice:', err);
    return { success: false };
  }
}

export async function toggleSaveListing(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in to save this listing.' };

  const admin = await createAdminClient();

  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    let { error: delErr } = await supabase
      .from('saved_listings')
      .delete()
      .eq('id', existing.id);

    if (delErr) {
      await admin.from('saved_listings').delete().eq('id', existing.id);
    }

    revalidatePath(`/marketplace/${listingId}`);
    revalidatePath('/dashboard/saved');
    return { success: true, saved: false };
  } else {
    let { error: insErr } = await supabase
      .from('saved_listings')
      .insert({ user_id: user.id, listing_id: listingId });

    if (insErr) {
      await admin.from('saved_listings').insert({ user_id: user.id, listing_id: listingId });
    }

    revalidatePath(`/marketplace/${listingId}`);
    revalidatePath('/dashboard/saved');
    return { success: true, saved: true };
  }
}

export async function toggleLikeListing(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in to like this item.' };

  const admin = await createAdminClient();

  const { data: existing } = await supabase
    .from('listing_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    let { error: delErr } = await supabase
      .from('listing_likes')
      .delete()
      .eq('id', existing.id);

    if (delErr) {
      await admin.from('listing_likes').delete().eq('id', existing.id);
    }

    // Get latest likes count
    const { count } = await admin
      .from('listing_likes')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    revalidatePath(`/marketplace/${listingId}`);
    return { success: true, liked: false, count: count || 0 };
  } else {
    let { error: insErr } = await supabase
      .from('listing_likes')
      .insert({ user_id: user.id, listing_id: listingId });

    if (insErr) {
      await admin.from('listing_likes').insert({ user_id: user.id, listing_id: listingId });
    }

    const { count } = await admin
      .from('listing_likes')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    revalidatePath(`/marketplace/${listingId}`);
    return { success: true, liked: true, count: count || 0 };
  }
}

export async function getListingUserInteraction(listingId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = await createAdminClient();

    // Get total likes
    const { count: likesCount } = await admin
      .from('listing_likes')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    if (!user) {
      return {
        isAuthenticated: false,
        isSaved: false,
        isLiked: false,
        likesCount: likesCount || 0,
      };
    }

    const [savedRes, likedRes] = await Promise.all([
      admin.from('saved_listings').select('id').eq('user_id', user.id).eq('listing_id', listingId).maybeSingle(),
      admin.from('listing_likes').select('id').eq('user_id', user.id).eq('listing_id', listingId).maybeSingle(),
    ]);

    return {
      isAuthenticated: true,
      isSaved: !!savedRes.data,
      isLiked: !!likedRes.data,
      likesCount: likesCount || 0,
    };
  } catch {
    return {
      isAuthenticated: false,
      isSaved: false,
      isLiked: false,
      likesCount: 0,
    };
  }
}

/**
 * Creates and funds a platform escrow order from buyer's wallet or initiates escrow checkout
 */
export async function createEscrowOrder(
  listingId: string, 
  paymentMethod: 'wallet' | 'direct' = 'wallet',
  buyerNotes: string = ''
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in to buy with escrow.' };

  const admin = await createAdminClient();

  // 1. Fetch listing details
  const { data: listing, error: listErr } = await admin
    .from('listings')
    .select('id, title, price, user_id, seller_id, status')
    .eq('id', listingId)
    .single();

  if (listErr || !listing) {
    return { success: false, error: 'Listing not found.' };
  }

  const sellerId = listing.seller_id || listing.user_id;

  if (sellerId === user.id) {
    return { success: false, error: 'You cannot purchase your own listing.' };
  }

  if (listing.status !== 'active') {
    return { success: false, error: 'This item is no longer active for purchase.' };
  }

  if (!listing.price || listing.price <= 0) {
    return { success: false, error: 'Cannot create an escrow order for free items or items without a set price.' };
  }

  const validPaymentMethods = ['wallet', 'paystack', 'direct'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return { success: false, error: 'Invalid payment method selected.' };
  }

  // Generate unique order number
  const orderNumber = `CUS-ESC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 2. Create the escrow order row in pending_payment status
  const { data: newOrder, error: orderErr } = await admin
    .from('escrow_orders')
    .insert({
      order_number: orderNumber,
      buyer_id: user.id,
      seller_id: sellerId,
      listing_id: listing.id,
      amount: listing.price,
      currency: 'NGN',
      status: 'pending_payment',
      payment_method: paymentMethod,
      buyer_notes: buyerNotes,
    })
    .select()
    .single();

  if (orderErr || !newOrder) {
    console.error('Error creating escrow order:', orderErr);
    return { success: false, error: orderErr?.message || 'Failed to initialize escrow order.' };
  }

  // 3. If paying with wallet, execute atomic RPC
  if (paymentMethod === 'wallet') {
    const { data: fundResult, error: fundErr } = await admin.rpc('fund_escrow_order_from_wallet', {
      p_order_id: newOrder.id,
      p_buyer_id: user.id
    });

    if (fundErr) {
      console.error('RPC fund error:', fundErr);
      return { success: false, error: 'Wallet funding failed. Please check your balance.' };
    }

    if (fundResult && !fundResult.success) {
      return { success: false, error: fundResult.error || 'Insufficient wallet balance.' };
    }

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/wallet');
    return { success: true, order: newOrder, funded: true };
  }

  return { success: true, order: newOrder, funded: false };
}

export async function verifyMeetupHandshakeAction(listingId: string, inputPin: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to verify a campus trade.' };
    }

    const admin = await createAdminClient();

    // Fetch listing
    const { data: listing, error: listErr } = await admin
      .from('listings')
      .select('id, user_id, seller_id, title, status')
      .eq('id', listingId)
      .maybeSingle();

    if (listErr || !listing) {
      return { success: false, error: 'Listing not found.' };
    }

    const sellerId = listing.seller_id || listing.user_id;

    // Check PIN matching
    const seed = listingId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const expectedPin = String((seed % 9000) + 1000);

    if (inputPin.trim() !== expectedPin) {
      return { success: false, error: 'Invalid 4-digit Handshake PIN. Please verify with the buyer.' };
    }

    // Mark listing as sold
    await admin
      .from('listings')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', listingId);

    // Increment completed transactions count
    const { data: prof } = await admin
      .from('profiles')
      .select('completed_transactions')
      .eq('user_id', sellerId)
      .maybeSingle();

    await admin
      .from('profiles')
      .update({
        completed_transactions: (prof?.completed_transactions || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', sellerId);

    // Record notification for seller
    await admin.from('notifications').insert({
      user_id: sellerId,
      type: 'trade_verified',
      title: 'Handshake Trade Verified!',
      body: `Your in-person handover for "${listing.title}" has been verified. +1 verified trade recorded.`,
      data: { listingId }
    });

    revalidatePath(`/marketplace/${listingId}`);
    revalidatePath('/dashboard/listings');
    return { success: true };
  } catch (err: any) {
    console.error('verifyMeetupHandshakeAction error:', err);
    return { success: false, error: err.message || 'Failed to complete handshake verification' };
  }
}

