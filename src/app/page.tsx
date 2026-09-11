import Link from 'next/link';
import Image from 'next/image';
import { 
  Smartphone, Laptop, Zap, Shirt, BookOpen, 
  House, Gift, Wrench, UtensilsCrossed, Palette, Headphones,
  UserPlus, ShoppingBag, ShieldCheck, Star, Scale, Flag, Search,
  CheckCircle2, GraduationCap, Users, ArrowRight, Sparkles
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { HeroDealsShowcase } from '@/components/home/hero-deals-showcase';
import { QuickPromoStrip } from '@/components/home/quick-promo-strip';
import { RecentListingsLiquid } from '@/components/home/recent-listings-liquid';
import { FeaturedListings } from '@/components/marketplace/featured-listings';
import { cn } from '@/lib/utils';

export default function Home() {
  const categories = [
    { name: 'Phones', icon: Smartphone, href: '/marketplace?category=phones', iconColor: 'text-blue-600', bgColor: 'bg-blue-50/80 group-hover:bg-blue-100', subtitle: 'Phones & Tech' },
    { name: 'Laptops', icon: Laptop, href: '/marketplace?category=laptops', iconColor: 'text-purple-600', bgColor: 'bg-purple-50/80 group-hover:bg-purple-100', subtitle: 'PCs & Macs' },
    { name: 'Books', icon: BookOpen, href: '/marketplace?category=books', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50/80 group-hover:bg-emerald-100', subtitle: 'Textbooks' },
    { name: 'Fashion', icon: Shirt, href: '/marketplace?category=clothes', iconColor: 'text-amber-600', bgColor: 'bg-amber-50/80 group-hover:bg-amber-100', subtitle: 'Clothing & Wear' },
    { name: 'Housing', icon: House, href: '/housing', iconColor: 'text-sky-600', bgColor: 'bg-sky-50/80 group-hover:bg-sky-100', subtitle: 'Lodges & Rooms' },
    { name: 'Repairs', icon: Wrench, href: '/services?category=repairs', iconColor: 'text-rose-600', bgColor: 'bg-rose-50/80 group-hover:bg-rose-100', subtitle: 'Phone & PC Fixes' },
    { name: 'Food', icon: UtensilsCrossed, href: '/marketplace?category=food', iconColor: 'text-orange-600', bgColor: 'bg-orange-50/80 group-hover:bg-orange-100', subtitle: 'Campus Meals' },
    { name: 'Design', icon: Palette, href: '/services?category=design', iconColor: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50/80 group-hover:bg-fuchsia-100', subtitle: 'Creative & Tech' },
    { name: 'Gadgets', icon: Headphones, href: '/marketplace?category=gadgets', iconColor: 'text-cyan-600', bgColor: 'bg-cyan-50/80 group-hover:bg-cyan-100', subtitle: 'Audio & Power' },
    { name: 'Academics', icon: GraduationCap, href: '/marketplace?category=academics', iconColor: 'text-teal-600', bgColor: 'bg-teal-50/80 group-hover:bg-teal-100', subtitle: 'Study Materials' },
    { name: 'Deals', icon: Zap, href: '/deals', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50/80 group-hover:bg-emerald-100', subtitle: 'Discounts' },
    { name: 'Free Items', icon: Gift, href: '/free-items', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50/80 group-hover:bg-indigo-100', subtitle: 'Donations (₦0)' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section with Ambient Campus Tech Depth */}
      <section className="w-full bg-gradient-to-b from-emerald-600 via-emerald-600 to-green-600 py-12 md:py-20 text-white relative overflow-hidden">
        {/* Subtle geometric dot-matrix overlay reflecting Science & Technology campus */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Verified Platform Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                <span>Official Campus Marketplace</span>
                <span className="text-white/40">•</span>
                <span className="text-white/95">Confluence University (CUSTECH)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight text-balance">
                The Trusted Marketplace for the <span className="underline decoration-white/60 decoration-wavy">CUSTECH</span> Community
              </h1>
              
              <p className="text-sm sm:text-lg text-white/95 max-w-2xl leading-relaxed font-medium">
                Buy, sell, offer services, find accommodation, discover businesses and trade safely with verified students, lecturers, and staff in Osara.
              </p>

              {/* Search Capsule with Quick Trending Tags */}
              <div className="space-y-2.5 max-w-xl">
                <form action="/marketplace" method="GET" className="relative">
                  <div className="flex items-center rounded-full bg-white p-1.5 shadow-xl border border-white">
                    <div className="pl-4 pr-2 text-slate-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      placeholder="Search laptops, phones, textbooks, hostels, services..."
                      className="w-full py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-md"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* Popular Campus Search Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/90 pt-0.5">
                  <span className="font-bold text-white/75 text-[11px]">Trending on Campus:</span>
                  {[
                    { label: 'Laptops', href: '/marketplace?category=laptops' },
                    { label: 'iPhones', href: '/marketplace?search=iPhone' },
                    { label: 'Hostel Lodges', href: '/housing' },
                    { label: 'Textbooks', href: '/marketplace?category=books' },
                    { label: 'Free Items', href: '/free-items' },
                  ].map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-medium text-white transition-all active:scale-95"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <Link 
                  href="/marketplace" 
                  className="flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-emerald-800 font-bold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-md text-center"
                >
                  Explore Market
                </Link>
                <Link 
                  href="/dashboard/listings/new" 
                  className="flex items-center justify-center px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-xs text-center"
                >
                  Sell Items
                </Link>
                <Link 
                  href="/housing" 
                  className="flex items-center justify-center px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-xs text-center"
                >
                  Hostel Lodges
                </Link>
                <Link 
                  href="/dashboard/services/new" 
                  className="flex items-center justify-center px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-xs text-center"
                >
                  Post Service
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-white/95 pt-1">
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full border border-white/25">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" /> 100% Student Verified
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full border border-white/25">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" /> 0% Middleman Fees
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full border border-white/25">
                  <GraduationCap className="w-3.5 h-3.5 text-white" /> Osara Campus & Environs
                </span>
              </div>
            </div>

            {/* Right Flash Deals Column */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroDealsShowcase />
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Quick Action Campus Promo Cards Strip */}
      <section className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 py-3">
        <PageContainer>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Campus Quick Features & Community
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                Swipe for all shortcuts →
              </span>
            </div>
            <QuickPromoStrip />
          </div>
        </PageContainer>
      </section>

      {/* Category Section - Enhanced Modern Campus Grid */}
      <section className="py-8 sm:py-12 bg-white border-b border-slate-200/80">
        <PageContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Campus Life</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Browse by Category</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Find products, student lodges, and peer services across CUSTECH</p>
            </div>
            <Link href="/marketplace" className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
              <span>View all categories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110", category.bgColor)}>
                  <category.icon className={cn("w-5 h-5 stroke-[2]", category.iconColor)} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {category.name}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal mt-0.5 truncate max-w-full">
                  {category.subtitle}
                </span>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Featured Listings Section - Strictly Matching Screenshot 2 */}
      <PageContainer>
        <FeaturedListings />
      </PageContainer>

      {/* RECENT LISTINGS */}
      <PageContainer>
        <RecentListingsLiquid />
      </PageContainer>

      {/* How It Works Section */}
      <section className="py-14 md:py-18 bg-white/70 border-y border-slate-200/60">
        <PageContainer>
          <div className="text-center mb-10 space-y-1.5">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">How CUSTECH Marketplace Works</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Simple, secure campus commerce engineered for students</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="relative">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200 text-emerald-600 shadow-xs">
                  <UserPlus className="w-7 h-7" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full text-xs font-black flex items-center justify-center ring-2 ring-white">1</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Create & Verify Account</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sign up with your unique username and verify your student identity with your school ID.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="relative">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-200 text-blue-600 shadow-xs">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full text-xs font-black flex items-center justify-center ring-2 ring-white">2</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Buy, Sell or Offer Services</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Post products with AI description enhancement, list campus lodges, or discover bargains.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="relative">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-200 text-purple-600 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full text-xs font-black flex items-center justify-center ring-2 ring-white">3</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Transact Safely</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Inspect physical goods in public campus areas, use direct payment, and build your verified trust score.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-14 md:py-18">
        <PageContainer>
          <div className="text-center mb-10 space-y-1.5">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Built on Trust and Safety</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Security architectures built specifically to protect student commerce</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 mb-3.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">Identity Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every student seller is verified through student ID card and matriculation cross-referencing.
              </p>
            </div>
            
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 mb-3.5">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">Reputation System</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real transaction feedback, reviews, and badges to build genuine peer trust on campus.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 mb-3.5">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">Dispute Resolution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campus admin desk and dispute center to mediate and resolve transaction disagreements.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 mb-3.5">
                <Flag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">Anti-Fraud Reporting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                One-tap flagging of suspicious fake alerts, overpriced hostel agents, and non-student accounts.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-12 md:py-16">
        <PageContainer>
          <div className="rounded-3xl bg-emerald-500 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-md border border-emerald-400/40">

            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-xs font-bold text-white shadow-xs">
                <Users className="w-3.5 h-3.5 text-emerald-200" />
                <span>Join Over 2,500+ CUSTECH Students Today</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Ready to Trade Safely on Campus?
              </h2>

              <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed">
                Create your verified profile in under 2 minutes. Buy, sell, inspect hostels, or earn rewards as a campus ambassador.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <Link 
                  href="/register" 
                  className="px-7 py-3 bg-white hover:bg-slate-50 text-emerald-800 font-bold text-xs sm:text-sm rounded-full shadow-md active:scale-95 transition-all w-full sm:w-auto"
                >
                  Create Student Account
                </Link>
                <Link 
                  href="/trust" 
                  className="px-7 py-3 bg-white/15 hover:bg-white/25 border border-white/40 backdrop-blur-xl text-white font-bold text-xs sm:text-sm rounded-full shadow-xs active:scale-95 transition-all w-full sm:w-auto"
                >
                  Trust & Safety Guide
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
