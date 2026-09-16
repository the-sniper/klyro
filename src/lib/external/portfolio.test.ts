import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPortfolioContent, formatPortfolioForAI } from "./portfolio";
import type { PortfolioInfo } from "./portfolio";

const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Areef Syed — Engineer</title>
  <meta name="description" content="Full-stack engineer building AI products." />
</head>
<body>
  <h1>Experience</h1>
  <div>Senior Engineer @ Acme Corp</div>
  <div>Jan 2024 - Present</div>
  <div>Software Engineer @ Beta Inc</div>
  <div>Jun 2021 - Dec 2023</div>
  <h2>Skills</h2>
  <p>TypeScript, Next.js, PostgreSQL, and RAG systems.</p>
  <h2>Education</h2>
  <p>Bachelor of Science, Computer Science, State University</p>
  <a href="https://linkedin.com/in/areef">LinkedIn</a>
  <a href="https://github.com/areefsyed">GitHub</a>
  <p>Contact: areef@example.com</p>
</body>
</html>
`;

describe("fetchPortfolioContent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes URLs without protocol and parses structured fields", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_HTML,
    } as Response);

    const info = await fetchPortfolioContent("areefsyed.com");

    expect(fetch).toHaveBeenCalledWith(
      "https://areefsyed.com",
      expect.any(Object),
    );
    expect(info).not.toBeNull();
    expect(info!.title).toContain("Areef Syed");
    expect(info!.description).toContain("Full-stack");
    expect(info!.contact.some((c) => c.includes("areef@example.com"))).toBe(true);
    expect(info!.contact.some((c) => c.includes("github.com/areefsyed"))).toBe(true);
    expect(info!.rawContent.length).toBeGreaterThan(0);
  });

  it("returns null when the HTTP request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    } as Response);

    await expect(fetchPortfolioContent("https://bad.example")).resolves.toBeNull();
  });
});

describe("formatPortfolioForAI", () => {
  it("prioritizes current roles and formats sections", () => {
    const info: PortfolioInfo = {
      title: "Portfolio",
      description: "Builder",
      currentRoles: [
        {
          title: "Founder",
          company: "Klyro",
          dateRange: "Jan 2026 - Present",
          isCurrent: true,
        },
      ],
      pastRoles: [
        {
          title: "Engineer",
          company: "Acme",
          dateRange: "2020 - 2025",
          isCurrent: false,
        },
      ],
      workExperience: [],
      skills: ["TypeScript"],
      projects: ["AirLog"],
      education: ["BS CS"],
      contact: ["a@example.com"],
      rawContent: "unused when structured",
    };

    const formatted = formatPortfolioForAI(info);

    expect(formatted).toContain("CURRENT EMPLOYMENT");
    expect(formatted).toContain("Founder at Klyro");
    expect(formatted).toContain("Past Employment");
    expect(formatted).toContain("Skills & Technologies");
    expect(formatted).toContain("Projects");
    expect(formatted.indexOf("CURRENT EMPLOYMENT")).toBeLessThan(
      formatted.indexOf("Past Employment"),
    );
  });
});
