import { notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { PublicProfileView } from '@/components/profile/public-profile-view';
import { getProfileStatistics } from '@/app/profile/actions';

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const admin = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  const cleanId = decodeURIComponent(userId).replace(/^@/, '').trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  const safeQuery = cleanId.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();

  let profileQuery = admin.from('profiles').select('*');
  if (isUuid) {
    profileQuery = profileQuery.or(`user_id.eq.${cleanId},id.eq.${cleanId},referral_code.ilike.${cleanId}`);
  } else if (safeQuery) {
    profileQuery = profileQuery.or(`referral_code.ilike.${safeQuery},display_name.ilike.${safeQuery}`);
  } else {
    notFound();
  }

  const { data: profile } = await profileQuery.maybeSingle();

  if (!profile) {
    notFound();
  }

  // Fetch all user's listings
  const { data: allListings } = await admin
    .from('listings')
    .select('id, title, description, price, condition, location, listing_type, status, created_at, images:listing_images(url)')
    .or(`seller_id.eq.${profile.user_id},user_id.eq.${profile.user_id}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const safeListings = (allListings || []).map((l: any) => ({
    ...l,
    thumbnail_url: l.images?.[0]?.url || null,
    images: l.images?.map((img: any) => img.url) || []
  }));

  const products = safeListings.filter((l: any) => l.listing_type === 'product' || !l.listing_type);
  const properties = safeListings.filter((l: any) => l.listing_type === 'housing');
  const services = safeListings.filter((l: any) => l.listing_type === 'service');

  // Fetch user reviews
  const { data: rawReviews } = await admin
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer_id
    `)
    .eq('reviewed_user_id', profile.user_id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Hydrate reviewer names
  let reviewsWithProfiles: any[] = [];
  if (rawReviews && rawReviews.length > 0) {
    const reviewerIds = [...new Set(rawReviews.map(r => r.reviewer_id))];
    const { data: reviewerProfiles } = await admin
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', reviewerIds);

    const profileMap = new Map((reviewerProfiles || []).map(p => [p.user_id, p]));
    reviewsWithProfiles = rawReviews.map(r => ({
      ...r,
      reviewer: profileMap.get(r.reviewer_id) || { display_name: 'Verified Student' }
    }));
  }

  const stats = await getProfileStatistics(profile.user_id);

  return (
    <PageContainer>
      <PublicProfileView 
        profile={profile}
        currentUserId={user?.id}
        listings={products}
        properties={properties}
        services={services}
        reviews={reviewsWithProfiles}
        stats={stats}
      />
    </PageContainer>
  );
}
