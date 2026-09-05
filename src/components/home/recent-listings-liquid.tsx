import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Package, ArrowRight, ShieldCheck, MapPin, Tag } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export async function RecentListingsLiquid() {
  const admin = await createAdminClient();

  const { data: listings } = await admin
    .from('listings')
    .select(`
      id,
      title,
      price,
      condition,
      location,
      created_at,
      listing_type,
      category:categories(name),
      images:listing_images(url)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8);

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Freshly Added</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Recent Campus Listings
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Browse newly posted items, electronics, textbooks, and gear from verified students
          </p>
        </div>
        <Link 
          href="/marketplace" 
          className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group shrink-0"
        >
          <span>View All Market</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {listings.map((item: any) => {
          const imageUrl = item.images?.[0]?.url;
          const categoryName = item.category?.name || 'General';

          return (
            <Link
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="group relative rounded-3xl bg-white/85 dark:bg-zinc-900/80 hover:bg-white border border-white/80 dark:border-zinc-800 hover:border-emerald-200/80 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)] hover:shadow-[0_16px_35px_rgba(16,185,129,0.12)] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div>
                {/* Image Aspect Container */}
                <div className="aspect-[4/3] bg-slate-100 dark:bg-zinc-800 relative overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Package className="w-8 h-8 stroke-[1.5]" />
                      <span className="text-[10px]">No image</span>
                    </div>
                  )}

                  {item.condition && (
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {item.condition.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    <span>{categoryName}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="font-black text-emerald-700 dark:text-emerald-400 text-base sm:text-lg">
                    {formatPrice(item.price || 0)}
                  </p>
                </div>
              </div>

              {item.location && (
                <div className="px-3.5 sm:px-4 pb-3 pt-0 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
