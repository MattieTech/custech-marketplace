import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Bookmark, 
  ShoppingBag, 
  TrendingUp, 
  ShieldCheck,
  Briefcase,
  Layers
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export const metadata = {
  title: 'Analytics | CUSTECH Marketplace',
  description: 'View performance metrics for your listings, services, and community interactions.',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user's listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price, listing_type, status, views, created_at')
    .eq('seller_id', user.id);

  // Fetch user's services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id);

  // Fetch saved count for user's listings
  const listingIds = listings?.map((l: any) => l.id) || [];
  let totalSaves = 0;
  if (listingIds.length > 0) {
    const { count } = await supabase
      .from('saved_listings')
      .select('*', { count: 'exact', head: true })
      .in('listing_id', listingIds);
    totalSaves = count || 0;
  }

  // Calculate metrics
  const productListings = listings?.filter((l: any) => l.listing_type === 'product') || [];
  const activeListingsCount = listings?.filter((l: any) => l.status === 'active').length || 0;
  const soldListingsCount = listings?.filter((l: any) => l.status === 'sold').length || 0;
  const totalViews = listings?.reduce((sum: number, l: any) => sum + (l.views || 0), 0) || 0;

  // Conversion rate (rough estimate: sold / active + sold)
  const totalFinished = activeListingsCount + soldListingsCount;
  const conversionRate = totalFinished > 0 ? ((soldListingsCount / totalFinished) * 100).toFixed(1) : '0.0';

  return (
    <PageContainer>
      <div className="py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track views, interest, and engagement across your CUSTECH Marketplace activities.
          </p>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Views</CardTitle>
              <Eye className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
              <p className="text-xs text-gray-500 mt-1">Lifetime views on your listings</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Saves</CardTitle>
              <Bookmark className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalSaves}</div>
              <p className="text-xs text-gray-500 mt-1">Students saved your items</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Listings</CardTitle>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{activeListingsCount}</div>
              <p className="text-xs text-gray-500 mt-1">{soldListingsCount} items marked sold</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Sales Conversion</CardTitle>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{conversionRate}%</div>
              <p className="text-xs text-gray-500 mt-1">Completed vs total posted</p>
            </CardContent>
          </Card>
        </div>

        {/* Section: Category Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-green-600" /> Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active Products:</span>
                <span className="font-semibold text-gray-900">{productListings.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items Sold:</span>
                <span className="font-semibold text-gray-900">{soldListingsCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Offered Services:</span>
                <span className="font-semibold text-gray-900">{services?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed Jobs:</span>
                <span className="font-semibold text-gray-900">
                  {services?.reduce((sum: number, s: any) => sum + (s.completed_jobs || 0), 0) || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-700" /> Trust Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trust Level:</span>
                <span className="font-semibold text-green-700 capitalize">
                  {profile?.trust_level?.replace('_', ' ') || 'Registered'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Verification:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {profile?.verification_status || 'Unverified'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Performance Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {listings && listings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Listing</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listings.slice(0, 5).map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                        <td className="px-4 py-3 capitalize text-gray-600">{item.listing_type}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-gray-600">{item.views || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No listings created yet. Create a listing to view analytics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
