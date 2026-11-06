import React from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { RoommateCard } from '@/components/housing/roommate-card';
import { getRoommatePosts } from './actions';
import { createClient } from '@/lib/supabase/server';
import { 
  Users, 
  Home, 
  PlusCircle, 
  ShieldCheck, 
  Filter, 
  Search, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Find a Roommate - CUSTECH Marketplace',
  description: 'Pair with verified CUSTECH students to share and split hostel rent accommodation.',
};

export default async function RoommatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; gender?: string; location?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeStatus = resolvedParams?.status || 'all';
  const activeGender = resolvedParams?.gender || 'all';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const res = await getRoommatePosts({
    hasAccommodation: activeStatus,
    preferredGender: activeGender,
    location: resolvedParams?.location,
  });

  const posts = res.data || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <PageContainer>
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/housing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Housing & Hostels</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Campus Roommate & Rent Split Finder</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Find a Roommate & Split Rent
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Connect with fellow CUSTECH students whether you already have a lodge or are looking to secure one together.
            </p>
          </div>

          <Link href="/housing/roommates/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl gap-2 shadow-md">
              <PlusCircle className="w-4 h-4" />
              <span>Post Roommate Request</span>
            </Button>
          </Link>
        </div>

        {/* Filter Strip */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-3 sm:p-4 mb-8 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Accommodation:
            </span>
            <Link
              href="/housing/roommates?status=all"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Students
            </Link>
            <Link
              href="/housing/roommates?status=secured"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeStatus === 'secured'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Has Lodge (Needs Co-Tenant)
            </Link>
            <Link
              href="/housing/roommates?status=seeking"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeStatus === 'seeking'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              Looking to Hunt Together
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Gender:
            </span>
            {['all', 'male', 'female'].map((g) => (
              <Link
                key={g}
                href={`/housing/roommates?status=${activeStatus}&gender=${g}`}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize font-semibold transition-colors ${
                  activeGender === g
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g}
              </Link>
            ))}
          </div>
        </div>

        {/* Roommates Grid */}
        {posts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-xs max-w-lg mx-auto">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800">No Roommate Postings Found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Be the first to post a request! Whether you already rented a room and want to cut costs or need a partner to look with.
            </p>
            <Link href="/housing/roommates/new" className="inline-block mt-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">
                Post First Roommate Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <RoommateCard key={post.id} post={post} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
