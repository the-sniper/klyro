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
  User as UserIcon,
  ChevronDown,
  LogOut,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function LandingPage() {
  const router = useRouter();
  // State for interactive effects
  const [flashlightPos, setFlashlightPos] = useState({ x: 50, y: 50 });
  const [scrolled, setScrolled] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(isLogoutModalOpen);

  // Persona and Widget state
  const [activePersona, setActivePersona] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [configMousePos, setConfigMousePos] = useState({ x: 0, y: 0 });

  // Refs
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const configWidgetRef = React.useRef<HTMLDivElement>(null);

  const prompts = [
    "Tell me about your tech stack.",
    "How do I integrate Klyro into my site?",
    "Show me your most impactful project.",
    "What are your pricing plans?",
    "Can I customize the bot's persona?",
    "What is your typical design process?",
    "How does Klyro handle data security?",
    "Show me your latest work.",
  ];

  // Global listeners and intersections
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setFlashlightPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("scroll", handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    document
      .querySelectorAll(".reveal-on-scroll")
      .forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // Robust Simulated Typing Effect
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const fullText = prompts[currentPromptIndex];

    if (charIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypingText(fullText.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      const waitTimeout = setTimeout(() => {
        setCharIndex(0);
        setTypingText("");
        setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
      }, 3000);
      return () => clearTimeout(waitTimeout);
    }
  }, [charIndex, currentPromptIndex]);

  // Fetch user session
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to check user session:", error);
      }
    }
    checkUser();
  }, []);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsLogoutModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isDropdownOpen &&
        !(e.target as Element).closest(".nav-user-profile")
      ) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Persona auto-rotation
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActivePersona((prev: number) => (prev + 1) % 3);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Handlers
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
  return (
    <main className="landing-page">
      <div className="premium-bg-container">
        <div className="bg-mesh-container">
          <div className="mesh-blob blob-1"></div>
          <div className="mesh-blob blob-2"></div>
          <div className="mesh-blob blob-3"></div>
        </div>
        <div className="noise-overlay"></div>
        <div className="subtle-grid"></div>
      </div>
      <div
        className="flashlight-bg"
        style={
          { "--x": `${flashlightPos.x}%`, "--y": `${flashlightPos.y}%` } as any
        }
      />
      {/* Navigation */}
      <nav
        className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="landing-container nav-content">
          <Link href="/" className="nav-logo" aria-label="Klyro Home">
            <Image
              src="/logo.svg"
              alt="Klyro Logo"
              width={120}
              height={40}
              className="nav-logo-img"
              priority
            />
          </Link>
          <div className="nav-actions">
            {user ? (
              <div className="nav-user-profile">
                <button
                  className="nav-profile-trigger"
                  onClick={toggleDropdown}
                  aria-expanded={isDropdownOpen}
                >
                  <div className="nav-avatar">
                    {user.full_name
                      ? user.full_name
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0].toUpperCase())
                          .filter(
                            (_, i, arr) => i === 0 || i === arr.length - 1,
                          )
                          .join("")
                      : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="nav-user-name">
                    {user.full_name?.split(" ")[0] || "User"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`nav-chevron ${isDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="nav-dropdown-menu glass animate-fade-in">
                    <Link href="/admin" className="dropdown-item">
                      <Settings size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsLogoutModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="dropdown-item text-danger"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary nav-btn">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary nav-btn"
                  aria-label="Get started for free"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="landing-container">
          <div className="hero-content-wrapper">
            <div className="hero-text-content">
              {/* <div className="badge animate-fade-in">
                <Sparkles size={14} style={{ marginRight: "8px" }} />
                Your AI-Powered Digital Twin
              </div> */}
              <h1
                id="hero-heading"
                className="hero-title animate-fade-in animation-delay-1"
              >
                Define Your Persona, <br />
                <span>Let AI Tell Your Story.</span>
              </h1>
              <p className="hero-subtitle animate-fade-in animation-delay-2">
                Transform your static portfolio into a dynamic digital twin. Let
                visitors explore your work, skills, and personality through a
                custom AI persona trained on your unique journey.
              </p>
              <div className="hero-buttons animate-fade-in animation-delay-3">
                <Link
                  href="/signup"
                  className="btn btn-primary hero-main-btn"
                  aria-label="Sign up for Klyro for free"
                >
                  Start Building for Free{" "}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>

              {/* Scrolling Ticker */}
              <div className="scrolling-ticker animate-fade-in animation-delay-3">
                <div className="ticker-content">
                  {[
                    "Personalized AI Persona",
                    "RAG-Powered Intelligence",
                    "Instant GitHub Sync",
                    "Embeddable Widget",
                    "Custom Branding",
                    "Privacy First",
                  ].map((item, idx) => (
                    <div key={idx} className="ticker-item">
                      <div className="ticker-dot"></div>
                      {item}
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {[
                    "Personalized AI Persona",
                    "RAG-Powered Intelligence",
                    "Instant GitHub Sync",
                    "Embeddable Widget",
                    "Custom Branding",
                    "Privacy First",
                  ].map((item, idx) => (
                    <div key={`dup-${idx}`} className="ticker-item">
                      <div className="ticker-dot"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Persona Showcase Stack */}
            <div
              className="persona-carousel-wrapper animate-fade-in"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              aria-label="AI Persona Showcases"
            >
              <div
                className="persona-stack-container animate-fade-in"
                style={{ animationDelay: "0.4s", cursor: "pointer" }}
                onClick={() => setActivePersona((prev) => (prev + 1) % 3)}
                role="region"
                aria-live="polite"
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
                      aria-current={isActive ? "true" : "false"}
                    >
                      <div className="persona-glow-bg"></div>
                      <div className="persona-avatar-container">
                        <img
                          src={persona.avatar}
                          alt={`${persona.name} Persona Avatar`}
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
                    aria-label={`Show persona ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section
        id="demo"
        className="landing-section reveal-on-scroll"
        aria-labelledby="demo-heading"
      >
        <div className="landing-container">
          <div className="demo-grid">
            <div>
              <h2 id="demo-heading" className="section-title">
                An intelligent assistant that{" "}
                <span className="text-gradient-premium">truly knows you.</span>
              </h2>
              <p className="section-desc">
                Upload your resume, technical documents, or link your GitHub.
                Klyro uses advanced RAG technology to ensure every response is
                accurate and based on your verified data.
              </p>
              <div className="flex-col-gap-20">
                <div className="glass-hover demo-feature-card glass-premium p-24 rounded-2xl">
                  <div className="icon-wrapper icon-wrapper-primary">
                    <Shield size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="demo-feature-title">Privacy First</h3>
                    <p className="demo-feature-desc">
                      Your data is encrypted and only used to train your
                      personal model.
                    </p>
                  </div>
                </div>
                <div className="glass-hover demo-feature-card glass-premium p-24 rounded-2xl">
                  <div className="icon-wrapper icon-wrapper-secondary">
                    <Zap size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="demo-feature-title">Ultra Fast Retrieval</h3>
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
              aria-label="Klyro Chat Widget Preview"
            >
              <div
                className="demo-widget-container glass-premium"
                style={{
                  transform: `perspective(1200px) rotateY(${mousePos.x * 6}deg) rotateX(${-mousePos.y * 6}deg) translate(${-mousePos.x * 40}px, ${-mousePos.y * 40}px)`,
                  transition:
                    mousePos.x === 0 && mousePos.y === 0
                      ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
                      : "transform 0.15s ease-out",
                }}
              >
                <div className="demo-widget-bg">
                  <div className="demo-widget-blob demo-widget-blob-1"></div>
                  <div className="demo-widget-blob demo-widget-blob-2"></div>
                  <div className="demo-widget-blob demo-widget-blob-3"></div>
                </div>

                {/* Widget Header */}
                <div className="demo-widget-header">
                  <div className="demo-widget-actions-top">
                    <div className="demo-widget-action-btn">
                      <RotateCcw size={14} />
                    </div>
                    <div className="demo-widget-action-btn">
                      <Plus size={14} style={{ transform: "rotate(45deg)" }} />
                    </div>
                  </div>
                  <div className="demo-widget-header-center">
                    <div className="demo-widget-avatar">
                      <img
                        src="/icons/icon-128x128.png"
                        alt="Klyro"
                        width="32"
                        height="32"
                      />
                    </div>
                    <div className="demo-widget-title">Klyro Assistant</div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="demo-widget-chat">
                  {/* Empty State Visual */}
                  <div className="demo-widget-empty-state">
                    <h1 className="demo-widget-greeting">Hey there!</h1>
                    <h2 className="demo-widget-subgreeting">
                      I am Klyro&apos;s assistant.
                    </h2>
                    <div className="demo-prompt-box">
                      What would you like to know about Klyro?
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="demo-widget-input-area">
                  <div className="demo-widget-input-row">
                    <div className="demo-widget-input">
                      <span className="typing-cursor">{typingText}</span>
                    </div>
                    <div className="demo-widget-send-btn">
                      <Send size={16} />
                    </div>
                  </div>
                </div>

                {/* Branding Footer */}
                <div className="demo-widget-footer">
                  <span>
                    Powered by <span className="font-bold">Klyro</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing-section reveal-on-scroll"
        aria-labelledby="customization-heading"
      >
        <div className="landing-container">
          <div className="text-center">
            <span className="section-label">Personas & Customization</span>
            <h2 id="customization-heading" className="section-title">
              Your bot, your personality.
            </h2>
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
            aria-label="Persona Customization Preview"
          >
            <div
              className="glass-premium showcase-widget-inner"
              style={{
                transform: `perspective(1500px) rotateY(${configMousePos.x * 2}deg) rotateX(${-configMousePos.y * 2}deg) translate(${-configMousePos.x * 20}px, ${-configMousePos.y * 20}px)`,
                transition:
                  configMousePos.x === 0 && configMousePos.y === 0
                    ? "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
                    : "transform 0.15s ease-out",
              }}
            >
              <div className="reveal-on-scroll">
                <div className="badge mb-20">Step 1: Choose Your Tone</div>
                <div className="showcase-grid" role="list">
                  {[
                    {
                      name: "Friendly",
                      icon: <Smile size={20} aria-hidden="true" />,
                      desc: "Warm, approachable, uses casual language",
                      active: true,
                    },
                    {
                      name: "Professional",
                      icon: <Briefcase size={20} aria-hidden="true" />,
                      desc: "Polished but personable, balanced tone",
                    },
                    {
                      name: "Casual",
                      icon: <Coffee size={20} aria-hidden="true" />,
                      desc: "Super relaxed, like texting a friend",
                    },
                    {
                      name: "Formal",
                      icon: <Award size={20} aria-hidden="true" />,
                      desc: "Precise, articulate, no slang",
                    },
                    {
                      name: "Enthusiastic",
                      icon: <Zap size={20} aria-hidden="true" />,
                      desc: "High energy, excited about everything",
                    },
                    {
                      name: "Calm & Thoughtful",
                      icon: <Leaf size={20} aria-hidden="true" />,
                      desc: "Measured, reflective, takes time to explain",
                    },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={`showcase-card ${p.active ? "active" : ""}`}
                      role="listitem"
                      aria-label={`${p.name} personality option`}
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
              <div className="traits-grid reveal-on-scroll animation-delay-1">
                <div>
                  <div className="badge mb-20">Step 2: Define Traits</div>
                  <label
                    className="form-label form-label-block"
                    htmlFor="trait-input"
                  >
                    Personality Traits
                  </label>
                  <div className="trait-input-container">
                    <div
                      className="glass glass-input-placeholder"
                      id="trait-input"
                    >
                      Add a trait...
                    </div>
                    <button
                      className="trait-add-btn"
                      aria-label="Add personality trait"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mb-12">
                    <span className="trait-suggestion-label">Suggestions:</span>
                  </div>
                  <div className="flex-wrap-gap-8" role="list">
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
                        className="badge trait-badge"
                        role="listitem"
                      >
                        + {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="badge mb-20">Step 3: Custom Guidance</div>
                  <label
                    className="form-label form-label-block"
                    htmlFor="custom-instructions"
                  >
                    Custom Instructions
                  </label>
                  <div
                    className="glass custom-instructions-box"
                    id="custom-instructions"
                  >
                    Always fetch the project details from my Github
                  </div>
                  <p className="input-hint-text">
                    Specific guidance for the bot&apos;s responses
                  </p>
                </div>
              </div>

              <div className="knowledge-sources-container reveal-on-scroll animation-delay-2">
                <div className="badge mb-20">Step 4: Connect Data</div>
                <label className="form-label form-label-block mb-20">
                  Connected Knowledge Sources
                </label>
                <div className="knowledge-grid" role="list">
                  <div
                    className="glass-hover knowledge-source-card knowledge-source-card-success"
                    role="listitem"
                  >
                    <div className="knowledge-source-inner">
                      <Check
                        size={18}
                        className="text-success"
                        aria-hidden="true"
                      />
                      <span className="knowledge-source-name">
                        walter_resume.pdf
                      </span>
                    </div>
                    <span className="knowledge-source-status text-success">
                      Processed
                    </span>
                  </div>
                  <div
                    className="glass-hover knowledge-source-card knowledge-source-card-primary"
                    role="listitem"
                  >
                    <div className="knowledge-source-inner">
                      <Github
                        size={18}
                        className="text-accent"
                        aria-hidden="true"
                      />
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
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        className="landing-section reveal-on-scroll"
        aria-labelledby="features-heading"
      >
        <div className="landing-container">
          <div className="text-center mb-48">
            <span className="section-label">Core Capabilities</span>
            <h2 id="features-heading" className="section-title">
              Built for <span className="text-gradient-premium">builders.</span>
            </h2>
          </div>

          <div className="features-grid">
            <article className="card glass-premium feature-card reveal-on-scroll">
              <div className="feature-card-icon text-accent">
                <Shield size={32} aria-hidden="true" />
              </div>
              <h3 className="feature-card-title">RAG Engine</h3>
              <p className="feature-card-desc">
                Retrieval Augmented Generation ensures your AI only speaks from
                your data sources.
              </p>
            </article>
            <article className="card glass-premium feature-card reveal-on-scroll animation-delay-1">
              <div className="feature-card-icon text-accent-secondary">
                <Github size={32} aria-hidden="true" />
              </div>
              <h3 className="feature-card-title">GitHub Sync</h3>
              <p className="feature-card-desc">
                Automatically sync your repositories to keep the AI updated on
                your latest projects.
              </p>
            </article>
            <article className="card glass-premium feature-card reveal-on-scroll animation-delay-2">
              <div className="feature-card-icon text-success">
                <Zap size={32} aria-hidden="true" />
              </div>
              <h3 className="feature-card-title">One-Tag Install</h3>
              <p className="feature-card-desc">
                Embed your assistant on any site by simply adding a single line
                of JavaScript.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        className="landing-section cta-section reveal-on-scroll"
        aria-labelledby="cta-heading"
      >
        <div className="landing-container text-center">
          <h2 id="cta-heading" className="cta-title">
            Ready to elevate your portfolio?
          </h2>
          <p className="section-desc cta-desc">
            Use Klyro to define your persona and create a lasting impression.
          </p>
          <div className="hero-buttons cta-buttons">
            <Link
              href="/signup"
              className="btn btn-primary cta-btn-rounded"
              aria-label="Get started for free today"
            >
              Get Started for Free{" "}
              <ArrowRight size={20} className="ml-12" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer landing-footer-styled reveal-on-scroll">
        <div className="landing-container footer-content landing-footer-container">
          <div className="flex-col-gap-24">
            <Link
              href="/"
              className="footer-logo footer-logo-link"
              aria-label="Klyro Home"
            >
              <Image
                src="/logo.svg"
                alt="Klyro Logo"
                width={100}
                height={32}
                className="footer-logo-img"
              />
            </Link>
            <a
              href="https://www.producthunt.com/products/klyro?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-klyro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
              aria-label="Klyro on Product Hunt"
            >
              <img
                alt="Klyro - Featured on Product Hunt"
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1071040&amp;theme=neutral&amp;t=1769929255109"
                style={{ width: "180px", height: "auto" }}
                width="180"
                height="40"
              />
            </a>
          </div>
          <p className="footer-copyright footer-copyright-text">
            © {new Date().getFullYear()} Klyro. All rights reserved.{" "}
            <br className="mobile-only" /> Built with ❤️ for the community.
          </p>
        </div>
      </footer>
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          className="modal-overlay animate-overlay"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            className="modal-glass animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-text">
                <h2 className="modal-title">Sign Out</h2>
                <p className="modal-subtitle">
                  You&apos;ll need to sign back in to access your dashboard and
                  manage your AI personas.
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "0 32px 32px" }}>
              <p style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to log out of your account?
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{
                  background: "#ef4444",
                  borderColor: "#ef4444",
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
                }}
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <LogOut size={18} style={{ marginRight: "8px" }} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
