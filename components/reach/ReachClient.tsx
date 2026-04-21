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
import { CHART_BAR_COLOR, CHART_BAR_STACKED, CHART_LINE_COLOR } from "@/lib/chart-colors";
import { MonthlyReachRow, WeeklyReachRow } from "@/lib/types";

type PeriodValue = "3m" | "6m";
type LookbackValue = 0 | 90 | 180 | 360;

const PERIOD_OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: "3m", label: "Siste 3 mnd" },
  { value: "6m", label: "Siste 6 mnd" },
];

const LOOKBACK_OPTIONS: { value: LookbackValue; label: string }[] = [
  { value: 0, label: "Ingen" },
  { value: 90, label: "3 mnd" },
  { value: 180, label: "6 mnd" },
  { value: 360, label: "12 mnd" },
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

function getNetNewColor(pct: number): { bg: string; text: string } {
  const normalized = Math.min(Math.max(pct, 0), 25) / 25;
  const r = Math.round(200 - (200 - 34) * normalized);
  const g = Math.round(50 + (140 - 50) * normalized);
  const b = Math.round(50 - (50 - 34) * normalized);
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
    text: `rgb(${Math.round(r * 0.65)}, ${Math.round(g * 0.65)}, ${Math.round(b * 0.65)})`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CpmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-md">
      <p className="font-semibold text-base mb-2">{label}</p>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_LINE_COLOR }} />
          <span className="text-xs font-semibold text-[rgba(9,10,8,0.6)]">Kost per 1k nye</span>
        </div>
        <p className="font-bold text-xl" style={{ fontFamily: "var(--font-mono)" }}>
          {Math.round(payload[0]?.value ?? 0)} kr
        </p>
      </div>
    </div>
  );
};

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23090a08' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
};

export default function ReachClient({
  clientId,
  data,
  weeklyData,
  currentLookback,
  currentPeriod,
}: {
  clientId: string;
  data: MonthlyReachRow[];
  weeklyData: WeeklyReachRow[];
  currentLookback: number;
  currentPeriod: PeriodValue;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const periodMonths = currentPeriod === "6m" ? 6 : 3;
  const filtered = data.slice(0, periodMonths);

  function navigate(period: PeriodValue, lookback: LookbackValue) {
    router.push(`?period=${period}&lookback=${lookback}`);
  }

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
          months: 12,
          lookbackDays: currentLookback,
          syncType: "reach",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSyncStatus("Synkronisert");
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

  const kpis = filtered.length === 0 ? null : {
    totalSpend: filtered.reduce((s, r) => s + r.spend, 0),
    totalReach: filtered[0].rollingReach,
    avgNetNewReach: Math.round(filtered.reduce((s, r) => s + r.netNew, 0) / filtered.length),
    avgNetNewPct: filtered.reduce((s, r) => s + r.netNewPct, 0) / filtered.length,
  };

  const chartData = [...filtered].reverse().map((r) => ({
    month: r.monthLabel,
    previouslyReached: Math.max(0, r.rollingReach - r.netNew),
    netNew: r.netNew,
    netNewPct: parseFloat(r.netNewPct.toFixed(1)),
    cpmNetNew: r.cpmNetNew,
  }));

  const reachStatus = !kpis ? null : kpis.avgNetNewPct >= 25
    ? { level: "good" as const, label: "Frisk målgruppe" }
    : kpis.avgNetNewPct >= 15
    ? { level: "warning" as const, label: "Moderat metning" }
    : { level: "critical" as const, label: "Høy metning" };

  const lookbackLabel = LOOKBACK_OPTIONS.find((o) => o.value === currentLookback)?.label ?? "Ingen";

  return (
    <div className="space-y-8">

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgba(9,10,8,0.5)]">Periode</span>
            <select
              value={currentPeriod}
              onChange={(e) => navigate(e.target.value as PeriodValue, currentLookback as LookbackValue)}
              className="text-sm font-semibold bg-[var(--color-surface)] border-0 rounded-lg px-4 py-2.5 text-[var(--color-black)] cursor-pointer appearance-none pr-10"
              style={selectStyle}
            >
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgba(9,10,8,0.5)]">Lookback</span>
            <select
              value={currentLookback}
              onChange={(e) => navigate(currentPeriod, parseInt(e.target.value) as LookbackValue)}
              className="text-sm font-semibold bg-[var(--color-surface)] border-0 rounded-lg px-4 py-2.5 text-[var(--color-black)] cursor-pointer appearance-none pr-10"
              style={selectStyle}
            >
              {LOOKBACK_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
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
                : "bg-[#89FF58] text-[var(--color-black)] hover:opacity-90"
            )}
          >
            {syncing ? "Henter..." : "Hent data"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && weeklyData.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-base text-[rgba(9,10,8,0.5)] mb-2">
            Ingen data ennå for denne perioden.
          </p>
          <p className="text-sm text-[rgba(9,10,8,0.4)] mb-6">
            Trykk Hent data for å hente fra Meta.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-[#89FF58] text-[var(--color-black)] hover:opacity-90 transition-colors"
          >
            {syncing ? "Henter..." : "Hent data"}
          </button>
        </div>
      )}

      {(filtered.length > 0 || weeklyData.length > 0) && (
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
                />
                <KpiCard
                  label="Snitt nye per mnd"
                  value={formatReach(kpis.avgNetNewReach)}
                />
                <KpiCard
                  label="Snitt % nye"
                  value={`${kpis.avgNetNewPct.toFixed(1)}%`}
                  status={reachStatus ?? undefined}
                  highlight={kpis.avgNetNewPct < 15}
                />
              </div>
            </div>
          )}

          {/* Reach Composition chart */}
          {chartData.length > 0 && (
            <div>
              <SectionHeader title="Nye brukere per måned" />
              <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
                <ReachCompositionChart data={chartData} />
                <div className="flex gap-6 mt-4 text-sm text-[rgba(9,10,8,0.6)]">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: CHART_BAR_COLOR }} />
                    Tidligere nådd
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: CHART_BAR_STACKED }} />
                    Nye
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CHART_LINE_COLOR }} />
                    % Nye
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cost per 1k Net New Reach */}
          {chartData.length > 0 && (
            <div>
              <SectionHeader title="Kost nye brukere per måned" />
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
                      stroke={CHART_LINE_COLOR}
                      strokeWidth={3}
                      dot={{ fill: CHART_LINE_COLOR, strokeWidth: 0, r: 4 }}
                      activeDot={{ fill: CHART_LINE_COLOR, strokeWidth: 0, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weekly breakdown table */}
          {weeklyData.length > 0 && (
            <div>
              <SectionHeader title="Per uke" subtitle={`Lookback: ${lookbackLabel}`} />
              <div className="rounded-xl bg-[var(--color-surface)] overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {["Uke", "Reach", "Nye", "% Nye", "Spend", "Frekvens", "Kost/1k nye"].map((h) => (
                        <th
                          key={h}
                          className={clsx(
                            "py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]",
                            h === "Uke" ? "text-left px-5" : "text-right px-4"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.map((row) => (
                      <tr
                        key={row.weekStart}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-white transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-sm whitespace-nowrap">
                          {row.weekLabel}
                        </td>
                        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                          {formatReach(row.reach)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                          {formatReach(row.netNew)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className="text-sm px-2 py-1 rounded font-medium"
                            style={{
                              fontFamily: "var(--font-mono)",
                              backgroundColor: getNetNewColor(row.netNewPct).bg,
                              color: getNetNewColor(row.netNewPct).text,
                            }}
                          >
                            {row.netNewPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                          {formatNok(row.spend)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                          {row.frequency.toFixed(1)}×
                        </td>
                        <td className="px-4 py-3 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                          {Math.round(row.cpmNetNew)} kr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info */}
          <InfoBox title="Forklaring">
            <dl className="space-y-2.5">
              {[
                {
                  term: "Rolling Reach",
                  def: "Totalt antall unike personer nådd kumulativt i det valgte vinduet.",
                },
                {
                  term: "Nye",
                  def: "Nye folk nådd denne uken — personer som ikke har sett annonsene dine i lookback-perioden.",
                },
                {
                  term: "% Nye",
                  def: "Andel av ukens rekkevidde som er nye folk. Over 25 % = frisk målgruppe. Under 15 % = vurder kreativ refresh.",
                },
                {
                  term: "Lookback",
                  def: "Hvor langt tilbake vi ser for å avgjøre om en person er \"ny\". Ingen = kun perioden selv. 3–12 mnd gir mer realistisk bilde.",
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
