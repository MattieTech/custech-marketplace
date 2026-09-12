'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestWithdrawal } from '@/app/dashboard/wallet/actions';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { 
  Building2, 
  AlertCircle, 
  Loader2, 
  ArrowUpRight, 
  Settings 
} from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  bankDetails: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
  onWithdrawSuccess: () => void;
}

export function WithdrawModal({
  isOpen,
  onClose,
  availableBalance,
  bankDetails,
  onWithdrawSuccess,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBankDetails = bankDetails.accountNumber && bankDetails.bankName;

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1000) {
      setError('Minimum withdrawal amount is ₦1,000');
      return;
    }

    const numAmountKobo = Math.round(numAmount * 100);

    if (numAmountKobo > availableBalance) {
      setError(`Amount exceeds your available balance of ${formatPrice(availableBalance)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await requestWithdrawal(numAmount);
    setIsLoading(false);

    if (res.success) {
      toast.success(`Withdrawal request of ${formatPrice(numAmountKobo)} submitted! Processing to your bank account.`, 'Withdrawal Initiated');
      onClose();
      setAmount('');
      onWithdrawSuccess();
    } else {
      setError(res.error || 'Withdrawal request failed.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <span>Request Bank Payout</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Withdraw cleared marketplace funds directly to your verified Nigerian commercial bank account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Bank Account Verification Card */}
          {hasBankDetails ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Destination Bank Account
                </span>
                <Link
                  href="/dashboard/settings"
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Edit in Settings</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">{bankDetails.accountName || 'Verified Student'}</p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {bankDetails.bankName} • <strong className="font-mono">{bankDetails.accountNumber}</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black">No Bank Account Configured</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    To receive payouts from completed escrow sales or referral rewards, add your bank account name and number.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold">
                <Link href="/dashboard/settings">Add Bank Account Details</Link>
              </Button>
            </div>
          )}

          {hasBankDetails && (
            <>
              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="withdrawAmount" className="text-xs font-bold text-slate-700">
                    Withdrawal Amount (₦)
                  </Label>
                  <span className="text-[11px] text-slate-500">
                    Available: <strong className="text-slate-800">{formatPrice(availableBalance)}</strong>
                  </span>
                </div>
                <Input
                  id="withdrawAmount"
                  type="number"
                  min="1000"
                  max={availableBalance}
                  placeholder="Min. ₦1,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl text-sm font-bold"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={handleWithdraw}
                disabled={
                  isLoading ||
                  !amount ||
                  parseFloat(amount) < 1000 ||
                  parseFloat(amount) > availableBalance
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Processing Payout...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Withdrawal {amount ? formatPrice(parseFloat(amount)) : ''}</span>
                    <ArrowUpRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
