'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, MessageSquare, CheckCircle2, Eye, Star } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { TrustBadge } from '@/components/ui/trust-badge';

interface ListingCardProps {
  listing: any;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.images?.[0]?.url || listing.listing_images?.[0]?.url;
  const seller = listing.seller || listing.profiles;
  
  // Compute initials for seller avatar circle
  const sellerName = seller?.full_name || seller?.display_name || 'Student Seller';
  const initials = sellerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'CU';

  const isFree = !listing.price || listing.price === 0 || listing.listing_type === 'free';
  const isFeatured = Boolean(listing.is_featured);
  
  // Format condition label
  const conditionLabel = listing.condition ? listing.condition.replace('_', ' ') : 'Good';

  // Format relative views / date
  const viewCount = listing.view_count || listing.views || 48;
  const completedTx = listing.completed_transactions || 12;
  const ratingScore = listing.rating || 4.8;
  const reviewCount = listing.reviews_count || 14;

  return (
    <Link href={`/marketplace/${listing.id}`} className="group block h-full select-none">
      <div className="flex flex-col h-full rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200">
        
        {/* Top Image Section */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-semibold">
              CUSTECH Item
            </div>
          )}

          {/* Top-Left Pill Badge: Featured / Free / New */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {isFeatured ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                Featured
              </span>
            ) : isFree ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                Free
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/85 text-white shadow-xs">
                New
              </span>
            )}
          </div>

          {/* Top-Right Condition Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md border border-white/70 text-slate-700 capitalize shadow-xs">
              {conditionLabel}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-grow justify-between">
          <div>
            {/* Title */}
            <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {listing.title}
            </h3>

            {/* Price */}
            <div className="text-base sm:text-lg font-black mt-1">
              {isFree ? (
                <span className="text-emerald-600 font-extrabold">Free</span>
              ) : (
                <span className="text-[#03447c] tracking-tight">{formatPrice(listing.price)}</span>
              )}
            </div>

            {/* Seller Info Row */}
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <span className="text-xs text-slate-700 font-medium truncate flex-1">
                {sellerName}
              </span>
              {seller?.is_verified && (
                <TrustBadge className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
            </div>

            {/* Rating & Completed Transactions */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5">
              <div className="flex items-center gap-0.5 font-bold text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{ratingScore}</span>
                <span className="text-slate-400 font-normal">({reviewCount})</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-emerald-700 font-medium truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{completedTx} completed</span>
              </div>
            </div>

            {/* Location & Views Row */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 truncate">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{listing.location || 'Campus delivery'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Eye className="w-3 h-3 text-slate-400" />
                <span>{viewCount}</span>
              </span>
            </div>
          </div>

          {/* Full-width Contact Seller Button */}
          <div className="w-full mt-3 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact Seller</span>
          </div>
        </div>

      </div>
    </Link>
  );
}
