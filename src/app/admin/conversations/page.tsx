"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  Clock,
  Search,
  Loader2,
  User,
  Bot,
  Info,
  Database,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface SessionPreview {
  id: string;
  visitor_id: string;
  created_at: string;
  messageCount: number;
  latestMessage: {
    content: string;
    role: "user" | "assistant";
    created_at: string;
  } | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: any[];
  created_at: string;
}

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    }
    fetchSessions();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (!selectedSessionId) return;

      setLoadingMessages(true);
      try {
        const res = await fetch(
          `/api/conversations/${selectedSessionId}/messages`,
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [selectedSessionId]);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Format full date for right pane
  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (messages: ChatMessage[]) => {
    if (messages.length < 2) return "Less than a minute";

    const first = new Date(messages[0].created_at).getTime();
    const last = new Date(messages[messages.length - 1].created_at).getTime();
    const diffMins = Math.max(1, Math.round((last - first) / 60000));

    return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.visitor_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.latestMessage?.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className="animate-fade-in content-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 96px)",
      }}
    >
      <div
        className="page-header flex-shrink-0"
        style={{ marginBottom: "24px" }}
      >
        <div className="header-text">
          <h1 className="page-title text-gradient">Conversations</h1>
          <p className="page-subtitle">
            View chat history and interactions from your website visitors
          </p>
        </div>
      </div>

      <div
        className="split-pane-layout"
        style={{
          display: "flex",
          gap: "24px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left Pane: Sessions List */}
        <div
          className="sessions-list-pane card glass"
          style={{
            width: "350px",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="sessions-header"
            style={{
              padding: "20px",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div className="search-container" style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search visitors or messages..."
                className="form-input"
                style={{
                  paddingLeft: "40px",
                  paddingRight: "12px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  fontSize: "14px",
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div
            className="sessions-scroll-area"
            style={{ flex: 1, overflowY: "auto" }}
          >
            {loadingSessions ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  flexDirection: "column",
                  gap: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <Loader2 size={24} className="animate-spin text-accent" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  flexDirection: "column",
                  gap: "16px",
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MessageCircle size={24} color="var(--text-muted)" />
                </div>
                <p style={{ color: "var(--text-secondary)" }}>
                  No conversations found.
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {filteredSessions.map((session) => (
                  <li key={session.id}>
                    <button
                      onClick={() => setSelectedSessionId(session.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "16px 20px",
                        background:
                          selectedSessionId === session.id
                            ? "rgba(59, 130, 246, 0.1)"
                            : "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--border-color)",
                        borderLeft:
                          selectedSessionId === session.id
                            ? "3px solid var(--accent-primary)"
                            : "3px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        transition: "all 0.2s",
                      }}
                      className="hover:bg-white/5"
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "var(--bg-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <User size={16} color="var(--text-secondary)" />
                          </div>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "var(--text-primary)",
                            }}
                          >
                            Visitor {session.visitor_id.substring(0, 6)}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {formatDate(session.created_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          width: "100%",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            flex: 1,
                            paddingRight: "12px",
                          }}
                        >
                          {session.latestMessage ? (
                            <>
                              <span
                                style={{
                                  color:
                                    session.latestMessage.role === "assistant"
                                      ? "var(--accent-primary)"
                                      : "var(--text-muted)",
                                }}
                              >
                                {session.latestMessage.role === "assistant"
                                  ? "Bot: "
                                  : "You: "}
                              </span>
                              {session.latestMessage.content}
                            </>
                          ) : (
                            <span style={{ fontStyle: "italic" }}>
                              No messages yet
                            </span>
                          )}
                        </p>
                        {session.messageCount > 0 && (
                          <span
                            style={{
                              background: "var(--bg-tertiary)",
                              color: "var(--text-secondary)",
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {session.messageCount} msg
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Pane: Transcript View */}
        <div
          className="transcript-pane card glass"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {!selectedSessionId ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MessageCircle size={32} color="var(--accent-primary)" />
              </div>
              <div style={{ textAlign: "center" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  Select a conversation
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                  Click on a visitor session from the left to view the full chat
                  transcript.
                </p>
              </div>
            </div>
          ) : loadingMessages ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <Loader2 size={32} className="animate-spin text-accent" />
              <p style={{ color: "var(--text-secondary)" }}>
                Loading transcript...
              </p>
            </div>
          ) : (
            <>
              {/* Transcript Header */}
              <div
                style={{
                  padding: "24px 32px",
                  borderBottom: "1px solid var(--border-color)",
                  background: "rgba(255, 255, 255, 0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <User size={20} className="text-accent" />
                    <span>Visitor {selectedSessionId.substring(0, 8)}</span>
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Calendar size={14} />
                      {messages.length > 0
                        ? formatFullDate(messages[0].created_at)
                        : "Unknown date"}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Clock size={14} />
                      Duration: {calculateDuration(messages)}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <MessageCircle size={14} />
                      {messages.length} messages
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--bg-tertiary)",
                    padding: "8px 16px",
                    borderRadius: "40px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Info size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    Session ID: {selectedSessionId.substring(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Transcript Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      marginTop: "40px",
                    }}
                  >
                    No messages recorded in this session.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          msg.role === "user" ? "flex-end" : "flex-start",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                          padding: "0 4px",
                          color: "var(--text-muted)",
                          fontSize: "12px",
                        }}
                      >
                        {msg.role === "assistant" && <Bot size={14} />}
                        <span>
                          {msg.role === "user" ? "Visitor" : "Assistant"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`chat-message ${msg.role}`}
                        style={{
                          padding: "16px 20px",
                          borderRadius: "16px",
                          borderBottomRightRadius:
                            msg.role === "user" ? "4px" : "16px",
                          borderBottomLeftRadius:
                            msg.role === "assistant" ? "4px" : "16px",
                          background:
                            msg.role === "user"
                              ? "var(--accent-gradient)"
                              : "var(--bg-tertiary)",
                          color:
                            msg.role === "user"
                              ? "white"
                              : "var(--text-primary)",
                          maxWidth: "85%",
                          border:
                            msg.role === "assistant"
                              ? "1px solid var(--border-color)"
                              : "none",
                          lineHeight: 1.5,
                          fontSize: "15px",
                        }}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>

                        {/* Source citations rendering */}
                        {msg.role === "assistant" &&
                          msg.sources &&
                          msg.sources.length > 0 && (
                            <div
                              style={{
                                marginTop: "16px",
                                paddingTop: "12px",
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  marginBottom: "8px",
                                  fontWeight: 600,
                                }}
                              >
                                <Database size={12} />
                                <span>Knowledge Sources Used:</span>
                              </div>
                              <ul
                                style={{
                                  margin: 0,
                                  paddingLeft: "16px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                {msg.sources.map((source: any, idx: number) => (
                                  <li key={idx} style={{ opacity: 0.8 }}>
                                    {source.name || "Document segment"}{" "}
                                    {source.similarity
                                      ? `(${(source.similarity * 100).toFixed(0)}% relevant)`
                                      : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
