import Link from "next/link";
import { getPulseData } from "@/lib/db";
import { ClientStatus } from "@/lib/types";
import clsx from "clsx";

function fmt(n: number, prefix = "", decimals = 0) {
  if (n >= 1000000) return `${prefix}${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${prefix}${Math.round(n / 1000)}k`;
  return `${prefix}${n.toFixed(decimals)}`;
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

function StatusPill({ status }: { status: ClientStatus }) {
  const labels = { green: "On track", yellow: "Advarsel", red: "Kritisk" };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
        {
          "bg-green-50 text-green-700": status === "green",
          "bg-yellow-50 text-yellow-700": status === "yellow",
          "bg-red-50 text-red-700": status === "red",
        }
      )}
    >
      <span
        className={clsx("w-1.5 h-1.5 rounded-full", {
          "bg-green-500": status === "green",
          "bg-yellow-500": status === "yellow",
          "bg-red-500": status === "red",
        })}
      />
      {labels[status]}
    </span>
  );
}

export default async function PulsePage() {
  const pulseData = await getPulseData();
  const totalSpend = pulseData.reduce((s, r) => s + r.spend7d, 0);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Pulse</h1>
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
                CPM
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
                  <div className="flex items-center gap-3">
                    <StatusPill status={row.client.status} />
                    <span className="font-semibold">{row.client.name}</span>
                  </div>
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
                      {row.cpa} kr
                    </span>
                    <DeltaBadge value={row.cpaDelta} invert />
                  </div>
                </td>

                {/* CPM */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.cpm} kr
                    </span>
                    <DeltaBadge value={row.cpmDelta} invert />
                  </div>
                </td>

                {/* Net New Reach % */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {row.netNewReachPct}%
                    </span>
                    <span className="text-xs text-[rgba(9,10,8,0.35)]">
                      {row.netNewReachPct >= 30
                        ? "Frisk"
                        : row.netNewReachPct >= 18
                        ? "Moderat"
                        : "Mettet"}
                    </span>
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
                    {row.frequency.toFixed(1)}
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
