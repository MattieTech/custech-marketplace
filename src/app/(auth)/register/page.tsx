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
import { linkNewUserReferral } from './actions';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: displayName.trim(),
            display_name: displayName.trim(),
            username: cleanUsername,
            referral_code: cleanUsername,
            referrer: referralCode.trim() || null
          }
        }
      });

      if (authError) throw new Error(authError.message);

      if (data.user) {
        // Link referral & ensure profile username is persisted immediately
        await linkNewUserReferral({
          userId: data.user.id,
          username: cleanUsername,
          displayName: displayName.trim(),
          referrerCode: referralCode.trim() || undefined
        });
      }

      toast.success('Account created! Please check your email inbox to verify your account.', 'Registration Successful');
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || 'An error occurred during registration.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full border-white/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto shadow-inner border border-green-100 dark:border-green-800">
            <Mail className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Check Your Email</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            We've sent a verification link to <strong className="text-zinc-800 dark:text-zinc-200">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
            Click the link in your email to activate your CUSTECH Marketplace account and your unique profile <span className="font-mono font-semibold text-green-600">@{username.toLowerCase()}</span>.
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/login')} 
            className="w-full mt-4 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
          >
            Proceed to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-white/40 dark:border-zinc-800/60 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500" />
      <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Student Community</span>
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 pt-1">
          Create Account
        </CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
          Join Confluence University verified campus marketplace
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 text-xs text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
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
              className="h-11 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Username (Mandatory, Min 5 chars, becomes referral code & public profile) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="username" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                Username & Referral ID
              </label>
              <span className="text-[11px] text-zinc-400">Min 5 chars</span>
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
                className="h-11 pr-10 rounded-xl font-mono text-sm bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 focus:ring-2 focus:ring-green-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                {checkingUsername ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                ) : usernameStatus.checked ? (
                  usernameStatus.available ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )
                ) : null}
              </div>
            </div>
            {usernameStatus.checked && (
              <p className={`text-[11px] font-medium ${usernameStatus.available ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {usernameStatus.message}
              </p>
            )}
            <p className="text-[11px] text-zinc-400">
              Doubles as your shareable referral link: <span className="font-mono text-zinc-500">custech.market/register?ref={username || 'yourname'}</span>
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
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
              className="h-11 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
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
                className="h-11 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
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
                className="h-11 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">Must be at least 8 characters.</p>

          {/* Referral Code (Optional or from invite) */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="referralCode" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-500" />
              Referrer Username (Optional)
            </label>
            <Input 
              id="referralCode" 
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="e.g. campusleader" 
              disabled={loading} 
              className="h-11 rounded-xl font-mono text-sm bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 focus:ring-2 focus:ring-green-500"
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
              className="mt-0.5 rounded border-zinc-300 text-green-600 focus:ring-green-600 h-4 w-4" 
            />
            <label htmlFor="agreeTerms" className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-tight">
              I agree to the <Link href="/terms" className="text-green-600 hover:underline font-semibold">Terms & Conditions</Link>, <Link href="/privacy" className="text-green-600 hover:underline font-semibold">Privacy Policy</Link>, and Campus Safety Rules.
            </label>
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full h-11 bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all mt-3" 
            disabled={loading || (usernameStatus.checked && !usernameStatus.available)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create CUSTECH Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800/80 p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Already registered?{' '}
          <Link href="/login" className="text-green-600 dark:text-green-400 hover:underline font-bold">
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
      <div className="p-8 text-center text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
