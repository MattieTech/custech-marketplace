import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Eye, Heart, Flag, Share2, MessageCircle, ChevronLeft, ShieldCheck, CheckCircle2, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { TrustBadge } from '@/components/ui/trust-badge';
import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/marketplace/listing-grid';
import { ListingActionButtons } from '@/components/marketplace/listing-action-buttons';
import { ShareButton } from '@/components/marketplace/share-button';
import { incrementViewCount, toggleSaveListing } from './actions';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase.from('listings').select('title, description').eq('id', id).maybeSingle();
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
      category:categories(name),
      listing_images(url)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !listing) return null;

  if (listing.user_id) {
    const { data: seller } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, verification_status, trust_level, bank_name, account_number, account_name, whatsapp_number, phone, matric_number, department, created_at, rating_avg')
      .eq('user_id', listing.user_id)
      .maybeSingle();

    listing.seller = seller || null;
  }

  return listing;
}

async function getSimilarListings(categoryId: string, currentId: string) {
  if (!categoryId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images(url)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', currentId)
    .limit(4);

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((l: any) => l.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, verification_status, avatar_url')
    .in('user_id', userIds);

  const profileMap = (profiles || []).reduce((acc: any, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return data.map((l: any) => ({
    ...l,
    seller: profileMap[l.user_id] || null,
  }));
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  
  if (!listing) {
    notFound();
  }

  // Increment view count in background
  incrementViewCount(id);

  const images = listing.listing_images?.map((img: any) => img.url).filter(Boolean) || [];
  const mainImage = images[0] || '';
  const seller = Array.isArray(listing.seller) ? listing.seller[0] || {} : listing.seller || {};
  const categoryName = listing.category?.name || 'General Item';

  const similarListings = await getSimilarListings(listing.category_id, listing.id);

  return (
    <PageContainer>
      <div className="py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
        {/* Navigation & Share Row */}
        <div className="flex items-center justify-between">
          <Link href="/marketplace" className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Marketplace
          </Link>
          <ShareButton title={listing.title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Gallery & Full Description */}
          <div className="lg:col-span-2 space-y-5">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
              {mainImage ? (
                <img src={mainImage} alt={listing.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Package className="w-12 h-12 stroke-[1.5]" />
                  <span className="text-xs font-semibold">No Image Uploaded</span>
                </div>
              )}

              {/* Status or condition badge */}
              {listing.condition && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 border border-slate-200 capitalize shadow-xs">
                  {listing.condition.replace(/_/g, ' ')}
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((url: string, idx: number) => (
                  <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Desktop Description Container */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-3 shadow-xs">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Product Description</h2>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>
          </div>

          {/* Right Column - Title, Price, Details, Action Buttons, Seller Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                    {categoryName}
                  </span>
                  {listing.is_featured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {listing.title}
                </h1>
              </div>
              
              <div className="text-2xl sm:text-3xl font-black text-[#03447c] tracking-tight">
                {formatPrice(listing.price)}
              </div>

              <div className="space-y-2.5 text-xs text-slate-500 border-y border-slate-100 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{listing.location || 'Campus / SUB / Library'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{listing.view_count || 0} views</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Listed {formatDate(listing.created_at)}
                </div>
              </div>

              {/* Action Buttons: Escrow Purchase, Direct Pay, Message, Like, Save */}
              <ListingActionButtons 
                listing={{ id: listing.id, title: listing.title, price: listing.price }}
                seller={{
                  id: seller.user_id || listing.user_id || '',
                  display_name: seller.display_name || 'Campus Student',
                  trust_level: seller.trust_level,
                  verification_status: seller.verification_status,
                  bank_name: seller.bank_name,
                  account_number: seller.account_number,
                  account_name: seller.account_name,
                  whatsapp_number: seller.whatsapp_number,
                  phone: seller.phone,
                }}
                onSaveAction={toggleSaveListing}
              />
            </div>

            {/* Seller Information Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">About the Seller</h3>
              <div className="flex items-center gap-3.5">
                <Avatar 
                  src={seller.avatar_url} 
                  fallback={seller.display_name?.charAt(0) || 'U'} 
                  className="w-12 h-12 rounded-2xl border-2 border-emerald-100" 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{seller.display_name || 'Campus Member'}</span>
                    {seller.verification_status === 'approved' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {seller.verification_status === 'approved' ? 'Verified CUSTECH Student' : 'Campus Member'}
                  </div>
                </div>
              </div>
              
              <Link 
                href={`/profile/${seller.user_id || listing.user_id}`} 
                className="block w-full text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200/80"
              >
                View Seller Profile & Other Listings
              </Link>
            </div>
          </div>
        </div>

        {/* Similar Listings Section */}
        {similarListings.length > 0 && (
          <div className="mt-16 border-t border-slate-200/80 pt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Similar Campus Items</h2>
            <ListingGrid listings={similarListings} />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
