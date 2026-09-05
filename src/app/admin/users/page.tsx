import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Search, Eye, Ban, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; status?: string }
}) {
  await checkAdminAccess();
  const adminClient = await createAdminClient();
  
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');
  const status = searchParams.status;
  const limit = 20;
  const offset = (page - 1) * limit;

  let dbQuery = adminClient
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) {
    dbQuery = dbQuery.or(`display_name.ilike.%${query}%,email.ilike.%${query}%`);
  }
  
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data: users, count } = await dbQuery;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>;
      case 'suspended': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Suspended</Badge>;
      case 'banned': return <Badge variant="destructive">Banned</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVerificationBadge = (vStatus: string) => {
    switch(vStatus) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'under_review': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage platform users, view their status and trust level.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>User Directory</CardTitle>
            <form className="relative max-w-sm w-full" action="/admin/users" method="GET">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                name="q" 
                defaultValue={query}
                placeholder="Search by name or email..." 
                className="pl-9 bg-slate-50"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Trust Level</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">
                                {user.display_name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1.5">
                              {user.display_name}
                              {getVerificationBadge(user.verification_status)}
                            </div>
                            <div className="text-slate-500 text-xs">{user.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-slate-600">{user.trust_level?.replace(/_/g, ' ') || 'New'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status || 'active')}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Simple Pagination */}
          {count && count > limit && (
            <div className="p-4 border-t flex items-center justify-between text-sm text-slate-500">
              <div>
                Showing {offset + 1} to {Math.min(offset + limit, count)} of {count} users
              </div>
              <div className="flex space-x-2">
                {page > 1 && (
                  <Link href={`/admin/users?page=${page - 1}${query ? `&q=${query}` : ''}`} className="px-3 py-1 border rounded-md hover:bg-slate-50">
                    Previous
                  </Link>
                )}
                {offset + limit < count && (
                  <Link href={`/admin/users?page=${page + 1}${query ? `&q=${query}` : ''}`} className="px-3 py-1 border rounded-md hover:bg-slate-50">
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
