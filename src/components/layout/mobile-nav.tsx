'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Plus, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Market', href: '/marketplace', icon: ShoppingBag },
    { name: 'Sell', href: '/dashboard/listings/new', icon: Plus, isMain: true },
    { name: 'Messages', href: '/messages', icon: MessageCircle, badge: true },
    { name: 'Profile', href: '/dashboard', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-white/85 backdrop-blur-2xl backdrop-saturate-190 border-t border-white/70 shadow-[0_-10px_35px_rgba(0,0,0,0.06)] md:hidden pb-safe select-none">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
        
        if (item.isMain) {
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex flex-col items-center justify-center -mt-6 group active:scale-90 transition-transform"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full shadow-[0_10px_25px_-3px_rgba(16,185,129,0.45),inset_0_1px_1.5px_rgba(255,255,255,0.5)] border-2 border-white text-white transition-all group-hover:scale-105">
                <item.icon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black mt-1 text-slate-800 tracking-tight">{item.name}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90",
              isActive ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-800 font-medium"
            )}
          >
            <div className="relative">
              <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.4]" : "stroke-[1.8]")} />
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
