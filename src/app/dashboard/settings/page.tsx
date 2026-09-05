'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertTriangle, 
  Building2, 
  CreditCard, 
  MessageSquare, 
  Check, 
  Mail, 
  Lock, 
  AtSign, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { toast } from '@/components/ui/toast';
import { getUserSettingsData, cancelUsernameChangeRequest, deleteUserAccount } from './actions';
import { requestUsernameChange } from '@/app/admin/actions';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pendingReq, setPendingReq] = useState<any>(null);

  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Username change state
  const [desiredUsername, setDesiredUsername] = useState('');
  const [usernameReason, setUsernameReason] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ checked: boolean; available: boolean; message: string }>({
    checked: false,
    available: false,
    message: ''
  });
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Bank details state
  const [bankName, setBankName] = useState('OPay');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bankLoading, setBankLoading] = useState(false);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete account state
  const [delLoading, setDelLoading] = useState(false);
  const [delPassword, setDelPassword] = useState('');
  const [delConfirmationText, setDelConfirmationText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadData = async () => {
    try {
      const data = await getUserSettingsData();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUserData(data.user);
      setProfile(data.profile);
      setPendingReq(data.pendingUsernameRequest);

      if (data.profile) {
        if (data.profile.bank_name) setBankName(data.profile.bank_name);
        if (data.profile.account_number) setAccountNumber(data.profile.account_number);
        if (data.profile.account_name) setAccountName(data.profile.account_name);
        if (data.profile.whatsapp_number) setWhatsappNumber(data.profile.whatsapp_number);
      }
    } catch (err) {
      console.error('Settings load error:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debounced username availability check
  useEffect(() => {
    const clean = desiredUsername.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus({ checked: false, available: false, message: '' });
      return;
    }
    if (clean.length < 5) {
      setUsernameStatus({ checked: true, available: false, message: 'Minimum 5 characters' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus({ checked: true, available: false, message: 'Alphanumeric and underscores only' });
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(clean)}`);
        const json = await res.json();
        setUsernameStatus({
          checked: true,
          available: json.available,
          message: json.message || (json.available ? 'Username available!' : 'Username taken')
        });
      } catch {
        setUsernameStatus({ checked: true, available: false, message: 'Error checking username' });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [desiredUsername]);

  // 1. Email Update Handler
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail === userData?.email) {
      toast.error('Please enter a new, valid email address.');
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success(
        'Verification link sent! Check both your current and new email address to confirm the change.',
        'Email Change Requested'
      );
      setShowEmailForm(false);
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request email change.');
    } finally {
      setEmailLoading(false);
    }
  };

  // 2. Username Change Request Handler
  const handleUsernameRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = desiredUsername.trim().toLowerCase();
    if (clean.length < 5 || !/^[a-zA-Z0-9_]{5,30}$/.test(clean)) {
      toast.error('Username must be 5-30 characters with letters, numbers, and underscores.');
      return;
    }
    if (usernameStatus.checked && !usernameStatus.available) {
      toast.error(usernameStatus.message || 'Selected username is not available.');
      return;
    }

    setUsernameLoading(true);
    try {
      const res = await requestUsernameChange(clean, usernameReason);
      if (!res.success) {
        throw new Error(res.error || 'Failed to submit username change request.');
      }
      toast.success('Your username change request has been submitted to platform administrators for review!');
      setDesiredUsername('');
      setUsernameReason('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting request');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleCancelUsernameReq = async () => {
    if (!pendingReq) return;
    try {
      const res = await cancelUsernameChangeRequest(pendingReq.id);
      if (!res.success) throw new Error(res.error);
      toast.success('Username change request cancelled.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request');
    }
  };

  // 3. Bank & Contact Details Update
  const handleBankUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userData) return;
    setBankLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          whatsapp_number: whatsappNumber,
        })
        .eq('user_id', userData.id);
      if (error) throw error;
      toast.success('Your direct bank transfer and WhatsApp details were saved!', 'Details Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update bank details.');
    } finally {
      setBankLoading(false);
    }
  };

  // 4. Password Update Handler
  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (!currentPassword) {
      toast.error('Please enter your current password to verify your identity.');
      return;
    }

    setPwdLoading(true);
    try {
      // Re-verify current password first
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: currentPassword
      });
      if (verifyError) {
        throw new Error('Current password is incorrect.');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success('Your password has been changed securely!', 'Password Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  // 5. Account Deletion Handler
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delConfirmationText.trim() !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }
    if (!delPassword) {
      toast.error('Please enter your password.');
      return;
    }

    setDelLoading(true);
    try {
      const res = await deleteUserAccount(delPassword);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete account.');
      }
      toast.success('Your account and associated data have been permanently deleted.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Error deleting account');
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <CustechLogoLoader mode="in-app" size="md" message="Loading your account security settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6 px-4 sm:px-0">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Account & Security</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your campus credentials, username, contact info, and security preferences.
        </p>
      </div>

      {/* 1. Email Address Card */}
      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Mail className="w-5 h-5 text-emerald-600" />
            Email Address
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Your primary login identifier and campus verification channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Email</p>
              <p className="text-sm font-semibold text-slate-900 font-mono mt-0.5">
                {userData?.email}
              </p>
            </div>
            {!showEmailForm && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEmailForm(true)}
                className="rounded-xl font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Change Email
              </Button>
            )}
          </div>

          {showEmailForm && (
            <form onSubmit={handleEmailUpdate} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label htmlFor="newEmail" className="text-xs font-bold text-slate-700">
                New Email Address
              </label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newstudent@custech.edu.ng"
                required
                className="h-10 rounded-xl bg-white border-slate-200 text-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                A verification link will be dispatched to confirm ownership of the new email address before updating.
              </p>
              <div className="flex gap-2 pt-1">
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={emailLoading} 
                  className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {emailLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Send Verification Link
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowEmailForm(false)}
                  className="rounded-xl text-xs text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 2. Controlled Username Changes Card (Requirement 4) */}
      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <AtSign className="w-5 h-5 text-emerald-600" />
            Username & Referral Handle
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Your handle serves as your public profile URL (<span className="font-mono">/user/@username</span>) and referral code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Username</p>
              <p className="text-base font-black text-emerald-600 font-mono mt-0.5">
                @{profile?.referral_code || 'not_set'}
              </p>
            </div>
            {profile?.referral_code && (
              <Badge variant="outline" className="text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                Active & Shareable
              </Badge>
            )}
          </div>

          {/* Pending Request Status */}
          {pendingReq ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Username Change Pending Admin Review</span>
                </div>
                <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-100/60 text-[10px] font-bold">
                  Under Review
                </Badge>
              </div>
              <p className="text-xs text-slate-700">
                You requested to change your username to <strong className="font-mono text-emerald-700">@{pendingReq.parsedDetails?.newUsername || 'new'}</strong>. Our administration team reviews change requests to prevent impersonation and fraud.
              </p>
              <div className="flex justify-end pt-1">
                <Button 
                  onClick={handleCancelUsernameReq} 
                  variant="outline" 
                  size="sm" 
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                >
                  Cancel Request
                </Button>
              </div>
            </div>
          ) : (
            /* New Request Form */
            <form onSubmit={handleUsernameRequest} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="desiredUsername" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Request New Username
                  </label>
                  <span className="text-[11px] text-slate-400">Min 5 chars, alphanumeric + _</span>
                </div>
                <div className="relative">
                  <Input
                    id="desiredUsername"
                    value={desiredUsername}
                    onChange={(e) => setDesiredUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. musa_tech"
                    maxLength={30}
                    className="h-10 pr-10 font-mono text-sm rounded-xl bg-white border-slate-200 text-slate-900"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {checkingUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : usernameStatus.checked ? (
                      usernameStatus.available ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )
                    ) : null}
                  </div>
                </div>
                {usernameStatus.checked && (
                  <p className={`text-[11px] font-medium ${usernameStatus.available ? 'text-emerald-600' : 'text-red-500'}`}>
                    {usernameStatus.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="usernameReason" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason for Change
                </label>
                <Input
                  id="usernameReason"
                  value={usernameReason}
                  onChange={(e) => setUsernameReason(e.target.value)}
                  placeholder="e.g. Correcting name or rebranding campus business"
                  className="h-10 text-xs rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={usernameLoading || !desiredUsername || (usernameStatus.checked && !usernameStatus.available)}
                className="rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white"
              >
                {usernameLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Submit Username Request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 3. Seller Bank & Contact Details */}
      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Seller Direct Bank & WhatsApp Contact
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Displayed on your item listings for direct bank transfers and WhatsApp communication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBankUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="bankName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank Name</label>
                <select
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="OPay">OPay</option>
                  <option value="Palmpay">Palmpay</option>
                  <option value="Kuda Bank">Kuda Bank</option>
                  <option value="Moniepoint">Moniepoint</option>
                  <option value="GTBank">GTBank (Guaranty Trust)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="Fidelity Bank">Fidelity Bank</option>
                  <option value="FCMB">FCMB</option>
                  <option value="Stanbic IBTC">Stanbic IBTC</option>
                  <option value="Wema Bank">Wema Bank (ALAT)</option>
                  <option value="Sterling Bank">Sterling Bank</option>
                  <option value="Union Bank">Union Bank</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="accountNumber" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Number (10 Digits)</label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0123456789"
                  maxLength={10}
                  className="h-10 font-mono text-sm rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="accountName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Name</label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Ibrahim Musa"
                  className="h-10 text-sm rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="whatsappNumber" className="text-xs font-bold text-slate-700 uppercase tracking-wider">WhatsApp Phone Line</label>
                <Input
                  id="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="080XXXXXXXX"
                  type="tel"
                  className="h-10 text-sm rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={bankLoading}
              className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {bankLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Save Payment & WhatsApp Details
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 4. Password Change (with Current Password check) */}
      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Lock className="w-5 h-5 text-emerald-600" />
            Change Password
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Verify your current password to set a new strong password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10 rounded-xl bg-white border-slate-200 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="h-10 rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="h-10 rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Must be at least 8 characters.</p>

            <Button 
              type="submit" 
              disabled={pwdLoading}
              className="rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              {pwdLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 5. Danger Zone: Delete Account */}
      <Card className="rounded-3xl border-red-200 bg-red-50/50 shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-700">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-xs text-red-600/80">
            Permanently delete your CUSTECH Marketplace profile, active listings, reviews, and login access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This action cannot be undone. Once deleted, all your active listings, hostel offers, saved items, and verified badges will be purged from the platform.
          </p>

          {!showDeleteModal ? (
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="destructive"
              size="sm"
              className="rounded-xl font-bold text-xs gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5" /> Request Account Deletion
            </Button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="p-4 rounded-2xl bg-white border border-red-200 space-y-4 shadow-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-700">
                  Type <span className="font-mono font-black">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <Input
                  value={delConfirmationText}
                  onChange={(e) => setDelConfirmationText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  required
                  className="h-10 font-mono text-sm border-red-300 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Enter Password:
                </label>
                <Input
                  type="password"
                  value={delPassword}
                  onChange={(e) => setDelPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 rounded-xl bg-white border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={delLoading || delConfirmationText !== 'DELETE MY ACCOUNT'}
                  className="rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {delLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Confirm Permanent Deletion
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
