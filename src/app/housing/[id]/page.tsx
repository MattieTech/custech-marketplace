import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatPrice, getInitials, formatDate } from '@/lib/utils';
import { MapPin, ShieldCheck, Flag, Phone, Calendar, Info, MessageCircle, ChevronLeft, Building, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ShareButton } from '@/components/marketplace/share-button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: prop } = await supabase
    .from('listings')
    .select('title, description, price, location, listing_images(url)')
    .eq('id', id)
    .maybeSingle();

  if (!prop) {
    return {
      title: 'Hostel Not Found | CUSTECH Lodges',
      description: 'The requested student accommodation could not be found.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://custechmarketplace.com';
  const pageUrl = `${siteUrl}/housing/${id}`;
  const images = (prop.listing_images || []).map((img: any) => img.url).filter(Boolean);
  const primaryImage = images[0] || `${siteUrl}/og-image.png`;
  const formattedPrice = prop.price ? `₦${formatPrice(prop.price)}/year` : 'Rent negotiable';
  const metaTitle = `${prop.title} (${formattedPrice}) | CUSTECH Lodges & Hostels`;
  const metaDescription = prop.description?.slice(0, 160) || `Check out ${prop.title} in ${prop.location || 'Osara'}. Verified student housing near CUSTECH campus.`;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: pageUrl,
      siteName: 'CUSTECH Marketplace Housing',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: prop.title,
        },
      ],
      type: 'website',
      locale: 'en_NG',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [primaryImage],
    },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch real property from Supabase
  const { data: realProperty, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      location,
      view_count,
      created_at,
      user_id,
      properties(*),
      images:listing_images(url)
    `)
    .eq('id', id)
    .eq('listing_type', 'housing')
    .maybeSingle();

  if (error || !realProperty) {
    notFound();
  }

  let seller: any = {};
  if (realProperty.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, verification_status, phone, whatsapp_number, rating_avg')
      .eq('user_id', realProperty.user_id)
      .maybeSingle();
    seller = profile || {};
  }

  const h = Array.isArray(realProperty.properties) ? realProperty.properties[0] || {} : realProperty.properties || {};
  const images = (realProperty.images || []).map((img: any) => img.url).filter(Boolean);
  const mainImage = images[0] || '';

  const propertyType = (h.property_type || 'Hostel Room').replace(/_/g, ' ');
  const rent = realProperty.price ? Number(realProperty.price) : (h.rent || 0);
  const cautionFee = h.additional_fees?.caution_fee;
  const serviceCharge = h.additional_fees?.service_charge;
  const amenities = h.amenities || ['Running Water', 'Electricity', 'Security'];

  return (
    <PageContainer>
      <div className="py-6 sm:py-8 space-y-6 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/housing" className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Hostels & Housing
          </Link>
          <ShareButton title={realProperty.title} />
        </div>

        {/* Hero Image Section */}
        <div className="space-y-3">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
            {mainImage ? (
              <img src={mainImage} alt={realProperty.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Building className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs font-semibold">Campus Accommodation Photo</span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-md capitalize">
                {propertyType}
              </span>
              {seller.verification_status === 'approved' && (
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-emerald-800 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Hosteler
                </span>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((url: string, idx: number) => (
                <div key={idx} className="relative w-24 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {realProperty.title}
              </h1>

              <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                {formatPrice(rent)} <span className="text-sm sm:text-base font-normal text-slate-400">/year</span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{realProperty.location || h.distance_from_campus || 'Osara Campus Area'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Available: {h.availability_date || 'Now'}</span>
                </div>
              </div>

              {/* Fee Breakdown if specified */}
              {(cautionFee || serviceCharge) && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {cautionFee && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Caution Fee</span>
                      <span className="text-sm font-black text-slate-800 mt-0.5 block">{formatPrice(cautionFee)}</span>
                    </div>
                  )}
                  {serviceCharge && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Service Charge</span>
                      <span className="text-sm font-black text-slate-800 mt-0.5 block">{formatPrice(serviceCharge)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-base font-bold text-slate-900">Accommodation Description</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {realProperty.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <h3 className="text-base font-bold text-slate-900">Amenities & Features</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Landlord Card & Direct Contact */}
          <div className="space-y-5">
            <Card className="rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <h3 className="font-bold text-base text-slate-900">Lister Information</h3>
                
                <div className="flex items-center gap-3.5">
                  <Avatar 
                    className="h-14 w-14 rounded-2xl border-2 border-emerald-100" 
                    src={seller.avatar_url} 
                    fallback={getInitials(seller.display_name || 'Landlord')} 
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{seller.display_name || 'Campus Lister'}</span>
                      {seller.verification_status === 'approved' && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {seller.verification_status === 'approved' ? 'Verified CUSTECH Member' : 'Campus Member'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Link href={`/messages?user=${realProperty.user_id}`} className="block w-full">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-2xl shadow-xs gap-2">
                      <MessageCircle className="h-4 w-4" /> Message Lister
                    </Button>
                  </Link>
                  {seller.whatsapp_number && (
                    <a 
                      href={`https://wa.me/234${seller.whatsapp_number.replace(/^0/, '')}?text=${encodeURIComponent(`Hello, I saw your accommodation listing "${realProperty.title}" on CUSTECH Marketplace.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full border-green-600/40 text-green-800 hover:bg-green-50 font-bold text-xs h-10 rounded-2xl gap-2">
                        <Phone className="h-4 w-4 text-green-600" /> WhatsApp Chat
                      </Button>
                    </a>
                  )}
                  <Link href={`/profile/${realProperty.user_id}`} className="block w-full">
                    <Button variant="ghost" className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-2xl">
                      View Lister Profile & Other Listings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50/80 p-4 rounded-3xl border border-amber-200/80 flex gap-3 text-amber-900 text-xs leading-relaxed">
              <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Campus Safety Advisory:</strong> Always conduct physical inspection of the lodge or hostel before making any payments. We advise meeting during daylight hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
