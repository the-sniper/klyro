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
          <button
            className="btn btn-primary add-doc-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Add Document</span>
          </button>
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
                    <Globe size={18} className="url-icon" />
                    <input
                      type="url"
                      className="form-input url-input"
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

      <style jsx>{`
        .content-container {
          max-width: 1200px;
        }
        .knowledge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .add-doc-btn {
          height: 48px;
          min-width: 180px;
        }
        .text-gradient {
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .empty-knowledge-card {
          padding: 80px 40px;
          text-align: center;
          display: flex;
          justify-content: center;
        }
        .empty-icon-glow {
          width: 80px;
          height: 80px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: var(--accent-primary);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
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

        .knowledge-table-card {
          padding: 0;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .premium-table th {
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.02);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
        }
        .premium-table td {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.015);
        }

        .doc-identity {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .doc-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }
        .doc-icon-wrapper.url {
          color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.1);
        }
        .doc-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .source-tag {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .category-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }
        .badge-warning {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning);
        }
        .badge-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }
        .badge-info {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-primary);
        }

        .actions-flex {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
        }
        .action-btn-ghost {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-muted);
        }
        .action-btn-ghost:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .action-btn-ghost.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
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
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.7);
        }
        .modal-header {
          padding: 32px 32px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-title {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .modal-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
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
        .source-toggle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        .source-option {
          padding: 20px 16px;
          border: 1px solid var(--border-color);
          background: var(--bg-tertiary);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
        }
        .source-option:hover {
          border-color: var(--border-hover);
          background: rgba(255, 255, 255, 0.02);
        }
        .source-option.active {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.05);
          color: var(--accent-primary);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.05);
        }
        .option-label {
          display: block;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .source-option.active .option-label {
          color: var(--accent-primary);
        }
        .option-desc {
          font-size: 11px;
          opacity: 0.7;
        }

        .form-grid {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }
        .flex-1 {
          flex: 1;
        }
        .min-w-200 {
          min-width: 200px;
        }

        .dropzone {
          border: 2px dashed var(--border-color);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dropzone:hover,
        .dropzone.drag-over {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.02);
        }
        .upload-icon-circle {
          width: 48px;
          height: 48px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: var(--text-muted);
        }
        .dropzone-main {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .dropzone-sub {
          font-size: 12px;
          color: var(--text-muted);
        }
        .hidden {
          display: none;
        }

        .selected-file-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          text-align: left;
        }
        .file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .file-name {
          font-weight: 600;
          font-size: 14px;
        }
        .file-size {
          font-size: 11px;
          color: var(--text-muted);
        }
        .remove-file-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
        }
        .remove-file-btn:hover {
          color: var(--error);
        }

        .knowledge-textarea {
          min-height: 200px;
          resize: vertical;
        }
        .url-input-wrapper {
          position: relative;
        }
        .url-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .url-input {
          padding-left: 48px;
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
        .text-right {
          text-align: right;
        }
        .text-muted {
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
