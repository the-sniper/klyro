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
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0;">Klyro</h1>
    </div>
    
    <p style="color: #3f3f46; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      ${greeting},
    </p>
    
    <p style="color: #3f3f46; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Please use the following verification code to complete your signup:
    </p>
    
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: white;">${otp}</span>
    </div>
    
    <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 0 0 24px;">
      This code will expire in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    
    <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
      © ${new Date().getFullYear()} Klyro. All rights reserved.
    </p>
  </div>
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
