import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize SMTP transporter if configured (e.g. Free Gmail SMTP)
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || '465');
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

export const smtpTransporter = (smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

// Initialize Resend client if API key is present
const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address: Prefer SMTP sender, then custom domain or Resend testing address
export const DEFAULT_FROM_EMAIL = 
  process.env.SMTP_FROM || 
  (smtpUser ? `CUSTECH Marketplace <${smtpUser}>` : null) ||
  process.env.RESEND_FROM_EMAIL || 
  'CUSTECH Marketplace <custechmarket@gmail.com>';

/**
 * Unified email sender with priority:
 * 1. Free Gmail SMTP (direct delivery to any email)
 * 2. Resend API
 * 3. Safe console fallback
 */
export async function sendEmailWithFallback({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; error?: string; provider?: string }> {
  // 1. Try SMTP first if credentials are configured
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: DEFAULT_FROM_EMAIL,
        to,
        subject,
        html,
        text: text || subject,
      });
      return { success: true, id: info.messageId, provider: 'smtp' };
    } catch (err: any) {
      console.error('[SMTP Send Error]:', err.message);
      // Fall through to Resend if SMTP fails
    }
  }

  // 2. Try Resend if configured
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
        to: [to],
        subject,
        html,
      });

      if (response.error) {
        console.error('[Resend Send Error]:', response.error);
        return { success: false, error: response.error.message, provider: 'resend' };
      }

      return { success: true, id: response.data?.id, provider: 'resend' };
    } catch (err: any) {
      console.error('[Resend Send Exception]:', err);
      return { success: false, error: err.message, provider: 'resend' };
    }
  }

  return { success: true, id: 'mock-' + Date.now(), provider: 'mock' };
}

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

  const result = await sendEmailWithFallback({
    to,
    subject,
    html: htmlContent,
    text: `Confirm your CUSTECH Marketplace account by opening this link: ${verificationUrl}${otpCode ? ` (Code: ${otpCode})` : ''}`,
  });

  if (!result.success) {
    console.error('[Email Verification Send Error]:', result.error);
    return { success: false, error: result.error, link: verificationUrl };
  }

  return { success: true, id: result.id, link: verificationUrl };
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
  const result = await sendEmailWithFallback({
    to: payload.to,
    subject: payload.subject,
    html,
    text: `${payload.headline}\n\n${payload.bodyParagraphs.join('\n\n')}\n\n${payload.ctaText}: ${payload.ctaUrl}`,
  });

  return result;
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

// =========================================================================
// ONBOARDING FOLLOW-UP: VERIFICATION & REFER-AND-EARN
// =========================================================================

export interface WelcomeReferralFollowupParams {
  to: string;
  displayName?: string;
  username?: string;
  referralCode?: string;
}

/**
 * Sends an automated follow-up email after account confirmation encouraging
 * student ID verification and sharing their unique referral link to earn rewards.
 */
export async function sendWelcomeAndReferralFollowupEmail({
  to,
  displayName,
  username,
  referralCode,
}: WelcomeReferralFollowupParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://custech.market';
  const cleanCode = referralCode || username || 'student';
  const referralLink = `${siteUrl}/register?ref=${cleanCode}`;
  const verificationUrl = `${siteUrl}/dashboard/verification`;
  const referralsDashboardUrl = `${siteUrl}/dashboard/referrals`;
  const subject = `Welcome to CUSTECH Marketplace! Claim your verified badge & earn with your referral link 🎓💰`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CUSTECH Marketplace</title>
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
      background: linear-gradient(135deg, #059669 0%, #064e3b 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
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
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .header-sub {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #d1fae5;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 800;
      color: #047857;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .intro {
      font-size: 14.5px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .card-text {
      font-size: 13.5px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 14px 0;
    }
    .referral-box {
      background: #ecfdf5;
      border: 1px dashed #34d399;
      border-radius: 12px;
      padding: 14px 16px;
      margin: 12px 0;
      text-align: center;
    }
    .referral-link {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #065f46;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      background: #059669;
      color: #ffffff !important;
      font-size: 13.5px;
      font-weight: 800;
      text-decoration: none;
      padding: 11px 24px;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
    }
    .btn-secondary {
      background: #0284c7;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
    }
    .safety-tip {
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
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="badge">Next Steps for Success</span>
        <h1>Welcome to CUSTECH Marketplace!</h1>
        <p class="header-sub">Official Campus Hub for Confluence University</p>
      </div>

      <div class="content">
        <div class="greeting">Hey ${displayName || 'Campus Scholar'} (@${username || 'student'}) 👋,</div>
        
        <p class="intro">
          Your account is confirmed and ready to go! Here are the <strong>2 most important things</strong> you should do right now to make the most of CUSTECH Marketplace:
        </p>

        <!-- Step 1: Verification -->
        <div class="card" style="border-left: 4px solid #059669;">
          <h3 class="card-title">
            <span>🛡️ 1. Get Your Green Verified Student Badge</span>
          </h3>
          <p class="card-text">
            Buyers and sellers on campus only want to deal with verified students. Getting your Green Badge unlocks unlimited marketplace listings, hostel rooms, and freelance services, and makes your profile 5x more trusted.
          </p>
          <a href="${verificationUrl}" class="btn" target="_blank">
            Verify Your Student ID in 60 Secs →
          </a>
        </div>

        <!-- Step 2: Refer and Earn -->
        <div class="card" style="border-left: 4px solid #0284c7;">
          <h3 class="card-title">
            <span>💸 2. Refer Course Mates & Earn Cash</span>
          </h3>
          <p class="card-text">
            Did you know you have a personal referral link? Share it in your department, faculty, or lodge WhatsApp groups. Whenever a friend joins and verifies, you earn rewards directly to your campus wallet!
          </p>
          <div class="referral-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #047857; font-weight: 700; margin-bottom: 4px;">Your Personal Invite Link:</div>
            <div class="referral-link">${referralLink}</div>
          </div>
          <a href="${referralsDashboardUrl}" class="btn btn-secondary" target="_blank">
            Open Referrals Dashboard & Track Earnings →
          </a>
        </div>

        <!-- Step 3: Explore -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
            Looking for something on campus right now?
          </p>
          <a href="${siteUrl}/marketplace" style="font-weight: 700; color: #059669; text-decoration: underline; font-size: 13.5px;" target="_blank">
            Explore Campus Listings, Hostels & Services →
          </a>
        </div>

        <div class="safety-tip">
          🛡️ <strong>Campus Safety Rule:</strong> Always inspect items and lodge keys in daylight public campus safe zones before making direct transfers.
        </div>
      </div>

      <div class="footer">
        <p>
          This email was sent to ${to} because you are registered on CUSTECH Marketplace.<br>
          Confluence University of Science and Technology (CUSTECH), Osara, Kogi State, Nigeria.
        </p>
        <p>© ${new Date().getFullYear()} CUSTECH Marketplace. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const result = await sendEmailWithFallback({
    to,
    subject,
    html: htmlContent,
    text: `Welcome to CUSTECH Marketplace! Complete your student verification and explore referrals: ${referralLink}`,
  });

  return result;
}

