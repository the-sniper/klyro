import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLatestRepos, fetchRepoReadme } from "./github";

describe("fetchLatestRepos", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extracts username from a GitHub profile URL", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: "airlog",
          description: "Voice testing",
          html_url: "https://github.com/areef/airlog",
          stargazers_count: 10,
          updated_at: "2026-01-01T00:00:00Z",
          language: "TypeScript",
        },
      ],
    } as Response);

    const repos = await fetchLatestRepos("https://github.com/areefsyed", 1);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/users/areefsyed/repos"),
      expect.any(Object),
    );
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("airlog");
    expect(repos[0].language).toBe("TypeScript");
  });

  it("returns [] when the API responds with an error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      text: async () => "rate limited",
    } as Response);

    await expect(fetchLatestRepos("nobody")).resolves.toEqual([]);
  });

  it("returns [] when username cannot be parsed", async () => {
    await expect(fetchLatestRepos("https://github.com/")).resolves.toEqual([]);
  });
});

describe("fetchRepoReadme", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes base64 README content", async () => {
    const markdown = "# Hello\n\nWorld";
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: Buffer.from(markdown).toString("base64"),
        encoding: "base64",
      }),
    } as Response);

    const result = await fetchRepoReadme("areefsyed", "klyro");
    expect(result).toBe(markdown);
  });

  it("returns null on 404", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "not found",
    } as Response);

    await expect(fetchRepoReadme("areefsyed", "missing")).resolves.toBeNull();
  });
});
