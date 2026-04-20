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

// Extension options — how far before the 6M display period to extend the window start
// 0 = standard (no extension; first month ≈ 100% net new)
const LOOKBACK_OPTIONS = [
  { label: "Standard", days: 0 },
  { label: "+3M", days: 90 },
  { label: "+6M", days: 180 },
  { label: "+12M", days: 360 },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CpmTooltip = ({ active, payload, label }: any) => {
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

  // Fixed 6-month display window, newest-first data
  const filtered = data.slice(0, 6);

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

  const activeOption = LOOKBACK_OPTIONS.find((o) => o.days === currentLookback) ?? LOOKBACK_OPTIONS[0];
  const lookbackLabel = currentLookback === 0 ? "standard (ingen)" : `+${currentLookback}d`;

  const netNewStatus =
    !kpis ? "" :
    kpis.avgNetNewPct >= 30 ? "Frisk målgruppe" :
    kpis.avgNetNewPct >= 18 ? "Moderat metning" :
    "Høy metning";

  // Switching lookback navigates to new URL — server fetches the right data
  // Auto-sync Standard (0) lookback on first load if no data exists
  useEffect(() => {
    if (currentLookback === 0 && data.length === 0 && !syncing) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLookbackClick(days: number) {
    if (days !== currentLookback) {
      router.push(`?lookback=${days}`);
    }
  }

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
          lookbackDays: currentLookback,
          syncType: "reach",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSyncStatus(`Synkronisert — ${json.reachSynced} uker hentet`);
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

      {/* Controls: lookback selector + Hent data */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[rgba(9,10,8,0.55)]">Utvid lookback med:</span>
          <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
            {LOOKBACK_OPTIONS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handleLookbackClick(days)}
                className={clsx(
                  "text-sm font-semibold px-4 py-2 rounded-md transition-colors",
                  currentLookback === days
                    ? "bg-white text-[var(--color-black)] shadow-sm"
                    : "text-[rgba(9,10,8,0.5)] hover:text-[var(--color-black)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {currentLookback !== 0 && filtered.length === 0 && (
            <span className="text-sm text-[rgba(9,10,8,0.45)]">
              Ingen data - trykk Hent data
            </span>
          )}
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
            {syncing ? "Henter..." : "Hent data"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-base text-[rgba(9,10,8,0.5)] mb-2">
            Ingen reach-data for lookback {activeOption.label}.
          </p>
          <p className="text-sm text-[rgba(9,10,8,0.4)] mb-6">
            Trykk Hent data for a synkronisere fra Meta.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90 transition-colors"
          >
            {syncing ? "Henter..." : "Hent data"}
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* KPI cards */}
          {kpis && (
            <div>
              <SectionHeader
                title="Reach-nøkkeltall"
                subtitle={`Siste 6 måneder · lookback ${lookbackLabel} · ${filtered.length} mnd data`}
              />
              <div className="grid grid-cols-4 gap-3">
                <KpiCard
                  label="Total Spend"
                  value={formatNokShort(kpis.totalSpend)}
                  note="siste 6 mnd"
                />
                <KpiCard
                  label="Rolling Reach"
                  value={formatReach(kpis.totalReach)}
                  note={`6M vindu · lookback ${lookbackLabel}`}
                  size="large"
                />
                <KpiCard
                  label="Avg Net New Reach"
                  value={formatReach(kpis.avgNetNewReach)}
                  note="per måned"
                />
                <KpiCard
                  label="Avg % Net New"
                  value={`${kpis.avgNetNewPct.toFixed(1)}%`}
                  note={netNewStatus}
                  highlight={kpis.avgNetNewPct < 18}
                />
              </div>

              {kpis.avgNetNewPct < 20 && (
                <div className="mt-4 px-5 py-4 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
                  <strong>Advarsel:</strong> Net New Reach er {kpis.avgNetNewPct.toFixed(1)}% - under 30%-terskelen.
                  Frekvens er hoy. Vurder kreativ refresh, utvidelse av malgruppe, eller budsjettreduksjon.
                </div>
              )}
            </div>
          )}

          {/* Reach Composition chart */}
          <div>
            <SectionHeader
              title="Reach Composition Analysis"
              subtitle="Grå = previously reached · Grønn = net new · Linje = Net New %"
            />
            <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
              <ReachCompositionChart data={chartData} />
              <div className="flex gap-6 mt-4 text-sm text-[rgba(9,10,8,0.5)]">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#d4d4d0] inline-block" />
                  Previously reached
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[var(--color-green-mint)] inline-block" />
                  Net New
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-5 h-0.5 bg-[#d97706] inline-block" />
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
                  <Tooltip content={<CpmTooltip />} cursor={{ stroke: "rgba(9,10,8,0.06)" }} />
                  <Line
                    type="monotone"
                    dataKey="cpmNetNew"
                    stroke="var(--color-link)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-link)", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly breakdown table */}
          <div>
            <SectionHeader
              title="Monthly Breakdown"
              subtitle={`Lookback ${lookbackLabel} - siste ${filtered.length} maneder`}
            />
            <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    {["Maned", "Rolling Reach", "Net New", "Spend", "CPM", "Frequency", "CPM Net New", "%"].map((h) => (
                      <th
                        key={h}
                        className={clsx(
                          "py-3.5 text-2xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.5)]",
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
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-base whitespace-nowrap">
                        {row.monthLabel}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatReach(row.rollingReach)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--color-link)" }}>
                        {formatReach(row.netNew)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatNok(row.spend)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {Math.round(row.cpm)} kr
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {row.frequency.toFixed(2)}x
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {Math.round(row.cpmNetNew)} kr
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={clsx("text-sm font-semibold px-2 py-1 rounded", {
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
