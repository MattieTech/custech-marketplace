import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShieldCheck, Mail, Phone, Globe, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ShareButton } from '@/components/marketplace/share-button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: biz } = await supabase.from('businesses').select('name, description').eq('id', id).maybeSingle();
  return {
    title: biz ? `${biz.name} - CUSTECH Campus Business` : 'Business Not Found',
    description: biz?.description?.slice(0, 160),
  };
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: biz, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !biz) {
    notFound();
  }

  const services = Array.isArray(biz.services) ? biz.services : [];

  return (
    <PageContainer>
      <div className="py-6 sm:py-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/businesses" className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Businesses
          </Link>
          <ShareButton title={biz.name} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{biz.name}</h1>
                {biz.is_verified && <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />}
              </div>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{biz.location || 'Osara Campus Area'}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h3 className="text-base font-bold text-slate-900">About the Enterprise</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{biz.description}</p>
              </div>

              {services.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <h3 className="text-base font-bold text-slate-900">Services Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs py-1 px-3 bg-slate-100 text-slate-700 rounded-xl">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-base text-slate-900">Contact Information</h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  {biz.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{biz.contact_phone}</span>
                    </div>
                  )}
                  {biz.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{biz.contact_email}</span>
                    </div>
                  )}
                  {biz.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                      <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline truncate">
                        {biz.website}
                      </a>
                    </div>
                  )}
                </div>

                {biz.contact_phone && (
                  <div className="pt-2">
                    <a href={`tel:${biz.contact_phone}`} className="block w-full">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-2xl shadow-xs gap-2">
                        <Phone className="h-4 w-4" /> Call Business
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
