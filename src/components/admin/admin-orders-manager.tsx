'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Search, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight,
  Loader2,
  ExternalLink,
  Scale
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { resolveEscrowOrder } from '@/app/admin/actions';
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

interface AdminOrdersManagerProps {
  initialOrders: any[];
  userRole: string;
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'In-Flight', value: 'in_flight' },
  { label: 'Disputed', value: 'disputed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Refunded', value: 'refunded' },
];

export function AdminOrdersManager({ initialOrders, userRole }: AdminOrdersManagerProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Resolution modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'release_to_seller' | 'refund_to_buyer'>('release_to_seller');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const canResolve = ['super_admin', 'finance_admin'].includes(userRole);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'in_flight') return ['funded', 'in_transit', 'delivered'].includes(order.status);
    if (statusFilter === 'disputed') return order.status === 'disputed';
    if (statusFilter === 'completed') return order.status === 'completed';
    if (statusFilter === 'refunded') return order.status === 'refunded';
    return true;
  });

  const handleExecuteResolution = async () => {
    if (!selectedOrder) return;
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 5) {
      toast.error('Please enter resolution notes explaining the decision.');
      return;
    }

    setIsResolving(true);

    try {
      await resolveEscrowOrder(selectedOrder.id, resolutionAction, resolutionNotes);
      toast.success(
        `Dispute resolved! Funds ${resolutionAction === 'release_to_seller' ? 'released to seller' : 'refunded to buyer'}.`,
        'Order Resolved'
      );
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
        ...o,
        status: resolutionAction === 'release_to_seller' ? 'completed' : 'refunded',
        resolution_notes: resolutionNotes
      } : o));
      setSelectedOrder(null);
      setResolutionNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve escrow order.');
    } finally {
      setIsResolving(false);
    }
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case 'funded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Funded</span>
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Truck className="w-3 h-3 text-amber-600" />
            <span>In Transit</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Disputed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold capitalize">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search by order #, buyer, seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 rounded-xl text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === f.value
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <Card className="rounded-3xl border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No escrow orders found</p>
            <p className="text-xs text-slate-400 mt-1">
              No orders matched your current search and filter parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {order.listing?.images?.[0] ? (
                      <img
                        src={order.listing.images[0]}
                        alt="Item"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        #{order.order_number}
                      </span>
                      {renderBadge(order.status)}
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {order.listing?.title || 'Campus Marketplace Item'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>Buyer: <strong>{order.buyer?.display_name || 'Student'}</strong></span>
                      <span>•</span>
                      <span>Seller: <strong>{order.seller?.display_name || 'Student'}</strong></span>
                      <span>•</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-emerald-600">
                      {formatPrice(order.amount)}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {order.payment_method}
                    </span>
                  </div>

                  {canResolve && ['funded', 'in_transit', 'disputed'].includes(order.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs font-bold border-slate-300 hover:bg-slate-100 rounded-xl"
                    >
                      <Scale className="w-3.5 h-3.5 mr-1 text-slate-600" />
                      <span>{order.status === 'disputed' ? 'Resolve Dispute' : 'Admin Action'}</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <span>Resolve Escrow Order #{selectedOrder?.order_number}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Arbitrate order disputes and release or refund funds held in escrow.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2">
              {/* Dispute info if present */}
              {selectedOrder.dispute_reason && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <strong>Dispute Reported:</strong> {selectedOrder.dispute_reason}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Resolution Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction('release_to_seller')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                      resolutionAction === 'release_to_seller'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                    <span>Release to Seller</span>
                    <p className="text-[10px] font-normal text-emerald-700 mt-0.5">
                      Credit {formatPrice(selectedOrder.amount)} to seller
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction('refund_to_buyer')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                      resolutionAction === 'refund_to_buyer'
                        ? 'border-rose-500 bg-rose-50 text-rose-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600 mb-1" />
                    <span>Refund to Buyer</span>
                    <p className="text-[10px] font-normal text-rose-700 mt-0.5">
                      Return {formatPrice(selectedOrder.amount)} to buyer
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Resolution Justification & Audit Notes
                </label>
                <Textarea
                  placeholder="Explain why this decision was reached (e.g., proof of inspection verified, item returned to seller, etc.)."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="rounded-xl text-xs"
                  rows={3}
                  disabled={isResolving}
                />
              </div>

              <DialogFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl text-xs font-bold"
                  disabled={isResolving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteResolution}
                  disabled={isResolving || !resolutionNotes.trim() || resolutionNotes.trim().length < 5}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Execute Decision</span>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
