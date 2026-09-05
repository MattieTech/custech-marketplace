import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveDispute } from '@/app/admin/actions';
import { Scale, MessageSquare, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function DisputesPage() {
  await checkAdminAccess(['super_admin', 'support_agent']);
  const adminClient = await createAdminClient();
  
  const { data: disputes } = await adminClient
    .from('disputes')
    .select(`
      *,
      transaction:transactions(amount, reference),
      creator:profiles!disputes_creator_id_fkey(display_name)
    `)
    .in('status', ['open', 'under_review'])
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Disputes</h1>
        <p className="text-slate-500 mt-1">Manage and resolve transaction disputes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {disputes && disputes.length > 0 ? (
          disputes.map((dispute) => (
            <Card key={dispute.id} className="border-orange-100 shadow-sm">
              <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-orange-900">Txn: {dispute.transaction?.reference || 'Unknown'}</span>
                </div>
                <Badge variant="outline" className="bg-white text-orange-700 border-orange-200 uppercase text-[10px] tracking-wider">
                  {dispute.status.replace('_', ' ')}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Raised By</p>
                  <p className="text-sm font-medium text-slate-900">{dispute.creator?.display_name || 'Unknown'}</p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-3 border text-sm text-slate-700 mb-4">
                  <p className="font-medium text-slate-900 mb-1">{dispute.reason}</p>
                  <p className="text-slate-600 text-xs">{dispute.description || 'No detailed description provided.'}</p>
                </div>

                <div className="flex space-x-2 border-t pt-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/transactions/${dispute.transaction_id}`}>
                      View Transaction
                    </Link>
                  </Button>
                  <form className="flex-1" action={async () => {
                    'use server';
                    await resolveDispute(dispute.id, 'Resolved via admin intervention.');
                  }}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No active disputes</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                All transactions are flowing smoothly.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

