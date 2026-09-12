'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, AtSign, ShieldCheck, Sparkles, User, Mail, Lock, Gift } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { registerUserAction, resendConfirmationEmailAction } from './actions';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form inputs
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Username status
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  }>({ checked: false, available: false, message: '' });

  // Populate referral code from URL query param if present
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.trim());
    }
  }, [searchParams]);

  // Debounced username check
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setUsernameStatus({ checked: false, available: false, message: '' });
      return;
    }

    if (cleanUsername.length < 5) {
      setUsernameStatus({
        checked: true,
        available: false,
        message: 'Must be at least 5 characters'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setUsernameStatus({
        checked: true,
        available: false,
        message: 'Letters, numbers, and underscores only'
      });
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(cleanUsername)}`);
        const data = await res.json();
        setUsernameStatus({
          checked: true,
          available: data.available,
          message: data.message || (data.available ? 'Username available!' : 'Username taken')
        });
      } catch (err) {
        setUsernameStatus({
          checked: true,
          available: false,
          message: 'Error verifying username'
        });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 5) {
      const msg = 'Username must be at least 5 characters.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      const msg = 'Username can only contain letters, numbers, and underscores.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (usernameStatus.checked && !usernameStatus.available) {
      const msg = usernameStatus.message || 'Please choose a valid and available username.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!agreeTerms) {
      const msg = 'You must agree to the Terms & Conditions.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      const msg = 'Full name must be between 2 and 50 characters.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await registerUserAction({
        displayName: displayName.trim(),
        username: cleanUsername,
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || 'Registration failed.');
      }

      toast.success('Account created! Verification email sent.');
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || 'An error occurred during registration.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await resendConfirmationEmailAction(email.trim());
      if (res.success) {
        toast.success('Confirmation email resent! Please check your inbox & spam folder.');
      } else {
        toast.error(res.error || 'Failed to resend email.');
      }
    } catch {
      toast.error('Could not resend email right now. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full border-slate-200/80 bg-white shadow-sm rounded-3xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500" />
        <CardHeader className="text-center pb-2 pt-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Check Your Email</CardTitle>
          <CardDescription className="text-slate-500">
            Confirmation email sent to <strong className="text-slate-800">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
          <p className="text-sm text-slate-600 max-w-sm">
            We sent a verification link to your email. Click the button in your email to confirm your account and open your dashboard.
          </p>

          <div className="w-full pt-2 space-y-2.5">
            <Button 
              variant="outline" 
              onClick={handleResend}
              disabled={resending}
              className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-600" />
                  Resending Confirmation Email...
                </>
              ) : (
                'Resend Confirmation Email'
              )}
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => {
                window.location.assign('/login');
              }} 
              className="w-full rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Proceed to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-slate-200/80 bg-white shadow-sm rounded-3xl overflow-hidden">
      <div className="h-1.5 bg-emerald-500" />
      <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Student Community</span>
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 pt-1">
          Create Account
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          Join Confluence University verified campus marketplace
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Full Name
            </label>
            <Input 
              id="displayName" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ibrahim Musa" 
              required 
              disabled={loading} 
              minLength={2} 
              maxLength={50} 
              className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Username (Mandatory, Min 5 chars, becomes referral code & public profile) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="username" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-emerald-600" />
                Username & Referral ID
              </label>
              <span className="text-[11px] text-slate-400">Min 5 chars</span>
            </div>
            <div className="relative">
              <Input 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="choose_username" 
                required 
                disabled={loading} 
                minLength={5} 
                maxLength={30} 
                className="h-11 pr-10 rounded-xl font-mono text-sm bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
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
            <p className="text-[11px] text-slate-400">
              Doubles as your shareable referral link: <span className="font-mono text-slate-500">custech.market/register?ref={username || 'yourname'}</span>
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@custech.edu.ng" 
              required 
              disabled={loading} 
              className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={loading} 
                minLength={8} 
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Confirm
              </label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={loading} 
                minLength={8} 
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Must be at least 8 characters.</p>

          {/* Referral Code (Optional or from invite) */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="referralCode" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-500" />
              Referrer Username (Optional)
            </label>
            <Input 
              id="referralCode" 
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="e.g. campusleader" 
              disabled={loading} 
              className="h-11 rounded-xl font-mono text-sm bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start space-x-2.5 pt-2">
            <input 
              type="checkbox" 
              id="agreeTerms" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required 
              disabled={loading} 
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 h-4 w-4" 
            />
            <label htmlFor="agreeTerms" className="text-xs font-medium text-slate-600 leading-tight">
              I agree to the <Link href="/terms" className="text-emerald-600 hover:underline font-semibold">Terms & Conditions</Link>, <Link href="/privacy" className="text-emerald-600 hover:underline font-semibold">Privacy Policy</Link>, and Campus Safety Rules.
            </label>
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-xl shadow-xs transition-all mt-3" 
            disabled={loading || (usernameStatus.checked && !usernameStatus.available)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create CUSTECH Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 p-4 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-emerald-600 hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
