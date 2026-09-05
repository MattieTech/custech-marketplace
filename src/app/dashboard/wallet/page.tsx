'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ArrowUpRight, ArrowDownRight, Wallet, ExternalLink } from 'lucide-react';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { toast } from '@/components/ui/toast';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  reference: string;
};

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const handleWithdraw = () => {
    if (balance <= 0) {
      toast.info('Your available balance is ₦0.00. Funds will appear here when your completed sales or referrals are cleared.', 'Zero Balance');
      return;
    }
    toast.success('Redirecting to your payout settings to confirm your bank account...', 'Payout Request');
    router.push('/dashboard/settings');
  };

  useEffect(() => {
    async function loadWallet() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: txs, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && txs) {
        setTransactions(txs);
        
        let available = 0;
        let pending = 0;
        
        txs.forEach((tx: any) => {
          if (tx.status === 'pending') {
            pending += tx.amount;
          } else {
            available += tx.amount;
          }
        });

        setBalance(available);
        setPendingBalance(pending);
      }
      setLoading(false);
    }
    loadWallet();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CustechLogoLoader mode="in-app" size="md" message="Loading student wallet balances..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-2">Manage your funds and view transaction history.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium opacity-90">Available Balance</h2>
            <Wallet className="h-6 w-6 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-6">{formatPrice(balance)}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="secondary" 
              onClick={handleWithdraw}
              className="flex-1 bg-white text-green-700 hover:bg-gray-100 font-semibold"
            >
              Request Payout / Withdraw
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="border-white/50 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/dashboard/settings">
                Bank Settings
              </Link>
            </Button>
          </div>
        </Card>
        
        <Card className="p-6 border-dashed border-2 flex flex-col justify-center">
          <h2 className="text-lg font-medium text-gray-600 mb-2">Pending Balance</h2>
          <p className="text-3xl font-semibold text-gray-900">{formatPrice(pendingBalance)}</p>
          <p className="text-sm text-gray-500 mt-2">Funds held securely in escrow</p>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        
        <Card>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found.
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.amount > 0 ? (
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(tx.created_at)} • Ref: {tx.reference.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
