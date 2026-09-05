import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, Gift } from 'lucide-react';

export default async function RevenuePage() {
  await checkAdminAccess(['super_admin', 'finance_admin']);
  const adminClient = await createAdminClient();
  
  // Aggregate stats (Note: in a real app, use RPC for complex aggregations)
  // For demonstration, we'll fetch and sum in JS (not recommended for large datasets)
  const { data: verifications } = await adminClient
    .from('verification_requests')
    .select('amount_paid')
    .in('verification_status', ['approved', 'paid']);
    
  const { data: transactions } = await adminClient
    .from('transactions')
    .select('amount, platform_fee')
    .eq('status', 'completed');
    
  const { data: referrals } = await adminClient
    .from('referrals')
    .select('reward_amount')
    .eq('reward_status', 'paid');

  const verificationRev = verifications?.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0) || 0;
  const transactionVol = transactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const platformFees = transactions?.reduce((acc, curr) => acc + (curr.platform_fee || 0), 0) || 0;
  const referralCosts = referrals?.reduce((acc, curr) => acc + (curr.reward_amount || 0), 0) || 0;
  
  const netRevenue = verificationRev + platformFees - referralCosts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Revenue Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform financials and transaction volume.</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg text-sm">
        <strong>Note:</strong> For detailed financial reporting and tax purposes, please consult your accounting system (e.g. Paystack Dashboard).
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Net Revenue</CardTitle>
            <div className="p-2 rounded-full bg-emerald-50">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatPrice(netRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Transaction Volume</CardTitle>
            <div className="p-2 rounded-full bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatPrice(transactionVol)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Verification Fees</CardTitle>
            <div className="p-2 rounded-full bg-purple-50">
              <CreditCard className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatPrice(verificationRev)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Referral Costs</CardTitle>
            <div className="p-2 rounded-full bg-rose-50">
              <Gift className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatPrice(referralCosts)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
