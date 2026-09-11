import { PageContainer } from "@/components/layout/page-container"
import { ListingGrid } from "@/components/marketplace/listing-grid"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, Filter, Gift } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES } from "@/lib/constants"
import { sanitizeSearchQuery } from "@/lib/utils"

export const metadata = {
  title: "Free Items | CUSTECH Marketplace",
  description: "Items being given away for free by the CUSTECH community.",
}

interface FreeItemsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    page?: string
  }>
}

export default async function FreeItemsPage(props: FreeItemsPageProps) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  
  const query = sanitizeSearchQuery(searchParams.q)
  const category = searchParams.category || ""
  const page = parseInt(searchParams.page || "1")
  const limit = 12
  const offset = (page - 1) * limit

  let dbQuery = supabase
    .from("listings")
    .select(`
      *,
      listing_images(url),
      category:categories(name, slug)
    `, { count: "exact" })
    .eq("listing_type", "free")
    .eq("status", "active")
    .eq("price", 0)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }
  if (category && category !== "all") {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
    if (isUuid) {
      dbQuery = dbQuery.eq("category_id", category);
    } else {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).maybeSingle();
      if (cat?.id) {
        dbQuery = dbQuery.eq("category_id", cat.id);
      }
    }
  }

  const { data: rawItems, count, error } = await dbQuery;

  let freeItems = rawItems || [];
  if (freeItems.length > 0) {
    const userIds = [...new Set(freeItems.map((item: any) => item.seller_id || item.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, is_verified, trust_level')
      .in('user_id', userIds);

    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    freeItems = freeItems.map((item: any) => ({
      ...item,
      seller: profileMap[item.seller_id || item.user_id] || null,
      images: item.listing_images?.map((img: any) => img.url) || [],
    }));
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 md:gap-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-green-700">Free Items</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Items being given away by the CUSTECH community.
            </p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
            <Link href="/dashboard/listings/new?type=free">
              <Gift className="w-4 h-4 mr-2" />
              Give Something Away
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search free items..." 
              className="pl-9 bg-white border-slate-200 text-slate-900 rounded-xl"
              defaultValue={query}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden md:block" />
            <Select defaultValue={category || "all"}>
              <SelectTrigger className="w-full md:w-[200px] bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="text-center py-12 bg-destructive/10 text-destructive rounded-lg">
            <p>Failed to load items. Please try again.</p>
          </div>
        ) : freeItems && freeItems.length > 0 ? (
          <ListingGrid
            listings={freeItems}
            count={count || 0}
            currentPage={page}
            pageSize={limit}
          />
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center">
            <Gift className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No free items at the moment</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-md">
              Check back later for free giveaways, or be the first to give something back to the community!
            </p>
            <Button asChild variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
              <Link href="/dashboard/listings/new?type=free">Give Something Away</Link>
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
