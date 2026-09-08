'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchRecipient, sendP2PTransfer, RecipientInfo } from '@/app/dashboard/wallet/actions';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Send 
} from 'lucide-react';

interface P2PTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderBalance: number;
  onTransferSuccess: () => void;
}

export function P2PTransferModal({
  isOpen,
  onClose,
  senderBalance,
  onTransferSuccess,
}: P2PTransferModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setRecipient(null);

    const res = await searchRecipient(query.trim());
    setIsSearching(false);

    if (res.success && res.recipient) {
      setRecipient(res.recipient);
    } else {
      setSearchError(res.error || 'Recipient not found.');
    }
  };

  const handleResetRecipient = () => {
    setRecipient(null);
    setSearchError(null);
    setAmount('');
    setNote('');
  };

  const handleTransfer = async () => {
    if (!recipient) return;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }

    if (numAmount > senderBalance) {
      setTransferError(`Insufficient balance. Your available balance is ${formatPrice(senderBalance)}.`);
      return;
    }

    setIsSubmitting(true);
    setTransferError(null);

    const res = await sendP2PTransfer(recipient.userId, numAmount, note);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Successfully sent ${formatPrice(numAmount)} to ${recipient.displayName}!`, 'Transfer Completed');
      onClose();
      handleResetRecipient();
      onTransferSuccess();
    } else {
      setTransferError(res.error || 'Transfer failed. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <span>Send Money to Student</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Instant, zero-fee peer-to-peer wallet transfer using User ID or Referral Code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Lookup Recipient */}
          {!recipient ? (
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="recipientQuery" className="text-xs font-bold text-slate-700">
                  Recipient Identity (User ID or Referral Code)
                </Label>
                <div className="relative">
                  <Input
                    id="recipientQuery"
                    placeholder="e.g. CUSTECH-7X9A or user UUID..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pr-10 rounded-xl text-xs"
                    disabled={isSearching}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter the recipient's exact Referral Code or User ID to verify their identity before transferring.
                </p>
              </div>

              {searchError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Recipient</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Step 2: Confirmed Recipient & Transfer Form */
            <div className="space-y-4">
              {/* Recipient Verification Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {recipient.avatarUrl ? (
                      <img src={recipient.avatarUrl} alt={recipient.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{recipient.displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-slate-900">{recipient.displayName}</p>
                      {recipient.isVerified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {recipient.department || 'CUSTECH Student'}
                      {recipient.referralCode ? ` • Ref: ${recipient.referralCode}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRecipient}
                  className="text-xs text-slate-400 hover:text-slate-600 h-8 px-2"
                >
                  Change
                </Button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transferAmount" className="text-xs font-bold text-slate-700">
                    Amount (₦)
                  </Label>
                  <span className="text-[11px] text-slate-500">
                    Available: <strong className="text-slate-800">{formatPrice(senderBalance)}</strong>
                  </span>
                </div>
                <Input
                  id="transferAmount"
                  type="number"
                  min="1"
                  max={senderBalance}
                  placeholder="e.g. 2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl text-sm font-bold"
                  disabled={isSubmitting}
                />
              </div>

              {/* Note / Description */}
              <div className="space-y-1.5">
                <Label htmlFor="transferNote" className="text-xs font-bold text-slate-700">
                  Note / Reference (Optional)
                </Label>
                <Input
                  id="transferNote"
                  placeholder="e.g. Payment for textbook / project share"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl text-xs"
                  disabled={isSubmitting}
                />
              </div>

              {transferError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{transferError}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={handleTransfer}
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > senderBalance}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <span>Send {amount ? formatPrice(parseFloat(amount)) : 'Money'} Now</span>
                    <Send className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
