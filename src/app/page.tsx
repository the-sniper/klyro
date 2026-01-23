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
} from "lucide-react";

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState(1); // Start with The Muse (center)
  const [isPaused, setIsPaused] = useState(false);

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
            <span className="section-label">Live Preview</span>
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

          <div style={{ position: "relative" }}>
            <div
              className="glass animate-fade-in"
              style={{
                borderRadius: "24px",
                overflow: "hidden",
                height: "500px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ff5f56",
                  }}
                ></div>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ffbd2e",
                  }}
                ></div>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#27c93f",
                  }}
                ></div>
                <div
                  style={{
                    marginLeft: "12px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  Klyro Assistant
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  fontSize: "14px",
                }}
              >
                <div
                  className="chat-message user"
                  style={{
                    alignSelf: "flex-end",
                    animation: "fadeIn 0.5s ease-out forwards",
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
                  }}
                >
                  Based on your resume and GitHub repositories, you have over 3
                  years of experience. You recently built a RAG-based pipeline
                  using OpenAI and implemented several vector search
                  optimizations in your "Klyro" project.
                </div>
                <div
                  className="chat-message user"
                  style={{
                    alignSelf: "flex-end",
                    animation: "fadeIn 0.5s ease-out forwards",
                    animationDelay: "2.5s",
                  }}
                >
                  What technologies were used in Klyro?
                </div>
                <div
                  className="chat-message assistant"
                  style={{
                    alignSelf: "flex-start",
                    animation: "fadeIn 0.5s ease-out forwards",
                    animationDelay: "3.5s",
                  }}
                >
                  Klyro uses Next.js 14, TypeScript, and Supabase for the
                  backend. The AI engine is powered by GPT-4o-mini with pgvector
                  for efficient knowledge retrieval.
                </div>
              </div>
              <div
                style={{
                  padding: "20px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  className="glass"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  Type a question...
                  <Zap size={14} />
                </div>
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
            className="glass"
            style={{
              borderRadius: "24px",
              padding: "40px",
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "48px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "32px" }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Persona Name</label>
                <div
                  className="glass"
                  style={{
                    padding: "14px 18px",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                >
                  Technical Lead Assistant
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Communication Style</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div
                    className="badge"
                    style={{
                      margin: 0,
                      background: "var(--accent-primary)",
                      color: "#fff",
                    }}
                  >
                    Professional
                  </div>
                  <div className="badge" style={{ margin: 0, opacity: 0.5 }}>
                    Casual
                  </div>
                  <div className="badge" style={{ margin: 0, opacity: 0.5 }}>
                    Concise
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Knowledge Sources</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    className="glass-hover"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
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
                      <Check size={16} className="text-success" />
                      <span style={{ fontSize: "14px" }}>resume_2024.pdf</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--success)" }}>
                      Processed
                    </span>
                  </div>
                  <div
                    className="glass-hover"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
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
                      <Github size={16} className="text-accent" />
                      <span style={{ fontSize: "14px" }}>
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
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.05)",
                flexDirection: "column",
                gap: "20px",
                padding: "40px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Image
                  src="/logo.svg"
                  alt="Klyro Logo"
                  width={80}
                  height={80}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  Assistant Configured
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Ready to be embedded on your site
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "auto" }}
              >
                Preview Changes
              </button>
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
