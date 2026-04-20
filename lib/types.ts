export type ClientStatus = "green" | "yellow" | "red";

export interface Client {
  id: string;
  name: string;
  slug: string;
  metaAccountId: string;
  status: ClientStatus;
  weeklySpend: number;
}

export interface PulseRow {
  client: Client;
  spend7d: number;
  spendDelta: number; // % change vs prev 7d
  roas: number;
  roasDelta: number;
  cpa: number;
  cpaDelta: number;
  cpm: number;
  cpmDelta: number;
  netNewReachPct: number;
  frequency: number;
}

export type PeriodKey = "today" | "7d" | "30d" | "prev_month" | "3m" | "6m" | "12m";
export type CompareKey = "period" | "year";

// Performance
export interface PerformanceKpis {
  spend: number;
  spendDelta: number;
  roas: number;
  roasDelta: number;
  cpa: number;
  cpaDelta: number;
  cpmn: number;      // cost per 1k net new reach
  cpmnDelta: number;
  frequency: number;
  frequencyDelta: number;
  ctr: number;
  ctrDelta: number;
  periodLabel: string;
  compareLabel: string;
}

export interface SpendTrendPoint {
  date: string; // YYYY-MM-DD
  spend: number;
  roas: number;
}

export interface Campaign {
  id: string;
  name: string;
  spend: number;
  roas: number;
  cpa: number;
  cpm: number;
  frequency: number;
  ctr: number;
  reach: number;
  adSets?: AdSet[];
}

export interface AdSet {
  id: string;
  name: string;
  spend: number;
  roas: number;
  cpa: number;
  cpm: number;
  frequency: number;
  reach: number;
}

// Reach
export interface ReachKpis {
  totalRollingReach: number;
  avgNetNewReach: number;
  avgNetNewPct: number;
  avgCpmNetNew: number;
  frequency: number;
  lookbackDays: number;
}

export interface ReachCompositionPoint {
  month: string; // "Jan 25"
  previouslyReached: number;
  netNew: number;
  netNewPct: number;
}

export interface ReachMonthRow {
  month: string;
  rollingReach: number;
  weeklyReach: number;
  netNew: number;
  netNewPct: number;
  spend: number;
  cpm: number;
  cpmNetNew: number;
  frequency: number;
}

// Creative
export interface AdCohort {
  cohortDate: string; // "YYYY-MM-DD"
  label: string; // "Mar 2025"
  adCount: number;
  weeks: CohortWeekData[];
}

export interface CohortWeekData {
  week: number; // W0, W1, W2...
  spend: number;
  hookRate: number; // 3s video view %
  holdRate: number; // ThruPlay %
  ctr: number;
  cpm: number;
  cpa: number;
  roas: number;
  impressions: number;
}

export interface CreativeChurnPoint {
  month: string;
  [cohortLabel: string]: number | string; // spend per cohort
}

export interface Ad {
  id: string;
  name: string;
  cohortDate: string;
  format: "video" | "static" | "carousel" | "story";
  status: "active" | "paused" | "learning";
  thumbnailUrl: string;
  hookRate: number;
  holdRate: number;
  ctr: number;
  cpm: number;
  spend: number;
  roas: number;
  cpa: number;
  impressions: number;
}

export type CohortMetric =
  | "hookRate"
  | "holdRate"
  | "ctr"
  | "cpm"
  | "cpa"
  | "roas"
  | "spend";

export interface MonthlyReachRow {
  monthLabel: string;   // "okt. 25"
  monthKey: string;     // "2025-10" for sorting
  rollingReach: number; // cumulative_reach of last week in month
  monthlyReach: number; // weekly_reach of last week (best proxy for period reach)
  netNew: number;       // sum of weekly net_new_reach
  netNewPct: number;    // netNew / sum(weekly_reach) * 100
  spend: number;
  cpm: number;          // avg of weekly cpm
  cpmNetNew: number;    // spend / (netNew / 1000)
  frequency: number;
}
