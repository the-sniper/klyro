import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        background:
          "linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%)",
      }}
    >
      <div style={{ maxWidth: "600px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            padding: "0.5rem 1rem",
            background: "var(--color-primary-light)",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "var(--color-primary)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          AI-Powered Portfolio Assistant
        </div>

        <h1
          style={{
            fontSize: "3rem",
            fontWeight: "700",
            lineHeight: "1.1",
            marginBottom: "1.25rem",
            background:
              "linear-gradient(135deg, var(--color-text) 0%, var(--color-primary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Chatfolio
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--color-text-secondary)",
            marginBottom: "2rem",
            lineHeight: "1.7",
          }}
        >
          Create an intelligent AI chatbot for your portfolio website. Let
          visitors ask questions about your experience, projects, and skills
          with accurate, context-aware responses.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/admin"
            className="btn btn-primary"
            style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
          >
            Open Admin Portal
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
          >
            View Documentation
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            marginTop: "4rem",
            textAlign: "left",
          }}
        >
          {[
            {
              title: "Knowledge Base",
              desc: "Upload your content and let AI learn about you",
            },
            {
              title: "Smart Responses",
              desc: "Accurate answers based only on your information",
            },
            {
              title: "Easy Embed",
              desc: "Add to any website with a single script tag",
            },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                padding: "1.25rem",
                background: "var(--color-bg)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
