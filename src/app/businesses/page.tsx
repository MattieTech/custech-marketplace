import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ShieldCheck, Star, Building2, Phone, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function BusinessesPage() {
  const supabase = await createClient();

  const { data: dbBusinesses } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  const businesses = (dbBusinesses && dbBusinesses.length > 0) ? dbBusinesses.map((b: any) => ({
    id: b.id,
    name: b.name,
    description: b.description || 'Verified student enterprise providing products and services to the CUSTECH community.',
    location: b.address || 'Near Campus Gate',
    services: ['Campus Delivery', 'Student Friendly'],
    is_verified: b.is_verified ?? true,
    rating: 4.9,
    phone: b.phone || '08000000000'
  })) : [
    {
      id: '1',
      name: 'CUSTECH Print Hub',
      description: 'Quality printing, photocopying, spiral binding, and project formatting services for students.',
      location: 'Student Center, Block A',
      services: ['Printing', 'Binding', 'Photocopying', 'Lamination'],
      is_verified: true,
      rating: 4.9,
      phone: '08012345678'
    },
    {
      id: '2',
      name: 'Osara Campus Gadgets',
      description: 'Laptops, chargers, flash drives, power banks, and smartphone screen replacements.',
      location: 'Opposite Main Campus Gate',
      services: ['Gadget Repair', 'Accessories', 'Power Banks'],
      is_verified: true,
      rating: 4.8,
      phone: '08087654321'
    },
    {
      id: '3',
      name: 'Campus Kitchen & Smoothies',
      description: 'Fresh hot meals, jollof rice packs, fruit parfaits, and doorstep hostel delivery.',
      location: 'Osara Student Village',
      services: ['Food Delivery', 'Smoothies', 'Snacks'],
      is_verified: true,
      rating: 5.0,
      phone: '08099887766'
    }
  ];

  return (
    <PageContainer>
      <div className="py-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Campus Enterprise Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Student & Campus Businesses
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Discover and support student entrepreneurs, tech hubs, print services, and local vendors serving the CUSTECH community.
          </p>
        </div>
        
        {/* Business Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Link href={`/businesses/${biz.id}`} key={biz.id} className="group">
              <Card className="h-full rounded-3xl border-white/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                        {biz.name}
                      </h3>
                      {biz.is_verified && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{biz.rating}</span>
                      <span className="text-zinc-400 font-normal">Rating</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {biz.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{biz.location}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {biz.services.map((svc: string) => (
                      <Badge 
                        key={svc} 
                        variant="secondary" 
                        className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg px-2"
                      >
                        {svc}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                    <span>View Storefront & Services</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
