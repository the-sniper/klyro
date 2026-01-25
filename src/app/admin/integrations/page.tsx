"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Settings,
  X,
  Loader2,
  Code2,
  Globe,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from "lucide-react";
import type { Widget } from "@/types";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

export default function IntegrationsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(isModalOpen);

  const [formData, setFormData] = useState({
    name: "",
    headerTitle: "Chat Assistant",
    welcomeMessage: "Hi! How can I help you learn more about me?",
    position: "bottom-right",
    theme: "dark",
    primaryColor: "#6366f1",
    allowedDomains: "",
    launcherMode: "icon",
    launcherText: "Chat with me",
    isActive: true,
    allowedRoutes: "",
  });

  useEffect(() => {
    fetchWidgets();
  }, []);

  async function fetchWidgets() {
    try {
      const res = await fetch("/api/widget");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWidgets(data);
      } else {
        console.error("API returned non-array data:", data);
        setWidgets([]);
      }
    } catch (error) {
      console.error("Failed to fetch widgets:", error);
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  }

  function openModal(widget?: Widget) {
    if (widget) {
      setEditingWidget(widget);
      setFormData({
        name: widget.name,
        headerTitle: widget.header_title || "Chat Assistant",
        welcomeMessage: widget.welcome_message,
        position: widget.position,
        theme: widget.theme,
        primaryColor: widget.primary_color,
        allowedDomains: widget.allowed_domains?.join(", ") || "",
        launcherMode: widget.launcher_mode || "icon",
        launcherText: widget.launcher_text || "Chat with me",
        isActive: widget.is_active !== false,
        allowedRoutes: widget.allowed_routes?.join(", ") || "",
      });
    } else {
      setEditingWidget(null);
      setFormData({
        name: "",
        headerTitle: "Chat Assistant",
        welcomeMessage: "Hi! How can I help you learn more about me?",
        position: "bottom-right",
        theme: "dark",
        primaryColor: "#6366f1",
        allowedDomains: "",
        launcherMode: "icon",
        launcherText: "Chat with me",
        isActive: true,
        allowedRoutes: "",
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        headerTitle: formData.headerTitle,
        welcomeMessage: formData.welcomeMessage,
        position: formData.position,
        theme: formData.theme,
        primaryColor: formData.primaryColor,
        allowedDomains: formData.allowedDomains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        launcherMode: formData.launcherMode,
        launcherText: formData.launcherText,
        isActive: formData.isActive,
        allowedRoutes: formData.allowedRoutes
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      };

      if (editingWidget) {
        await fetch(`/api/widget/${editingWidget.widget_key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/widget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchWidgets();
    } catch (error) {
      console.error("Failed to save widget:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(widgetKey: string) {
    if (!confirm("Are you sure you want to delete this widget?")) return;

    try {
      await fetch(`/api/widget/${widgetKey}`, { method: "DELETE" });
      fetchWidgets();
    } catch (error) {
      console.error("Failed to delete widget:", error);
    }
  }

  function copyEmbedCode(widget: Widget) {
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const code = `<script
  src="${appUrl}/widget.js"
  data-widget-key="${widget.widget_key}"
></script>`;

    navigator.clipboard.writeText(code);
    setCopiedKey(widget.widget_key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-400">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in content-container">
        <div className="page-header integrations-header">
          <div className="header-text">
            <h1 className="page-title text-gradient">Integrations</h1>
            <p className="page-subtitle">
              Configure, customize, and embed your intelligent chatbot on any
              website
            </p>
          </div>
          <button
            className="btn btn-primary create-widget-btn"
            onClick={() => openModal()}
          >
            <Plus size={18} />
            <span>Create Widget</span>
          </button>
        </div>

        {widgets.length === 0 ? (
          <div className="card glass-hover empty-integrations-card">
            <div className="empty-state">
              <div className="empty-icon-glow">
                <Code2 size={48} />
              </div>
              <h3 className="empty-title">No active widgets</h3>
              <p className="empty-desc" style={{ marginBottom: "30px" }}>
                Create a custom chat widget to start collecting leads and
                answering questions on your site.
              </p>
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={18} />
                Create Your First Widget
              </button>
            </div>
          </div>
        ) : (
          <div className="widgets-grid">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`card glass widget-card ${widget.is_active === false ? "widget-disabled" : ""}`}
              >
                <div className="widget-card-header">
                  <div className="widget-identity">
                    <div className="widget-meta">
                      <div className="widget-name-row">
                        <h3 className="widget-name">{widget.name}</h3>
                        <span
                          className={`status-badge ${widget.is_active === false ? "disabled" : "enabled"}`}
                        >
                          {widget.is_active === false ? "Disabled" : "Enabled"}
                        </span>
                      </div>
                      <div className="widget-key-wrapper">
                        <span className="key-label">ID:</span>
                        <code className="widget-key">{widget.widget_key}</code>
                      </div>
                    </div>
                  </div>
                  <div className="widget-actions">
                    <button
                      className={`action-btn-ghost toggle ${widget.is_active === false ? "off" : "on"}`}
                      onClick={async () => {
                        try {
                          await fetch(`/api/widget/${widget.widget_key}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              isActive: !widget.is_active,
                            }),
                          });
                          fetchWidgets();
                        } catch (error) {
                          console.error("Failed to toggle widget:", error);
                        }
                      }}
                      title={
                        widget.is_active === false
                          ? "Enable Widget"
                          : "Disable Widget"
                      }
                    >
                      {widget.is_active === false ? (
                        <ToggleLeft size={20} />
                      ) : (
                        <ToggleRight size={20} />
                      )}
                    </button>
                    <button
                      className="action-btn-ghost info"
                      onClick={() => openModal(widget)}
                      title="Edit Settings"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      className="action-btn-ghost danger"
                      onClick={() => handleDelete(widget.widget_key)}
                      title="Delete Widget"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="widget-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Theme</span>
                    <span className="detail-value text-capitalize">
                      {widget.theme}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Position</span>
                    <span className="detail-value text-capitalize">
                      {widget.position.replace("-", " ")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Launcher</span>
                    <span className="detail-value text-capitalize">
                      {widget.launcher_mode === "text"
                        ? `Text: ${widget.launcher_text}`
                        : "Icon Only"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accent Color</span>
                    <div className="color-preview">
                      <div
                        className="color-swatch"
                        style={{ background: widget.primary_color }}
                      />
                      <span className="color-hex">{widget.primary_color}</span>
                    </div>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Domain Visibility</span>
                    <span className="detail-value">
                      {widget.allowed_domains?.length
                        ? `Active on: ${widget.allowed_domains.join(", ")}`
                        : "Public (All Domains)"}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Page Routes</span>
                    <span className="detail-value">
                      {widget.allowed_routes?.length
                        ? widget.allowed_routes.join(", ")
                        : "All Pages"}
                    </span>
                  </div>
                </div>

                <div className="embed-section">
                  <div className="embed-header">
                    <Globe size={14} className="text-muted" />
                    <span className="embed-label">Installation Code</span>
                  </div>
                  <div className="embed-code-wrapper">
                    <pre className="embed-code">
                      {`<script\n  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"\n  data-widget-key="${widget.widget_key}"\n></script>`}
                    </pre>
                    <button
                      className={`copy-btn ${copiedKey === widget.widget_key ? "copied" : ""}`}
                      onClick={() => copyEmbedCode(widget)}
                    >
                      {copiedKey === widget.widget_key ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  <div className="install-help">
                    <div className="install-help-header">
                      <HelpCircle size={14} className="text-accent" />
                      <span>How to Install</span>
                    </div>
                    <div className="install-help-content">
                      <p>
                        <strong>1. Copy the code</strong> — Click the copy
                        button above to copy the script tag.
                      </p>
                      <p>
                        <strong>2. Paste before &lt;/body&gt;</strong> — Add the
                        code just before the closing <code>&lt;/body&gt;</code>{" "}
                        tag in your HTML file.
                      </p>
                      <p>
                        <strong>3. Works everywhere</strong> — Compatible with
                        HTML, React, Next.js, WordPress, Webflow, Squarespace,
                        and more.
                      </p>
                    </div>
                    <div className="install-help-example">
                      <span className="example-label">Example placement:</span>
                      <pre className="example-code">{`<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <!-- Your website content -->
    
    <!-- Paste widget code here -->
    <script src=".../widget.js" data-widget-key="..."></script>
  </body>
</html>`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Widget Modal moved outside transition wrapper to prevent container transform interference */}
      {isModalOpen && (
        <div
          className="modal-overlay animate-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-glass animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-text">
                <h2 className="modal-title">
                  {editingWidget ? "Modify Widget" : "New Integration"}
                </h2>
                <p className="modal-subtitle">
                  Configure your chatbot's external appearance
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Internal Widget Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Personal Portfolio"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chat Header Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Chat Assistant, Ask Me Anything"
                  value={formData.headerTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, headerTitle: e.target.value })
                  }
                />
                <p className="field-hint">
                  The title displayed in the chat widget header.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Greeting Message</label>
                <textarea
                  className="form-textarea mini"
                  placeholder="Hi! How can I help you learn about my experience?"
                  maxLength={50}
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      welcomeMessage: e.target.value.slice(0, 50),
                    })
                  }
                />
                <p className="field-hint">Max 50 characters.</p>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Screen Position</label>
                  <div className="select-wrapper">
                    <select
                      className="form-select"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Visual Theme</label>
                  <div className="select-wrapper">
                    <select
                      className="form-select"
                      value={formData.theme}
                      onChange={(e) =>
                        setFormData({ ...formData, theme: e.target.value })
                      }
                    >
                      <option value="dark">Dark Theme</option>
                      <option value="light">Light Theme</option>
                      <option value="auto">System Adaptive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Brand Accent Color</label>
                <div className="color-input-container">
                  <div className="color-field">
                    <input
                      type="color"
                      className="color-picker-input"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryColor: e.target.value,
                        })
                      }
                    />
                    <div
                      className="color-preview-box"
                      style={{ background: formData.primaryColor }}
                    />
                  </div>
                  <input
                    type="text"
                    className="form-input color-text-input"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Launcher Display</label>
                  <div className="select-wrapper">
                    <select
                      className="form-select"
                      value={formData.launcherMode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          launcherMode: e.target.value,
                        })
                      }
                    >
                      <option value="icon">Icon Only</option>
                      <option value="text">Icon with Text</option>
                    </select>
                  </div>
                </div>

                {formData.launcherMode === "text" && (
                  <div className="form-group flex-1">
                    <label className="form-label">Launcher Text</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Ask anything"
                      maxLength={20}
                      value={formData.launcherText}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          launcherText: e.target.value.slice(0, 20),
                        })
                      }
                    />
                    <p className="field-hint">Max 20 characters.</p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Whitelisted Domains (Security)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="portfolio.com, blog.me"
                  value={formData.allowedDomains}
                  onChange={(e) =>
                    setFormData({ ...formData, allowedDomains: e.target.value })
                  }
                />
                <p className="field-hint">
                  Commas separated. Leave blank to allow embedding anywhere.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Allowed Routes (Page Visibility)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="/, /about, /contact"
                  value={formData.allowedRoutes}
                  onChange={(e) =>
                    setFormData({ ...formData, allowedRoutes: e.target.value })
                  }
                />
                <p className="field-hint">
                  Comma separated routes where the widget should appear.
                  Supports wildcards like /blog/*. Leave blank to show on all
                  pages.
                </p>
              </div>

              {editingWidget && (
                <div className="form-group toggle-group">
                  <div className="toggle-control">
                    <div className="toggle-text">
                      <label className="form-label">Widget Status</label>
                      <p className="field-hint">
                        {formData.isActive
                          ? "Widget is live and will render on client websites."
                          : "Widget is disabled and won't appear on client websites."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${formData.isActive ? "active" : ""}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isActive: !formData.isActive,
                        })
                      }
                    >
                      <span className="toggle-track">
                        <span className="toggle-thumb" />
                      </span>
                      <span className="toggle-label">
                        {formData.isActive ? "Enabled" : "Disabled"}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingWidget ? (
                    "Update Widget"
                  ) : (
                    "Deploy Widget"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
