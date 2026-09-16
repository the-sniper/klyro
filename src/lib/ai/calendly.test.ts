import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAvailableSlots, getCalendlyUser, getEventTypes } from "./calendly";

describe("Calendly API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getCalendlyUser returns parsed user on success", async () => {
    const payload = {
      resource: {
        uri: "https://api.calendly.com/users/ABC",
        name: "Areef",
        slug: "areef",
        email: "a@example.com",
        scheduling_url: "https://calendly.com/areef",
        timezone: "America/New_York",
        avatar_url: null,
      },
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

    const user = await getCalendlyUser("token");
    expect(user?.resource.email).toBe("a@example.com");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.calendly.com/users/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      }),
    );
  });

  it("getCalendlyUser returns null on HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      text: async () => "unauthorized",
    } as Response);

    await expect(getCalendlyUser("bad")).resolves.toBeNull();
  });

  it("getEventTypes maps collection items", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        collection: [
          {
            uri: "https://api.calendly.com/event_types/1",
            name: "Intro Call",
            active: true,
            slug: "intro",
            scheduling_url: "https://calendly.com/areef/intro",
            description_plain: "Chat",
            duration: 30,
          },
        ],
      }),
    } as Response);

    const types = await getEventTypes("token", "https://api.calendly.com/users/ABC");
    expect(types).toHaveLength(1);
    expect(types[0].duration).toBe(30);
    expect(types[0].name).toBe("Intro Call");
  });

  it("getAvailableSlots returns collection or []", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        collection: [{ start_time: "2026-04-01T15:00:00Z" }],
      }),
    } as Response);

    const slots = await getAvailableSlots(
      "token",
      "https://api.calendly.com/event_types/1",
      "2026-04-01T00:00:00Z",
      "2026-04-08T00:00:00Z",
    );
    expect(slots).toHaveLength(1);

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      text: async () => "fail",
    } as Response);

    await expect(
      getAvailableSlots("token", "uri", "a", "b"),
    ).resolves.toEqual([]);
  });
});
