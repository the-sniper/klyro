"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { X, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchContent = async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/whats-new");
          if (res.ok) {
            const text = await res.text();
            setContent(text);
          } else {
            setContent("Failed to load release notes.");
          }
        } catch (error) {
          console.error("Failed to fetch release notes:", error);
          setContent("Failed to load release notes.");
        } finally {
          setLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="modal-overlay animate-overlay"
      onClick={onClose}
      style={{ zIndex: 10000 }}
    >
      <div
        className="modal-glass animate-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="modal-header"
          style={{
            paddingBottom: "16px",
            borderBottom: "1px solid var(--border-color)",
            marginBottom: "20px",
            flexShrink: 0,
          }}
        >
          <div
            className="modal-header-text"
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h2
                className="modal-title"
                style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}
              >
                What's New in Klyro
              </h2>
              <p
                className="modal-subtitle"
                style={{ margin: 0, marginTop: "4px" }}
              >
                Latest updates and improvements
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
            paddingRight: "8px",
            flex: 1,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px",
                flex: 1,
              }}
            >
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          ) : (
            <>
              <style>{`
                .whats-new-markdown h3:first-of-type {
                  margin-top: 0 !important;
                  padding-top: 0 !important;
                  border-top: none !important;
                }
              `}</style>
              <div
                className="whats-new-markdown"
                style={{ display: "flex", flexDirection: "column", gap: "0px" }}
              >
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => (
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "white",
                          marginTop: "24px",
                          marginBottom: "6px",
                          paddingTop: "24px",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "14px",
                          lineHeight: 1.6,
                          marginBottom: "12px",
                          marginTop: "0",
                        }}
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "14px",
                          listStyleType: "disc",
                          paddingLeft: "24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginBottom: "16px",
                          marginTop: "4px",
                        }}
                        {...props}
                      />
                    ),
                    em: ({ node, ...props }) => (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--accent-primary)",
                          background: "rgba(59, 130, 246, 0.1)",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          display: "inline-block",
                          marginBottom: "12px",
                          fontWeight: 600,
                          fontStyle: "normal",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                        }}
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                        {...props}
                      />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>

        <div
          className="modal-footer"
          style={{ marginTop: "24px", flexShrink: 0 }}
        >
          <button
            className="btn btn-primary w-full"
            onClick={onClose}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
