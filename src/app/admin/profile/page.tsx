"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFullName(data.full_name || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNameError("");
    setNameSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      } else {
        const error = await res.json();
        setNameError(error.error || "Failed to update name");
      }
    } catch {
      setNameError("Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        const error = await res.json();
        setPasswordError(error.error || "Failed to update password");
      }
    } catch {
      setPasswordError("Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-400">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in content-container">
      <div className="page-header">
        <h1 className="page-title text-gradient">Profile Settings</h1>
        <p className="page-subtitle">
          Manage your account information and security
        </p>
      </div>

      <div className="profile-grid">
        {/* Profile Information Card */}
        <div className="profile-card glass">
          <div className="card-header">
            <div className="card-icon">
              <User size={24} />
            </div>
            <div>
              <h2 className="card-title">Profile Information</h2>
              <p className="card-subtitle">Update your personal details</p>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="card-form">
            {/* Email (Read-only) */}
            <div className="form-group">
              <label className="form-label">
                {/* <Mail size={16} /> */}
                Email Address
              </label>
              <div className="input-wrapper readonly">
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="form-input"
                />
                <span className="readonly-badge">Cannot be changed</span>
              </div>
            </div>

            {/* Full Name (Editable) */}
            <div className="form-group">
              <label className="form-label">
                {/* <User size={16} /> */}
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>

            {nameError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                {nameError}
              </div>
            )}

            {nameSuccess && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                Name updated successfully!
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change Card */}
        <div className="profile-card glass">
          <div className="card-header">
            <div className="card-icon security">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="card-title">Change Password</h2>
              <p className="card-subtitle">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="card-form">
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-wrapper password">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrapper password">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrapper password">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                Password updated successfully!
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                savingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {savingPassword ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Account Info */}
      <div className="account-info glass">
        <h3>Account Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Account ID</span>
            <span className="info-value">{profile?.id?.slice(0, 8)}...</span>
          </div>
          <div className="info-item">
            <span className="info-label">Member Since</span>
            <span className="info-value">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
