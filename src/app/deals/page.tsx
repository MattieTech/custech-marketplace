import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar, Percent, ArrowRight, Store, Zap, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export const metadata = {
  title: 'Discounts & Deals - CUSTECH Marketplace',
  description: 'Exclusive campus student discounts, promotions, and merchant vouchers at CUSTECH.',
};

export default async function DealsPage() {
  const supabase = await createClient();

  const { data: dbDeals } = await supabase
    .from('deals')
    .select(`
      id,
      title,
      description,
      deal_price,
      terms,
      start_date,
      end_date,
      business_id,
      businesses:business_id(id, name, location)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const campusDeals = (dbDeals && dbDeals.length > 0) ? dbDeals.map((d: any) => {
    const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      business_id: d.business_id,
      business_name: biz?.name || 'Campus Merchant',
      deal_price: d.deal_price,
      expires_at: d.end_date ? new Date(d.end_date).toLocaleDateString() : 'Ongoing',
      terms: d.terms || 'Valid with active CUSTECH student identity.'
    };
  }) : [];

  return (
    <PageContainer>
      <div className="py-8 space-y-8 max-w-5xl mx-auto px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Campus Discounts & Offers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Student Deals & Vouchers
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Exclusive student discounts on tech accessories, printing, food, and salon services across Osara campus.
            </p>
          </div>

          <Link href="/dashboard/business">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Post Deal for Business</span>
            </Button>
          </Link>
        </div>

        {campusDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campusDeals.map((deal) => (
              <Card key={deal.id} className="rounded-3xl border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-red-50 text-red-600 border-red-200 font-bold text-xs gap-1">
                        <Percent className="w-3 h-3" /> Special Deal
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {deal.expires_at}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{deal.title}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {deal.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Offered by</span>
                      <Link href={`/businesses/${deal.business_id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                        {deal.business_name}
                      </Link>
                    </div>
                    {deal.deal_price && (
                      <span className="text-base font-black text-slate-900">{formatPrice(deal.deal_price)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Zap className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Active Deals Right Now</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check back soon for seasonal student discounts, clearance sales, and exam period promotions from campus merchants!
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
