/**
 * Forecast/Aktivitetsplan-mock — felles config for begge prototype-rutene.
 * Hardkodet for Kokkeløren (abonnement). Andre kunder kommer senere.
 */

export type ActivityType = "AO" | "Salg" | "Nyhetsbrev" | "Restock";
export type Quarter = 1 | 2 | 3 | 4;

export interface Activity {
  id: string;
  navn: string;
  type: ActivityType;
  startDate: string;        // "YYYY-MM-DD"
  endDate: string;
  dailySpend: number;
  forventet: number;        // For abo: forventet CAC; for ecom: forventet ROAS
  eventDate?: string;
  eventNye?: number;
  eventOmsetning?: number;
}

export interface QuarterSummary {
  quarter: Quarter;
  status: "done" | "active" | "planned";
  spendBudget: number;
  nyeBudget: number;
  spendActual?: number;     // for done eller active (MTD)
  nyeActual?: number;
  spendForecast?: number;   // for active eller planned (sum aktiviteter)
  nyeForecast?: number;
  activitiesCount?: number; // for planned (tom = må planlegges)
}

export interface ClientForecastConfig {
  kundetype: "abonnement" | "ecommerce";
  year: number;
  todayDate: string;        // "YYYY-MM-DD"
  // Mål per kvartal — fra Vekst (uniform her, kan sesongjusteres senere)
  monthlyBudget: { spend: number; nye: number; targetCac?: number };
  activities: Activity[];
  // Daglige faktiske tall (kun fram til todayDate)
  actuals: { date: string; spend: number; nye: number }[];
  // Hardkodet kvartalssammendrag (for YearQuarterStrip)
  quarters: Record<Quarter, QuarterSummary>;
}

const KOKKELOREN: ClientForecastConfig = {
  kundetype: "abonnement",
  year: 2026,
  todayDate: "2026-04-15",
  monthlyBudget: { spend: 138_000, nye: 125, targetCac: 1100 },
  activities: [
    // --- April (Q2) ---
    { id: "ao-04",   navn: "AO Hjemmeside",         type: "AO",         startDate: "2026-04-01", endDate: "2026-04-30", dailySpend: 2000, forventet: 1100 },
    { id: "var",     navn: "Vårkampanje",            type: "Salg",       startDate: "2026-04-05", endDate: "2026-04-18", dailySpend: 3000, forventet: 850  },
    { id: "rst-04",  navn: "Restock-flagg",          type: "Restock",    startDate: "2026-04-20", endDate: "2026-04-26", dailySpend: 1500, forventet: 1100 },
    { id: "nb-04",   navn: "Nyhetsbrev påske",       type: "Nyhetsbrev", startDate: "2026-04-12", endDate: "2026-04-12", dailySpend: 0,    forventet: 0, eventDate: "2026-04-12", eventNye: 5 },
    // --- Mai (Q2) ---
    { id: "ao-05",   navn: "AO Hjemmeside",         type: "AO",         startDate: "2026-05-01", endDate: "2026-05-31", dailySpend: 2000, forventet: 1100 },
    { id: "17mai",   navn: "17. mai-kampanje",       type: "Salg",       startDate: "2026-05-08", endDate: "2026-05-17", dailySpend: 4000, forventet: 750  },
    { id: "nb-05",   navn: "Nyhetsbrev månedsbrev",  type: "Nyhetsbrev", startDate: "2026-05-05", endDate: "2026-05-05", dailySpend: 0,    forventet: 0, eventDate: "2026-05-05", eventNye: 4 },
    // --- Juni (Q2) ---
    { id: "ao-06",   navn: "AO Hjemmeside",         type: "AO",         startDate: "2026-06-01", endDate: "2026-06-30", dailySpend: 2000, forventet: 1100 },
    { id: "sum-06",  navn: "Sommerkampanje",         type: "Salg",       startDate: "2026-06-10", endDate: "2026-06-26", dailySpend: 3500, forventet: 900  },
    { id: "rst-06",  navn: "Restock sommer",         type: "Restock",    startDate: "2026-06-20", endDate: "2026-06-30", dailySpend: 1500, forventet: 1100 },
    { id: "nb-06",   navn: "Nyhetsbrev juni",        type: "Nyhetsbrev", startDate: "2026-06-01", endDate: "2026-06-01", dailySpend: 0,    forventet: 0, eventDate: "2026-06-01", eventNye: 4 },
    // --- Juli (Q3) — sparse ---
    { id: "ao-07",   navn: "AO Hjemmeside",         type: "AO",         startDate: "2026-07-01", endDate: "2026-07-31", dailySpend: 1500, forventet: 1100 },
    { id: "sum-jul", navn: "Sommerutsalg",           type: "Salg",       startDate: "2026-07-15", endDate: "2026-07-28", dailySpend: 3000, forventet: 950  },
    // --- August + Sept (Q3) — kun AO foreløpig ---
    { id: "ao-08",   navn: "AO Hjemmeside",         type: "AO",         startDate: "2026-08-01", endDate: "2026-08-31", dailySpend: 1800, forventet: 1100 },
    { id: "ao-09",   navn: "AO Hjemmeside",         type: "AO",         startDate: "2026-09-01", endDate: "2026-09-30", dailySpend: 2000, forventet: 1100 },
    // --- Q4 — tom (må planlegges på neste kvartalsmøte) ---
  ],
  actuals: [
    { date: "2026-04-01", spend: 2050, nye: 2 },
    { date: "2026-04-02", spend: 1980, nye: 2 },
    { date: "2026-04-03", spend: 2100, nye: 1 },
    { date: "2026-04-04", spend: 2020, nye: 2 },
    { date: "2026-04-05", spend: 5180, nye: 6 },
    { date: "2026-04-06", spend: 4920, nye: 5 },
    { date: "2026-04-07", spend: 5100, nye: 6 },
    { date: "2026-04-08", spend: 5200, nye: 5 },
    { date: "2026-04-09", spend: 4880, nye: 4 },
    { date: "2026-04-10", spend: 5150, nye: 6 },
    { date: "2026-04-11", spend: 5050, nye: 5 },
    { date: "2026-04-12", spend: 5300, nye: 11 },
    { date: "2026-04-13", spend: 4970, nye: 4 },
    { date: "2026-04-14", spend: 5120, nye: 5 },
    { date: "2026-04-15", spend: 4830, nye: 5 },
  ],
  quarters: {
    1: { quarter: 1, status: "done",    spendBudget: 414_000, nyeBudget: 375, spendActual: 405_000, nyeActual: 360 },
    2: { quarter: 2, status: "active",  spendBudget: 414_000, nyeBudget: 375 },  // forecast/actual regnes live
    3: { quarter: 3, status: "planned", spendBudget: 414_000, nyeBudget: 375, activitiesCount: 4 },
    4: { quarter: 4, status: "planned", spendBudget: 414_000, nyeBudget: 375, activitiesCount: 0 },
  },
};

export const FORECAST_CONFIG: Record<string, ClientForecastConfig> = {
  kokkeloren: KOKKELOREN,
};

// --- Hjelpere ---

export const QUARTER_MONTHS: Record<Quarter, [number, number, number]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

export const QUARTER_LABEL: Record<Quarter, string> = {
  1: "Q1 · jan–mar",
  2: "Q2 · apr–jun",
  3: "Q3 · jul–sep",
  4: "Q4 · okt–des",
};

export function dayOfMonth(date: string): number {
  return parseInt(date.split("-")[2], 10);
}

export function monthOfDate(date: string): number {
  return parseInt(date.split("-")[1], 10);
}

export function quarterOfMonth(month: number): Quarter {
  return Math.ceil(month / 3) as Quarter;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function fmtNok(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "–";
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} k`;
  }
  return Math.round(n).toLocaleString("nb-NO");
}

export function fmtPct(n: number, decimals = 0): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

export function formatDayLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d}.${m}`;
}

const MONTH_LABEL = ["", "Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
export function monthLabel(month: number): string {
  return MONTH_LABEL[month] ?? "";
}

/**
 * Filtrer aktiviteter som er aktive i en gitt måned (eller i hele kvartalet).
 */
export function activitiesInMonth(activities: Activity[], year: number, month: number): Activity[] {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;
  return activities.filter((a) => {
    if (a.eventDate) return a.eventDate >= monthStart && a.eventDate <= monthEnd;
    return !(a.endDate < monthStart || a.startDate > monthEnd);
  });
}

export function activitiesInQuarter(activities: Activity[], year: number, q: Quarter): Activity[] {
  const months = QUARTER_MONTHS[q];
  const start = `${year}-${String(months[0]).padStart(2, "0")}-01`;
  const lastMonth = months[2];
  const end = `${year}-${String(lastMonth).padStart(2, "0")}-${String(daysInMonth(year, lastMonth)).padStart(2, "0")}`;
  return activities.filter((a) => {
    if (a.eventDate) return a.eventDate >= start && a.eventDate <= end;
    return !(a.endDate < start || a.startDate > end);
  });
}

/**
 * Aggregater totaler (forecast + actuals) for et helt kvartal.
 * - Past dager: bruker actual-data hvis tilgjengelig (spend + nye lagt til både actual og forecast)
 * - Future dager: forecast fra aktivitetsplan
 *
 * Brukes både i Forecast- og Aktivitetsplan-prototypene.
 */
export function computeQuarterTotals(cfg: ClientForecastConfig, q: Quarter) {
  const months = QUARTER_MONTHS[q];
  const todayMonth = parseInt(cfg.todayDate.split("-")[1], 10);
  const todayDay = parseInt(cfg.todayDate.split("-")[2], 10);
  const actualsMap = new Map(cfg.actuals.map((a) => [a.date, a]));

  let spendActual = 0, nyeActual = 0;
  let spendForecast = 0, nyeForecast = 0;

  for (const month of months) {
    const days = daysInMonth(cfg.year, month);
    for (let day = 1; day <= days; day++) {
      const date = `${cfg.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = month < todayMonth || (month === todayMonth && day <= todayDay);
      const actual = actualsMap.get(date);
      if (isPast && actual) {
        spendActual += actual.spend;
        nyeActual += actual.nye;
        spendForecast += actual.spend;
        nyeForecast += actual.nye;
      } else {
        for (const a of cfg.activities) {
          if (a.eventDate === date) { nyeForecast += a.eventNye ?? 0; continue; }
          if (date >= a.startDate && date <= a.endDate && a.dailySpend > 0) {
            spendForecast += a.dailySpend;
            if (cfg.kundetype === "abonnement" && a.forventet > 0) {
              nyeForecast += a.dailySpend / a.forventet;
            }
          }
        }
      }
    }
  }
  return { spendActual, nyeActual, spendForecast, nyeForecast };
}

/**
 * Beregn forventet bidrag per aktivitet.
 * For abo: spend = dager × dailySpend, nye = spend / forventet (CAC).
 * For event: spend = 0, nye = eventNye.
 */
export function activityTotals(a: Activity, kundetype: "abonnement" | "ecommerce") {
  if (a.eventDate) {
    return {
      spend: 0,
      nye: a.eventNye ?? 0,
      omsetning: a.eventOmsetning ?? 0,
    };
  }
  const start = new Date(a.startDate);
  const end = new Date(a.endDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const spend = a.dailySpend * days;
  if (kundetype === "abonnement") {
    return { spend, nye: a.forventet > 0 ? spend / a.forventet : 0, omsetning: 0 };
  }
  return { spend, nye: 0, omsetning: spend * a.forventet };
}
