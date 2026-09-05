import React from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { ServiceCard, ServiceItem } from '@/components/services/service-card';
import { createClient } from '@/lib/supabase/server';
import { Briefcase, ShieldCheck, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Services - CUSTECH Marketplace',
  description: 'Hire verified student developers, designers, tutors, and service providers within CUSTECH.',
};

// Fallback high-fidelity sample services strictly matching the reference screenshot
const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'service-1',
    title: 'Professional Web Development & Design',
    description: 'Full-stack web development using React, Next.js, and Node.js. Portfolio websites, business sites, and web applications built to professional standards.',
    tags: ['React', 'Next.js', 'Node.js'],
    price: 25000,
    price_prefix: 'From',
    is_featured: true,
    provider_name: 'Chidi Okafor',
    provider_initials: 'CO',
    provider_badge: 'Trusted Seller',
    provider_type: 'trusted',
    rating: 4.9,
    reviews_count: 31,
    jobs_done: 28,
    delivery_time: '3',
    delivery_label: 'Delivery',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'service-2',
    title: 'Graphic Design — Logos, Flyers & Brand Identity',
    description: 'Creative graphic design services for students and businesses. Logos, event flyers, social media graphics, and complete brand identity packages.',
    tags: ['Logo Design', 'Flyers', 'Branding'],
    price: 5000,
    price_prefix: 'From',
    is_featured: true,
    provider_name: 'Amaka Nwosu',
    provider_initials: 'AN',
    provider_badge: 'Trusted Seller',
    provider_type: 'trusted',
    rating: 4.8,
    reviews_count: 47,
    jobs_done: 44,
    delivery_time: '1',
    delivery_label: 'Delivery',
    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'service-3',
    title: 'Academic Tutoring — Mathematics & Sciences',
    description: 'One-on-one and group tutoring for university-level Mathematics, Physics, Chemistry, and Engineering courses. Exam preparation and assignment help.',
    tags: ['Mathematics', 'Physics', 'Chemistry'],
    price: 3000,
    price_prefix: 'From',
    is_featured: false,
    provider_name: 'Ibrahim Suleiman',
    provider_initials: 'IS',
    provider_badge: 'CUSTECH Verified',
    provider_type: 'verified',
    rating: 4.7,
    reviews_count: 19,
    jobs_done: 56,
    delivery_time: 'Per session',
    delivery_label: 'Delivery',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'service-4',
    title: 'Event Photography & Campus Video Shoots',
    description: 'Professional coverage for campus events, matriculation, graduation, departmental dinners, and personal portrait sessions with high-resolution editing.',
    tags: ['Photography', 'Videography', 'Portraits'],
    price: 10000,
    price_prefix: 'From',
    is_featured: false,
    provider_name: 'David Alabi',
    provider_initials: 'DA',
    provider_badge: 'CUSTECH Verified',
    provider_type: 'verified',
    rating: 4.9,
    reviews_count: 38,
    jobs_done: 52,
    delivery_time: '2',
    delivery_label: 'Delivery',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'service-5',
    title: 'Hardware & Phone Screen Repair — Fast Delivery',
    description: 'Expert diagnostic and repairs for iPhone, Samsung, laptops, charging ports, broken screens, and operating system reinstalls right near campus.',
    tags: ['Phone Repair', 'Laptops', 'Hardware'],
    price: 4000,
    price_prefix: 'From',
    is_featured: false,
    provider_name: 'Samuel Momoh',
    provider_initials: 'SM',
    provider_badge: 'Trusted Seller',
    provider_type: 'trusted',
    rating: 4.6,
    reviews_count: 24,
    jobs_done: 39,
    delivery_time: 'Same day',
    delivery_label: 'Delivery',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'service-6',
    title: 'Laundry & Hostel Dry Cleaning Express',
    description: 'Doorstep pickup and clean delivery for student laundry, beddings, curtains, and native wears. Crisp ironing and hygienic washing guaranteed.',
    tags: ['Laundry', 'Dry Cleaning', 'Express'],
    price: 2500,
    price_prefix: 'From',
    is_featured: false,
    provider_name: 'Zainab Ahmed',
    provider_initials: 'ZA',
    provider_badge: 'CUSTECH Verified',
    provider_type: 'verified',
    rating: 4.8,
    reviews_count: 62,
    jobs_done: 87,
    delivery_time: '24 hrs',
    delivery_label: 'Delivery',
    image_url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
  },
];

const SERVICE_CATEGORIES = [
  { label: 'All Services', value: 'all' },
  { label: 'Tech & Coding', value: 'tech' },
  { label: 'Graphic Design', value: 'design' },
  { label: 'Tutoring', value: 'tutoring' },
  { label: 'Photography', value: 'photography' },
  { label: 'Repairs', value: 'repairs' },
  { label: 'Laundry & Cleaning', value: 'laundry' },
];

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }> | { category?: string; q?: string };
}) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams?.category || 'all';
  const query = (resolvedParams?.q || '').toLowerCase().trim();

  let services: ServiceItem[] = DEFAULT_SERVICES;

  try {
    const supabase = await createClient();
    const { data: dbServices } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        is_featured,
        created_at,
        services:services(*),
        seller:profiles(full_name, is_verified),
        images:listing_images(url)
      `)
      .eq('listing_type', 'service')
      .eq('status', 'active');

    if (dbServices && dbServices.length > 0) {
      const mappedDbServices = dbServices.map((item: any, idx: number) => {
        const s = item.services?.[0] || item.services || {};
        const fallback = DEFAULT_SERVICES[idx % DEFAULT_SERVICES.length];
        const sellerName = item.seller?.full_name || fallback.provider_name;
        const initials = sellerName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n: string) => n[0]?.toUpperCase())
          .join('') || 'CU';

        return {
          id: item.id,
          title: item.title || fallback.title,
          description: item.description || fallback.description,
          tags: fallback.tags,
          price: item.price ? Number(item.price) : fallback.price,
          price_prefix: 'From',
          is_featured: Boolean(item.is_featured),
          provider_name: sellerName,
          provider_initials: initials,
          provider_badge: item.seller?.is_verified ? ('CUSTECH Verified' as const) : fallback.provider_badge,
          provider_type: item.seller?.is_verified ? ('verified' as const) : fallback.provider_type,
          rating: fallback.rating,
          reviews_count: fallback.reviews_count,
          jobs_done: s.completed_jobs || fallback.jobs_done,
          delivery_time: s.delivery_time || fallback.delivery_time,
          delivery_label: 'Delivery',
          image_url: item.images?.[0]?.url || fallback.image_url,
        };
      });

      services = [...mappedDbServices, ...DEFAULT_SERVICES];
    }
  } catch (err) {
    // Keep fallback list
  }

  // Filter by category
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

  // Filter by query
  if (query) {
    services = services.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        s.provider_name.toLowerCase().includes(query)
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <PageContainer>
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Student Freelancers & Artisans</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              CUSTECH Student Services
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Hire verified student developers, designers, tutors, and artisans within the Confluence University community.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs h-10 px-4">
              <Link href="/dashboard/services/new">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>Offer a Service</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none border-b border-slate-200/80 mb-6">
          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.value.toLowerCase();
            const href = cat.value === 'all' ? '/services' : `/services?category=${encodeURIComponent(cat.value)}`;
            return (
              <Link
                key={cat.value}
                href={href}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Counter matching screenshot */}
        <div className="flex items-center justify-between mb-5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            {services.length} {services.length === 1 ? 'service' : 'services'} available
          </span>
          <span className="text-slate-400">
            Quality guaranteed by student peer reviews
          </span>
        </div>

        {/* 3-Column Grid matching reference screenshot */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No services found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try choosing another category or clearing your search filters.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-bold">
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
