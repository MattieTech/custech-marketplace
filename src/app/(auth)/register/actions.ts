'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { sendVerificationEmail } from '@/lib/resend';

export interface RegisterUserInput {
  displayName: string;
  username: string;
  email: string;
  password: string;
  referralCode?: string;
}

export async function linkNewUserReferral({
  userId,
  username,
  displayName,
  referrerCode
}: {
  userId: string;
  username: string;
  displayName: string;
  referrerCode?: string;
}) {
  try {
    const admin = await createAdminClient();
    const cleanUsername = username.trim().toLowerCase();

    // 1. Ensure profile has the chosen username as referral_code and username
    const updatePayload: Record<string, any> = {
      referral_code: cleanUsername,
      display_name: displayName.trim(),
    };

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        ...updatePayload,
        username: cleanUsername
      })
      .eq('user_id', userId);

    if (profileError) {
      console.warn('Profile update with username warning, retrying base payload:', profileError.message);
      await admin
        .from('profiles')
        .update(updatePayload)
        .eq('user_id', userId);
    }

    // 2. If referrer code provided, link referral
    if (referrerCode && referrerCode.trim()) {
      const cleanRef = referrerCode.trim().toLowerCase();
      
      // Find referrer user ID
      const { data: referrerProfile } = await admin
        .from('profiles')
        .select('user_id, referral_code')
        .ilike('referral_code', cleanRef)
        .maybeSingle();

      if (referrerProfile && referrerProfile.user_id !== userId) {
        // Insert into referrals table
        await admin
          .from('referrals')
          .insert({
            referrer_id: referrerProfile.user_id,
            referred_user_id: userId,
            referral_code: cleanRef,
            status: 'pending',
            reward_amount: 50000 // 500 NGN
          })
          .select()
          .maybeSingle();
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('linkNewUserReferral error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Register a new CUSTECH student/user and send a confirmation email via Resend
 * instead of Supabase's default mailer.
 */
export async function registerUserAction(input: RegisterUserInput) {
  try {
    const displayName = input.displayName?.trim();
    const username = input.username?.trim().toLowerCase();
    const email = input.email?.trim().toLowerCase();
    const password = input.password;
    const referralCode = input.referralCode?.trim().toLowerCase();

    // Basic server-side validations
    if (!displayName || displayName.length < 2 || displayName.length > 50) {
      return { success: false, error: 'Full name must be between 2 and 50 characters.' };
    }

    if (!username || username.length < 5 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, error: 'Username must be at least 5 alphanumeric characters or underscores.' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    const admin = await createAdminClient();

    // Check if username is already taken in profiles (checks referral_code and username)
    const { data: existingByRef } = await admin
      .from('profiles')
      .select('id')
      .ilike('referral_code', username)
      .maybeSingle();

    if (existingByRef) {
      return { success: false, error: 'Username is already in use. Please choose another.' };
    }

    const { data: existingByCol } = await admin
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (existingByCol) {
      return { success: false, error: 'Username is already in use. Please choose another.' };
    }

    // Determine site URL for callback redirection
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = `${siteUrl}/callback?next=/dashboard`;

    // 1. Generate signup confirmation link via Supabase Admin without sending Supabase email
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: {
          full_name: displayName,
          display_name: displayName,
          username,
          referral_code: username,
          referrer: referralCode || null
        },
        redirectTo
      }
    });

    if (linkError) {
      if (linkError.message.includes('already registered')) {
        return { success: false, error: 'An account with this email address already exists. Please sign in.' };
      }
      return { success: false, error: linkError.message };
    }

    const userId = linkData.user?.id;
    if (!userId) {
      return { success: false, error: 'Failed to create user account. Please try again.' };
    }

    // 2. Link referral & initialize profile
    await linkNewUserReferral({
      userId,
      username,
      displayName,
      referrerCode: referralCode
    });

    // 3. Construct direct application verification link using token hash
    const hashedToken = linkData.properties?.hashed_token;
    const otpCode = linkData.properties?.email_otp;
    const verificationUrl = hashedToken 
      ? `${siteUrl}/callback?token_hash=${hashedToken}&type=signup&next=/dashboard`
      : linkData.properties?.action_link || redirectTo;

    // 4. Send branded confirmation email via Resend
    const sendResult = await sendVerificationEmail({
      to: email,
      displayName,
      verificationUrl,
      otpCode
    });

    return {
      success: true,
      userId,
      email,
      emailSent: sendResult.success,
      verificationUrl,
      isMock: (sendResult as any).mock,
      message: 'Account created! Verification email sent.'
    };
  } catch (err: any) {
    console.error('[registerUserAction Error]:', err);
    return { success: false, error: err.message || 'An unexpected registration error occurred.' };
  }
}

/**
 * Resend confirmation email via Resend for an unconfirmed user
 */
export async function resendConfirmationEmailAction(email: string) {
  try {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Invalid email address.' };
    }

    const admin = await createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = `${siteUrl}/callback?next=/dashboard`;

    // Generate link for confirmation
    const { data: magicLink, error: magicErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: { redirectTo }
    });

    if (magicErr) {
      return { success: false, error: magicErr.message };
    }

    const linkData = magicLink;

    const hashedToken = linkData.properties?.hashed_token;
    const otpCode = linkData.properties?.email_otp;
    const verificationType = linkData.properties?.verification_type || 'signup';
    const verificationUrl = hashedToken 
      ? `${siteUrl}/callback?token_hash=${hashedToken}&type=${verificationType}&next=/dashboard`
      : linkData.properties?.action_link || redirectTo;

    // Fetch display name from profile if available
    let displayName = 'Student';
    if (linkData.user?.id) {
      const { data: profile } = await admin
        .from('profiles')
        .select('display_name')
        .eq('user_id', linkData.user.id)
        .maybeSingle();
      if (profile?.display_name) displayName = profile.display_name;
    }

    const sendResult = await sendVerificationEmail({
      to: cleanEmail,
      displayName,
      verificationUrl,
      otpCode
    });

    return {
      success: true,
      emailSent: sendResult.success,
      message: 'Confirmation email resent! Please check your inbox and spam folder.'
    };
  } catch (err: any) {
    console.error('[resendConfirmationEmailAction Error]:', err);
    return { success: false, error: err.message || 'Failed to resend confirmation email.' };
  }
}
