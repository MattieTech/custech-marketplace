'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validations/auth'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) throw new Error(authError.message)
      
      toast.success('Signed in successfully! Welcome back.')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
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
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium">
              {error}
            </div>
          )}
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
            Sign In to CUSTECH
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
