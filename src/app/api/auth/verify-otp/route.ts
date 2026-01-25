import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const adminClient = createServerClient();

    // Find the most recent OTP for this email
    const { data: verification, error: fetchError } = await adminClient
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'No valid verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check attempts (max 5 attempts)
    if (verification.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new verification code.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (verification.otp_code !== otp) {
      // Increment attempts
      await adminClient
        .from('email_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);

      const remainingAttempts = 5 - (verification.attempts + 1);
      return NextResponse.json(
        { 
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Mark as verified
    await adminClient
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
