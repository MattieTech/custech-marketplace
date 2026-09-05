'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Briefcase, 
  House, 
  MessageCircle, 
  Bell, 
  Wallet, 
  Users, 
  ShieldCheck, 
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BRAND_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUser({ ...user, profile })
      }
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navLinks: { name: string; href: string; icon: any; comingSoon?: boolean }[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Listings', href: '/dashboard/listings', icon: ShoppingBag },
    { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Referrals', href: '/dashboard/referrals', icon: Users },
    { name: 'Verification', href: '/dashboard/verification', icon: ShieldCheck },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const Sidebar = () => (
    <div className="flex h-full flex-col overflow-y-auto bg-white border-r border-gray-200 w-64 pt-5 pb-4">
      <div className="flex flex-shrink-0 items-center px-4 mb-5">
        <Link href="/" className="text-xl font-bold text-green-600 tracking-tight">
          {BRAND_NAME || 'CUSTECH Marketplace'}
        </Link>
      </div>
      
      {user && (
        <div className="px-4 mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.profile?.avatar_url ? (
                <img src={user.profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-gray-500 font-medium text-sm">
                  {user.profile?.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                {user.profile?.display_name || 'User'}
              </p>
              <div className="flex items-center">
                {user.profile?.is_verified && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="mt-2 flex-1 space-y-1 px-2">
        {navLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.comingSoon ? '#' : item.href}
              className={cn(
                isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 flex-shrink-0 h-5 w-5'
                )}
                aria-hidden="true"
              />
              {item.name}
              {item.comingSoon && (
                <span className="ml-auto inline-block py-0.5 px-2 text-[10px] rounded-full bg-gray-100 text-gray-600">
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4 mt-auto">
        <button
          onClick={handleSignOut}
          className="flex-shrink-0 group block w-full flex items-center text-gray-600 hover:text-gray-900"
        >
          <LogOut className="inline-block h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 flex z-40 md:hidden", isMobileMenuOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <Sidebar />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex border-b bg-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 flex justify-center items-center pr-12">
            <span className="text-lg font-bold text-green-600 tracking-tight">{BRAND_NAME || 'CUSTECH'}</span>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
