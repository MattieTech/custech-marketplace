import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { approveUsernameChange, rejectUsernameChange } from '@/app/admin/actions';
import { Check, X, UserCheck, ShieldAlert, Clock, ArrowRight, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function AdminUsernamesPage() {
  await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  const { data: requests } = await adminClient
    .from('reports')
    .select('*, profiles:reporter_id(display_name, referral_code, matric_number, avatar_url)')
    .eq('reported_type', 'username_change')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Username Change Queue</h1>
        <p className="text-slate-500 text-sm mt-1">Review student requests to update their public handle and referral code.</p>
      </div>

      {requests && requests.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {requests.map((req: any) => {
            let details: any = {};
            try {
              details = JSON.parse(req.details || '{}');
            } catch {}

            return (
              <Card key={req.id} className="overflow-hidden border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending Review
                  </Badge>
                  <span className="text-[11px] text-slate-400">{formatDate(req.created_at)}</span>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600">
                      {req.profiles?.avatar_url ? (
                        <img src={req.profiles.avatar_url} alt={req.profiles.display_name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {req.profiles?.display_name || 'Anonymous Student'}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{req.profiles?.matric_number || 'Student'}</p>
                    </div>
                  </div>

                  {/* Comparison Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Username</span>
                        <div className="font-mono font-bold text-slate-700">@{details.currentUsername || req.profiles?.referral_code || 'user'}</div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                      <div className="space-y-0.5 text-right">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Requested New</span>
                        <div className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          @{details.newUsername}
                        </div>
                      </div>
                    </div>

                    {details.reasonNote && (
                      <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Student Reason: </span>
                        {details.reasonNote}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <form className="flex-1" action={async () => {
                      'use server';
                      await rejectUsernameChange(req.id, 'Requested username does not meet campus naming standards.');
                    }}>
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl">
                        <X className="h-3.5 w-3.5 mr-1" /> Reject Request
                      </Button>
                    </form>
                    <form className="flex-1" action={async () => {
                      'use server';
                      await approveUsernameChange(req.id);
                    }}>
                      <Button size="sm" className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shadow-emerald-600/20">
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve New Username
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-slate-200 rounded-2xl bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mb-3">
              <UserCheck className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Pending Username Requests</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All student handle requests have been processed. When a student requests a handle update from their account settings, it will appear here for review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
