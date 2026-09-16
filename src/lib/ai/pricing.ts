/**
 * Model prices, in one place.
 *
 * USD per 1,000,000 tokens, matching OpenAI's published pricing. Update here
 * when prices change or a model is swapped in; nothing else should hard-code a
 * rate.
 */

export interface ChatModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
}

export const CHAT_MODEL_PRICING: Record<string, ChatModelPrice> = {
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10 },
};

export const EMBEDDING_MODEL_PRICING: Record<string, number> = {
  "text-embedding-3-small": 0.02,
  "text-embedding-3-large": 0.13,
};

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

const warnedModels = new Set<string>();

function warnOnce(model: string): void {
  if (warnedModels.has(model)) return;
  warnedModels.add(model);
  console.warn(`[pricing] No price entry for "${model}"; costing it at zero.`);
}

export interface CostInput {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  embeddingModel?: string;
  embeddingTokens?: number;
}

/** Cost of one request in USD. Unknown models cost zero and warn once. */
export function estimateCostUsd({
  model,
  promptTokens = 0,
  completionTokens = 0,
  embeddingModel = DEFAULT_EMBEDDING_MODEL,
  embeddingTokens = 0,
}: CostInput): number {
  let total = 0;

  const chatPrice = CHAT_MODEL_PRICING[model];
  if (chatPrice) {
    total += (promptTokens / 1_000_000) * chatPrice.inputPerMTok;
    total += (completionTokens / 1_000_000) * chatPrice.outputPerMTok;
  } else if (promptTokens > 0 || completionTokens > 0) {
    warnOnce(model);
  }

  if (embeddingTokens > 0) {
    const embeddingPrice = EMBEDDING_MODEL_PRICING[embeddingModel];
    if (embeddingPrice) {
      total += (embeddingTokens / 1_000_000) * embeddingPrice;
    } else {
      warnOnce(embeddingModel);
    }
  }

  // Sub-cent costs still need to survive a numeric(12,8) column.
  return Number(total.toFixed(8));
}
