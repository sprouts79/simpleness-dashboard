"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

// Initialverdier fra MYYK-vekstdokument (april 2026).
// Frakt = samlet plukk + pakk + frakt + returkost per ordre.
// Salgsmål forutsettes netto etter returer — derfor ingen returer-input.
const INITIAL = {
  aov: 1290,                    // første ordre / snittkurv
  kundeverdi6Mnd: 1290,         // forventet inntekt per kunde over 6 mndr (default = AOV)
  kundeverdi12Mnd: 1290,        // forventet inntekt per kunde over 12 mndr
  varekostPct: 0.40,
  frakt: 130,
  transPct: 0.030,
  andelNye: 0.50,
  lastYear: 19_800_000,
  vekstmal: 0.40,
  arligSalgsmal: 27_720_000,
  mktSpend: 4_158_000,
  mktProduksjon: 0,
};

type State = typeof INITIAL;
type CostMode = "pct" | "kr";
type CacMode  = "cac" | "full";

function fmtNok(n: number): string {
  if (!Number.isFinite(n)) return "–";
  return Math.round(n).toLocaleString("nb-NO");
}
function fmtPct(n: number, decimals = 0): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

function calc(s: State) {
  const orders        = s.aov > 0 ? s.arligSalgsmal / s.aov : 0;
  const newCustomers  = orders * s.andelNye;

  // Variabel salgskostnad-andel per kr inntekt: varekost + transaksjon + frakt/AOV
  // (frakt skalerer per ordre; transaksjon og varekost skalerer per kr inntekt)
  const varKostAndel = s.aov > 0
    ? s.varekostPct + s.transPct + s.frakt / s.aov
    : 0;

  // DB1 — Jonas' LTV-definisjon = inntekt − alle variable salgskostnader
  const db1_1ord = s.aov           * (1 - varKostAndel);
  const db1_6mnd = s.kundeverdi6Mnd  * (1 - varKostAndel);
  const db1_12mnd = s.kundeverdi12Mnd * (1 - varKostAndel);

  // CAC + Full CAC (per ny kunde)
  const cac     = newCustomers > 0 ? s.mktSpend / newCustomers : 0;
  const fullCac = newCustomers > 0 ? (s.mktSpend + s.mktProduksjon) / newCustomers : 0;

  // Marketing per ordre (blended over alle ordrer)
  const mktTotal    = s.mktSpend + s.mktProduksjon;
  const mktPerOrdre = orders > 0 ? mktTotal / orders : 0;
  const marketingPct = s.arligSalgsmal > 0 ? mktTotal / s.arligSalgsmal : 0;

  // DB2 per kunde for hver tier = DB1 − marketing-andel
  const db2_1ord  = db1_1ord  - s.aov            * marketingPct;
  const db2_6mnd  = db1_6mnd  - s.kundeverdi6Mnd * marketingPct;
  const db2_12mnd = db1_12mnd - s.kundeverdi12Mnd * marketingPct;

  // MER + aMER per kostbase (CAC-modus = kun mediekjøp; Full CAC = inkl. produksjon)
  const nyeOmsAr = newCustomers * s.kundeverdi12Mnd;
  const merCac      = s.mktSpend > 0 ? s.arligSalgsmal / s.mktSpend : 0;
  const merFull     = mktTotal   > 0 ? s.arligSalgsmal / mktTotal   : 0;
  const aMerCac     = s.mktSpend > 0 ? nyeOmsAr        / s.mktSpend : 0;
  const aMerFull    = mktTotal   > 0 ? nyeOmsAr        / mktTotal   : 0;

  // LTV-ratioer mot CAC/Full CAC for 1 ordre, 6 mndr og 12 mndr kundeverdi
  const ltv1Cac      = cac > 0     ? db1_1ord  / cac     : 0;
  const ltv6Cac      = cac > 0     ? db1_6mnd  / cac     : 0;
  const ltv12Cac     = cac > 0     ? db1_12mnd / cac     : 0;
  const ltv1FullCac  = fullCac > 0 ? db1_1ord  / fullCac : 0;
  const ltv6FullCac  = fullCac > 0 ? db1_6mnd  / fullCac : 0;
  const ltv12FullCac = fullCac > 0 ? db1_12mnd / fullCac : 0;

  // Kvadranter — årlig (4 stk)
  const fraktTotalAr = orders * s.frakt + s.arligSalgsmal * s.transPct;
  const varekostQ  = s.varekostPct;
  const fraktQ     = s.arligSalgsmal > 0 ? fraktTotalAr / s.arligSalgsmal : 0;
  const marketingQ = s.arligSalgsmal > 0 ? mktTotal / s.arligSalgsmal     : 0;
  const dbQ        = 1 - varekostQ - fraktQ - marketingQ;

  return {
    orders, newCustomers, nyeOmsAr,
    db1_1ord, db1_6mnd, db1_12mnd,
    db2_1ord, db2_6mnd, db2_12mnd,
    cac, fullCac,
    merCac, merFull, aMerCac, aMerFull, mktPerOrdre,
    ltv1Cac, ltv6Cac, ltv12Cac,
    ltv1FullCac, ltv6FullCac, ltv12FullCac,
    varekostQ, fraktQ, marketingQ, dbQ,
  };
}

export default function EcommerceCalc() {
  const [s, setS] = useState<State>(INITIAL);
  const [costMode, setCostMode] = useState<CostMode>("pct");
  const [cacMode, setCacMode]   = useState<CacMode>("cac");
  const k = useMemo(() => calc(s), [s]);

  const setField = <K extends keyof State>(key: K, value: State[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
  };

  const recalcSalgsmalFromGrowth = () => {
    setField("arligSalgsmal", Math.round(s.lastYear * (1 + s.vekstmal)));
  };

  // CAC editable: edit → setter mkt_spend slik at CAC stemmer (andelNye + arligSalgsmal/aov låst).
  const setCacTarget = (newCac: number) => {
    setField("mktSpend", newCac * k.newCustomers);
  };
  const setFullCacTarget = (newFullCac: number) => {
    setField("mktSpend", Math.max(0, newFullCac * k.newCustomers - s.mktProduksjon));
  };

  return (
    <div className="space-y-10">
      {/* ---- Enhetsøkonomi ---- */}
      <section>
        <header className="mb-3">
          <h2 className="section-title">Enhetsøkonomi</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Per-ordre-økonomi for nye og eksisterende kunder, blended.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* INPUTS */}
          <div className="lg:col-span-7 rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Omsetning per kunde</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Første ordre" suffix="kr" value={s.aov} onChange={(v) => setField("aov", v)} />
              <Field label="6 mndr"       suffix="kr" value={s.kundeverdi6Mnd} onChange={(v) => setField("kundeverdi6Mnd", v)} />
              <Field label="12 mndr"      suffix="kr" value={s.kundeverdi12Mnd} onChange={(v) => setField("kundeverdi12Mnd", v)} />
            </div>
            <div className="mt-4">
              <Field label="Andel nye kunder" suffix="%" decimals={0} value={s.andelNye * 100} onChange={(v) => setField("andelNye", v / 100)} />
            </div>

            <div className="flex items-center justify-between mt-6 mb-3">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Variable salgskostnader per ordre</p>
              <UnitToggle mode={costMode} onChange={setCostMode} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {costMode === "pct" ? (
                <>
                  <Field label="Varekost" suffix="%" decimals={0} value={s.varekostPct * 100} onChange={(v) => setField("varekostPct", v / 100)} />
                  <Field label="Frakt (plukk + pakk + frakt + retur)" suffix="%" decimals={1}
                    value={s.aov > 0 ? (s.frakt / s.aov) * 100 : 0}
                    onChange={(v) => setField("frakt", (v / 100) * s.aov)} />
                  <Field label="Transaksjonsgebyr" suffix="%" decimals={1} value={s.transPct * 100} onChange={(v) => setField("transPct", v / 100)} />
                </>
              ) : (
                <>
                  <Field label="Varekost" suffix="kr" value={s.aov * s.varekostPct}
                    onChange={(v) => setField("varekostPct", s.aov > 0 ? v / s.aov : 0)} />
                  <Field label="Frakt (plukk + pakk + frakt + retur)" suffix="kr" value={s.frakt} onChange={(v) => setField("frakt", v)} />
                  <Field label="Transaksjonsgebyr" suffix="kr" decimals={1} value={s.aov * s.transPct}
                    onChange={(v) => setField("transPct", s.aov > 0 ? v / s.aov : 0)} />
                </>
              )}
            </div>

            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-6 mb-3">Salgsmål</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Fjoråret" suffix="kr" value={s.lastYear} onChange={(v) => setField("lastYear", v)} large />
              <Field label="Vekstmål" suffix="%" decimals={0} value={s.vekstmal * 100} onChange={(v) => setField("vekstmal", v / 100)} />
              <div className="sm:col-span-2 flex items-end gap-3">
                <Field
                  label="Salgsmål"
                  suffix="kr"
                  value={s.arligSalgsmal}
                  onChange={(v) => setField("arligSalgsmal", v)}
                  large
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={recalcSalgsmalFromGrowth}
                  className="text-xs px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 whitespace-nowrap"
                >
                  ← Beregn fra fjoråret × vekstmål
                </button>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-6 mb-3">Marketing</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Mkt-spend årlig" suffix="kr" value={s.mktSpend} onChange={(v) => setField("mktSpend", v)} large />
              <Field label="Mkt-produksjon årlig" suffix="kr" value={s.mktProduksjon} onChange={(v) => setField("mktProduksjon", v)} large />
            </div>

            {/* DB-strip — DB1 og DB2 per kunde for hver tier */}
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-6 mb-3">DB per kunde</p>
            <div className="rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr className="text-xs text-neutral-500">
                    <th className="text-left  px-3 py-1.5 font-medium"></th>
                    <th className="text-right px-3 py-1.5 font-medium w-28">DB1</th>
                    <th className="text-right px-3 py-1.5 font-medium w-28">DB2</th>
                  </tr>
                </thead>
                <tbody>
                  <DbRow label="Første ordre" db1={k.db1_1ord}  db2={k.db2_1ord} />
                  <DbRow label="6 mndr"       db1={k.db1_6mnd}  db2={k.db2_6mnd} />
                  <DbRow label="12 mndr"      db1={k.db1_12mnd} db2={k.db2_12mnd} />
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-neutral-500 leading-snug mt-3">
              Salgsmål er etter returer. Fraktkost inkluderer returkost.
            </p>
          </div>

          {/* HØYRE KOLONNE: Nøkkeltall + Kundeverdi */}
          <div className="lg:col-span-5 space-y-6 self-start">
            {/* Nøkkeltall */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Nøkkeltall</p>
                <CacToggle mode={cacMode} onChange={setCacMode} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Kpi
                  label="Target MER"
                  value={(cacMode === "cac" ? k.merCac : k.merFull).toFixed(1)}
                  hint={cacMode === "cac" ? "total oms / mkt-spend" : "total oms / mkt total"}
                />
                <Kpi
                  label="Target aMER"
                  value={(cacMode === "cac" ? k.aMerCac : k.aMerFull).toFixed(1)}
                  hint={cacMode === "cac" ? "oms fra nye / mkt-spend" : "oms fra nye / mkt total"}
                />
              </div>

              <KpiEditable
                label={cacMode === "cac" ? "CAC target" : "Full CAC target"}
                value={cacMode === "cac" ? k.cac : k.fullCac}
                suffix="kr"
                hint={cacMode === "cac"
                  ? "mkt-spend / nye kunder"
                  : "inkl. produksjonskostnader"}
                onChange={(v) => cacMode === "cac" ? setCacTarget(v) : setFullCacTarget(v)}
              />

              <Kpi label="Antall nye kunder" value={fmtNok(k.newCustomers)} hint={`${fmtNok(k.orders)} ordrer × ${fmtPct(s.andelNye, 0)} nye`} />
            </div>

            {/* Kundeverdi */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Kundeverdi</p>

              {(() => {
                const ltv1  = cacMode === "cac" ? k.ltv1Cac  : k.ltv1FullCac;
                const ltv6  = cacMode === "cac" ? k.ltv6Cac  : k.ltv6FullCac;
                const ltv12 = cacMode === "cac" ? k.ltv12Cac : k.ltv12FullCac;
                const cacLabel = cacMode === "cac" ? "CAC" : "Full CAC";
                return (
                  <div className="grid grid-cols-3 gap-2">
                    <Kpi
                      label={`Første kjøp : ${cacLabel}`}
                      value={ltv1.toFixed(2)}
                      hint={ltv1 >= 1 ? "≥ 1.0 — break even" : "< 1.0 — uholdbart"}
                      highlight={ltv1 >= 1}
                      negative={ltv1 < 1}
                    />
                    <Kpi
                      label={`6 mndr : ${cacLabel}`}
                      value={ltv6.toFixed(2)}
                      hint={ltv6 >= 1.2 ? "≥ 1.2 — sunt" : ltv6 >= 1 ? "1.0–1.2 — borderline" : "< 1.0 — uholdbart"}
                      highlight={ltv6 >= 1.2}
                      warning={ltv6 >= 1 && ltv6 < 1.2}
                      negative={ltv6 < 1}
                    />
                    <Kpi
                      label={`12 mndr : ${cacLabel}`}
                      value={ltv12.toFixed(2)}
                      hint={ltv12 >= 2 ? "≥ 2.0 — sunt" : ltv12 >= 1.5 ? "1.5–2.0 — borderline" : "< 1.5 — uholdbart"}
                      highlight={ltv12 >= 2}
                      warning={ltv12 >= 1.5 && ltv12 < 2}
                      negative={ltv12 < 1.5}
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

      {/* ---- Kvadranter (4 stk, året totalt) ---- */}
      <section>
        <header className="mb-3">
          <h2 className="section-title">Kvadranter — året totalt</h2>
          <p className="text-xs text-neutral-500 mt-1">Hvor 100 kr omsetning blir av i løpet av året. Dekningsbidrag er det som er igjen til OPEX og fortjeneste.</p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Quadrant label="Varekost"      pct={k.varekostQ} />
          <Quadrant label="Frakt"         pct={k.fraktQ}    hint="plukk + pakk + frakt + gebyr + returer" />
          <Quadrant label="Marketing"     pct={k.marketingQ} hint="spend + produksjon" />
          <Quadrant label="Dekningsbidrag" pct={k.dbQ}      good />
        </div>
      </section>

      <div className="text-xs text-neutral-500 max-w-2xl">
        Prototype — ingen lagring. Sesongfordeling og kanalmiks ligger på Budsjetter-siden.
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

function DbRow({ label, db1, db2 }: { label: string; db1: number; db2: number }) {
  return (
    <tr className="border-t border-neutral-100">
      <td className="px-3 py-2 text-neutral-700">{label}</td>
      <td className={clsx(
        "px-3 py-2 text-right tabular-nums font-medium",
        db1 < 0 ? "text-red-600" : "text-neutral-900"
      )} style={{ fontFamily: "var(--font-mono)" }}>
        {db1 < 0 ? "−" : ""}{fmtNok(Math.abs(db1))} kr
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
