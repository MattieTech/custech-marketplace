import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Eye, Heart, Flag, Share2, MessageCircle, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { TrustBadge } from '@/components/ui/trust-badge';
import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/marketplace/listing-grid';
import { ListingActionButtons } from '@/components/marketplace/listing-action-buttons';
import { incrementViewCount, toggleSaveListing } from './actions';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase.from('listings').select('title, description').eq('id', id).single();
  return {
    title: listing ? `${listing.title} - CUSTECH Marketplace` : 'Listing Not Found',
    description: listing?.description?.slice(0, 160),
  };
}

async function getListing(id: string) {
  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles:seller_id(*),
      listing_images(url)
    `)
    .eq('id', id)
    .single();

  if (error || !listing) return null;
  return listing;
}

async function getSimilarListings(categoryId: string, currentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('listings')
    .select('*, profiles:seller_id(*), listing_images(url)')
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', currentId)
    .limit(4);
  return data || [];
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  
  if (!listing) {
    notFound();
  }

  // Increment view count server-side (fire and forget for this render)
  incrementViewCount(id);

  const images = listing.listing_images?.map((img: any) => img.url) || [];
  const mainImage = images[0] || '';
  const seller = listing.profiles;

  const similarListings = await getSimilarListings(listing.category_id, listing.id);

  return (
    <PageContainer>
      <div className="py-6">
        <Link href="/marketplace" className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video sm:aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border">
              {mainImage ? (
                <Image src={mainImage} alt={listing.title} fill className="object-contain" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((url: string, idx: number) => (
                  <div key={idx} className={cn("relative w-20 h-20 rounded-md overflow-hidden border flex-shrink-0 cursor-pointer", idx === 0 ? "ring-2 ring-green-500 border-transparent" : "hover:border-green-300")}>
                    <Image src={url} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-xl border p-6 mt-8 hidden lg:block">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
              </div>
              
              <div className="text-3xl font-bold text-green-600 mb-6">
                {formatPrice(listing.price)}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {listing.condition && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    Condition: {listing.condition}
                  </Badge>
                )}
                <Badge variant="outline" className="text-gray-600">
                  {listing.category_id}
                </Badge>
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-8 border-y py-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                  {listing.location || 'Campus'}
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-3 text-gray-400" />
                  {listing.view_count || 0} views
                </div>
                <div className="flex items-center text-gray-500">
                  Posted {formatDate(listing.created_at)}
                </div>
              </div>

              <ListingActionButtons 
                listing={{ id: listing.id, title: listing.title, price: listing.price }}
                seller={{
                  id: seller?.user_id || listing.seller_id || '',
                  display_name: seller?.display_name || seller?.full_name || 'Community Member',
                  trust_level: seller?.trust_level,
                  verification_status: seller?.verification_status,
                  bank_name: (seller as any)?.bank_name,
                  account_number: (seller as any)?.account_number,
                  account_name: (seller as any)?.account_name,
                  whatsapp_number: (seller as any)?.whatsapp_number,
                  phone: seller?.phone,
                }}
                onSaveAction={toggleSaveListing}
              />
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">About the Seller</h3>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar src={seller?.avatar_url} fallback={seller?.full_name?.charAt(0) || 'U'} className="w-12 h-12" />
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-gray-900">{seller?.full_name || 'Anonymous User'}</span>
                    {seller?.is_verified && <TrustBadge className="w-4 h-4" />}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    Joined {new Date(seller?.created_at).getFullYear()}
                  </div>
                </div>
              </div>
              
              <Link href={`/profile/${seller?.user_id || listing.seller_id}`} className="block w-full text-center text-sm font-medium text-green-600 hover:text-green-700 p-2 rounded-md hover:bg-green-50 transition-colors">
                View Profile
              </Link>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" asChild className="text-gray-400 hover:text-red-600 text-sm h-auto py-2">
                <Link href={`/dashboard/disputes/new?listing=${listing.id}`}>
                  <Flag className="w-4 h-4 mr-2" /> Report this listing
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Mobile Description (shows below right column on small screens) */}
          <div className="bg-white rounded-xl border p-6 lg:hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
              {listing.description}
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <div className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Items</h2>
            <ListingGrid listings={similarListings} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t lg:hidden z-50 flex items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-xs text-gray-500">Price</div>
          <div className="text-lg font-bold text-green-600">{formatPrice(listing.price)}</div>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white flex-1 max-w-xs" asChild>
          <Link href={`/messages?user=${seller?.user_id || listing.seller_id}`}>
            <MessageCircle className="w-4 h-4 mr-2" /> Message
          </Link>
        </Button>
      </div>
    </PageContainer>
  );
}
