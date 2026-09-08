import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { AdminOrdersManager } from '@/components/admin/admin-orders-manager';

export default async function AdminOrdersPage() {
  const { user, role } = await checkAdminAccess(['super_admin', 'finance_admin', 'support_agent']);
  const adminClient = await createAdminClient();

  // Fetch all orders with relations
  const { data: rawOrders, error } = await adminClient
    .from('escrow_orders')
    .select(`
      *,
      listing:listings(id, title, price, images),
      buyer:profiles!buyer_id(user_id, display_name, avatar_url, whatsapp_number),
      seller:profiles!seller_id(user_id, display_name, avatar_url, whatsapp_number)
    `)
    .order('created_at', { ascending: false });

  const orders = rawOrders || [];

  // Compute summary stats
  const totalLockedAmount = orders
    .filter(o => ['funded', 'in_transit', 'delivered', 'disputed'].includes(o.status))
    .reduce((acc, o) => acc + Number(o.amount), 0);

  const totalCompletedAmount = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + Number(o.amount), 0);

  const disputedCount = orders.filter(o => o.status === 'disputed').length;
  const inFlightCount = orders.filter(o => ['funded', 'in_transit'].includes(o.status)).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Package className="w-7 h-7 text-emerald-600" />
          <span>Platform Orders & Escrow Ledger</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Comprehensive real-time tracking of buyer deposits, campus handovers, and escrow dispute settlements.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Currently in Escrow
            </dt>
            <dd className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {formatPrice(totalLockedAmount)}
            </dd>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Settled Volume
            </dt>
            <dd className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              {formatPrice(totalCompletedAmount)}
            </dd>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active In-Flight Orders
            </dt>
            <dd className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
              {inFlightCount}
            </dd>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Disputed Cases
            </dt>
            <dd className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
              {disputedCount}
            </dd>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Orders Manager */}
      <AdminOrdersManager initialOrders={orders} userRole={role} />
    </div>
  );
}
