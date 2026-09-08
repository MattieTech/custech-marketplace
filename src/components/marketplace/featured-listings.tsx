import Link from 'next/link';
import { Star, CheckCircle2, MapPin, Sparkles, Package } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

export async function FeaturedListings() {
  let displayListings: any[] = [];

  try {
    const admin = await createAdminClient();
    const { data: dbListings } = await admin
      .from('listings')
      .select(`
        id,
        title,
        price,
        condition,
        location,
        is_featured,
        created_at,
        seller:profiles!user_id(display_name, verification_status, trust_level, rating_avg),
        images:listing_images(url)
      `)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4);

    if (dbListings && dbListings.length > 0) {
      displayListings = dbListings.map((item: any) => {
        const sellerProfile = Array.isArray(item.seller) ? item.seller[0] : item.seller;
        return {
          id: item.id,
          title: item.title,
          price: item.price ? Number(item.price) : 0,
          condition: item.condition ? item.condition.replace('_', ' ') : 'Good',
          location: item.location || 'Campus / Osara',
          seller_type: sellerProfile?.verification_status === 'approved' ? 'verified' : 'trusted',
          rating: Number(sellerProfile?.rating_avg || 5.0).toFixed(1),
          image: item.images?.[0]?.url || null,
          is_featured: item.is_featured,
        };
      });
    }
  } catch (err) {
    console.error('Error loading featured listings:', err);
    displayListings = [];
  }

  // If no listings in the database yet, return null cleanly (NO fake mock listings)
  if (displayListings.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Featured Listings
        </h2>
        <span className="text-xs sm:text-sm text-slate-400 font-medium">
          {displayListings.length} featured
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {displayListings.map((item) => (
          <Link
            key={item.id}
            href={`/marketplace/${item.id}`}
            className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between"
          >
            {/* Image Container with Badges */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
                  <Package className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-[11px] font-medium">Campus Item</span>
                </div>
              )}

              {/* Top-left Orange "Featured" pill if featured */}
              {item.is_featured && (
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                    Featured
                  </span>
                </div>
              )}

              {/* Top-right Condition pill */}
              {item.condition && (
                <div className="absolute top-2.5 right-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/85 backdrop-blur-md border border-white/70 text-slate-700 capitalize shadow-xs">
                    {item.condition}
                  </span>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <div className="text-base sm:text-lg font-black text-[#03447c] mt-1 tracking-tight">
                  {formatPrice(item.price)}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  {/* Seller Trust Badge */}
                  {item.seller_type === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>CUSTECH Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Campus Seller</span>
                    </span>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 truncate">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
