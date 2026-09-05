'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, User, Star, Calendar, CheckCircle, AlertTriangle, ArrowRight, BookOpen, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { PageContainer } from '@/components/layout/page-container';

type ProfileResult = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  verification_status: string;
  trust_level: string;
  created_at: string;
  rating_avg: number;
  rating_count: number;
  completed_transactions: number;
  department?: string;
  matric_number?: string;
  referral_code?: string;
};

export default function ScamCheckPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim().replace(/^@/, '');
    if (!cleanQuery) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    const supabase = createClient();
    
    // Search by referral_code (exact/ilike username) OR display_name
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        user_id,
        display_name, 
        avatar_url, 
        verification_status, 
        trust_level, 
        created_at, 
        rating_avg, 
        rating_count, 
        completed_transactions,
        department,
        matric_number,
        referral_code
      `)
      .or(`referral_code.ilike.${cleanQuery},display_name.ilike.%${cleanQuery}%`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setResult(data as ProfileResult);
    }
    
    setLoading(false);
  };

  const isVerified = result?.verification_status === 'approved';

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Scam Campus Safety Tool</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            ScamCheck & Member Directory
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Verify student identity, review trust scores, and check verification badges before sending money or meeting on campus.
          </p>
        </div>

        {/* Search Box */}
        <Card className="p-2 border-white/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-lg rounded-2xl">
          <form onSubmit={handleSearch} className="flex gap-2 p-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by @username or student name..."
                className="pl-11 h-12 text-sm sm:text-base rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={loading || !query.trim()} 
              className="h-12 px-6 font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xs"
            >
              {loading ? 'Verifying...' : 'Check'}
            </Button>
          </form>
        </Card>

        {/* Quick hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <span>Try searching by username:</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded cursor-pointer" onClick={() => setQuery('campusleader')}>@campusleader</span>
        </div>

        {/* Results */}
        {searched && (
          <div className="pt-2 animate-in fade-in duration-300">
            {loading ? (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Searching verified student directory...</p>
              </div>
            ) : result ? (
              <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl">
                <div className={`h-2.5 ${isVerified ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
                
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Top Profile Header */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-inner">
                        {result.avatar_url ? (
                          <img src={result.avatar_url} alt={result.display_name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-zinc-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                            {result.display_name}
                          </h2>
                        </div>
                        {result.referral_code && (
                          <p className="font-mono text-xs text-green-600 dark:text-green-400 font-bold">
                            @{result.referral_code}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Member since {formatDate(result.created_at)}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isVerified ? (
                        <div className="flex items-center gap-1.5 text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-950/60 border border-green-300 dark:border-green-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                          <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span>CUSTECH Verified Student</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Unverified Account</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Safety Grid Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Trust Score</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-50 capitalize mt-0.5 block">
                        {result.trust_level?.replace('_', ' ') || 'Registered'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Completed Deals</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block">
                        {result.completed_transactions || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Rating</span>
                      <span className="text-lg font-black text-amber-600 flex items-center gap-1 mt-0.5">
                        <Star className="w-4 h-4 fill-current" />
                        {Number(result.rating_avg || 5.0).toFixed(1)} <span className="text-xs text-zinc-400 font-normal">({result.rating_count || 0})</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Department</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate mt-1 block">
                        {result.department || 'Not Disclosed'}
                      </span>
                    </div>
                  </div>

                  {/* Verdict / Warning banner */}
                  {isVerified ? (
                    <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-green-900 dark:text-green-300 leading-relaxed">
                        <strong>Official Campus Verification Confirmed:</strong> This student has submitted valid matriculation and school credentials. Always inspect physical goods before releasing funds.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                        <strong>Caution:</strong> This user has not completed student identity verification. Never pay upfront before inspecting goods in a public campus location (e.g. Student Center or Library).
                      </div>
                    </div>
                  )}

                  {/* View Full Profile button */}
                  <div className="pt-2 flex justify-end">
                    <Link 
                      href={result.referral_code ? `/user/${result.referral_code}` : `/profile/${result.user_id || result.id}`}
                    >
                      <Button className="rounded-xl font-bold text-xs gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800">
                        <span>View Full Profile & Listings</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center space-y-3 rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">No Member Found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  We couldn't find any member with username or name matching <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">"{query}"</span>. If someone claims to be on CUSTECH Marketplace, verify their username spelling carefully.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
