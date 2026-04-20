import Link from "next/link";
import { getPulseData } from "@/lib/db";
import InfoBox from "@/components/ui/InfoBox";
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
      <div className="rounded-xl bg-[var(--color-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
                Kunde
              </th>
              <th className="text-right px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
                Spend 7d
              </th>
              <th className="text-right px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
                ROAS
              </th>
              <th className="text-right px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
                CPA
              </th>
              <th className="text-right px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
                Nye %
              </th>
              <th className="text-right px-4 py-3.5 text-sm font-medium text-[rgba(9,10,8,0.5)]">
                Frekvens
              </th>
              <th className="px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((row) => (
              <tr
                key={row.client.id}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-white transition-colors group"
              >
                {/* Client */}
                <td className="px-5 py-4">
                  <span className="font-medium">{row.client.name}</span>
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
                      {row.roas.toFixed(1)}x
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
                  <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                    {row.netNewReachPct > 0 ? `${row.netNewReachPct.toFixed(1)}%` : "-"}
                  </span>
                </td>

                {/* Frequency */}
                <td className="px-4 py-4 text-right">
                  <span
                    className={clsx("font-medium", {
                      "font-semibold": row.frequency > 8,
                    })}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {row.frequency > 0 ? row.frequency.toFixed(1) : "-"}
                  </span>
                </td>

                {/* Arrow */}
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/${row.client.slug}/performance`}
                    className="text-[rgba(9,10,8,0.3)] group-hover:text-[var(--color-black)] transition-colors"
                  >
                    →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="mt-6">
        <InfoBox title="Forklaring">
          <p className="text-[rgba(9,10,8,0.6)] leading-snug">
            <span className="font-semibold text-[rgba(9,10,8,0.75)]">Net New %</span> er andelen av ukens rekkevidde som er nye personer — folk som ikke har sett annonsene dine de siste 3 månedene.
          </p>
        </InfoBox>
      </div>
    </div>
  );
}
