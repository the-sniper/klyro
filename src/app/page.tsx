"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  Zap,
  Shield,
  Github,
  Sparkles,
  Check,
  RotateCcw,
  Send,
  Download,
  Layers,
  Smile,
  Briefcase,
  Coffee,
  Award,
  Leaf,
  Plus,
} from "lucide-react";

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState(1); // Start with The Muse (center)
  const [isPaused, setIsPaused] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [configMousePos, setConfigMousePos] = useState({ x: 0, y: 0 });
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const configWidgetRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    const rect = widgetRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleConfigMouseMove = (e: React.MouseEvent) => {
    if (!configWidgetRef.current) return;
    const rect = configWidgetRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setConfigMousePos({ x, y });
  };

  const handleConfigMouseLeave = () => {
    setConfigMousePos({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActivePersona((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <main className="landing-page">
      {/* Navigation */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "24px 0",
          background: "rgba(10, 10, 12, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div
          className="landing-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/logo.svg"
              alt="Klyro Logo"
              width={120}
              height={40}
              style={{ objectFit: "contain" }}
            />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link
              href="/login"
              className="btn-secondary"
              style={{
                padding: "8px 20px",
                fontSize: "14px",
                borderRadius: "100px",
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                borderRadius: "100px",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container">
          <div className="hero-content-wrapper">
            <div className="hero-text-content">
              {/* <div className="badge animate-fade-in">
                <Sparkles size={14} style={{ marginRight: "8px" }} />
                The next generation of portfolio engagement
              </div> */}
              <h1
                className="hero-title animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                Define Your Persona, <br />
                <span style={{ color: "var(--accent-primary)" }}>
                  Let AI Tell Your Story.
                </span>
              </h1>
              <p
                className="hero-subtitle animate-fade-in"
                style={{
                  animationDelay: "0.2s",
                  margin: "0 0 32px 0",
                  maxWidth: "100%",
                }}
              >
                Transform your static portfolio into a dynamic digital twin. Let
                visitors explore your work, skills, and personality through a
                custom AI persona trained on your unique journey.
              </p>
              <div
                className="animate-fade-in"
                style={{
                  animationDelay: "0.3s",
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: "16px",
                }}
              >
                <Link
                  href="/signup"
                  className="btn btn-primary"
                  style={{ padding: "16px 32px", fontSize: "16px" }}
                >
                  Start for Free <ArrowRight size={18} />
                </Link>
                {/* <Link
                  href="#demo"
                  className="btn btn-secondary"
                  style={{ padding: "16px 32px", fontSize: "16px" }}
                >
                  View Live Demo
                </Link> */}
              </div>
            </div>

            {/* Persona Showcase Stack */}
            <div
              className="persona-carousel-wrapper"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div
                className="persona-stack-container animate-fade-in"
                style={{ animationDelay: "0.4s", cursor: "pointer" }}
                onClick={() => setActivePersona((prev) => (prev + 1) % 3)}
              >
                {[
                  {
                    id: "architect",
                    name: "The Architect",
                    tagline: "Precise & Logistical",
                    info: "Specializes in technical architecture, system design, and deep-dive technical queries.",
                    avatar: "/images/avatars/architect_head.png",
                    color: "#3b82f6",
                  },
                  {
                    id: "strategist",
                    name: "The Strategist",
                    tagline: "Results-Driven",
                    info: "Emphasizes market impact, project ROI, and long-term strategic value of your work.",
                    avatar: "/images/avatars/strategist_head.png",
                    color: "#f59e0b",
                  },
                  {
                    id: "muse",
                    name: "The Muse",
                    tagline: "Witty & Inspiring",
                    info: "Focuses on user experience, design philosophy, and creative storytelling of your journey.",
                    avatar: "/images/avatars/muse_head.png",
                    color: "#d946ef",
                  },
                ].map((persona, i) => {
                  const isActive = activePersona === i;
                  const isPrev = i === (activePersona - 1 + 3) % 3;
                  const isNext = i === (activePersona + 1) % 3;

                  return (
                    <div
                      key={persona.id}
                      className={`persona-card ${isActive ? "active" : ""} ${
                        isActive
                          ? "pos-center"
                          : isPrev
                            ? "pos-left"
                            : "pos-right"
                      }`}
                      style={{ "--glow-color": persona.color } as any}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePersona(i);
                      }}
                    >
                      <div className="persona-glow-bg"></div>
                      <div className="persona-avatar-container">
                        <img
                          src={persona.avatar}
                          alt={persona.name}
                          className="persona-avatar-image"
                        />
                      </div>
                      <div className="persona-tagline">{persona.tagline}</div>
                      <div className="persona-name">{persona.name}</div>
                      <p className="persona-info">{persona.info}</p>
                    </div>
                  );
                })}
              </div>
              <div className="carousel-indicators">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`indicator ${activePersona === i ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePersona(i);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="auth-bg-blob-1 float-animation"
          style={{
            width: "40%",
            height: "40%",
            top: "20%",
            left: "30%",
            opacity: 0.3,
          }}
        ></div>
      </section>

      {/* Product Demo Section */}
      <section
        id="demo"
        className="landing-container"
        style={{ padding: "80px 0" }}
      >
        <div className="demo-grid">
          <div style={{ textAlign: "left" }}>
            {/* <span className="section-label">Live Preview</span> */}
            <h2 className="section-title">
              An intelligent assistant that truly knows you.
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "18px",
                marginBottom: "32px",
              }}
            >
              Upload your resume, technical documents, or link your GitHub.
              Klyro uses advanced RAG technology to ensure every response is
              accurate and based on your verified data.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div
                className="glass-hover"
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    padding: "10px",
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "var(--accent-primary)",
                    borderRadius: "12px",
                  }}
                >
                  <Shield size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600 }}>
                    Privacy First
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                    Your data is encrypted and only used to train your personal
                    model.
                  </p>
                </div>
              </div>
              <div
                className="glass-hover"
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    padding: "10px",
                    background: "rgba(99, 102, 241, 0.1)",
                    color: "var(--accent-secondary)",
                    borderRadius: "12px",
                  }}
                >
                  <Zap size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600 }}>
                    Ultra Fast Retrieval
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                    Sub-second response times using optimized vector Search.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              padding: "60px", // Larger hitspace for better tracking
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={widgetRef}
            className="animate-fade-in"
          >
            <div
              style={{
                borderRadius: "24px",
                overflow: "hidden",
                height: "540px",
                width: "440px",
                display: "flex",
                flexDirection: "column",
                boxShadow:
                  "0 40px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                background: "#0a0a0c",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                transform: `perspective(1200px) rotateY(${mousePos.x * 6}deg) rotateX(${-mousePos.y * 6}deg) translate(${-mousePos.x * 40}px, ${-mousePos.y * 40}px)`,
                transition:
                  mousePos.x === 0 && mousePos.y === 0
                    ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
                    : "transform 0.15s ease-out",
                transformStyle: "preserve-3d",
                zIndex: 10,
              }}
            >
              {/* Widget Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "var(--accent-gradient)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <Check size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.2,
                    }}
                  >
                    Klyro Assistant
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Your personal guide to this site
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <Download size={16} />
                  </div>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <RotateCcw size={16} />
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "13.5px",
                  overflowY: "hidden",
                  background: "#0f172a",
                }}
              >
                {/* Empty State Visual */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "5px 0 15px 0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      background: "rgba(59, 130, 246, 0.1)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent-primary)",
                      marginBottom: "12px",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <Check size={26} />
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "16px",
                      marginBottom: "4px",
                      color: "#fff",
                    }}
                  >
                    Hey! I'm Klyro's copilot
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    I can help answer questions about them
                  </div>
                </div>

                <div
                  className="chat-message user"
                  style={{
                    alignSelf: "flex-end",
                    animation: "fadeIn 0.5s ease-out forwards",
                    background: "var(--accent-gradient)",
                    padding: "10px 14px",
                    borderRadius: "16px 16px 4px 16px",
                    maxWidth: "85%",
                    lineHeight: "1.4",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  Tell me about your experience with machine learning.
                </div>
                <div
                  className="chat-message assistant"
                  style={{
                    alignSelf: "flex-start",
                    animation: "fadeIn 0.5s ease-out forwards",
                    animationDelay: "1s",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    padding: "10px 14px",
                    borderRadius: "16px 16px 16px 4px",
                    color: "#f1f5f9",
                    maxWidth: "85%",
                    lineHeight: "1.4",
                  }}
                >
                  Based on your resume, you have 3+ years of experience. You
                  recently built a RAG pipeline in your "Klyro" project.
                </div>
              </div>

              {/* Input Area */}
              <div
                style={{
                  padding: "12px 16px",
                  background: "#1e293b",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "100px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.4)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Type a message...</span>
                  </div>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "var(--accent-primary)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <Send size={16} />
                  </div>
                </div>
              </div>

              {/* Branding Footer */}
              <div
                style={{
                  padding: "10px",
                  textAlign: "center",
                  background: "#1e293b",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <Layers size={14} style={{ color: "var(--accent-primary)" }} />
                Powered by{" "}
                <span
                  style={{ fontWeight: 700, color: "var(--accent-primary)" }}
                >
                  Klyro
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Showcase */}
      <section
        style={{
          background: "rgba(255,255,255,0.02)",
          padding: "100px 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="landing-container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-label">Personas & Customization</span>
            <h2 className="section-title">Your bot, your personality.</h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "18px",
                maxWidth: "700px",
                margin: "0 auto",
              }}
            >
              Adjust tone, style, and branding to make the assistant feel like
              an extension of yourself.
            </p>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              padding: "60px",
            }}
            onMouseMove={handleConfigMouseMove}
            onMouseLeave={handleConfigMouseLeave}
            ref={configWidgetRef}
            className="animate-fade-in"
          >
            <div
              className="glass"
              style={{
                borderRadius: "24px",
                padding: "48px",
                display: "flex",
                flexDirection: "column",
                gap: "48px",
                transform: `perspective(1500px) rotateY(${configMousePos.x * 2}deg) rotateX(${-configMousePos.y * 2}deg) translate(${-configMousePos.x * 20}px, ${-configMousePos.y * 20}px)`,
                transition:
                  configMousePos.x === 0 && configMousePos.y === 0
                    ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
                    : "transform 0.15s ease-out",
                transformStyle: "preserve-3d",
                cursor: "default",
              }}
            >
              {/* Persona Selection Strategy */}
              <div>
                <div
                  style={{
                    textAlign: "center",
                    position: "relative",
                    marginBottom: "40px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: "1px",
                      background: "rgba(255,255,255,0.05)",
                      zIndex: 0,
                    }}
                  ></div>
                  <span
                    style={{
                      position: "relative",
                      background: "var(--bg-secondary)",
                      padding: "0 20px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      zIndex: 1,
                    }}
                  >
                    OR CUSTOMIZE YOUR OWN
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      name: "Friendly",
                      icon: <Smile size={20} />,
                      desc: "Warm, approachable, uses casual language",
                      active: true,
                    },
                    {
                      name: "Professional",
                      icon: <Briefcase size={20} />,
                      desc: "Polished but personable, balanced tone",
                    },
                    {
                      name: "Casual",
                      icon: <Coffee size={20} />,
                      desc: "Super relaxed, like texting a friend",
                    },
                    {
                      name: "Formal",
                      icon: <Award size={20} />,
                      desc: "Precise, articulate, no slang",
                    },
                    {
                      name: "Enthusiastic",
                      icon: <Zap size={20} />,
                      desc: "High energy, excited about everything",
                    },
                    {
                      name: "Calm & Thoughtful",
                      icon: <Leaf size={20} />,
                      desc: "Measured, reflective, takes time to explain",
                    },
                  ].map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "20px",
                        borderRadius: "16px",
                        background: p.active
                          ? "rgba(59, 130, 246, 0.05)"
                          : "rgba(255,255,255,0.02)",
                        border: p.active
                          ? "2px solid var(--accent-primary)"
                          : "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        gap: "16px",
                        cursor: "default",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: p.active
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(255,255,255,0.02)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: p.active
                            ? "var(--accent-primary)"
                            : "var(--text-muted)",
                        }}
                      >
                        {p.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "15px",
                            color: p.active ? "#fff" : "var(--text-secondary)",
                            marginBottom: "4px",
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            lineHeight: 1.4,
                          }}
                        >
                          {p.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* traits and instructions */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "48px",
                }}
              >
                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: "16px", display: "block" }}
                  >
                    Personality Traits
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      className="glass"
                      style={{
                        flex: 1,
                        padding: "12px 18px",
                        borderRadius: "12px",
                        color: "rgba(255,255,255,0.2)",
                        fontSize: "14px",
                      }}
                    >
                      Add a trait...
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: "0 24px",
                        borderRadius: "12px",
                        background: "#1e1e24",
                        cursor: "default",
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Suggestions:
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {[
                      "technical",
                      "creative",
                      "analytical",
                      "humble",
                      "confident",
                      "curious",
                      "detail-oriented",
                    ].map((s) => (
                      <div
                        key={s}
                        className="badge"
                        style={{
                          margin: 0,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "6px 14px",
                          fontSize: "13px",
                          cursor: "default",
                        }}
                      >
                        + {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: "16px", display: "block" }}
                  >
                    Custom Instructions
                  </label>
                  <div
                    className="glass"
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      minHeight: "120px",
                      fontSize: "14px",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    Never talk about the tech stack
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "12px",
                    }}
                  >
                    Specific guidance for the bot's responses
                  </p>
                </div>
              </div>

              {/* Knowledge Sources section moved inside */}
              <div
                style={{
                  background: "rgba(255,255,255,0.01)",
                  padding: "32px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                <label
                  className="form-label"
                  style={{ marginBottom: "20px", display: "block" }}
                >
                  Connected Knowledge Sources
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div
                    className="glass-hover"
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <Check size={18} className="text-success" />
                      <span style={{ fontSize: "15px", fontWeight: 500 }}>
                        resume_2024.pdf
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--success)" }}>
                      Processed
                    </span>
                  </div>
                  <div
                    className="glass-hover"
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <Github size={18} className="text-accent" />
                      <span style={{ fontSize: "15px", fontWeight: 500 }}>
                        github.com/the-sniper/klyro
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--accent-primary)",
                      }}
                    >
                      Synced
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: "16px 48px",
                    borderRadius: "100px",
                    cursor: "default",
                  }}
                >
                  Preview Your Configured Assistant
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "100px 0" }}>
        <div className="landing-container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-label">Core Capabilities</span>
            <h2 className="section-title">Built for builders.</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "32px",
            }}
          >
            <div className="card glass-hover" style={{ padding: "32px" }}>
              <div
                style={{ color: "var(--accent-primary)", marginBottom: "20px" }}
              >
                <Shield size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                RAG Engine
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                Retrieval Augmented Generation ensures your AI only speaks from
                your data sources.
              </p>
            </div>
            <div className="card glass-hover" style={{ padding: "32px" }}>
              <div
                style={{
                  color: "var(--accent-secondary)",
                  marginBottom: "20px",
                }}
              >
                <Github size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                GitHub Sync
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                Automatically sync your repositories to keep the AI updated on
                your latest projects.
              </p>
            </div>
            <div className="card glass-hover" style={{ padding: "32px" }}>
              <div style={{ color: "var(--success)", marginBottom: "20px" }}>
                <Zap size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                One-Tag Install
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
                Embed your assistant on any site by simply adding a single line
                of JavaScript.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{ padding: "100px 0", position: "relative", overflow: "hidden" }}
      >
        <div
          className="landing-container"
          style={{ textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <h2
            style={{
              fontSize: "56px",
              fontWeight: 800,
              marginBottom: "24px",
              letterSpacing: "-2px",
            }}
          >
            Ready to elevate your portfolio?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "20px",
              marginBottom: "48px",
              maxWidth: "600px",
              margin: "0 auto 48px",
            }}
          >
            Join hundreds of developers using Klyro to create a lasting
            impression.
          </p>
          <Link
            href="/signup"
            className="btn btn-primary"
            style={{
              padding: "20px 48px",
              fontSize: "18px",
              borderRadius: "100px",
            }}
          >
            Get Started for Free{" "}
            <ArrowRight size={20} style={{ marginLeft: "12px" }} />
          </Link>
        </div>
        <div
          className="auth-bg-blob-2 float-animation"
          style={{
            width: "60%",
            height: "60%",
            bottom: "-20%",
            right: "-10%",
            opacity: 0.2,
            animationDelay: "1s",
          }}
        ></div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "60px 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10, 10, 12, 0.5)",
        }}
      >
        <div
          className="landing-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/logo.svg"
              alt="Klyro Logo"
              width={100}
              height={32}
              style={{ objectFit: "contain" }}
            />
          </Link>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            © 2024 Klyro. All rights reserved. Built with ❤️ for the community.
          </p>
        </div>
      </footer>
    </main>
  );
}
