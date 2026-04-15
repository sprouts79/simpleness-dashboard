"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { REACH_KPIS, REACH_COMPOSITION, REACH_TABLE } from "@/lib/mock-data";
import KpiCard from "@/components/ui/KpiCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ReachCompositionChart from "@/components/charts/ReachCompositionChart";
import clsx from "clsx";

type Lookback = 30 | 60 | 90 | 180 | 360;

function formatNok(n: number) {
  return `NOK ${n.toLocaleString("no-NO", { maximumFractionDigits: 0 })}`;
}

function formatReach(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

export default function ReachPage() {
  const params = useParams();
  const clientId = params.client as string;
  const [lookback, setLookback] = useState<Lookback>(180);

  const kpis = REACH_KPIS[clientId];
  const composition = REACH_COMPOSITION[clientId] ?? [];
  const table = REACH_TABLE[clientId] ?? [];

  if (!kpis) return <div className="p-8 text-sm text-[rgba(9,10,8,0.4)]">Ingen data.</div>;

  const netNewStatus =
    kpis.avgNetNewPct >= 30 ? "Frisk målgruppe" :
    kpis.avgNetNewPct >= 18 ? "Moderat metning" : "Høy metning — vurder nye kreative eller budsjettreduksjon";

  return (
    <div className="space-y-8">
      {/* Lookback selector */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[rgba(9,10,8,0.45)]">
          Lookback-vindu for "Previously Reached":
        </div>
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 gap-1">
          {([30, 60, 90, 180, 360] as Lookback[]).map((d) => (
            <button
              key={d}
              onClick={() => setLookback(d)}
              className={clsx(
                "text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors",
                lookback === d
                  ? "bg-white text-[var(--color-black)] shadow-sm"
                  : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div>
        <SectionHeader title="Reach-nøkkeltall" subtitle="Siste 12 måneder" />
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="Total Rolling Reach"
            value={formatReach(kpis.totalRollingReach)}
            note={`${lookback}d lookback`}
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
          <KpiCard
            label="Avg CPM Net New"
            value={formatNok(kpis.avgCpmNetNew)}
            note="per 1000 nye nådd"
          />
        </div>

        {/* Alert */}
        {kpis.avgNetNewPct < 20 && (
          <div className="mt-3 px-4 py-3 rounded-lg border border-yellow-200 bg-yellow-50 text-xs text-yellow-800">
            <strong>Advarsel:</strong> Net New Reach er {kpis.avgNetNewPct}% — godt under 30%-terskelen. Audience er i ferd med å mettes. Frekvens er {kpis.frequency}×.{" "}
            Vurder kreativ refresh, utvidelse av målgruppe, eller budsjettreduksjon.
          </div>
        )}
      </div>

      {/* Reach Composition chart */}
      <div>
        <SectionHeader
          title="Reach Composition"
          subtitle="Mørk = previously reached · Grønn = net new · Linje = Net New %"
        />
        <div className="rounded-xl border border-[var(--color-border)] p-5 bg-white">
          <ReachCompositionChart data={composition} />
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

      {/* Monthly breakdown table */}
      {table.length > 0 && (
        <div>
          <SectionHeader title="Månedlig breakdown" />
          <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  {[
                    "Måned", "Rolling Reach", "Ukentlig Reach", "Net New",
                    "Net New %", "Spend", "CPM", "CPM Net New", "Freq."
                  ].map((h) => (
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
                {table.map((row) => (
                  <tr
                    key={row.month}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="px-5 py-2.5 font-medium text-sm">{row.month}</td>
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
                        {row.netNewPct}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatNok(row.spend)}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.cpm} kr
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.cpmNetNew} kr
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
    </div>
  );
}
