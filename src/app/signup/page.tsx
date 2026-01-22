"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const message =
        err instanceof Error ? err.message : "Failed to create account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-blob-1" />
      <div className="auth-bg-blob-2" />

      <div className="glass auth-card">
        <div className="auth-header">
          <Image
            src="/logo.svg"
            alt="Klyro Logo"
            width={140}
            height={48}
            className="auth-logo"
            style={{ margin: "0 auto 24px" }}
          />
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Get started with Klyro today</p>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{ width: "100%", marginTop: "12px", height: "48px" }}
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

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
