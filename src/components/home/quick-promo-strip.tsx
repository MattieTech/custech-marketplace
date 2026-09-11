'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Sparkles } from 'lucide-react';
import {
  CallToOrderIcon,
  CustechForceIcon,
  ClearanceSalesIcon,
  VoucherBoxIcon,
  Buy2Pay1BasketIcon,
  NewArrivalBoxIcon,
  FreeItemsGiftIcon,
  AiCustomerSupportIcon,
  WhatsappCommunityIcon,
} from './promo-3d-icons';

interface QuickCard {
  id: string;
  title: string;
  badge?: string;
  href: string;
  gradient: string;
  borderGlow: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isAiTrigger?: boolean;
}

export function QuickPromoStrip() {
  // Reordered: WhatsApp Community prominent at #1, AI Help placed at #9
  const cards: QuickCard[] = [
    {
      id: 'whatsapp-community',
      title: 'WhatsApp Community',
      badge: 'Official CUSTECH',
      href: 'https://chat.whatsapp.com/CUSTECH_Marketplace_Community',
      gradient: 'from-[#25D366] via-emerald-600 to-green-800',
      borderGlow: 'hover:shadow-[#25D366]/40',
      icon: WhatsappCommunityIcon,
    },
    {
      id: 'call-to-order',
      title: 'Order Helpdesk',
      badge: 'Help Desk',
      href: '#support',
      gradient: 'from-rose-500 via-pink-500 to-rose-600',
      borderGlow: 'hover:shadow-rose-500/25',
      icon: CallToOrderIcon,
      isAiTrigger: true,
    },
    {
      id: 'custech-force',
      title: 'CUSTECH Force',
      badge: 'Earn ₦500+',
      href: '/dashboard/referrals',
      gradient: 'from-amber-500 via-orange-500 to-orange-600',
      borderGlow: 'hover:shadow-orange-500/25',
      icon: CustechForceIcon,
    },
    {
      id: 'clearance-sales',
      title: 'Clearance Sales',
      href: '/deals',
      gradient: 'from-red-500 via-rose-600 to-amber-600',
      borderGlow: 'hover:shadow-red-500/25',
      icon: ClearanceSalesIcon,
    },
    {
      id: 'voucher-store',
      title: 'Voucher Store',
      href: '/deals',
      gradient: 'from-emerald-500 via-teal-500 to-green-600',
      borderGlow: 'hover:shadow-emerald-500/25',
      icon: VoucherBoxIcon,
    },
    {
      id: 'buy-2-pay-1',
      title: 'Buy 2 Pay for 1',
      href: '/marketplace?filter=bundles',
      gradient: 'from-blue-500 via-indigo-500 to-blue-700',
      borderGlow: 'hover:shadow-blue-500/25',
      icon: Buy2Pay1BasketIcon,
    },
    {
      id: 'new-arrival',
      title: 'New Arrival',
      href: '/marketplace?sort=newest',
      gradient: 'from-teal-400 via-cyan-500 to-emerald-600',
      borderGlow: 'hover:shadow-cyan-500/25',
      icon: NewArrivalBoxIcon,
    },
    {
      id: 'free-items',
      title: 'Free Items (₦0)',
      href: '/free-items',
      gradient: 'from-purple-500 via-fuchsia-500 to-indigo-600',
      borderGlow: 'hover:shadow-purple-500/25',
      icon: FreeItemsGiftIcon,
    },
    {
      id: 'ai-support',
      title: 'AI Customer Help',
      badge: '24/7 Bot',
      href: '#support',
      gradient: 'from-emerald-700 via-teal-800 to-zinc-900',
      borderGlow: 'hover:shadow-emerald-600/35',
      icon: AiCustomerSupportIcon,
      isAiTrigger: true,
    },
  ];

  const handleCardClick = (card: QuickCard, e: React.MouseEvent) => {
    if (card.isAiTrigger) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('open-ai-support'));
    }
  };

  return (
    <div className="w-full py-4">
      {/* Horizontal scroll container with smooth swipe snap */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none snap-x snap-mandatory">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          const isExternal = card.href.startsWith('http');
          const isFirst = idx === 0;

          return (
            <Link
              key={card.id}
              href={card.href}
              onClick={(e) => handleCardClick(card, e)}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={`group shrink-0 ${isFirst ? 'w-44 sm:w-48 ring-2 ring-[#25D366]/60 shadow-lg' : 'w-36 sm:w-40 md:w-44'} h-48 sm:h-52 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b ${card.gradient} text-white shadow-md hover:shadow-xl ${card.borderGlow} transition-all duration-300 hover:-translate-y-1.5 active:scale-95 snap-start select-none border border-white/20`}
            >
              {/* Ambient radial highlight */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

              {/* Card Header: Title, Badge & Arrow */}
              <div className="flex items-start justify-between gap-1 z-10">
                <div className="space-y-0.5">
                  {card.badge && (
                    <span className="inline-block text-[9px] uppercase font-black tracking-wider bg-white/25 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      {card.badge}
                    </span>
                  )}
                  <h3 className="font-extrabold text-xs sm:text-[13px] tracking-tight leading-tight drop-shadow-xs truncate block">
                    {card.title}
                  </h3>
                </div>
                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:translate-x-0.5 group-hover:bg-white group-hover:text-slate-900 transition-all mt-0.5">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Center 3D Icon Presentation */}
              <div className="flex-1 flex items-center justify-center z-10 py-1">
                <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                  <IconComponent size={isFirst ? 120 : 110} />
                </div>
              </div>

              {/* Bottom Label */}
              <div className="z-10 flex items-center justify-between text-[10px] font-semibold text-white/90">
                <span className="truncate">
                  {card.isAiTrigger ? 'Launch AI Help' : isFirst ? 'Join 1,200+ Students' : 'Tap to explore'}
                </span>
                <span className="text-yellow-200 group-hover:translate-x-1 transition-transform font-bold">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
