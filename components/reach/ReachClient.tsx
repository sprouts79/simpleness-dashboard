"use client";

import { useState, useMemo } from "react";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ReachCompositionChart from "@/components/charts/ReachCompositionChart";
import { ReachCompositionPoint, ReachMonthRow } from "@/lib/types";
import clsx from "clsx";

type Period = 1 | 3 | 6 | 12 | 18 | 24;

function formatNok(n: number) {
  return `NOK ${n.toLocaleString("no-NO", { maximumFractionDigits: 0 })}`;
}

function formatReach(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export default function ReachClient({
  clientId,
  composition,
  table,
}: {
  clientId: string;
  composition: ReachCompositionPoint[];
  table: ReachMonthRow[];
}) {
  const [period, setPeriod] = useState<Period>(6);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Filter to selected period (table is newest-first, composition is oldest-first)
  const weeksToShow = Math.round(period * 4.33);
  const filteredTable = table.slice(0, weeksToShow);
  const filteredComposition = composition.slice(-weeksToShow);

  // KPIs computed client-side from the filtered window
  const kpis = useMemo(() => {
    if (!filteredTable.length) return null;
    return {
      totalRollingReach: filteredTable[0].rollingReach,
      avgNetNewReach: Math.round(avg(filteredTable.map((r) => r.netNew))),
      avgNetNewPct: parseFloat(avg(filteredTable.map((r) => r.netNewPct)).toFixed(1)),
      avgCpmNetNew: parseFloat(avg(filteredTable.map((r) => r.cpmNetNew)).toFixed(0)),
      frequency: parseFloat(avg(filteredTable.map((r) => r.frequency)).toFixed(1)),
    };
  }, [filteredTable]);

  const netNewStatus = !kpis ? "" :
    kpis.avgNetNewPct >= 30 ? "Frisk målgruppe" :
    kpis.avgNetNewPct >= 18 ? "Moderat metning" :
    "Høy metning — vurder nye kreative eller budsjettreduksjon";

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, months: period }),
      });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus(`Synkronisert — ${data.reachSynced} uker hentet`);
        setTimeout(() => window.location.reload(), 800);
      } else {
        setSyncStatus(`Feil: ${data.errors?.join(", ") || "Ukjent feil"}`);
      }
    } catch (e: any) {
      setSyncStatus(`Feil: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Period selector + Hent data */}
      <div className="flex items-center justify-between">
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
            {syncing ? "Henter..." : "Hent data"}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {kpis && (
        <div>
          <SectionHeader
            title="Reach-nøkkeltall"
            subtitle={`Siste ${period} mnd · ${filteredTable.length} uker · 90d lookback`}
          />
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="Total Rolling Reach"
              value={formatReach(kpis.totalRollingReach)}
              note="90d rullerende vindu"
              size="large"
            />
            <KpiCard
              label="Avg Net New Reach"
              value={formatReach(kpis.avgNetNewReach)}
              note="per uke"
            />
            <KpiCard
              label="Avg % Net New"
              value={`${kpis.avgNetNewPct.toFixed(1)}%`}
              note={netNewStatus}
              highlight={kpis.avgNetNewPct < 18}
            />
            <KpiCard
              label="Avg CPM Net New"
              value={formatNok(kpis.avgCpmNetNew)}
              note="per 1000 nye nådd"
            />
          </div>

          {kpis.avgNetNewPct < 20 && (
            <div className="mt-3 px-4 py-3 rounded-lg border border-yellow-200 bg-yellow-50 text-xs text-yellow-800">
              <strong>Advarsel:</strong> Net New Reach er {kpis.avgNetNewPct}% — under 30%-terskelen.
              Frekvens er {kpis.frequency}×.{" "}
              Vurder kreativ refresh, utvidelse av målgruppe, eller budsjettreduksjon.
            </div>
          )}
        </div>
      )}

      {/* Reach Composition chart */}
      {filteredComposition.length > 0 && (
        <div>
          <SectionHeader
            title="Reach Composition"
            subtitle="Mørk = previously reached · Grønn = net new · Linje = Net New %"
          />
          <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
            <ReachCompositionChart data={filteredComposition} />
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
      )}

      {/* Weekly breakdown table */}
      {filteredTable.length > 0 && (
        <div>
          <SectionHeader title="Ukentlig breakdown" />
          <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  {[
                    "Uke", "Rolling Reach", "Ukentlig Reach", "Net New",
                    "Net New %", "Spend", "CPM", "CPM Net New", "Freq.",
                  ].map((h) => (
                    <th
                      key={h}
                      className={clsx(
                        "py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]",
                        h === "Uke" ? "text-left px-5" : "text-right px-4"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTable.map((row) => (
                  <tr
                    key={row.month}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="px-5 py-2.5 font-medium text-sm whitespace-nowrap">{row.month}</td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatReach(row.rollingReach)}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatReach(row.weeklyReach)}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)", color: "var(--color-link)" }}>
                      {formatReach(row.netNew)}
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
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatNok(row.spend)}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {Math.round(row.cpm)} kr
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {Math.round(row.cpmNetNew)} kr
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.frequency.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTable.length === 0 && filteredComposition.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center">
          <p className="text-sm text-[rgba(9,10,8,0.4)] mb-4">
            Ingen reach-data tilgjengelig for denne perioden.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90 transition-colors"
          >
            {syncing ? "Henter..." : "Hent data fra Meta"}
          </button>
        </div>
      )}
    </div>
  );
}
