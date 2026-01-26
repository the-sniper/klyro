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
  Check,
  Smile,
  Briefcase,
  Coffee,
  Award,
  Zap,
  Feather,
  Pencil,
  Info,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface PersonaPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  color: string;
  communication_style: string;
  personality_traits: string[];
  is_system: boolean;
}

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
    salary_range?: string;
    currency?: string;
    open_for_negotiation?: boolean;
  };
  calendly_token?: string | null;
  selected_preset_id: string | null;
}

interface DrawerData {
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  avatar: string | React.ReactNode;
  color?: string;
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
  const phoneNumber = value.replace(/\D/g, "");
  if (!phoneNumber) return "";
  if (phoneNumber.length <= 10) {
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
  const countryCode = phoneNumber.slice(0, phoneNumber.length - 10);
  const mainNumber = phoneNumber.slice(phoneNumber.length - 10);
  return `+${countryCode} (${mainNumber.slice(0, 3)}) ${mainNumber.slice(3, 6)}-${mainNumber.slice(6, 10)}`;
}

export default function PersonaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [presets, setPresets] = useState<PersonaPreset[]>([]);
  const [config, setConfig] = useState<PersonaConfig>({
    owner_name: "",
    communication_style: "friendly",
    personality_traits: [],
    custom_instructions: "",
    external_links: {},
    access_permissions: {
      can_share_github: false,
      can_share_linkedin: false,
      can_share_twitter: false,
      can_share_email: false,
      can_discuss_salary: false,
      can_schedule_calls: true,
      salary_range: "",
      currency: "USD",
      open_for_negotiation: true,
    },
    selected_preset_id: null,
  });
  const [traitInput, setTraitInput] = useState("");
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);

  function handleInfoClick(e: React.MouseEvent, data: DrawerData) {
    if (window.innerWidth <= 640) {
      e.preventDefault();
      e.stopPropagation();
      setDrawerData(data);
    }
  }

  const isUsingPreset = config.selected_preset_id !== null;
  const selectedPreset = presets.find(
    (p) => p.id === config.selected_preset_id,
  );

  useEffect(() => {
    fetchConfig();
    fetchPresets();
  }, []);

  useEffect(() => {
    if (drawerData) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [drawerData]);

  async function fetchPresets() {
    try {
      const res = await fetch("/api/persona/presets");
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
      }
    } catch (error) {
      console.error("Failed to fetch presets:", error);
    }
  }

  function selectPreset(preset: PersonaPreset | null) {
    if (preset) {
      setConfig({
        ...config,
        selected_preset_id: preset.id,
        communication_style: preset.communication_style,
        personality_traits: [...preset.personality_traits],
      });
    } else {
      setConfig({
        ...config,
        selected_preset_id: null,
      });
    }
  }

  async function fetchConfig() {
    try {
      const res = await fetch("/api/persona");
      if (res.ok) {
        const data = await res.json();

        // Enforce logic: If link is empty, permission MUST be false
        const enforcedPermissions = { ...data.access_permissions };
        if (!data.external_links?.github)
          enforcedPermissions.can_share_github = false;
        if (!data.external_links?.linkedin)
          enforcedPermissions.can_share_linkedin = false;
        if (!data.external_links?.twitter)
          enforcedPermissions.can_share_twitter = false;
        if (!data.external_links?.email)
          enforcedPermissions.can_share_email = false;

        setConfig({
          ...data,
          access_permissions: enforcedPermissions,
        });
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
        toast.success("Changes saved successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error("Failed to save changes.");
      }
    } catch (error) {
      console.error("Failed to save persona config:", error);
      toast.error("An error occurred while saving.");
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
        selected_preset_id: null,
      });
    }
    setTraitInput("");
  }

  function removeTrait(trait: string) {
    setConfig({
      ...config,
      personality_traits: config.personality_traits.filter((t) => t !== trait),
      selected_preset_id: null,
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
    <div className="persona-page-wrapper">
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
          <div className="persona-main-col">
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
                  placeholder="e.g., Jhon Doe"
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

            <section className="card glass-hover mb-24">
              <div className="section-header">
                <div className="section-icon-wrapper icon-wrapper-secondary">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h2 className="section-title">Communication Style</h2>
                  <p className="section-subtitle">How should your bot talk?</p>
                </div>
              </div>

              {presets.length > 0 && (
                <div className="presets-section mb-24">
                  <label className="form-label">Choose a Preset</label>
                  <p className="input-hint mb-12 text-sm">
                    Select a persona type to auto-fill your communication style
                    and traits
                  </p>
                  <div className="presets-grid">
                    {presets.map((preset) => (
                      <div key={preset.id} className="preset-card-wrapper">
                        <button
                          type="button"
                          onClick={() => selectPreset(preset)}
                          className={`preset-card ${config.selected_preset_id === preset.id ? "active" : ""}`}
                          style={
                            {
                              "--preset-color": preset.color,
                              "--preset-color-rgb":
                                preset.color === "#3b82f6"
                                  ? "59, 130, 246"
                                  : preset.color === "#f59e0b"
                                    ? "245, 158, 11"
                                    : "217, 70, 239",
                            } as any
                          }
                        >
                          <div className="preset-avatar">
                            <img src={preset.avatar} alt={preset.name} />
                          </div>
                          <div className="preset-tagline">{preset.tagline}</div>
                          <div className="preset-name">{preset.name}</div>
                        </button>
                        <div
                          className="preset-info-trigger cursor-pointer"
                          onClick={(e) =>
                            handleInfoClick(e, {
                              name: preset.name,
                              tagline: preset.tagline,
                              description: preset.description,
                              traits: preset.personality_traits,
                              avatar: preset.avatar,
                              color: preset.color,
                            })
                          }
                        >
                          <Info size={14} />
                          <div className="preset-popover">
                            <div className="popover-content">
                              <div className="popover-desc">
                                {preset.description}
                              </div>
                              <div className="popover-traits">
                                {preset.personality_traits.map((trait) => (
                                  <span key={trait} className="popover-trait">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="popover-arrow"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="preset-card-wrapper">
                      <button
                        type="button"
                        onClick={() => selectPreset(null)}
                        className={`preset-card custom ${!isUsingPreset ? "active" : ""}`}
                      >
                        <div className="preset-avatar custom-icon">
                          <Pencil size={32} />
                        </div>
                        <div className="preset-tagline">Build Your Own</div>
                        <div className="preset-name">Custom</div>
                      </button>
                      <div
                        className="preset-info-trigger cursor-pointer"
                        onClick={(e) =>
                          handleInfoClick(e, {
                            name: "Custom",
                            tagline: "Build Your Own",
                            description:
                              "Create a completely unique AI persona by manually tuning its style and traits.",
                            traits: [],
                            avatar: <Pencil size={32} />,
                          })
                        }
                      >
                        <Info size={14} />
                        <div className="preset-popover">
                          <div className="popover-content">
                            <div className="popover-desc">
                              Create a completely unique AI persona by manually
                              tuning its style and traits.
                            </div>
                          </div>
                          <div className="popover-arrow"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="style-divider mb-24">
                <span>
                  {isUsingPreset && selectedPreset
                    ? `Using ${selectedPreset.name} Style`
                    : "Or customize your own"}
                </span>
              </div>

              <div className="tone-grid">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        communication_style: tone.value,
                        selected_preset_id: null,
                      })
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

              <div className="form-group mb-24">
                <label className="form-label">Personality Traits</label>
                <div className="trait-input-wrapper flex gap-2 mb-12">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add a trait..."
                    value={traitInput}
                    onChange={(e) => setTraitInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addTrait(traitInput))
                    }
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

              <div className="form-group mb-24">
                <label className="form-label">Custom Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g., Always mention my open source contributions..."
                  value={config.custom_instructions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      custom_instructions: e.target.value,
                    })
                  }
                />
                <p className="input-hint">
                  Specific guidance for the bot's responses
                </p>
              </div>
            </section>
          </div>

          <div className="persona-side-col">
            <section className="card glass-hover mb-24">
              <div className="section-header">
                <div className="section-icon-wrapper icon-wrapper-warning">
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
                    <label className="form-label !flex items-center gap-2">
                      <field.icon size={14} /> {field.label}
                    </label>
                    <input
                      type={field.type}
                      className="form-input"
                      placeholder={field.placeholder}
                      value={(config.external_links as any)[field.key] || ""}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (field.key === "phone") val = formatPhoneNumber(val);
                        setConfig((prev) => {
                          const newLinks = {
                            ...prev.external_links,
                            [field.key]: val,
                          };
                          const newPermissions = { ...prev.access_permissions };

                          // Auto-toggle permissions based on value presence
                          if (
                            ["github", "linkedin", "twitter", "email"].includes(
                              field.key,
                            )
                          ) {
                            const permissionKey =
                              `can_share_${field.key}` as keyof typeof newPermissions;
                            // If current permission state matches the new value's presence (both true or both false), don't change it
                            // This allows users to manually turn it off even if a value exists
                            // But we auto-enable it if they just typed something
                            if (
                              val &&
                              !(prev.external_links as any)[field.key]
                            ) {
                              (newPermissions as any)[permissionKey] = true;
                            } else if (!val) {
                              (newPermissions as any)[permissionKey] = false;
                            }
                          }

                          return {
                            ...prev,
                            external_links: newLinks,
                            access_permissions: newPermissions,
                          };
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="card glass-hover">
              <div className="section-header">
                <div className="section-icon-wrapper icon-wrapper-success">
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
                  <div key={perm.key} className="permission-wrapper">
                    <label className="permission-item">
                      <div className="permission-info">
                        <span className="permission-label">{perm.label}</span>
                      </div>
                      <div
                        className={`custom-checkbox ${(config.access_permissions as any)[perm.key] ? "checked" : ""}`}
                        onClick={() => {
                          const targetKey = perm.key;
                          const isCurrentlyEnabled = (
                            config.access_permissions as any
                          )[targetKey];

                          // Validations for enabling permissions
                          if (!isCurrentlyEnabled) {
                            // Map permission keys to link keys
                            const linkKeyMap: Record<string, string> = {
                              can_share_github: "github",
                              can_share_linkedin: "linkedin",
                              can_share_twitter: "twitter",
                              can_share_email: "email",
                            };

                            const linkKey = linkKeyMap[targetKey];
                            if (
                              linkKey &&
                              !(config.external_links as any)[linkKey]
                            ) {
                              toast.error(
                                `Please add a ${perm.label.replace("Share ", "")} link first`,
                              );
                              return;
                            }
                          }

                          setConfig({
                            ...config,
                            access_permissions: {
                              ...config.access_permissions,
                              [perm.key]: !isCurrentlyEnabled,
                            },
                          });
                        }}
                      >
                        <div className="checkbox-knob"></div>
                      </div>
                    </label>

                    {perm.key === "can_discuss_salary" &&
                      config.access_permissions.can_discuss_salary && (
                        <div className="salary-config animate-fade-in">
                          <div className="salary-inputs-row">
                            <div className="salary-input-group">
                              <label className="field-label-xs">
                                Salary Range
                              </label>
                              <input
                                type="text"
                                className="form-input text-sm"
                                placeholder="e.g., 120k - 150k"
                                value={
                                  config.access_permissions.salary_range || ""
                                }
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    access_permissions: {
                                      ...config.access_permissions,
                                      salary_range: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="currency-input-group">
                              <label className="field-label-xs">Currency</label>
                              <div className="select-wrapper">
                                <select
                                  className="form-input text-sm select-custom"
                                  value={
                                    config.access_permissions.currency || "USD"
                                  }
                                  onChange={(e) =>
                                    setConfig({
                                      ...config,
                                      access_permissions: {
                                        ...config.access_permissions,
                                        currency: e.target.value,
                                      },
                                    })
                                  }
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                  <option value="CAD">CAD</option>
                                  <option value="AUD">AUD</option>
                                  <option value="INR">INR</option>
                                  <option value="SGD">SGD</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div
                            className="negotiation-row mt-12 mb-12 cursor-pointer"
                            onClick={() =>
                              setConfig({
                                ...config,
                                access_permissions: {
                                  ...config.access_permissions,
                                  open_for_negotiation:
                                    !config.access_permissions
                                      .open_for_negotiation,
                                },
                              })
                            }
                          >
                            <div
                              className={`custom-checkbox sm ${config.access_permissions.open_for_negotiation ? "checked" : ""}`}
                            >
                              <div className="checkbox-knob"></div>
                            </div>
                            <span className="negotiation-label-text">
                              Open for negotiation
                            </span>
                          </div>
                          <p className="input-hint opacity-60">
                            This range will be shared when recruiters ask about
                            compensation.
                          </p>
                        </div>
                      )}

                    {perm.key === "can_schedule_calls" &&
                      config.access_permissions.can_schedule_calls && (
                        <div className="calendly-config animate-fade-in">
                          <label className="form-label text-xs mb-1.5 opacity-80">
                            Calendly Personal Access Token
                          </label>
                          <div className="calendly-input-row">
                            <input
                              type="password"
                              className="form-input text-sm calendly-input"
                              placeholder="Starts with 'eyJ...'"
                              value={config.calendly_token || ""}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  calendly_token: e.target.value,
                                })
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-primary calendly-save-btn"
                              onClick={handleSave}
                              disabled={saving}
                            >
                              {saving ? (
                                <div className="calendly-btn-inner">
                                  <Loader2
                                    size={20}
                                    className="animate-spin text-white"
                                  />
                                </div>
                              ) : (
                                <div className="calendly-btn-inner">
                                  <Check size={20} className="text-white" />
                                </div>
                              )}
                            </button>
                          </div>
                          <p className="input-hint mt-1.5 opacity-60">
                            Find this in Calendly Integrations {">"} API &
                            Webhooks
                          </p>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      {/* Mobile Info Drawer */}
      {drawerData && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerData(null)} />
          <div className="drawer-container">
            <div className="drawer-handle" />
            <div className="drawer-header">
              <div className="drawer-profile">
                <div className="drawer-avatar-box">
                  {typeof drawerData.avatar === "string" ? (
                    <img
                      src={drawerData.avatar}
                      alt={drawerData.name}
                      className="drawer-avatar-img"
                    />
                  ) : (
                    <div className="drawer-avatar-placeholder">
                      {drawerData.avatar}
                    </div>
                  )}
                  {drawerData.color && (
                    <div
                      className="drawer-color-overlay"
                      style={{ background: drawerData.color }}
                    />
                  )}
                </div>
                <div className="drawer-text">
                  <h3 className="drawer-title">{drawerData.name}</h3>
                  {drawerData.tagline && (
                    <p className="drawer-tagline">{drawerData.tagline}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDrawerData(null)}
                className="drawer-close-btn"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="drawer-desc">{drawerData.description}</p>

            {drawerData.traits && drawerData.traits.length > 0 && (
              <div className="drawer-traits">
                {drawerData.traits.map((trait) => (
                  <span key={trait} className="drawer-trait-badge">
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
