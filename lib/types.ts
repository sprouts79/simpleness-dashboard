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
  weekNumber: number; // Same as week, for compatibility
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
  createdAt?: string;
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
  purchases: number;
  reach: number;
  netNew?: number;
  netNewPct?: number;
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

export interface WeeklyReachRow {
  weekLabel: string;    // "7. apr"
  weekStart: string;    // "2026-04-07" for sorting/keying
  reach: number;        // cumulative_reach
  weeklyReach: number;
  netNew: number;
  netNewPct: number;
  spend: number;
  frequency: number;
  cpmNetNew: number;
}

// Lab — fatigue gauge (creative/lab "Helse"-seksjon)
// Status = single-letter tier (A/B/C by spend-share) OR overrides (new/dead).
// TOF is a separate flag — applies on top of A/B/C when CPMr criteria met.
export type FatigueStatus = "a" | "b" | "c" | "new" | "dead";

export interface FatigueAdRow {
  adId: string;
  adName: string;
  thumbnailUrl: string;
  createdDate: string | null;          // YYYY-MM-DD when ad was created in Meta
  daysSinceCreated: number | null;
  // Trend signals (4-week + 1-week for early-warning):
  spendShareTrend4w: number;           // 4-week relative trend (avg first half vs last half)
  spendShareTrend1w: number;           // last week vs prior week
  cpmTrend4w: number;
  cpmTrend1w: number;
  avgCpm: number;                      // weekly avg CPM over last 4 weeks
  avgSpendShare: number;
  totalSpend: number;                  // last 4 weeks
  spendLast7d: number;                 // signal for "dead" detection
  // Lifetime CPMr (Cost per Mille Reached) — spend90d / reach90d × 1000.
  // Used for TOF flag because reach is unique-people, not impressions.
  cpmr: number;
  reach: number;                       // lifetime unique reach (90d)
  lifetimeSpend: number;               // lifetime spend (90d)
  status: FatigueStatus;
  isTof: boolean;                      // flag: meets cheap-new-reach criteria
  spendShareSpark: number[];           // last 12 weeks
  cpmSpark: number[];                  // last 12 weeks
}

export interface FatigueAccountSignal {
  frequencyRecent: number;
  frequencyPrior: number;
  netNewPctRecent: number;
  netNewPctPrior: number;
  daysSinceLastLaunch: number | null;
  lastLaunchDate: string | null;
  lastLaunchAdCount: number;
  cpmrP33: number;                     // bottom-tertile lifetime CPMr threshold for TOF flag
  spendThreshold: number;              // minimum 4-week spend to be included in table
}

export interface FatigueData {
  account: FatigueAccountSignal;
  ads: FatigueAdRow[];                 // sorted by total spend desc
}

export interface AdLabWeek {
  weekStart: string;   // "YYYY-MM-DD" (Monday)
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  videoViews3s: number;
  videoViewsThruplays: number;
}

export interface AdLabRow {
  adId: string;
  adName: string;
  format: "video" | "static" | "carousel" | "story" | "unknown";
  thumbnailUrl: string;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  cohortDate: string;   // "YYYY-MM-DD" — Monday of week of first spend
  cohortLabel: string;  // "Uke 17"
  weeks: AdLabWeek[];
  totalSpend: number;
  totalPurchases: number;
  totalPurchaseValue: number;
}
