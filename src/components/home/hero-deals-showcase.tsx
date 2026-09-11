'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Users, Bot, Gift, ShoppingBag, PhoneCall, Tag, Clock } from 'lucide-react';
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

interface PromoDeal {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  highlight: string;
  description: string;
  couponCode?: string; // Only provided for genuine discount voucher deals (e.g. BLACK90, CAMPUS20)
  featureBenefit: string; // Context-aware professional benefit pill
  featureIcon: React.ElementType;
  ctaText: string;
  ctaHref: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  gradient: string;
  isAiTrigger?: boolean;
}

export function HeroDealsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 9 high-conversion campus slides: ONLY genuine discount promotions have coupon codes
  const deals: PromoDeal[] = [
    {
      id: 'clearance-sales',
      badge: 'CLEARANCE SALES',
      badgeColor: 'bg-red-600 text-white font-bold',
      title: 'Black Friday & Clearance',
      highlight: 'Up to 90% OFF',
      description: 'Massive student price drops on laptops, iPhones, textbooks & hostel appliances across Osara.',
      featureBenefit: 'Up to 90% Campus Clearance Discounts',
      featureIcon: Tag,
      ctaText: 'Shop Clearance Deals',
      ctaHref: '/deals',
      icon: ClearanceSalesIcon,
      gradient: 'from-red-600 via-rose-600 to-amber-600',
    },
    {
      id: 'voucher-store',
      badge: 'STUDENT DEALS',
      badgeColor: 'bg-emerald-600 text-white font-bold',
      title: 'Verified Student Deals',
      highlight: 'Special Student Rates',
      description: 'Exclusive student discounts on phones, tech repairs, graphic design & campus services.',
      featureBenefit: 'Exclusive Student Vouchers & Deals',
      featureIcon: Tag,
      ctaText: 'Explore Campus Deals',
      ctaHref: '/deals',
      icon: VoucherBoxIcon,
      gradient: 'from-emerald-600 via-teal-600 to-green-600',
    },
    {
      id: 'ai-support',
      badge: '24/7 AI SUPPORT',
      badgeColor: 'bg-emerald-700 text-white font-black',
      title: 'CUSTECH Campus AI Assistant',
      highlight: 'Instant AI Helpdesk',
      description: 'Get live answers on trade safety, student verification, verified lodges, and fake alert defense.',
      featureBenefit: 'Live Online • 24/7 Campus AI Support',
      featureIcon: Bot,
      ctaText: 'Chat with AI Assistant',
      ctaHref: '#support',
      icon: AiCustomerSupportIcon,
      gradient: 'from-emerald-700 via-teal-700 to-emerald-950',
      isAiTrigger: true,
    },
    {
      id: 'whatsapp-community',
      badge: 'OFFICIAL COMMUNITY',
      badgeColor: 'bg-green-600 text-white font-bold',
      title: 'Join Student WhatsApp Group',
      highlight: 'Campus Community',
      description: 'Connect with verified students, sellers, hostel mates, and get real-time price-drop alerts.',
      featureBenefit: 'Official Community • CUSTECH Students & Campus Sellers',
      featureIcon: Users,
      ctaText: 'Join WhatsApp Community',
      ctaHref: 'https://chat.whatsapp.com/CUSTECH_Marketplace_Community',
      icon: WhatsappCommunityIcon,
      gradient: 'from-green-600 via-emerald-600 to-green-800',
    },
    {
      id: 'free-items',
      badge: 'FREE CAMPUS GIVEAWAY',
      badgeColor: 'bg-purple-600 text-white font-bold',
      title: '100% Free Campus Items',
      highlight: 'Free Items (₦0)',
      description: 'Graduating students donating study desks, gas cookers, standing fans & past questions for free.',
      featureBenefit: '100% Free • Verified Student-to-Student Donations',
      featureIcon: Gift,
      ctaText: 'Claim Free Items',
      ctaHref: '/free-items',
      icon: FreeItemsGiftIcon,
      gradient: 'from-purple-600 via-fuchsia-600 to-indigo-600',
    },
    {
      id: 'custech-force',
      badge: 'CUSTECH FORCE',
      badgeColor: 'bg-orange-500 text-slate-950 font-black',
      title: 'Campus Ambassador Network',
      highlight: 'Join & Earn Cash',
      description: 'Earn weekly pocket money referring roommates and listing items on CUSTECH Marketplace.',
      featureBenefit: 'Weekly Payouts • Student Ambassador Program',
      featureIcon: ShieldCheck,
      ctaText: 'Join CUSTECH Force',
      ctaHref: '/dashboard/referrals',
      icon: CustechForceIcon,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
    },
    {
      id: 'buy-2-pay-1',
      badge: 'BUY 2 PAY FOR 1',
      badgeColor: 'bg-blue-600 text-white font-bold',
      title: 'Student Bundle Combos',
      highlight: 'Buy 2 Pay for 1',
      description: 'Get extra food provisions, notebooks, and electronics when you bundle from verified student stores.',
      featureBenefit: 'Verified Bundle Deals • Store Multi-Buy Savings',
      featureIcon: ShoppingBag,
      ctaText: 'Shop Bundle Deals',
      ctaHref: '/marketplace?filter=bundles',
      icon: Buy2Pay1BasketIcon,
      gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
    },
    {
      id: 'new-arrival',
      badge: 'NEW ARRIVALS',
      badgeColor: 'bg-teal-500 text-slate-950 font-black',
      title: 'Fresh Campus Listings',
      highlight: 'New Arrivals Today',
      description: 'Newly uploaded smartphones, power banks, revision textbooks, and hostel rooms posted today.',
      featureBenefit: 'Updated Hourly • Fresh Listings Across Osara',
      featureIcon: Clock,
      ctaText: 'Browse New Arrivals',
      ctaHref: '/marketplace?sort=newest',
      icon: NewArrivalBoxIcon,
      gradient: 'from-teal-500 via-cyan-600 to-emerald-600',
    },
    {
      id: 'call-to-order',
      badge: 'ORDER HELPDESK',
      badgeColor: 'bg-rose-500 text-white font-bold',
      title: 'Campus Order Assistance',
      highlight: 'Order Helpdesk',
      description: 'Need help finding verified student sellers, lodges, or campus items? Chat directly with our online desk.',
      featureBenefit: 'Direct Campus Desk • 0% Agent Commission',
      featureIcon: PhoneCall,
      ctaText: 'Chat with Support',
      ctaHref: '#support',
      icon: CallToOrderIcon,
      gradient: 'from-rose-500 via-pink-600 to-rose-700',
      isAiTrigger: true,
    },
  ];

  // Auto-scroll deal cards to the left every 4 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % deals.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, deals.length]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCtaClick = (deal: PromoDeal, e: React.MouseEvent) => {
    if (deal.isAiTrigger) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('open-ai-support'));
    }
  };

  const currentDeal = deals[activeIndex];
  const IconComponent = currentDeal.icon;
  const BenefitIcon = currentDeal.featureIcon;
  const isExternalCta = currentDeal.ctaHref.startsWith('http');

  // Marquee ticker items
  const marqueeItems = [
    'CLEARANCE SALES: MASSIVE STUDENT DISCOUNTS ACROSS OSARA CAMPUS',
    'STUDENT DEALS: EXCLUSIVE CAMPUS SERVICES & STORE OFFERS',
    'AI ASSISTANT: 24/7 INSTANT TRADE SAFETY & VERIFICATION DEFENSE',
    'WHATSAPP COMMUNITY: CONNECT WITH VERIFIED STUDENTS & HOSTEL MATES',
    'FREE ITEMS (₦0.00): VERIFIED STUDENT-TO-STUDENT DONATIONS & BOOKS',
    'CUSTECH FORCE: BECOME A STUDENT AMBASSADOR & EARN COMMISSIONS',
    'STUDENT BUNDLES: SAVE ON MULTI-ITEM TECH & STUDY PACKS',
    'NEW ARRIVALS: FRESH VERIFIED LISTINGS POSTED TODAY',
    'CAMPUS DESK: 0% AGENT COMMISSION FOR REGISTERED STUDENTS',
  ];

  return (
    <div 
      className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden group select-none text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient liquid lighting glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Continuous Auto-Scrolling Left Marquee Ticker */}
      <div className="relative overflow-hidden bg-black/25 backdrop-blur-md rounded-2xl py-2 px-3 mb-4 border border-white/15">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0 bg-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>

          <div className="overflow-hidden w-full whitespace-nowrap relative">
            <motion.div
              className="inline-flex gap-8 text-[11px] font-bold tracking-wide text-white/95"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                repeat: Infinity,
                ease: 'linear',
                duration: 25,
              }}
            >
              {[...marqueeItems, ...marqueeItems].map((text, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <span>{text}</span>
                  <span className="text-yellow-300">•</span>
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* 2. Main Auto-Sliding Promo Card with 3D Icon */}
      <div className="relative min-h-[310px] flex flex-col justify-between rounded-3xl bg-white/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] border border-white/80 overflow-hidden text-slate-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDeal.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between h-full space-y-3"
          >
            {/* Header: Badge & 3D Icon Presentation */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className={`text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-xs ${currentDeal.badgeColor}`}>
                  {currentDeal.badge}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mt-1">
                  OFFICIAL CAMPUS SERVICE
                </span>
              </div>

              {/* 3D Icon Presentation Slot */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center shrink-0 drop-shadow-md">
                <IconComponent size={68} />
              </div>
            </div>

            {/* Deal Headline & Big Highlight */}
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {currentDeal.highlight}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1">
                {currentDeal.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {currentDeal.description}
              </p>
            </div>

            {/* Conditional Display: ONLY show Copy Coupon Box if deal genuinely has a discount couponCode */}
            {currentDeal.couponCode ? (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-dashed border-amber-300 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Tap to Copy Coupon:
                  </span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-wider">
                    {currentDeal.couponCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(currentDeal.couponCode!)}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-xs select-none ${
                    copiedCode === currentDeal.couponCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                  aria-label="Copy coupon code"
                >
                  {copiedCode === currentDeal.couponCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Contextual Professional Benefit Badge for non-coupon slides */
              <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-2 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <BenefitIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {currentDeal.featureBenefit}
                </span>
              </div>
            )}

            {/* CTA Link Button */}
            <Link
              href={currentDeal.ctaHref}
              onClick={(e) => handleCtaClick(currentDeal, e)}
              target={isExternalCta ? '_blank' : undefined}
              rel={isExternalCta ? 'noopener noreferrer' : undefined}
              className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-96 bg-gradient-to-r ${currentDeal.gradient}`}
            >
              <span>{currentDeal.ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Bottom Carousel Navigation & Controls for all 9 slides */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-white/90">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev - 1 + deals.length) % deals.length)}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Previous deal slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev + 1) % deals.length)}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Next deal slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-medium text-white/70 ml-1">
            {activeIndex + 1} / {deals.length}
          </span>
        </div>

        {/* Carousel indicator dots for all 9 slides */}
        <div className="flex items-center gap-1">
          {deals.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex ? 'w-3.5 sm:w-4 bg-yellow-300' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <span className="text-[10px] font-semibold text-white/60">
          Auto-slides 4s
        </span>
      </div>
    </div>
  );
}
