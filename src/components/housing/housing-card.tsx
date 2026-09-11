'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, Bed, Bath, Eye, Star, CheckCircle2, ShieldCheck, 
  Bookmark, Flag, MessageSquare, Phone, Zap, Droplets, Wifi, Car 
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export interface HousingProperty {
  id: string;
  title: string;
  property_type: string; // 'Self-Contained' | 'Single Room' | '1 Bedroom' | 'Hostel' | 'Shared' | '2 Bedrooms'
  is_featured?: boolean;
  rent: number; // e.g. 180000
  rent_period?: string; // '/yr'
  caution_fee?: number;
  service_charge?: number;
  total_move_in?: number;
  location: string;
  proximity: string; // '5 min walk', '10 min walk', '15 min drive'
  beds: number;
  baths?: number;
  views: number;
  amenities: string[]; // ['Electricity', 'Water', 'Wi-Fi', 'Parking']
  landlord_name: string;
  landlord_role: string; // 'Verified Landlord' | 'Verified Agent' | 'Verified Property'
  landlord_initials: string;
  landlord_rating: number;
  landlord_reviews_count: number;
  available_from: string; // '1 September 2026'
  phone_number?: string;
  image_url: string;
}

interface HousingCardProps {
  property: HousingProperty;
}

export function HousingCard({ property }: HousingCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);

  const caution = property.caution_fee || Math.round(property.rent * 0.5);
  const service = property.service_charge || 15000;
  const totalMoveIn = property.total_move_in || (property.rent + caution + service);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved lodges' : 'Saved to your favorites');
  };

  const handleFlag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlagged(!isFlagged);
    toast.info(isFlagged ? 'Flag removed' : 'Lodge reported for admin review');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (property.phone_number) {
      window.location.href = `tel:${property.phone_number}`;
    } else {
      toast.error('No contact phone number provided. Please send a message on the platform.');
    }
  };

  // Helper to render amenity badge with matching icon
  const renderAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('elect')) return <Zap className="w-3 h-3 text-amber-500" />;
    if (lower.includes('water')) return <Droplets className="w-3 h-3 text-blue-500" />;
    if (lower.includes('wi-fi') || lower.includes('wifi')) return <Wifi className="w-3 h-3 text-emerald-500" />;
    if (lower.includes('park')) return <Car className="w-3 h-3 text-indigo-500" />;
    return null;
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Image Area with Overlay Badges */}
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Top-Left Badges: Featured + Room Type */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            {property.is_featured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                Featured
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-xs">
              {property.property_type}
            </span>
          </div>

          {/* Top-Right Buttons: Bookmark + Flag */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleBookmark}
              aria-label="Save lodge"
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${
                isSaved ? 'bg-emerald-500 text-white' : 'bg-black/30 hover:bg-black/50 text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleFlag}
              aria-label="Report listing"
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${
                isFlagged ? 'bg-red-500 text-white' : 'bg-black/30 hover:bg-black/50 text-white'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Bottom-Left Price Overlay Pill */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black bg-[#03447c] text-white shadow-sm tracking-wide">
              {formatPrice(property.rent)}
              <span className="font-normal text-[10px] ml-0.5 opacity-90">{property.rent_period || '/yr'}</span>
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <Link href={`/housing/${property.id}`} className="block">
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {property.title}
            </h3>
          </Link>

          {/* Location & Proximity */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.location}</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-600 font-semibold shrink-0">{property.proximity}</span>
          </div>

          {/* Specs: Bed, Bath, Views */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}</span>
            </span>
            {property.baths !== undefined && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" />
                  <span>{property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}</span>
                </span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{(property as any).view_count ?? property.views ?? 0} views</span>
            </span>
          </div>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {property.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-600"
              >
                {renderAmenityIcon(amenity)}
                <span>{amenity}</span>
              </span>
            ))}
          </div>

          {/* Landlord Row */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {property.landlord_initials}
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-800 truncate leading-tight">
                  {property.landlord_name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                  <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>{property.landlord_role}</span>
                </div>
              </div>
            </div>

            {property.landlord_reviews_count > 0 ? (
              <div className="flex items-center gap-1 font-bold text-slate-800 text-xs shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{property.landlord_rating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-normal">({property.landlord_reviews_count})</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium shrink-0">New Lister</span>
            )}
          </div>

          {/* Cost Breakdown Gray Box */}
          <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Annual Rent</span>
              <span className="font-medium text-slate-700">{formatPrice(property.rent)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Caution Fee</span>
              <span className="font-medium text-slate-700">{formatPrice(caution)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Service Charge</span>
              <span className="font-medium text-slate-700">{formatPrice(service)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 font-bold text-slate-900">
              <span>Total Move-in</span>
              <span>{formatPrice(totalMoveIn)}</span>
            </div>
          </div>

          {/* Availability Date */}
          <p className="text-[11px] text-slate-500">
            Available from: <span className="font-medium text-slate-700">{property.available_from}</span>
          </p>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
        <Link
          href={`/housing/${property.id}`}
          className="flex-1 bg-[#094c7a] hover:bg-[#073d63] text-white py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Enquire</span>
        </Link>
        <button
          type="button"
          onClick={handleCall}
          aria-label="Call landlord"
          className="w-9 h-9 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl flex items-center justify-center transition-colors shadow-2xs shrink-0"
        >
          <Phone className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
