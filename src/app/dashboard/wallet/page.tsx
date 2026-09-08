'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Send, 
  PlusCircle, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Receipt,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getWalletData, WalletData } from './actions';
import { P2PTransferModal } from '@/components/wallet/p2p-transfer-modal';
import { FundWalletModal } from '@/components/wallet/fund-wallet-modal';
import { WithdrawModal } from '@/components/wallet/withdraw-modal';

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isP2POpen, setIsP2POpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getWalletData();
    if (res.success && res.data) {
      setWalletData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !walletData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CustechLogoLoader mode="in-app" size="md" message="Loading your CUSTECH wallet..." />
      </div>
    );
  }

  const balance = walletData?.balance || 0;
  const pendingEscrow = walletData?.pendingEscrowBalance || 0;
  const transactions = walletData?.transactions || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Wallet</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage your campus funds, send peer-to-peer payments, and track escrow settlements.
        </p>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Available Balance Card */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              <span>Available Balance</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
              Instant P2P & Escrow
            </span>
          </div>

          <p className="text-3xl sm:text-4xl font-black tracking-tight mb-6 relative z-10">
            {formatPrice(balance)}
          </p>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            <Button
              onClick={() => setIsFundOpen(true)}
              className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl shadow-xs py-2 px-1 flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Top Up</span>
            </Button>
            <Button
              onClick={() => setIsP2POpen(true)}
              className="bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl border border-emerald-500/40 py-2 px-1 flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </Button>
            <Button
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-emerald-900/60 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl border border-emerald-500/30 py-2 px-1 flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </Button>
          </div>
        </Card>

        {/* Pending Escrow Balance Card */}
        <Card className="p-6 rounded-3xl border-slate-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Escrow Sales</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                In Transit / Inspection
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {formatPrice(pendingEscrow)}
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Funds locked in active buyer escrow orders. Automatically credited to your available balance when buyers confirm inspection.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Active Orders</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank Settings</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Wallet Ledger & History</h2>
          <span className="text-xs text-slate-400 font-medium">{transactions.length} transactions</span>
        </div>

        <Card className="rounded-3xl border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No transactions recorded yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Fund your wallet to make instant purchases or receive funds from sales and peer transfers.
              </p>
              <Button
                onClick={() => setIsFundOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Top Up Your Wallet
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit' || (tx.amount > 0 && tx.type !== 'debit');
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {tx.description || (isCredit ? 'Credit Transfer' : 'Debit Transfer')}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatDate(tx.created_at)}</span>
                          {tx.reference && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] truncate max-w-[140px] sm:max-w-none">
                                Ref: {tx.reference}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-black tracking-tight ${
                          isCredit ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isCredit ? '+' : ''}
                        {formatPrice(Math.abs(tx.amount))}
                      </p>
                      <span
                        className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status || 'completed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* P2P Transfer Modal */}
      <P2PTransferModal
        isOpen={isP2POpen}
        onClose={() => setIsP2POpen(false)}
        senderBalance={balance}
        onTransferSuccess={loadData}
      />

      {/* Fund Wallet Modal */}
      <FundWalletModal
        isOpen={isFundOpen}
        onClose={() => setIsFundOpen(false)}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={balance}
        bankDetails={walletData?.bankDetails || { bankName: null, accountNumber: null, accountName: null }}
        onWithdrawSuccess={loadData}
      />
    </div>
  );
}
