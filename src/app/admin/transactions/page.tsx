import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { CreditCard, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TransactionsPage() {
  await checkAdminAccess(['super_admin', 'finance_admin']);
  const adminClient = await createAdminClient();
  
  const { data: rawTransactions } = await adminClient
    .from('transactions')
    .select(`
      *,
      listing:listings(title)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const rawList = rawTransactions || [];
  const userIds = [
    ...new Set([
      ...rawList.map((t: any) => t.buyer_id),
      ...rawList.map((t: any) => t.seller_id)
    ].filter(Boolean))
  ];

  let profileMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.user_id] = p;
      return acc;
    }, {});
  }

  const transactions = rawList.map((tx: any) => ({
    ...tx,
    buyer: profileMap[tx.buyer_id] || { display_name: 'Buyer' },
    seller: profileMap[tx.seller_id] || { display_name: 'Seller' },
  }));

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge variant="default" className="bg-emerald-500">Completed</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'disputed': return <Badge variant="destructive" className="bg-rose-500">Disputed</Badge>;
      case 'refunded': return <Badge variant="outline">Refunded</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transactions</h1>
        <p className="text-slate-500 mt-1">Monitor payments, escrow status, and platform volume.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-y">
                <tr>
                  <th className="px-6 py-4 font-medium">Reference</th>
                  <th className="px-6 py-4 font-medium">Parties</th>
                  <th className="px-6 py-4 font-medium">Item</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {tx.reference || tx.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-xs">
                          <Link href={`/admin/users/${tx.buyer_id}`} className="font-medium text-emerald-600 hover:underline">
                            {tx.buyer?.display_name || 'Buyer'}
                          </Link>
                          <ArrowRightLeft className="h-3 w-3 text-slate-300" />
                          <Link href={`/admin/users/${tx.seller_id}`} className="font-medium text-slate-700 hover:underline">
                            {tx.seller?.display_name || 'Seller'}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">
                        {tx.listing?.title || 'Unknown Item'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatPrice(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <CreditCard className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No transactions yet</h3>
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
