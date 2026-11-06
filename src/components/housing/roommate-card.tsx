'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { 
  Users, 
  Home, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  MessageCircle, 
  Phone, 
  Sparkles,
  BookOpen,
  Moon,
  Utensils,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RoommatePost } from '@/app/housing/roommates/actions';

interface RoommateCardProps {
  post: RoommatePost;
  currentUserId?: string;
}

export function RoommateCard({ post, currentUserId }: RoommateCardProps) {
  const [showContact, setShowContact] = useState(false);

  const cleanWhatsapp = post.creatorWhatsapp ? post.creatorWhatsapp.replace(/[^0-9]/g, '') : null;
  const isOwner = currentUserId && currentUserId === post.userId;

  return (
    <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div>
        {/* Status Header Badge */}
        <div className={`p-3.5 sm:px-5 flex items-center justify-between border-b ${
          post.hasAccommodation 
            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900' 
            : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
        }`}>
          <div className="flex items-center gap-1.5 font-extrabold text-xs">
            {post.hasAccommodation ? (
              <>
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Has Lodge (Looking for Co-Tenant)</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Seeking Lodge Partner to Hunt & Split</span>
              </>
            )}
          </div>

          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-extrabold ${
            post.hasAccommodation 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-indigo-100 text-indigo-800 border-indigo-300'
          }`}>
            {post.hasAccommodation ? 'Room Secured' : 'Need Room & Partner'}
          </Badge>
        </div>

        {/* Card Body */}
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Student Profile Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                {post.creatorAvatar ? (
                  <img src={post.creatorAvatar} alt={post.creatorName} className="w-full h-full object-cover" />
                ) : (
                  <span>{post.creatorName.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {post.creatorName}
                  </h3>
                  {post.isVerified && (
                    <span title="Verified CUSTECH Student" className="inline-flex items-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {post.creatorDepartment || 'CUSTECH Student'} {post.creatorLevel ? `• ${post.creatorLevel}` : ''}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  Gender: {post.creatorGender || 'Student'} • Prefers: <strong className="text-slate-700">{post.preferredGender}</strong>
                </p>
              </div>
            </div>

            {/* Price Badge */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {post.hasAccommodation ? 'Your Split Share' : 'Target Budget'}
              </span>
              <p className="text-base sm:text-lg font-black text-emerald-600 leading-tight">
                {post.accommodationDetails.splitBudget ? formatPrice(post.accommodationDetails.splitBudget) : 'Negotiable'}
              </p>
              <span className="text-[9px] text-slate-400 font-medium">/ year</span>
            </div>
          </div>

          {/* Post Title & Description */}
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
              {post.accommodationDetails.lodgeName || 'Roommate Request'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              {post.notes}
            </p>
          </div>

          {/* Location & Lodge Details */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{post.accommodationDetails.location}</span>
            </div>
            <span>•</span>
            <span className="text-[11px] text-slate-500">{post.accommodationDetails.distanceToCampus}</span>
            <span>•</span>
            <span className="text-[11px] text-slate-500 capitalize">
              {(post.accommodationDetails.roomType || 'Room').replace(/_/g, ' ')}
            </span>
          </div>

          {/* Lifestyle Compatibility Tags */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Lifestyle Habits & Preferences
            </span>
            <div className="flex flex-wrap gap-1.5">
              {post.lifestyleHabits.cleanliness && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  🧹 {post.lifestyleHabits.cleanliness}
                </span>
              )}
              {post.lifestyleHabits.sleepHabit && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  🌙 {post.lifestyleHabits.sleepHabit}
                </span>
              )}
              {post.lifestyleHabits.readingHabit && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  📚 {post.lifestyleHabits.readingHabit}
                </span>
              )}
              {post.lifestyleHabits.cookingPreference && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  🍳 {post.lifestyleHabits.cookingPreference}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Card Footer / Connect Actions */}
      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
        <span className="text-[10px] text-slate-400">
          Posted {formatDate(post.createdAt)}
        </span>

        {isOwner ? (
          <span className="text-xs font-bold text-slate-500">Your Posting</span>
        ) : showContact ? (
          <div className="flex items-center gap-2">
            {cleanWhatsapp && (
              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello ${post.creatorName}, I saw your roommate posting on CUSTECH Marketplace ("${post.accommodationDetails.lodgeName}"). Let's discuss pairing up!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </Button>
            )}
            {post.creatorPhone && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 border-slate-300"
              >
                <a href={`tel:${post.creatorPhone}`}>
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setShowContact(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connect to Pair Up</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
