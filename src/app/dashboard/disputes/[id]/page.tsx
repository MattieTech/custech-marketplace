import { PageContainer } from "@/components/layout/page-container"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Dispute Details | CUSTECH Marketplace",
}

interface DisputeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DisputeDetailPage(props: DisputeDetailPageProps) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Mock checking DB for dispute
  // If dispute doesn't exist or user is not buyer/seller, return notFound()
  // Since we are mocking for now, we'll just show a placeholder
  const isMock = true

  if (!isMock) {
    notFound()
  }

  return (
    <PageContainer>
      <div className="py-8 max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/dashboard/disputes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispute Details</h1>
          <p className="text-muted-foreground mt-1">
            Reference: #{params.id.slice(0, 8)}
          </p>
        </div>

        <div className="bg-muted p-8 rounded-lg text-center border border-dashed">
          <p className="text-muted-foreground mb-4">Dispute detailed view coming soon.</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/disputes">Return to Dispute Center</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
