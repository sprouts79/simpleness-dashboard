"use client";

import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import {
  FORECAST_CONFIG,
  Quarter,
  QUARTER_MONTHS,
  monthLabel,
  activitiesInMonth,
  activityTotals,
  fmtNok,
  formatDayLabel,
  Activity,
  ActivityType,
  computeQuarterTotals,
} from "@/lib/forecast-mock";
import YearQuarterStrip, { QuarterTotals } from "./YearQuarterStrip";
import QuarterTargets from "./QuarterTargets";

export default function AktivitetsplanPrototype({ clientId }: { clientId: string }) {
  const cfg = FORECAST_CONFIG[clientId];
  const searchParams = useSearchParams();

  if (!cfg) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 max-w-2xl">
        <p className="text-sm text-neutral-600">
          Ingen aktivitetsplan-konfig for <span className="font-medium">{clientId}</span> ennå.
          Kun Kokkeløren er satt opp som demo.
        </p>
      </div>
    );
  }

  const qParam = searchParams.get("q");
  const quarter: Quarter = qParam && ["1","2","3","4"].includes(qParam) ? Number(qParam) as Quarter : 2;
  const months = QUARTER_MONTHS[quarter];

  // Sum kvartal
  let totalSpend = 0;
  let totalNye = 0;
  for (const a of cfg.activities) {
    const mInt = parseInt(a.startDate.split("-")[1], 10);
    const aQ = Math.ceil(mInt / 3);
    if (aQ !== quarter) continue;
    const t = activityTotals(a, cfg.kundetype);
    totalSpend += t.spend;
    totalNye += t.nye;
  }

  // Beregn totaler for alle 4 kvartaler (vises i YearQuarterStrip)
  const allTotals: Record<Quarter, QuarterTotals> = {
    1: {
      spendActual: cfg.quarters[1].spendActual ?? 0,
      nyeActual: cfg.quarters[1].nyeActual ?? 0,
      spendForecast: cfg.quarters[1].spendActual ?? 0,
      nyeForecast: cfg.quarters[1].nyeActual ?? 0,
    },
    2: computeQuarterTotals(cfg, 2),
    3: computeQuarterTotals(cfg, 3),
    4: computeQuarterTotals(cfg, 4),
  };
  const cacTarget = cfg.monthlyBudget.targetCac ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Aktivitetsplan</h1>
      </div>

      <YearQuarterStrip
        activeQuarter={quarter}
        quarters={cfg.quarters}
        totals={allTotals}
      />

      <QuarterTargets cfg={cfg} quarter={quarter} />

      {/* Sum-stripe for valgt kvartal */}
      <div className="flex flex-wrap items-baseline gap-6 px-1 text-sm">
        <span className="text-neutral-500">Sum planlagt:</span>
        <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="font-semibold text-neutral-900">{fmtNok(totalSpend)} kr</span>
          <span className="text-neutral-500 ml-1">spend</span>
        </span>
        <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="font-semibold text-neutral-900">{fmtNok(totalNye)}</span>
          <span className="text-neutral-500 ml-1">{cfg.kundetype === "abonnement" ? "nye abo" : "nye kunder"}</span>
        </span>
      </div>

      {/* 3 måneds-seksjoner */}
      <div className="space-y-6">
        {months.map((m) => {
          const acts = activitiesInMonth(cfg.activities, cfg.year, m);
          return (
            <MonthSection
              key={m}
              month={m}
              year={cfg.year}
              activities={acts}
              kundetype={cfg.kundetype}
            />
          );
        })}
      </div>

      <div className="text-xs text-neutral-500 max-w-2xl">
        Prototype — alle aktiviteter hardkodet. Klikk-redigering kommer senere. Sum-rad nederst summerer aktivitetene som starter i valgt kvartal.
      </div>
    </div>
  );
}

function MonthSection({
  month,
  year,
  activities,
  kundetype,
}: {
  month: number;
  year: number;
  activities: Activity[];
  kundetype: "abonnement" | "ecommerce";
}) {
  const monthSpend = activities.reduce((s, a) => s + activityTotals(a, kundetype).spend, 0);
  const monthNye = activities.reduce((s, a) => s + activityTotals(a, kundetype).nye, 0);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">{monthLabel(month)} {year}</h3>
        <span className="text-xs text-neutral-500">
          {activities.length} {activities.length === 1 ? "aktivitet" : "aktiviteter"}
          {activities.length > 0 && (
            <>
              {" · "}
              <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {fmtNok(monthSpend)} kr · {fmtNok(monthNye)} {kundetype === "abonnement" ? "nye abo" : "nye kunder"}
              </span>
            </>
          )}
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/40 px-4 py-6 text-center text-xs text-neutral-500">
          Ingen aktiviteter planlagt for {monthLabel(month).toLowerCase()}.
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500">Navn</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Periode</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Daglig spend</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">{kundetype === "abonnement" ? "Forv. CAC" : "Forv. ROAS"}</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Forv. spend</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">{kundetype === "abonnement" ? "Forv. nye" : "Forv. oms"}</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => {
                const t = activityTotals(a, kundetype);
                return (
                  <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-neutral-900">{a.navn}</td>
                    <td className="px-3 py-2"><ActivityTypeBadge type={a.type} /></td>
                    <td className="px-3 py-2 text-xs text-neutral-600 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                      {a.eventDate ? formatDayLabel(a.eventDate) : `${formatDayLabel(a.startDate)} – ${formatDayLabel(a.endDate)}`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-700" style={{ fontFamily: "var(--font-mono)" }}>
                      {a.dailySpend > 0 ? `${fmtNok(a.dailySpend)} kr` : "–"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-700" style={{ fontFamily: "var(--font-mono)" }}>
                      {a.forventet > 0 ? (kundetype === "abonnement" ? `${fmtNok(a.forventet)} kr` : a.forventet.toFixed(1)) : "–"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-900 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {fmtNok(t.spend)} kr
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-900 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {kundetype === "abonnement" ? fmtNok(t.nye) : `${fmtNok(t.omsetning)} kr`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const config: Record<ActivityType, { cls: string; label: string }> = {
    AO:         { cls: "bg-neutral-100 text-neutral-700 border-neutral-200", label: "AO" },
    Salg:       { cls: "bg-[#dff7cc] text-[#3b8d0a] border-[#41bd0e]/30", label: "Salg" },
    Nyhetsbrev: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Nyhetsbrev" },
    Restock:    { cls: "bg-purple-50 text-purple-700 border-purple-200", label: "Restock" },
  };
  const c = config[type];
  return (
    <span className={clsx("text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", c.cls)}>
      {c.label}
    </span>
  );
}

