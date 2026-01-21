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
  CheckCircle,
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
    emoji: "😊",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished but personable, balanced tone",
    emoji: "💼",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Super relaxed, like texting a friend",
    emoji: "✌️",
  },
  {
    value: "formal",
    label: "Formal",
    description: "Precise, articulate, no slang",
    emoji: "🎩",
  },
  {
    value: "enthusiastic",
    label: "Enthusiastic",
    description: "High energy, excited about everything",
    emoji: "🚀",
  },
  {
    value: "calm",
    label: "Calm & Thoughtful",
    description: "Measured, reflective, takes time to explain",
    emoji: "🧘",
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="page-title">AI Persona</h1>
          <p className="page-subtitle">
            Configure how your chatbot speaks and what it can share
          </p>
        </div>
        <button
          className="btn btn-primary"
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

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Identity Section */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "var(--accent-gradient)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                Identity
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
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
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "6px",
              }}
            >
              The bot will speak in first person using this name
            </p>
          </div>
        </div>

        {/* Tone Section */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "var(--accent-gradient)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                Communication Style
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                How should your bot talk?
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() =>
                  setConfig({ ...config, communication_style: tone.value })
                }
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius)",
                  border:
                    config.communication_style === tone.value
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border-color)",
                  background:
                    config.communication_style === tone.value
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    marginBottom: "8px",
                  }}
                >
                  {tone.emoji}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "var(--text-primary)",
                  }}
                >
                  {tone.label}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {tone.description}
                </div>
              </button>
            ))}
          </div>

          {/* Personality Traits */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label">Personality Traits</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
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
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addTrait(traitInput)}
              >
                Add
              </button>
            </div>

            {/* Current traits */}
            {config.personality_traits.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                {config.personality_traits.map((trait) => (
                  <span
                    key={trait}
                    style={{
                      padding: "6px 12px",
                      background: "var(--accent)",
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeTrait(trait)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "16px",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Suggestions:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {TRAIT_SUGGESTIONS.filter(
                  (t) => !config.personality_traits.includes(t),
                ).map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => addTrait(trait)}
                    style={{
                      padding: "4px 10px",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    + {trait}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="form-group">
            <label className="form-label">Custom Instructions</label>
            <textarea
              className="form-textarea"
              placeholder="e.g., Always mention my open source contributions. Don't discuss previous employers by name. Emphasize my remote work experience."
              value={config.custom_instructions}
              onChange={(e) =>
                setConfig({ ...config, custom_instructions: e.target.value })
              }
              style={{ minHeight: "100px" }}
            />
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "6px",
              }}
            >
              Specific guidance for how the bot should (or shouldn't) respond
            </p>
          </div>
        </div>

        {/* Links & Contact Section */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "var(--accent-gradient)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Link2 size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                Links & Contact
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                External links and contact info the bot can share
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="me@example.com"
                value={config.external_links.email || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    external_links: {
                      ...config.external_links,
                      email: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (optional)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={config.external_links.phone || ""}
                onChange={(e) => {
                  // Simple US-centric formatting: (XXX) XXX-XXXX
                  let input = e.target.value.replace(/\D/g, ""); // Remove non-digits
                  let formatted = input;

                  if (input.length > 0) {
                    if (input.length <= 3) {
                      formatted = input;
                    } else if (input.length <= 6) {
                      formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
                    } else if (input.length <= 10) {
                      formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
                    } else {
                      // If key starts with country code (e.g. 1), handle it
                      formatted = `+${input.slice(0, input.length - 10)} (${input.slice(input.length - 10, input.length - 7)}) ${input.slice(input.length - 7, input.length - 4)}-${input.slice(input.length - 4)}`;
                    }
                  }

                  setConfig({
                    ...config,
                    external_links: {
                      ...config.external_links,
                      phone: formatted,
                    },
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Github size={16} /> GitHub
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/username"
                value={config.external_links.github || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    external_links: {
                      ...config.external_links,
                      github: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Linkedin size={16} /> LinkedIn
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/username"
                value={config.external_links.linkedin || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    external_links: {
                      ...config.external_links,
                      linkedin: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Twitter size={16} /> Twitter / X
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://twitter.com/username"
                value={config.external_links.twitter || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    external_links: {
                      ...config.external_links,
                      twitter: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Globe size={16} /> Personal Website
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://yoursite.com"
                value={config.external_links.website || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    external_links: {
                      ...config.external_links,
                      website: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "var(--accent-gradient)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                Bot Permissions
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                What is the bot allowed to share or discuss?
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              {
                key: "can_share_github",
                label: "Share GitHub profile",
                description:
                  "Link to your GitHub when discussing code/projects",
              },
              {
                key: "can_share_linkedin",
                label: "Share LinkedIn profile",
                description: "Link to LinkedIn for professional inquiries",
              },
              {
                key: "can_share_twitter",
                label: "Share Twitter/X profile",
                description: "Link to your social media presence",
              },
              {
                key: "can_share_email",
                label: "Share email address",
                description: "Provide contact email when asked",
              },
              {
                key: "can_discuss_salary",
                label: "Discuss compensation",
                description: "Talk about salary expectations if asked",
              },
              {
                key: "can_schedule_calls",
                label: "Offer to schedule calls",
                description: "Suggest scheduling a call or meeting",
              },
            ].map((permission) => (
              <label
                key={permission.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    config.access_permissions[
                      permission.key as keyof typeof config.access_permissions
                    ]
                  }
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      access_permissions: {
                        ...config.access_permissions,
                        [permission.key]: e.target.checked,
                      },
                    })
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    marginTop: "2px",
                    accentColor: "var(--accent)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {permission.label}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {permission.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
