'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Briefcase, 
  MessageCircle, 
  Bell, 
  Wallet, 
  Users, 
  ShieldCheck, 
  Settings,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUser({ ...user, profile });
      }
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navLinks: { name: string; href: string; icon: any; comingSoon?: boolean }[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Listings', href: '/dashboard/listings', icon: ShoppingBag },
    { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Referrals', href: '/dashboard/referrals', icon: Users },
    { name: 'Verification', href: '/dashboard/verification', icon: ShieldCheck },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-slate-50/60">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 bg-white border-r border-slate-200/80">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-2.5 px-5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 p-1 flex items-center justify-center border border-emerald-200">
              <Image
                src="/logo.png"
                alt="CUSTECH Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black text-emerald-600 tracking-tight leading-none">
                CUSTECH
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                Marketplace Dashboard
              </span>
            </div>
          </div>

          {/* User Profile Card */}
          {user && (
            <div className="px-4 mb-5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  {user.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {user.profile?.display_name || 'Campus Student'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user.profile?.is_verified ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-semibold text-emerald-700">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Student Account
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 px-3 space-y-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.comingSoon ? '#' : item.href}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all",
                    isActive 
                      ? "bg-emerald-500 text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.name}</span>
                  {item.comingSoon && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 font-semibold">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="border-t border-slate-100 p-4 mt-auto">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Horizontal Tabs - Fast 1-Tap Switching (Eliminates Double Header) */}
        <div className="md:hidden sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none shadow-2xs">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.comingSoon ? '#' : item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0",
                  isActive
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                )}
              >
                <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Dashboard Page Body with Safe Bottom Padding */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 sm:pb-16 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
