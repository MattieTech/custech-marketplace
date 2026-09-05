import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, MoreHorizontal, Edit, Edit3, Trash2, Eye, ShoppingBag } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteListingButton } from './delete-button';

export const metadata = {
  title: 'My Listings - Dashboard',
};

export default async function MyListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Should be handled by middleware, but fallback
    return <div>Not authenticated</div>;
  }

  const { data: listings } = await supabase
    .from('listings')
    .select(`*, listing_images(url)`)
    .or(`seller_id.eq.${user.id},user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderListings = (items: any[]) => {
    if (!items || items.length === 0) {
      return (
        <EmptyState
          icon={ShoppingBag}
          title="No listings found"
          description="You haven't created any listings in this category yet."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((listing) => (
          <div key={listing.id} className="bg-white border rounded-xl overflow-hidden flex flex-col">
            <div className="relative h-48 bg-gray-100">
              {listing.listing_images?.[0]?.url ? (
                <img 
                  src={listing.listing_images[0].url} 
                  alt={listing.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-12 h-12" />
                </div>
              )}
              <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                {listing.status}
              </span>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-900 truncate mb-1">{listing.title}</h3>
              <p className="text-green-600 font-bold mb-4">{formatPrice(listing.price)}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t">
                <span className="flex items-center">
                  <Eye className="w-3.5 h-3.5 mr-1" /> {listing.views || 0} views
                </span>
                <span>{formatDate(listing.created_at)}</span>
              </div>
              
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/listings/${listing.id}/edit`}>
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Link>
                </Button>
                <DeleteListingButton listingId={listing.id} listingTitle={listing.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const activeListings = listings?.filter((l: any) => l.status === 'active') || [];
  const soldListings = listings?.filter((l: any) => l.status === 'sold') || [];

  return (
    <PageContainer>
      <div className="py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your marketplace items</p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
            <Link href="/dashboard/listings/new">
              <Plus className="w-4 h-4 mr-2" /> Create Listing
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 bg-transparent border-b rounded-none w-full justify-start h-auto p-0 flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">
              All ({listings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">
              Active ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="sold" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">
              Sold ({soldListings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {renderListings(listings || [])}
          </TabsContent>
          <TabsContent value="active" className="mt-0">
            {renderListings(activeListings)}
          </TabsContent>
          <TabsContent value="sold" className="mt-0">
            {renderListings(soldListings)}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
