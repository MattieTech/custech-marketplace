import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, MessageSquare, ShieldCheck, ShoppingBag, Eye, Package, ArrowRight, Clock } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const [
    profileRes,
    listingsRes,
    escrowOrdersRes,
    recentListingsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('listings').select('id, view_count, status').or(`user_id.eq.${user.id},seller_id.eq.${user.id}`),
    supabase.from('escrow_orders').select('id, status').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
    supabase.from('listings').select('id, title, price, listing_images(url), created_at, status').or(`user_id.eq.${user.id},seller_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(4)
  ]);

  const profile = profileRes.data;
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Student'
  const isVerified = profile?.verification_status === 'approved' || profile?.is_verified || false

  const activeListingsCount = listingsRes.data?.filter(l => l.status === 'active').length || 0;
  const totalViewsCount = listingsRes.data?.reduce((acc, l) => acc + (l.view_count || (l as any).views || 0), 0) || 0;
  const completedOrdersCount = escrowOrdersRes.data?.filter(o => o.status === 'completed').length || 0;
  const activeOrdersCount = escrowOrdersRes.data?.filter(o => ['funded', 'in_transit', 'delivered'].includes(o.status)).length || 0;

  const stats = [
    { name: 'Active Listings', stat: activeListingsCount.toString() },
    { name: 'Total Listing Views', stat: totalViewsCount.toLocaleString() },
    { name: 'Escrow Orders In-Flight', stat: activeOrdersCount.toString() },
    { name: 'Completed Transactions', stat: completedOrdersCount.toString() },
  ]

  const recentListings = recentListingsRes.data || [];

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, {displayName}!</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Here is the real-time summary of your marketplace activity.</p>
      </div>

      <div>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.name} className="overflow-hidden shadow-xs border-slate-200/90 rounded-2xl bg-white">
              <CardContent className="p-4 sm:p-5">
                <dt className="truncate text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.name}</dt>
                <dd className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{item.stat}</dd>
              </CardContent>
            </Card>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-dashed border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-2xl bg-white transition-all shadow-2xs">
            <Link href="/dashboard/listings/new">
              <PlusCircle className="h-6 w-6 text-emerald-600" />
              <span className="font-bold text-xs">Create Listing</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-slate-200 hover:border-emerald-300 rounded-2xl bg-white transition-all shadow-2xs">
            <Link href="/dashboard/orders">
              <Package className="h-6 w-6 text-slate-400" />
              <span className="font-bold text-xs">Orders & Escrow</span>
            </Link>
          </Button>
          
          {!isVerified && (
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-slate-200 hover:border-emerald-300 rounded-2xl bg-white transition-all shadow-2xs">
              <Link href="/dashboard/verification">
                <ShieldCheck className="h-6 w-6 text-amber-500" />
                <span className="font-bold text-xs">Get Verified</span>
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-slate-200 hover:border-emerald-300 rounded-2xl bg-white transition-all shadow-2xs">
            <Link href="/marketplace">
              <ShoppingBag className="h-6 w-6 text-slate-400" />
              <span className="font-bold text-xs">Browse Campus Market</span>
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Recent Listings</h2>
          {recentListings.length > 0 && (
            <Link href="/dashboard/listings" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentListings.length === 0 ? (
          <Card className="shadow-xs border-slate-200 rounded-2xl bg-white">
            <CardContent className="p-8 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No listings posted yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ready to sell textbooks, electronics, or dorm essentials to fellow CUSTECH students?
              </p>
              <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                <Link href="/dashboard/listings/new">Post Your First Item</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentListings.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`} className="group block">
                <Card className="overflow-hidden border-slate-200/90 rounded-2xl bg-white shadow-2xs group-hover:shadow-md transition-all">
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                    {item.listing_images?.[0]?.url ? (
                      <img src={item.listing_images[0].url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${item.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm font-black text-emerald-600 mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.created_at)}</span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
