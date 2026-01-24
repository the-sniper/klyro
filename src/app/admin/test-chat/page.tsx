"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import {
  Send,
  RotateCcw,
  Bot,
  Loader2,
  Info,
  AlertCircle,
  Code2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function TestChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm your portfolio assistant. Ask me anything about your experience, skills, or projects. I'll answer based on your knowledge base.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [strictMode, setStrictMode] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasWidget, setHasWidget] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch a valid widget key on mount
  const [activeWidgetKey, setActiveWidgetKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWidgetKey() {
      try {
        const res = await fetch("/api/widget");
        if (res.ok) {
          const widgets = await res.json();
          if (widgets && widgets.length > 0) {
            setActiveWidgetKey(widgets[0].widget_key);
            setHasWidget(true);
          } else {
            setHasWidget(false);
          }
        } else {
          setHasWidget(false);
        }
      } catch (e) {
        console.error("Failed to fetch widget key", e);
        setHasWidget(false);
      }
    }
    fetchWidgetKey();

    // Clear any old localStorage data
    localStorage.removeItem("test-chat-messages");
    localStorage.removeItem("test-chat-session-id");
    setIsLoaded(true);
  }, []);

  const isLimitReached = messages.length >= 15;

  useEffect(() => {
    if (isLimitReached) {
      // Small delay to let the user see the last message before reset
      const timer = setTimeout(() => {
        handleReset();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || isLimitReached) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          widgetKey: activeWidgetKey,
          sessionId,
          strictMode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSessionId(data.sessionId);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Error: ${data.error || "Something went wrong"}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Failed to connect to the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    const defaultMessages: Message[] = [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hey! I'm your portfolio assistant. Ask me anything about your experience, skills, or projects. I'll answer based on your knowledge base.",
      },
    ];
    setMessages(defaultMessages);
    setSessionId(null);
    localStorage.removeItem("test-chat-messages");
    localStorage.removeItem("test-chat-session-id");
  }

  const suggestedPrompts = [
    "What's your work experience?",
    "Tell me about your projects",
    "What skills do you have?",
    "How can I contact you?",
  ];

  // Loading state
  if (hasWidget === null) {
    return (
      <div className="animate-fade-in content-container">
        <div className="page-header chat-page-header">
          <div className="header-text">
            <h1 className="page-title text-gradient">Test Chat</h1>
            <p className="page-subtitle">
              Experience how your chatbot interacts with visitors
            </p>
          </div>
        </div>
        <div className="setup-prompt glass">
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "var(--accent-primary)" }}
          />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // No widget configured
  if (!hasWidget) {
    return (
      <div className="animate-fade-in content-container">
        <div className="page-header chat-page-header">
          <div className="header-text">
            <h1 className="page-title text-gradient">Test Chat</h1>
            <p className="page-subtitle">
              Experience how your chatbot interacts with visitors
            </p>
          </div>
        </div>
        <div className="setup-prompt glass">
          <div className="setup-icon">
            <AlertCircle size={48} />
          </div>
          <h2>Widget Setup Required</h2>
          <p>
            You need to create a widget before you can test the chat. Head over
            to Integrations to set up your first widget.
          </p>
          <Link href="/admin/integrations" className="btn btn-primary">
            <Code2 size={18} />
            Go to Integrations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in content-container">
      <div className="page-header chat-page-header">
        <div className="header-text">
          <h1 className="page-title text-gradient">Test Chat</h1>
          <p className="page-subtitle">
            Experience how your chatbot interacts with visitors
          </p>
        </div>
        <div className="header-actions">
          <div className="strict-mode-card glass">
            <button
              className={`strict-toggle ${strictMode ? "active" : ""}`}
              onClick={() => setStrictMode(!strictMode)}
            >
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">Strict Mode</span>
            </button>
            <div className="info-icon">
              <Info size={14} />
              <div className="tooltip">
                <strong>Strict Mode</strong>
                <p>
                  When enabled, responses are restricted to knowledge base
                  content only.
                </p>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="chat-interface-wrapper glass">
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-bot-identity">
              {/* <div className="bot-avatar-plain">
                <Image
                  src="/logo.svg"
                  alt="Klyro"
                  width={100}
                  height={32}
                  style={{ objectFit: "contain" }}
                />
              </div> */}
              <div className="chat-info">
                <h3 className="bot-name">Portfolio Assistant</h3>
                <div className="bot-status">
                  <span className="status-dot pulsing" />
                  Online & Ready
                </div>
              </div>
            </div>
            <div className="testing-badge">
              <span className="testing-text">Testing Mode</span>
              <span className="message-count">{messages.length}/15</span>
            </div>
          </div>

          <div className="testing-notice">
            <Info size={14} />
            <span>
              This chat is in testing. It will persist until reset or after 15
              messages.
            </span>
          </div>

          <div className="chat-messages-scroll" id="scroll-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-wrapper ${msg.role}`}>
                <div className={`chat-message ${msg.role}`}>
                  <div className="message-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message-wrapper assistant">
                <div className="chat-message assistant typing">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            {isLimitReached && (
              <div className="limit-reached-message">
                <div className="notice-card glass">
                  <RotateCcw size={20} className="animate-spin-slow" />
                  <div>
                    <h4>Message Limit Reached</h4>
                    <p>
                      The conversation has reached 15 messages and will now
                      reset.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            {messages.length === 1 && (
              <div className="suggested-prompts">
                <div className="suggestion-hint">Suggested Questions:</div>
                <div className="prompts-list">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="suggestion-btn"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-input-area">
              <form onSubmit={handleSubmit} className="chat-form">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading || isLimitReached}
                />
                <button
                  type="submit"
                  className="chat-send-btn-new"
                  disabled={!input.trim() || loading || isLimitReached}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
