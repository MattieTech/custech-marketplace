import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar, Sparkles, Percent, ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';

export default async function DealsPage() {
  const supabase = await createClient();

  const { data: dbDeals } = await supabase
    .from('deals')
    .select(`
      id,
      title,
      description,
      original_price,
      deal_price,
      discount_percentage,
      starts_at,
      expires_at,
      businesses:business_id(id, name, address)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const campusDeals = (dbDeals && dbDeals.length > 0) ? dbDeals.map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    business_id: d.businesses?.id || '1',
    business_name: d.businesses?.name || 'Campus Merchant',
    discount: d.discount_percentage ? `${d.discount_percentage}% OFF` : 'Special Deal',
    deal_price: d.deal_price,
    expires_at: d.expires_at ? new Date(d.expires_at).toLocaleDateString() : 'Ongoing',
    terms: 'Valid with active CUSTECH student identity.'
  })) : [
    {
      id: '1',
      title: '50% off all Project Spiral Binding',
      description: 'Get your final year projects, manuals, and seminar papers bound at half price this semester.',
      business_id: '1',
      business_name: 'CUSTECH Print Hub',
      discount: '50% OFF',
      deal_price: 500,
      expires_at: 'Ongoing',
      terms: 'Valid for registered students with student ID.'
    },
    {
      id: '2',
      title: 'Buy 2 Phone Accessories, Get 1 Free',
      description: 'Screen protectors, charging cables, and OTG adapters bundle for Osara campus students.',
      business_id: '1',
      business_name: 'Osara Tech Gadgets',
      discount: 'Buy 2 Get 1',
      deal_price: 1500,
      expires_at: 'Exam Period',
      terms: 'Available while promotional stock lasts.'
    },
    {
      id: '3',
      title: '20% Student Meal Voucher',
      description: 'Enjoy 20% discount on all lunch packs and smoothies near the Student Union Building.',
      business_id: '1',
      business_name: 'Campus Kitchen & Grills',
      discount: '20% OFF',
      deal_price: 1200,
      expires_at: 'This Week',
      terms: 'Show voucher on phone at checkout counter.'
    }
  ];

  return (
    <PageContainer>
      <div className="py-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Discounts & Vouchers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Exclusive Student Deals
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Verified student promotions, food discounts, print vouchers, and device bargains across CUSTECH campus.
          </p>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campusDeals.map((deal) => (
            <Card 
              key={deal.id} 
              className="rounded-3xl border-white/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <CardHeader className="p-5 pb-3 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      {deal.business_name}
                    </span>
                    <Badge className="bg-rose-600 text-white text-[10px] font-black rounded-lg">
                      {deal.discount}
                    </Badge>
                  </div>
                  <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 pt-2 leading-tight">
                    {deal.title}
                  </h3>
                </CardHeader>

                <CardContent className="p-5 space-y-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {deal.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Validity: <strong>{deal.expires_at}</strong></span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">T&C:</span> {deal.terms}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-5 pt-0">
                <Button asChild className="w-full h-10 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs">
                  <Link href={`/businesses/${deal.business_id}`}>
                    <span>Claim & View Business</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
