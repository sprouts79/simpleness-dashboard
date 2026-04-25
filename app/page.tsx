import Link from "next/link";
import { getPulseData } from "@/lib/db";
import InfoBox from "@/components/ui/InfoBox";
import DeltaPill from "@/components/ui/DeltaPill";

export const dynamic = "force-dynamic";

function fmt(n: number, prefix = "") {
  if (n >= 1000000) return `${prefix}${Math.round(n / 1000000)}M`;
  if (n >= 1000) return `${prefix}${Math.round(n / 1000)}k`;
  return `${prefix}${Math.round(n)}`;
}

export default async function PulsePage() {
  const pulseData = (await getPulseData()).sort((a, b) => b.spend7d - a.spend7d);
  const totalSpend = pulseData.reduce((s, r) => s + r.spend7d, 0);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Puls</h1>
          <p className="text-sm text-neutral-500 mt-1">Alle kunder · Siste 7 dager</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total spend 7d</p>
          <p className="text-xl font-bold tabular-nums text-neutral-900 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
            {fmt(totalSpend, "NOK ")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <Th align="left">Kunde</Th>
              <Th>Spend 7d</Th>
              <Th>ROAS</Th>
              <Th>CPA</Th>
              <Th>Nye %</Th>
              <Th>Frekvens</Th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((row) => (
              <tr
                key={row.client.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 transition-colors group"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900">{row.client.name}</span>
                </td>
                <MetricCell value={fmt(row.spend7d, "NOK ")} delta={row.spendDelta} />
                <MetricCell value={`${row.roas.toFixed(1)}×`} delta={row.roasDelta} />
                <MetricCell value={`${Math.round(row.cpa)} kr`} delta={row.cpaDelta} invert />
                <td className="px-3 py-3 text-right tabular-nums text-neutral-900" style={{ fontFamily: "var(--font-mono)" }}>
                  {row.netNewReachPct > 0 ? `${row.netNewReachPct.toFixed(1)}%` : "—"}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-neutral-900" style={{ fontFamily: "var(--font-mono)" }}>
                  <span className={row.frequency > 8 ? "font-semibold" : ""}>
                    {row.frequency > 0 ? row.frequency.toFixed(1) : "—"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <Link
                    href={`/${row.client.slug}/performance`}
                    className="text-neutral-300 group-hover:text-neutral-900 transition-colors"
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
          <p className="text-neutral-600 leading-snug">
            <span className="font-medium text-neutral-900">Net New %</span> er andelen av ukens rekkevidde som er nye personer — folk som ikke har sett annonsene dine de siste 3 månedene.
          </p>
        </InfoBox>
      </div>
    </div>
  );
}

function Th({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`${align === "left" ? "text-left px-4" : "text-right px-3"} py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider`}>
      {children}
    </th>
  );
}

function MetricCell({ value, delta, invert = false }: { value: string; delta: number; invert?: boolean }) {
  return (
    <td className="px-3 py-3 text-right">
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-medium tabular-nums text-neutral-900" style={{ fontFamily: "var(--font-mono)" }}>
          {value}
        </span>
        <DeltaPill delta={delta} invert={invert} />
      </div>
    </td>
  );
}
