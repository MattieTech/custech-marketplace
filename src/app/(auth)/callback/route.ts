import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'
import { sendWelcomeAndReferralFollowupEmail } from '@/lib/resend'
import { sanitizeRedirectPath } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = (searchParams.get('type') as EmailOtpType) || 'signup'
  const next = sanitizeRedirectPath(searchParams.get('next'), '/dashboard')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored if handled by middleware
          }
        },
      },
    }
  )

  // 1. Handle Resend email confirmation token hash
  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (!error) {
      // Send automated Welcome, ID Verification & Refer-and-Earn follow-up in background
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          sendWelcomeAndReferralFollowupEmail({
            to: user.email,
            displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || 'Student',
            username: user.user_metadata?.username || 'student',
            referralCode: user.user_metadata?.referral_code || user.user_metadata?.username,
          }).catch(e => console.error('[Followup Email Error]:', e))
        }
      } catch (err) {
        console.error('[User Fetch Error in Callback]:', err)
      }

      // Successfully confirmed email & established session -> redirect to dashboard immediately
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[Callback Error verifyOtp]:', error.message)
  }

  // 2. Handle PKCE authorization code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[Callback Error exchangeCodeForSession]:', error.message)
  }

  // If verification failed or expired, redirect to login with notification
  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
