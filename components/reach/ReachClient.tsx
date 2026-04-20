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
      <p className="font-medium mb-1">{label}</p>
      <p className="tabular-nums">
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

  const filtered = data.slice(0, 6);

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

  const activeOption = LOOKBACK_OPTIONS.find((o) => o.days === currentLookback) ?? LOOKBACK_OPTIONS[0];
  const lookbackLabel = currentLookback === 0 ? "standard (ingen)" : `+${currentLookback}d`;

  const netNewStatus =
    !kpis ? "" :
    kpis.avgNetNewPct >= 30 ? "Frisk malgruppe" :
    kpis.avgNetNewPct >= 18 ? "Moderat metning" :
    "Hoy metning";

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
        setSyncStatus(`Synkronisert - ${json.reachSynced} uker hentet`);
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
    <div className="space-y-10">

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--color-gray-500)]">Utvid lookback med:</span>
          <div className="flex bg-[var(--color-gray-50)] rounded-lg p-1 gap-1">
            {LOOKBACK_OPTIONS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handleLookbackClick(days)}
                className={clsx(
                  "text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                  currentLookback === days
                    ? "bg-white text-[var(--color-black)] shadow-sm"
                    : "text-[var(--color-gray-500)] hover:text-[var(--color-black)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {currentLookback !== 0 && filtered.length === 0 && (
            <span className="text-xs text-[var(--color-gray-400)]">
              Ingen data - trykk Hent data
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {syncStatus && (
            <span className="text-xs text-[var(--color-gray-500)]">{syncStatus}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={clsx(
              "text-xs font-medium px-4 py-2 rounded-md transition-colors",
              syncing
                ? "bg-[var(--color-gray-100)] text-[var(--color-gray-400)] cursor-not-allowed"
                : "bg-[var(--color-black)] text-white hover:opacity-90"
            )}
          >
            {syncing ? "Henter..." : "Hent data"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-lg border border-[var(--color-border)] p-12 text-center">
          <p className="text-sm text-[var(--color-gray-500)] mb-2">
            Ingen reach-data for lookback {activeOption.label}.
          </p>
          <p className="text-xs text-[var(--color-gray-400)] mb-6">
            Trykk Hent data for a synkronisere fra Meta.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-medium px-4 py-2 rounded-md bg-[var(--color-black)] text-white hover:opacity-90 transition-colors"
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
                title="Reach-nokkeltall"
                subtitle={`Siste 6 maneder - lookback ${lookbackLabel} - ${filtered.length} mnd data`}
              />
              <div className="grid grid-cols-4 gap-4">
                <KpiCard
                  label="Total Spend"
                  value={formatNokShort(kpis.totalSpend)}
                  note="siste 6 mnd"
                />
                <KpiCard
                  label="Rolling Reach"
                  value={formatReach(kpis.totalReach)}
                  note={`6M vindu - lookback ${lookbackLabel}`}
                  size="large"
                />
                <KpiCard
                  label="Avg Net New Reach"
                  value={formatReach(kpis.avgNetNewReach)}
                  note="per maned"
                />
                <KpiCard
                  label="Avg % Net New"
                  value={`${kpis.avgNetNewPct.toFixed(1)}%`}
                  note={netNewStatus}
                  highlight={kpis.avgNetNewPct < 18}
                />
              </div>

              {kpis.avgNetNewPct < 20 && (
                <div className="mt-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
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
              subtitle="Gra = previously reached - Gronn = net new - Linje = Net New %"
            />
            <div className="rounded-lg border border-[var(--color-border)] p-5 bg-white">
              <ReachCompositionChart data={chartData} />
              <div className="flex gap-6 mt-4 text-xs text-[var(--color-gray-400)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-gray-200)] inline-block" />
                  Previously reached
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-gray-400)] inline-block" />
                  Net New
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-amber-500 inline-block" />
                  Net New %
                </span>
              </div>
            </div>
          </div>

          {/* Cost per 1k Net New Reach */}
          <div>
            <SectionHeader
              title="Cost Per 1k Net New Reach"
              subtitle="Kostnad per 1000 nye unike nadd - per maned"
            />
            <div className="rounded-lg border border-[var(--color-border)] p-5 bg-white">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-gray-400)" }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(v) => `${Math.round(v)}`}
                  />
                  <Tooltip content={<CpmTooltip />} cursor={{ stroke: "var(--color-gray-100)" }} />
                  <Line
                    type="monotone"
                    dataKey="cpmNetNew"
                    stroke="var(--color-black)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-black)", strokeWidth: 0 }}
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
            <div className="rounded-lg border border-[var(--color-border)] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                    {["Maned", "Rolling Reach", "Net New", "Spend", "CPM", "Frequency", "CPM Net New", "%"].map((h) => (
                      <th
                        key={h}
                        className={clsx(
                          "py-3 text-xs font-medium text-[var(--color-gray-500)]",
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
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-gray-50)] transition-colors"
                    >
                      <td className="px-5 py-2.5 font-medium text-sm whitespace-nowrap">
                        {row.monthLabel}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatReach(row.rollingReach)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-gray-600)]">
                        {formatReach(row.netNew)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatNok(row.spend)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {Math.round(row.cpm)} kr
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.frequency.toFixed(2)}x
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {Math.round(row.cpmNetNew)} kr
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={clsx("text-xs font-medium px-2 py-0.5 rounded-full tabular-nums", {
                            "bg-green-100 text-green-700": row.netNewPct >= 30,
                            "bg-amber-100 text-amber-700": row.netNewPct >= 18 && row.netNewPct < 30,
                            "bg-red-100 text-red-700": row.netNewPct < 18,
                          })}
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

          {/* Info */}
          <InfoBox title="Forklaring">
            <dl className="space-y-2.5">
              {[
                {
                  term: "Rolling Reach",
                  def: "Totalt antall unike personer nadd kumulativt. Teller alle som har sett annonsene dine i det valgte vinduet.",
                },
                {
                  term: "Net New Reach",
                  def: "Nye folk nadd denne maneden - personer som ikke har sett annonsene dine de siste 3 manedene.",
                },
                {
                  term: "% Net New",
                  def: "Andel av manedlig rekkevidde som er nye folk. Over 30 % = frisk malgruppe. Under 18 % = vurder kreativ refresh eller utvidelse av malgruppe.",
                },
                {
                  term: "Lookback",
                  def: "Utvid historikken bakover for a se reell rekkevidde over lengre tid. Standard betyr ingen utvidelse.",
                },
              ].map(({ term, def }) => (
                <div key={term} className="grid grid-cols-[140px_1fr] gap-3">
                  <dt className="font-medium text-[var(--color-black)] leading-snug pt-px">{term}</dt>
                  <dd className="text-[var(--color-gray-600)] leading-relaxed">{def}</dd>
                </div>
              ))}
            </dl>
          </InfoBox>
        </>
      )}
    </div>
  );
}
