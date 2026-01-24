"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

        // Only set state if we got arrays (API errors return objects)
        if (Array.isArray(docsData)) {
          setDocuments(docsData);
        }
        if (Array.isArray(widgetsData)) {
          setWidgets(widgetsData);
        }
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
      <div className="flex items-center justify-center min-vh-400">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in content-container">
      <div className="page-header">
        <h1 className="page-title text-gradient">Dashboard</h1>
        <p className="page-subtitle">
          Manage your AI chatbot and knowledge base
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-hover">
          <div className="stat-card-icon">
            <FileText size={24} />
          </div>
          <div className="stat-card-value">{documents.length}</div>
          <div className="stat-card-label">Documents</div>
        </div>

        <div className="stat-card glass-hover">
          <div className="stat-card-icon icon-wrapper-success">
            <Database size={24} />
          </div>
          <div className="stat-card-value text-success">{readyDocs}</div>
          <div className="stat-card-label">Ready</div>
        </div>

        <div className="stat-card glass-hover">
          <div className="stat-card-icon icon-wrapper-warning">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card-value text-warning">{processingDocs}</div>
          <div className="stat-card-label">Processing</div>
        </div>

        <div className="stat-card glass-hover">
          <div className="stat-card-icon icon-wrapper-secondary">
            <Code2 size={24} />
          </div>
          <div className="stat-card-value text-accent-secondary">
            {widgets.length}
          </div>
          <div className="stat-card-label">Widgets</div>
        </div>
      </div>

      <div className="section-title-wrapper">
        <h2 className="section-title">Quick Actions</h2>
        <div className="section-divider"></div>
      </div>

      <div className="quick-actions-grid">
        {[
          {
            href: "/admin/knowledge",
            icon: Database,
            title: "Knowledge Base",
            description:
              "Add and manage the documentation that powers your AI's intelligence",
            color: "blue",
          },
          {
            href: "/admin/test-chat",
            icon: MessageSquare,
            title: "Test Chat",
            description:
              "Interact with your chatbot in a safe environment before deploying",
            color: "indigo",
          },
          {
            href: "/admin/integrations",
            icon: Code2,
            title: "Integrations",
            description:
              "Get your unique embed snippet and configure widget appearance",
            color: "violet",
          },
        ].map((action, i) => (
          <div
            key={i}
            onClick={() => router.push(action.href)}
            className="quick-action-tile"
          >
            <div className={`tile-icon-box ${action.color}`}>
              <action.icon size={28} />
            </div>
            <div className="tile-content">
              <h3 className="tile-title">{action.title}</h3>
              <p className="tile-desc">{action.description}</p>
              <div className="tile-footer">
                <span className="tile-link-text">Configure</span>
                <ArrowRight size={16} className="tile-arrow" />
              </div>
            </div>
            <div className="tile-glow"></div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      {documents.length === 0 && (
        <div className="empty-card glass">
          <div className="empty-icon-glow">
            <Sparkles size={40} />
          </div>
          <h2 className="empty-title">Get Started</h2>
          <p className="empty-text">
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
