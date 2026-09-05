import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { approveVerification, rejectVerification } from '@/app/admin/actions';
import { Check, X, ShieldAlert, FileText, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { ManualVerificationPanel } from '@/components/admin/manual-verification-panel';

export default async function VerificationPage() {
  await checkAdminAccess(['super_admin', 'verification_officer']);
  const adminClient = await createAdminClient();
  
  // Fetch pending verifications
  const { data: requests } = await adminClient
    .from('verification_requests')
    .select('*, profiles:user_id(display_name, avatar_url, matric_number, referral_code)')
    .in('verification_status', ['under_review', 'paid', 'pending_payment'])
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Student Verification Authority</h1>
        <p className="text-slate-500 text-sm mt-1">Review student verification submissions or manually verify campus members with fees waived.</p>
      </div>

      {/* Manual Verification & Fee Waiver Control Panel */}
      <ManualVerificationPanel />

      {/* Pending Submissions Queue */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Incoming Verification Queue ({requests?.length || 0})
            </h2>
            <p className="text-xs text-slate-500">Students who submitted student ID cards or manual matriculation forms.</p>
          </div>
        </div>

        {requests && requests.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request: any) => (
              <Card key={request.id} className="overflow-hidden border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                    {request.verification_status === 'paid' ? 'Payment Confirmed' : request.verification_status.replace('_', ' ')}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{formatDate(request.created_at)}</span>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600">
                      {request.profiles?.avatar_url ? (
                        <img src={request.profiles.avatar_url} alt={request.profiles.display_name} className="h-full w-full object-cover" />
                      ) : (
                        request.profiles?.display_name?.charAt(0) || 'S'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {request.profiles?.display_name || request.full_name}
                      </p>
                      {request.profiles?.referral_code && (
                        <p className="text-xs text-emerald-700 font-mono font-medium">@{request.profiles.referral_code}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 mb-4">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-400 font-medium">Full Name</span>
                      <span className="col-span-2 font-medium text-slate-900 truncate">{request.full_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-400 font-medium">Matric No</span>
                      <span className="col-span-2 font-mono text-slate-900">{request.matric_number || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-400 font-medium">Department</span>
                      <span className="col-span-2 text-slate-900 truncate">{request.department || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-400 font-medium">Phone</span>
                      <span className="col-span-2 text-slate-900">{request.phone}</span>
                    </div>
                  </div>

                  {request.id_document_path && (
                    <div className="mb-4">
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl bg-slate-50" asChild>
                        <a href={request.id_document_path} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> View Uploaded Student ID
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <form className="flex-1" action={async () => {
                      'use server';
                      await rejectVerification(request.id, request.user_id, 'Document does not match institutional records.');
                    }}>
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl">
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </form>
                    <form className="flex-1" action={async () => {
                      'use server';
                      await approveVerification(request.id, request.user_id);
                    }}>
                      <Button size="sm" className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shadow-emerald-600/20">
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 rounded-2xl bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mb-3">
                <ShieldAlert className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Verification Queue is Clear</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No students currently waiting in the submission queue. Use the search tool above if you need to manually verify an account with the fee waived.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
