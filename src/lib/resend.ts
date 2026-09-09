import { Resend } from 'resend';

// Initialize Resend client if API key is present
const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address: Use custom domain or Resend free tier testing address
export const DEFAULT_FROM_EMAIL = 
  process.env.RESEND_FROM_EMAIL || 'CUSTECH Marketplace <onboarding@resend.dev>';

interface SendVerificationEmailParams {
  to: string;
  displayName: string;
  verificationUrl: string;
  otpCode?: string;
}

/**
 * Sends a CUSTECH Marketplace branded email confirmation via Resend
 */
export async function sendVerificationEmail({
  to,
  displayName,
  verificationUrl,
  otpCode,
}: SendVerificationEmailParams) {
  const subject = 'Confirm your CUSTECH Marketplace Account';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your CUSTECH Account</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #1e293b;
    }
    .container {
      max-width: 580px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #d1fae5;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #059669;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 800;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 14px;
      box-shadow: 0 4px 8px rgba(5, 150, 105, 0.25);
    }
    .otp-box {
      background-color: #f0fdf4;
      border: 1px dashed #86efac;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #166534;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 6px;
      color: #047857;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
    .link-fallback {
      font-size: 11px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Official Campus Hub</span>
      <h1>CUSTECH Marketplace</h1>
      <p>Confluence University of Science & Technology</p>
    </div>

    <div class="content">
      <h2 class="greeting">Hello ${displayName || 'Student'},</h2>
      <p class="text">
        Welcome to the official <strong>CUSTECH Marketplace</strong>. You are just one step away from buying, selling, finding campus hostels, and connecting safely with verified peers.
      </p>
      
      <p class="text">
        Please click the button below to verify your email address and activate your account:
      </p>

      <div class="button-container">
        <a href="${verificationUrl}" class="button" target="_blank">
          Confirm Email Address →
        </a>
      </div>

      ${otpCode ? `
      <div class="otp-box">
        <div class="otp-label">Or enter this 6-digit verification code:</div>
        <div class="otp-code">${otpCode}</div>
      </div>
      ` : ''}

      <div class="link-fallback">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #059669;">${verificationUrl}</a>
      </div>
    </div>

    <div class="footer">
      <p>
        This email was sent to ${to} for account verification on the CUSTECH Campus Marketplace.<br>
        If you did not request this account, you can safely ignore this email.
      </p>
      <p>© ${new Date().getFullYear()} CUSTECH Marketplace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (response.error) {
        console.error('[Resend Error]:', response.error);
        return { success: false, error: response.error.message, link: verificationUrl };
      }

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error('[Resend Send Exception]:', err);
      return { success: false, error: err.message, link: verificationUrl };
    }
  }

  // Fallback
  console.log('====================================================');
  console.log('[Resend Mock Mode - RESEND_API_KEY not configured]');
  console.log(`To: ${to}`);
  console.log(`Confirmation Link: ${verificationUrl}`);
  if (otpCode) console.log(`OTP Code: ${otpCode}`);
  console.log('====================================================');

  return {
    success: true,
    mock: true,
    message: 'Resend API key missing in environment. Verification link logged to console.',
    link: verificationUrl,
  };
}

// =========================================================================
// PROMOTIONAL & BROADCAST AUTOMATION SYSTEM
// =========================================================================

export interface PromotionalEmailPayload {
  to: string;
  displayName?: string;
  subject: string;
  previewText?: string;
  badge: string;
  headline: string;
  bodyParagraphs: string[];
  bulletPoints?: string[];
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

/**
 * Generates responsive, high-converting CUSTECH email HTML for promotional broadcasts
 */
export function generatePromotionalHtml({
  displayName,
  previewText,
  badge,
  headline,
  bodyParagraphs,
  bulletPoints,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
}: Omit<PromotionalEmailPayload, 'to' | 'subject'>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://custech.market';
  const fullCtaUrl = ctaUrl.startsWith('http') ? ctaUrl : `${siteUrl}${ctaUrl}`;
  const fullSecondaryUrl = secondaryCtaUrl 
    ? (secondaryCtaUrl.startsWith('http') ? secondaryCtaUrl : `${siteUrl}${secondaryCtaUrl}`)
    : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 0;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 12px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #047857 0%, #064e3b 100%);
      padding: 40px 32px 36px;
      text-align: center;
      color: #ffffff;
      position: relative;
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.25);
      border: 1px solid rgba(52, 211, 153, 0.4);
      color: #a7f3d0;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 14px;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      line-height: 1.2;
      color: #ffffff;
    }
    .header-sub {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #a7f3d0;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px 28px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 800;
      color: #047857;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 14.5px;
      line-height: 1.65;
      color: #334155;
      margin-bottom: 16px;
    }
    .highlight-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 18px;
      padding: 22px 24px;
      margin: 28px 0;
    }
    .highlight-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #166534;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .bullet-list {
      margin: 0;
      padding: 0;
      list-style-type: none;
    }
    .bullet-item {
      font-size: 13.5px;
      line-height: 1.5;
      color: #14532d;
      padding: 6px 0;
      font-weight: 600;
      display: flex;
      align-items: center;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 18px;
    }
    .primary-btn {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 800;
      text-decoration: none;
      padding: 15px 38px;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
      letter-spacing: 0.2px;
    }
    .secondary-link {
      display: block;
      margin-top: 14px;
      font-size: 13px;
      font-weight: 700;
      color: #047857;
      text-decoration: underline;
    }
    .safety-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 12px;
      padding: 12px 16px;
      margin-top: 24px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.45;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      font-size: 11.5px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    .footer a {
      color: #047857;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="badge">${badge || 'CAMPUS MARKET DROP'}</span>
        <h1>${headline}</h1>
        <p class="header-sub">Confluence University of Science & Technology Official Marketplace</p>
      </div>

      <div class="content">
        <div class="greeting">Hey ${displayName || 'Campus Scholar'} 👋,</div>
        
        ${bodyParagraphs.map(p => `<p class="paragraph">${p}</p>`).join('')}

        ${bulletPoints && bulletPoints.length > 0 ? `
        <div class="highlight-card">
          <div class="highlight-title">⭐ What's Popping Right Now</div>
          <ul class="bullet-list">
            ${bulletPoints.map(b => `<li class="bullet-item">${b}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="btn-container">
          <a href="${fullCtaUrl}" class="primary-btn" target="_blank">
            ${ctaText}
          </a>
          ${fullSecondaryUrl && secondaryCtaText ? `
          <a href="${fullSecondaryUrl}" class="secondary-link" target="_blank">
            ${secondaryCtaText} →
          </a>
          ` : ''}
        </div>

        <div class="safety-banner">
          🛡️ <strong>Campus Safety Reminder:</strong> Always inspect items and lodge keys in daylight public campus safe zones before making direct transfers. Trade safely!
        </div>
      </div>

      <div class="footer">
        <p>
          You are receiving this campus marketplace update because you have an account on 
          <a href="${siteUrl}">CUSTECH Marketplace</a>.
        </p>
        <p>
          Confluence University of Science and Technology (CUSTECH), Osara, Kogi State, Nigeria.<br>
          © ${new Date().getFullYear()} CUSTECH Campus Marketplace. Made for students, by students.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends a promotional email to a single user
 */
export async function sendPromotionalEmail(payload: PromotionalEmailPayload) {
  const html = generatePromotionalHtml(payload);

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: [payload.to],
        subject: payload.subject,
        html,
      });

      if (response.error) {
        console.error('[Resend Promo Error]:', response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error('[Resend Promo Exception]:', err);
      return { success: false, error: err.message };
    }
  }

  console.log(`[Resend Mock Promo] Sent "${payload.subject}" to ${payload.to}`);
  return { success: true, mock: true };
}

/**
 * Batch broadcasts a promotional email to multiple users with rate-limit delays
 */
export async function sendBatchPromotionalBroadcast({
  recipients,
  campaign,
  delayMs = 150,
}: {
  recipients: Array<{ email: string; displayName?: string }>;
  campaign: Omit<PromotionalEmailPayload, 'to' | 'displayName'>;
  delayMs?: number;
}) {
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    if (!recipient.email || !recipient.email.includes('@')) {
      continue;
    }

    const res = await sendPromotionalEmail({
      ...campaign,
      to: recipient.email,
      displayName: recipient.displayName || 'Student',
    });

    if (res.success) {
      sentCount++;
    } else {
      failedCount++;
      if (res.error && errors.length < 5) {
        errors.push(`${recipient.email}: ${res.error}`);
      }
    }

    // Small delay to prevent hitting Resend free tier burst rate limits
    if (delayMs > 0 && recipients.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    total: recipients.length,
    sent: sentCount,
    failed: failedCount,
    errors,
  };
}
