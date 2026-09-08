'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  Loader2, 
  ExternalLink,
  Truck,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';
import { 
  getUserOrders, 
  confirmReceiptAndReleaseEscrow, 
  markOrderDispatched, 
  openOrderDispute, 
  EscrowOrderDetails 
} from './actions';
import { formatPrice, formatDate } from '@/lib/utils';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchases, setPurchases] = useState<EscrowOrderDetails[]>([]);
  const [sales, setSales] = useState<EscrowOrderDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Release confirmation dialog state
  const [releasingOrder, setReleasingOrder] = useState<EscrowOrderDetails | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  // Dispute dialog state
  const [disputingOrder, setDisputingOrder] = useState<EscrowOrderDetails | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);

  // Dispatch dialog state
  const [dispatchingOrder, setDispatchingOrder] = useState<EscrowOrderDetails | null>(null);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    const res = await getUserOrders();
    if (res.success) {
      setPurchases(res.purchases || []);
      setSales(res.sales || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleConfirmRelease = async () => {
    if (!releasingOrder) return;
    setIsReleasing(true);
    const res = await confirmReceiptAndReleaseEscrow(releasingOrder.id);
    setIsReleasing(false);

    if (res.success) {
      toast.success('Funds have been released to the seller! Transaction completed.', 'Escrow Released');
      setReleasingOrder(null);
      loadOrders();
    } else {
      toast.error(res.error || 'Failed to release escrow funds.');
    }
  };

  const handleDispatchOrder = async () => {
    if (!dispatchingOrder) return;
    setIsDispatching(true);
    const res = await markOrderDispatched(dispatchingOrder.id, dispatchNotes);
    setIsDispatching(false);

    if (res.success) {
      toast.success('Order marked as dispatched. Buyer has been notified.', 'Order Dispatched');
      setDispatchingOrder(null);
      setDispatchNotes('');
      loadOrders();
    } else {
      toast.error(res.error || 'Failed to update order status.');
    }
  };

  const handleOpenDispute = async () => {
    if (!disputingOrder) return;
    if (!disputeReason.trim() || disputeReason.trim().length < 10) {
      toast.error('Please provide at least 10 characters explaining the dispute.');
      return;
    }

    setIsDisputing(true);
    const res = await openOrderDispute(disputingOrder.id, disputeReason);
    setIsDisputing(false);

    if (res.success) {
      toast.success('Dispute submitted. Funds remain protected in escrow while support reviews.', 'Dispute Opened');
      setDisputingOrder(null);
      setDisputeReason('');
      loadOrders();
    } else {
      toast.error(res.error || 'Failed to submit dispute.');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'funded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Escrow Funded</span>
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>In Transit / Handover</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Disputed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold capitalize">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

  const currentList = activeTab === 'purchases' ? purchases : sales;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CustechLogoLoader mode="in-app" size="md" message="Loading your escrow orders..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Orders & Escrow</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor orders, confirm physical delivery, and release funds securely.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'purchases'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchases ({purchases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sales'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales ({sales.length})
          </button>
        </div>
      </div>

      {/* Trust Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <p className="font-bold">CUSTECH Escrow Buyer & Seller Protection</p>
          <p className="text-emerald-800 mt-0.5 leading-relaxed font-medium">
            Funds are locked securely in our audited vault until the buyer receives and inspects the item in person.
            Never confirm receipt until you have thoroughly tested the product on campus.
          </p>
        </div>
      </div>

      {/* Orders List */}
      {currentList.length === 0 ? (
        <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xs p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            {activeTab === 'purchases' ? 'No purchases found' : 'No sales orders found'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'purchases'
              ? 'When you buy items via Platform Escrow, they will appear here with full handover tracking.'
              : 'When students purchase your listings via Escrow, you will see funding confirmations and handover instructions here.'}
          </p>
          <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentList.map((order) => {
            const isPurchase = activeTab === 'purchases';
            return (
              <Card key={order.id} className="rounded-3xl border-slate-200/90 bg-white overflow-hidden shadow-xs">
                {/* Header with order number and status */}
                <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      Order #{order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                {/* Body with listing & counterparty */}
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Item details */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {order.listing?.images?.[0] ? (
                          <img
                            src={order.listing.images[0]}
                            alt={order.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        {order.listing?.id ? (
                          <Link
                            href={`/marketplace/${order.listing.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors line-clamp-1"
                          >
                            {order.listing.title}
                          </Link>
                        ) : (
                          <p className="font-bold text-sm text-slate-900">Campus Marketplace Item</p>
                        )}
                        <p className="text-base font-black text-emerald-600 mt-0.5">
                          {formatPrice(order.amount)}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize">
                          Paid via {order.paymentMethod} escrow
                        </p>
                      </div>
                    </div>

                    {/* Counterparty Profile */}
                    {order.counterparty && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between sm:justify-start gap-3 sm:min-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {order.counterparty.avatarUrl ? (
                              <img
                                src={order.counterparty.avatarUrl}
                                alt={order.counterparty.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{order.counterparty.displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {isPurchase ? 'Seller' : 'Buyer'}
                            </span>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">
                              {order.counterparty.displayName}
                            </p>
                          </div>
                        </div>

                        {order.counterparty.whatsappNumber && (
                          <a
                            href={`https://wa.me/${order.counterparty.whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes / Messages */}
                  {order.sellerNotes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <strong>Seller Dispatch Note:</strong> {order.sellerNotes}
                    </div>
                  )}

                  {order.disputeReason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      <strong>Dispute Raised:</strong> {order.disputeReason}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                    {/* Buyer Action: Confirm Receipt & Release */}
                    {isPurchase && ['funded', 'in_transit', 'delivered'].includes(order.status) && (
                      <Button
                        type="button"
                        onClick={() => setReleasingOrder(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        <span>Confirm Receipt & Release Funds</span>
                      </Button>
                    )}

                    {/* Seller Action: Mark as Dispatched */}
                    {!isPurchase && order.status === 'funded' && (
                      <Button
                        type="button"
                        onClick={() => setDispatchingOrder(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        <Truck className="w-4 h-4 mr-1.5" />
                        <span>Mark as Dispatched / Ready for Meetup</span>
                      </Button>
                    )}

                    {/* Dispute button */}
                    {!['completed', 'refunded', 'cancelled', 'disputed'].includes(order.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDisputingOrder(order)}
                        className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        <span>Open Dispute</span>
                      </Button>
                    )}

                    {order.status === 'completed' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Funds Cleared & Released</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Release Confirmation Modal */}
      <Dialog open={!!releasingOrder} onOpenChange={(open) => { if (!open) setReleasingOrder(null); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Confirm & Release Escrow Funds</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
              Are you sure you have physically inspected this item and tested it to your satisfaction?
              <br /><br />
              <strong>Warning:</strong> Releasing escrow funds instantly credits{' '}
              <span className="text-emerald-700 font-bold">{releasingOrder ? formatPrice(releasingOrder.amount) : ''}</span>{' '}
              to the seller's wallet and marks this transaction as complete. This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReleasingOrder(null)}
              className="rounded-xl text-xs font-bold"
              disabled={isReleasing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRelease}
              disabled={isReleasing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              {isReleasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Releasing Funds...</span>
                </>
              ) : (
                <span>Yes, Release Funds</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispatch Modal */}
      <Dialog open={!!dispatchingOrder} onOpenChange={(open) => { if (!open) setDispatchingOrder(null); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>Mark Item Dispatched / Handover Ready</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Provide instructions or meetup location on campus (e.g. Faculty lobby, Student Center, or Hostel Gate).
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="e.g. I have prepared the item. Let's meet at Faculty of Computing foyer at 3:00 PM."
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="rounded-xl text-xs"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDispatchingOrder(null)}
              className="rounded-xl text-xs font-bold"
              disabled={isDispatching}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDispatchOrder}
              disabled={isDispatching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm Handover Ready</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={!!disputingOrder} onOpenChange={(open) => { if (!open) setDisputingOrder(null); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Raise Escrow Dispute</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Funds will remain frozen safely in escrow while CUSTECH Marketplace support reviews evidence from both parties.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Explain clearly what went wrong (e.g. item does not match description, damaged, or seller failed to show up)."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="rounded-xl text-xs"
              rows={4}
            />
          </div>

          <DialogFooter className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisputingOrder(null)}
              className="rounded-xl text-xs font-bold"
              disabled={isDisputing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleOpenDispute}
              disabled={isDisputing || !disputeReason.trim() || disputeReason.trim().length < 10}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              {isDisputing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Submitting Dispute...</span>
                </>
              ) : (
                <span>Submit Dispute</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
