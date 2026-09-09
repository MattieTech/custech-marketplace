import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBatchPromotionalBroadcast } from '@/lib/resend';
import { PRESET_EMAIL_CAMPAIGNS } from '@/lib/email-templates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    // Verify secret if CRON_SECRET is configured
    if (cronSecret && secret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
    }

    const adminClient = await createAdminClient();

    // Query active registered students with valid emails
    const { data: profiles, error: profileErr } = await adminClient
      .from('profiles')
      .select('email, display_name')
      .not('email', 'is', null);

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // Build recipient list
    const recipients = (profiles || [])
      .filter((p) => p.email && p.email.includes('@'))
      .map((p) => ({
        email: p.email.toLowerCase().trim(),
        displayName: p.display_name || 'Student',
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
