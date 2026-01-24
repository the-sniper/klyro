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
      <nav className="landing-nav">
        <div className="landing-container nav-content">
          <Link href="/" className="nav-logo">
            <Image
              src="/logo.svg"
              alt="Klyro Logo"
              width={120}
              height={40}
              className="nav-logo-img"
            />
          </Link>
          <div className="nav-actions">
            <Link href="/login" className="btn-secondary nav-btn">
              Login
            </Link>
            <Link href="/signup" className="btn-primary nav-btn">
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
              <h1 className="hero-title animate-fade-in animation-delay-1">
                Define Your Persona, Let AI Tell Your Story.
              </h1>
              <p className="hero-subtitle animate-fade-in animation-delay-2">
                Transform your static portfolio into a dynamic digital twin. Let
                visitors explore your work, skills, and personality through a
                custom AI persona trained on your unique journey.
              </p>
              <div className="hero-buttons animate-fade-in animation-delay-3">
                <Link href="/signup" className="btn btn-primary hero-main-btn">
                  Start for Free <ArrowRight size={18} />
                </Link>
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
      <section id="demo" className="landing-section">
        <div className="landing-container">
          <div className="demo-grid">
            <div>
              <h2 className="section-title">
                An intelligent assistant that truly knows you.
              </h2>
              <p className="section-desc">
                Upload your resume, technical documents, or link your GitHub.
                Klyro uses advanced RAG technology to ensure every response is
                accurate and based on your verified data.
              </p>
              <div className="flex-col-gap-20">
                <div className="glass-hover demo-feature-card">
                  <div className="icon-wrapper icon-wrapper-primary">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="demo-feature-title">Privacy First</h4>
                    <p className="demo-feature-desc">
                      Your data is encrypted and only used to train your
                      personal model.
                    </p>
                  </div>
                </div>
                <div className="glass-hover demo-feature-card">
                  <div className="icon-wrapper icon-wrapper-secondary">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="demo-feature-title">Ultra Fast Retrieval</h4>
                    <p className="demo-feature-desc">
                      Sub-second response times using optimized vector Search.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="animate-fade-in demo-widget-wrapper"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              ref={widgetRef}
            >
              <div
                className="demo-widget-container"
                style={{
                  transform: `perspective(1200px) rotateY(${mousePos.x * 6}deg) rotateX(${-mousePos.y * 6}deg) translate(${-mousePos.x * 40}px, ${-mousePos.y * 40}px)`,
                  transition:
                    mousePos.x === 0 && mousePos.y === 0
                      ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
                      : "transform 0.15s ease-out",
                }}
              >
                {/* Widget Header */}
                <div className="demo-widget-header">
                  <div className="demo-widget-avatar">
                    <Check size={24} />
                  </div>
                  <div className="demo-widget-info">
                    <div className="demo-widget-title">Walter's Assistant</div>
                    <div className="demo-widget-subtitle">
                      Your personal guide to this site
                    </div>
                  </div>
                  <div className="demo-widget-actions">
                    <div className="demo-widget-action-btn">
                      <Download size={16} />
                    </div>
                    <div className="demo-widget-action-btn">
                      <RotateCcw size={16} />
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="demo-widget-chat">
                  {/* Empty State Visual */}
                  <div className="demo-widget-empty-state">
                    <div className="demo-widget-empty-icon">
                      <Check size={26} />
                    </div>
                    <div className="demo-widget-empty-title">
                      Hey! I'm Walter's copilot
                    </div>
                    <div className="demo-widget-empty-subtitle">
                      I can help answer questions about them
                    </div>
                  </div>

                  <div className="demo-chat-user">
                    Tell me about your experience with machine learning.
                  </div>
                  <div className="demo-chat-assistant">
                    Walter has 3+ years of experience. He recently built a RAG
                    pipeline in his Chat Assistant project.
                  </div>
                </div>

                {/* Input Area */}
                <div className="demo-widget-input-area">
                  <div className="demo-widget-input-row">
                    <div className="demo-widget-input">
                      <span>Type a message...</span>
                    </div>
                    <div className="demo-widget-send-btn">
                      <Send size={16} />
                    </div>
                  </div>
                </div>

                {/* Branding Footer */}
                <div className="demo-widget-footer">
                  <Layers size={14} className="text-accent" />
                  Powered by{" "}
                  <span className="text-accent font-bold">Klyro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <div className="text-center">
            <span className="section-label">Personas & Customization</span>
            <h2 className="section-title">Your bot, your personality.</h2>
            <p className="section-desc mb-0">
              Adjust tone, style, and branding to make the assistant feel like
              an extension of yourself.
            </p>
          </div>

          <div
            className="showcase-wrapper animate-fade-in"
            onMouseMove={handleConfigMouseMove}
            onMouseLeave={handleConfigMouseLeave}
            ref={configWidgetRef}
          >
            <div
              className="glass showcase-widget-inner"
              style={{
                transform: `perspective(1500px) rotateY(${configMousePos.x * 2}deg) rotateX(${-configMousePos.y * 2}deg) translate(${-configMousePos.x * 20}px, ${-configMousePos.y * 20}px)`,
                transition:
                  configMousePos.x === 0 && configMousePos.y === 0
                    ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
                    : "transform 0.15s ease-out",
              }}
            >
              {/* Persona Selection Strategy */}
              <div>
                {/* <div
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
                </div> */}

                <div className="showcase-grid">
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
                      className={`showcase-card ${p.active ? "active" : ""}`}
                    >
                      <div
                        className={`showcase-icon-wrapper ${p.active ? "showcase-icon-wrapper-active" : "showcase-icon-wrapper-default"}`}
                      >
                        {p.icon}
                      </div>
                      <div>
                        <div
                          className={`showcase-card-name ${p.active ? "text-white" : ""}`}
                        >
                          {p.name}
                        </div>
                        <div className="showcase-card-desc">{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* traits and instructions */}
              <div className="traits-grid">
                <div>
                  <label className="form-label form-label-block">
                    Personality Traits
                  </label>
                  <div className="trait-input-container">
                    <div className="glass glass-input-placeholder">
                      Add a trait...
                    </div>
                    <div className="trait-add-btn">Add</div>
                  </div>
                  <div className="mb-12">
                    <span className="trait-suggestion-label">Suggestions:</span>
                  </div>
                  <div className="flex-wrap-gap-8">
                    {[
                      "technical",
                      "creative",
                      "analytical",
                      "humble",
                      "confident",
                      "curious",
                      "detail-oriented",
                    ].map((s) => (
                      <div key={s} className="badge trait-badge">
                        + {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label form-label-block">
                    Custom Instructions
                  </label>
                  <div className="glass custom-instructions-box">
                    Always fetch the project details from my Github
                  </div>
                  <p className="input-hint-text">
                    Specific guidance for the bot's responses
                  </p>
                </div>
              </div>

              <div className="knowledge-sources-container">
                <label className="form-label form-label-block mb-20">
                  Connected Knowledge Sources
                </label>
                <div className="knowledge-grid">
                  <div className="glass-hover knowledge-source-card knowledge-source-card-success">
                    <div className="knowledge-source-inner">
                      <Check size={18} className="text-success" />
                      <span className="knowledge-source-name">
                        walter_resume.pdf
                      </span>
                    </div>
                    <span className="knowledge-source-status text-success">
                      Processed
                    </span>
                  </div>
                  <div className="glass-hover knowledge-source-card knowledge-source-card-primary">
                    <div className="knowledge-source-inner">
                      <Github size={18} className="text-accent" />
                      <span className="knowledge-source-name">
                        github.com/the-sniper/klyro
                      </span>
                    </div>
                    <span className="knowledge-source-status text-accent">
                      Synced
                    </span>
                  </div>
                </div>
              </div>

              {/* <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-block",
                    padding: "16px 48px",
                    borderRadius: "100px",
                    cursor: "default",
                    background: "var(--accent-gradient)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "16px",
                    pointerEvents: "none",
                    boxShadow: "0 10px 20px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  Preview Your Configured Assistant
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="text-center mb-48">
            <span className="section-label">Core Capabilities</span>
            <h2 className="section-title">Built for builders.</h2>
          </div>

          <div className="features-grid">
            <div className="card glass-hover feature-card">
              <div className="feature-card-icon text-accent">
                <Shield size={32} />
              </div>
              <h3 className="feature-card-title">RAG Engine</h3>
              <p className="feature-card-desc">
                Retrieval Augmented Generation ensures your AI only speaks from
                your data sources.
              </p>
            </div>
            <div className="card glass-hover feature-card">
              <div className="feature-card-icon text-accent-secondary">
                <Github size={32} />
              </div>
              <h3 className="feature-card-title">GitHub Sync</h3>
              <p className="feature-card-desc">
                Automatically sync your repositories to keep the AI updated on
                your latest projects.
              </p>
            </div>
            <div className="card glass-hover feature-card">
              <div className="feature-card-icon text-success">
                <Zap size={32} />
              </div>
              <h3 className="feature-card-title">One-Tag Install</h3>
              <p className="feature-card-desc">
                Embed your assistant on any site by simply adding a single line
                of JavaScript.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section cta-section">
        <div className="landing-container text-center">
          <h2 className="cta-title">Ready to elevate your portfolio?</h2>
          <p className="section-desc cta-desc">
            Use Klyro to define your persona and create a lasting impression.
          </p>
          <div className="hero-buttons cta-buttons">
            <Link href="/signup" className="btn btn-primary cta-btn-rounded">
              Get Started for Free <ArrowRight size={20} className="ml-12" />
            </Link>
          </div>
        </div>
        <div className="auth-bg-blob-2 float-animation cta-blob"></div>
      </section>

      {/* Footer */}
      <footer className="landing-footer landing-footer-styled">
        <div className="landing-container footer-content landing-footer-container">
          <Link href="/" className="footer-logo footer-logo-link">
            <Image
              src="/logo.svg"
              alt="Klyro Logo"
              width={100}
              height={32}
              className="footer-logo-img"
            />
          </Link>
          <p className="footer-copyright footer-copyright-text">
            © {new Date().getFullYear()} Klyro. All rights reserved.{" "}
            <br className="mobile-only" /> Built with ❤️ for the community.
          </p>
        </div>
      </footer>
    </main>
  );
}
