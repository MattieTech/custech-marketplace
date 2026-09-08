'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, CheckCircle2, Wallet, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { createEscrowOrder } from '@/app/marketplace/[id]/actions';
import Link from 'next/link';

interface BuyWithEscrowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    id: string;
    title: string;
    price: number;
  };
  seller: {
    id: string;
    display_name: string;
  };
}

export function BuyWithEscrowModal({ open, onOpenChange, listing, seller }: BuyWithEscrowModalProps) {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [buyerNotes, setBuyerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any | null>(null);

  useEffect(() => {
    if (!open) {
      setOrderComplete(null);
      return;
    }

    async function loadWallet() {
      setLoadingBalance(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setWalletBalance(null);
          return;
        }

        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        setWalletBalance(wallet?.balance ?? 0);
      } catch (err) {
        console.error('Failed to load wallet balance:', err);
      } finally {
        setLoadingBalance(false);
      }
    }

    loadWallet();
  }, [open]);

  const hasEnoughFunds = walletBalance !== null && walletBalance >= listing.price;

  const handleConfirmEscrow = async () => {
    if (!hasEnoughFunds) {
      toast.error('Insufficient wallet balance. Please fund your wallet first.', 'Wallet Top-Up Needed');
      router.push('/dashboard/wallet');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createEscrowOrder(listing.id, 'wallet', buyerNotes);
      if (res.success && res.order) {
        setOrderComplete(res.order);
        toast.success(`Escrow order #${res.order.order_number} funded successfully!`, 'Protected by Escrow');
      } else {
        toast.error(res.error || 'Failed to initialize escrow order.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Platform Escrow Protection</span>
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 mt-2">
            Buy with CUSTECH Escrow
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Funds are held safely by the marketplace until you receive and verify the item.
          </DialogDescription>
        </DialogHeader>

        {orderComplete ? (
          <div className="py-4 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">Order Successfully Funded!</h4>
              <p className="text-xs font-mono font-bold text-emerald-700">#{orderComplete.order_number}</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed pt-1">
                The seller has been notified to deliver your item. Once received, click &quot;Confirm Receipt&quot; in your orders dashboard.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link href="/dashboard/orders" onClick={() => onOpenChange(false)}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-2xl shadow-xs">
                  View in My Orders <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Price & Protection Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Item</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{listing.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Seller</span>
                <span className="font-bold text-slate-900">{seller.display_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Escrow Protection Fee</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ₦0.00 (Free)
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total Due</span>
                <span className="text-lg font-black text-emerald-700">{formatPrice(listing.price)}</span>
              </div>
            </div>

            {/* Wallet Balance Status */}
            <div className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Available Wallet Balance</span>
                  <span className="text-xs font-black text-slate-900">
                    {loadingBalance ? 'Loading...' : formatPrice(walletBalance ?? 0)}
                  </span>
                </div>
              </div>

              {!loadingBalance && !hasEnoughFunds && (
                <Link href="/dashboard/wallet" onClick={() => onOpenChange(false)}>
                  <Button size="sm" variant="outline" className="text-xs font-bold text-emerald-700 border-emerald-300">
                    Fund Wallet
                  </Button>
                </Link>
              )}
            </div>

            {/* Note to Seller */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Pickup or Delivery Preference (Optional)
              </label>
              <textarea
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="e.g. Meet at Student Union Building at 2 PM, or deliver to Block B..."
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 resize-none h-18 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-[11px] text-emerald-900">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Buyer Protection:</strong> If the seller fails to deliver or item is counterfeit, open a dispute for 100% refund back to your wallet.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleConfirmEscrow}
                disabled={submitting || loadingBalance || !hasEnoughFunds}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm h-11 rounded-2xl shadow-md gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Escrow Lock...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay {formatPrice(listing.price)} with Escrow</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
