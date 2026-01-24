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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    content: "",
    sourceUrl: "",
    category: "general",
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-poll when documents are processing
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.status === "processing" || doc.status === "queued",
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [documents]);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      // Only set state if we got an array (API errors return objects)
      if (Array.isArray(data)) {
        setDocuments(data);
      }
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

  async function handleResetKnowledge() {
    setResetting(true);
    try {
      const res = await fetch("/api/documents", { method: "DELETE" });
      if (res.ok) {
        setIsResetModalOpen(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to reset knowledge base:", error);
    } finally {
      setResetting(false);
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
        <div className="page-header knowledge-header">
          <div className="header-text">
            <h1 className="page-title text-gradient">Knowledge Base</h1>
            <p className="page-subtitle">
              Manage the documents that power your chatbot's intelligence
            </p>
          </div>
          <div className="header-actions">
            {documents.length > 0 && (
              <button
                className="btn btn-ghost danger reset-kb-btn"
                onClick={() => setIsResetModalOpen(true)}
              >
                <Trash2 size={18} />
                <span>Reset Knowledge</span>
              </button>
            )}
            <button
              className="btn btn-primary add-doc-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="card glass-hover empty-knowledge-card">
            <div className="empty-state">
              <div className="empty-icon-glow">
                <FileText size={48} />
              </div>
              <h3 className="empty-title">Your knowledge base is empty</h3>
              <p className="empty-desc">
                Train your chatbot by adding documents, text snippets, or
                website URLs.
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
          <div className="card glass knowledge-table-card">
            <div className="table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Source</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Last Sync</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const status =
                      statusConfig[doc.status as keyof typeof statusConfig] ||
                      statusConfig.queued;
                    const StatusIcon = status.icon;

                    return (
                      <tr key={doc.id} className="table-row-hover">
                        <td>
                          <div className="doc-identity">
                            <div
                              className={`doc-icon-wrapper ${doc.source_type}`}
                            >
                              {doc.source_type === "url" ? (
                                <Globe size={18} />
                              ) : (
                                <FileText size={18} />
                              )}
                            </div>
                            <span className="doc-name">{doc.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="source-tag text-capitalize">
                            {doc.source_type}
                          </span>
                        </td>
                        <td>
                          <span className="category-label text-capitalize">
                            {doc.category || "General"}
                          </span>
                        </td>
                        <td>
                          <div className={`status-pill ${status.className}`}>
                            <StatusIcon
                              size={12}
                              className={
                                doc.status === "processing"
                                  ? "animate-spin"
                                  : ""
                              }
                            />
                            <span>{status.label}</span>
                          </div>
                        </td>
                        <td className="text-muted">
                          {new Date(doc.updated_at).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="text-right">
                          <div className="actions-flex">
                            <button
                              className="action-btn-ghost info"
                              onClick={() => handleReprocess(doc.id)}
                              title="Reprocess Document"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              className="action-btn-ghost danger"
                              onClick={() => handleDelete(doc.id)}
                              title="Delete Document"
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
      </div>

      {/* Add Document Modal moved outside for stable positioning */}
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
                <h2 className="modal-title">Add Knowledge</h2>
                <p className="modal-subtitle">
                  Choose a source to train your AI
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
              <div className="source-toggle-grid">
                {[
                  {
                    id: "file",
                    label: "File",
                    icon: Upload,
                    desc: "PDF, TXT, MD",
                  },
                  {
                    id: "text",
                    label: "Text",
                    icon: FileText,
                    desc: "Manual entry",
                  },
                  {
                    id: "url",
                    label: "URL",
                    icon: Globe,
                    desc: "Website link",
                  },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`source-option ${sourceType === type.id ? "active" : ""}`}
                    onClick={() => setSourceType(type.id as any)}
                  >
                    <type.icon size={20} />
                    <div className="option-info">
                      <span className="option-label">{type.label}</span>
                      <span className="option-desc">{type.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="form-grid">
                <div className="form-group flex-1">
                  <label className="form-label">Document Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Company Overview"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group min-w-200">
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
              </div>

              {sourceType === "file" && (
                <div className="form-group">
                  <label className="form-label">Upload File</label>
                  <div
                    className={`dropzone ${selectedFile ? "has-file" : ""}`}
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
                        if (!formData.name)
                          setFormData({
                            ...formData,
                            name: file.name.replace(/\.[^/.]+$/, ""),
                          });
                      }
                    }}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".txt,.pdf,.md,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          if (!formData.name)
                            setFormData({
                              ...formData,
                              name: file.name.replace(/\.[^/.]+$/, ""),
                            });
                        }
                      }}
                    />
                    {selectedFile ? (
                      <div className="selected-file-preview">
                        <FileText size={32} className="text-accent" />
                        <div className="file-info">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          className="remove-file-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <div className="upload-icon-circle">
                          <Upload size={24} />
                        </div>
                        <p className="dropzone-main">Click or drag to upload</p>
                        <p className="dropzone-sub">
                          PDF, TXT, or Markdown up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sourceType === "text" && (
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-textarea knowledge-textarea"
                    placeholder="Provide information the AI should learn..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {sourceType === "url" && (
                <div className="form-group">
                  <label className="form-label">Website URL</label>
                  <div className="url-input-wrapper">
                    <div className="url-icon-container">
                      <Globe size={18} className="url-icon" />
                    </div>
                    <input
                      type="url"
                      className="url-input"
                      placeholder="https://example.com/about"
                      value={formData.sourceUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceUrl: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Save Knowledge
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Knowledge Base Confirmation Modal */}
      {isResetModalOpen && (
        <div
          className="modal-overlay animate-overlay"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            className="modal-glass animate-modal reset-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-text">
                <h2 className="modal-title text-error">Clear Knowledge Base</h2>
                <p className="modal-subtitle">This action cannot be undone</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsResetModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-box">
                <div className="warning-icon-wrapper">
                  <AlertCircle size={32} />
                </div>
                <p className="warning-text">
                  Are you sure you want to clear your entire knowledge base?
                  Your AI will lose all the platform-specific knowledge it has
                  learned. <strong>This is an irreversible change.</strong>
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsResetModalOpen(false)}
              >
                Cancel, Keep Knowledge
              </button>
              <button
                type="button"
                className="btn btn-error reset-confirm-btn"
                onClick={handleResetKnowledge}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={20} className="btn-icon" />
                    <span>Reset Knowledge Base</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
