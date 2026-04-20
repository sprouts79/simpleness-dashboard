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
      className={clsx("text-xs font-medium tabular-nums", {
        "delta-up": good,
        "delta-down": !good && value !== 0,
        "delta-neutral": value === 0,
      })}
    >
      {sign}{value.toFixed(1)}%
    </span>
  );
}

export default async function PulsePage() {
  const pulseData = (await getPulseData()).sort((a, b) => b.spend7d - a.spend7d);
  const totalSpend = pulseData.reduce((s, r) => s + r.spend7d, 0);

  return (
    <div className="px-10 py-10">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Puls</h1>
          <p className="text-sm text-[var(--color-gray-500)] mt-1">
            Alle kunder &middot; Siste 7 dager
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-gray-400)] mb-1">Total spend 7d</p>
          <p className="text-xl font-semibold tabular-nums tracking-tight">
            {fmt(totalSpend, "NOK ")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--color-gray-500)]">
                Kunde
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-gray-500)]">
                Spend 7d
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-gray-500)]">
                ROAS
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-gray-500)]">
                CPA
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-gray-500)]">
                Net New %
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-gray-500)]">
                Freq.
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((row) => (
              <tr
                key={row.client.id}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-gray-50)] transition-colors group"
              >
                {/* Client */}
                <td className="px-5 py-4">
                  <span className="font-medium">{row.client.name}</span>
                </td>

                {/* Spend */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium tabular-nums">
                      {fmt(row.spend7d, "NOK ")}
                    </span>
                    <DeltaBadge value={row.spendDelta} />
                  </div>
                </td>

                {/* ROAS */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium tabular-nums">
                      {row.roas.toFixed(1)}x
                    </span>
                    <DeltaBadge value={row.roasDelta} />
                  </div>
                </td>

                {/* CPA */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium tabular-nums">
                      {Math.round(row.cpa)} kr
                    </span>
                    <DeltaBadge value={row.cpaDelta} invert />
                  </div>
                </td>

                {/* Net New Reach % */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium tabular-nums">
                      {row.netNewReachPct > 0 ? `${row.netNewReachPct.toFixed(1)}%` : "—"}
                    </span>
                    {row.netNewReachPct > 0 && (
                      <span className="text-xs text-[var(--color-gray-400)]">
                        {row.netNewReachPct >= 30 ? "Frisk" : row.netNewReachPct >= 18 ? "Moderat" : "Mettet"}
                      </span>
                    )}
                  </div>
                </td>

                {/* Frequency */}
                <td className="px-4 py-4 text-right">
                  <span
                    className={clsx("font-medium tabular-nums", {
                      "text-red-500": row.frequency > 8,
                      "text-amber-500": row.frequency > 6 && row.frequency <= 8,
                    })}
                  >
                    {row.frequency > 0 ? row.frequency.toFixed(1) : "—"}
                  </span>
                </td>

                {/* Arrow */}
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/${row.client.slug}/performance`}
                    className="text-[var(--color-gray-300)] group-hover:text-[var(--color-black)] transition-colors text-sm"
                  >
                    &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="mt-8">
        <InfoBox title="Forklaring">
          <p className="text-[var(--color-gray-600)] leading-relaxed">
            <span className="font-medium text-[var(--color-black)]">Net New %</span> er andelen av ukens rekkevidde som er nye personer — folk som ikke har sett annonsene dine de siste 3 manedene.
          </p>
        </InfoBox>
      </div>
    </div>
  );
}
