"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
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
        "Hi! I'm your portfolio assistant. Ask me anything about your experience, skills, or projects. I'll answer based on your knowledge base.",
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

  const isLimitReached = messages.length >= 50;

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
          "Hi! I'm your portfolio assistant. Ask me anything about your experience, skills, or projects. I'll answer based on your knowledge base.",
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
        <style jsx>{`
          .content-container {
            max-width: 1000px;
            margin: 0 auto;
          }
          .setup-prompt {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 80px 40px;
            border-radius: var(--radius-xl);
            text-align: center;
          }
          .setup-prompt p {
            color: var(--text-secondary);
          }
        `}</style>
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
        <style jsx>{`
          .content-container {
            max-width: 1000px;
            margin: 0 auto;
          }
          .setup-prompt {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding: 80px 40px;
            border-radius: var(--radius-xl);
            text-align: center;
          }
          .setup-icon {
            width: 80px;
            height: 80px;
            background: rgba(251, 191, 36, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fbbf24;
          }
          .setup-prompt h2 {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
          }
          .setup-prompt p {
            color: var(--text-secondary);
            max-width: 400px;
            line-height: 1.6;
            margin: 0;
          }
        `}</style>
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
              <div className="bot-avatar-glow">
                <div className="bot-avatar">
                  <Bot size={24} />
                </div>
              </div>
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
              <span className="message-count">{messages.length}/50</span>
            </div>
          </div>

          <div className="testing-notice">
            <Info size={14} />
            <span>
              This chat is in testing. It will persist until reset or after 50
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
                      The conversation has reached 50 messages and will now
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

      <style jsx>{`
        .content-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .chat-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .text-gradient {
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .strict-mode-card {
          padding: 6px 16px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--glass-border);
        }
        .strict-toggle {
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .toggle-track {
          width: 36px;
          height: 20px;
          background: var(--bg-tertiary);
          border-radius: 10px;
          position: relative;
          transition: all 0.3s;
          border: 1px solid var(--border-color);
        }
        .toggle-thumb {
          width: 14px;
          height: 14px;
          background: var(--text-muted);
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .strict-toggle.active .toggle-track {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .strict-toggle.active .toggle-thumb {
          transform: translateX(16px);
          background: white;
        }
        .toggle-label {
          font-size: 13px;
          font-weight: 600;
        }

        .info-icon {
          position: relative;
          color: var(--text-muted);
          cursor: help;
          display: flex;
        }
        .info-icon .tooltip {
          position: absolute;
          bottom: 100%;
          right: 0;
          width: 240px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s;
          z-index: 100;
          margin-bottom: 12px;
        }
        .info-icon:hover .tooltip {
          opacity: 1;
          transform: translateY(0);
        }
        .tooltip strong {
          display: block;
          margin-bottom: 4px;
          color: var(--text-primary);
        }
        .tooltip p {
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
        }

        .chat-interface-wrapper {
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          height: 750px;
        }
        .chat-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
        }
        .chat-header {
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-bot-identity {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .bot-avatar-glow {
          position: relative;
        }
        .bot-avatar-glow::after {
          content: "";
          position: absolute;
          inset: -4px;
          background: var(--accent-gradient);
          border-radius: 50%;
          filter: blur(8px);
          opacity: 0.3;
        }
        .bot-avatar {
          width: 48px;
          height: 48px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          z-index: 1;
        }
        .bot-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .bot-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
        }
        .status-dot.pulsing {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .chat-messages-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .chat-message-wrapper {
          display: flex;
          width: 100%;
        }
        .chat-message-wrapper.user {
          justify-content: flex-end;
        }
        .chat-message-wrapper.assistant {
          justify-content: flex-start;
        }

        .chat-message {
          max-width: 80%;
          padding: 16px 20px;
          font-size: 15px;
          line-height: 1.6;
          position: relative;
          box-shadow: var(--shadow-sm);
        }
        .chat-message.user {
          background: var(--accent-gradient);
          color: white;
          border-radius: 20px 20px 4px 20px;
        }
        .chat-message.assistant {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: 20px 20px 20px 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .chat-footer {
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid var(--border-color);
        }
        .suggested-prompts {
          margin-bottom: 24px;
        }
        .suggestion-hint {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .prompts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .suggestion-btn {
          padding: 8px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestion-btn:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
          transform: translateY(-2px);
        }

        .chat-form {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .chat-input {
          flex: 1;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 14px 24px;
          color: var(--text-primary);
          font-size: 15px;
          transition: all 0.3s;
        }
        .chat-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .chat-send-btn-new {
          width: 52px;
          height: 52px;
          background: var(--accent-gradient);
          color: white;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: var(--accent-glow);
          border: none;
        }
        .chat-send-btn-new:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }
        .chat-send-btn-new:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        .testing-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
        }
        .testing-text {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-primary);
        }
        .message-count {
          font-size: 12px;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        .testing-notice {
          background: rgba(59, 130, 246, 0.1);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          padding: 8px 32px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .limit-reached-message {
          display: flex;
          justify-content: center;
          padding: 20px 0;
        }
        .notice-card {
          padding: 20px 32px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.05) !important;
        }
        .notice-card h4 {
          margin: 0 0 4px 0;
          color: var(--text-primary);
        }
        .notice-card p {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
