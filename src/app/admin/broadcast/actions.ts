'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { checkAdminAccess, logAdminAction } from '@/lib/admin';
import { sendPromotionalEmail, sendBatchPromotionalBroadcast } from '@/lib/resend';
import { CampaignTemplate } from '@/lib/email-templates';

export type TargetAudience = 'all' | 'verified' | 'unverified' | 'sellers';

export interface BroadcastStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  sellersCount: number;
}

/**
 * Fetches audience counts for the broadcast hub
 */
export async function getBroadcastStatsAction(): Promise<BroadcastStats> {
  await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  // 1. Total users with email in profiles or auth
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // 2. Verified students
  const { count: verifiedUsers } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'approved');

  // 3. Sellers count
  const { count: sellersCount } = await adminClient
    .from('listings')
    .select('user_id', { count: 'exact', head: true });

  const total = totalUsers || 0;
  const verified = verifiedUsers || 0;

  return {
    totalUsers: total,
    verifiedUsers: verified,
    unverifiedUsers: Math.max(0, total - verified),
    sellersCount: sellersCount || 0,
  };
}

/**
 * Sends a single test copy to the admin's email so they can inspect it in their inbox
 */
export async function sendTestBroadcastAction({
  campaign,
  testEmail,
}: {
  campaign: CampaignTemplate;
  testEmail: string;
}) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const cleanEmail = testEmail.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid test email address.' };
  }

  const res = await sendPromotionalEmail({
    to: cleanEmail,
    displayName: 'Admin Preview',
    subject: `[TEST PREVIEW] ${campaign.subject}`,
    previewText: campaign.previewText,
    badge: campaign.badge,
    headline: campaign.headline,
    bodyParagraphs: campaign.bodyParagraphs,
    bulletPoints: campaign.bulletPoints,
    ctaText: campaign.ctaText,
    ctaUrl: campaign.ctaUrl,
    secondaryCtaText: campaign.secondaryCtaText,
    secondaryCtaUrl: campaign.secondaryCtaUrl,
  });

  if (res.success) {
    await logAdminAction(
      user.id,
      'send_test_email_broadcast',
      'email_campaign',
      campaign.id,
      { testEmail: cleanEmail, subject: campaign.subject }
    );
    return { success: true, message: `Test email sent successfully to ${cleanEmail}!` };
  }

  return { success: false, error: res.error || 'Failed to send test email.' };
}

/**
 * Sends live campaign to all selected campus users
 */
export async function sendLiveBroadcastAction({
  campaign,
  audience = 'all',
}: {
  campaign: CampaignTemplate;
  audience: TargetAudience;
}) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  // Fetch recipients based on selected audience
  let recipients: Array<{ email: string; displayName?: string }> = [];

  // Query profiles
  let query = adminClient
    .from('profiles')
    .select('user_id, display_name, email, verification_status');

  if (audience === 'verified') {
    query = query.eq('verification_status', 'approved');
  } else if (audience === 'unverified') {
    query = query.neq('verification_status', 'approved');
  }

  const { data: profiles, error: profileErr } = await query;

  if (profileErr) {
    return { success: false, error: profileErr.message };
  }

  // Also query auth.users so no user with an email is left out
  const { data: authData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const authUserMap = new Map<string, { email: string; displayName?: string }>();
  if (authData?.users) {
    for (const u of authData.users) {
      if (u.email) {
        authUserMap.set(u.id, {
          email: u.email,
          displayName: u.user_metadata?.display_name || u.user_metadata?.full_name || 'Student',
        });
      }
    }
  }

  // If audience is sellers, filter by users who have listings
  let sellerUserIds = new Set<string>();
  if (audience === 'sellers') {
    const { data: listings } = await adminClient.from('listings').select('user_id');
    if (listings) {
      listings.forEach((l) => sellerUserIds.add(l.user_id));
    }
  }

  // Build unique recipient list
  const seenEmails = new Set<string>();

  if (profiles) {
    for (const p of profiles) {
      if (audience === 'sellers' && !sellerUserIds.has(p.user_id)) {
        continue;
      }

      const email = p.email || authUserMap.get(p.user_id)?.email;
      if (email && !seenEmails.has(email.toLowerCase())) {
        seenEmails.add(email.toLowerCase());
        recipients.push({
          email: email.toLowerCase(),
          displayName: p.display_name || authUserMap.get(p.user_id)?.displayName || 'Student',
        });
      }
    }
  }

  // Fallback: If profile list was empty or missing emails, use auth users
  if (recipients.length === 0 && authData?.users) {
    for (const u of authData.users) {
      if (u.email && !seenEmails.has(u.email.toLowerCase())) {
        seenEmails.add(u.email.toLowerCase());
        recipients.push({
          email: u.email.toLowerCase(),
          displayName: u.user_metadata?.display_name || 'Student',
        });
      }
    }
  }

  if (recipients.length === 0) {
    return { success: false, error: 'No recipients found for the selected audience.' };
  }

  // Dispatch batch broadcast via Resend with delay to respect rate limits
  const result = await sendBatchPromotionalBroadcast({
    recipients,
    campaign: {
      subject: campaign.subject,
      previewText: campaign.previewText,
      badge: campaign.badge,
      headline: campaign.headline,
      bodyParagraphs: campaign.bodyParagraphs,
      bulletPoints: campaign.bulletPoints,
      ctaText: campaign.ctaText,
      ctaUrl: campaign.ctaUrl,
      secondaryCtaText: campaign.secondaryCtaText,
      secondaryCtaUrl: campaign.secondaryCtaUrl,
    },
    delayMs: 200,
  });

  // Log admin action
  await logAdminAction(
    user.id,
    'broadcast_email_campaign',
    'email_campaign',
    campaign.id,
    {
      audience,
      totalRecipients: result.total,
      sentCount: result.sent,
      failedCount: result.failed,
      subject: campaign.subject,
    }
  );

  return {
    success: true,
    total: result.total,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors,
    message: `Broadcast complete: ${result.sent} of ${result.total} emails sent successfully.`,
  };
}
