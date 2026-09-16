"use client";

import { useState, useEffect } from "react";
import { Activity, Coins, Gauge, Loader2 } from "lucide-react";

interface UsageTotals {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  embeddingTokens: number;
  costUsd: number;
  p50TtfbMs: number | null;
  p50TotalMs: number | null;
}

interface WidgetUsage {
  widgetKey: string;
  name: string;
  last7: UsageTotals;
  last30: UsageTotals;
}

interface UsageResponse {
  widgets: WidgetUsage[];
  totals: { last7: UsageTotals; last30: UsageTotals };
}

const formatNumber = (value: number) => value.toLocaleString();

const formatCost = (value: number) =>
  value === 0 ? "$0.00" : value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;

const formatMs = (value: number | null) => (value === null ? "-" : `${formatNumber(value)} ms`);

export default function UsagePage() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"last7" | "last30">("last7");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch usage metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-400">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  const totals = data?.totals[range];
  const widgets = data?.widgets ?? [];

  return (
    <div className="animate-fade-in content-container">
      <div className="page-header">
        <h1 className="page-title text-gradient">Usage</h1>
        <p className="page-subtitle">
          Tokens, cost and latency per widget, recorded on every chat request
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["last7", "last30"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            className={`btn ${range === option ? "btn-primary" : "btn-secondary"}`}
          >
            {option === "last7" ? "Last 7 days" : "Last 30 days"}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-hover">
          <div className="stat-card-icon">
            <Activity size={24} />
          </div>
          <div className="stat-card-data">
            <div className="stat-card-value">{formatNumber(totals?.requests ?? 0)}</div>
            <div className="stat-card-label">Requests</div>
          </div>
        </div>

        <div className="stat-card glass-hover">
          <div className="stat-card-icon icon-wrapper-success">
            <Coins size={24} />
          </div>
          <div className="stat-card-data">
            <div className="stat-card-value text-success">
              {formatCost(totals?.costUsd ?? 0)}
            </div>
            <div className="stat-card-label">Estimated cost</div>
          </div>
        </div>

        <div className="stat-card glass-hover">
          <div className="stat-card-icon icon-wrapper-warning">
            <Gauge size={24} />
          </div>
          <div className="stat-card-data">
            <div className="stat-card-value text-warning">
              {formatMs(totals?.p50TtfbMs ?? null)}
            </div>
            <div className="stat-card-label">p50 time to first token</div>
          </div>
        </div>

        <div className="stat-card glass-hover">
          <div className="stat-card-icon icon-wrapper-secondary">
            <Gauge size={24} />
          </div>
          <div className="stat-card-data">
            <div className="stat-card-value text-accent-secondary">
              {formatMs(totals?.p50TotalMs ?? null)}
            </div>
            <div className="stat-card-label">p50 total</div>
          </div>
        </div>
      </div>

      <div className="section-title-wrapper">
        <h2 className="section-title">Per widget</h2>
        <div className="section-divider"></div>
      </div>

      {widgets.length === 0 ? (
        <div className="glass-card p-6">
          <p className="page-subtitle">
            No chat requests recorded yet. Totals appear here once a widget is used.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                {[
                  "Widget",
                  "Requests",
                  "Prompt",
                  "Completion",
                  "Embedding",
                  "Cost",
                  "p50 TTFB",
                  "p50 total",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: heading === "Widget" ? "left" : "right",
                      padding: "12px 16px",
                      fontSize: 13,
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {widgets.map((widget) => {
                const row = widget[range];
                const cell = {
                  textAlign: "right" as const,
                  padding: "12px 16px",
                  whiteSpace: "nowrap" as const,
                };

                return (
                  <tr key={widget.widgetKey} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{widget.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{widget.widgetKey}</div>
                    </td>
                    <td style={cell}>{formatNumber(row.requests)}</td>
                    <td style={cell}>{formatNumber(row.promptTokens)}</td>
                    <td style={cell}>{formatNumber(row.completionTokens)}</td>
                    <td style={cell}>{formatNumber(row.embeddingTokens)}</td>
                    <td style={cell}>{formatCost(row.costUsd)}</td>
                    <td style={cell}>{formatMs(row.p50TtfbMs)}</td>
                    <td style={cell}>{formatMs(row.p50TotalMs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
