/**
 * Email utility for sending OTP verification emails via SMTP
 * Uses Nodemailer for SMTP transport
 */

import nodemailer from 'nodemailer';

interface SendOTPEmailParams {
  to: string;
  otp: string;
  name?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

// Create reusable transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendOTPEmail({ to, otp, name }: SendOTPEmailParams): Promise<EmailResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  
  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.error('SMTP configuration is incomplete');
    return { success: false, error: 'Email service not configured' };
  }

  const fromEmail = process.env.EMAIL_FROM || `Klyro <${smtpUser}>`;

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: 'Verify your email - Klyro',
      html: generateOTPEmailHTML(otp, name),
      text: generateOTPEmailText(otp, name),
    });

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

function generateOTPEmailHTML(otp: string, name?: string): string {
  const greeting = name ? `Hi ${name}` : 'Hi there';
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>Verify your email</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    @media screen and (max-width: 480px) {
      .main-table { width: 100% !important; }
      .content-padding { padding: 30px 20px !important; }
      .otp-container { padding: 16px !important; }
      .otp-text { font-size: 24px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="background-color: #f4f4f5; margin: 0 !important; padding: 0 !important; width: 100% !important;">
  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your Klyro verification code is ${otp}.
  </div>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td align="center" style="background-color: #f4f4f5; padding: 40px 10px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="480" style="width:480px;">
        <tr>
        <td align="center" valign="top" width="480">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="main-table" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border-collapse: separate !important; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td align="center" valign="top" style="padding: 40px;" class="content-padding">
              
              <!-- Logo -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.2;">Klyro</h1>
                  </td>
                </tr>
              </table>

              <!-- Body Content -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3f3f46; font-size: 16px; line-height: 24px; padding-bottom: 24px;">
                    ${greeting},
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3f3f46; font-size: 16px; line-height: 24px; padding-bottom: 24px;">
                    Please use the following verification code to complete your signup:
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <!-- OTP Box Section -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:80px;v-text-anchor:middle;width:300px;" arcsize="10%" stroke="f" fillcolor="#6366f1">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:monospace, serif;font-size:32px;font-weight:700;letter-spacing:8px;">${otp}</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <div style="background-color: #6366f1; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; padding: 24px; text-align: center;" class="otp-container">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffffff;" class="otp-text">${otp}</span>
                          </div>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #71717a; font-size: 14px; line-height: 20px; padding-bottom: 24px;">
                    This code will expire in <strong style="color: #3f3f46;">10 minutes</strong>. If you didn't request this code, you can safely ignore this email.
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #e4e4e7; padding-top: 24px;"></td>
                </tr>
              </table>

              <!-- Footer -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0;">
                    © ${currentYear} Klyro. All rights reserved.
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateOTPEmailText(otp: string, name?: string): string {
  const greeting = name ? `Hi ${name}` : 'Hi there';
  
  return `
${greeting},

Please use the following verification code to complete your signup:

${otp}

This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.

© ${new Date().getFullYear()} Klyro. All rights reserved.
  `.trim();
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
