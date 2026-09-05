import { PageContainer } from "@/components/layout/page-container"
import { ListingGrid } from "@/components/marketplace/listing-grid"
import { ListingCard } from "@/components/marketplace/listing-card"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES } from "@/lib/constants"

export const metadata = {
  title: "I Need | CUSTECH Marketplace",
  description: "Post a request and let the community help you find what you need.",
}

interface NeedsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    page?: string
  }>
}

export default async function NeedsPage(props: NeedsPageProps) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  
  const query = searchParams.q || ""
  const category = searchParams.category || ""
  const page = parseInt(searchParams.page || "1")
  const limit = 12
  const offset = (page - 1) * limit

  let dbQuery = supabase
    .from("listings")
    .select(`
      *,
      seller:seller_id (
        id,
        full_name,
        avatar_url,
        is_verified,
        trust_score
      )
    `, { count: "exact" })
    .eq("listing_type", "need")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`)
  }
  if (category && category !== "all") {
    dbQuery = dbQuery.eq("category", category)
  }

  const { data: needs, count, error } = await dbQuery

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 md:gap-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">I Need</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Looking for something? Post a request and let the community help.
            </p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
            <Link href="/needs/new">
              <Plus className="w-4 h-4 mr-2" />
              Post a Request
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-muted/50 p-4 rounded-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search requests..." 
              className="pl-9 bg-background"
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
            <p>Failed to load requests. Please try again.</p>
          </div>
        ) : needs && needs.length > 0 ? (
          <ListingGrid
            listings={needs}
            count={count || 0}
            currentPage={page}
            pageSize={limit}
          />
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No requests found</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-md">
              We couldn't find any requests matching your criteria. Be the first to ask for what you need!
            </p>
            <Button asChild variant="outline">
              <Link href="/needs/new">Post a Request</Link>
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
