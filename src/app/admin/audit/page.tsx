import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  await checkAdminAccess(['super_admin']); // strictly super_admin
  const adminClient = await createAdminClient();
  
  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data: logs, count } = await adminClient
    .from('audit_logs')
    .select('*, admin:profiles!audit_logs_admin_id_fkey(display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 mt-1">System-wide trail of administrative actions. Super Admin access only.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Trail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-y">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Admin</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Target</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {log.admin?.display_name || 'System / Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-semibold">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.target_type}
                        <br />
                        <span className="text-xs text-slate-400 font-mono">{log.target_id?.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <pre className="text-[10px] bg-slate-100 p-2 rounded max-w-[200px] overflow-x-auto text-slate-600 border">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <FileText className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No logs found</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {count && count > limit && (
            <div className="p-4 border-t flex justify-end">
              <div className="flex space-x-2">
                {page > 1 && (
                  <Link href={`/admin/audit?page=${page - 1}`} className="px-3 py-1 border rounded-md hover:bg-slate-50 text-sm">
                    Previous
                  </Link>
                )}
                {offset + limit < count && (
                  <Link href={`/admin/audit?page=${page + 1}`} className="px-3 py-1 border rounded-md hover:bg-slate-50 text-sm">
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
