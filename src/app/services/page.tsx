import React from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { ServiceCard, ServiceItem } from '@/components/services/service-card';
import { createClient } from '@/lib/supabase/server';
import { Search, Briefcase, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Student Services - CUSTECH Marketplace',
  description: 'Verified freelance services offered by talented students at Confluence University.',
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams?.category || 'all';
  const query = (resolvedParams?.q || '').toLowerCase().trim();

  let services: ServiceItem[] = [];

  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        is_featured,
        created_at,
        category:categories(name, slug),
        services(*),
        seller:profiles!user_id(display_name, verification_status, avatar_url, rating_avg, rating_count),
        images:listing_images(url)
      `)
      .eq('listing_type', 'service')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data: dbServices, error } = await dbQuery;

    if (error) {
      console.error('Error fetching services:', error);
    }

    if (dbServices && dbServices.length > 0) {
      services = dbServices.map((item: any) => {
        const s = Array.isArray(item.services) ? item.services[0] || {} : item.services || {};
        const sellerProfile = Array.isArray(item.seller) ? item.seller[0] || {} : item.seller || {};
        const categoryName = item.category?.name || 'Freelance';
        const sellerName = sellerProfile.display_name || 'Campus Student';
        const initials = sellerName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n: string) => n[0]?.toUpperCase())
          .join('') || 'CU';

        const isVerified = sellerProfile.verification_status === 'approved';

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          tags: [categoryName, isVerified ? 'Verified Student' : 'Campus Service'],
          price: item.price ? Number(item.price) : (s.starting_price || 0),
          price_prefix: 'From',
          is_featured: Boolean(item.is_featured),
          provider_name: sellerName,
          provider_initials: initials,
          provider_badge: isVerified ? ('CUSTECH Verified' as const) : ('Trusted Seller' as const),
          provider_type: isVerified ? ('verified' as const) : ('trusted' as const),
          rating: Number(sellerProfile.rating_avg || 5.0),
          reviews_count: sellerProfile.rating_count || 0,
          jobs_done: s.completed_jobs || 0,
          delivery_time: s.delivery_time || '1-3 days',
          delivery_label: 'Delivery',
          image_url: item.images?.[0]?.url || '',
        };
      });
    }
  } catch (err) {
    console.error('Failed to load services:', err);
    services = [];
  }

  // Filter by category if specified
  if (activeCategory && activeCategory !== 'all') {
    services = services.filter((s) => {
      const cat = activeCategory.toLowerCase();
      return (
        s.title.toLowerCase().includes(cat) ||
        s.tags.some((tag) => tag.toLowerCase().includes(cat)) ||
        s.description.toLowerCase().includes(cat)
      );
    });
  }

  const serviceCategories = [
    { label: 'All Services', value: 'all' },
    { label: 'Graphic Design', value: 'graphic' },
    { label: 'Web & Tech', value: 'web' },
    { label: 'Repairs', value: 'repair' },
    { label: 'Hair & Beauty', value: 'hair' },
    { label: 'Tutoring', value: 'tutoring' },
    { label: 'Printing & Binding', value: 'printing' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <PageContainer>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Freelance Directory</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Student Skills & Services
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Hire verified CUSTECH students for tech repairs, graphic design, tutoring, laundry, and styling.
            </p>
          </div>

          <Link href="/dashboard/services/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl gap-2 shadow-md">
              <PlusCircle className="w-4 h-4" />
              <span>Offer a Service</span>
            </Button>
          </Link>
        </div>

        {/* Search and Category Filter Strip */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-3 sm:p-4 mb-8 shadow-xs space-y-3">
          <form method="GET" action="/services" className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={resolvedParams?.q || ''}
                placeholder="Search services (e.g. typing, laptop repair, haircut, logo)..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
            {serviceCategories.map((category) => {
              const isSelected = activeCategory === category.value;
              return (
                <Link
                  key={category.value}
                  href={`/services?category=${category.value}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {category.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Services Grid or Clean Empty State */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Services Listed Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {query || activeCategory !== 'all'
                  ? 'No campus student services matched your search. Try a different keyword or category.'
                  : 'Be the first verified student to post your skills and earn income on campus!'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/dashboard/services/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs">
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Post Your Service
                </Button>
              </Link>
              {(query || activeCategory !== 'all') && (
                <Link href="/services">
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
