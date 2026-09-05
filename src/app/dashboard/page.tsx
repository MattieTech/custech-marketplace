import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, MessageSquare, ShieldCheck, ShoppingBag } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const isVerified = profile?.is_verified || false

  // Placeholders for stats
  const stats = [
    { name: 'Active Listings', stat: '0' },
    { name: 'Messages', stat: '0' },
    { name: 'Total Views', stat: '0' },
    { name: 'Completed Sales', stat: '0' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening with your account today.</p>
      </div>

      <div>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.name} className="overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{item.stat}</dd>
              </CardContent>
            </Card>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-dashed border-2 hover:border-green-500 hover:text-green-600">
            <Link href="/dashboard/listings/new">
              <PlusCircle className="h-6 w-6" />
              <span>Create Listing</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2">
            <Link href="/messages">
              <MessageSquare className="h-6 w-6 text-gray-400" />
              <span>View Messages</span>
            </Link>
          </Button>
          
          {!isVerified && (
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2">
              <Link href="/dashboard/verification">
                <ShieldCheck className="h-6 w-6 text-gray-400" />
                <span>Get Verified</span>
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2">
            <Link href="/marketplace">
              <ShoppingBag className="h-6 w-6 text-gray-400" />
              <span>View Marketplace</span>
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">
            No recent activity yet.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
