'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type EscrowOrderDetails = {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  fundedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  disputedAt: string | null;
  cancelledAt: string | null;
  disputeReason: string | null;
  buyerNotes: string | null;
  sellerNotes: string | null;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  } | null;
  counterparty?: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    whatsappNumber: string | null;
    phone: string | null;
  } | null;
};

export async function getUserOrders(): Promise<{
  success: boolean;
  purchases?: EscrowOrderDetails[];
  sales?: EscrowOrderDetails[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = await createAdminClient();

    // 1. Fetch Purchases (where user is buyer)
    const { data: rawPurchases, error: pError } = await adminClient
      .from('escrow_orders')
      .select(`
        *,
        listing:listings(id, title, price, listing_images(url))
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (pError) {
      console.error('Error fetching purchases:', pError);
    }

    // 2. Fetch Sales (where user is seller)
    const { data: rawSales, error: sError } = await adminClient
      .from('escrow_orders')
      .select(`
        *,
        listing:listings(id, title, price, listing_images(url))
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (sError) {
      console.error('Error fetching sales:', sError);
    }

    // Collect all counterparty IDs
    const counterpartyIds = [
      ...new Set([
        ...(rawPurchases || []).map((o: any) => o.seller_id),
        ...(rawSales || []).map((o: any) => o.buyer_id),
      ].filter(Boolean))
    ];

    let profileMap: Record<string, any> = {};
    if (counterpartyIds.length > 0) {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, display_name, avatar_url, whatsapp_number, phone')
        .in('user_id', counterpartyIds);

      profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
    }

    const mapOrder = (order: any, isPurchase: boolean): EscrowOrderDetails => {
      const counterpartyProfile = isPurchase ? profileMap[order.seller_id] : profileMap[order.buyer_id];

      return {
        id: order.id,
        orderNumber: order.order_number,
        buyerId: order.buyer_id,
        sellerId: order.seller_id,
        listingId: order.listing_id,
        amount: Number(order.amount),
        currency: order.currency || 'NGN',
        status: order.status,
        paymentMethod: order.payment_method,
        fundedAt: order.funded_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        completedAt: order.completed_at,
        disputedAt: order.disputed_at,
        cancelledAt: order.cancelled_at,
        disputeReason: order.dispute_reason,
        buyerNotes: order.buyer_notes,
        sellerNotes: order.seller_notes,
        createdAt: order.created_at,
        listing: order.listing ? {
          id: order.listing.id,
          title: order.listing.title,
          price: Number(order.listing.price || 0),
          images: order.listing.listing_images?.map((img: any) => img.url) || [],
        } : null,
        counterparty: counterpartyProfile ? {
          userId: counterpartyProfile.user_id,
          displayName: counterpartyProfile.display_name || (isPurchase ? 'Seller' : 'Buyer'),
          avatarUrl: counterpartyProfile.avatar_url || null,
          whatsappNumber: counterpartyProfile.whatsapp_number || null,
          phone: counterpartyProfile.phone || null,
        } : null,
      };
    };

    return {
      success: true,
      purchases: (rawPurchases || []).map((o) => mapOrder(o, true)),
      sales: (rawSales || []).map((o) => mapOrder(o, false)),
    };
  } catch (error: any) {
    console.error('getUserOrders error:', error);
    return { success: false, error: error.message || 'Failed to retrieve orders' };
  }
}

/**
 * Buyer confirms receipt and releases funds to seller wallet
 */
export async function confirmReceiptAndReleaseEscrow(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = await createAdminClient();

    // Ensure user is the buyer
    const { data: order } = await adminClient
      .from('escrow_orders')
      .select('id, buyer_id, status')
      .eq('id', orderId)
      .single();

    if (!order || order.buyer_id !== user.id) {
      return { success: false, error: 'Unauthorized. Only the buyer can confirm inspection and release funds.' };
    }

    if (!['funded', 'in_transit', 'delivered'].includes(order.status)) {
      return { success: false, error: `Cannot release funds for order in ${order.status} state.` };
    }

    // Call atomic RPC
    const { data: rpcRes, error: rpcError } = await adminClient.rpc('release_escrow_funds', {
      p_order_id: orderId,
      p_caller_id: user.id,
    });

    if (rpcError) {
      console.error('release_escrow_funds RPC error:', rpcError);
      return { success: false, error: rpcError.message || 'Failed to release escrow funds.' };
    }

    if (!rpcRes?.success) {
      return { success: false, error: rpcRes?.error || 'Failed to release escrow funds.' };
    }

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/wallet');
    return { success: true };
  } catch (error: any) {
    console.error('confirmReceiptAndReleaseEscrow error:', error);
    return { success: false, error: error.message || 'Failed to confirm receipt' };
  }
}

/**
 * Seller marks order as dispatched/in-transit to student
 */
export async function markOrderDispatched(orderId: string, dispatchNotes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = await createAdminClient();

    const { data: order } = await adminClient
      .from('escrow_orders')
      .select('id, seller_id, buyer_id, order_number, status')
      .eq('id', orderId)
      .single();

    if (!order || order.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized. Only the seller can mark this item as dispatched.' };
    }

    if (order.status !== 'funded') {
      return { success: false, error: 'Order must be funded before dispatching.' };
    }

    await adminClient
      .from('escrow_orders')
      .update({
        status: 'in_transit',
        shipped_at: new Date().toISOString(),
        seller_notes: dispatchNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Notify buyer
    await adminClient.from('notifications').insert({
      user_id: order.buyer_id,
      title: 'Order Dispatched / Ready for Meetup',
      body: `Order #${order.order_number} has been dispatched or prepared by the seller. Inspect carefully upon meeting before confirming receipt.`,
      type: 'order_dispatched',
    });

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error: any) {
    console.error('markOrderDispatched error:', error);
    return { success: false, error: error.message || 'Failed to update order status' };
  }
}

/**
 * Open a dispute on an escrow order
 */
export async function openOrderDispute(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: 'Please describe the dispute reason in at least 10 characters.' };
    }

    const adminClient = await createAdminClient();

    const { data: order } = await adminClient
      .from('escrow_orders')
      .select('id, buyer_id, seller_id, order_number, status')
      .eq('id', orderId)
      .single();

    if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
      return { success: false, error: 'Unauthorized.' };
    }

    if (['completed', 'refunded', 'cancelled'].includes(order.status)) {
      return { success: false, error: `Cannot open dispute on an order that is already ${order.status}.` };
    }

    await adminClient
      .from('escrow_orders')
      .update({
        status: 'disputed',
        disputed_at: new Date().toISOString(),
        dispute_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    const counterpartyId = user.id === order.buyer_id ? order.seller_id : order.buyer_id;

    // Notify counterparty
    await adminClient.from('notifications').insert({
      user_id: counterpartyId,
      title: 'Dispute Raised on Order #' + order.order_number,
      body: `A dispute has been raised on order #${order.order_number}. Platform support will investigate. Funds remain safely frozen in escrow.`,
      type: 'order_disputed',
    });

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error: any) {
    console.error('openOrderDispute error:', error);
    return { success: false, error: error.message || 'Failed to submit dispute' };
  }
}
