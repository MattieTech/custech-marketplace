'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MailCheck, AlertCircle } from 'lucide-react'
import { resendConfirmationEmailAction } from '../register/actions'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
  
  // Show message if redirected from callback failure
  const callbackError = searchParams.get('error')
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setUnconfirmedEmail(null)
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = formData.get('password') as string
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed') || 
            authError.message.toLowerCase().includes('not confirmed')) {
          setUnconfirmedEmail(email)
          throw new Error('Please confirm your email address before signing in. Check your email for the confirmation link sent via Resend.')
        }
        throw new Error(authError.message)
      }
      
      toast.success('Signed in successfully! Redirecting to dashboard...')
      
      // Immediate direct redirect to dashboard
      const nextDestination = searchParams.get('redirect') || searchParams.get('next') || '/dashboard'
      window.location.assign(nextDestination)
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.'
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!unconfirmedEmail) return
    setResending(true)
    try {
      const res = await resendConfirmationEmailAction(unconfirmedEmail)
      if (res.success) {
        toast.success('Confirmation email resent via Resend! Please check your inbox.')
      } else {
        toast.error(res.error || 'Failed to resend confirmation email.')
      }
    } catch {
      toast.error('Unable to resend email right now. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <Card className="w-full border-slate-200/80 bg-white shadow-sm rounded-3xl overflow-hidden">
      <div className="h-1.5 bg-emerald-500" />
      <CardHeader className="space-y-1.5 text-center pb-2 pt-6">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Sign in to your verified CUSTECH student account
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {callbackError && (
          <div className="mb-4 p-3.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Verification link has expired or was invalid. You can request a fresh confirmation link below.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium space-y-2">
            <p>{error}</p>
            {unconfirmedEmail && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={resending}
                className="w-full text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 mt-1"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Resending via Resend...
                  </>
                ) : (
                  <>
                    <MailCheck className="w-3.5 h-3.5 mr-1.5" />
                    Resend Confirmation Email via Resend
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="student@custech.edu.ng" 
              required 
              disabled={loading} 
              className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              disabled={loading} 
              className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xs transition-all mt-2" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Signing in & Redirecting...' : 'Sign In to CUSTECH'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 p-4 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-emerald-600 hover:underline font-bold">
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
