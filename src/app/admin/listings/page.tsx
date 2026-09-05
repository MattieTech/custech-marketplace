import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Search, Eye, Star, StarOff, Trash2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { featureListing, removeListing } from '@/app/admin/actions';

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; status?: string }
}) {
  await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();
  
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');
  const status = searchParams.status;
  const limit = 20;
  const offset = (page - 1) * limit;

  let dbQuery = adminClient
    .from('listings')
    .select('*, profiles!listings_seller_id_fkey(display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`);
  }
  
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data: listings, count } = await dbQuery;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge variant="default" className="bg-emerald-500">Active</Badge>;
      case 'sold': return <Badge variant="secondary">Sold</Badge>;
      case 'removed': return <Badge variant="destructive">Removed</Badge>;
      case 'hidden': return <Badge variant="outline" className="text-slate-500">Hidden</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Listings</h1>
          <p className="text-slate-500 mt-1">Manage platform inventory, moderate content and feature items.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>All Listings</CardTitle>
            <form className="relative max-w-sm w-full" action="/admin/listings" method="GET">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                name="q" 
                defaultValue={query}
                placeholder="Search by title..." 
                className="pl-9 bg-slate-50"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Listing</th>
                  <th className="px-6 py-4 font-medium">Seller</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings && listings.length > 0 ? (
                  listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 max-w-[300px]">
                          <div className="h-12 w-12 rounded bg-slate-200 flex-shrink-0 overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                              <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-slate-900 truncate">
                              {listing.title}
                              {listing.is_featured && <Star className="inline-block h-3 w-3 text-amber-400 ml-1 fill-amber-400" />}
                            </div>
                            <div className="text-slate-500 text-xs capitalize">{listing.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <Link href={`/admin/users/${listing.seller_id}`} className="hover:underline hover:text-emerald-600">
                          {listing.profiles?.display_name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatPrice(listing.price)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(listing.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(listing.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <form action={async () => {
                            'use server';
                            await featureListing(listing.id, listing.is_featured);
                          }}>
                            <button title={listing.is_featured ? "Unfeature" : "Feature"} className="p-2 text-amber-500 hover:bg-amber-50 rounded-md transition-colors">
                              {listing.is_featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                            </button>
                          </form>
                          {listing.status !== 'removed' && (
                            <form action={async () => {
                              'use server';
                              await removeListing(listing.id, listing.seller_id, 'Admin removed listing');
                            }}>
                              <button title="Remove" className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No listings found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

