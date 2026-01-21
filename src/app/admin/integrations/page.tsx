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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-400">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
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
            <p className="empty-desc">
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
            <div key={widget.id} className="card glass widget-card">
              <div className="widget-card-header">
                <div className="widget-identity">
                  <div className="widget-status-dot pulsing" />
                  <div className="widget-meta">
                    <h3 className="widget-name">{widget.name}</h3>
                    <div className="widget-key-wrapper">
                      <span className="key-label">ID:</span>
                      <code className="widget-key">{widget.widget_key}</code>
                    </div>
                  </div>
                </div>
                <div className="widget-actions">
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
                  <span className="detail-label">Visibility Control</span>
                  <span className="detail-value">
                    {widget.allowed_domains?.length
                      ? `Active on: ${widget.allowed_domains.join(", ")}`
                      : "Public (All Domains)"}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Widget Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
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
                <label className="form-label">Greeting Message</label>
                <textarea
                  className="form-textarea mini"
                  placeholder="Hi! How can I help you learn about my experience?"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, welcomeMessage: e.target.value })
                  }
                />
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

      <style jsx>{`
        .content-container {
          max-width: 1200px;
        }
        .integrations-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .create-widget-btn {
          height: 48px;
          min-width: 180px;
        }
        .text-gradient {
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .empty-integrations-card {
          padding: 80px 40px;
          text-align: center;
        }
        .empty-icon-glow {
          width: 80px;
          height: 80px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: var(--success);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
        }
        .empty-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .empty-desc {
          color: var(--text-secondary);
          max-width: 400px;
          margin: 0 auto 32px;
          font-size: 16px;
        }

        .widgets-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .widget-card {
          padding: 32px;
          border: 1px solid var(--border-color);
        }
        .widget-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .widget-identity {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .widget-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--success);
          margin-top: 6px;
        }
        .widget-status-dot.pulsing {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .widget-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .widget-key-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .widget-key {
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: 6px;
          color: var(--text-secondary);
          font-family: monospace;
        }

        .widget-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn-ghost {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
        }
        .action-btn-ghost:hover {
          border-color: var(--border-hover);
          color: var(--text-primary);
        }
        .action-btn-ghost.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--error);
        }

        .widget-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.015);
          border-radius: 16px;
          border: 1px solid var(--border-color);
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-item.full-width {
          grid-column: 1 / -1;
        }
        .detail-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .detail-value {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .color-preview {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .color-swatch {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .color-hex {
          font-size: 14px;
          color: var(--text-primary);
          font-family: monospace;
        }

        .embed-section {
          background: var(--bg-tertiary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .embed-header {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .embed-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .embed-code-wrapper {
          position: relative;
          padding: 24px;
        }
        .embed-code {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--accent-primary);
          font-family: "JetBrains Mono", monospace;
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        .copy-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .copy-btn:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
        }
        .copy-btn.copied {
          background: var(--success);
          border-color: var(--success);
          color: white;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }
        .modal-glass {
          background: #0f172a;
          border: 1px solid var(--border-color);
          width: 100%;
          max-width: 600px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.7);
        }
        .modal-header {
          padding: 32px 32px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-title {
          font-size: 22px;
          font-weight: 800;
        }
        .modal-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .modal-close-btn {
          background: var(--bg-tertiary);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-close-btn:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .modal-form {
          padding: 32px;
        }
        .form-row {
          display: flex;
          gap: 20px;
        }
        .flex-1 {
          flex: 1;
        }
        .form-textarea.mini {
          min-height: 100px;
          resize: vertical;
        }
        .field-hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .color-input-container {
          display: flex;
          gap: 12px;
        }
        .color-field {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .color-picker-input {
          position: absolute;
          inset: -10px;
          width: 100px;
          height: 100px;
          cursor: pointer;
          opacity: 0;
        }
        .color-preview-box {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .color-text-input {
          flex: 1;
          font-family: monospace;
          font-size: 15px;
        }

        .modal-footer {
          display: flex;
          gap: 16px;
          margin-top: 40px;
        }
        .modal-footer .btn {
          flex: 1;
          height: 52px;
          font-weight: 700;
        }
        .submit-btn {
          box-shadow: var(--accent-glow);
        }

        .text-capitalize {
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
