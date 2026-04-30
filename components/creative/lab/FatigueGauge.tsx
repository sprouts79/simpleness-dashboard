"use client";

import { FatigueData, FatigueAdRow, FatigueStatus } from "@/lib/types";
import clsx from "clsx";

interface Props {
  data: FatigueData;
}

// Status palette — text-as-interface, no flat fill colors. Just semantic tone.
const STATUS_STYLES: Record<FatigueStatus, { label: string; textClass: string; bgClass: string; description: string }> = {
  tired: {
    label: "Sliten",
    textClass: "text-rose-900",
    bgClass: "bg-rose-50 border-rose-200",
    description: "Spend-andel faller eller CPM stiger",
  },
  holder: {
    label: "Holder",
    textClass: "text-neutral-700",
    bgClass: "bg-neutral-100 border-neutral-200",
    description: "Stabil andel og stabil CPM",
  },
  tof: {
    label: "TOF-gull",
    textClass: "text-amber-900",
    bgClass: "bg-amber-50 border-amber-200",
    description: "Lav CPM med vedvarende eller voksende spend",
  },
  new: {
    label: "Ny",
    textClass: "text-sky-900",
    bgClass: "bg-sky-50 border-sky-200",
    description: "Lansert nylig — for tidlig å bedømme",
  },
};

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

function deltaArrow(current: number, prior: number, higherIsBad: boolean): { arrow: string; tone: "good" | "bad" | "neutral" } {
  if (prior === 0 || current === 0) return { arrow: "·", tone: "neutral" };
  const delta = (current - prior) / prior;
  if (Math.abs(delta) < 0.05) return { arrow: "·", tone: "neutral" };
  const rising = delta > 0;
  const bad = higherIsBad ? rising : !rising;
  return {
    arrow: rising ? "↗" : "↘",
    tone: bad ? "bad" : "good",
  };
}

function Sparkline({ values, color = "#525252" }: { values: number[]; color?: string }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 60;
  const h = 18;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle">
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

function AccountSignal({
  label,
  value,
  prior,
  helper,
  higherIsBad,
}: {
  label: string;
  value: string;
  prior?: string;
  helper?: string;
  higherIsBad?: boolean;
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
      {prior && higherIsBad !== undefined && (
        <PriorComparison value={value} prior={prior} higherIsBad={higherIsBad} />
      )}
      {helper && <p className="text-xs text-neutral-500 mt-1.5">{helper}</p>}
    </div>
  );
}

function PriorComparison({ value, prior, higherIsBad }: { value: string; prior: string; higherIsBad: boolean }) {
  const num = parseFloat(value);
  const priorNum = parseFloat(prior);
  if (isNaN(num) || isNaN(priorNum) || priorNum === 0) {
    return <p className="text-xs text-neutral-500 mt-1.5">var {prior}</p>;
  }
  const { arrow, tone } = deltaArrow(num, priorNum, higherIsBad);
  const toneClass = tone === "bad" ? "text-rose-700" : tone === "good" ? "text-emerald-700" : "text-neutral-500";
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
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
        s.bgClass,
        s.textClass
      )}
    >
      {s.label}
    </span>
  );
}

function TrendCell({ value, higherIsBad }: { value: number; higherIsBad: boolean }) {
  if (Math.abs(value) < 0.05) {
    return <span className="text-neutral-500">·</span>;
  }
  const rising = value > 0;
  const bad = higherIsBad ? rising : !rising;
  const tone = bad ? "text-rose-700" : "text-emerald-700";
  const arrow = rising ? "↗" : "↘";
  const pct = Math.abs(value * 100).toFixed(0);
  return (
    <span className={clsx(tone, "tabular-nums font-medium")} style={{ fontFamily: "var(--font-mono)" }}>
      {arrow} {pct}%
    </span>
  );
}

export default function FatigueGauge({ data }: Props) {
  const { account, ads } = data;

  const counts = ads.reduce(
    (c, ad) => ({ ...c, [ad.status]: (c[ad.status] ?? 0) + 1 }),
    {} as Record<FatigueStatus, number>
  );

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-neutral-900">Slitenhet</h2>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
          Er det på tide med nye annonser? Tre kontosignaler øverst, deretter aktive annonser klassifisert
          etter spend-andel og CPM-trend.
        </p>
      </header>

      {/* Account-level signals */}
      <div className="grid grid-cols-3 gap-4">
        <AccountSignal
          label="Frekvens (siste 4 uker)"
          value={fmtFreq(account.frequencyRecent)}
          prior={fmtFreq(account.frequencyPrior)}
          higherIsBad
          helper="Stigende = metning bygger seg opp"
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
              : "Ingen lansering med ≥5 ads i vinduet"
          }
        />
      </div>

      {/* Status summary strip */}
      <div className="flex flex-wrap gap-3 text-sm">
        {(["tired", "holder", "tof", "new"] as FatigueStatus[]).map((s) => {
          const style = STATUS_STYLES[s];
          const count = counts[s] ?? 0;
          if (count === 0) return null;
          return (
            <div key={s} className="flex items-baseline gap-2">
              <StatusPill status={s} />
              <span className="text-neutral-600">
                <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                  {count}
                </span>{" "}
                — {style.description.toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-ad table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {ads.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-neutral-500">
            Ingen aktive annonser med spend siste 4 uker.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase tracking-wider text-neutral-500">
                <th className="text-left font-semibold py-2 px-4">Annonse</th>
                <th className="text-right font-semibold py-2 px-3" style={{ minWidth: 100 }}>
                  Spend (4u)
                </th>
                <th className="text-left font-semibold py-2 px-3" style={{ minWidth: 130 }}>
                  Spend-andel
                </th>
                <th className="text-left font-semibold py-2 px-3" style={{ minWidth: 130 }}>
                  CPM
                </th>
                <th className="text-left font-semibold py-2 px-4" style={{ minWidth: 110 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {ads.map((ad) => (
                <FatigueRow key={ad.adId} ad={ad} accountMedianCpm={account.accountMedianCpm} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function FatigueRow({ ad, accountMedianCpm }: { ad: FatigueAdRow; accountMedianCpm: number }) {
  const cpmRelative = accountMedianCpm > 0 ? ad.avgCpm / accountMedianCpm - 1 : 0;
  return (
    <tr className="hover:bg-neutral-50/40 transition-colors">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
            {ad.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <span className="truncate text-neutral-800" title={ad.adName}>
            {ad.adName}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-neutral-800" style={{ fontFamily: "var(--font-mono)" }}>
        {fmtSpend(ad.totalSpend)}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <Sparkline values={ad.spendShareSpark} color="#525252" />
          <div className="leading-tight">
            <div className="tabular-nums text-neutral-800" style={{ fontFamily: "var(--font-mono)" }}>
              {fmtPct(ad.avgSpendShare, 1)}
            </div>
            <div className="text-[11px]">
              <TrendCell value={ad.spendShareTrend} higherIsBad={false} />
            </div>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <Sparkline values={ad.cpmSpark} color="#525252" />
          <div className="leading-tight">
            <div className="tabular-nums text-neutral-800" style={{ fontFamily: "var(--font-mono)" }}>
              {fmtCpm(ad.avgCpm)}
              {accountMedianCpm > 0 && (
                <span className="text-[11px] text-neutral-500 ml-1.5">
                  ({cpmRelative >= 0 ? "+" : ""}
                  {Math.round(cpmRelative * 100)}%)
                </span>
              )}
            </div>
            <div className="text-[11px]">
              <TrendCell value={ad.cpmTrend} higherIsBad={true} />
            </div>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-4">
        <StatusPill status={ad.status} />
      </td>
    </tr>
  );
}
