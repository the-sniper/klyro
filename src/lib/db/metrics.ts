/**
 * Per-request metrics persistence.
 *
 * Writes are fire-and-forget: observability must never fail a chat request or
 * add latency to one, so errors are logged and swallowed.
 */

import { createServerClient } from "@/lib/supabase/client";
import type { RequestMetrics } from "@/lib/ai/rag";

export interface RequestMetricsRow extends RequestMetrics {
  widgetKey: string;
  userId: string | null;
  sessionId: string | null;
  messageId: string | null;
}

/** Insert one metrics row, without awaiting it on the request path. */
export function recordRequestMetrics(row: RequestMetricsRow): void {
  void (async () => {
    try {
      const supabase = createServerClient();
      const { error } = await supabase.from("request_metrics").insert({
        widget_key: row.widgetKey,
        user_id: row.userId,
        session_id: row.sessionId,
        message_id: row.messageId,
        model: row.model,
        prompt_tokens: row.promptTokens,
        completion_tokens: row.completionTokens,
        embedding_tokens: row.embeddingTokens,
        total_cost_usd: row.totalCostUsd,
        ttfb_ms: row.ttfbMs,
        total_ms: row.totalMs,
        retrieved_chunks: row.retrievedChunks,
        tool_calls: row.toolCalls,
      });

      if (error) throw error;
    } catch (error) {
      console.error("[metrics] Failed to record request metrics:", error);
    }
  })();
}
