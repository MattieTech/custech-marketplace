import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveReport } from '@/app/admin/actions';
import { Flag, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function ReportsPage() {
  await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();
  
  const { data: rawReports } = await adminClient
    .from('reports')
    .select('*')
    .in('status', ['pending', 'investigating'])
    .order('created_at', { ascending: false });

  const rawList = rawReports || [];
  const reporterIds = [...new Set(rawList.map((r: any) => r.reporter_id).filter(Boolean))];
  const userReportTargetIds = [
    ...new Set(rawList.filter((r: any) => r.reported_type === 'user').map((r: any) => r.reported_id).filter(Boolean))
  ];
  const listingReportTargetIds = [
    ...new Set(rawList.filter((r: any) => r.reported_type === 'listing').map((r: any) => r.reported_id).filter(Boolean))
  ];

  const allProfileIds = [...new Set([...reporterIds, ...userReportTargetIds])];

  let profileMap: Record<string, any> = {};
  if (allProfileIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', allProfileIds);

    profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.user_id] = p;
      return acc;
    }, {});
  }

  let listingMap: Record<string, any> = {};
  if (listingReportTargetIds.length > 0) {
    const { data: listings } = await adminClient
      .from('listings')
      .select('id, title')
      .in('id', listingReportTargetIds);

    listingMap = (listings || []).reduce((acc: any, l: any) => {
      acc[l.id] = l;
      return acc;
    }, {});
  }

  const reports = rawList.map((r: any) => ({
    ...r,
    target_type: r.reported_type,
    category: r.reason || r.reported_type || 'General',
    listing_id: r.reported_type === 'listing' ? r.reported_id : null,
    reporter: profileMap[r.reporter_id] || { display_name: 'Campus User' },
    reported_user: profileMap[r.reported_id] || { display_name: 'Reported User' },
    listing: listingMap[r.reported_id] || { title: 'Reported Item' },
  }));

  const getCategoryBadge = (category: string) => {
    return <Badge variant="secondary" className="capitalize">{category.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">Review and manage user-submitted reports for listings and profiles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-y">
                <tr>
                  <th className="px-6 py-4 font-medium">Target</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Reporter</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        {report.target_type === 'listing' ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">Listing</span>
                            <Link href={`/listing/${report.listing_id}`} className="text-emerald-600 hover:underline text-xs flex items-center">
                              {report.listing?.title || 'Unknown Listing'} <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">User Profile</span>
                            <Link href={`/admin/users/${report.reported_id}`} className="text-emerald-600 hover:underline text-xs flex items-center">
                              {report.reported_user?.display_name || 'Unknown User'} <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getCategoryBadge(report.category)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {report.reporter?.display_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={report.status === 'pending' ? 'destructive' : 'default'} className={report.status === 'pending' ? 'bg-rose-500' : 'bg-amber-500'}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form action={async () => {
                          'use server';
                          await resolveReport(report.id, 'Reviewed and resolved by admin.');
                        }}>
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <Flag className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No active reports</h3>
                        <p className="text-xs text-slate-500 mt-1">Hooray! The community is clean.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

