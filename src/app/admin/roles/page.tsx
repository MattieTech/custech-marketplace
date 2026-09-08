import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, 
  ShieldCheck, 
  UserMinus, 
  ShieldAlert, 
  PlusCircle, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AdminRolesManager } from '@/components/admin/admin-roles-manager';

export default async function AdminRolesPage() {
  const { user } = await checkAdminAccess(['super_admin']);
  const adminClient = await createAdminClient();

  // Fetch all admin roles with profile info
  const { data: adminRoles, error } = await adminClient
    .from('admin_roles')
    .select(`
      user_id,
      role,
      created_at
    `);

  // Fetch profile details for these admin users
  const userIds = (adminRoles || []).map((ar: any) => ar.user_id);
  
  let profilesMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, display_name, avatar_url, department, matric_number')
      .in('user_id', userIds);

    if (profiles) {
      profilesMap = profiles.reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
    }
  }

  const enrichedAdmins = (adminRoles || []).map((ar: any) => ({
    userId: ar.user_id,
    role: ar.role,
    createdAt: ar.created_at,
    profile: profilesMap[ar.user_id] || null,
    isCurrentAdmin: ar.user_id === user.id,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            <span>Administrator Roles & RBAC</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage platform team permissions, assign delegated duties, and audit administrative privileges.
          </p>
        </div>
      </div>

      {/* Role Breakdown Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
            Super Admin
          </span>
          <p className="text-xs font-bold text-slate-900">Total System Control</p>
          <p className="text-[11px] text-slate-500 leading-snug">
            Manage admins, audit logs, fee waivers, and escrow settlements.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
            Verification Officer
          </span>
          <p className="text-xs font-bold text-slate-900">Student Identity</p>
          <p className="text-[11px] text-slate-500 leading-snug">
            Verify matriculation documents, approve/reject student badges.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            Finance Admin
          </span>
          <p className="text-xs font-bold text-slate-900">Escrow & Payouts</p>
          <p className="text-[11px] text-slate-500 leading-snug">
            Monitor escrow balances, resolve disputed funds, process withdrawals.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
            Moderator
          </span>
          <p className="text-xs font-bold text-slate-900">Content Quality</p>
          <p className="text-[11px] text-slate-500 leading-snug">
            Remove banned items, feature quality listings, review scam reports.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
            Support Agent
          </span>
          <p className="text-xs font-bold text-slate-900">Dispute Mediation</p>
          <p className="text-[11px] text-slate-500 leading-snug">
            Mediate order issues, respond to student support tickets.
          </p>
        </div>
      </div>

      {/* Interactive Manager Client Component */}
      <AdminRolesManager initialAdmins={enrichedAdmins} currentUserId={user.id} />
    </div>
  );
}
