"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

// Enhetsøkonomi for *nye abonnementer* — første-årsperspektiv, ingen churn.
// Antar uniform omsetning per kjøp (kohort-modellering kommer senere).
const INITIAL = {
  omsetningPerKjop: 800,
  varekostPct: 0.69,
  frakt: 0, // samlet plukk+pakk+frakt per leveranse
  transPct: 0,
  returerPct: 0,
  mktSpend: 14_434_560,
  mktProduksjon: 3_207_680,
  nyeAbonnementer: 13_000,
};

type State = typeof INITIAL;

function fmtNok(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "–";
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")} M`;
    if (Math.abs(n) >= 1_000)     return `${Math.round(n / 1_000).toLocaleString("nb-NO")} k`;
  }
  return Math.round(n).toLocaleString("nb-NO");
}
function fmtPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

function calc(s: State) {
  // Avledede omsetningstall per kunde. Uniform = ingen churn-modellering her.
  const arpu1  = s.omsetningPerKjop;
  const arpu6  = 6  * s.omsetningPerKjop;
  const arpu12 = 12 * s.omsetningPerKjop;

  // Total ettårs-omsetning fra ny-kohorten — brukes som denominator for
  // kvadranter og aMER, men er IKKE et salgsmål (totalsalg inkluderer eksisterende).
  const nyeOmsAr = s.nyeAbonnementer * arpu12;

  // Variabel salgskostnad per kjøp = varekost + frakt + gebyr + returer
  const varekostKjop = s.omsetningPerKjop * s.varekostPct;
  const levPerKjop   = s.frakt + s.omsetningPerKjop * (s.transPct + s.returerPct);
  const varKostKjop  = varekostKjop + levPerKjop;

  // DB1 per kunde = inntekt − alle variable salgskostnader (Jonas' LTV-definisjon)
  const db1_1  = arpu1  - 1  * varKostKjop;
  const db1_6  = arpu6  - 6  * varKostKjop;
  const db1_12 = arpu12 - 12 * varKostKjop;

  // CAC + Full CAC
  const cac     = s.nyeAbonnementer > 0 ? s.mktSpend / s.nyeAbonnementer : 0;
  const fullCac = s.nyeAbonnementer > 0 ? (s.mktSpend + s.mktProduksjon) / s.nyeAbonnementer : 0;

  // DB2 per kunde = DB1 − Full CAC (engangs ved akkvisisjon)
  const db2_1  = db1_1  - fullCac;
  const db2_6  = db1_6  - fullCac;
  const db2_12 = db1_12 - fullCac;

  // LTV-ratioer (mot CAC og Full CAC)
  const ltv1Cac      = cac > 0     ? db1_1  / cac     : 0;
  const ltv6Cac      = cac > 0     ? db1_6  / cac     : 0;
  const ltv12Cac     = cac > 0     ? db1_12 / cac     : 0;
  const ltv1FullCac  = fullCac > 0 ? db1_1  / fullCac : 0;
  const ltv6FullCac  = fullCac > 0 ? db1_6  / fullCac : 0;
  const ltv12FullCac = fullCac > 0 ? db1_12 / fullCac : 0;

  // aMER = advertising MER (kun mediekjøp, uten produksjonskostnader)
  const aMer = s.mktSpend > 0 ? nyeOmsAr / s.mktSpend : 0;

  // Kvadranter på første-års basis for nye (4 stk, 12 kjøp)
  const leveranser = s.nyeAbonnementer * 12;
  const fraktTotal = leveranser * s.frakt
                   + nyeOmsAr * (s.transPct + s.returerPct);
  const varekostQ  = s.varekostPct;
  const fraktQ     = nyeOmsAr > 0 ? fraktTotal / nyeOmsAr : 0;
  const marketingQ = nyeOmsAr > 0 ? (s.mktSpend + s.mktProduksjon) / nyeOmsAr : 0;
  const dbQ        = 1 - varekostQ - fraktQ - marketingQ;

  return {
    arpu1, arpu6, arpu12,
    nyeOmsAr,
    db1_1, db1_6, db1_12,
    db2_1, db2_6, db2_12,
    cac, fullCac,
    ltv1Cac, ltv6Cac, ltv12Cac,
    ltv1FullCac, ltv6FullCac, ltv12FullCac,
    aMer,
    varekostQ, fraktQ, marketingQ, dbQ,
  };
}

type CostMode = "pct" | "kr";
type CacMode = "cac" | "full";

export default function AbonnementCalc() {
  const [s, setS] = useState<State>(INITIAL);
  const [costMode, setCostMode] = useState<CostMode>("pct");
  const [cacMode, setCacMode] = useState<CacMode>("cac");
  const k = useMemo(() => calc(s), [s]);

  const setField = <K extends keyof State>(key: K, value: State[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
  };

  // Linket "omsetning per kjøp" — alle 3 inputs reflekterer samme verdi.
  // Editing X-kjøp → setter omsetningPerKjop = X-kjøpsverdi / X.
  const setOmsetningFromN = (n: number, value: number) => {
    if (n <= 0) return;
    setField("omsetningPerKjop", value / n);
  };

  // CAC editable: brukes i Nøkkeltall-toggle.
  // Edit CAC → mkt_spend = CAC × nye_abo (produksjon uendret).
  // Edit Full CAC → mkt_spend = Full CAC × nye_abo − produksjon.
  const setCacTarget = (newCac: number) => {
    setField("mktSpend", newCac * s.nyeAbonnementer);
  };
  const setFullCacTarget = (newFullCac: number) => {
    setField("mktSpend", Math.max(0, newFullCac * s.nyeAbonnementer - s.mktProduksjon));
  };

  return (
    <div className="space-y-10">
      {/* ---- Enhetsøkonomi nye abonnementer ---- */}
      <section>
        <header className="mb-3">
          <h2 className="section-title">Enhetsøkonomi — nye abonnementer</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Førsteårsperspektiv på en kohorten med nye abonnementer. Eksisterende kunder og churn er ikke med.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* INPUTS */}
          <div className="lg:col-span-7 rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Omsetning per kunde</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Første kjøp" suffix="kr" value={k.arpu1}  onChange={(v) => setOmsetningFromN(1,  v)} />
              <Field label="6 mndr"      suffix="kr" value={k.arpu6}  onChange={(v) => setOmsetningFromN(6,  v)} />
              <Field label="12 mndr"     suffix="kr" value={k.arpu12} onChange={(v) => setOmsetningFromN(12, v)} />
            </div>

            <div className="flex items-center justify-between mt-6 mb-3">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Kostnader per leveranse</p>
              <UnitToggle mode={costMode} onChange={setCostMode} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {costMode === "pct" ? (
                <>
                  <Field label="Varekost" suffix="%" decimals={0} value={s.varekostPct * 100} onChange={(v) => setField("varekostPct", v / 100)} />
                  <Field label="Frakt (plukk + pakk + frakt)" suffix="%" decimals={1}
                    value={s.omsetningPerKjop > 0 ? (s.frakt / s.omsetningPerKjop) * 100 : 0}
                    onChange={(v) => setField("frakt", (v / 100) * s.omsetningPerKjop)} />
                  <Field label="Transaksjonsgebyr" suffix="%" decimals={1} value={s.transPct * 100} onChange={(v) => setField("transPct", v / 100)} />
                  <Field label="Returer" suffix="%" decimals={1} value={s.returerPct * 100} onChange={(v) => setField("returerPct", v / 100)} />
                </>
              ) : (
                <>
                  <Field label="Varekost" suffix="kr" value={s.omsetningPerKjop * s.varekostPct}
                    onChange={(v) => setField("varekostPct", s.omsetningPerKjop > 0 ? v / s.omsetningPerKjop : 0)} />
                  <Field label="Frakt (plukk + pakk + frakt)" suffix="kr" value={s.frakt} onChange={(v) => setField("frakt", v)} />
                  <Field label="Transaksjonsgebyr" suffix="kr" decimals={1} value={s.omsetningPerKjop * s.transPct}
                    onChange={(v) => setField("transPct", s.omsetningPerKjop > 0 ? v / s.omsetningPerKjop : 0)} />
                  <Field label="Returer" suffix="kr" decimals={1} value={s.omsetningPerKjop * s.returerPct}
                    onChange={(v) => setField("returerPct", s.omsetningPerKjop > 0 ? v / s.omsetningPerKjop : 0)} />
                </>
              )}
            </div>

            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-6 mb-3">Marketing</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Mkt-spend årlig" suffix="kr" value={s.mktSpend} onChange={(v) => setField("mktSpend", v)} large />
              <Field label="Mkt-produksjon årlig" suffix="kr" value={s.mktProduksjon} onChange={(v) => setField("mktProduksjon", v)} large />
              <Field label="Antall nye abonnementer" suffix="/år" value={s.nyeAbonnementer} onChange={(v) => setField("nyeAbonnementer", v)} large />
            </div>

            {/* DB per kunde — kompakt tabell, samme kort */}
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-6 mb-3">DB per kunde</p>
            <div className="rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr className="text-xs text-neutral-500">
                    <th className="text-left px-3 py-1.5 font-medium"></th>
                    <th className="text-right px-3 py-1.5 font-medium">DB1</th>
                    <th className="text-right px-3 py-1.5 font-medium">DB2</th>
                  </tr>
                </thead>
                <tbody>
                  <DbRow label="Første kjøp" db1={k.db1_1}  db2={k.db2_1} />
                  <DbRow label="6 mndr"      db1={k.db1_6}  db2={k.db2_6} />
                  <DbRow label="12 mndr"     db1={k.db1_12} db2={k.db2_12} />
                </tbody>
              </table>
            </div>
          </div>

          {/* HØYRE KOLONNE: Nøkkeltall + Kundeverdi */}
          <div className="lg:col-span-5 space-y-6 self-start">
            {/* Nøkkeltall */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Nøkkeltall</p>
                <CacToggle mode={cacMode} onChange={setCacMode} />
              </div>

              {/* CAC target — editable, basert på cacMode */}
              <KpiEditable
                label={cacMode === "cac" ? "CAC target" : "Full CAC target"}
                value={cacMode === "cac" ? k.cac : k.fullCac}
                suffix="kr"
                hint={cacMode === "cac"
                  ? "mkt-spend / nye kunder"
                  : "inkl. produksjonskostnader"}
                onChange={(v) => cacMode === "cac" ? setCacTarget(v) : setFullCacTarget(v)}
              />

              {/* aMER */}
              <Kpi label="Target aMER" value={k.aMer.toFixed(1)} hint="årlig nye-omsetning / mkt-spend" />
            </div>

            {/* Kundeverdi */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kundeverdi</p>

              {(() => {
                const ltv1  = cacMode === "cac" ? k.ltv1Cac  : k.ltv1FullCac;
                const ltv6  = cacMode === "cac" ? k.ltv6Cac  : k.ltv6FullCac;
                const ltv12 = cacMode === "cac" ? k.ltv12Cac : k.ltv12FullCac;
                const cacLabel = cacMode === "cac" ? "CAC" : "Full CAC";
                // Terskler proporsjonalt med 6 og 12 mndr (1 mnd = 1/6 av 6 mnd)
                return (
                  <div className="grid grid-cols-3 gap-2">
                    <Kpi
                      label={`Første kjøp : ${cacLabel}`}
                      value={ltv1.toFixed(2)}
                      hint={ltv1 >= 0.30 ? "≥ 0.30 — i rute" : ltv1 >= 0.15 ? "0.15–0.30 — borderline" : "< 0.15 — uholdbart"}
                      highlight={ltv1 >= 0.30}
                      warning={ltv1 >= 0.15 && ltv1 < 0.30}
                      negative={ltv1 < 0.15}
                    />
                    <Kpi
                      label={`6 mndr : ${cacLabel}`}
                      value={ltv6.toFixed(2)}
                      hint={ltv6 >= 1 ? "≥ 1.0 — break even" : ltv6 >= 0.5 ? "0.5–1.0 — under break-even" : "< 0.5 — uholdbart"}
                      highlight={ltv6 >= 1}
                      warning={ltv6 >= 0.5 && ltv6 < 1}
                      negative={ltv6 < 0.5}
                    />
                    <Kpi
                      label={`12 mndr : ${cacLabel}`}
                      value={ltv12.toFixed(2)}
                      hint={ltv12 >= 2 ? "≥ 2.0 — sunt" : ltv12 >= 1 ? "1.0–2.0 — middels" : "< 1.0 — uholdbart"}
                      highlight={ltv12 >= 2}
                      warning={ltv12 >= 1 && ltv12 < 2}
                      negative={ltv12 < 1}
                    />
                  </div>
                );
              })()}

              <p className="text-[11px] text-neutral-500 leading-snug pt-1">
                <span className="font-medium text-neutral-700">LTV</span> = DB1 = inntekt − alle variable salgskostnader.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Kvadranter (4 stk per Jonas' regel) ---- */}
      <section>
        <header className="mb-3">
          <h2 className="section-title">Kvadranter — nye abonnementer 12 mndr</h2>
          <p className="text-xs text-neutral-500 mt-1">Hvor 100 kr fra en ny abonnent blir av i løpet av første år. Dekningsbidrag er det som er igjen til OPEX og fortjeneste.</p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Quadrant label="Varekost"      pct={k.varekostQ} />
          <Quadrant label="Frakt"         pct={k.fraktQ}    hint="plukk + pakk + frakt + gebyr + returer" />
          <Quadrant label="Marketing"     pct={k.marketingQ} hint="spend + produksjon" />
          <Quadrant label="Dekningsbidrag" pct={k.dbQ}      good />
        </div>
      </section>

      <div className="text-xs text-neutral-500 max-w-2xl">
        Prototype — ingen lagring. Førsteårsperspektiv på nye kunder, uniform omsetning per kjøp. Sesongfordeling og kanalmiks ligger på Budsjetter-siden.
      </div>
    </div>
  );
}

// -------- Sub-komponenter --------

function Field({
  label, suffix, value, onChange, decimals = 0, large = false, className,
}: {
  label: string; suffix?: string; value: number; onChange: (v: number) => void;
  decimals?: number; large?: boolean; className?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const display = text !== null ? text : value.toLocaleString("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
      <div className={clsx(
        "flex items-center rounded-lg border bg-[#fff8e1] border-[#f0d57a]/50 focus-within:border-neutral-900 transition-colors",
        large ? "h-10" : "h-9"
      )}>
        <input
          type="text" inputMode="decimal" value={display}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const cleaned = (text ?? "").replace(/\s/g, "").replace(",", ".");
            const n = parseFloat(cleaned);
            if (Number.isFinite(n)) onChange(n);
            setText(null);
          }}
          className="flex-1 bg-transparent px-3 text-sm text-neutral-900 font-medium tabular-nums focus:outline-none"
          style={{ fontFamily: "var(--font-mono)" }}
        />
        {suffix && <span className="px-2.5 text-xs text-neutral-500">{suffix}</span>}
      </div>
    </div>
  );
}

function Kpi({
  label, value, hint, highlight = false, warning = false, negative = false,
}: {
  label: string; value: string; hint?: string; highlight?: boolean; warning?: boolean; negative?: boolean;
}) {
  return (
    <div className={clsx(
      "rounded-xl border bg-white p-3.5",
      highlight && "border-[#41bd0e]/40 bg-[#dff7cc]/20",
      warning  && "border-amber-200 bg-amber-50/30",
      negative && "border-red-200 bg-red-50/30",
      !highlight && !warning && !negative && "border-neutral-200",
    )}>
      <p className="text-xs text-neutral-600">{label}</p>
      <p className={clsx(
        "text-xl font-bold tabular-nums leading-none mt-1.5",
        negative ? "text-red-600" : warning ? "text-amber-700" : "text-neutral-900"
      )} style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
      {hint && <p className="text-[11px] text-neutral-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function DbRow({ label, db1, db2 }: { label: string; db1: number; db2: number }) {
  return (
    <tr className="border-t border-neutral-100">
      <td className="px-3 py-2 text-neutral-700">{label}</td>
      <td className="px-3 py-2 text-right tabular-nums font-medium text-neutral-900" style={{ fontFamily: "var(--font-mono)" }}>
        {fmtNok(db1)} kr
      </td>
      <td className={clsx(
        "px-3 py-2 text-right tabular-nums font-medium",
        db2 < 0 ? "text-red-600" : "text-neutral-900"
      )} style={{ fontFamily: "var(--font-mono)" }}>
        {db2 < 0 ? "−" : ""}{fmtNok(Math.abs(db2))} kr
      </td>
    </tr>
  );
}

function Quadrant({ label, pct, hint, good = false }: { label: string; pct: number; hint?: string; good?: boolean }) {
  return (
    <div className={clsx(
      "rounded-xl border bg-white p-4",
      good ? "border-[#41bd0e]/40 bg-[#dff7cc]/30" : "border-neutral-200"
    )}>
      <p className="section-title">{label}</p>
      <p className={clsx(
        "text-2xl font-bold tabular-nums leading-none mt-2",
        good ? "text-[#41bd0e]" : "text-neutral-900"
      )} style={{ fontFamily: "var(--font-mono)" }}>
        {fmtPct(pct, 0)}
      </p>
      {hint && <p className="text-xs text-neutral-500 mt-1.5">{hint}</p>}
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

function UnitToggle({ mode, onChange }: { mode: CostMode; onChange: (m: CostMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 rounded-md">
      {(["pct", "kr"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={clsx(
            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors tabular-nums",
            mode === m
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          {m === "pct" ? "%" : "kr"}
        </button>
      ))}
    </div>
  );
}

function CacToggle({ mode, onChange }: { mode: CacMode; onChange: (m: CacMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 rounded-md">
      {(["cac", "full"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={clsx(
            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
            mode === m
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          {m === "cac" ? "CAC" : "Full CAC"}
        </button>
      ))}
    </div>
  );
}

function KpiEditable({
  label, value, suffix, hint, onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const display = text !== null ? text : Math.round(value).toLocaleString("nb-NO");
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
      <p className="text-xs text-neutral-600">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={display}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const cleaned = (text ?? "").replace(/\s/g, "").replace(",", ".");
            const n = parseFloat(cleaned);
            if (Number.isFinite(n)) onChange(n);
            setText(null);
          }}
          className={clsx(
            "min-w-0 flex-1 text-xl font-bold tabular-nums leading-none bg-transparent text-neutral-900",
            "rounded border border-transparent hover:border-neutral-200 focus:border-neutral-900 focus:bg-[#fff8e1]/40 focus:outline-none px-1 -ml-1 transition-colors"
          )}
          style={{ fontFamily: "var(--font-mono)" }}
        />
        {suffix && <span className="text-sm text-neutral-500 flex-shrink-0">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-neutral-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function Th({ children, align = "right", w }: { children: React.ReactNode; align?: "left" | "right"; w?: string }) {
  return (
    <th className={clsx(
      align === "left" ? "text-left px-4" : "text-right px-3",
      "py-2.5 text-xs font-medium text-neutral-500",
      w
    )}>
      {children}
    </th>
  );
}
