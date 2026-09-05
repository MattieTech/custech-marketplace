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
    <div className="space-y-6 pb-28 sm:pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, {displayName}!</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Here's what's happening with your account today.</p>
      </div>

      <div>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.name} className="overflow-hidden shadow-xs border-slate-200/90 rounded-2xl bg-white">
              <CardContent className="p-4 sm:p-5">
                <dt className="truncate text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.name}</dt>
                <dd className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{item.stat}</dd>
              </CardContent>
            </Card>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-dashed border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-2xl bg-white transition-all shadow-2xs">
            <Link href="/dashboard/listings/new">
              <PlusCircle className="h-6 w-6 text-emerald-600" />
              <span className="font-bold text-xs">Create Listing</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-slate-200 hover:border-emerald-300 rounded-2xl bg-white transition-all shadow-2xs">
            <Link href="/messages">
              <MessageSquare className="h-6 w-6 text-slate-400" />
              <span className="font-bold text-xs">View Messages</span>
            </Link>
          </Button>
          
          {!isVerified && (
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-slate-200 hover:border-emerald-300 rounded-2xl bg-white transition-all shadow-2xs">
              <Link href="/dashboard/verification">
                <ShieldCheck className="h-6 w-6 text-slate-400" />
                <span className="font-bold text-xs">Get Verified</span>
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center space-y-2 border-slate-200 hover:border-emerald-300 rounded-2xl bg-white transition-all shadow-2xs">
            <Link href="/marketplace">
              <ShoppingBag className="h-6 w-6 text-slate-400" />
              <span className="font-bold text-xs">View Marketplace</span>
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
