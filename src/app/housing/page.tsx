import React from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { HousingCard, HousingProperty } from '@/components/housing/housing-card';
import { createClient } from '@/lib/supabase/server';
import { Search, Home, ShieldCheck, MapPin, SlidersHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Hostels & Housing - CUSTECH Marketplace',
  description: 'Verified student lodges, apartments, and shared rooms near CUSTECH campus.',
};

export default async function HousingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; location?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeType = resolvedParams?.type || 'all';
  const query = (resolvedParams?.q || '').toLowerCase().trim();

  let properties: HousingProperty[] = [];

  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from('listings')
      .select(`
        id,
        user_id,
        title,
        description,
        price,
        location,
        is_featured,
        view_count,
        created_at,
        properties(*),
        images:listing_images(url)
      `)
      .eq('listing_type', 'housing')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
    }

    const { data: dbProps, error } = await dbQuery;

    if (error) {
      console.error('Error fetching housing listings:', error);
    }

    if (dbProps && dbProps.length > 0) {
      const userIds = [...new Set(dbProps.map((l: any) => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, verification_status, avatar_url, rating_avg, rating_count')
        .in('user_id', userIds);

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});

      properties = dbProps.map((item: any) => {
        const h = Array.isArray(item.properties) ? item.properties[0] || {} : item.properties || {};
        const sellerProfile = profileMap[item.user_id] || {};
        const sellerName = sellerProfile.display_name || 'Campus Student / Hosteler';
        const initials = sellerName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n: string) => n[0]?.toUpperCase())
          .join('') || 'CU';

        const rent = item.price ? Number(item.price) : (h.rent || 0);
        const cautionFee = h.additional_fees?.caution_fee || Math.round(rent * 0.2);
        const serviceCharge = h.additional_fees?.service_charge || 10000;

        return {
          id: item.id,
          title: item.title,
          property_type: (h.property_type || 'Hostel Room').replace(/_/g, ' '),
          is_featured: Boolean(item.is_featured),
          rent,
          rent_period: '/yr',
          caution_fee: cautionFee,
          service_charge: serviceCharge,
          total_move_in: rent + cautionFee + serviceCharge,
          location: item.location || 'Osara / CUSTECH Campus Area',
          proximity: h.distance_from_campus || 'Near Campus',
          beds: h.rooms || 1,
          baths: h.rooms || 1,
          views: item.view_count || 0,
          amenities: h.amenities || ['Running Water', 'Electricity', 'Security'],
          landlord_name: sellerName,
          landlord_role: sellerProfile.verification_status === 'approved' ? 'Verified Member' : 'Campus Member',
          landlord_initials: initials,
          landlord_rating: Number(sellerProfile.rating_avg || 5.0),
          landlord_reviews_count: sellerProfile.rating_count || 0,
          available_from: h.availability_date || 'Available Now',
          image_url: item.images?.[0]?.url || '',
        };
      });
    }
  } catch (err) {
    console.error('Failed to load housing properties from Supabase:', err);
    properties = [];
  }

  // Filter by property type if requested
  if (activeType && activeType !== 'all') {
    properties = properties.filter((p) =>
      p.property_type.toLowerCase().replace(/\s+/g, '_') === activeType.toLowerCase().replace(/\s+/g, '_')
    );
  }

  const propertyTypes = [
    { label: 'All Lodges & Hostels', value: 'all' },
    { label: 'Self-Contained', value: 'self_contained' },
    { label: 'Single Room', value: 'single_room' },
    { label: 'One-Bedroom', value: 'one_bedroom' },
    { label: 'Hostel Bedspace', value: 'hostel' },
    { label: 'Shared Apartment', value: 'shared_apartment' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <PageContainer>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Campus Accommodation</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Hostels & Student Housing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Browse verified lodges, self-contained rooms, and bedspaces across Osara and Confluence University.
            </p>
          </div>

          <Link href="/dashboard/properties/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl gap-2 shadow-md">
              <PlusCircle className="w-4 h-4" />
              <span>List Hostel or Room</span>
            </Button>
          </Link>
        </div>

        {/* Search and Filters Strip */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-3 sm:p-4 mb-8 shadow-xs space-y-3">
          <form method="GET" action="/housing" className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={resolvedParams?.q || ''}
                placeholder="Search by lodge name, location (e.g. Osara, Gate, Village)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all shadow-xs shrink-0"
            >
              Search
            </button>
          </form>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
            {propertyTypes.map((type) => {
              const isSelected = activeType === type.value;
              return (
                <Link
                  key={type.value}
                  href={`/housing?type=${type.value}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Listings Display Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {properties.map((property) => (
              <HousingCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Home className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Accommodation Listed Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {query || activeType !== 'all'
                  ? 'No housing matched your search criteria. Try removing filters or searching a different keyword.'
                  : 'Be the first verified student, agent, or landlord to list accommodation near CUSTECH campus!'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/dashboard/properties/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs">
                  <PlusCircle className="w-4 h-4 mr-1.5" /> List Room or Hostel
                </Button>
              </Link>
              {(query || activeType !== 'all') && (
                <Link href="/housing">
                  <Button variant="outline" className="text-xs font-semibold rounded-xl">
                    Clear Filters
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
