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
      className={clsx("text-sm font-medium tabular-nums", {
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
    <div className="px-12 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy tracking-tight">
            Puls
          </h1>
          <p className="text-gray-500 mt-2">
            Alle kunder &middot; Siste 7 dager
          </p>
        </div>
        <div className="text-right">
          <p className="small-caps mb-2">Total spend 7d</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-navy">
            {fmt(totalSpend, "NOK ")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-4 small-caps">
                Kunde
              </th>
              <th className="text-right px-5 py-4 small-caps">
                Spend 7d
              </th>
              <th className="text-right px-5 py-4 small-caps">
                ROAS
              </th>
              <th className="text-right px-5 py-4 small-caps">
                CPA
              </th>
              <th className="text-right px-5 py-4 small-caps">
                Net New %
              </th>
              <th className="text-right px-5 py-4 small-caps">
                Freq.
              </th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((row) => {
              const initials = row.client.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <tr
                  key={row.client.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Client */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="avatar w-8 h-8 text-xs flex-shrink-0">
                        {initials}
                      </span>
                      <span className="font-medium text-navy">{row.client.name}</span>
                    </div>
                  </td>

                  {/* Spend */}
                  <td className="px-5 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-navy">
                        {fmt(row.spend7d, "NOK ")}
                      </span>
                      <DeltaBadge value={row.spendDelta} />
                    </div>
                  </td>

                  {/* ROAS */}
                  <td className="px-5 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-navy">
                        {row.roas.toFixed(1)}x
                      </span>
                      <DeltaBadge value={row.roasDelta} />
                    </div>
                  </td>

                  {/* CPA */}
                  <td className="px-5 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-navy">
                        {Math.round(row.cpa)} kr
                      </span>
                      <DeltaBadge value={row.cpaDelta} invert />
                    </div>
                  </td>

                  {/* Net New Reach % */}
                  <td className="px-5 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-navy">
                        {row.netNewReachPct > 0 ? `${row.netNewReachPct.toFixed(1)}%` : "—"}
                      </span>
                      {row.netNewReachPct > 0 && (
                        <span className="badge badge-teal">
                          {row.netNewReachPct >= 30 ? "Frisk" : row.netNewReachPct >= 18 ? "Moderat" : "Mettet"}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Frequency */}
                  <td className="px-5 py-5 text-right">
                    <span
                      className={clsx("font-semibold tabular-nums", {
                        "text-red-500": row.frequency > 8,
                        "text-amber-500": row.frequency > 6 && row.frequency <= 8,
                        "text-navy": row.frequency <= 6,
                      })}
                    >
                      {row.frequency > 0 ? row.frequency.toFixed(1) : "—"}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td className="px-5 py-5 text-right">
                    <Link
                      href={`/${row.client.slug}/performance`}
                      className="btn-pill btn-pill-secondary text-sm py-1.5 px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Se mer &rarr;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="mt-10">
        <InfoBox title="Forklaring">
          <p className="text-gray-600 leading-relaxed">
            <span className="font-semibold text-navy">Net New %</span> er andelen av ukens rekkevidde som er nye personer — folk som ikke har sett annonsene dine de siste 3 manedene.
          </p>
        </InfoBox>
      </div>
    </div>
  );
}
