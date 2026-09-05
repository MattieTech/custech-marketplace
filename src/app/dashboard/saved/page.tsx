import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Bookmark, ShoppingBag, Grid, Home } from 'lucide-react';
import Link from 'next/link';

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> | any }) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const currentTab = resolvedParams?.tab || 'all';

  // Fetch saved items joined with listings
  let query = supabase
    .from('saved_listings')
    .select(`
      id,
      listing_id,
      created_at,
      listing:listings(
        id, title, price, category, status, thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: savedItems, error } = await query;
  
  const formattedListings = (savedItems || [])
    .map((item: any) => item.listing)
    .filter(Boolean); // Filter out nulls if listing was deleted

  const filteredListings = currentTab === 'all' 
    ? formattedListings 
    : formattedListings.filter((l: any) => l.category?.toLowerCase() === currentTab.toLowerCase());

  const tabs = [
    { id: 'all', label: 'All Saved', icon: Bookmark },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'services', label: 'Services', icon: Grid },
    { id: 'housing', label: 'Housing', icon: Home },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
          <p className="text-gray-500 mt-1">Keep track of listings you are interested in.</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/dashboard/saved?tab=${tab.id}`}
                  className={`
                    flex items-center gap-2 py-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive 
                      ? 'border-green-600 text-green-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">Error loading saved items.</div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No saved items</h3>
            <p className="text-gray-500 mt-1 mb-4">
              {currentTab === 'all' 
                ? 'Browse the marketplace and save items you like.' 
                : `No saved items in ${tabs.find(t => t.id === currentTab)?.label}.`}
            </p>
            <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing: any) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-100 relative">
                  {listing.thumbnail_url ? (
                    <img src={listing.thumbnail_url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                  {/* Remove button could go here, omitting complex interactivity in server component for simplicity */}
                </div>
                <div className="p-4">
                  <div className="text-xs text-green-600 font-medium mb-1 uppercase tracking-wider">{listing.category}</div>
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-green-600 transition-colors">{listing.title}</h3>
                  <p className="mt-1 font-bold text-gray-900">₦{listing.price?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
