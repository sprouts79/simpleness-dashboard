"use client";

import { FatigueData, FatigueAdRow, FatigueStatus } from "@/lib/types";
import clsx from "clsx";

interface Props {
  data: FatigueData;
}

// Status palette — neutral for tiers, warm for special states.
// Text-as-interface, no flat fills — pills carry the label, not background colour.
const STATUS_STYLES: Record<FatigueStatus, { label: string; pillClass: string; description: string }> = {
  a: {
    label: "A",
    pillClass: "bg-neutral-900 text-white border-neutral-900",
    description: "Topp 20% av spend-andel",
  },
  b: {
    label: "B",
    pillClass: "bg-neutral-100 text-neutral-800 border-neutral-300",
    description: "Midten 50%",
  },
  c: {
    label: "C",
    pillClass: "bg-white text-neutral-600 border-neutral-300",
    description: "Bunn 30%",
  },
  new: {
    label: "Ny",
    pillClass: "bg-sky-50 text-sky-900 border-sky-200",
    description: "Lansert siste 14 dager",
  },
  dead: {
    label: "Død",
    pillClass: "bg-rose-50 text-rose-900 border-rose-200",
    description: "0 spend siste 7 dager",
  },
};

const TOF_PILL = "bg-amber-50 text-amber-900 border-amber-200";

function fmtPct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtFreq(v: number): string {
  return v.toFixed(1);
}

function fmtCpm(v: number): string {
  return Math.round(v).toString();
}

function fmtSpend(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return Math.round(v).toString();
}

function fmtDaysAgo(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "i dag";
  if (days === 1) return "1 dag siden";
  return `${days} dager siden`;
}

function Sparkline({ values, color = "#525252" }: { values: number[]; color?: string }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 56;
  const h = 16;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function deltaArrow(current: number, prior: number, higherIsBad: boolean) {
  if (prior === 0 || current === 0) return { arrow: "·", tone: "neutral" as const };
  const delta = (current - prior) / prior;
  if (Math.abs(delta) < 0.05) return { arrow: "·", tone: "neutral" as const };
  const rising = delta > 0;
  const bad = higherIsBad ? rising : !rising;
  return { arrow: rising ? "↗" : "↘", tone: (bad ? "bad" : "good") as "bad" | "good" };
}

function AccountSignal({
  label,
  value,
  prior,
  higherIsBad,
  helper,
}: {
  label: string;
  value: string;
  prior?: string;
  higherIsBad?: boolean;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wider font-semibold text-neutral-500">{label}</p>
      <p
        className="mt-2 text-3xl font-bold tabular-nums text-neutral-900 leading-none"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>
      {prior !== undefined && higherIsBad !== undefined && (
        <PriorDelta value={value} prior={prior} higherIsBad={higherIsBad} />
      )}
      {helper && <p className="text-xs text-neutral-500 mt-1.5">{helper}</p>}
    </div>
  );
}

function PriorDelta({ value, prior, higherIsBad }: { value: string; prior: string; higherIsBad: boolean }) {
  const num = parseFloat(value);
  const priorNum = parseFloat(prior);
  if (isNaN(num) || isNaN(priorNum) || priorNum === 0) {
    return <p className="text-xs text-neutral-500 mt-1.5">var {prior}</p>;
  }
  const { arrow, tone } = deltaArrow(num, priorNum, higherIsBad);
  const toneClass =
    tone === "bad" ? "text-rose-700" : tone === "good" ? "text-emerald-700" : "text-neutral-500";
  return (
    <p className="text-xs text-neutral-500 mt-1.5">
      <span className={clsx(toneClass, "font-medium mr-1")}>{arrow}</span>
      var {prior} (4 uker før)
    </p>
  );
}

function StatusPill({ status }: { status: FatigueStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[11px] font-bold border",
        s.pillClass
      )}
      title={s.description}
    >
      {s.label}
    </span>
  );
}

function TofPill() {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 h-6 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
        TOF_PILL
      )}
      title="Lav CPMr — finner nye folk billig"
    >
      TOF
    </span>
  );
}

function TrendInline({ value, higherIsBad, label }: { value: number; higherIsBad: boolean; label: string }) {
  if (Math.abs(value) < 0.05) {
    return <span className="text-neutral-400">{label}: ·</span>;
  }
  const rising = value > 0;
  const bad = higherIsBad ? rising : !rising;
  const tone = bad ? "text-rose-700" : "text-emerald-700";
  const arrow = rising ? "↗" : "↘";
  const pct = Math.abs(value * 100).toFixed(0);
  return (
    <span className={clsx(tone, "tabular-nums")} style={{ fontFamily: "var(--font-mono)" }}>
      {label}: {arrow} {pct}%
    </span>
  );
}

export default function FatigueGauge({ data }: Props) {
  const { account, ads } = data;

  const counts = ads.reduce(
    (c, ad) => ({ ...c, [ad.status]: (c[ad.status] ?? 0) + 1 }),
    {} as Record<FatigueStatus, number>
  );
  const tofCount = ads.filter((a) => a.isTof).length;

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-neutral-900">Helse i kontoen</h2>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
          Treffer vi de samme menneskene? Hvor lenge siden vi lanserte? Hvilke annonser bærer kontoen — og finnes
          det noen som finner nye folk billig?
        </p>
      </header>

      {/* Account-level signals */}
      <div className="grid grid-cols-3 gap-4">
        <AccountSignal
          label="Frekvens (siste 4 uker)"
          value={fmtFreq(account.frequencyRecent)}
          prior={fmtFreq(account.frequencyPrior)}
          higherIsBad
          helper="Stigende = treffer samme folk for ofte"
        />
        <AccountSignal
          label="% Net new reach"
          value={fmtPct(account.netNewPctRecent / 100)}
          prior={fmtPct(account.netNewPctPrior / 100)}
          higherIsBad={false}
          helper="Andelen ukentlig rekkevidde som er nye mennesker"
        />
        <AccountSignal
          label="Dager siden siste lansering"
          value={account.daysSinceLastLaunch !== null ? `${account.daysSinceLastLaunch}` : "—"}
          helper={
            account.lastLaunchDate
              ? `${account.lastLaunchAdCount} annonser ${account.lastLaunchDate}`
              : "Ingen lansering med ≥5 ads i siste 120 dager"
          }
        />
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {(["a", "b", "c", "new", "dead"] as FatigueStatus[]).map((s) => {
          const count = counts[s] ?? 0;
          if (count === 0) return null;
          const style = STATUS_STYLES[s];
          return (
            <div key={s} className="flex items-center gap-2">
              <StatusPill status={s} />
              <span className="text-neutral-600">
                <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                  {count}
                </span>{" "}
                <span className="text-neutral-500">— {style.description.toLowerCase()}</span>
              </span>
            </div>
          );
        })}
        {tofCount > 0 && (
          <div className="flex items-center gap-2">
            <TofPill />
            <span className="text-neutral-600">
              <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {tofCount}
              </span>{" "}
              <span className="text-neutral-500">— lav CPMr, finner nye folk billig</span>
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Viser ads med ≥{Math.round(account.spendThreshold).toLocaleString("no-NO")} kr spend siste 4 uker. Mindre
        spend = ikke nok signal til å tolke.
      </p>

      {/* Per-ad table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {ads.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-neutral-500">
            Ingen annonser møter spend-terskelen siste 4 uker.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase tracking-wider text-neutral-500">
                <th className="text-left font-semibold py-2.5 px-4">Annonse</th>
                <th className="text-right font-semibold py-2.5 px-3" style={{ minWidth: 80 }}>
                  Spend
                </th>
                <th className="text-left font-semibold py-2.5 px-3" style={{ minWidth: 150 }}>
                  Spend-andel
                </th>
                <th className="text-left font-semibold py-2.5 px-3" style={{ minWidth: 150 }}>
                  CPM
                </th>
                <th className="text-right font-semibold py-2.5 px-3" style={{ minWidth: 70 }}>
                  CPMr
                </th>
                <th className="text-left font-semibold py-2.5 px-4" style={{ minWidth: 120 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {ads.map((ad) => (
                <FatigueRow key={ad.adId} ad={ad} cpmrP33={account.cpmrP33} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function FatigueRow({ ad, cpmrP33 }: { ad: FatigueAdRow; cpmrP33: number }) {
  const cpmrRelative = cpmrP33 > 0 ? ad.cpmr / cpmrP33 - 1 : 0;
  return (
    <tr className="hover:bg-neutral-50/40 transition-colors align-top">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
            {ad.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-neutral-800 font-medium" title={ad.adName}>
              {ad.adName}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Lansert {fmtDaysAgo(ad.daysSinceCreated)}
            </div>
          </div>
        </div>
      </td>
      <td
        className="py-2.5 px-3 text-right tabular-nums font-semibold text-neutral-800"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {fmtSpend(ad.totalSpend)}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <Sparkline values={ad.spendShareSpark} color="#525252" />
          <div className="leading-tight min-w-0">
            <div className="tabular-nums text-neutral-800" style={{ fontFamily: "var(--font-mono)" }}>
              {fmtPct(ad.avgSpendShare, 1)}
            </div>
            <div className="text-[10px] text-neutral-500 flex flex-wrap gap-x-2">
              <TrendInline value={ad.spendShareTrend4w} higherIsBad={false} label="4u" />
              <TrendInline value={ad.spendShareTrend1w} higherIsBad={false} label="1u" />
            </div>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <Sparkline values={ad.cpmSpark} color="#525252" />
          <div className="leading-tight min-w-0">
            <div className="tabular-nums text-neutral-800" style={{ fontFamily: "var(--font-mono)" }}>
              {fmtCpm(ad.avgCpm)}
            </div>
            <div className="text-[10px] text-neutral-500 flex flex-wrap gap-x-2">
              <TrendInline value={ad.cpmTrend4w} higherIsBad={true} label="4u" />
              <TrendInline value={ad.cpmTrend1w} higherIsBad={true} label="1u" />
            </div>
          </div>
        </div>
      </td>
      <td
        className="py-2.5 px-3 text-right tabular-nums text-neutral-800"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {ad.cpmr > 0 ? fmtCpm(ad.cpmr) : "—"}
        {cpmrP33 > 0 && ad.cpmr > 0 && (
          <div className="text-[10px] text-neutral-500">
            {cpmrRelative >= 0 ? "+" : ""}
            {Math.round(cpmrRelative * 100)}%
          </div>
        )}
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-1.5">
          <StatusPill status={ad.status} />
          {ad.isTof && <TofPill />}
        </div>
      </td>
    </tr>
  );
}
