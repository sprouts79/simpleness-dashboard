import Link from "next/link";
import { getPulseData } from "@/lib/db";
import clsx from "clsx";

export const dynamic = "force-dynamic";

function fmt(n: number, prefix = "") {
  if (n >= 1000000) return `${prefix}${Math.round(n / 1000000)}M`;
  if (n >= 1000) return `${prefix}${Math.round(n / 1000)}k`;
  return `${prefix}${Math.round(n)}`;
}

function DeltaBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={clsx("text-xs font-medium", {
        "delta-up": good,
        "delta-down": !good && value !== 0,
        "delta-neutral": value === 0,
      })}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {sign}{value.toFixed(1)}%
    </span>
  );
}

export default async function PulsePage() {
  const pulseData = (await getPulseData()).sort((a, b) => b.spend7d - a.spend7d);
  const totalSpend = pulseData.reduce((s, r) => s + r.spend7d, 0);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Puls</h1>
          <p className="text-sm text-[rgba(9,10,8,0.45)] mt-1">
            Alle kunder · Siste 7 dager
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[rgba(9,10,8,0.4)] uppercase tracking-wide">Total spend 7d</p>
          <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            {fmt(totalSpend, "NOK ")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
                Kunde
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
                Spend 7d
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
                ROAS
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
                CPA
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
                Net New %
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)]">
                Freq.
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((row) => (
              <tr
                key={row.client.id}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors group"
              >
                {/* Client */}
                <td className="px-5 py-4">
                  <span className="font-semibold">{row.client.name}</span>
                </td>

                {/* Spend */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {fmt(row.spend7d, "NOK ")}
                    </span>
                    <DeltaBadge value={row.spendDelta} />
                  </div>
                </td>

                {/* ROAS */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.roas.toFixed(1)}×
                    </span>
                    <DeltaBadge value={row.roasDelta} />
                  </div>
                </td>

                {/* CPA */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {Math.round(row.cpa)} kr
                    </span>
                    <DeltaBadge value={row.cpaDelta} invert />
                  </div>
                </td>

                {/* Net New Reach % */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.netNewReachPct > 0 ? `${row.netNewReachPct.toFixed(1)}%` : "—"}
                    </span>
                    {row.netNewReachPct > 0 && (
                      <span className="text-xs text-[rgba(9,10,8,0.35)]">
                        {row.netNewReachPct >= 30 ? "Frisk" : row.netNewReachPct >= 18 ? "Moderat" : "Mettet"}
                      </span>
                    )}
                  </div>
                </td>

                {/* Frequency */}
                <td className="px-4 py-4 text-right">
                  <span
                    className={clsx("font-medium", {
                      "text-red-600": row.frequency > 8,
                      "text-yellow-600": row.frequency > 6 && row.frequency <= 8,
                    })}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {row.frequency > 0 ? row.frequency.toFixed(1) : "—"}
                  </span>
                </td>

                {/* Arrow */}
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/${row.client.slug}/performance`}
                    className="text-[rgba(9,10,8,0.25)] group-hover:text-[var(--color-black)] transition-colors text-sm"
                  >
                    →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-xs text-[rgba(9,10,8,0.4)]">
        <span>Net New %: <strong className="text-[rgba(9,10,8,0.7)]">≥30%</strong> = frisk målgruppe · <strong className="text-[rgba(9,10,8,0.7)]">18–30%</strong> = moderat · <strong className="text-[rgba(9,10,8,0.7)]">&lt;18%</strong> = mettet</span>
        <span>Freq. <strong className="text-red-500">&gt;8</strong> = for høy</span>
      </div>
    </div>
  );
}
