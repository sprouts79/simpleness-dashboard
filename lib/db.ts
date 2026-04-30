/**
 * Data layer — server-only.
 * Reads from Supabase. Mock fallbacks for data not yet synced from Meta.
 * When Meta sync has run, real data takes over automatically.
 */

import { supabase } from "./supabase";
import {
  Client,
  ClientStatus,
  PulseRow,
  PerformanceKpis,
  SpendTrendPoint,
  Campaign,
  ReachKpis,
  ReachCompositionPoint,
  ReachMonthRow,
  MonthlyReachRow,
  WeeklyReachRow,
  AdCohort,
  CreativeChurnPoint,
  Ad,
  AdLabRow,
  AdLabWeek,
  FatigueData,
  FatigueAdRow,
  FatigueStatus,
  PeriodKey,
  CompareKey,
} from "./types";
import {
  CLIENTS as MOCK_CLIENTS,
  PULSE_DATA as MOCK_PULSE,
  PERFORMANCE_KPIS as MOCK_PERFORMANCE_KPIS,
  SPEND_TREND as MOCK_SPEND_TREND,
  CAMPAIGNS as MOCK_CAMPAIGNS,
  REACH_KPIS,
  REACH_COMPOSITION,
  REACH_TABLE,
  COHORTS,
} from "./mock-data";

// Formats "2026-04-09" → "9. apr"  — avoids toLocaleDateString inconsistencies in Node.js
function formatWeekLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  return `${parseInt(day)}. ${months[parseInt(month) - 1]}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "I går",
  "7d": "Siste 7 dager",
  "30d": "Siste 30 dager",
  prev_month: "Forrige måned",
  "3m": "Siste 3 måneder",
  "6m": "Siste 6 måneder",
  "12m": "Siste 12 måneder",
};

export function getPeriodRange(period: PeriodKey): { since: string; until: string } {
  const now = new Date();
  const yesterday = daysAgo(1);

  // Helper: last N complete calendar months (e.g. 3m in April = Jan 1 – Mar 31)
  function lastNMonths(n: number) {
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 86400000);
    const firstMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth() - (n - 1), 1);
    return {
      since: firstMonth.toISOString().split("T")[0],
      until: lastOfPrevMonth.toISOString().split("T")[0],
    };
  }

  if (period === "today") return { since: yesterday, until: yesterday };
  if (period === "7d") return { since: daysAgo(7), until: yesterday };
  if (period === "30d") return { since: daysAgo(30), until: yesterday };
  if (period === "prev_month") return lastNMonths(1);
  if (period === "3m") return lastNMonths(3);
  if (period === "6m") return lastNMonths(6);
  return lastNMonths(12); // 12m
}

export function getCompareRange(
  since: string,
  until: string,
  compare: CompareKey
): { compSince: string; compUntil: string } {
  if (compare === "year") {
    return { compSince: shiftDays(since, -365), compUntil: shiftDays(until, -365) };
  }
  const sinceDate = new Date(since);
  const untilDate = new Date(until);
  const diffDays = Math.round((untilDate.getTime() - sinceDate.getTime()) / 86400000) + 1;
  return { compSince: shiftDays(since, -diffDays), compUntil: shiftDays(until, -diffDays) };
}

// ─── Clients (Supabase) ──────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, meta_account_id, status")
    .order("name");

  if (error || !data?.length) return MOCK_CLIENTS;

  return data.map((row) => {
    const mock = MOCK_CLIENTS.find((c) => c.id === row.id);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      metaAccountId: row.meta_account_id ?? "",
      status: row.status as ClientStatus,
      weeklySpend: mock?.weeklySpend ?? 0, // replaced by getPulseData once synced
    };
  });
}

export async function getClient(slug: string): Promise<Client | undefined> {
  const clients = await getClients();
  return clients.find((c) => c.slug === slug);
}

// ─── Helpers for aggregating performance rows ────────────────────────────────

interface PerfAgg {
  spend: number;
  purchases: number;
  purchaseValue: number;
  impressions: number;
  clicks: number;
  reach: number;
  rows: number;
  frequencySum: number;
}

function aggRows(rows: any[]): PerfAgg {
  return rows.reduce(
    (acc, r) => ({
      spend: acc.spend + (r.spend ?? 0),
      purchases: acc.purchases + (r.purchases ?? 0),
      purchaseValue: acc.purchaseValue + (r.purchase_value ?? 0),
      impressions: acc.impressions + (r.impressions ?? 0),
      clicks: acc.clicks + (r.clicks ?? 0),
      reach: acc.reach + (r.reach ?? 0),
      rows: acc.rows + 1,
      frequencySum: acc.frequencySum + (r.frequency ?? 0),
    }),
    { spend: 0, purchases: 0, purchaseValue: 0, impressions: 0, clicks: 0, reach: 0, rows: 0, frequencySum: 0 }
  );
}

function derivedKpis(agg: PerfAgg) {
  return {
    spend: agg.spend,
    roas: agg.spend > 0 ? agg.purchaseValue / agg.spend : 0,
    cpa: agg.purchases > 0 ? agg.spend / agg.purchases : 0,
    cpm: agg.impressions > 0 ? (agg.spend / agg.impressions) * 1000 : 0,
    ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
    frequency: agg.rows > 0 ? agg.frequencySum / agg.rows : 0,
  };
}

function pctDelta(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

// ─── Pulse ───────────────────────────────────────────────────────────────────

export async function getPulseData(): Promise<PulseRow[]> {
  const clients = await getClients();

  const since7 = daysAgo(7);
  const since14 = daysAgo(14);
  const until7 = today();
  const until14 = daysAgo(7);

  const { data: curr7 } = await supabase
    .from("meta_performance_daily")
    .select("client_id,spend,purchases,purchase_value,impressions,clicks,frequency,reach")
    .gte("date", since7)
    .lte("date", until7);

  const { data: prev7 } = await supabase
    .from("meta_performance_daily")
    .select("client_id,spend,purchases,purchase_value,impressions,clicks,frequency,reach")
    .gte("date", since14)
    .lt("date", until14);

  // Latest weekly reach % from meta_reach_weekly (cron syncs with lookback_days=90).
  const { data: reachRows } = await supabase
    .from("meta_reach_weekly")
    .select("client_id,pct_net_new,frequency")
    .eq("lookback_days", 90)
    .order("week_start", { ascending: false })
    .limit(clients.length * 8);

  return clients.map((client) => {
    const cRows = (curr7 ?? []).filter((r) => r.client_id === client.id);
    const pRows = (prev7 ?? []).filter((r) => r.client_id === client.id);

    // Fall back to mock if no real data yet
    if (!cRows.length) {
      const mock = MOCK_PULSE.find((p) => p.client.id === client.id);
      return mock ? { ...mock, client } : {
        client, spend7d: 0, spendDelta: 0, roas: 0, roasDelta: 0,
        cpa: 0, cpaDelta: 0, cpm: 0, cpmDelta: 0, netNewReachPct: 0, frequency: 0,
      };
    }

    const c = derivedKpis(aggRows(cRows));
    const p = derivedKpis(aggRows(pRows));

    const latestReach = reachRows?.find((r) => r.client_id === client.id);

    return {
      client: { ...client, weeklySpend: c.spend },
      spend7d: c.spend,
      spendDelta: pctDelta(c.spend, p.spend),
      roas: c.roas,
      roasDelta: pctDelta(c.roas, p.roas),
      cpa: c.cpa,
      cpaDelta: pctDelta(c.cpa, p.cpa),
      cpm: c.cpm,
      cpmDelta: pctDelta(c.cpm, p.cpm),
      netNewReachPct: latestReach?.pct_net_new ?? 0,
      frequency: c.frequency,
    };
  });
}

// ─── Performance KPIs ────────────────────────────────────────────────────────

export async function getPerformanceKpis(
  clientId: string,
  since: string,
  until: string,
  compSince: string,
  compUntil: string,
  periodLabel: string,
  compareLabel: string,
): Promise<PerformanceKpis | null> {
  // Fetch performance daily data
  const { data } = await supabase
    .from("meta_performance_daily")
    .select("date,spend,purchases,purchase_value,impressions,clicks,frequency,reach")
    .eq("client_id", clientId)
    .gte("date", compSince)
    .lte("date", until)
    .not("campaign_id", "is", null)
    .neq("campaign_id", "")
    .order("date");

  if (!data?.length) return MOCK_PERFORMANCE_KPIS[clientId] ?? null;

  // Fetch weekly reach data for CPMn + accurate frequency
  // Include weeks starting up to 6 days before compSince (a week may start just before the period)
  const { data: reachRows } = await supabase
    .from("meta_reach_weekly")
    .select("week_start, net_new_reach, weekly_reach, frequency")
    .eq("client_id", clientId)
    .eq("lookback_days", 0)
    .gte("week_start", shiftDays(compSince, -6))
    .lte("week_start", until)
    .order("week_start");

  // Weeks overlapping with a given date range (week = 7 days from week_start)
  function weeksFor(from: string, to: string) {
    return (reachRows ?? []).filter((r) => {
      const weekEnd = shiftDays(r.week_start, 6);
      return r.week_start <= to && weekEnd >= from;
    });
  }

  // CPMn = spend / (net_new_reach / 1000)
  function computeCPMn(spend: number, rows: typeof reachRows): number {
    const netNew = (rows ?? []).reduce((s, r) => s + (r.net_new_reach ?? 0), 0);
    return netNew > 0 ? (spend / netNew) * 1000 : 0;
  }

  // Frequency weighted by weekly_reach; falls back to 0 when no reach data
  function computeFrequency(rows: typeof reachRows): number {
    const totalReach = (rows ?? []).reduce((s, r) => s + (r.weekly_reach ?? 0), 0);
    if (totalReach === 0) return 0;
    return (rows ?? []).reduce((s, r) => s + (r.frequency ?? 0) * (r.weekly_reach ?? 0), 0) / totalReach;
  }

  const curr = data.filter((r) => r.date >= since && r.date <= until);
  const comp = data.filter((r) => r.date >= compSince && r.date <= compUntil);

  const c = derivedKpis(aggRows(curr));
  const p = derivedKpis(aggRows(comp));

  const reachCurr = weeksFor(since, until);
  const reachComp = weeksFor(compSince, compUntil);

  const cpmnCurr = computeCPMn(c.spend, reachCurr);
  const cpmnComp = computeCPMn(p.spend, reachComp);
  const freqCurr = computeFrequency(reachCurr) || c.frequency;
  const freqComp = computeFrequency(reachComp) || p.frequency;

  return {
    spend: c.spend,
    spendDelta: pctDelta(c.spend, p.spend),
    roas: c.roas,
    roasDelta: pctDelta(c.roas, p.roas),
    cpa: c.cpa,
    cpaDelta: pctDelta(c.cpa, p.cpa),
    cpmn: cpmnCurr,
    cpmnDelta: pctDelta(cpmnCurr, cpmnComp),
    frequency: freqCurr,
    frequencyDelta: pctDelta(freqCurr, freqComp),
    ctr: c.ctr,
    ctrDelta: pctDelta(c.ctr, p.ctr),
    periodLabel,
    compareLabel,
  };
}

// ─── Spend Trend ─────────────────────────────────────────────────────────────

export async function getSpendTrend(
  clientId: string,
  since: string,
  until: string,
): Promise<SpendTrendPoint[]> {
  const { data } = await supabase
    .from("meta_performance_daily")
    .select("date,spend,purchases,purchase_value")
    .eq("client_id", clientId)
    .gte("date", since)
    .lte("date", until)
    .not("campaign_id", "is", null)
    .neq("campaign_id", "")
    .order("date");

  // Aggregate by date (multiple campaign rows per day → sum)
  const byDate = new Map<string, { spend: number; purchaseValue: number }>();
  if (data?.length) {
    for (const r of data) {
      const existing = byDate.get(r.date) ?? { spend: 0, purchaseValue: 0 };
      byDate.set(r.date, {
        spend: existing.spend + (r.spend ?? 0),
        purchaseValue: existing.purchaseValue + (r.purchase_value ?? 0),
      });
    }
  }

  // Fill ALL days in the range (days without spend = 0)
  const result: SpendTrendPoint[] = [];
  const d = new Date(since + "T00:00:00");
  const end = new Date(until + "T00:00:00");
  while (d <= end) {
    const dateStr = d.toISOString().split("T")[0];
    const vals = byDate.get(dateStr) ?? { spend: 0, purchaseValue: 0 };
    result.push({
      date: dateStr,
      spend: Math.round(vals.spend),
      roas: vals.spend > 0 ? parseFloat((vals.purchaseValue / vals.spend).toFixed(2)) : 0,
    });
    d.setDate(d.getDate() + 1);
  }

  if (!result.length) return MOCK_SPEND_TREND[clientId] ?? [];
  return result;
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export async function getCampaigns(clientId: string, since: string, until: string): Promise<Campaign[]> {
  const { data } = await supabase
    .from("meta_performance_daily")
    .select("campaign_id,campaign_name,spend,purchases,purchase_value,impressions,clicks,reach,frequency")
    .eq("client_id", clientId)
    .gte("date", since)
    .lte("date", until)
    .not("campaign_id", "is", null);

  if (!data?.length) return MOCK_CAMPAIGNS[clientId] ?? [];

  // Group by campaign_id
  type CampRow = (typeof data)[number];
  const map = new Map<string, { name: string; rows: CampRow[] }>();
  for (const r of data) {
    if (!map.has(r.campaign_id)) {
      map.set(r.campaign_id, { name: r.campaign_name ?? "", rows: [] });
    }
    map.get(r.campaign_id)!.rows.push(r);
  }

  return Array.from(map.entries())
    .map(([id, { name, rows }]) => {
      const agg = aggRows(rows);
      const kpis = derivedKpis(agg);
      return {
        id,
        name,
        spend: kpis.spend,
        roas: kpis.roas,
        cpa: kpis.cpa,
        cpm: kpis.cpm,
        frequency: kpis.frequency,
        ctr: kpis.ctr,
        reach: agg.reach,
      };
    })
    .filter((c) => c.spend > 0) // only campaigns with spend in the selected period
    .sort((a, b) => b.spend - a.spend);
}

// ─── Reach (mock until reach sync is built) ──────────────────────────────────

export async function getReachKpis(clientId: string): Promise<ReachKpis | null> {
  const { data } = await supabase
    .from("meta_reach_weekly")
    .select("*")
    .eq("client_id", clientId)
    .lte("week_start", daysAgo(6)) // only complete weeks (started ≥7 days ago)
    .order("week_start", { ascending: false })
    .limit(12);

  if (!data?.length) return REACH_KPIS[clientId] ?? null;

  const totalReach = data[0]?.cumulative_reach ?? 0;
  const avgNetNew = data.reduce((s, r) => s + (r.net_new_reach ?? 0), 0) / data.length;
  const avgPct = data.reduce((s, r) => s + (r.pct_net_new ?? 0), 0) / data.length;
  const avgCpmNetNew = data.reduce((s, r) => s + (r.cpm_net_new ?? 0), 0) / data.length;
  const avgFreq = data.reduce((s, r) => s + (r.frequency ?? 0), 0) / data.length;

  return {
    totalRollingReach: totalReach,
    avgNetNewReach: Math.round(avgNetNew),
    avgNetNewPct: parseFloat(avgPct.toFixed(1)),
    avgCpmNetNew: parseFloat(avgCpmNetNew.toFixed(2)),
    frequency: parseFloat(avgFreq.toFixed(1)),
    lookbackDays: data[0]?.lookback_days ?? 180,
  };
}

export async function getReachComposition(
  clientId: string
): Promise<ReachCompositionPoint[]> {
  const { data } = await supabase
    .from("meta_reach_weekly")
    .select("week_start,weekly_reach,net_new_reach,pct_net_new")
    .eq("client_id", clientId)
    .lte("week_start", daysAgo(6)) // only complete weeks
    .order("week_start");

  if (!data?.length) return REACH_COMPOSITION[clientId] ?? [];

  return data.map((r) => ({
    month: formatWeekLabel(r.week_start),
    previouslyReached: (r.weekly_reach ?? 0) - (r.net_new_reach ?? 0),
    netNew: r.net_new_reach ?? 0,
    netNewPct: r.pct_net_new ?? 0,
  }));
}

export async function getReachTable(clientId: string): Promise<ReachMonthRow[]> {
  const { data } = await supabase
    .from("meta_reach_weekly")
    .select("*")
    .eq("client_id", clientId)
    .lte("week_start", daysAgo(6)) // only complete weeks
    .order("week_start", { ascending: false });

  if (!data?.length) return REACH_TABLE[clientId] ?? [];

  return data.map((r) => ({
    month: formatWeekLabel(r.week_start),
    rollingReach: r.cumulative_reach ?? 0,
    weeklyReach: r.weekly_reach ?? 0,
    netNew: r.net_new_reach ?? 0,
    netNewPct: r.pct_net_new ?? 0,
    spend: r.spend ?? 0,
    cpm: r.cpm ?? 0,
    cpmNetNew: r.cpm_net_new ?? 0,
    frequency: r.frequency ?? 0,
  }));
}

// ─── Creative (Supabase meta_ads) ────────────────────────────────────────────

export async function getAds(clientId: string): Promise<Ad[]> {
  const { data } = await supabase
    .from("meta_ads")
    .select("*")
    .eq("client_id", clientId)
    .order("spend", { ascending: false });

  if (!data?.length) return [];

  return data.map((r) => ({
    id: r.ad_id,
    name: r.ad_name,
    cohortDate: r.cohort_date ?? r.created_date ?? "",
    // Use the format stored during sync (from Meta object_type: VIDEO/SHARE/PHOTO/STATUS).
    // Falls back to video signal if format column is NULL (old rows before format was stored).
    format: (r.format ?? ((r.video_views_3s ?? 0) > 0 ? "video" : "static")) as Ad["format"],
    // Active = actually getting spend (most reliable signal — bypasses parent campaign/adset status)
    status: (r.spend ?? 0) > 0 ? "active" : "paused",
    thumbnailUrl: r.thumbnail_url ?? "",
    hookRate: r.hook_rate ?? 0,
    holdRate: r.hold_rate ?? 0,
    ctr: r.ctr ? r.ctr * 100 : 0, // stored as decimal, display as %
    cpm: (r.impressions ?? 0) > 0 ? ((r.spend ?? 0) / r.impressions) * 1000 : 0,
    spend: r.spend ?? 0,
    roas: r.roas ?? 0,
    cpa: r.cpa ?? 0,
    impressions: r.impressions ?? 0,
    purchases: r.purchases ?? 0,
    reach: r.reach ?? 0,
  }));
}

export async function getTopAds(clientId: string, days: number, limit = 10): Promise<Ad[]> {
  const since = daysAgo(days);
  const until = today();

  // Aggregate per ad from meta_ad_weekly
  const { data: weeklyData } = await supabase
    .from("meta_ad_weekly")
    .select("ad_id, spend, impressions, clicks, purchases, purchase_value, video_views_3s, video_views_thruplays")
    .eq("client_id", clientId)
    .gte("week_start", since)
    .lte("week_start", until);

  if (!weeklyData?.length) return [];

  // Aggregate per ad
  type Agg = { spend: number; impressions: number; clicks: number; purchases: number; purchaseValue: number; v3s: number; thruplays: number };
  const adMap = new Map<string, Agg>();
  for (const r of weeklyData) {
    const prev = adMap.get(r.ad_id) ?? { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0, v3s: 0, thruplays: 0 };
    adMap.set(r.ad_id, {
      spend: prev.spend + (r.spend ?? 0),
      impressions: prev.impressions + (r.impressions ?? 0),
      clicks: prev.clicks + (r.clicks ?? 0),
      purchases: prev.purchases + (r.purchases ?? 0),
      purchaseValue: prev.purchaseValue + (r.purchase_value ?? 0),
      v3s: prev.v3s + (r.video_views_3s ?? 0),
      thruplays: prev.thruplays + (r.video_views_thruplays ?? 0),
    });
  }

  // Fetch ad metadata (name, thumbnail) for the relevant ad_ids
  const adIds = Array.from(adMap.keys());
  const { data: adMeta } = await supabase
    .from("meta_ads")
    .select("ad_id, ad_name, format, thumbnail_url, cohort_date, created_date")
    .in("ad_id", adIds);

  const metaByAdId = new Map((adMeta ?? []).map((r) => [r.ad_id, r]));

  return Array.from(adMap.entries())
    .map(([adId, agg]) => {
      const meta = metaByAdId.get(adId);
      const imp = agg.impressions;
      return {
        id: adId,
        name: meta?.ad_name ?? adId,
        cohortDate: meta?.cohort_date ?? meta?.created_date ?? "",
        format: (meta?.format ?? (agg.v3s > 0 ? "video" : "static")) as Ad["format"],
        status: agg.spend > 0 ? "active" as const : "paused" as const,
        thumbnailUrl: meta?.thumbnail_url ?? "",
        hookRate: imp > 0 ? (agg.v3s / imp) * 100 : 0,
        holdRate: imp > 0 ? (agg.thruplays / imp) * 100 : 0,
        ctr: imp > 0 ? (agg.clicks / imp) * 100 : 0,
        cpm: imp > 0 ? (agg.spend / imp) * 1000 : 0,
        spend: agg.spend,
        roas: agg.spend > 0 ? agg.purchaseValue / agg.spend : 0,
        cpa: agg.purchases > 0 ? agg.spend / agg.purchases : 0,
        impressions: imp,
        purchases: agg.purchases,
        reach: 0, // not available from weekly aggregation
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit);
}

// Returns ISO Monday of the week containing dateStr (YYYY-MM-DD)
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatWeekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z");
  // Calculate ISO week number
  const tempDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `Uke ${weekNum}`;
}

export async function getCohorts(clientId: string): Promise<AdCohort[]> {
  // Get weekly ad data for last 12 weeks (84 days)
  const { data: weeklyData } = await supabase
    .from("meta_ad_weekly")
    .select("ad_id, week_start, spend, impressions, clicks, purchases, purchase_value, video_views_3s, video_views_thruplays")
    .eq("client_id", clientId)
    .gte("week_start", daysAgo(90))
    .gt("spend", 0);

  if (!weeklyData?.length) return COHORTS[clientId] ?? [];

  // W0 = first week the ad had spend (matches reference app behaviour).
  // Build map: ad_id → earliest week_start with spend > 0.
  const firstSpendMap = new Map<string, string>();
  for (const row of weeklyData) {
    const current = firstSpendMap.get(row.ad_id);
    if (!current || row.week_start < current) {
      firstSpendMap.set(row.ad_id, row.week_start);
    }
  }

  // Aggregate: cohort_week_start → week_number → metrics
  type WeekAgg = {
    spend: number; impressions: number; clicks: number;
    purchases: number; purchaseValue: number;
    v3s: number; thruplays: number;
  };

  const cohortWeekMap = new Map<string, Map<number, WeekAgg>>();
  const cohortAdSets = new Map<string, Set<string>>();

  for (const row of weeklyData) {
    const firstSpend = firstSpendMap.get(row.ad_id);
    if (!firstSpend) continue;

    const cohortMonday = getMondayOf(firstSpend);
    const insightMonday = getMondayOf(row.week_start);

    const cohortMs = new Date(cohortMonday + "T00:00:00Z").getTime();
    const insightMs = new Date(insightMonday + "T00:00:00Z").getTime();
    const weekNum = Math.round((insightMs - cohortMs) / (7 * 24 * 3600 * 1000));

    if (weekNum < 0 || weekNum > 11) continue;

    if (!cohortWeekMap.has(cohortMonday)) cohortWeekMap.set(cohortMonday, new Map());
    if (!cohortAdSets.has(cohortMonday)) cohortAdSets.set(cohortMonday, new Set());
    cohortAdSets.get(cohortMonday)!.add(row.ad_id);

    const weekMap = cohortWeekMap.get(cohortMonday)!;
    const prev = weekMap.get(weekNum) ?? { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0, v3s: 0, thruplays: 0 };
    weekMap.set(weekNum, {
      spend: prev.spend + (row.spend ?? 0),
      impressions: prev.impressions + (row.impressions ?? 0),
      clicks: prev.clicks + (row.clicks ?? 0),
      purchases: prev.purchases + (row.purchases ?? 0),
      purchaseValue: prev.purchaseValue + (row.purchase_value ?? 0),
      v3s: prev.v3s + (row.video_views_3s ?? 0),
      thruplays: prev.thruplays + (row.video_views_thruplays ?? 0),
    });
  }

  if (!cohortWeekMap.size) return COHORTS[clientId] ?? [];

  return Array.from(cohortWeekMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // newest cohort first
    .map(([cohortMonday, weekMap]) => {
      const adCount = cohortAdSets.get(cohortMonday)?.size ?? 0;
      const weekNums = Array.from(weekMap.keys());
      const maxWeekNum = weekNums.length > 0 ? Math.max(...weekNums) : -1;

      // Dense array of only weeks with data, sorted by week number.
      // CohortTable looks up weeks by the `week` property (not array index).
      const weeks: AdCohort["weeks"] = [];
      for (const [w, agg] of weekMap.entries()) {
        if (w < 0 || w > 11) continue;
        const hookRate = agg.impressions > 0 ? (agg.v3s / agg.impressions) * 100 : 0;
        const holdRate = agg.impressions > 0 ? (agg.thruplays / agg.impressions) * 100 : 0;
        const ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
        const cpm = agg.impressions > 0 ? (agg.spend / agg.impressions) * 1000 : 0;
        const cpa = agg.purchases > 0 ? agg.spend / agg.purchases : 0;
        const roas = agg.spend > 0 ? agg.purchaseValue / agg.spend : 0;
        weeks.push({ week: w, weekNumber: w, spend: agg.spend, impressions: agg.impressions, hookRate, holdRate, ctr, cpm, cpa, roas });
      }
      weeks.sort((a, b) => a.week - b.week);

      return {
        cohortDate: cohortMonday,
        label: formatWeekRangeLabel(cohortMonday),
        adCount,
        weeks,
      };
    });
}

export async function getCreativeChurn(
  clientId: string
): Promise<CreativeChurnPoint[]> {
  const { data: weeklyData } = await supabase
    .from("meta_ad_weekly")
    .select("ad_id, week_start, spend")
    .eq("client_id", clientId)
    .gte("week_start", daysAgo(90))
    .gt("spend", 0);

  if (!weeklyData?.length) return [];

  // Same first-spend-week logic as getCohorts
  const firstSpendMap = new Map<string, string>();
  for (const row of weeklyData) {
    const current = firstSpendMap.get(row.ad_id);
    if (!current || row.week_start < current) {
      firstSpendMap.set(row.ad_id, row.week_start);
    }
  }

  // (calendar_week_start → cohort_label → spend)
  const byWeek = new Map<string, Map<string, number>>();

  for (const row of weeklyData) {
    const firstSpend = firstSpendMap.get(row.ad_id);
    if (!firstSpend) continue;
    const cohortLabel = formatWeekRangeLabel(getMondayOf(firstSpend));
    if (!byWeek.has(row.week_start)) byWeek.set(row.week_start, new Map());
    const cm = byWeek.get(row.week_start)!;
    cm.set(cohortLabel, (cm.get(cohortLabel) ?? 0) + (row.spend ?? 0));
  }

  // Collect all cohort labels across all weeks
  const allCohortLabels = new Set<string>();
  for (const cm of byWeek.values()) {
    for (const label of cm.keys()) allCohortLabels.add(label);
  }

  // Fill all weeks from min to max (no gaps) and ensure every cohort has a value (0 if missing)
  const sortedWeeks = Array.from(byWeek.keys()).sort();
  if (!sortedWeeks.length) return [];

  const allWeeks: string[] = [];
  const cursor = new Date(sortedWeeks[0] + "T00:00:00Z");
  const maxDate = new Date(sortedWeeks[sortedWeeks.length - 1] + "T00:00:00Z");
  while (cursor <= maxDate) {
    allWeeks.push(cursor.toISOString().split("T")[0]);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return allWeeks.map((weekStart) => {
    const cohortData = byWeek.get(weekStart) ?? new Map<string, number>();
    const point: CreativeChurnPoint = { month: formatWeekLabel(weekStart) };
    for (const label of allCohortLabels) {
      point[label] = cohortData.get(label) ?? 0;
    }
    return point;
  });
}

// ─── Monthly Reach (aggregated from weekly rows) ──────────────────────────────

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  const shortYear = year.slice(2); // "2025" → "25"
  return `${months[parseInt(month) - 1]}. ${shortYear}`;
}

export async function getMonthlyReachData(
  clientId: string,
  lookbackDays = 90
): Promise<MonthlyReachRow[]> {
  // Exclude current calendar month (incomplete) and weeks started < 7 days ago
  const currentMonthStart = new Date().toISOString().substring(0, 7) + "-01";

  const { data, error } = await supabase
    .from("meta_reach_weekly")
    .select("week_start,weekly_reach,cumulative_reach,net_new_reach,pct_net_new,spend,cpm,cpm_net_new,frequency")
    .eq("client_id", clientId)
    .eq("lookback_days", lookbackDays)
    .not("synced_at", "is", null)           // only rows from current algorithm (old rows have NULL)
    .lt("week_start", currentMonthStart)    // exclude current month entirely
    .lte("week_start", daysAgo(6))          // only complete weeks (started ≥7 days ago)
    .order("week_start", { ascending: true }); // oldest first for grouping

  if (error || !data?.length) return [];

  // Group rows by YYYY-MM
  const groups = new Map<string, typeof data>();
  for (const row of data) {
    const monthKey = row.week_start.substring(0, 7); // "2025-10"
    if (!groups.has(monthKey)) groups.set(monthKey, []);
    groups.get(monthKey)!.push(row);
  }

  const result: MonthlyReachRow[] = [];

  for (const [monthKey, rows] of groups.entries()) {
    // Last week in month (data is ascending, so last element is newest)
    const lastRow = rows[rows.length - 1];

    const rollingReach = lastRow.cumulative_reach ?? 0;
    const monthlyReach = lastRow.weekly_reach ?? 0;

    const totalNetNew = rows.reduce((s, r) => s + (r.net_new_reach ?? 0), 0);
    const totalSpend = rows.reduce((s, r) => s + (r.spend ?? 0), 0);
    const avgCpm = rows.reduce((s, r) => s + (r.cpm ?? 0), 0) / rows.length;
    const avgFrequency = rows.reduce((s, r) => s + (r.frequency ?? 0), 0) / rows.length;

    // Average per-week % (each week's netNew/weeklyReach is correct for its own 7-day window)
    const netNewPct = rows.reduce((s, r) => s + (r.pct_net_new ?? 0), 0) / rows.length;
    const cpmNetNew = totalNetNew > 0 ? totalSpend / (totalNetNew / 1000) : 0;

    result.push({
      monthLabel: formatMonthLabel(monthKey),
      monthKey,
      rollingReach,
      monthlyReach,
      netNew: totalNetNew,
      netNewPct: parseFloat(netNewPct.toFixed(1)),
      spend: totalSpend,
      cpm: parseFloat(avgCpm.toFixed(2)),
      cpmNetNew: parseFloat(cpmNetNew.toFixed(2)),
      frequency: parseFloat(avgFrequency.toFixed(2)),
    });
  }

  // Return newest-first
  return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

// ─── Weekly Reach (for table display) ───────────────────────────────────────

export async function getWeeklyReachData(
  clientId: string,
  lookbackDays = 0,
  periodWeeks = 13, // default ~3 months
): Promise<WeeklyReachRow[]> {
  const { data, error } = await supabase
    .from("meta_reach_weekly")
    .select("week_start,weekly_reach,cumulative_reach,net_new_reach,pct_net_new,spend,cpm_net_new,frequency")
    .eq("client_id", clientId)
    .eq("lookback_days", lookbackDays)
    .not("synced_at", "is", null)
    .lte("week_start", daysAgo(6)) // only complete weeks
    .order("week_start", { ascending: false })
    .limit(periodWeeks);

  if (error || !data?.length) return [];

  return data.map((r) => ({
    weekLabel: formatWeekLabel(r.week_start),
    weekStart: r.week_start,
    reach: r.cumulative_reach ?? 0,
    weeklyReach: r.weekly_reach ?? 0,
    netNew: r.net_new_reach ?? 0,
    netNewPct: r.pct_net_new ?? 0,
    spend: r.spend ?? 0,
    frequency: r.frequency ?? 0,
    cpmNetNew: r.cpm_net_new ?? 0,
  }));
}

// ─── Lab: fatigue gauge ─────────────────────────────────────────────────────
// Single-screen answer to "is it time for new ads?".
// Three account signals (frequency, % net new, days since launch) + per-ad
// table classifying each active ad as tof/holder/tired/new based on
// spend-share + CPM trends — the two robust indicators per Simpleness wiki.
export async function getFatigueData(clientId: string): Promise<FatigueData> {
  const since = daysAgo(56); // 8 weeks — covers "recent 4w + prior 4w" + launch lookback

  // 1. Per-ad weekly metrics (last 8 weeks)
  const { data: weekly } = await supabase
    .from("meta_ad_weekly")
    .select("ad_id, week_start, spend, impressions")
    .eq("client_id", clientId)
    .gte("week_start", since)
    .gt("spend", 0);

  // 2. Account-level reach metrics (frequency + net new %)
  const { data: reachWeekly } = await supabase
    .from("meta_reach_weekly")
    .select("week_start, frequency, pct_net_new")
    .eq("client_id", clientId)
    .eq("lookback_days", 90)
    .gte("week_start", since)
    .lte("week_start", daysAgo(6))
    .order("week_start", { ascending: true });

  // 3. Ad metadata for active ads
  const adIds = Array.from(new Set((weekly ?? []).map((r) => r.ad_id)));
  const { data: adMeta } = await supabase
    .from("meta_ads")
    .select("ad_id, ad_name, thumbnail_url, created_date")
    .eq("client_id", clientId)
    .in("ad_id", adIds.length ? adIds : ["__none__"]);

  const metaMap = new Map((adMeta ?? []).map((r) => [r.ad_id, r]));

  // 4. All ad created_dates (not just active) — for launch detection
  const { data: allAds } = await supabase
    .from("meta_ads")
    .select("ad_id, created_date")
    .eq("client_id", clientId)
    .gte("created_date", daysAgo(120))
    .not("created_date", "is", null);

  // ─── Compute account signal ──────────────────────────────────────────────
  // Recent = last 4 complete weeks; Prior = 4 weeks before that
  const recentRows = (reachWeekly ?? []).slice(-4);
  const priorRows = (reachWeekly ?? []).slice(-8, -4);

  function avg(arr: number[]): number {
    if (!arr.length) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  const frequencyRecent = avg(recentRows.map((r) => r.frequency ?? 0));
  const frequencyPrior = avg(priorRows.map((r) => r.frequency ?? 0));
  const netNewPctRecent = avg(recentRows.map((r) => r.pct_net_new ?? 0));
  const netNewPctPrior = avg(priorRows.map((r) => r.pct_net_new ?? 0));

  // Last launch = most recent week (Monday) where ≥5 ads were created
  const launchByWeek = new Map<string, number>();
  for (const a of allAds ?? []) {
    if (!a.created_date) continue;
    const monday = getMondayOf(a.created_date);
    launchByWeek.set(monday, (launchByWeek.get(monday) ?? 0) + 1);
  }
  let lastLaunchDate: string | null = null;
  let lastLaunchAdCount = 0;
  for (const [monday, count] of launchByWeek.entries()) {
    if (count >= 5 && (!lastLaunchDate || monday > lastLaunchDate)) {
      lastLaunchDate = monday;
      lastLaunchAdCount = count;
    }
  }
  const daysSinceLastLaunch = lastLaunchDate
    ? Math.floor((Date.now() - new Date(lastLaunchDate + "T00:00:00Z").getTime()) / 86400000)
    : null;

  // ─── Compute per-ad weekly trends ────────────────────────────────────────
  // Get the canonical 12-week timeline (most recent first 12 Mondays present in data)
  const weekStarts = Array.from(
    new Set((weekly ?? []).map((r) => getMondayOf(r.week_start)))
  ).sort();
  const recentWeekStarts = weekStarts.slice(-12); // last 12 weeks for sparkline
  const trendWeekStarts = weekStarts.slice(-4);   // last 4 weeks for trend signal

  // Total spend per week (account level) — used for spend share computation
  const accountWeekSpend = new Map<string, number>();
  for (const r of weekly ?? []) {
    const monday = getMondayOf(r.week_start);
    accountWeekSpend.set(monday, (accountWeekSpend.get(monday) ?? 0) + (r.spend ?? 0));
  }

  // Group weekly rows per ad
  const adWeekly = new Map<string, Map<string, { spend: number; impressions: number }>>();
  for (const r of weekly ?? []) {
    const monday = getMondayOf(r.week_start);
    if (!adWeekly.has(r.ad_id)) adWeekly.set(r.ad_id, new Map());
    const inner = adWeekly.get(r.ad_id)!;
    const prev = inner.get(monday) ?? { spend: 0, impressions: 0 };
    inner.set(monday, {
      spend: prev.spend + (r.spend ?? 0),
      impressions: prev.impressions + (r.impressions ?? 0),
    });
  }

  // Build CPM distribution across ads — used for relative TOF threshold.
  // Bottom-third CPM = "below account average for reaching people" = TOF candidate.
  const cpmsForDistribution: number[] = [];
  for (const [, weekMap] of adWeekly.entries()) {
    let totalSpend = 0;
    let totalImpressions = 0;
    for (const [monday, m] of weekMap.entries()) {
      if (!trendWeekStarts.includes(monday)) continue;
      totalSpend += m.spend;
      totalImpressions += m.impressions;
    }
    if (totalSpend > 100 && totalImpressions > 1000) {
      cpmsForDistribution.push((totalSpend / totalImpressions) * 1000);
    }
  }
  cpmsForDistribution.sort((a, b) => a - b);
  const accountMedianCpm =
    cpmsForDistribution.length > 0
      ? cpmsForDistribution[Math.floor(cpmsForDistribution.length / 2)]
      : 0;
  const cpmP33 =
    cpmsForDistribution.length >= 3
      ? cpmsForDistribution[Math.floor(cpmsForDistribution.length / 3)]
      : 0;

  // Build per-ad rows.
  // Trend = relative delta between avg(first half) and avg(last half) of a series.
  // For spend share we keep zero weeks (a zero IS signal — algorithm stopped spending).
  // For CPM we drop zero weeks (no impressions = undefined, not zero).
  function trend(values: number[], dropZeros: boolean): number {
    const series = dropZeros ? values.filter((v) => v > 0) : values;
    if (series.length < 2) return 0;
    const half = Math.max(1, Math.floor(series.length / 2));
    const first = series.slice(0, half);
    const last = series.slice(-half);
    const a = avg(first);
    const b = avg(last);
    if (a <= 0) return b > 0 ? 1 : 0;
    return (b - a) / a;
  }

  const ads: FatigueAdRow[] = [];
  for (const [adId, weekMap] of adWeekly.entries()) {
    const m = metaMap.get(adId);

    // Pad weeks: build full series for last 4 weeks (trend) and last 12 (sparkline)
    const trendWeeks = trendWeekStarts.map((monday) => {
      const data = weekMap.get(monday) ?? { spend: 0, impressions: 0 };
      const totalAccount = accountWeekSpend.get(monday) ?? 0;
      const cpm = data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0;
      const spendShare = totalAccount > 0 ? data.spend / totalAccount : 0;
      return {
        weekStart: monday,
        spend: data.spend,
        spendShare,
        cpm,
        impressions: data.impressions,
      };
    });

    const sparkSpendShare = recentWeekStarts.map((monday) => {
      const data = weekMap.get(monday) ?? { spend: 0, impressions: 0 };
      const totalAccount = accountWeekSpend.get(monday) ?? 0;
      return totalAccount > 0 ? data.spend / totalAccount : 0;
    });
    const sparkCpm = recentWeekStarts.map((monday) => {
      const data = weekMap.get(monday) ?? { spend: 0, impressions: 0 };
      return data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0;
    });

    const spendShareSeries = trendWeeks.map((w) => w.spendShare);
    const cpmSeries = trendWeeks.map((w) => w.cpm);

    const spendShareTrend = trend(spendShareSeries, false);
    const cpmTrend = trend(cpmSeries, true);
    const avgCpm = avg(cpmSeries.filter((v) => v > 0));
    const avgSpendShare = avg(spendShareSeries);
    const totalSpend = trendWeeks.reduce((s, w) => s + w.spend, 0);

    // Skip ads with effectively no activity in last 4 weeks
    if (totalSpend < 50) continue;

    // ─── Status logic ──────────────────────────────────────────────────────
    const activeWeeks = trendWeeks.filter((w) => w.spend > 0).length;

    // Young = created < 14 days ago — too early to judge trend
    const createdDate = m?.created_date;
    const isYoung =
      createdDate &&
      Date.now() - new Date(createdDate + "T00:00:00Z").getTime() < 14 * 86400000;

    let status: FatigueStatus;
    if (isYoung || activeWeeks < 2) {
      status = "new";
    } else if (spendShareTrend <= -0.4 || cpmTrend >= 0.4) {
      // Strong decline: spend share fell ≥40% OR CPM rose ≥40% — sliten
      status = "tired";
    } else if (
      cpmP33 > 0 &&
      avgCpm > 0 &&
      avgCpm <= cpmP33 &&
      avgSpendShare >= 0.01 &&
      spendShareTrend >= -0.2
    ) {
      // CPM in bottom third of account distribution + ≥1% spend share + not heavily declining = TOF gold
      status = "tof";
    } else {
      status = "holder";
    }

    ads.push({
      adId,
      adName: m?.ad_name ?? adId,
      thumbnailUrl: m?.thumbnail_url ?? "",
      weeks: trendWeeks,
      spendShareTrend,
      cpmTrend,
      avgCpm,
      avgSpendShare,
      totalSpend,
      status,
      spendShareSpark: sparkSpendShare,
      cpmSpark: sparkCpm,
    });
  }

  // Sort: tired first → holder → tof → new; within group, by total spend desc
  const statusOrder: Record<FatigueStatus, number> = { tired: 0, holder: 1, tof: 2, new: 3 };
  ads.sort((a, b) => {
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
    return b.totalSpend - a.totalSpend;
  });

  return {
    account: {
      frequencyRecent,
      frequencyPrior,
      netNewPctRecent,
      netNewPctPrior,
      daysSinceLastLaunch,
      lastLaunchDate,
      lastLaunchAdCount,
      accountMedianCpm,
    },
    ads,
  };
}

// ─── Lab: per-ad weekly trajectory ───────────────────────────────────────────
// Joins meta_ad_weekly (per-ad weekly metrics) with meta_ads (name/thumbnail/
// campaign+adset id) and meta_performance_daily (campaign/adset names).
// Returns one AdLabRow per ad with its weekly trajectory + cohort assignment.
export async function getAdLabData(clientId: string): Promise<AdLabRow[]> {
  const since = daysAgo(90);

  // 1. Per-ad weekly rows (the actual trajectory data)
  const { data: weekly } = await supabase
    .from("meta_ad_weekly")
    .select("ad_id, week_start, spend, impressions, clicks, purchases, purchase_value, video_views_3s, video_views_thruplays")
    .eq("client_id", clientId)
    .gte("week_start", since)
    .gt("spend", 0);

  if (!weekly?.length) return [];

  const adIds = Array.from(new Set(weekly.map((r) => r.ad_id)));

  // 2. Ad metadata (name, thumbnail, format, campaign/adset ids, created_date)
  const { data: meta } = await supabase
    .from("meta_ads")
    .select("ad_id, ad_name, format, thumbnail_url, campaign_id, adset_id, created_date, cohort_date")
    .eq("client_id", clientId)
    .in("ad_id", adIds);

  const metaMap = new Map((meta ?? []).map((r) => [r.ad_id, r]));

  // 3. Campaign + adset names — distinct from meta_performance_daily
  const { data: campaignRows } = await supabase
    .from("meta_performance_daily")
    .select("campaign_id, campaign_name, adset_id, adset_name")
    .eq("client_id", clientId)
    .gte("date", since)
    .not("campaign_id", "is", null);

  const campaignNameMap = new Map<string, string>();
  const adsetNameMap = new Map<string, string>();
  for (const r of campaignRows ?? []) {
    if (r.campaign_id && r.campaign_name && !campaignNameMap.has(r.campaign_id)) {
      campaignNameMap.set(r.campaign_id, r.campaign_name);
    }
    if (r.adset_id && r.adset_name && !adsetNameMap.has(r.adset_id)) {
      adsetNameMap.set(r.adset_id, r.adset_name);
    }
  }

  // 4. Group weekly rows by ad and find first-spend week per ad (cohort assignment)
  const byAd = new Map<string, typeof weekly>();
  for (const row of weekly) {
    if (!byAd.has(row.ad_id)) byAd.set(row.ad_id, []);
    byAd.get(row.ad_id)!.push(row);
  }

  const rows: AdLabRow[] = [];
  for (const [adId, weeks] of byAd.entries()) {
    weeks.sort((a, b) => a.week_start.localeCompare(b.week_start));
    const m = metaMap.get(adId);
    // Cohort = Monday of created_date (real Meta creation time) when we have it.
    // Falls back to first-spend-week — but this collapses pre-window ads onto
    // the window-boundary week, so created_date is strongly preferred.
    const cohortAnchor = m?.created_date ?? m?.cohort_date ?? weeks[0].week_start;
    const cohortDate = getMondayOf(cohortAnchor);
    const cohortLabel = formatWeekRangeLabel(cohortDate);

    const trajectory: AdLabWeek[] = weeks.map((r) => ({
      weekStart: getMondayOf(r.week_start),
      spend: r.spend ?? 0,
      impressions: r.impressions ?? 0,
      clicks: r.clicks ?? 0,
      purchases: r.purchases ?? 0,
      purchaseValue: r.purchase_value ?? 0,
      videoViews3s: r.video_views_3s ?? 0,
      videoViewsThruplays: r.video_views_thruplays ?? 0,
    }));

    const totalSpend = trajectory.reduce((s, w) => s + w.spend, 0);
    const totalPurchases = trajectory.reduce((s, w) => s + w.purchases, 0);
    const totalPurchaseValue = trajectory.reduce((s, w) => s + w.purchaseValue, 0);

    rows.push({
      adId,
      adName: m?.ad_name ?? adId,
      format: (m?.format ?? "unknown") as AdLabRow["format"],
      thumbnailUrl: m?.thumbnail_url ?? "",
      campaignId: m?.campaign_id ?? "",
      campaignName: campaignNameMap.get(m?.campaign_id ?? "") ?? "Ukjent kampanje",
      adsetId: m?.adset_id ?? "",
      adsetName: adsetNameMap.get(m?.adset_id ?? "") ?? "Ukjent ad set",
      cohortDate,
      cohortLabel,
      weeks: trajectory,
      totalSpend,
      totalPurchases,
      totalPurchaseValue,
    });
  }

  return rows.sort((a, b) => b.totalSpend - a.totalSpend);
}
