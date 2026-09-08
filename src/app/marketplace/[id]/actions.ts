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

  const { data: existing } = await admin
    .from('saved_listings')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    await admin
      .from('saved_listings')
      .delete()
      .eq('id', existing.id);

    revalidatePath(`/marketplace/${listingId}`);
    revalidatePath('/dashboard/saved');
    return { success: true, saved: false };
  } else {
    await admin
      .from('saved_listings')
      .insert({ user_id: user.id, listing_id: listingId });

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

  const { data: existing } = await admin
    .from('listing_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    await admin
      .from('listing_likes')
      .delete()
      .eq('id', existing.id);

    // Get latest likes count
    const { count } = await admin
      .from('listing_likes')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    revalidatePath(`/marketplace/${listingId}`);
    return { success: true, liked: false, count: count || 0 };
  } else {
    await admin
      .from('listing_likes')
      .insert({ user_id: user.id, listing_id: listingId });

    const { count } = await admin
      .from('listing_likes')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    revalidatePath(`/marketplace/${listingId}`);
    return { success: true, liked: true, count: count || 1 };
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
