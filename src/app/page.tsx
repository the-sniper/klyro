"use client";

/**
 * Klyro Landing Page — Cinematic Scroll Story
 *
 * Architecture (Bible §5, §12, §13):
 *   LAYER 0: Fixed 3D canvas (z-0) — reacts to scrollProgress ref
 *   LAYER 1: Scroll-pinned story sections (z-10) — text that overlays 3D
 *   LAYER 2: Sticky nav + footer (z-50)
 *
 * GSAP ScrollTrigger scrubs scrollProgress 0→1 across five pinned chapters.
 * The canvas reads this ref every frame — no React state, no re-renders.
 */

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ── SSR-safe Scene import ───────────────────────────────────────────────── */
const Scene = dynamic(() => import("@/components/3d/Scene"), {
  ssr: false,
  loading: () => null,
});

/* ── Animation variants ──────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

/* ── Design tokens ───────────────────────────────────────────────────────── */
const C = {
  bg:        "var(--bg-primary)",
  accent:    "var(--accent-primary)",
  accentLow: "var(--accent-low)",
  accentBrd: "var(--accent-border)",
  surface:   "var(--glass-bg)",
  border:    "var(--glass-border)",
  primary:   "var(--text-primary)",
  secondary: "var(--text-secondary)",
  muted:     "var(--text-muted)",
};

/* ── Nav links ───────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { href: "#story",    label: "The story" },
  { href: "#features", label: "Features" },
  { href: "#deploy",   label: "Deploy" },
];

/*
 * Story architecture (brand-storytelling skill):
 *
 * The visitor is Luke. Klyro is the lightsaber. You are Obi-Wan.
 *
 * ELEPHANT first: something is at stake (every visitor who leaves without
 * an answer is a conversation that never happened).
 *
 * Arc: world-that-IS → five-second realization → world-that-COULD-BE
 *
 * Movement: "Your website finally speaks for you."
 */

/* ── Story chapters ──────────────────────────────────────────────────────── */
const CHAPTERS = [
  {
    id:       "hero",
    eyebrow:  "The problem",
    headline: "Visitors leave.\nQuestions\nunanswered.",
    sub:      "They had something to ask. You weren't there. So they left and took their trust with them. Klyro changes that.",
    cta:      { label: "Fix this →", href: "/signup" },
    ctaGhost: { label: "See how", href: "#story" },
    align:    "center" as const,
  },
  {
    id:       "persona",
    eyebrow:  "Act I — Your voice",
    headline: "It sounds\nlike you.\nNot a bot.",
    sub:      "Define the tone, the personality, and the guardrails. It introduces itself the way you would. It knows what you'd share and what you wouldn't.",
    align:    "left" as const,
  },
  {
    id:       "knowledge",
    eyebrow:  "Act II — Your knowledge",
    headline: "It knows\neverything\nyou've built.",
    sub:      "Your GitHub. Your resume. Your writing. Your docs. Every answer it gives is grounded in your actual work, not invented.",
    align:    "right" as const,
  },
  {
    id:       "test",
    eyebrow:  "Act III — Proof",
    headline: "You verify\nbefore\nit goes live.",
    sub:      "Run the conversation yourself first. Push it. Find the edges. Enable strict mode so it only speaks from what you gave it.",
    align:    "left" as const,
  },
  {
    id:       "deploy",
    eyebrow:  "The world that could be",
    headline: "Your website\nfinally speaks\nfor you.",
    sub:      "One tag. Any site. Every visitor gets a real answer in your voice, from your knowledge, even when you're asleep.",
    cta:      { label: "Make it happen →", href: "/signup" },
    align:    "center" as const,
  },
];

/* ── Features for bottom grid ────────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Answers from your real work, not from thin air",
    body:  "Connect GitHub repos, upload PDFs, and paste URLs. Every response is retrieved from what you actually gave it. Hallucinations are off by default.",
    tags:  ["RAG retrieval", "Strict mode", "Source trail"],
    span:  7,
  },
  {
    title: "A persona, not a chatbot template",
    body:  "Traits, a tone, scheduling links, and what to share or withhold. It feels like you because you shaped it.",
    tags:  ["Custom instructions", "Calendly booking"],
    span:  5,
  },
  {
    title: "You talk to it before your visitors do",
    body:  "A private test chat so you can break it yourself first. Enable strict mode to lock responses to your sources only.",
    tags:  ["Sandbox", "Strict mode"],
    span:  4,
  },
  {
    title: "It wears your brand, not ours",
    body:  "Logo, colors, domains, and launch text. The widget belongs to your site, not us.",
    tags:  ["Custom branding", "Domain rules"],
    span:  4,
  },
  {
    title: "Know what every visitor asked",
    body:  "Full transcript history. See the questions, the answers, and the sources that backed each one.",
    tags:  ["Transcript history", "Source attribution"],
    span:  4,
  },
];



/* ══════════════════════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow">
      <div className="eyebrow-dot" />
      <span className="eyebrow-text">{children}</span>
    </div>
  );
}

function GlassCard({
  children,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      style={style}
      whileHover={{
        y:           -4,
        borderColor: "rgba(59, 130, 246, 0.38)",
        boxShadow:   "0 0 40px rgba(59, 130, 246, 0.12), 0 24px 60px rgba(0, 0, 0, 0.5)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DEMO SECTION — inline widget + floating question chips
══════════════════════════════════════════════════════════════════════════ */
const DEMO_QUESTIONS = [
  "What if it says something wrong about me?",
  "Will it sound like a generic AI?",
  "How do I add it to my site?",
  "What can I feed it?",
];

const chipPositions: React.CSSProperties[] = [
  { top: "12%",  right: "calc(100% + 40px)" },
  { top: "38%", right: "calc(100% + 80px)" },
  { bottom: "38%", left: "calc(100% + 80px)" },
  { bottom: "12%",  left: "calc(100% + 40px)" },
];

function DemoChip({
  text,
  active,
  delay,
  onClick,
  style,
}: {
  text: string;
  active: boolean;
  delay: number;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      style={{
        padding:        "14px 26px",
        borderRadius:   999,
        border:         active
          ? "1px solid rgba(59, 130, 246, 0.7)"
          : "1px solid rgba(147, 197, 253, 0.25)",
        background:     active
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(10, 15, 30, 0.7)",
        backdropFilter: "blur(16px)",
        color:          active ? "#bfdbfe" : "rgba(219, 234, 254, 0.85)",
        fontSize:       15,
        fontWeight:     500,
        letterSpacing:  "-0.01em",
        cursor:         "pointer",
        transition:     "border-color 0.3s, background 0.3s, color 0.3s, box-shadow 0.3s",
        boxShadow:      active
          ? "0 0 28px rgba(59, 130, 246, 0.25), inset 0 0 12px rgba(59, 130, 246, 0.08)"
          : "0 2px 16px rgba(0,0,0,0.25)",
        whiteSpace:     "nowrap",
        ...style,
      }}
    >
      {text}
    </motion.button>
  );
}

function DemoSection() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<((t: string) => void) | null>(null);
  const initializedRef = useRef(false);
  const [activeQ, setActiveQ] = useState<number | null>(null);

  useEffect(() => {
    if (initializedRef.current || !mountRef.current) return;
    initializedRef.current = true;

    const isLocal = window.location.hostname === "localhost";

    import("@klyro/widget").then((mod) => {
      const init = mod.initKlyro || mod.default?.initKlyro || mod.default;
      const send = mod.sendMessage || mod.default?.sendMessage;
      if (send) sendRef.current = send;

      if (typeof init === "function") {
        init({
          key: "MnK1XElbACpl",
          apiBase: isLocal ? "http://localhost:3000" : "https://klyro-pro.vercel.app",
          inline: true,
          container: mountRef.current,
        });
      }
    });
  }, []);

  const handleChipClick = useCallback((idx: number) => {
    setActiveQ(idx);
    const text = DEMO_QUESTIONS[idx];
    if (sendRef.current) {
      sendRef.current(text);
    } else if (typeof (window as any).klyroSendMessage === "function") {
      (window as any).klyroSendMessage(text);
    }
  }, []);

  return (
    <section style={{ padding: "0 clamp(24px,5vw,80px) 128px", maxWidth: 1100, margin: "0 auto", overflow: "visible", position: "relative", zIndex: 1 }}>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        style={{ textAlign: "center", marginBottom: 56 }}
      >
        <Eyebrow>See it live</Eyebrow>
        <h2 className="section-h2" style={{ marginTop: 16, color: C.primary }}>
          Don&apos;t take our word for it.
        </h2>
            <p style={{ marginTop: 14, fontSize: 16, color: C.muted, maxWidth: "44ch", margin: "14px auto 0" }}>
              Tap a question. Watch Klyro answer it from real knowledge, in its own voice.
            </p>
          </motion.div>

      <motion.div
        className="demo-stage"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        style={{ position: "relative", display: "flex", justifyContent: "center" }}
      >
        <div className="demo-glow" />

        {/* Question chips floating around the widget */}
        <div style={{ position: "relative" }}>
          {DEMO_QUESTIONS.map((q, i) => (
            <DemoChip
              key={q}
              text={q}
              active={activeQ === i}
              delay={0.3 + i * 0.1}
              onClick={() => handleChipClick(i)}
              style={{
                position: "absolute",
                ...chipPositions[i],
                zIndex: 10,
              }}
            />
          ))}

          {/* Widget container */}
          <div
            ref={mountRef}
            style={{
              width:        "420px",
              height:       "680px",
              position:     "relative",
              overflow:     "hidden",
              borderRadius: "20px",
              background:   "rgba(10,12,25,0.85)",
              border:       "1px solid rgba(59,130,246,0.18)",
              boxShadow:    "0 8px 60px rgba(59,130,246,0.18), 0 0 0 1px rgba(59,130,246,0.08)",
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const scrollProgress = useRef(0);
  const storyRef       = useRef<HTMLDivElement>(null!);

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [user,      setUser]      = useState<{ full_name: string | null } | null>(null);
  const [chapter,   setChapter]   = useState(0);

  /* Profile */
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.id && setUser(d))
      .catch(() => null);
  }, []);

  /* Nav scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── GSAP ScrollTrigger: scrub scrollProgress across the story section ── */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      /* Master scrub — drives the 3D scene */
      ScrollTrigger.create({
        trigger: storyRef.current,
        start:   "top top",
        end:     "bottom bottom",
        scrub:   1.2,
        onUpdate: (self) => {
          scrollProgress.current = self.progress;
          /* Update chapter label for UI overlays */
          setChapter(Math.min(4, Math.floor(self.progress * 5)));
        },
      });

      /* Individual chapter text animations */
      const chapterEls = storyRef.current.querySelectorAll(".chapter-content");
      chapterEls.forEach((el) => {
        const lines = el.querySelectorAll(".line-reveal");
        gsap.fromTo(
          lines,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y:       0,
            duration: 0.8,
            stagger:  0.1,
            ease:    "power3.out",
            scrollTrigger: {
              trigger: el,
              start:   "top 75%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Noise Overlay applied to body via class */}
      <div className="noise-overlay" />

      {/* ── LAYER 0: Fixed 3D Canvas ─────────────────────────────────────── */}
      <Scene scrollProgress={scrollProgress} />

      {/* ── LAYER 1: Scroll content ──────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <nav className={`nav-pill ${scrolled ? "" : "at-top"}`}>
          <Link href="/" aria-label="Klyro" style={{ flexShrink: 0 }}>
            <Image src="/logo.svg" alt="Klyro" width={80} height={24} priority />
          </Link>

          <ul
            className="nav-links"
            style={{ 
              display: "flex", 
              gap: 8, 
              listStyle: "none", 
              alignItems: "center",
              margin: "0 auto",
            }}
          >
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="nav-pill-link">{l.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-cta" style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
            {user ? (
              <Link href="/admin" className="nav-pill-cta">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="nav-pill-link" style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>Sign in</Link>
                <Link href="/signup" className="nav-pill-cta">Start free →</Link>
              </>
            )}
          </div>

          <button
            className="nav-menu"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "none", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: "50%",
              border: "1px solid var(--glass-border)", background: "var(--glass-bg)",
              color: "var(--text-primary)", cursor: "pointer", fontSize: 18,
              position: "relative", zIndex: 102,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  zIndex: 100,
                }}
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={{
                  position: "fixed",
                  top: 0, right: 0, bottom: 0,
                  width: "100%",
                  maxWidth: 300,
                  background: "#08080b",
                  borderLeft: "1px solid var(--glass-border)",
                  padding: "100px 24px 40px",
                  zIndex: 101,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {NAV_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block", padding: "20px 0",
                        color: "var(--text-primary)", fontSize: 17,
                        fontWeight: 500,
                        textDecoration: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link 
                    href="/signup" 
                    className="nav-pill-cta" 
                    style={{ width: "100%", height: 52, fontSize: 16 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Start free →
                  </Link>
                  <Link 
                    href="/login" 
                    style={{ 
                      display: "block", textAlign: "center", marginTop: 24,
                      color: "var(--text-secondary)", textDecoration: "none", fontSize: 14 
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── STORY: 5 pinned chapters, drives 3D ──────────────────────────── */}
        <div
          id="story"
          ref={storyRef}
          style={{ position: "relative" }}
        >
          {/* Progress dots — fixed right side */}
          <div
            style={{
              position: "fixed",
              right: 32,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {CHAPTERS.map((ch, i) => (
              <div
                key={ch.id}
                className={`progress-dot${chapter === i ? " active" : ""}`}
              />
            ))}
          </div>

          {CHAPTERS.map((ch, i) => (
            <section
              key={ch.id}
              id={ch.id}
              style={{
                position:       "relative",
                minHeight:      "100vh",
                display:        "flex",
                alignItems:     "center",
                justifyContent: ch.align === "right"  ? "flex-end"
                              : ch.align === "center" ? "center"
                              :                         "flex-start",
                /* Horizontal padding: left chapters leave room for 3D; center gets even gutters */
                paddingLeft:  "clamp(32px, 7vw, 140px)",
                paddingRight: ch.align === "left" ? "clamp(32px, 42vw, 600px)" : "clamp(32px, 7vw, 140px)",
                paddingTop:     80,
                paddingBottom:  80,
              }}
            >
              <div
                className="chapter-content"
                style={{
                  maxWidth:  ch.align === "center" ? 720 : 480,
                  textAlign: ch.align === "center" ? "center" : "left",
                  width:     "100%",
                  margin:    ch.align === "center" ? "0 auto" : undefined,
                }}
              >
                <div className="line-reveal">
                  <Eyebrow>{ch.eyebrow}</Eyebrow>
                </div>

                <div className="line-reveal" style={{ marginTop: 24 }}>
                  <h1 className={`display${i === 0 ? " gradient-text" : ""}`}>
                    {ch.headline}
                  </h1>
                </div>

                <p
                  className="line-reveal"
                  style={{
                    marginTop:  20,
                    fontSize:   17,
                    lineHeight: 1.72,
                    color:      C.secondary,
                    maxWidth:   "60ch",
                    margin:     ch.align === "center" ? "20px auto 0" : "20px 0 0",
                  }}
                >
                  {ch.sub}
                </p>

                {(ch.cta || ch.ctaGhost) && (
                  <div
                    className="line-reveal"
                    style={{
                      marginTop:      36,
                      display:        "flex",
                      gap:            14,
                      flexWrap:       "wrap",
                      justifyContent: ch.align === "center" ? "center" : "flex-start",
                    }}
                  >
                    {ch.cta && (
                      <Link href={ch.cta.href} className="cta-primary">
                        {ch.cta.label}
                      </Link>
                    )}
                    {ch.ctaGhost && (
                      <a href={ch.ctaGhost.href} className="cta-ghost">
                        {ch.ctaGhost.label}
                      </a>
                    )}
                  </div>
                )}

                {/* Hero only: stats row */}
                {i === 0 && (
                  <div
                    className="line-reveal"
                    style={{
                      marginTop:       44,
                      display:         "flex",
                      gap:             0,
                      alignItems:      "center",
                      justifyContent:  "center",
                    }}
                  >
                    {[
                      { n: "100%",    l: "grounded in your data" },
                      { n: "Zero",    l: "hallucinations in strict mode" },
                      { n: "1 tag",     l: "to transform your site" },
                    ].map((s, si) => (
                      <div
                        key={s.l}
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          paddingRight: si < 2 ? 28 : 0,
                          marginRight:  si < 2 ? 28 : 0,
                          borderRight:  si < 2 ? `1px solid rgba(255,255,255,0.08)` : "none",
                          textAlign:    "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize:      22,
                              fontWeight:    300,
                              color:         C.primary,
                              fontFamily:    "'Sora', sans-serif",
                              letterSpacing: "-0.02em",
                              lineHeight:    1,
                            }}
                          >
                            {s.n}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 5, letterSpacing: "0.02em" }}>
                            {s.l}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scroll hint — bottom center */}
              {i === 0 && (
                <div
                  style={{
                    position:      "absolute",
                    bottom:        36,
                    left:          "50%",
                    transform:     "translateX(-50%)",
                    display:       "flex",
                    flexDirection: "column",
                    alignItems:    "center",
                    gap:           8,
                    color:         "rgba(160,157,184,0.8)",
                    animation:     "scrollPulse 2.2s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>Scroll</span>
                  <div style={{ width: 1, height: 44, background: "linear-gradient(to bottom, rgba(160,157,184,0.6), transparent)" }} />
                </div>
              )}
            </section>
          ))}
        </div>

        {/* ── FEATURES — below the story ──────────────────────────────────── */}
        <section
          id="features"
          style={{
            padding:   "128px 40px",
            maxWidth:  1200,
            margin:    "0 auto",
          }}
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <Eyebrow>How it works</Eyebrow>
            <h2
              className="section-h2"
              style={{ marginTop: 16, color: C.primary }}
            >
              Four things between you<br />and a smarter website.
            </h2>
            <p
              style={{
                marginTop: 16,
                fontSize:  17,
                lineHeight: 1.72,
                color:     C.secondary,
                maxWidth:  "58ch",
              }}
            >
              Shape the voice. Ground the knowledge. Test it yourself.
              Ship it. That's the whole loop — and it takes less than a day.
            </p>
          </motion.div>

          <motion.div
            className="bento"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            style={{ marginTop: 48 }}
          >
            {FEATURES.map((f) => (
              <GlassCard
                key={f.title}
                className={`bento-${f.span}`}
                style={{ padding: 32 }}
              >
                <motion.div variants={itemVariant}>
                  <div
                    style={{
                      fontSize:   18,
                      fontWeight: 500,
                      color:      C.primary,
                      lineHeight: 1.35,
                      marginBottom: 10,
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize:   14,
                      lineHeight: 1.72,
                      color:      C.muted,
                      marginBottom: 16,
                    }}
                  >
                    {f.body}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {f.tags.map((t) => (
                      <span key={t} className="chip">{t}</span>
                    ))}
                  </div>
                </motion.div>
              </GlassCard>
            ))}
          </motion.div>
        </section>

        {/* ── DEPLOY CODE ──────────────────────────────────────────────────── */}
        <section
          id="deploy"
          style={{ padding: "0 40px 128px", maxWidth: 1200, margin: "0 auto" }}
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <GlassCard style={{ padding: 36 }}>
              <motion.div variants={itemVariant}>
                <Eyebrow>Script tag</Eyebrow>
                <pre
                  style={{
                    marginTop:    20,
                    background:   "rgba(0,0,0,0.45)",
                    border:       `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding:      "18px 22px",
                    fontFamily:   "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize:     13,
                    lineHeight:   1.8,
                    color:        C.secondary,
                    overflowX:    "auto",
                    whiteSpace:   "pre",
                  }}
                >{`<script
  src="https://unpkg.com/@klyro/widget"
  data-key="YOUR_WIDGET_KEY"
  async
></script>`}</pre>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                  {["React / Next.js", "Vue", "Static HTML", "PWA"].map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              </motion.div>
            </GlassCard>

            <GlassCard style={{ padding: 36 }}>
              <motion.div variants={itemVariant}>
                <Eyebrow>What you control</Eyebrow>
                <ul
                  style={{
                    listStyle:     "none",
                    marginTop:     20,
                    display:       "flex",
                    flexDirection: "column",
                    gap:           10,
                  }}
                >
                  {[
                    "Widget key generation",
                    "Launcher style — text or icon",
                    "Greeting and welcome message",
                    "Theme color and logo upload",
                    "Allowed domains and route visibility",
                  ].map((item) => (
                    <li
                      key={item}
                      style={{
                        display:    "flex",
                        alignItems: "center",
                        gap:        10,
                        fontSize:   14,
                        color:      C.secondary,
                      }}
                    >
                      <span
                        style={{
                          width:      18,
                          height:     18,
                          borderRadius: "50%",
                          border:     "1px solid rgba(34,211,165,0.4)",
                          background: "rgba(34,211,165,0.08)",
                          display:    "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize:   10,
                          color:      "#22d3a5",
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </GlassCard>
          </motion.div>
        </section>

        {/* ── DEMO CHAT ────────────────────────────────────────────────────── */}
        <DemoSection />

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section style={{ padding: "0 40px 120px", maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            style={{
              position:   "relative",
              background: "rgba(59, 130, 246, 0.06)",
              border:     `1px solid var(--accent-border)`,
              borderRadius: 24,
              padding:    "80px 48px",
              textAlign:  "center",
              overflow:   "hidden",
              boxShadow:  "0 0 80px rgba(59, 130, 246, 0.1)",
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.2), transparent 65%)",
              }}
            />
            <div style={{ position: "relative" }}>
              <Eyebrow>Your website. Finally speaking for you.</Eyebrow>
              <h2
                className="section-h2"
                style={{
                  marginTop:    16,
                  fontSize:     "clamp(32px, 5vw, 58px)",
                  maxWidth:     680,
                  marginLeft:   "auto",
                  marginRight:  "auto",
                  color:        C.primary,
                  letterSpacing: "-0.025em",
                }}
              >
                Every visitor gets an answer.{" "}
                <span className="gradient-text">In your voice.</span>{" "}
                Even at 3am.
              </h2>
              <p
                style={{
                  marginTop:  20,
                  fontSize:   17,
                  lineHeight: 1.75,
                  color:      C.secondary,
                  maxWidth:   "52ch",
                  marginLeft: "auto", marginRight: "auto",
                }}
              >
                The conversations that used to not happen because you weren't there
                now do. That's what Klyro is for.
              </p>
              <div
                style={{
                  marginTop:      36,
                  display:        "flex",
                  justifyContent: "center",
                  gap:            14,
                  flexWrap:       "wrap",
                }}
              >
                <Link href="/signup" className="cta-primary">
                  Start free and deploy today →
                </Link>
                <Link href="/login" className="cta-ghost">
                  Already have an account
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              flexWrap:       "wrap",
              gap:            16,
              marginTop:      48,
              paddingTop:     32,
              borderTop:      `1px solid ${C.border}`,
              fontSize:       13,
              color:          C.muted,
            }}
          >
            <span>Klyro: grounded AI in your voice, on your site.</span>
            <div style={{ display: "flex", gap: 24 }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
