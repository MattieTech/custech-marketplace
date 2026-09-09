import { checkAdminAccess } from '@/lib/admin';
import { getBroadcastStatsAction } from './actions';
import { BroadcastHub } from '@/components/admin/broadcast-hub';

export const metadata = {
  title: 'Email Broadcasts & Promotions | CUSTECH Admin',
  description: 'Automated campus promotional email campaigns via Resend',
};

export default async function AdminBroadcastPage() {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const stats = await getBroadcastStatsAction();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <BroadcastHub initialStats={stats} adminEmail={user.email || ''} />
    </div>
  );
}
