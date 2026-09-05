'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function incrementViewCount(listingId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('increment_listing_view', {
    listing_id: listingId
  });

  // Alternatively, direct update if rpc is not available:
  // const { data: current } = await supabase.from('listings').select('view_count').eq('id', listingId).single();
  // if (current) {
  //   await supabase.from('listings').update({ view_count: (current.view_count || 0) + 1 }).eq('id', listingId);
  // }
  
  return { success: !error };
}

export async function toggleSaveListing(listingId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('saved_listings')
    .select('*')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('id', existing.id);
    if (!error) revalidatePath('/marketplace/[id]', 'page');
    return { success: !error, saved: false };
  } else {
    const { error } = await supabase
      .from('saved_listings')
      .insert({ user_id: user.id, listing_id: listingId });
    if (!error) revalidatePath('/marketplace/[id]', 'page');
    return { success: !error, saved: true };
  }
}
