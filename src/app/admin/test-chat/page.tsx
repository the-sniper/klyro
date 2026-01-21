"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  RotateCcw,
  Bot,
  User,
  FileText,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    document_name: string;
    similarity: number;
  }>;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

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
          widgetKey: "default",
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
          sources: data.sources,
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
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your portfolio assistant. Ask me anything about your experience, skills, or projects. I'll answer based on your knowledge base.",
      },
    ]);
    setSessionId(null);
  }

  const suggestedPrompts = [
    "What's your work experience?",
    "Tell me about your projects",
    "What skills do you have?",
    "How can I contact you?",
  ];

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
          <h1 className="page-title">Test Chat</h1>
          <p className="page-subtitle">
            Test how your chatbot responds to questions
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="btn btn-ghost"
            onClick={() => setStrictMode(!strictMode)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {strictMode ? (
              <ToggleRight size={20} color="var(--accent-primary)" />
            ) : (
              <ToggleLeft size={20} />
            )}
            Strict Mode
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-avatar">
            <Bot size={24} color="white" />
          </div>
          <div className="chat-header-info">
            <h3>Portfolio Assistant</h3>
            <p>Powered by your knowledge base</p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              {msg.content}

              {msg.sources && msg.sources.length > 0 && (
                <div className="sources-container">
                  <div className="sources-title">Sources used:</div>
                  {msg.sources.map((source, idx) => (
                    <div key={idx} className="source-item">
                      <FileText size={12} />
                      <span>{source.document_name}</span>
                      <span style={{ marginLeft: "auto", opacity: 0.6 }}>
                        {Math.round(source.similarity * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div
            style={{
              padding: "0 24px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                className="btn btn-secondary"
                style={{ fontSize: "13px", padding: "8px 14px" }}
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-area">
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flex: 1, gap: "12px" }}
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || loading}
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
  );
}
