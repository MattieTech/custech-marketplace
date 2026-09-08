import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ShoppingBag, Eye, Clock, ArrowRight } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function SavedListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch saved listings joined with listing details
  const { data: savedItems, error } = await supabase
    .from('saved_listings')
    .select(`
      id,
      created_at,
      listing:listings (
        id,
        title,
        price,
        images,
        category,
        listing_type,
        status,
        views,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const validItems = (savedItems || []).filter((item: any) => item.listing !== null);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Saved Items</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Quickly access products, hostels, and services you have bookmarked across campus.
        </p>
      </div>

      {validItems.length === 0 ? (
        <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs p-12 text-center">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No bookmarked items yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click the bookmark icon on any product, hostel accommodation, or campus service to save it for later.
          </p>
          <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
            <Link href="/marketplace">Explore Marketplace</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {validItems.map((saved: any) => {
            const item = saved.listing;
            return (
              <Link key={saved.id} href={`/marketplace/${item.id}`} className="group block">
                <Card className="rounded-3xl border-slate-200/90 bg-white overflow-hidden shadow-xs group-hover:shadow-md transition-all">
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                    {item.images && item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        item.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-5">
                    <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-base font-black text-emerald-600 mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Saved {formatDate(saved.created_at)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.views || 0} views</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
