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
  stats?: {
    listingsCount?: number;
    totalViews?: number;
    totalLikes?: number;
    followersCount?: number;
    followingCount?: number;
    isFollowing?: boolean;
    completedDeals?: number;
  };
}

export function PublicProfileView({
  profile,
  currentUserId,
  listings,
  properties,
  services,
  reviews,
  stats,
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
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-0">
      {/* Profile Header Card */}
      <div className="relative rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Cover Banner */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 relative overflow-hidden">
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
                  className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-white shadow-xl bg-white shrink-0 rounded-3xl" 
                  src={profile.avatar_url} 
                  fallback={profile.display_name?.charAt(0) || 'U'} 
                />
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white" title="Verified Student">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="pb-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.display_name}
                  </h1>
                  {profile.referral_code && (
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                      @{profile.referral_code}
                    </span>
                  )}
                  {isVerified ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold gap-1 py-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Student
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 border-slate-300 text-xs py-0.5">
                      Unverified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                  {profile.department && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-slate-400" /> {profile.department}
                    </span>
                  )}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Follow, Message, Settings */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 self-stretch sm:self-auto justify-end">
              <FollowActions 
                targetUserId={profile.user_id || profile.id}
                isOwnProfile={isOwnProfile}
                initialStats={{
                  followersCount: stats?.followersCount ?? profile.followers_count ?? 0,
                  followingCount: stats?.followingCount ?? profile.following_count ?? 0,
                  isFollowing: stats?.isFollowing ?? false,
                }}
              />

              {isOwnProfile ? (
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm" className="gap-2 font-bold text-xs h-9 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Settings className="w-3.5 h-3.5" /> Edit Settings
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/messages?user=${profile.user_id || profile.id}`}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold text-xs h-9 rounded-xl shadow-xs" size="sm">
                      <MessageCircle className="w-3.5 h-3.5" /> Message
                    </Button>
                  </Link>
                  <ReportDialog 
                    reportedUserId={profile.id}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-2 text-slate-400 hover:text-red-600 h-9 px-3 rounded-xl border-slate-200" aria-label="Report user">
                        <Flag className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar - Real Database Values */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trust Score</span>
              <span className="text-sm font-black text-slate-900 capitalize mt-0.5 block">
                {profile.trust_level?.replace('_', ' ') || 'Registered'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deals Done</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {stats?.completedDeals ?? profile.completed_transactions ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Listings</span>
              <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                {stats?.listingsCount ?? (listings.length + properties.length + services.length)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Views</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {stats?.totalViews ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Likes Received</span>
              <span className="text-sm font-black text-rose-600 mt-0.5 block">
                {stats?.totalLikes ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating</span>
              <span className="text-sm font-black text-amber-600 flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                {Number(profile.rating_avg || 5.0).toFixed(1)} <span className="text-[11px] text-slate-400 font-normal">({profile.rating_count || 0})</span>
              </span>
            </div>
          </div>

          {/* Bio statement */}
          {profile.bio && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">About Student</h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Listings, Hostels, Services, Reviews */}
      <Tabs defaultValue="products" className="w-full space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200 h-auto grid grid-cols-4 max-w-xl">
          <TabsTrigger value="products" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-600">
            <Package className="w-3.5 h-3.5" />
            <span>Items ({listings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="housing" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-600">
            <Home className="w-3.5 h-3.5" />
            <span>Housing ({properties.length})</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-600">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Services ({services.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl font-bold text-xs py-2 gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-600">
            <Star className="w-3.5 h-3.5" />
            <span>Reviews ({reviews.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Items Content */}
        <TabsContent value="products" className="space-y-4 outline-none">
          {listings.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-10 text-center text-slate-500 bg-white">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No active product listings right now.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {listings.map((item: any) => (
                <Link 
                  key={item.id} 
                  href={`/marketplace/${item.id}`}
                  className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {item.images?.[0] || item.thumbnail_url ? (
                      <img 
                        src={item.images?.[0] || item.thumbnail_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
                    )}
                    {item.condition && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] uppercase font-bold">
                        {item.condition.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h3 className="font-bold text-slate-900 truncate text-sm group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-black text-emerald-600 text-base">
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
            <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-10 text-center text-slate-500 bg-white">
              <Home className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No active hostels or accommodation listed.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {properties.map((prop: any) => (
                <Link 
                  key={prop.id} 
                  href={`/housing/${prop.id}`}
                  className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    {prop.images?.[0] || prop.thumbnail_url ? (
                      <img src={prop.images?.[0] || prop.thumbnail_url} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-slate-900 truncate text-base group-hover:text-emerald-600">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {prop.location || 'Near Campus'}
                    </p>
                    <p className="font-black text-emerald-600 text-base pt-1">
                      {formatPrice(prop.price || 0)} <span className="text-xs font-normal text-slate-400">/year</span>
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
            <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-10 text-center text-slate-500 bg-white">
              <Briefcase className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No services currently offered.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {services.map((svc: any) => (
                <Link 
                  key={svc.id} 
                  href={`/services/${svc.id}`}
                  className="group bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                      {svc.title}
                    </h3>
                    <Badge variant="outline" className="text-xs capitalize font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                      Available
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{svc.description}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Starting from</span>
                    <span className="font-black text-emerald-600 text-sm">
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
            <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-10 text-center text-slate-500 bg-white">
              <Star className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No reviews received yet.</p>
              <p className="text-xs text-slate-400 mt-1">Reviews appear here after completing verified campus transactions.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev: any) => (
                <Card key={rev.id} className="rounded-2xl border-slate-200 p-5 space-y-3 shadow-xs bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                        {rev.reviewer?.display_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {rev.reviewer?.display_name || 'Verified Student'}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDate(rev.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < (rev.rating || 5) ? 'fill-current' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
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
