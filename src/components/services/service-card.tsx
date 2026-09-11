'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Star, CheckCircle2, Clock, Bookmark, Flag, 
  MessageSquare, Sparkles, ShieldCheck 
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  price_prefix?: string; // 'From'
  is_featured?: boolean;
  provider_name: string;
  provider_initials: string;
  provider_badge: 'Trusted Seller' | 'CUSTECH Verified';
  provider_type: 'trusted' | 'verified';
  rating: number;
  reviews_count: number;
  jobs_done: number;
  delivery_time: string; // '3', '1', 'Per session', 'Same day'
  delivery_label?: string; // 'Delivery'
  image_url: string;
}

interface ServiceCardProps {
  service: ServiceItem;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved services' : 'Service saved to favorites');
  };

  const handleFlag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlagged(!isFlagged);
    toast.info(isFlagged ? 'Flag removed' : 'Service reported for moderation review');
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Image Container with Overlays */}
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <img
            src={service.image_url}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Top-Left: Orange Featured Badge */}
          {service.is_featured && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                Featured
              </span>
            </div>
          )}

          {/* Top-Right: Bookmark Icon Button */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={handleBookmark}
              aria-label="Save service"
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${
                isSaved ? 'bg-emerald-500 text-white' : 'bg-black/30 hover:bg-black/50 text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Bottom-Left: Navy Price Pill */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black bg-[#03447c] text-white shadow-sm tracking-wide">
              {service.price_prefix || 'From'}{' '}
              <span className="ml-1">{formatPrice(service.price)}</span>
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <Link href={`/services/${service.id}`} className="block">
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {service.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          {/* Skill / Tag Pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Provider / Seller Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
              {service.provider_initials}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-800 leading-tight truncate">
                {service.provider_name}
              </span>
              <div className="pt-0.5">
                {service.provider_type === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                    <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                    <span>CUSTECH Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                    <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                    <span>Trusted Seller</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3 Metrics Boxes */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            {/* Rating */}
            <div className="bg-slate-50/90 rounded-xl py-2 px-1 border border-slate-100 flex flex-col items-center justify-center">
              {service.reviews_count > 0 ? (
                <>
                  <div className="flex items-center gap-0.5 text-xs font-bold text-slate-800">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{service.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                    {service.reviews_count} reviews
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-800">Fresh</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                    New Service
                  </span>
                </>
              )}
            </div>

            {/* Jobs Completed */}
            <div className="bg-slate-50/90 rounded-xl py-2 px-1 border border-slate-100 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{service.jobs_done}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                Jobs done
              </span>
            </div>

            {/* Delivery Time */}
            <div className="bg-slate-50/90 rounded-xl py-2 px-1 border border-slate-100 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{service.delivery_time}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                {service.delivery_label || 'Delivery'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
        <Link
          href={`/services/${service.id}`}
          className="flex-1 bg-[#094c7a] hover:bg-[#073d63] text-white py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Hire Now</span>
        </Link>
        <button
          type="button"
          onClick={handleFlag}
          aria-label="Report service"
          className={`w-9 h-9 border rounded-xl flex items-center justify-center transition-colors shadow-2xs shrink-0 ${
            isFlagged 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : 'border-blue-200 text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-red-600' : ''}`} />
        </button>
      </div>
    </div>
  );
}
