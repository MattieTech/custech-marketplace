import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatPrice, getInitials, formatDate } from '@/lib/utils';
import { Star, Clock, CheckCircle2, Flag, MessageSquare, ChevronLeft, ShieldCheck, Phone, Briefcase } from 'lucide-react';
import { ShareButton } from '@/components/marketplace/share-button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase.from('listings').select('title, description').eq('id', id).maybeSingle();
  return {
    title: item ? `${item.title} - CUSTECH Student Services` : 'Service Not Found',
    description: item?.description?.slice(0, 160),
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch real service listing from Supabase
  const { data: realListing, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      created_at,
      user_id,
      services(*),
      images:listing_images(url),
      seller:profiles!user_id(user_id, display_name, avatar_url, verification_status, created_at, rating_avg, rating_count, phone, whatsapp_number)
    `)
    .eq('id', id)
    .eq('listing_type', 'service')
    .maybeSingle();

  if (error || !realListing) {
    notFound();
  }

  const s = Array.isArray(realListing.services) ? realListing.services[0] || {} : realListing.services || {};
  const seller = Array.isArray(realListing.seller) ? realListing.seller[0] || {} : realListing.seller || {};
  const images = (realListing.images || []).map((img: any) => img.url).filter(Boolean);
  const mainImage = images[0] || '';

  const startingPrice = realListing.price ? Number(realListing.price) : (s.starting_price || 0);
  const deliveryTime = s.delivery_time || '1-3 business days';
  const isVerified = seller.verification_status === 'approved';

  return (
    <PageContainer>
      <div className="py-6 sm:py-8 space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumbs & Share */}
        <div className="flex items-center justify-between">
          <Link href="/services" className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Student Services
          </Link>
          <ShareButton title={realListing.title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  Campus Service
                </span>
                {isVerified && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" /> CUSTECH Verified
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {realListing.title}
              </h1>

              <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                {formatPrice(startingPrice)} <span className="text-xs sm:text-sm font-normal text-slate-400">starting price</span>
              </div>

              {mainImage && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-4">
                  <img src={mainImage} alt={realListing.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-base font-bold text-slate-900">Service Description</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {realListing.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Typical Delivery</span>
                    <span className="text-xs font-bold text-slate-800">{deliveryTime}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Jobs Completed</span>
                    <span className="text-xs font-bold text-slate-800">{s.completed_jobs || 0} completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Provider Card */}
          <div className="space-y-5">
            <Card className="rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <h3 className="font-bold text-base text-slate-900">About Provider</h3>
                <div className="flex items-center gap-3.5">
                  <Avatar 
                    className="h-14 w-14 rounded-2xl border-2 border-emerald-100" 
                    src={seller.avatar_url} 
                    fallback={getInitials(seller.display_name || 'Student')} 
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{seller.display_name || 'Student Provider'}</span>
                      {isVerified && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{Number(seller.rating_avg || 5.0).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({seller.rating_count || 0} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Link href={`/messages?user=${realListing.user_id}`} className="block w-full">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-2xl shadow-xs gap-2">
                      <MessageSquare className="h-4 w-4" /> Message & Hire Provider
                    </Button>
                  </Link>

                  {seller.whatsapp_number && (
                    <a 
                      href={`https://wa.me/234${seller.whatsapp_number.replace(/^0/, '')}?text=${encodeURIComponent(`Hello, I saw your service "${realListing.title}" on CUSTECH Marketplace.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full border-green-600/40 text-green-800 hover:bg-green-50 font-bold text-xs h-10 rounded-2xl gap-2">
                        <Phone className="h-4 w-4 text-green-600" /> WhatsApp Chat
                      </Button>
                    </a>
                  )}

                  <Link href={`/profile/${realListing.user_id}`} className="block w-full">
                    <Button variant="ghost" className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-2xl">
                      View Provider Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">Campus Escrow & Safety:</span>
              For custom student projects, always agree on deliverables and milestones before payment.
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
