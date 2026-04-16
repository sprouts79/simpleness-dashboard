"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import clsx from "clsx";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ReachCompositionChart from "@/components/charts/ReachCompositionChart";
import { MonthlyReachRow } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "monthly-rolling" | "net-new";
type Period = 1 | 3 | 6 | 12 | 18 | 24;
const LOOKBACK_OPTIONS = [30, 60, 90, 120, 180, 360, 720] as const;
type LookbackDays = (typeof LOOKBACK_OPTIONS)[number];

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatReach(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
}

function formatNok(n: number) {
  return `NOK ${Math.round(n).toLocaleString("no-NO")}`;
}

function formatNokShort(n: number) {
  if (n >= 1_000_000) return `NOK ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `NOK ${Math.round(n / 1_000)}K`;
  return `NOK ${Math.round(n)}`;
}

// ─── Inline chart tooltips ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CpmNetNewTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p style={{ fontFamily: "var(--font-mono)" }}>
        {formatNok(payload[0]?.value ?? 0)} / 1k net new
      </p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FrequencyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p style={{ fontFamily: "var(--font-mono)" }}>
        {(payload[0]?.value ?? 0).toFixed(2)}×
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReachClient({
  clientId,
  data,
  currentLookback,
}: {
  clientId: string;
  data: MonthlyReachRow[];
  currentLookback: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("monthly-rolling");
  const [period, setPeriod] = useState<Period>(6);
  const [lookback, setLookback] = useState<LookbackDays>(
    (LOOKBACK_OPTIONS.includes(currentLookback as LookbackDays)
      ? currentLookback
      : 90) as LookbackDays
  );
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Filter data to selected period (data is newest-first)
  const filtered = data.slice(0, period);
  const availableMonths = data.length;

  // KPIs computed inline — no useMemo so they always update with period
  const kpis = filtered.length === 0 ? null : {
    totalReach: filtered[0].rollingReach,
    totalSpend: filtered.reduce((s, r) => s + r.spend, 0),
    avgCpm: filtered.reduce((s, r) => s + r.cpm, 0) / filtered.length,
    avgNetNew: filtered.reduce((s, r) => s + r.netNew, 0) / filtered.length,
    avgNetNewPct: filtered.reduce((s, r) => s + r.netNewPct, 0) / filtered.length,
    avgCpmNetNew: filtered.reduce((s, r) => s + r.cpmNetNew, 0) / filtered.length,
  };

  // Chart data (oldest → newest for chronological display)
  const chartData = [...filtered].reverse().map((r) => ({
    month: r.monthLabel,
    previouslyReached: Math.max(0, r.rollingReach - r.netNew),
    netNew: r.netNew,
    netNewPct: parseFloat(r.netNewPct.toFixed(1)),
    cpmNetNew: r.cpmNetNew,
    frequency: r.frequency,
  }));

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const lb = view === "net-new" ? lookback : 90;
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, months: period, lookbackDays: lb, syncType: "reach" }),
      });
      const json = await res.json();
      if (json.ok) {
        setSyncStatus(`Synkronisert — ${json.reachSynced} uker`);
        router.push(`?lookback=${lb}`);
        router.refresh();
      } else {
        setSyncStatus(`Feil: ${json.errors?.join(", ") || "Ukjent"}`);
      }
    } catch (e: unknown) {
      setSyncStatus(`Feil: ${e instanceof Error ? e.message : "Ukjent"}`);
    } finally {
      setSyncing(false);
    }
  }

  function handleLookbackChange(val: LookbackDays) {
    setLookback(val);
    router.push(`?lookback=${val}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* View toggle */}
      <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1 self-start w-fit">
        {(
          [
            { value: "monthly-rolling", label: "Monthly Rolling Reach" },
            { value: "net-new", label: "Net New Reach" },
          ] as { value: View; label: string }[]
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setView(value)}
            className={clsx(
              "text-xs font-semibold px-4 py-1.5 rounded-md transition-colors",
              view === value
                ? "bg-white text-[var(--color-black)] shadow-sm"
                : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
            {([1, 3, 6, 12, 18, 24] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors",
                  period === p
                    ? "bg-white text-[var(--color-black)] shadow-sm"
                    : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
                )}
              >
                {p}M
              </button>
            ))}
          </div>

          {/* Lookback selector — only in Net New view */}
          {view === "net-new" && (
            <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
              {LOOKBACK_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleLookbackChange(d)}
                  className={clsx(
                    "text-xs font-semibold px-3 py-1.5 rounded-md transition-colors",
                    lookback === d
                      ? "bg-white text-[var(--color-black)] shadow-sm"
                      : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
                  )}
                >
                  {d}D
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {syncStatus && (
            <span className="text-xs text-[rgba(9,10,8,0.45)]">{syncStatus}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={clsx(
              "text-xs font-semibold px-4 py-2 rounded-lg transition-colors",
              syncing
                ? "bg-[var(--color-surface)] text-[rgba(9,10,8,0.35)] cursor-not-allowed border border-[var(--color-border)]"
                : "bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90"
            )}
          >
            {syncing ? "Henter..." : "Pull Analytics"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-sm text-[rgba(9,10,8,0.4)] mb-4">
            Ingen reach-data tilgjengelig. Trykk Pull Analytics for å hente fra Meta.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90 transition-colors"
          >
            {syncing ? "Henter..." : "Pull Analytics"}
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* KPI cards */}
          {kpis && (
            <div>
              <SectionHeader
                title="Nøkkeltall"
                subtitle={
                  view === "monthly-rolling"
                    ? `${filtered.length} av ${period} mnd tilgjengelig · 90d lookback`
                    : `${filtered.length} av ${period} mnd tilgjengelig · ${lookback}d lookback`
                }
              />
              <div className="grid grid-cols-4 gap-3">
                {view === "monthly-rolling" ? (
                  <>
                    <KpiCard
                      label="Total Reach"
                      value={formatReach(kpis.totalReach)}
                      note="90d rullerende vindu"
                      size="large"
                    />
                    <KpiCard
                      label="Total Spend"
                      value={formatNokShort(kpis.totalSpend)}
                      note={`siste ${period} mnd`}
                    />
                    <KpiCard
                      label="Avg CPM"
                      value={`${Math.round(kpis.avgCpm)} kr`}
                      note="snitt per måned"
                    />
                    <KpiCard
                      label="Avg Monthly Net New"
                      value={formatReach(kpis.avgNetNew)}
                      note="nye unike per mnd"
                    />
                  </>
                ) : (
                  <>
                    <KpiCard
                      label="Total Reach"
                      value={formatReach(kpis.totalReach)}
                      note={`${lookback}d rullerende vindu`}
                      size="large"
                    />
                    <KpiCard
                      label="Avg Net New Reach"
                      value={formatReach(kpis.avgNetNew)}
                      note="per måned"
                    />
                    <KpiCard
                      label="Avg % Net New"
                      value={`${kpis.avgNetNewPct.toFixed(1)}%`}
                      note={
                        kpis.avgNetNewPct >= 30
                          ? "Frisk målgruppe"
                          : kpis.avgNetNewPct >= 18
                          ? "Moderat metning"
                          : "Høy metning"
                      }
                      highlight={kpis.avgNetNewPct < 18}
                    />
                    <KpiCard
                      label="Avg CPM Net New"
                      value={`${Math.round(kpis.avgCpmNetNew)} kr`}
                      note="per 1000 nye nådd"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reach Composition Chart */}
          <div>
            <SectionHeader
              title="Reach Composition Analysis"
              subtitle="Grå = previously reached · Grønn = net new · Linje = Net New %"
            />
            <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
              <ReachCompositionChart data={chartData} />
              <div className="flex gap-6 mt-4 text-xs text-[rgba(9,10,8,0.4)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#d4d4d0] inline-block" />
                  Previously reached
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-green-mint)] inline-block" />
                  Net New
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#d97706] inline-block" />
                  Net New %
                </span>
              </div>
            </div>
          </div>

          {/* Cost per 1k Net New Reach */}
          <div>
            <SectionHeader
              title="Cost Per 1k Net New Reach"
              subtitle="Kostnad per 1000 nye unike nådd — per måned"
            />
            <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(v) => `${Math.round(v)}`}
                  />
                  <Tooltip content={<CpmNetNewTooltip />} cursor={{ stroke: "rgba(9,10,8,0.06)" }} />
                  <Line
                    type="monotone"
                    dataKey="cpmNetNew"
                    stroke="var(--color-link)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-link)", strokeWidth: 0 }}
                    name="CPM Net New"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <SectionHeader
              title="Frequency"
              subtitle="Gjennomsnittlig frekvens per måned"
            />
            <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(9,10,8,0.4)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <Tooltip content={<FrequencyTooltip />} cursor={{ stroke: "rgba(9,10,8,0.06)" }} />
                  <Line
                    type="monotone"
                    dataKey="frequency"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }}
                    name="Frequency"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          {view === "monthly-rolling" ? (
            <MonthlyRollingTable rows={filtered} />
          ) : (
            <NetNewTable rows={filtered} period={period} lookback={lookback} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Monthly Rolling Reach table ──────────────────────────────────────────────

function MonthlyRollingTable({ rows }: { rows: MonthlyReachRow[] }) {
  const headers = [
    "Måned",
    "Rolling Reach",
    "Net New",
    "Spend",
    "CPM",
    "Frequency",
    "CPM Net New",
    "%",
  ];

  return (
    <div>
      <SectionHeader title="Monthly Breakdown" />
      <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              {headers.map((h) => (
                <th
                  key={h}
                  className={clsx(
                    "py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]",
                    h === "Måned" ? "text-left px-5" : "text-right px-4"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.monthKey}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
              >
                <td className="px-5 py-2.5 font-medium text-sm whitespace-nowrap">
                  {row.monthLabel}
                </td>
                <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatReach(row.rollingReach)}
                </td>
                <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)", color: "var(--color-link)" }}>
                  {formatReach(row.netNew)}
                </td>
                <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatNok(row.spend)}
                </td>
                <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                  {Math.round(row.cpm)} kr
                </td>
                <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                  {row.frequency.toFixed(2)}×
                </td>
                <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                  {Math.round(row.cpmNetNew)} kr
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={clsx("text-xs font-semibold px-1.5 py-0.5 rounded", {
                      "bg-green-100 text-green-700": row.netNewPct >= 30,
                      "bg-yellow-100 text-yellow-700": row.netNewPct >= 18 && row.netNewPct < 30,
                      "bg-red-100 text-red-700": row.netNewPct < 18,
                    })}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {row.netNewPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Net New Reach table ──────────────────────────────────────────────────────

function NetNewTable({
  rows,
  period,
  lookback,
}: {
  rows: MonthlyReachRow[];
  period: Period;
  lookback: LookbackDays;
}) {
  const weeks = period * 4;
  const headers = [
    "Month Ending",
    "Reach (perioden)",
    `Rolling Reach (${lookback}d)`,
    `Prev. Reached (${lookback}d excl.)`,
    "Net New",
    "Spend",
    "CPM",
    "Freq.",
    "CPM Net New",
  ];

  return (
    <div>
      <SectionHeader
        title={`${weeks}W Analyse · ${lookback}D Lookback`}
        subtitle="Net New Reach breakdown per måned"
      />
      <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              {headers.map((h) => (
                <th
                  key={h}
                  className={clsx(
                    "py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]",
                    h === "Month Ending" ? "text-left px-5" : "text-right px-4"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const prevReached = Math.max(0, row.rollingReach - row.netNew);
              return (
                <tr
                  key={row.monthKey}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                >
                  <td className="px-5 py-2.5 font-medium text-sm whitespace-nowrap">
                    {row.monthLabel}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {formatReach(row.monthlyReach)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {formatReach(row.rollingReach)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {formatReach(prevReached)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)", color: "var(--color-link)" }}>
                    {formatReach(row.netNew)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {formatNok(row.spend)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {Math.round(row.cpm)} kr
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {row.frequency.toFixed(2)}×
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {Math.round(row.cpmNetNew)} kr
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
