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
          <div
            className="stat-card-icon"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--success)",
            }}
          >
            <Database size={24} />
          </div>
          <div className="stat-card-value text-success">{readyDocs}</div>
          <div className="stat-card-label">Ready</div>
        </div>

        <div className="stat-card glass-hover">
          <div
            className="stat-card-icon"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              color: "var(--warning)",
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div className="stat-card-value text-warning">{processingDocs}</div>
          <div className="stat-card-label">Processing</div>
        </div>

        <div className="stat-card glass-hover">
          <div
            className="stat-card-icon"
            style={{
              background: "rgba(99, 102, 241, 0.1)",
              color: "var(--accent-secondary)",
            }}
          >
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

      <style jsx>{`
        .content-container {
          max-width: 1200px;
        }
        .text-gradient {
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .section-title-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 2px;
          white-space: nowrap;
        }
        .section-divider {
          height: 1px;
          flex: 1;
          background: linear-gradient(
            to right,
            var(--border-color),
            transparent
          );
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 64px;
        }

        .quick-action-tile {
          position: relative;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 32px;
          padding: 48px 40px;
          text-decoration: none !important;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
          cursor: pointer;
        }

        /* Forced kill on any underlines and border-bottoms */
        .quick-action-tile h3,
        .quick-action-tile p,
        .quick-action-tile span,
        .quick-action-tile div {
          text-decoration: none !important;
          text-decoration-line: none !important;
          border-bottom: none !important;
        }

        .quick-action-tile:hover {
          transform: translateY(-12px) scale(1.02);
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.05);
          box-shadow:
            0 40px 80px -20px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(59, 130, 246, 0.15);
        }

        .tile-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
        }

        .tile-icon-box.blue {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        .tile-icon-box.indigo {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }
        .tile-icon-box.violet {
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .quick-action-tile:hover .tile-icon-box {
          transform: scale(1.1) rotate(-5deg);
        }

        .tile-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tile-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tile-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .tile-footer {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-primary);
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
          transition: all 0.3s;
          text-decoration: none !important;
        }

        .quick-action-tile:hover .tile-footer {
          opacity: 1;
          gap: 12px;
        }

        .tile-arrow {
          transition: transform 0.3s;
        }

        .quick-action-tile:hover .tile-arrow {
          transform: translateX(4px);
        }

        .tile-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          background: radial-gradient(
            circle at top right,
            rgba(59, 130, 246, 0.1),
            transparent 70%
          );
          pointer-events: none;
        }

        .empty-card {
          margin-top: 48px;
          text-align: center;
          padding: 80px 40px;
          border-radius: var(--radius-xl);
          background: radial-gradient(
            circle at top,
            rgba(59, 130, 246, 0.05),
            transparent 70%
          );
          border: 1px solid var(--border-color);
        }

        .empty-icon-glow {
          width: 88px;
          height: 88px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          color: white;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
        }

        .empty-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .empty-text {
          color: var(--text-secondary);
          max-width: 440px;
          margin: 0 auto 32px;
          font-size: 16px;
        }

        .text-success {
          color: var(--success);
        }
        .text-warning {
          color: var(--warning);
        }
        .text-accent-secondary {
          color: var(--accent-secondary);
        }
      `}</style>
    </div>
  );
}
