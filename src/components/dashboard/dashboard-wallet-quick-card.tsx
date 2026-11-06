'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { 
  Wallet, 
  PlusCircle, 
  Send, 
  ArrowUpRight, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { FundWalletModal } from '@/components/wallet/fund-wallet-modal';
import { P2PTransferModal } from '@/components/wallet/p2p-transfer-modal';
import { WithdrawModal } from '@/components/wallet/withdraw-modal';

interface DashboardWalletQuickCardProps {
  initialBalance: number;
  initialPendingEscrow: number;
  currency?: string;
  bankDetails?: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
}

export function DashboardWalletQuickCard({
  initialBalance,
  initialPendingEscrow,
  bankDetails = { bankName: null, accountNumber: null, accountName: null },
}: DashboardWalletQuickCardProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [pendingEscrow, setPendingEscrow] = useState(initialPendingEscrow);

  // Modals state
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [isP2POpen, setIsP2POpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleRefresh = () => {
    // Refresh page router state
    window.location.reload();
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Available Balance & Quick Actions Card */}
        <Card className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>Available Student Balance</span>
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                Ready for Instant Spend & Transfer
              </span>
            </div>

            <div className="flex items-baseline gap-2 relative z-10 mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {formatPrice(balance)}
              </span>
              <span className="text-xs text-emerald-100 font-semibold">NGN</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 relative z-10 pt-2 border-t border-white/15">
            <Button
              onClick={() => setIsFundOpen(true)}
              className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl shadow-xs py-2.5 px-2 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Top Up</span>
            </Button>

            <Button
              onClick={() => setIsP2POpen(true)}
              className="bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl border border-emerald-400/40 py-2.5 px-2 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Transfer</span>
            </Button>

            <Button
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold text-xs rounded-xl border border-emerald-500/30 py-2.5 px-2 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </Button>
          </div>
        </Card>

        {/* Escrow & History Mini Card */}
        <Card className="p-5 sm:p-6 rounded-3xl border-slate-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Escrow</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Locked
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatPrice(pendingEscrow)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
              Sales revenue locked in escrow, automatically cleared once buyers verify handover.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
            <Link
              href="/dashboard/wallet"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Wallet statement & history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <FundWalletModal
        isOpen={isFundOpen}
        onClose={() => setIsFundOpen(false)}
      />

      <P2PTransferModal
        isOpen={isP2POpen}
        onClose={() => setIsP2POpen(false)}
        senderBalance={balance}
        onTransferSuccess={handleRefresh}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={balance}
        bankDetails={bankDetails}
        onWithdrawSuccess={handleRefresh}
      />
    </>
  );
}
