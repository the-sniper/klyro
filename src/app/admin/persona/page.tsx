"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  User,
  MessageCircle,
  Link2,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Phone,
  Mail,
  CheckCircle,
  Smile,
  Briefcase,
  Coffee,
  Award,
  Zap,
  Feather,
} from "lucide-react";

interface PersonaConfig {
  owner_name: string;
  communication_style: string;
  personality_traits: string[];
  custom_instructions: string;
  external_links: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
  access_permissions: {
    can_share_github: boolean;
    can_share_linkedin: boolean;
    can_share_twitter: boolean;
    can_share_email: boolean;
    can_discuss_salary: boolean;
    can_schedule_calls: boolean;
  };
}

const TONE_OPTIONS = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, approachable, uses casual language",
    icon: Smile,
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished but personable, balanced tone",
    icon: Briefcase,
  },
  {
    value: "casual",
    label: "Casual",
    description: "Super relaxed, like texting a friend",
    icon: Coffee,
  },
  {
    value: "formal",
    label: "Formal",
    description: "Precise, articulate, no slang",
    icon: Award,
  },
  {
    value: "enthusiastic",
    label: "Enthusiastic",
    description: "High energy, excited about everything",
    icon: Zap,
  },
  {
    value: "calm",
    label: "Calm & Thoughtful",
    description: "Measured, reflective, takes time to explain",
    icon: Feather,
  },
];

const TRAIT_SUGGESTIONS = [
  "technical",
  "creative",
  "analytical",
  "humble",
  "confident",
  "curious",
  "detail-oriented",
  "big-picture thinker",
  "team player",
  "independent",
  "mentor",
  "learner",
];

function formatPhoneNumber(value: string) {
  // Extract only digits
  const phoneNumber = value.replace(/\D/g, "");

  // Return early if no digits
  if (!phoneNumber) return "";

  // Handle US format: (XXX) XXX-XXXX
  if (phoneNumber.length <= 10) {
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }

  // Handle international format: +X (XXX) XXX-XXXX
  const countryCode = phoneNumber.slice(0, phoneNumber.length - 10);
  const mainNumber = phoneNumber.slice(phoneNumber.length - 10);

  return `+${countryCode} (${mainNumber.slice(0, 3)}) ${mainNumber.slice(3, 6)}-${mainNumber.slice(6, 10)}`;
}

export default function PersonaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<PersonaConfig>({
    owner_name: "",
    communication_style: "friendly",
    personality_traits: [],
    custom_instructions: "",
    external_links: {},
    access_permissions: {
      can_share_github: true,
      can_share_linkedin: true,
      can_share_twitter: true,
      can_share_email: true,
      can_discuss_salary: false,
      can_schedule_calls: true,
    },
  });
  const [traitInput, setTraitInput] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/persona");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch persona config:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/persona", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save persona config:", error);
    } finally {
      setSaving(false);
    }
  }

  function addTrait(trait: string) {
    const trimmed = trait.trim().toLowerCase();
    if (trimmed && !config.personality_traits.includes(trimmed)) {
      setConfig({
        ...config,
        personality_traits: [...config.personality_traits, trimmed],
      });
    }
    setTraitInput("");
  }

  function removeTrait(trait: string) {
    setConfig({
      ...config,
      personality_traits: config.personality_traits.filter((t) => t !== trait),
    });
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
      <div className="page-header persona-header">
        <div className="header-text">
          <h1 className="page-title text-gradient">AI Persona</h1>
          <p className="page-subtitle">
            Configure how your chatbot speaks and what it can share
          </p>
        </div>
        <button
          className={`btn ${saved ? "btn-success" : "btn-primary"} save-btn`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="persona-grid">
        {/* Left Column - Configuration */}
        <div className="persona-main-col">
          {/* Identity Section */}
          <section className="card glass-hover mb-24">
            <div className="section-header">
              <div className="section-icon-wrapper">
                <User size={20} />
              </div>
              <div>
                <h2 className="section-title">Identity</h2>
                <p className="section-subtitle">
                  Who is this chatbot representing?
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Areef Syed"
                value={config.owner_name}
                onChange={(e) =>
                  setConfig({ ...config, owner_name: e.target.value })
                }
              />
              <p className="input-hint">
                The bot will speak in first person using this name
              </p>
            </div>
          </section>

          {/* Tone Section */}
          <section className="card glass-hover mb-24">
            <div className="section-header">
              <div
                className="section-icon-wrapper"
                style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  color: "var(--accent-secondary)",
                }}
              >
                <MessageCircle size={20} />
              </div>
              <div>
                <h2 className="section-title">Communication Style</h2>
                <p className="section-subtitle">How should your bot talk?</p>
              </div>
            </div>

            <div className="tone-grid">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() =>
                    setConfig({ ...config, communication_style: tone.value })
                  }
                  className={`tone-card ${config.communication_style === tone.value ? "active" : ""}`}
                >
                  <div className="tone-icon-wrapper">
                    <tone.icon size={24} />
                  </div>
                  <div className="tone-info">
                    <div className="tone-label">{tone.label}</div>
                    <div className="tone-desc">{tone.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Personality Traits */}
            <div className="form-group mb-24">
              <label className="form-label">Personality Traits</label>
              <div className="flex gap-8 mb-12">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a trait..."
                  value={traitInput}
                  onChange={(e) => setTraitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTrait(traitInput);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addTrait(traitInput)}
                >
                  Add
                </button>
              </div>

              {config.personality_traits.length > 0 && (
                <div className="traits-list mb-16">
                  {config.personality_traits.map((trait) => (
                    <span key={trait} className="trait-tag active">
                      {trait}
                      <button
                        type="button"
                        onClick={() => removeTrait(trait)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="trait-suggestions">
                <span className="suggestion-label">Suggestions:</span>
                <div className="suggestions-list">
                  {TRAIT_SUGGESTIONS.filter(
                    (t) => !config.personality_traits.includes(t),
                  ).map((trait) => (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => addTrait(trait)}
                      className="trait-tag suggestion"
                    >
                      + {trait}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="form-group mb-24">
              <label className="form-label">Custom Instructions</label>
              <textarea
                className="form-textarea"
                placeholder="e.g., Always mention my open source contributions..."
                value={config.custom_instructions}
                onChange={(e) =>
                  setConfig({ ...config, custom_instructions: e.target.value })
                }
              />
              <p className="input-hint">
                Specific guidance for the bot's responses
              </p>
            </div>
          </section>
        </div>

        {/* Right Column - Links & Permissions */}
        <div className="persona-side-col">
          {/* Links Section */}
          <section className="card glass-hover mb-24">
            <div className="section-header">
              <div
                className="section-icon-wrapper"
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  color: "var(--warning)",
                }}
              >
                <Link2 size={20} />
              </div>
              <div>
                <h2 className="section-title">Links & Contact</h2>
              </div>
            </div>

            <div className="links-form">
              {[
                {
                  key: "email",
                  label: "Email",
                  icon: Mail,
                  type: "email",
                  placeholder: "me@example.com",
                },
                {
                  key: "phone",
                  label: "Phone",
                  icon: Phone,
                  type: "tel",
                  placeholder: "+1 (234) 567-8900",
                },
                {
                  key: "github",
                  label: "GitHub",
                  icon: Github,
                  type: "url",
                  placeholder: "github.com/username",
                },
                {
                  key: "linkedin",
                  label: "LinkedIn",
                  icon: Linkedin,
                  type: "url",
                  placeholder: "linkedin.com/in/username",
                },
                {
                  key: "twitter",
                  label: "Twitter",
                  icon: Twitter,
                  type: "url",
                  placeholder: "twitter.com/username",
                },
                {
                  key: "website",
                  label: "Website",
                  icon: Globe,
                  type: "url",
                  placeholder: "yoursite.com",
                },
              ].map((field) => (
                <div key={field.key} className="form-group">
                  <label className="form-label flex items-center gap-8">
                    <field.icon size={14} /> {field.label}
                  </label>
                  <input
                    type={field.type}
                    className="form-input"
                    placeholder={field.placeholder}
                    value={(config.external_links as any)[field.key] || ""}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (field.key === "phone") {
                        val = formatPhoneNumber(val);
                      }
                      setConfig({
                        ...config,
                        external_links: {
                          ...config.external_links,
                          [field.key]: val,
                        },
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Permissions Section */}
          <section className="card glass-hover">
            <div className="section-header">
              <div
                className="section-icon-wrapper"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--success)",
                }}
              >
                <CheckCircle size={20} />
              </div>
              <div>
                <h2 className="section-title">Permissions</h2>
              </div>
            </div>

            <div className="permissions-list">
              {[
                { key: "can_share_github", label: "Share GitHub" },
                { key: "can_share_linkedin", label: "Share LinkedIn" },
                { key: "can_share_twitter", label: "Share Twitter" },
                { key: "can_share_email", label: "Share Email" },
                { key: "can_discuss_salary", label: "Discuss Salary" },
                { key: "can_schedule_calls", label: "Schedule Calls" },
              ].map((perm) => (
                <label key={perm.key} className="permission-item">
                  <div className="permission-info">
                    <span className="permission-label">{perm.label}</span>
                  </div>
                  <div
                    className={`custom-checkbox ${(config.access_permissions as any)[perm.key] ? "checked" : ""}`}
                    onClick={() =>
                      setConfig({
                        ...config,
                        access_permissions: {
                          ...config.access_permissions,
                          [perm.key]: !(config.access_permissions as any)[
                            perm.key
                          ],
                        },
                      })
                    }
                  >
                    <div className="checkbox-knob"></div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .content-container {
          max-width: 1400px;
        }
        .persona-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .text-gradient {
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .persona-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }
        @media (max-width: 1200px) {
          .persona-grid {
            grid-template-columns: 1fr;
          }
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .section-icon-wrapper {
          width: 44px;
          height: 44px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .section-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .tone-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }
        .tone-card {
          padding: 20px;
          border-radius: var(--radius);
          background: var(--bg-tertiary);
          border: 2px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          display: flex;
          gap: 16px;
        }
        .tone-card:hover {
          border-color: var(--border-hover);
        }
        .tone-card.active {
          background: rgba(59, 130, 246, 0.05);
          border-color: var(--accent-primary);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
        }
        .tone-icon-wrapper {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .tone-card.active .tone-icon-wrapper {
          color: var(--accent-primary);
          transform: scale(1.1);
        }
        .tone-label {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .tone-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .trait-tag {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .trait-tag.active {
          background: var(--accent-gradient);
          color: white;
          box-shadow: var(--accent-glow);
        }
        .trait-tag.suggestion {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
        }
        .trait-tag.suggestion:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
        }
        .traits-list,
        .suggestions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .suggestion-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .remove-tag {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
          opacity: 0.7;
        }
        .remove-tag:hover {
          opacity: 1;
        }
        .input-hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .permission-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }
        .permission-item:last-child {
          border: none;
        }
        .permission-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .custom-checkbox {
          width: 44px;
          height: 24px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          position: relative;
          transition: all 0.3s;
          border: 1px solid var(--border-color);
        }
        .custom-checkbox.checked {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .checkbox-knob {
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }
        .custom-checkbox.checked .checkbox-knob {
          transform: translateX(20px);
        }

        .mb-24 {
          margin-bottom: 24px;
        }
        .flex {
          display: flex;
        }
        .items-center {
          align-items: center;
        }
        .gap-8 {
          gap: 8px;
        }
        .gap-12 {
          gap: 12px;
        }
        .mb-12 {
          margin-bottom: 12px;
        }
        .mb-16 {
          margin-bottom: 16px;
        }
        .save-btn {
          min-width: 160px;
          height: 48px;
        }
        .btn-success {
          background: var(--success);
          color: white;
        }

        /* Kill all underlines in Links & Contact section */
        .links-form :global(*),
        .links-form :global(*:hover),
        .links-form :global(input),
        .links-form :global(label),
        .links-form :global(svg) {
          text-decoration: none !important;
          text-decoration-line: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }

        .links-form .form-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
