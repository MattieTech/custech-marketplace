'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, ShoppingBag } from 'lucide-react';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { TrustBadge } from '@/components/ui/trust-badge';

interface ListingCardProps {
  listing: any;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export function ListingCard({ listing, onSave, isSaved = false }: ListingCardProps) {
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave(listing.id);
  };

  const imageUrl = listing.images?.[0]?.url || listing.listing_images?.[0]?.url;
  const seller = listing.seller || listing.profiles;

  return (
    <Link href={`/marketplace/${listing.id}`} className="group block h-full select-none">
      <div className="flex flex-col h-full rounded-3xl overflow-hidden border border-white/80 bg-white/85 backdrop-blur-2xl backdrop-saturate-180 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.95)] hover:shadow-[0_22px_45px_-10px_rgba(0,0,0,0.09),inset_0_1px_2px_rgba(255,255,255,1)] hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        {/* Image Section with Specular Inset Vignette */}
        <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={listing.title} 
              fill 
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center shadow-xs text-slate-400">
              <ShoppingBag className="w-7 h-7" />
            </div>
          )}
          
          {/* Subtle Ambient Inset Shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

          {/* Condition Floating Liquid Pill */}
          {listing.condition && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight bg-white/85 backdrop-blur-md border border-white/70 text-slate-800 shadow-sm">
                {listing.condition}
              </span>
            </div>
          )}

          {/* Floating Liquid Glass Save Heart Button */}
          <button 
            type="button"
            onClick={handleSave}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 backdrop-blur-md border border-white/70 shadow-md flex items-center justify-center transition-all active:scale-90"
            aria-label={isSaved ? "Unsave listing" : "Save listing"}
          >
            <Heart className={cn("w-4 h-4 transition-transform active:scale-125", isSaved && "fill-emerald-500 text-emerald-500")} />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between space-y-3 bg-white/50 backdrop-blur-md">
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-[15px] text-slate-900 line-clamp-2 leading-snug tracking-tight group-hover:text-emerald-700 transition-colors">
              {listing.title}
            </h3>
            
            <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight">
              {formatPrice(listing.price)}
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center text-xs font-medium text-slate-500">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              <span className="truncate">{listing.location || 'CUSTECH Campus'}</span>
            </div>

            {/* Seller Info Bar */}
            <div className="pt-2.5 border-t border-slate-100/90 flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-hidden">
                <Avatar src={seller?.avatar_url} fallback={seller?.full_name?.charAt(0) || 'U'} className="w-6 h-6 ring-2 ring-white shadow-2xs" />
                <span className="text-xs font-semibold text-slate-700 truncate">{seller?.full_name || 'Campus Student'}</span>
                {seller?.is_verified && <TrustBadge className="w-3.5 h-3.5 shrink-0" />}
              </div>
              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                {formatDate(listing.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
