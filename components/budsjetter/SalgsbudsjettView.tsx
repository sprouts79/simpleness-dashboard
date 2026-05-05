"use client";

import { useState } from "react";
import clsx from "clsx";

// --------------------------------------------------------------------------
// Hardkodet salgsbudsjett per kunde for prototype.
// På sikt: hentes fra Vekst (Enhetsøkonomi-input) — da blir det live.
// --------------------------------------------------------------------------

interface ClientBudgetConfig {
  kundetype: "abonnement" | "ecommerce";
  arligNye: number;          // Antall nye / år (abo) eller nye kunder (ecom)
  arligSpend: number;        // Mkt-spend årlig
  arligOmsetning: number;    // For abo: antall × ARPU 12mnd. For ecom: salgsmål.
  targetCac: number;
}

const CONFIG: Record<string, ClientBudgetConfig> = {
  kokkeloren: {
    kundetype: "abonnement",
    arligNye: 1500,
    arligSpend: 1_656_000,    // 138k × 12
    arligOmsetning: 12_000_000, // ~ 1500 × 8000 (kundeverdi 12mnd)
    targetCac: 1100,
  },
  myyk: {
    kundetype: "ecommerce",
    arligNye: 10_744,
    arligSpend: 4_158_000,
    arligOmsetning: 27_720_000,
    targetCac: 387,
  },
  farfar: {
    kundetype: "ecommerce",
    arligNye: 4_200,
    arligSpend: 2_400_000,
    arligOmsetning: 13_500_000,
    targetCac: 320,
  },
};

const MONTHS = ["Jan","Feb","Mar","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Des"];

// Sesong-default per kvartal. Flat 1/12 for nå.
const DEFAULT_SESONG = Array(12).fill(1 / 12);

function fmtNok(n: number): string {
  if (!Number.isFinite(n)) return "–";
  return Math.round(n).toLocaleString("nb-NO");
}
function fmtPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export default function SalgsbudsjettView({ clientId }: { clientId: string }) {
  const cfg = CONFIG[clientId];
  const [sesong, setSesong] = useState<number[]>(DEFAULT_SESONG);

  if (!cfg) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 max-w-2xl">
        <p className="text-sm text-neutral-600">
          Ingen budsjett-config for <span className="font-medium">{clientId}</span> ennå.
        </p>
      </div>
    );
  }

  const setSesongPct = (i: number, pct: number) => {
    setSesong((prev) => {
      const next = [...prev];
      next[i] = pct;
      return next;
    });
  };
  const setSesongAbs = (i: number, kr: number) => {
    if (cfg.arligOmsetning <= 0) return;
    setSesongPct(i, kr / cfg.arligOmsetning);
  };

  const sesongSum = sesong.reduce((a, b) => a + b, 0);
  const sesongDelta = sesongSum - 1;
  const isAbo = cfg.kundetype === "abonnement";

  return (
    <div className="space-y-6">
      {/* Topp-info */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Salgsbudsjett 2026 — fra Enhetsøkonomi
        </span>
        <Stat label={isAbo ? "Nye abo" : "Nye kunder"} value={fmtNok(cfg.arligNye)} />
        <Stat label="Mkt-spend" value={`${fmtNok(cfg.arligSpend)} kr`} />
        <Stat label="Omsetning" value={`${fmtNok(cfg.arligOmsetning)} kr`} />
        <Stat label="CAC target" value={`${fmtNok(cfg.targetCac)} kr`} />
      </div>

      {/* Sum-strip */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="section-title">Sesongfordeling</h2>
        <div className="text-right text-xs">
          <span className="text-neutral-500">Sum </span>
          <span
            className={clsx(
              "font-semibold tabular-nums",
              Math.abs(sesongDelta) < 0.005 ? "text-green-700" : "text-amber-700",
            )}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {fmtPct(sesongSum)}
            {Math.abs(sesongDelta) >= 0.005 && (
              <span className="text-neutral-400 font-normal ml-1">
                (diff {sesongDelta > 0 ? "+" : ""}{fmtPct(sesongDelta)})
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <Th align="left" w="w-14">Mnd</Th>
              <Th w="w-24">Sesong %</Th>
              <Th w="w-32">Omsetning</Th>
              <Th w="w-28">{isAbo ? "Nye abo" : "Nye kunder"}</Th>
              <Th w="w-32">Mkt-spend</Th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((m, i) => {
              const sp = sesong[i];
              const omsetning = sp * cfg.arligOmsetning;
              const nye       = sp * cfg.arligNye;
              const spend     = sp * cfg.arligSpend;
              return (
                <tr key={m} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-neutral-900">{m}</td>
                  <td className="px-3 py-2">
                    <CellNumber value={sp * 100} onChange={(v) => setSesongPct(i, v / 100)} decimals={1} suffix="%" />
                  </td>
                  <td className="px-3 py-2">
                    <CellNumber value={omsetning} onChange={(v) => setSesongAbs(i, v)} decimals={0} suffix="kr" />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-700" style={{ fontFamily: "var(--font-mono)" }}>
                    {fmtNok(nye)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-900 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                    {fmtNok(spend)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-neutral-50 border-t border-neutral-200">
            <tr>
              <td className="px-4 py-2.5 font-bold text-neutral-900">Sum</td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{fmtPct(sesongSum)}</td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {fmtNok(sesongSum * cfg.arligOmsetning)}
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {fmtNok(sesongSum * cfg.arligNye)}
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {fmtNok(sesongSum * cfg.arligSpend)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-neutral-500 max-w-2xl">
        Mkt-spend per måned er kolonnen som detaljeres i Mediebudsjett — hvor den brytes ned på kanal og kampanjetype.
      </p>
    </div>
  );
}

// ---- sub-komponenter ----

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span
        className="text-sm font-semibold tabular-nums text-neutral-900"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </span>
    </div>
  );
}

function CellNumber({
  value, onChange, decimals = 0, suffix,
}: {
  value: number; onChange: (v: number) => void; decimals?: number; suffix?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const display = text !== null ? text : value.toLocaleString("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div className="flex items-center justify-end gap-1 rounded border border-transparent hover:border-neutral-200 focus-within:border-neutral-900 focus-within:bg-[#fff8e1]/40 transition-colors px-1.5 py-1">
      <input
        type="text" inputMode="decimal" value={display}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const cleaned = (text ?? "").replace(/\s/g, "").replace(",", ".");
          const n = parseFloat(cleaned);
          if (Number.isFinite(n)) onChange(n);
          setText(null);
        }}
        className="w-full text-right bg-transparent text-sm tabular-nums focus:outline-none"
        style={{ fontFamily: "var(--font-mono)" }}
      />
      {suffix && <span className="text-[10px] text-neutral-400">{suffix}</span>}
    </div>
  );
}

function Th({ children, align = "right", w }: { children: React.ReactNode; align?: "left" | "right"; w?: string }) {
  return (
    <th className={clsx(
      align === "left" ? "text-left px-4" : "text-right px-3",
      "py-2.5 text-xs font-medium text-neutral-500",
      w,
    )}>
      {children}
    </th>
  );
}
