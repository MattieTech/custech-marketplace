import { PageContainer } from "@/components/layout/page-container"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Plus } from "lucide-react"
import Link from "next/link"
import { formatPrice, formatDate } from "@/lib/utils"

export const metadata = {
  title: "Dispute Center | CUSTECH Marketplace",
}

export default async function DisputesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Mocking disputes since table might not exist
  // In production, this would query:
  // select * from disputes join transactions on disputes.transaction_id = transactions.id
  // where transactions.buyer_id = user.id or transactions.seller_id = user.id
  const disputes: any[] = []

  const activeDisputes = disputes.filter(d => ['open', 'under_review', 'awaiting_evidence'].includes(d.status))
  const resolvedDisputes = disputes.filter(d => ['resolved', 'rejected'].includes(d.status))

  return (
    <PageContainer>
      <div className="py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dispute Center</h1>
            <p className="text-muted-foreground mt-1">
              Manage your transaction disputes
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/disputes/new">
              <Plus className="w-4 h-4 mr-2" />
              Open a Dispute
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeDisputes.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeDisputes.length === 0 ? (
              <EmptyDisputesState />
            ) : (
              <DisputeList disputes={activeDisputes} />
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            {resolvedDisputes.length === 0 ? (
              <EmptyDisputesState type="resolved" />
            ) : (
              <DisputeList disputes={resolvedDisputes} />
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {disputes.length === 0 ? (
              <EmptyDisputesState />
            ) : (
              <DisputeList disputes={disputes} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}

function EmptyDisputesState({ type = 'all' }: { type?: string }) {
  return (
    <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center">
      <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
      <h3 className="text-lg font-medium">No {type === 'resolved' ? 'resolved ' : ''}disputes found</h3>
      <p className="text-muted-foreground mt-1 mb-6">
        {type === 'resolved' 
          ? "You don't have any resolved disputes." 
          : "This is a good sign! You have no open disputes."}
      </p>
    </div>
  )
}

function DisputeList({ disputes }: { disputes: any[] }) {
  return (
    <div className="grid gap-4">
      {disputes.map(dispute => (
        <Card key={dispute.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{dispute.transaction.listing_title}</h3>
                  <Badge variant="outline">{dispute.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reason: <span className="font-medium text-foreground">{dispute.reason}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Opened: {formatDate(dispute.created_at)}
                </p>
              </div>
              
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="font-bold text-lg">
                  {formatPrice(dispute.transaction.amount)}
                </div>
                <Button variant="outline" asChild size="sm">
                  <Link href={`/dashboard/disputes/${dispute.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
