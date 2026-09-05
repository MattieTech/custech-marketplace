import { checkAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, MapPin, Calendar, AlertTriangle, Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await checkAdminAccess();
  const { id } = await params;
  const adminClient = await createAdminClient();
  
  const { data: user } = await adminClient
    .from('profiles')
    .select('*')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle();

  if (!user) {
    notFound();
  }

  // Fetch some stats for this user
  const [
    { count: listingsCount },
    { count: reportsAgainst }
  ] = await Promise.all([
    adminClient.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id),
    adminClient.from('reports').select('*', { count: 'exact', head: true }).eq('reported_id', user.id)
  ]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge variant="default" className="bg-emerald-500">Active</Badge>;
      case 'suspended': return <Badge variant="destructive" className="bg-orange-500">Suspended</Badge>;
      case 'banned': return <Badge variant="destructive">Banned</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Details</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Link href="/admin/users" className="text-slate-500 hover:text-slate-900">Users</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">{user.display_name}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          {user.status === 'active' ? (
            <>
              <form action={async () => {
                'use server';
                const { suspendUser } = await import('@/app/admin/actions');
                await suspendUser(user.id, 'Administrative action via dashboard');
              }}>
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Suspend
                </Button>
              </form>
              <form action={async () => {
                'use server';
                const { banUser } = await import('@/app/admin/actions');
                await banUser(user.id, 'Administrative ban via dashboard');
              }}>
                <Button variant="destructive">
                  <Ban className="mr-2 h-4 w-4" /> Ban User
                </Button>
              </form>
            </>
          ) : (
            <Badge variant="outline" className="px-4 py-2 text-sm">Account {user.status}</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-slate-200 overflow-hidden relative">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-3xl font-bold">
                    {user.display_name?.charAt(0) || '?'}
                  </div>
                )}
                {user.verification_status === 'approved' && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">{user.display_name}</h2>
                <div className="mt-1 flex justify-center space-x-2">
                  {getStatusBadge(user.status || 'active')}
                  <Badge variant="outline" className="capitalize">{user.trust_level?.replace(/_/g, ' ') || 'New'}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              {user.email && (
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="h-4 w-4 mr-3 text-slate-400" />
                  {user.email}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center text-sm text-slate-600">
                  <Phone className="h-4 w-4 mr-3 text-slate-400" />
                  {user.phone}
                </div>
              )}
              {user.department && (
                <div className="flex items-center text-sm text-slate-600">
                  <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                  {user.department}
                </div>
              )}
              <div className="flex items-center text-sm text-slate-600">
                <Calendar className="h-4 w-4 mr-3 text-slate-400" />
                Joined {formatDate(user.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-slate-500 mb-1">Total Listings</div>
                <div className="text-3xl font-bold text-slate-900">{listingsCount || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-slate-500 mb-1">Reports Against User</div>
                <div className="text-3xl font-bold text-slate-900 text-rose-600">{reportsAgainst || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                Detailed listings view would go here.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
