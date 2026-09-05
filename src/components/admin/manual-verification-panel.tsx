'use client';

import React, { useState } from 'react';
import { 
  searchUsersForAdmin, 
  manualVerifyUser, 
  manualRevokeVerification 
} from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Loader2, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export function ManualVerificationPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsersForAdmin(searchTerm);
      setUsers(results);
      if (results.length === 0) {
        toast.info('No accounts match this search term.');
      }
    } catch (err: any) {
      toast.error('Failed to search accounts: ' + (err.message || 'Error'));
    } finally {
      setSearching(false);
    }
  };

  const handleVerify = async (userId: string, displayName: string) => {
    setActionLoading(userId);
    try {
      const res = await manualVerifyUser(userId, adminNote || 'Administrative verification override (fee waived)');
      if (res.success) {
        toast.success(`Account for ${displayName} verified successfully! Fee waived.`, 'Verified');
        setUsers(prev => prev.map(u => u.user_id === userId || u.id === userId ? { ...u, verification_status: 'approved', trust_level: 'custech_verified' } : u));
      } else {
        toast.error(res.error || 'Failed to verify account');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing manual verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (userId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to revoke verification for ${displayName}?`)) return;
    setActionLoading(userId);
    try {
      const res = await manualRevokeVerification(userId, adminNote || 'Revoked by campus administration');
      if (res.success) {
        toast.success(`Verification revoked for ${displayName}`, 'Revoked');
        setUsers(prev => prev.map(u => u.user_id === userId || u.id === userId ? { ...u, verification_status: 'unverified', trust_level: 'registered' } : u));
      } else {
        toast.error('Failed to revoke verification');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error revoking verification');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 backdrop-blur-md">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Admin Manual Verification & Fee Waiver Control</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Use this institutional authority tool to search any CUSTECH student account and immediately grant official verified status without requiring Paystack fee payment (e.g. for campus leaders, administrative test accounts, or student union executives).
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by student name, @username, referral code, or matric number..."
            className="pl-10 h-11 rounded-xl bg-white/80 border-slate-200 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
        <div className="w-full sm:w-64">
          <Input 
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="Optional audit reason (e.g. Test Admin)"
            className="h-11 rounded-xl bg-white/80 border-slate-200"
          />
        </div>
        <Button 
          type="submit" 
          disabled={searching || !searchTerm.trim()}
          className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shrink-0"
        >
          {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Search Accounts
        </Button>
      </form>

      {/* Search Results */}
      {users.length > 0 && (
        <div className="border border-slate-200/80 rounded-2xl bg-white/90 backdrop-blur-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Matching Student Accounts ({users.length})
            </span>
            <span className="text-[11px] text-slate-400">Institutional Database</span>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map(u => {
              const targetId = u.user_id || u.id;
              const isVerified = u.verification_status === 'approved' || u.verification_status === 'verified';
              const isLoading = actionLoading === targetId;

              return (
                <div key={targetId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                      {u.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{u.display_name || 'Anonymous Student'}</span>
                        {u.referral_code && (
                          <span className="text-xs font-semibold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            @{u.referral_code}
                          </span>
                        )}
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Student
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <AlertCircle className="w-3 h-3 text-slate-400" />
                            Unverified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {u.matric_number && (
                          <span className="flex items-center gap-1 font-mono">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {u.matric_number}
                          </span>
                        )}
                        <span>Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                        <span className="capitalize">Trust: {u.trust_level?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isVerified ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleRevoke(targetId, u.display_name)}
                        className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserX className="w-3.5 h-3.5 mr-1.5" />}
                        Revoke Status
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleVerify(targetId, u.display_name)}
                        className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shadow-emerald-600/20"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserCheck className="w-3.5 h-3.5 mr-1.5" />}
                        Grant Verified Badge (Fee Waived)
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
