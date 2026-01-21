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
} from "lucide-react";
import type { Widget } from "@/types";

export default function IntegrationsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    welcomeMessage: "Hi! How can I help you learn more about me?",
    position: "bottom-right",
    theme: "dark",
    primaryColor: "#6366f1",
    allowedDomains: "",
  });

  useEffect(() => {
    fetchWidgets();
  }, []);

  async function fetchWidgets() {
    try {
      const res = await fetch("/api/widget");
      const data = await res.json();
      setWidgets(data);
    } catch (error) {
      console.error("Failed to fetch widgets:", error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(widget?: Widget) {
    if (widget) {
      setEditingWidget(widget);
      setFormData({
        name: widget.name,
        welcomeMessage: widget.welcome_message,
        position: widget.position,
        theme: widget.theme,
        primaryColor: widget.primary_color,
        allowedDomains: widget.allowed_domains?.join(", ") || "",
      });
    } else {
      setEditingWidget(null);
      setFormData({
        name: "",
        welcomeMessage: "Hi! How can I help you learn more about me?",
        position: "bottom-right",
        theme: "dark",
        primaryColor: "#6366f1",
        allowedDomains: "",
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
        welcomeMessage: formData.welcomeMessage,
        position: formData.position,
        theme: formData.theme,
        primaryColor: formData.primaryColor,
        allowedDomains: formData.allowedDomains
          .split(",")
          .map((d) => d.trim())
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
          <h1 className="page-title">Integrations</h1>
          <p className="page-subtitle">
            Configure and embed your chatbot widget
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Create Widget
        </button>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
          }}
        >
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : widgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Code2 size={36} />
            </div>
            <h3 className="empty-state-title">No widgets yet</h3>
            <p className="empty-state-text">
              Create a widget to embed your chatbot on any website.
            </p>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <Plus size={18} />
              Create Your First Widget
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {widgets.map((widget) => (
            <div key={widget.id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    {widget.name}
                  </h3>
                  <p
                    style={{ fontSize: "14px", color: "var(--text-secondary)" }}
                  >
                    Key:{" "}
                    <code
                      style={{
                        background: "var(--bg-tertiary)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {widget.widget_key}
                    </code>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => openModal(widget)}
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleDelete(widget.widget_key)}
                    style={{ color: "var(--error)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                    }}
                  >
                    Theme
                  </div>
                  <div
                    style={{ fontSize: "14px", textTransform: "capitalize" }}
                  >
                    {widget.theme}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                    }}
                  >
                    Position
                  </div>
                  <div
                    style={{ fontSize: "14px", textTransform: "capitalize" }}
                  >
                    {widget.position.replace("-", " ")}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                    }}
                  >
                    Color
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        background: widget.primary_color,
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                      }}
                    ></div>
                    <span style={{ fontSize: "14px" }}>
                      {widget.primary_color}
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                    }}
                  >
                    Domains
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    {widget.allowed_domains?.length
                      ? widget.allowed_domains.join(", ")
                      : "All domains"}
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  Embed Code
                </div>
                <div style={{ position: "relative" }}>
                  <pre className="code-block" style={{ paddingRight: "80px" }}>
                    {`<script
  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"
  data-widget-key="${widget.widget_key}"
></script>`}
                  </pre>
                  <button
                    className="btn btn-secondary"
                    style={{ position: "absolute", top: "12px", right: "12px" }}
                    onClick={() => copyEmbedCode(widget)}
                  >
                    {copiedKey === widget.widget_key ? (
                      <>
                        <Check size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Widget Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingWidget ? "Edit Widget" : "Create Widget"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Widget Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Portfolio Widget"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Welcome Message</label>
                <textarea
                  className="form-textarea"
                  placeholder="Hi! How can I help you?"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, welcomeMessage: e.target.value })
                  }
                  style={{ minHeight: "80px" }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Position</label>
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

                <div className="form-group">
                  <label className="form-label">Theme</label>
                  <select
                    className="form-select"
                    value={formData.theme}
                    onChange={(e) =>
                      setFormData({ ...formData, theme: e.target.value })
                    }
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Color</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    style={{
                      width: "48px",
                      height: "48px",
                      border: "none",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Allowed Domains (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="example.com, mysite.com"
                  value={formData.allowedDomains}
                  onChange={(e) =>
                    setFormData({ ...formData, allowedDomains: e.target.value })
                  }
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginTop: "6px",
                  }}
                >
                  Leave empty to allow all domains
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingWidget ? (
                    "Save Changes"
                  ) : (
                    "Create Widget"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
