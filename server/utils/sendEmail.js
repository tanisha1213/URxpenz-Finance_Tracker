import nodemailer from 'nodemailer';

/**
 * Creates and returns a nodemailer transporter based on environment configuration.
 * Supports Gmail (via Google App Password) or generic SMTP (Brevo, SendGrid, Mailgun, etc.)
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE;

  if (host) {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
      auth: {
        user,
        pass
      }
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: service || 'gmail',
      auth: {
        user,
        pass
      }
    });
  }

  return null;
};

/**
 * Sends an email using the configured transporter.
 * @param {Object} options - { to, subject, html, text }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    const error = new Error('SMTP credentials not configured. Please set EMAIL_USER and EMAIL_PASS in your environment.');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  const fromAddress = process.env.EMAIL_FROM || `"Xpenz Finance" <${process.env.EMAIL_USER}>`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html
  });

  return info;
};

/**
 * Sends a password reset email with an elegant, responsive HTML template.
 * @param {string} to - Recipient email
 * @param {string} name - Recipient user name
 * @param {string} resetUrl - Frontend reset URL with token
 */
export const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const subject = '🔐 Reset Your Xpenz Password';

  const plainText = `Hi ${name || 'there'},\n\nYou requested a password reset for your Xpenz Finance account.\n\nPlease click the following link or copy it into your browser to reset your password:\n${resetUrl}\n\nThis link will expire in 10 minutes.\nIf you did not request this, you can safely ignore this email.\n\n— The Xpenz Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .content {
      padding: 36px 32px;
      color: #334155;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 28px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .info-card {
      background-color: #f1f5f9;
      border-left: 4px solid #6366f1;
      padding: 14px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #64748b;
      margin: 24px 0;
      line-height: 1.5;
    }
    .link-fallback {
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 24px;
      line-height: 1.5;
    }
    .link-fallback a {
      color: #6366f1;
      text-decoration: underline;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      background-color: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Xpenz</h1>
        <p>Smart AI Personal Finance</p>
      </div>
      <div class="content">
        <p class="greeting">Hi ${name || 'there'},</p>
        <p class="message">
          We received a request to reset the password for your <strong>Xpenz</strong> account. Click the secure button below to choose a new password:
        </p>

        <div class="btn-container">
          <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
        </div>

        <div class="info-card">
          ⏱️ <strong>Security Notice:</strong> This reset link will automatically expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or review your account security. Your current password remains completely unchanged.
        </div>

        <div class="link-fallback">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Xpenz Finance Tracker. All rights reserved.<br>
        This is an automated security transmission. Please do not reply directly to this email.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    text: plainText,
    html
  });
};
