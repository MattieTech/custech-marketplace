'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Star, 
  MessageCircle, 
  Flag, 
  Settings, 
  Share2, 
  Copy, 
  Check, 
  Package, 
  Home, 
  Briefcase, 
  MessageSquare, 
  Sparkles,
  ExternalLink,
  GraduationCap,
  Award
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatPrice } from '@/lib/utils';
import { ReportDialog } from '@/components/marketplace/report-dialog';
import { FollowActions } from '@/components/profile/follow-actions';
import { toast } from '@/components/ui/toast';

interface PublicProfileViewProps {
  profile: any;
  currentUserId?: string;
  listings: any[];
  properties: any[];
  services: any[];
  reviews: any[];
}

export function PublicProfileView({
  profile,
  currentUserId,
  listings,
  properties,
  services,
  reviews,
}: PublicProfileViewProps) {
  const [copied, setCopied] = useState(false);
  const isOwnProfile = currentUserId === profile.user_id;

  const handleShare = () => {
    const url = typeof window !== 'undefined' 
      ? (profile.referral_code ? `${window.location.origin}/user/${profile.referral_code}` : window.location.href)
      : '';
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isVerified = profile.verification_status === 'approved';

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Liquid Glass Header Card */}
      <div className="relative rounded-3xl border border-white/60 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl shadow-xl overflow-hidden">
        {/* Cover Banner */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="secondary"
              size="sm"
              className="bg-black/30 hover:bg-black/45 text-white backdrop-blur-md border border-white/20 rounded-xl text-xs gap-1.5 h-8 font-semibold shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-5 -mt-16 sm:-mt-20 mb-6">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
              <div className="relative">
                <Avatar 
                  className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-white dark:border-zinc-900 shadow-xl bg-white dark:bg-zinc-800 shrink-0 rounded-3xl" 
                  src={profile.avatar_url} 
                  fallback={profile.display_name?.charAt(0) || 'U'} 
                />
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white dark:border-zinc-900" title="Verified Student">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="pb-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {profile.display_name}
                  </h1>
                  {profile.referral_code && (
                    <span className="font-mono text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-900 px-2.5 py-0.5 rounded-lg">
                      @{profile.referral_code}
                    </span>
                  )}
                  {isVerified ? (
                    <Badge className="bg-green-600/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs font-bold gap-1 py-0.5">
                      <ShieldCheck className="w-3 h-3 text-green-600" />
                      Verified Student
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-500 border-zinc-300 dark:border-zinc-700 text-xs py-0.5">
                      Unverified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  {profile.department && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-zinc-400" /> {profile.department}
                    </span>
                  )}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Joined {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Follow, Message, Settings */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 self-stretch sm:self-auto justify-end">
              <FollowActions 
                targetUserId={profile.user_id || profile.id}
                isOwnProfile={isOwnProfile}
              />

              {isOwnProfile ? (
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm" className="gap-2 font-bold text-xs h-9 rounded-xl border-zinc-300 dark:border-zinc-700">
                    <Settings className="w-3.5 h-3.5" /> Edit Settings
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/messages?user=${profile.user_id || profile.id}`}>
                    <Button className="bg-green-600 hover:bg-green-700 text-white gap-1.5 font-bold text-xs h-9 rounded-xl shadow-xs" size="sm">
                      <MessageCircle className="w-3.5 h-3.5" /> Message
                    </Button>
                  </Link>
                  <ReportDialog 
                    reportedUserId={profile.id}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-2 text-zinc-400 hover:text-red-600 h-9 px-3 rounded-xl border-zinc-200 dark:border-zinc-800" aria-label="Report user">
                        <Flag className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Trust Score</span>
              <span className="text-base font-black text-zinc-900 dark:text-zinc-50 capitalize mt-0.5 block">
                {profile.trust_level?.replace('_', ' ') || 'Registered'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Deals Completed</span>
              <span className="text-base font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block">
                {profile.completed_transactions || 0}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Rating</span>
              <span className="text-base font-black text-amber-600 flex items-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-current" />
                {Number(profile.rating_avg || 5.0).toFixed(1)} <span className="text-xs text-zinc-400 font-normal">({profile.rating_count || 0})</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Active Listings</span>
              <span className="text-base font-black text-green-600 dark:text-green-400 mt-0.5 block">
                {listings.length + properties.length + services.length}
              </span>
            </div>
          </div>

          {/* Bio statement */}
          {profile.bio && (
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">About Student</h3>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Listings, Hostels, Services, Reviews */}
      <Tabs defaultValue="products" className="w-full space-y-6">
        <TabsList className="bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 h-auto grid grid-cols-4 max-w-xl">
          <TabsTrigger value="products" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
            <Package className="w-3.5 h-3.5" />
            <span>Items ({listings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="housing" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
            <Home className="w-3.5 h-3.5" />
            <span>Housing ({properties.length})</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Services ({services.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
            <Star className="w-3.5 h-3.5" />
            <span>Reviews ({reviews.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Items Content */}
        <TabsContent value="products" className="space-y-4 outline-none">
          {listings.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 p-10 text-center text-zinc-500">
              <Package className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">No active product listings right now.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {listings.map((item: any) => (
                <Link 
                  key={item.id} 
                  href={`/marketplace/${item.id}`}
                  className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                    {item.images?.[0] || item.thumbnail_url ? (
                      <img 
                        src={item.images?.[0] || item.thumbnail_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No image</div>
                    )}
                    {item.condition && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] uppercase font-bold">
                        {item.condition.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm group-hover:text-green-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-black text-green-600 dark:text-green-400 text-base">
                      {formatPrice(item.price || 0)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 2. Housing Content */}
        <TabsContent value="housing" className="space-y-4 outline-none">
          {properties.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 p-10 text-center text-zinc-500">
              <Home className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">No active hostels or accommodation listed.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {properties.map((prop: any) => (
                <Link 
                  key={prop.id} 
                  href={`/housing/${prop.id}`}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 relative">
                    {prop.images?.[0] || prop.thumbnail_url ? (
                      <img src={prop.images?.[0] || prop.thumbnail_url} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-base group-hover:text-green-600">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {prop.location || 'Near Campus'}
                    </p>
                    <p className="font-black text-green-600 dark:text-green-400 text-base pt-1">
                      {formatPrice(prop.price || 0)} <span className="text-xs font-normal text-zinc-400">/year</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. Services Content */}
        <TabsContent value="services" className="space-y-4 outline-none">
          {services.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 p-10 text-center text-zinc-500">
              <Briefcase className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">No services currently offered.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {services.map((svc: any) => (
                <Link 
                  key={svc.id} 
                  href={`/services/${svc.id}`}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base group-hover:text-green-600 transition-colors">
                      {svc.title}
                    </h3>
                    <Badge variant="outline" className="text-xs capitalize font-bold text-green-700 bg-green-50 border-green-200">
                      Available
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{svc.description}</p>
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Starting from</span>
                    <span className="font-black text-green-600 dark:text-green-400 text-sm">
                      {formatPrice(svc.price || 0)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 4. Reviews Content */}
        <TabsContent value="reviews" className="space-y-4 outline-none">
          {reviews.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 p-10 text-center text-zinc-500">
              <Star className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">No reviews received yet.</p>
              <p className="text-xs text-zinc-400 mt-1">Reviews appear here after completing verified campus transactions.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev: any) => (
                <Card key={rev.id} className="rounded-2xl border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-600">
                        {rev.reviewer?.display_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {rev.reviewer?.display_name || 'Verified Student'}
                        </p>
                        <p className="text-[10px] text-zinc-400">{formatDate(rev.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < (rev.rating || 5) ? 'fill-current' : 'text-zinc-200 dark:text-zinc-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
