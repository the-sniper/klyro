"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  Globe,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { Document } from "@/types";

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState<"text" | "url">("text");

  const [formData, setFormData] = useState({
    name: "",
    content: "",
    sourceUrl: "",
    category: "general",
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        sourceType,
        content: sourceType === "text" ? formData.content : undefined,
        sourceUrl: sourceType === "url" ? formData.sourceUrl : undefined,
        category: formData.category,
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          content: "",
          sourceUrl: "",
          category: "general",
        });
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }

  async function handleReprocess(id: string) {
    try {
      await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reprocess" }),
      });
      fetchDocuments();
    } catch (error) {
      console.error("Failed to reprocess document:", error);
    }
  }

  const statusConfig = {
    ready: { icon: CheckCircle, label: "Ready", className: "badge-success" },
    processing: {
      icon: Clock,
      label: "Processing",
      className: "badge-warning",
    },
    failed: { icon: AlertCircle, label: "Failed", className: "badge-error" },
    queued: { icon: Clock, label: "Queued", className: "badge-info" },
  };

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
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-subtitle">
            Manage the documents that power your chatbot
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          Add Document
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
      ) : documents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={36} />
            </div>
            <h3 className="empty-state-title">No documents yet</h3>
            <p className="empty-state-text">
              Add documents to train your chatbot with relevant information.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              Add Your First Document
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const status =
                    statusConfig[doc.status as keyof typeof statusConfig] ||
                    statusConfig.queued;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "var(--bg-tertiary)",
                              borderRadius: "var(--radius)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {doc.source_type === "url" ? (
                              <Globe size={18} />
                            ) : (
                              <FileText size={18} />
                            )}
                          </div>
                          <span style={{ fontWeight: 500 }}>{doc.name}</span>
                        </div>
                      </td>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          textTransform: "capitalize",
                        }}
                      >
                        {doc.source_type}
                      </td>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          textTransform: "capitalize",
                        }}
                      >
                        {doc.category || "General"}
                      </td>
                      <td>
                        <span className={`badge ${status.className}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleReprocess(doc.id)}
                            title="Reprocess"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleDelete(doc.id)}
                            style={{ color: "var(--error)" }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Document</h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Source Type</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${sourceType === "text" ? "active" : ""}`}
                    onClick={() => setSourceType("text")}
                  >
                    <FileText size={16} style={{ marginRight: "8px" }} />
                    Text
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${sourceType === "url" ? "active" : ""}`}
                    onClick={() => setSourceType("url")}
                  >
                    <Globe size={16} style={{ marginRight: "8px" }} />
                    URL
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Work Experience"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="general">General</option>
                  <option value="experience">Experience</option>
                  <option value="projects">Projects</option>
                  <option value="skills">Skills</option>
                  <option value="education">Education</option>
                  <option value="contact">Contact</option>
                </select>
              </div>

              {sourceType === "text" ? (
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Paste your content here..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    style={{ minHeight: "150px" }}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/about"
                    value={formData.sourceUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceUrl: e.target.value })
                    }
                    required
                  />
                </div>
              )}

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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Add Document
                    </>
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
