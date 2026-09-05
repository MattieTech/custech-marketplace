'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  MessageCircle, 
  User, 
  PlusCircle, 
  LogIn, 
  ShieldCheck, 
  X, 
  Menu, 
  Store, 
  Home as HomeIcon, 
  Briefcase, 
  Tag, 
  Gift, 
  Sparkles, 
  LogOut, 
  Settings, 
  ChevronRight, 
  ShieldAlert, 
  Share2,
  Building2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISearchBar } from './ai-search-bar';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name, referral_code, avatar_url, verification_status')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfile(prof);

        // Check if admin
        const { data: adminRole } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminRole || user.email === 'matthewaliu001@gmail.com') {
          setIsAdmin(true);
        }
      }
    }

    loadUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSearchInput(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl backdrop-saturate-190 h-14 flex md:hidden items-center px-4 justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)] select-none">
        <div className="flex items-center gap-2.5">
          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center active:scale-90 transition-transform shadow-2xs"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-0.5 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <Image
                src="/logo.png"
                alt="CUSTECH Marketplace"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400 tracking-tight">CUSTECH</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">Market</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {showSearchInput ? (
            <div className="flex items-center gap-1.5 w-52 animate-in fade-in zoom-in-95 duration-150">
              <AISearchBar />
              <button 
                type="button" 
                onClick={() => setShowSearchInput(false)}
                className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setShowSearchInput(true)} 
              className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-90"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {user ? (
            <Link 
              href="/dashboard" 
              className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs active:scale-90 transition-all shadow-2xs"
              aria-label="Dashboard"
            >
              {profile?.display_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full shadow-2xs active:scale-95 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Slide-Over Liquid Glass Drawer (Requirement 10) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-r border-white/60 dark:border-zinc-800 h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 p-1 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <Image
                      src="/logo.png"
                      alt="CUSTECH Marketplace"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400 tracking-tight leading-tight">CUSTECH</span>
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">Marketplace</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Greeting / Auth Status */}
              {user ? (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {profile?.display_name || user.email}
                      </h4>
                      {profile?.referral_code && (
                        <p className="font-mono text-[11px] text-green-600 font-semibold">
                          @{profile.referral_code}
                        </p>
                      )}
                    </div>
                  </div>
                  {profile?.verification_status === 'approved' && (
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-green-600 text-xs font-bold text-white hover:bg-green-700 shadow-xs"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Navigation Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1.5">
                  Explore Campus
                </p>

                <Link
                  href="/marketplace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-blue-500" />
                    <span>Marketplace</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  href="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-cyan-500" />
                    <span>Student Services</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  href="/housing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HomeIcon className="w-4 h-4 text-emerald-500" />
                    <span>Hostels & Housing</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  href="/businesses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span>Student Businesses</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  href="/deals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-rose-500" />
                    <span>Discounts & Deals</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  href="/free-items"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-purple-500" />
                    <span>Free Items (₦0)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  href="/scam-check"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>ScamCheck Directory</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              </div>

              {/* Account / Dashboard Section */}
              {user && (
                <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1.5">
                    My Account
                  </p>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-zinc-500" />
                      <span>User Dashboard</span>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/referrals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-green-600" />
                      <span>Refer & Earn</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-green-700 bg-green-50 border-green-200">
                      Earn ₦500
                    </Badge>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-zinc-500" />
                      <span>Account Settings</span>
                    </div>
                  </Link>

                  {/* Admin Portal link for authorized admin */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 mt-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Admin Control Portal</span>
                      </div>
                      <Badge className="bg-purple-600 text-white text-[9px]">Admin</Badge>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <p className="text-[11px] text-center text-zinc-400">
                  CUSTECH Marketplace • Osara, Kogi State
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl backdrop-saturate-190 h-16 hidden md:flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group active:scale-98 transition-transform">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/90 p-1 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800 group-hover:border-emerald-400 shadow-xs transition-all">
                <Image
                  src="/logo.png"
                  alt="CUSTECH Marketplace"
                  width={30}
                  height={30}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 leading-tight">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 tracking-tight">CUSTECH</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Marketplace</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.22em] uppercase">Official Campus Hub</span>
              </div>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-full border border-white/70 dark:border-zinc-700/60 shadow-2xs">
              <Link href="/marketplace" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-700 transition-all">
                Marketplace
              </Link>
              <Link href="/services" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-700 transition-all">
                Services
              </Link>
              <Link href="/housing" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-700 transition-all">
                Housing
              </Link>
              <Link href="/businesses" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-700 transition-all">
                Businesses
              </Link>
              <Link href="/deals" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-700 transition-all">
                Deals
              </Link>
              <Link href="/scam-check" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-700 transition-all">
                ScamCheck
              </Link>
              {isAdmin && (
                <Link href="/admin" className="px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 transition-all">
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* AI-Powered Search Capsule */}
            <div className="w-56 lg:w-72">
              <AISearchBar />
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" className="h-9 px-4 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
                  <Link href="/dashboard/listings/new">
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Sell Item
                  </Link>
                </Button>

                <div className="flex items-center gap-1 border-l border-slate-200/80 dark:border-zinc-700 pl-2.5 ml-1">
                  <Link 
                    href="/messages" 
                    className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 flex items-center justify-center transition-all active:scale-90 relative shadow-2xs" 
                    aria-label="Messages"
                    title="Messages"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Link>

                  <Link 
                    href="/dashboard/notifications" 
                    className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 flex items-center justify-center transition-all active:scale-90 relative shadow-2xs" 
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                  </Link>

                  <Link 
                    href="/dashboard" 
                    className="px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-emerald-700 transition-all flex items-center gap-1.5 shadow-2xs text-xs font-bold active:scale-95" 
                    aria-label="Dashboard"
                    title="My Account"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden xl:inline">Dashboard</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-slate-700 dark:text-zinc-200 rounded-full px-4">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm" className="text-xs font-bold px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                  <Link href="/register">
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
