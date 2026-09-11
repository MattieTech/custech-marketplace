'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Search, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  UserCheck, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { onboardNewAdmin, searchPotentialAdmins, assignAdminRole } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', badge: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'Total system access, logs, fee waivers & roles' },
  { value: 'verification_officer', label: 'Verification Officer', badge: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Review student ID cards & manual verifications' },
  { value: 'finance_admin', label: 'Finance Admin', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Escrow oversight, dispute payouts & wallet transfers' },
  { value: 'moderator', label: 'Moderator', badge: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Review scam reports, take down items, feature listings' },
  { value: 'support_agent', label: 'Support Agent', badge: 'bg-slate-100 text-slate-800 border-slate-200', desc: 'Assist students with orders and mediate open disputes' },
];

function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pass = 'Admin_';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass + '2026!';
}

interface OnboardAdminDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function OnboardAdminDialog({ trigger, onSuccess }: OnboardAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'create' | 'promote'>('create');

  // Create Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generateSecurePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('moderator');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success State for display credentials
  const [createdResult, setCreatedResult] = useState<{
    email: string;
    password: string | null;
    role: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Promote Existing State
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [promoteRole, setPromoteRole] = useState('moderator');
  const [promoting, setPromoting] = useState(false);

  const handleRegeneratePassword = () => {
    setPassword(generateSecurePassword());
    toast.info('New secure password generated.');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full legal name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await onboardNewAdmin({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        department: department.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined
      });

      if (!res.success) {
        setError(res.error || 'Failed to onboard administrator.');
        toast.error(res.error || 'Onboarding failed.');
        return;
      }

      toast.success(res.message || 'Admin onboarded successfully', 'Admin Onboarded');
      setCreatedResult({
        email: res.email || email,
        password: res.password || null,
        role: res.role || role,
        message: res.message || 'Admin onboarded successfully'
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      toast.error(err.message || 'Onboarding error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const results = await searchPotentialAdmins(searchTerm.trim());
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('No registered users found matching that query.');
      }
    } catch (err: any) {
      toast.error('Search failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handlePromoteSubmit = async () => {
    if (!selectedUser) return;
    setPromoting(true);
    try {
      await assignAdminRole(selectedUser.userId, promoteRole);
      toast.success(`${selectedUser.displayName} elevated to ${promoteRole.replace('_', ' ')}!`, 'Role Assigned');
      setOpen(false);
      resetState();
      if (onSuccess) onSuccess();
      else window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    } finally {
      setPromoting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `CUSTECH Marketplace Administrator Access:\nEmail: ${createdResult.email}\nPassword: ${createdResult.password || '(User already has an established password)'}\nRole: ${createdResult.role.replace('_', ' ')}\nLogin URL: ${window.location.origin}/login?redirect=/admin`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const resetState = () => {
    setFullName('');
    setEmail('');
    setPassword(generateSecurePassword());
    setRole('moderator');
    setDepartment('');
    setPhoneNumber('');
    setError(null);
    setCreatedResult(null);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl shadow-sm hover:shadow">
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Admin</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-slate-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Onboard Platform Administrator
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                Grant institutional management duties with pre-verified privileges and custom roles.
              </DialogDescription>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {!createdResult && (
            <div className="flex rounded-xl bg-white/10 p-1 mt-5 gap-1 border border-white/10">
              <button
                type="button"
                onClick={() => { setTab('create'); setError(null); }}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'create'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Admin Account</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('promote'); setError(null); }}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'promote'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Promote Existing User</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* SUCCESS CREDENTIALS DISPLAY */}
          {createdResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Administrator Onboarded Successfully</h4>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    {createdResult.message}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider font-sans font-bold">Account Credentials</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-sans font-semibold">Ready to Login</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white font-bold">{createdResult.email}</span>
                  </div>
                  {createdResult.password && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Password:</span>
                      <span className="text-emerald-400 font-bold">{createdResult.password}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Role:</span>
                    <span className="text-purple-300 font-bold uppercase text-[11px]">{createdResult.role.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Portal URL:</span>
                    <span className="text-slate-300">/admin</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleCopyCredentials}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold py-2.5 rounded-xl gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Login Details'}</span>
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { resetState(); setTab('create'); }}
                  className="text-xs font-semibold"
                >
                  Onboard Another
                </Button>
                <Button
                  onClick={() => { setOpen(false); window.location.reload(); }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Close & Refresh
                </Button>
              </div>
            </div>
          ) : tab === 'create' ? (
            /* TAB 1: CREATE NEW ADMIN */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Dr. Matthew Aliu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Official Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="staff@custech.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Administrative Role *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        role === r.value
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="adminRole"
                          value={r.value}
                          checked={role === r.value}
                          onChange={(e) => setRole(e.target.value)}
                          className="text-emerald-600 focus:ring-emerald-500 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{r.label}</span>
                          <span className="text-[11px] text-slate-500 block leading-tight">{r.desc}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badge}`}>
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password Configuration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Initial Account Password</span>
                  </Label>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl text-xs h-10 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  The new administrator can change this password anytime from their profile settings.
                </p>
              </div>

              {/* Optional Department and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Department / Office (Optional)</Label>
                  <Input
                    placeholder="e.g. Student Affairs"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Official Phone (Optional)</Label>
                  <Input
                    placeholder="08012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-5 gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Onboarding Admin...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create & Onboard Admin</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* TAB 2: PROMOTE EXISTING USER */
            <div className="space-y-4">
              <form onSubmit={handleSearchUsers} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search by student name, email, or matric number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-xl text-xs h-10 pl-9"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={searching || !searchTerm.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </Button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Select User to Promote:</Label>
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.userId}
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className={`w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          selectedUser?.userId === u.userId ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : ''
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{u.displayName}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                        <div className="text-right">
                          {u.existingRole ? (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                              Current: {u.existingRole.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              Regular Student
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Selected: {selectedUser.displayName}</p>
                      <p className="text-[11px] text-slate-500">{selectedUser.email}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                      Ready to Assign
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Select New Role:</Label>
                    <select
                      value={promoteRole}
                      onChange={(e) => setPromoteRole(e.target.value)}
                      className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs font-semibold rounded-xl"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={handlePromoteSubmit}
                      disabled={promoting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-2 shadow-sm"
                    >
                      {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Assign {promoteRole.replace('_', ' ')}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
