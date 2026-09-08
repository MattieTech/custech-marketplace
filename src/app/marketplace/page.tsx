import React, { Suspense } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { CategoryNav } from '@/components/marketplace/category-nav';
import { FilterPanel } from '@/components/marketplace/filter-panel';
import { ListingGrid } from '@/components/marketplace/listing-grid';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const metadata = {
  title: 'Marketplace - CUSTECH',
  description: 'Buy and sell within the CUSTECH community',
};

async function getListings(searchParams: any) {
  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select(`
      *,
      category:categories(name, slug),
      seller:profiles!user_id(user_id, display_name, avatar_url, verification_status, trust_level),
      listing_images(url)
    `)
    .eq('listing_type', 'product')
    .eq('status', 'active');

  const searchTerm = (searchParams.search || searchParams.q || '').trim();
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  if (searchParams.category && searchParams.category !== 'all') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchParams.category);
    if (isUuid) {
      query = query.eq('category_id', searchParams.category);
    } else {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', searchParams.category).maybeSingle();
      if (cat?.id) {
        query = query.eq('category_id', cat.id);
      }
    }
  }
  if (searchParams.minPrice) {
    query = query.gte('price', parseInt(searchParams.minPrice) * 100);
  }
  if (searchParams.maxPrice) {
    query = query.lte('price', parseInt(searchParams.maxPrice) * 100);
  }
  if (searchParams.condition) {
    const rawConditions = searchParams.condition.split(',');
    const conditionMap: Record<string, string> = {
      'new': 'new',
      'like new': 'like_new',
      'good': 'good',
      'fair': 'fair',
      'poor': 'poor',
    };
    const mappedConditions = rawConditions.map((c: string) => conditionMap[c.trim().toLowerCase()] || c.trim().toLowerCase());
    query = query.in('condition', mappedConditions);
  }
  if (searchParams.location) {
    query = query.ilike('location', `%${searchParams.location}%`);
  }

  // Handle sorting
  const sortBy = searchParams.sortBy || 'newest';
  if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
  if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
  if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
  if (sortBy === 'views') query = query.order('view_count', { ascending: false });

  // Pagination
  const page = parseInt(searchParams.page || '1');
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  query = query.range(from, to);

  const { data, error, count } = await query;
  
  let filteredData = data || [];
  if (searchParams.verifiedSeller === 'true') {
    filteredData = filteredData.filter((item: any) => {
      const s = Array.isArray(item.seller) ? item.seller[0] : item.seller;
      return s?.verification_status === 'approved';
    });
  }

  return { data: filteredData, error, count };
}

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<any> | any }) {
  const resolvedParams = await searchParams;
  const { data: listings } = await getListings(resolvedParams || {});

  return (
    <PageContainer>
      <div className="py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
            <p className="text-gray-500 mt-2">Buy and sell within the CUSTECH community</p>
          </div>
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-[400px] overflow-y-auto">
                <div className="py-4">
                  <h2 className="text-lg font-bold mb-4">Filters</h2>
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <CategoryNav />

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Panel */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 font-bold text-lg mb-4 border-b pb-2">
                <Filter className="w-5 h-5" />
                <h2>Filters</h2>
              </div>
              <Suspense fallback={<div>Loading filters...</div>}>
                <FilterPanel />
              </Suspense>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Suspense fallback={<ListingGrid listings={[]} loading={true} />}>
              <ListingGrid 
                listings={listings || []} 
                emptyMessage="No listings match your search criteria. Try adjusting your filters."
              />
            </Suspense>
          </main>
        </div>
      </div>
    </PageContainer>
  );
}
