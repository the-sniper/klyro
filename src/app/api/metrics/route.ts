import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface MetricRow {
  widget_key: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  embedding_tokens: number | null;
  total_cost_usd: number | string | null;
  ttfb_ms: number | null;
  total_ms: number | null;
  created_at: string;
}

export interface UsageTotals {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  embeddingTokens: number;
  costUsd: number;
  p50TtfbMs: number | null;
  p50TotalMs: number | null;
}

export interface WidgetUsage {
  widgetKey: string;
  name: string;
  last7: UsageTotals;
  last30: UsageTotals;
}

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * fraction));
  return Math.round(sorted[index]);
}

function summarize(rows: MetricRow[]): UsageTotals {
  const ttfbValues = rows
    .map((row) => row.ttfb_ms)
    .filter((value): value is number => typeof value === 'number');
  const totalValues = rows
    .map((row) => row.total_ms)
    .filter((value): value is number => typeof value === 'number');

  return {
    requests: rows.length,
    promptTokens: rows.reduce((sum, row) => sum + (row.prompt_tokens || 0), 0),
    completionTokens: rows.reduce((sum, row) => sum + (row.completion_tokens || 0), 0),
    embeddingTokens: rows.reduce((sum, row) => sum + (row.embedding_tokens || 0), 0),
    costUsd: rows.reduce((sum, row) => sum + Number(row.total_cost_usd || 0), 0),
    p50TtfbMs: percentile(ttfbValues, 0.5),
    p50TotalMs: percentile(totalValues, 0.5),
  };
}

// GET - Per-widget usage totals for the last 7 and 30 days
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();

    const now = Date.now();
    const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: metrics, error }, { data: widgets }] = await Promise.all([
      supabase
        .from('request_metrics')
        .select(
          'widget_key, prompt_tokens, completion_tokens, embedding_tokens, total_cost_usd, ttfb_ms, total_ms, created_at'
        )
        .eq('user_id', user.id)
        .gte('created_at', since30),
      supabase
        .from('widgets')
        .select('widget_key, name')
        .eq('user_id', user.id),
    ]);

    if (error) throw error;

    const rows = (metrics || []) as MetricRow[];
    const nameByKey = new Map(
      (widgets || []).map((widget) => [widget.widget_key, widget.name as string])
    );

    // Include widgets with no traffic, so an idle widget is visibly idle.
    const keys = new Set<string>([
      ...nameByKey.keys(),
      ...rows.map((row) => row.widget_key).filter((key): key is string => !!key),
    ]);

    const perWidget: WidgetUsage[] = [...keys]
      .map((key) => {
        const forWidget = rows.filter((row) => row.widget_key === key);
        return {
          widgetKey: key,
          name: nameByKey.get(key) || 'Unknown widget',
          last7: summarize(forWidget.filter((row) => row.created_at >= since7)),
          last30: summarize(forWidget),
        };
      })
      .sort((a, b) => b.last30.requests - a.last30.requests);

    return NextResponse.json({
      widgets: perWidget,
      totals: {
        last7: summarize(rows.filter((row) => row.created_at >= since7)),
        last30: summarize(rows),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching usage metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch usage metrics' }, { status: 500 });
  }
}
