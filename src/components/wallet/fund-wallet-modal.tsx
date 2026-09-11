'use client';

import { useState } from 'react';
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
import { initializeWalletFunding } from '@/app/dashboard/wallet/actions';
import { formatPrice } from '@/lib/utils';
import { CreditCard, ShieldCheck, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];

export function FundWalletModal({ isOpen, onClose }: FundWalletModalProps) {
  const [amount, setAmount] = useState<number | ''>(2500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFund = async () => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      setError('Minimum wallet top-up is ₦100');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await initializeWalletFunding(numAmount);
    setIsLoading(false);

    if (res.success && res.authorizationUrl) {
      window.location.href = res.authorizationUrl;
    } else {
      setError(res.error || 'Failed to initialize payment gateway.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Top Up Wallet</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Add funds securely to your campus wallet using debit card, bank transfer, or USSD via Paystack.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Quick presets */}
          <div>
            <Label className="text-xs font-bold text-slate-700 mb-2 block">
              Select Preset Amount
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setAmount(val); setError(null); }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                    amount === val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ₦{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-1.5">
            <Label htmlFor="customAmount" className="text-xs font-bold text-slate-700">
              Or Custom Amount (₦)
            </Label>
            <Input
              id="customAmount"
              type="number"
              min="100"
              placeholder="e.g. 3500"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value ? parseFloat(e.target.value) : '');
                setError(null);
              }}
              className="rounded-xl text-sm font-bold"
              disabled={isLoading}
            />
          </div>

          {/* Security badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-slate-600 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              256-bit encrypted checkout via Paystack. Funds credit your CUSTECH wallet instantly upon confirmation.
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            onClick={handleFund}
            disabled={isLoading || !amount || (typeof amount === 'number' && amount < 100)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Connecting to Paystack...</span>
              </>
            ) : (
              <>
                <span>Proceed to Pay {amount ? formatPrice((typeof amount === 'number' ? amount : parseFloat(amount)) * 100) : ''}</span>
                <ExternalLink className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
