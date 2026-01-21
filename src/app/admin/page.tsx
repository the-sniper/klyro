"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  MessageSquare,
  Code2,
  FileText,
  TrendingUp,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Document, Widget } from "@/types";

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [docsRes, widgetsRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/widget"),
        ]);

        const docsData = await docsRes.json();
        const widgetsData = await widgetsRes.json();

        setDocuments(docsData);
        setWidgets(widgetsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const readyDocs = documents.filter((d) => d.status === "ready").length;
  const processingDocs = documents.filter(
    (d) => d.status === "processing",
  ).length;

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
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Manage your AI chatbot and knowledge base
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">
            <FileText size={24} color="white" />
          </div>
          <div className="stat-card-value">{documents.length}</div>
          <div className="stat-card-label">Total Documents</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <Database size={24} color="white" />
          </div>
          <div className="stat-card-value">{readyDocs}</div>
          <div className="stat-card-label">Ready for Chat</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <TrendingUp size={24} color="white" />
          </div>
          <div className="stat-card-value">{processingDocs}</div>
          <div className="stat-card-label">Processing</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">
            <Code2 size={24} color="white" />
          </div>
          <div className="stat-card-value">{widgets.length}</div>
          <div className="stat-card-label">Widgets</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        <Link
          href="/admin/knowledge"
          className="card"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "var(--accent-gradient)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Database size={24} color="white" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Knowledge Base
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Add and manage documents
                </p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--text-secondary)" />
          </div>
        </Link>

        <Link
          href="/admin/test-chat"
          className="card"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "var(--accent-gradient)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={24} color="white" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Test Chat
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Try your chatbot
                </p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--text-secondary)" />
          </div>
        </Link>

        <Link
          href="/admin/integrations"
          className="card"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "var(--accent-gradient)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Code2 size={24} color="white" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Integrations
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Get embed code
                </p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--text-secondary)" />
          </div>
        </Link>
      </div>

      {/* Getting Started */}
      {documents.length === 0 && (
        <div
          className="card"
          style={{ marginTop: "32px", textAlign: "center", padding: "48px" }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "var(--accent-gradient)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Sparkles size={36} color="white" />
          </div>
          <h2
            style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}
          >
            Get Started
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "24px",
              maxWidth: "400px",
              margin: "0 auto 24px",
            }}
          >
            Add some documents to your knowledge base to power your AI chatbot.
          </p>
          <Link href="/admin/knowledge">
            <button className="btn btn-primary">
              <Database size={18} />
              Add Your First Document
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
