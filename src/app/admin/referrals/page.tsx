import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatPrice } from '@/lib/utils';

export default async function ReferralsPage() {
  await checkAdminAccess(['super_admin', 'finance_admin']);
  const adminClient = await createAdminClient();
  
  const { data: referrals } = await adminClient
    .from('referrals')
    .select(`
      *,
      referrer:profiles!referrals_referrer_id_fkey(display_name),
      referred:profiles!referrals_referred_id_fkey(display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Referrals</h1>
        <p className="text-slate-500 mt-1">Track user invites and manage referral rewards.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-y">
                <tr>
                  <th className="px-6 py-4 font-medium">Referrer</th>
                  <th className="px-6 py-4 font-medium">Referred User</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Reward Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals && referrals.length > 0 ? (
                  referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${ref.referrer_id}`} className="font-medium text-emerald-600 hover:underline">
                          {ref.referrer?.display_name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${ref.referred_id}`} className="font-medium text-slate-700 hover:underline">
                          {ref.referred?.display_name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className={ref.status === 'completed' ? 'bg-emerald-500' : ''}>
                          {ref.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={ref.reward_status === 'paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}>
                          {ref.reward_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(ref.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <Users className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No referrals found</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
