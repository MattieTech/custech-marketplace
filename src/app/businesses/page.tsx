import { createClient } from '@/lib/supabase/server';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ShieldCheck, Star, Building2, ArrowRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Campus Businesses - CUSTECH Marketplace',
  description: 'Directory of verified student-run businesses, vendors, and services at CUSTECH.',
};

export default async function BusinessesPage() {
  const supabase = await createClient();

  const { data: dbBusinesses } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  const businesses = (dbBusinesses && dbBusinesses.length > 0) ? dbBusinesses.map((b: any) => ({
    id: b.id,
    name: b.name,
    description: b.description || 'Student enterprise providing products and services to the CUSTECH community.',
    location: b.location || 'Near Campus Gate',
    services: Array.isArray(b.services) ? b.services : ['Campus Delivery', 'Student Friendly'],
    is_verified: b.is_verified ?? false,
    rating: 5.0,
    phone: b.contact_phone || ''
  })) : [];

  return (
    <PageContainer>
      <div className="py-8 space-y-8 max-w-6xl mx-auto px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus Enterprise Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Student & Campus Businesses
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Discover and support student entrepreneurs, tech hubs, print services, and local vendors serving the CUSTECH community.
            </p>
          </div>

          <Link href="/dashboard/business">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Register Business</span>
            </Button>
          </Link>
        </div>
        
        {/* Business Grid or Clean Empty State */}
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <Link href={`/businesses/${biz.id}`} key={biz.id} className="group">
                <Card className="h-full rounded-3xl border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h3 className="font-black text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {biz.name}
                        </h3>
                        {biz.is_verified && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{biz.rating}</span>
                        <span className="text-slate-400 font-normal">Rating</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {biz.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.location}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {biz.services.map((svc: string) => (
                        <Badge 
                          key={svc} 
                          variant="secondary" 
                          className="text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-lg px-2"
                        >
                          {svc}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                      <span>View Storefront & Services</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Student Businesses Listed Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Run a student brand, printing center, hair salon, tech hub, or food delivery on campus? Register your business storefront today!
              </p>
            </div>
            <div className="pt-2">
              <Link href="/dashboard/business">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs">
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Register Your Campus Business
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
