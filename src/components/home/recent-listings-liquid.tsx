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
    <section className="py-10 md:py-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Freshly Added</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Recent Campus Listings
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {listings.map((item: any) => {
          const imageUrl = item.images?.[0]?.url;
          const categoryName = item.category?.name || 'General';

          return (
            <Link
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="group relative rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Image Aspect Container */}
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Package className="w-7 h-7 stroke-[1.5]" />
                      <span className="text-[10px]">No image</span>
                    </div>
                  )}

                  {item.condition && (
                    <div className="absolute top-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                      {item.condition.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    <span>{categoryName}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="font-black text-emerald-700 text-sm sm:text-base pt-0.5">
                    {formatPrice(item.price || 0)}
                  </p>
                </div>
              </div>

              {item.location && (
                <div className="px-3 sm:px-4 pb-3 pt-0 flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
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
