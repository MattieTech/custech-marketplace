'use client';

import React from 'react';
import { ListingCard } from './listing-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ShoppingBag } from 'lucide-react';

interface ListingGridProps {
  listings: any[];
  loading?: boolean;
  emptyMessage?: string;
  count?: number;
  currentPage?: number;
  pageSize?: number;
}

export function ListingGrid({ listings, loading = false, emptyMessage = 'No listings found.' }: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col h-full bg-white rounded-lg border overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-4 flex flex-col flex-grow gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-1/3 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-auto" />
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-2">
                <Skeleton className="h-6 w-1/2 rounded-full" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
