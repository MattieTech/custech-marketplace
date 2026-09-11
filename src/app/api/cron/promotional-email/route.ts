import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBatchPromotionalBroadcast } from '@/lib/resend';
import { PRESET_EMAIL_CAMPAIGNS } from '@/lib/email-templates';

import crypto from 'crypto';

function timingSafeMatch(provided: string | null | undefined, secret: string): boolean {
  if (!provided) return false;
  const provBuf = Buffer.from(provided);
  const secBuf = Buffer.from(secret);
  if (provBuf.length !== secBuf.length) return false;
  return crypto.timingSafeEqual(provBuf, secBuf);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    // Fail closed: Require valid CRON_SECRET configuration and match
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const isAuthorized = cronSecret && (
      timingSafeMatch(secret, cronSecret) || 
      timingSafeMatch(bearerToken, cronSecret)
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
    }

    const adminClient = await createAdminClient();

    // Query active registered students from auth.users
    const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    // Query profiles for display names
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('user_id, display_name');

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

    // Build recipient list
    const recipients = (authData?.users || [])
      .filter((u) => u.email && u.email.includes('@'))
      .map((u) => ({
        email: u.email!.toLowerCase().trim(),
        displayName: profileMap.get(u.id) || u.user_metadata?.display_name || u.user_metadata?.full_name || 'Student',
      }));

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No recipients available for broadcast.' }, { status: 200 });
    }

    // Select a rotating campaign based on current week or random
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const templateIndex = dayOfYear % PRESET_EMAIL_CAMPAIGNS.length;
    const campaign = PRESET_EMAIL_CAMPAIGNS[templateIndex];

    // Dispatch batch emails via Resend
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
      delayMs: 250,
    });

    return NextResponse.json({
      success: true,
      campaignSent: campaign.name,
      totalRecipients: result.total,
      sent: result.sent,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cron Promotional Email Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
