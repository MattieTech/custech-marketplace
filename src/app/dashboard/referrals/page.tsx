"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Copy, Users, CheckCircle, Wallet, Check, AlertCircle, Share2, Sparkles, Clock, ArrowUpRight } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { getReferralStats, getReferralHistory } from "./actions";
import { formatPrice, cn, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ReferralsPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [statsData, historyData] = await Promise.all([
          getReferralStats(),
          getReferralHistory()
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch (error) {
        console.error("Error loading referrals:", error);
        toast.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const referralCode = stats?.referralCode || user?.user_metadata?.username || user?.user_metadata?.referral_code || "student";
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://custechmarketplace.web.app/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! Join me on CUSTECH Marketplace to buy, sell items, find student hostels, and book verified campus services safely. Sign up using my referral link:\n${shareLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `Join CUSTECH Marketplace, the verified campus student platform for deals, hostels, and services:\n${shareLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (!user) return null;

  return (
    <PageContainer>
      <div className="py-6 space-y-8 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Ambassador Rewards</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Refer & Earn</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm max-w-xl">
              Share your unique invite code with fellow CUSTECH students. Earn cash rewards when they register and verify their accounts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button 
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-xs gap-2 text-xs h-10"
            >
              <Share2 className="w-4 h-4" /> Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Share Link Banner */}
        <Card className="border-green-200/80 dark:border-green-900/60 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Your Unique Referral Link</CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Your username <span className="font-mono font-bold text-green-600 dark:text-green-400">@{referralCode}</span> is your permanent referral ID
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-800 dark:text-green-300 bg-green-100/50 dark:bg-green-950/40">
                Active Code
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 flex-1 w-full font-mono text-sm text-zinc-800 dark:text-zinc-200 select-all truncate shadow-inner">
                {shareLink}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleCopy} 
                  className={cn("flex-1 sm:flex-initial rounded-xl font-bold h-11 text-xs gap-2", copied ? "bg-green-600 hover:bg-green-700 text-white" : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800")}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Link Copied!" : "Copy Link"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTwitterShare} 
                  className="rounded-xl font-bold h-11 text-xs px-3 border-zinc-300 dark:border-zinc-700"
                >
                  Share X
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-white/40 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                Invited Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">
                  {stats?.totalReferrals || 0}
                </div>
              )}
              <p className="text-[11px] text-zinc-400 mt-1">Total registered with your link</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/40 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Verified Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">
                  {stats?.qualifiedReferrals || 0}
                </div>
              )}
              <p className="text-[11px] text-zinc-400 mt-1">Qualified for payout reward</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/40 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatPrice(stats?.totalEarned || 0)}
                </div>
              )}
              <p className="text-[11px] text-zinc-400 mt-1">Paid directly to wallet/bank</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/40 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {formatPrice(stats?.pendingRewards || 0)}
                </div>
              )}
              <p className="text-[11px] text-zinc-400 mt-1">Awaiting admin review</p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works & Referral History */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* History List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Referrals</h2>
              <span className="text-xs text-zinc-400 font-mono">{history.length} records</span>
            </div>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
              {loading ? (
                <div className="p-8 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : history.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Referrals Yet</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Share your unique link on your WhatsApp status and department groups to start earning rewards today!
                  </p>
                  <Button onClick={handleCopy} size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 font-bold">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-300">
                          {item.referral_code?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Invited Student
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Joined {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "capitalize text-[10px] font-bold",
                            item.status === 'qualified' || item.status === 'rewarded' 
                              ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400" 
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          )}
                        >
                          {item.status}
                        </Badge>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          +{formatPrice(item.reward_amount || 500)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Guide Card */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">How It Works</h2>
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Share your link</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Send your invite link to friends, class groups, or hostel peers.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">They register & verify</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">When they sign up and get verified with student credentials.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Earn Cash Rewards</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Your referral bonus is credited directly to your bank account or wallet.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Link 
                  href="/verification" 
                  className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center justify-between group"
                >
                  <span>Verify your own account</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
