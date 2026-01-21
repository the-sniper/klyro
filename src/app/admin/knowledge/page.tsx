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
  const [sourceType, setSourceType] = useState<"file" | "text" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      if (sourceType === "file" && selectedFile) {
        // Handle file upload with FormData
        const formDataObj = new FormData();
        formDataObj.append("file", selectedFile);
        formDataObj.append("name", formData.name);
        formDataObj.append("sourceType", "file");
        formDataObj.append("category", formData.category);

        const res = await fetch("/api/documents", {
          method: "POST",
          body: formDataObj,
        });

        if (res.ok) {
          setIsModalOpen(false);
          setFormData({
            name: "",
            content: "",
            sourceUrl: "",
            category: "general",
          });
          setSelectedFile(null);
          fetchDocuments();
        }
      } else {
        // Handle text/url with JSON
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
                    className={`toggle-btn ${sourceType === "file" ? "active" : ""}`}
                    onClick={() => setSourceType("file")}
                  >
                    <Upload size={16} style={{ marginRight: "8px" }} />
                    File
                  </button>
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

              {sourceType === "file" && (
                <div className="form-group">
                  <label className="form-label">Upload File</label>
                  <div
                    className="file-upload-area"
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("drag-over");
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("drag-over");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("drag-over");
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!formData.name) {
                          setFormData({
                            ...formData,
                            name: file.name.replace(/\.[^/.]+$/, ""),
                          });
                        }
                      }
                    }}
                    style={{
                      border: "2px dashed var(--border-primary)",
                      borderRadius: "var(--radius)",
                      padding: "32px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      background: selectedFile
                        ? "var(--bg-tertiary)"
                        : "transparent",
                    }}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".txt,.pdf,.md,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          if (!formData.name) {
                            setFormData({
                              ...formData,
                              name: file.name.replace(/\.[^/.]+$/, ""),
                            });
                          }
                        }
                      }}
                    />
                    {selectedFile ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "12px",
                        }}
                      >
                        <FileText size={24} />
                        <span style={{ fontWeight: 500 }}>
                          {selectedFile.name}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          style={{ padding: "4px" }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload
                          size={32}
                          style={{ marginBottom: "12px", opacity: 0.5 }}
                        />
                        <p
                          style={{ margin: 0, color: "var(--text-secondary)" }}
                        >
                          Drag and drop a file, or click to browse
                        </p>
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: "12px",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          Supports .txt, .pdf, .md, .doc, .docx
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {sourceType === "text" && (
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
              )}

              {sourceType === "url" && (
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
