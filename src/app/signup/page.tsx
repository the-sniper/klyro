"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import toast from "react-hot-toast";

type Step = "details" | "otp" | "password";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      toast.success("Verification code sent to your email!");
      setStep("otp");
      setResendCooldown(60);
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send verification code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      toast.success("Email verified!");
      setStep("password");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      toast.success("Account created successfully!");
      router.push("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      toast.success("New verification code sent!");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {["details", "otp", "password"].map((s, i) => (
        <div
          key={s}
          className={`w-2 h-2 rounded-full transition-all ${
            step === s
              ? "w-6 bg-indigo-500"
              : i < ["details", "otp", "password"].indexOf(step)
              ? "bg-indigo-500"
              : "bg-zinc-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-bg-blob-1" />
      <div className="auth-bg-blob-2" />

      <div className="glass auth-card">
        <div className="auth-header">
          <Link href="/" className="auth-logo-link">
            <Image
              src="/logo.svg"
              alt="Klyro Logo"
              width={140}
              height={48}
              className="auth-logo auth-logo-wrapper"
            />
          </Link>
          <h1 className="auth-title">
            {step === "details" && "Create Account"}
            {step === "otp" && "Verify Email"}
            {step === "password" && "Set Password"}
          </h1>
          <p className="auth-subtitle">
            {step === "details" && "Get started with Klyro today"}
            {step === "otp" && `Enter the code sent to ${email}`}
            {step === "password" && "Choose a secure password"}
          </p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Email & Name */}
        {step === "details" && (
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="auth-input-group">
              <label className="form-label sm-label">Full Name</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input form-input-with-icon"
                  placeholder="John Doe"
                  required
                />
                <User className="auth-input-icon" size={20} />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="form-label sm-label">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input form-input-with-icon"
                  placeholder="you@example.com"
                  required
                />
                <Mail className="auth-input-icon" size={20} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary auth-btn"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Continue <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="auth-form otp-form">
            <div className="auth-input-group">
              <label className="form-label sm-label">Verification Code</label>
              <div className="otp-inputs" onPaste={handleOTPPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className={`otp-input ${digit ? 'filled' : ''}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="btn btn-primary auth-btn otp-verify-btn"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Shield size={18} /> Verify Email
                </>
              )}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="otp-back-btn"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className="otp-resend-btn"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password */}
        {step === "password" && (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="auth-input-group">
              <label className="form-label sm-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input form-input-with-icon"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Lock className="auth-input-icon" size={20} />
              </div>
              <p className="text-xs text-zinc-500" style={{marginTop:"10px"}}>
                Must be at least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary auth-btn"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
