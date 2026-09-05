'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListingCard } from './listing-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ShoppingBag, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FilterPanel } from './filter-panel';

interface ListingGridProps {
  listings: any[];
  loading?: boolean;
  emptyMessage?: string;
  count?: number;
  currentPage?: number;
  pageSize?: number;
}

export function ListingGrid({ listings, loading = false, emptyMessage = 'No listings found.' }: ListingGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sortBy') || 'newest';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', e.target.value);
    router.push(`/marketplace?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="p-4 flex flex-col flex-grow gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-1/3 mt-2" />
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-auto">
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="py-12">
        <EmptyState 
          icon={ShoppingBag} 
          title="No items found" 
          description={emptyMessage} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Bar matching Screenshot 3 */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200/80">
        {/* Left: Filters Button + Count */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button 
                type="button" 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[400px] overflow-y-auto">
              <div className="py-4">
                <h2 className="text-base font-bold mb-4 text-slate-900">Filters</h2>
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-xs sm:text-sm font-semibold text-slate-600">
            {listings.length} listings found
          </span>
        </div>

        {/* Right: Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Sort by:</span>
          <div className="relative">
            <select
              value={currentSort}
              onChange={handleSortChange}
              className="appearance-none bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="views">Most Popular</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid of Listings matching Screenshot 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
