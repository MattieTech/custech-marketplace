'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, ArrowRight, Lock, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { checkListingEligibility, EligibilityResult } from '@/app/dashboard/listings/actions';
import { cn } from '@/lib/utils';

interface VerificationGateProps {
  type: 'marketplace' | 'housing' | 'services';
  children: React.ReactNode;
}

export function VerificationGate({ type, children }: VerificationGateProps) {
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await checkListingEligibility();
        setEligibility(res);
      } catch (err) {
        console.error('Failed to check eligibility:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <CustechLogoLoader
          mode="in-app"
          size="md"
          message="Checking CUSTECH student verification status..."
        />
      </div>
    );
  }

  // If user is verified, render the full listing form
  if (eligibility?.isVerified) {
    return (
      <div className="space-y-6">
        <div className="liquid-glass border border-emerald-300/60 bg-emerald-50/70 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-none">
                CUSTECH Verified Student Member
              </p>
              <p className="text-[11px] text-emerald-800/90 mt-1">
                Your account is verified. All your listings receive the official CUSTECH Verified badge.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white/80 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Privilege
          </span>
        </div>
        {children}
      </div>
    );
  }

  // Section-specific copy for unverified members
  const config = {
    marketplace: {
      categoryName: 'Marketplace Items',
      title: 'Verified Student Sellers Only',
      reason:
        'To protect the CUSTECH student community from scams, fake electronics, and unauthorized sellers, only verified CUSTECH students can publish items on the marketplace.',
      actionText: 'Verify Student ID to Post Items'
    },
    housing: {
      categoryName: 'Campus Accommodation',
      title: 'Verified Hostels & Lodges Only',
      reason:
        'To prevent phantom lodge postings, fake agent fees, and hostel extortion in Osara, only verified students and verified lodge caretakers can post accommodation.',
      actionText: 'Verify Identity to Post Hostels'
    },
    services: {
      categoryName: 'Student Services',
      title: 'Verified Freelance Providers Only',
      reason:
        'To ensure safety, quality, and accountability across campus, only verified CUSTECH students can advertise freelance services and campus skills.',
      actionText: 'Verify Student ID to Offer Services'
    }
  }[type];

  const statusBadge = {
    under_review: {
      label: 'Verification Under Review',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock,
      description: 'Our campus verification officers are reviewing your student credentials. You will be able to post as soon as approval is granted.'
    },
    rejected: {
      label: 'Previous Attempt Rejected',
      color: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: ShieldAlert,
      description: 'Your previous verification was rejected. Please resubmit clear student credentials to unlock publishing privileges.'
    },
    unverified: {
      label: 'Student Status Unverified',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Lock,
      description: 'One-time student verification (?1,000) unlocks unlimited listings, verified badge, and instant trust points.'
    }
  }[eligibility?.verificationStatus as 'under_review' | 'rejected'] || {
    label: 'Student Status Unverified',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Lock,
    description: 'One-time student verification (?1,000) unlocks unlimited listings, verified badge, and instant trust points.'
  };

  const StatusIcon = statusBadge.icon;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Card className="liquid-glass border border-slate-200/80 bg-white/90 shadow-xl rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 uppercase tracking-wider", statusBadge.color)}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusBadge.label}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {config.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {config.reason}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700 text-left space-y-2">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Why does CUSTECH require student verification?
            </p>
            <p className="text-slate-600 leading-relaxed">
              {statusBadge.description}
            </p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>Eliminates fake campus sellers and scam accounts.</li>
              <li>Attaches an official <strong>CUSTECH Verified</strong> badge to your profile.</li>
              <li>Enables direct in-person handovers and verified trade receipts.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-7 py-3 rounded-2xl shadow-md active:scale-95 transition-all"
            >
              <Link href="/dashboard/verification" className="flex items-center justify-center gap-2">
                <span>{config.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto rounded-2xl text-xs font-medium border-slate-200 hover:bg-slate-50"
            >
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
