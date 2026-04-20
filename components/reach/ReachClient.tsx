"use client";

import { useState, useEffect } from "react";
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
import InfoBox from "@/components/ui/InfoBox";
import { MonthlyReachRow } from "@/lib/types";

// Period options
const PERIOD_OPTIONS = [
  { value: "3m", label: "Siste 3 mndr", months: 3 },
  { value: "6m", label: "Siste 6 mndr", months: 6 },
];

// Compare options
const COMPARE_OPTIONS = [
  { value: "same", label: "Samme periode" },
  { value: "previous", label: "Forrige periode" },
];

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

// Smooth gradient from red to green based on percentage (0-25%+ scale)
function getNetNewColor(pct: number): { bg: string; text: string } {
  // Clamp between 0 and 25, then normalize to 0-1
  const normalized = Math.min(Math.max(pct, 0), 25) / 25;
  
  // Interpolate from red (0) to green (1)
  // Red: rgb(180, 60, 60) -> Green: rgb(45, 122, 10)
  const r = Math.round(180 - (180 - 45) * normalized);
  const g = Math.round(60 + (122 - 60) * normalized);
  const b = Math.round(60 - (60 - 10) * normalized);
  
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.12)`,
    text: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CpmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-md">
      <p className="font-semibold text-base mb-2">{label}</p>
      <div>
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface)] text-[rgba(9,10,8,0.6)] mb-1">
          CPM Net New
        </span>
        <p className="font-bold text-xl" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(payload[0]?.value ?? 0)} kr
        </p>
      </div>
    </div>
  );
};

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
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [period, setPeriod] = useState<"3m" | "6m">("6m");
  const [compare, setCompare] = useState<"same" | "previous">("same");

  // Calculate required lookback based on period + compare
  const periodMonths = PERIOD_OPTIONS.find(p => p.value === period)?.months ?? 6;
  const requiredLookback = compare === "previous" ? periodMonths * 30 : 0;

  // Filter data based on selected period
  const filtered = data.slice(0, periodMonths);

  // Navigate to fetch new data when lookback requirement changes
  useEffect(() => {
    if (requiredLookback !== currentLookback) {
      router.push(`?lookback=${requiredLookback}`);
    }
  }, [requiredLookback, currentLookback, router]);

  const kpis = filtered.length === 0 ? null : {
    totalSpend: filtered.reduce((s, r) => s + r.spend, 0),
    totalReach: filtered[0].rollingReach,
    avgNetNewReach: Math.round(filtered.reduce((s, r) => s + r.netNew, 0) / filtered.length),
    avgNetNewPct: filtered.reduce((s, r) => s + r.netNewPct, 0) / filtered.length,
  };

  // Chart data: oldest → newest for chronological display
  const chartData = [...filtered].reverse().map((r) => ({
    month: r.monthLabel,
    previouslyReached: Math.max(0, r.rollingReach - r.netNew),
    netNew: r.netNew,
    netNewPct: parseFloat(r.netNewPct.toFixed(1)),
    cpmNetNew: r.cpmNetNew,
  }));

  const netNewStatus =
    !kpis ? "" :
    kpis.avgNetNewPct >= 30 ? "Frisk malgruppe" :
    kpis.avgNetNewPct >= 18 ? "Moderat metning" :
    "Hoy metning";

  // Auto-sync on first load if no data exists
  useEffect(() => {
    if (data.length === 0 && !syncing) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          months: 6,
          lookbackDays: requiredLookback,
          syncType: "reach",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSyncStatus(`Synkronisert`);
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

  return (
    <div className="space-y-8">

      {/* Controls: period + compare dropdowns */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "3m" | "6m")}
            className="text-sm font-semibold bg-[var(--color-surface)] border-0 rounded-lg px-4 py-2.5 text-[var(--color-black)] cursor-pointer appearance-none pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23090a08' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <span className="text-sm text-[rgba(9,10,8,0.4)]">vs.</span>

          <select
            value={compare}
            onChange={(e) => setCompare(e.target.value as "same" | "previous")}
            className="text-sm font-semibold bg-[var(--color-surface)] border-0 rounded-lg px-4 py-2.5 text-[var(--color-black)] cursor-pointer appearance-none pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23090a08' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {COMPARE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {syncStatus && (
            <span className="text-sm text-[rgba(9,10,8,0.55)]">{syncStatus}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={clsx(
              "text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors",
              syncing
                ? "bg-[var(--color-surface)] text-[rgba(9,10,8,0.45)] cursor-not-allowed border border-[var(--color-border)]"
                : "bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90"
            )}
          >
            {syncing ? "Henter..." : "Oppdater"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-base text-[rgba(9,10,8,0.5)] mb-2">
            Ingen data enna for denne perioden.
          </p>
          <p className="text-sm text-[rgba(9,10,8,0.4)] mb-6">
            Trykk Oppdater for a hente fra Meta.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90 transition-colors"
          >
            {syncing ? "Henter..." : "Oppdater"}
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* KPI cards */}
          {kpis && (
            <div>
              <SectionHeader title="Oppsummering" />
              <div className="grid grid-cols-4 gap-4">
                <KpiCard
                  label="Total Spend"
                  value={formatNokShort(kpis.totalSpend)}
                />
                <KpiCard
                  label="Rolling Reach"
                  value={formatReach(kpis.totalReach)}
                  size="large"
                />
                <KpiCard
                  label="Snitt Nye"
                  value={formatReach(kpis.avgNetNewReach)}
                />
                <KpiCard
                  label="Snitt % Nye"
                  value={`${kpis.avgNetNewPct.toFixed(1)}%`}
                  note={netNewStatus}
                  highlight={kpis.avgNetNewPct < 18}
                />
              </div>

              {kpis.avgNetNewPct < 20 && (
                <div className="mt-4 px-5 py-4 rounded-lg border-2 border-[var(--color-black)] bg-white text-sm text-[var(--color-black)]">
                  <strong>Obs:</strong> Net New Reach er {kpis.avgNetNewPct.toFixed(1)}% - under 30%-terskelen.
                  Vurder kreativ refresh, utvidelse av malgruppe, eller budsjettreduksjon.
                </div>
              )}
            </div>
          )}

          {/* Reach Composition chart */}
          <div>
            <SectionHeader title="Nye brukere per maned" />
            <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
              <ReachCompositionChart data={chartData} />
              <div className="flex gap-6 mt-4 text-sm text-[rgba(9,10,8,0.6)]">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[rgba(9,10,8,0.15)] inline-block" />
                  Tidligere nadd
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[var(--color-black)] inline-block" />
                  Nye
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-link)] inline-block" />
                  % Nye
                </span>
              </div>
            </div>
          </div>

          {/* Cost per 1k Net New Reach */}
          <div>
            <SectionHeader title="CPM Net New" />
            <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0de" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: "rgba(9,10,8,0.5)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v) => `${Math.round(v)} kr`}
                  />
                  <Tooltip content={<CpmTooltip />} cursor={{ stroke: "rgba(9,10,8,0.06)" }} />
                  <Line
                    type="monotone"
                    dataKey="cpmNetNew"
                    stroke="var(--color-link)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#515B12", strokeWidth: 0 }}
                    activeDot={{ fill: "#89FF58", stroke: "#515B12", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly breakdown table */}
          <div>
            <SectionHeader title="Per maned" />
            <div className="rounded-xl bg-[var(--color-surface)] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {["Maned", "Reach", "Nye", "Spend", "Frekvens", "CPM Nye", "% Nye"].map((h) => (
                      <th
                        key={h}
                        className={clsx(
                          "py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]",
                          h === "Maned" ? "text-left px-5" : "text-right px-4"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.monthKey}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-white transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-sm whitespace-nowrap">
                        {row.monthLabel}
                      </td>
                      <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatReach(row.rollingReach)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-link)" }}>
                        {formatReach(row.netNew)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatNok(row.spend)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {row.frequency.toFixed(1)}x
                      </td>
                      <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {Math.round(row.cpmNetNew)} kr
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="text-sm px-2 py-1 rounded font-medium"
                          style={{ 
                            fontFamily: "var(--font-mono)",
                            backgroundColor: getNetNewColor(row.netNewPct).bg,
                            color: getNetNewColor(row.netNewPct).text
                          }}
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

          {/* Hvordan lese denne rapporten */}
          <InfoBox title="Forklaring">
            <dl className="space-y-2.5">
              {[
                {
                  term: "Rolling Reach",
                  def: "Totalt antall unike personer nådd kumulativt. Teller alle som har sett annonsene dine i det valgte vinduet.",
                },
                {
                  term: "Net New Reach",
                  def: "Nye folk nådd denne måneden — personer som ikke har sett annonsene dine de siste 3 månedene.",
                },
                {
                  term: "% Net New",
                  def: "Andel av månedlig rekkevidde som er nye folk. Over 30 % = frisk målgruppe. Under 18 % = vurder kreativ refresh eller utvidelse av målgruppe.",
                },
                {
                  term: "Lookback",
                  def: "Utvid historikken bakover for å se reell rekkevidde over lengre tid. Standard betyr ingen utvidelse.",
                },
              ].map(({ term, def }) => (
                <div key={term} className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="font-semibold text-[rgba(9,10,8,0.75)] leading-snug pt-px">{term}</dt>
                  <dd className="text-[rgba(9,10,8,0.6)] leading-snug">{def}</dd>
                </div>
              ))}
            </dl>
          </InfoBox>
        </>
      )}
    </div>
  );
}
