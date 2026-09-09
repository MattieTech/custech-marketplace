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

  // If Resend API Key is set, send live email
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

  // Fallback: If no API key configured yet, log verification link to server console for testing
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
