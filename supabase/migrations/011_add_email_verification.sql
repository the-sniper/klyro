-- Add email verification OTP table for signup verification

CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookups by email
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- Index for cleanup of expired OTPs
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Add email_verified column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Function to clean up expired OTPs (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verifications WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
