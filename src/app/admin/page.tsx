import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, ShoppingBag, Flag, Scale, Activity } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default async function AdminDashboard() {
  await checkAdminAccess();
  const adminClient = await createAdminClient();

  // Fetch Stats in parallel
  const [
    { count: totalUsers },
    { count: verifiedUsers },
    { count: activeListings },
    { count: pendingReports },
    { count: openDisputes },
    { count: pendingVerifications },
    { data: recentActivity }
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
    adminClient.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
    adminClient.from('verification_requests').select('*', { count: 'exact', head: true }).eq('verification_status', 'under_review'),
    adminClient.from('audit_logs')
      .select('*, profiles!audit_logs_admin_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  const stats = [
    { label: 'Total Users', value: totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Verified Users', value: verifiedUsers || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active Listings', value: activeListings || 0, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Pending Reports', value: pendingReports || 0, icon: Flag, color: 'text-rose-500', bg: 'bg-rose-50', link: '/admin/reports' },
    { label: 'Open Disputes', value: openDisputes || 0, icon: Scale, color: 'text-orange-500', bg: 'bg-orange-50', link: '/admin/disputes' },
    { label: 'Pending Verifications', value: pendingVerifications || 0, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50', link: '/admin/verification' },
  ];

  return (
    <div className="space-y-6">
      {/* Official Campus Crest - Admin Institutional Authority Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5 flex items-center justify-center shrink-0 shadow-xs">
            <Image
              src="/logo.png"
              alt="Official CUSTECH Crest"
              fill
              sizes="80px"
              priority
              className="object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-bold text-green-800">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Official Campus Crest • Administrative Authority
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CUSTECH Admin Command Center
            </h1>
            <p className="text-slate-500 text-sm max-w-xl">
              Confluence University of Science and Technology (Osara). Authorized moderation, dispute resolution, user verification, and campus marketplace governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase">System Status</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-center mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase">Campus Node</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">Osara Hub</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const CardContentInner = (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link key={stat.label} href={stat.link}>
              {CardContentInner}
            </Link>
          ) : (
            <div key={stat.label}>{CardContentInner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/admin/verification" className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Review Verifications</span>
              </div>
              {pendingVerifications ? (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">{pendingVerifications}</span>
              ) : null}
            </Link>
            <Link href="/admin/reports" className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <Flag className="h-5 w-5 text-rose-500" />
                <span className="font-medium">Handle Reports</span>
              </div>
              {pendingReports ? (
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-1 rounded-full">{pendingReports}</span>
              ) : null}
            </Link>
            <Link href="/admin/disputes" className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <Scale className="h-5 w-5 text-orange-500" />
                <span className="font-medium">View Disputes</span>
              </div>
              {openDisputes ? (
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{openDisputes}</span>
              ) : null}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex flex-col space-y-1 pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {log.profiles?.display_name || 'Admin'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600">
                      Performed <strong className="capitalize">{log.action.replace(/_/g, ' ')}</strong> on {log.target_type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No recent activity found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
