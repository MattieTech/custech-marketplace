'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserCheck, 
  ShieldCheck, 
  UserMinus, 
  PlusCircle, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { assignAdminRole, revokeAdminRole } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AdminMember {
  userId: string;
  role: string;
  createdAt: string;
  profile: {
    display_name?: string;
    avatar_url?: string;
    department?: string;
    matric_number?: string;
  } | null;
  isCurrentAdmin: boolean;
}

interface AdminRolesManagerProps {
  initialAdmins: AdminMember[];
  currentUserId: string;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
  { value: 'verification_officer', label: 'Verification Officer', color: 'bg-blue-100 text-blue-800' },
  { value: 'finance_admin', label: 'Finance Admin', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'moderator', label: 'Moderator', color: 'bg-amber-100 text-amber-800' },
  { value: 'support_agent', label: 'Support Agent', color: 'bg-slate-100 text-slate-800' },
];

export function AdminRolesManager({ initialAdmins, currentUserId }: AdminRolesManagerProps) {
  const [admins, setAdmins] = useState<AdminMember[]>(initialAdmins);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('moderator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke confirm state
  const [revokingMember, setRevokingMember] = useState<AdminMember | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) {
      setError('Please provide a valid User ID.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await assignAdminRole(targetUserId.trim(), selectedRole);
      toast.success(`Role '${selectedRole.replace('_', ' ')}' successfully assigned!`, 'Role Updated');
      setIsAddOpen(false);
      setTargetUserId('');
      // Reload page to re-fetch full enriched data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to assign admin role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!revokingMember) return;
    setIsRevoking(true);

    try {
      await revokeAdminRole(revokingMember.userId);
      toast.success('Administrative access revoked successfully.', 'Admin Removed');
      setAdmins(prev => prev.filter(a => a.userId !== revokingMember.userId));
      setRevokingMember(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke administrator role.');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await assignAdminRole(userId, newRole);
      toast.success(`Role updated to ${newRole.replace('_', ' ')}`, 'Updated');
      setAdmins(prev => prev.map(a => a.userId === userId ? { ...a, role: newRole } : a));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          Active Platform Administrators ({admins.length})
        </h2>
        <Button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>Appoint New Admin</span>
        </Button>
      </div>

      <Card className="rounded-3xl border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {admins.map((admin) => {
            const roleObj = ROLES.find(r => r.value === admin.role) || {
              label: admin.role,
              color: 'bg-slate-100 text-slate-800',
            };

            return (
              <div
                key={admin.userId}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {admin.profile?.avatar_url ? (
                      <img
                        src={admin.profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {admin.profile?.display_name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900">
                        {admin.profile?.display_name || 'Admin User'}
                      </p>
                      {admin.isCurrentAdmin && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {admin.profile?.department || 'Administration Team'}
                      {admin.profile?.matric_number ? ` • ${admin.profile.matric_number}` : ''}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      ID: {admin.userId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Role Selector dropdown */}
                  <select
                    value={admin.role}
                    disabled={admin.isCurrentAdmin}
                    onChange={(e) => handleChangeRole(admin.userId, e.target.value)}
                    className="text-xs font-bold rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:opacity-60 cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {/* Revoke button */}
                  {!admin.isCurrentAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokingMember(admin)}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-8 px-2.5"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      <span>Revoke</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Appoint Admin Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) setIsAddOpen(false); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Appoint Platform Administrator</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Grant delegated administrative access to a registered student account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignRole} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="targetUserId" className="text-xs font-bold text-slate-700">
                Target User UUID
              </Label>
              <Input
                id="targetUserId"
                placeholder="Paste the user UUID from Users page..."
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="rounded-xl text-xs font-mono"
                disabled={isSubmitting}
              />
              <p className="text-[11px] text-slate-400">
                You can copy any student's UUID directly from the Admin Users directory.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminRoleSelect" className="text-xs font-bold text-slate-700">
                Select Administrative Role
              </Label>
              <select
                id="adminRoleSelect"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl text-xs font-bold"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !targetUserId.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Assigning Role...</span>
                  </>
                ) : (
                  <span>Grant Role</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!revokingMember} onOpenChange={(open) => { if (!open) setRevokingMember(null); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-rose-900 flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-rose-600" />
              <span>Revoke Administrative Access</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              Are you sure you want to revoke administrator privileges for{' '}
              <strong>{revokingMember?.profile?.display_name || revokingMember?.userId}</strong>?
              They will immediately lose access to the administrative dashboard.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokingMember(null)}
              className="rounded-xl text-xs font-bold"
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRevokeRole}
              disabled={isRevoking}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Revoking...</span>
                </>
              ) : (
                <span>Confirm Revocation</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
