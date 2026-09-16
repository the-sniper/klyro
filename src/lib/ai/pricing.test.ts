import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_MODEL_PRICING,
  DEFAULT_EMBEDDING_MODEL,
  estimateCostUsd,
} from "./pricing";

describe("estimateCostUsd", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is zero for a request that used nothing", () => {
    expect(estimateCostUsd({ model: "gpt-4o-mini" })).toBe(0);
  });

  it("prices prompt and completion tokens separately", () => {
    // 1M prompt + 1M completion at gpt-4o-mini rates
    expect(
      estimateCostUsd({
        model: "gpt-4o-mini",
        promptTokens: 1_000_000,
        completionTokens: 1_000_000,
      }),
    ).toBeCloseTo(
      CHAT_MODEL_PRICING["gpt-4o-mini"].inputPerMTok +
        CHAT_MODEL_PRICING["gpt-4o-mini"].outputPerMTok,
      8,
    );
  });

  it("adds embedding cost", () => {
    expect(
      estimateCostUsd({
        model: "gpt-4o-mini",
        embeddingModel: DEFAULT_EMBEDDING_MODEL,
        embeddingTokens: 1_000_000,
      }),
    ).toBeCloseTo(0.02, 8);
  });

  it("keeps a realistic single request above zero at 8 decimal places", () => {
    const cost = estimateCostUsd({
      model: "gpt-4o-mini",
      promptTokens: 2400,
      completionTokens: 320,
      embeddingTokens: 12,
    });

    expect(cost).toBeGreaterThan(0);
    // numeric(12,8) must not round it away
    expect(Number(cost.toFixed(8))).toBe(cost);
  });

  it("costs an unknown model at zero and warns once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(estimateCostUsd({ model: "some-future-model", promptTokens: 1000 })).toBe(0);
    expect(estimateCostUsd({ model: "some-future-model", promptTokens: 1000 })).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
