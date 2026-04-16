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
  AdCohort,
  CreativeChurnPoint,
  Ad,
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

// Formats "2026-04-09" → "apr. '26"  — avoids toLocaleDateString inconsistencies in Node.js
function formatWeekLabel(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  return `${months[parseInt(month) - 1]}. '${year.slice(-2)}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
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

  // Latest weekly reach % from meta_reach_weekly
  const { data: reachRows } = await supabase
    .from("meta_reach_weekly")
    .select("client_id,pct_net_new,frequency")
    .order("week_start", { ascending: false })
    .limit(clients.length * 3);

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
  clientId: string
): Promise<PerformanceKpis | null> {
  const since30 = daysAgo(30);
  const since60 = daysAgo(60);
  const since7 = daysAgo(7);
  const since14 = daysAgo(14);
  const t = today();
  const t7 = daysAgo(7);
  const t30 = daysAgo(30);

  const { data } = await supabase
    .from("meta_performance_daily")
    .select("date,spend,purchases,purchase_value,impressions,clicks,frequency")
    .eq("client_id", clientId)
    .gte("date", since60)
    .lte("date", t)
    .order("date");

  if (!data?.length) return MOCK_PERFORMANCE_KPIS[clientId] ?? null;

  const curr7 = data.filter((r) => r.date >= since7);
  const prev7 = data.filter((r) => r.date >= since14 && r.date < since7);
  const curr30 = data.filter((r) => r.date >= since30);
  const prev30 = data.filter((r) => r.date >= since60 && r.date < since30);

  const c7 = derivedKpis(aggRows(curr7));
  const p7 = derivedKpis(aggRows(prev7));
  const c30 = derivedKpis(aggRows(curr30));
  const p30 = derivedKpis(aggRows(prev30));

  return {
    spend: c30.spend,
    spendDeltaWow: pctDelta(c7.spend, p7.spend),
    spendDeltaMom: pctDelta(c30.spend, p30.spend),
    roas: c30.roas,
    roasDeltaWow: pctDelta(c7.roas, p7.roas),
    roasDeltaMom: pctDelta(c30.roas, p30.roas),
    cpa: c30.cpa,
    cpaDeltaWow: pctDelta(c7.cpa, p7.cpa),
    cpaDeltaMom: pctDelta(c30.cpa, p30.cpa),
    cpm: c30.cpm,
    cpmDeltaWow: pctDelta(c7.cpm, p7.cpm),
    cpmDeltaMom: pctDelta(c30.cpm, p30.cpm),
    frequency: c30.frequency,
    frequencyDeltaWow: pctDelta(c7.frequency, p7.frequency),
    ctr: c30.ctr,
    ctrDeltaWow: pctDelta(c7.ctr, p7.ctr),
  };
}

// ─── Spend Trend ─────────────────────────────────────────────────────────────

export async function getSpendTrend(
  clientId: string
): Promise<SpendTrendPoint[]> {
  const { data } = await supabase
    .from("meta_performance_daily")
    .select("date,spend,purchases,purchase_value")
    .eq("client_id", clientId)
    .gte("date", daysAgo(90))
    .lte("date", today())
    .order("date");

  if (!data?.length) return MOCK_SPEND_TREND[clientId] ?? [];

  // Aggregate by date (multiple campaign rows per day → sum)
  const byDate = new Map<string, { spend: number; purchaseValue: number }>();
  for (const r of data) {
    const existing = byDate.get(r.date) ?? { spend: 0, purchaseValue: 0 };
    byDate.set(r.date, {
      spend: existing.spend + (r.spend ?? 0),
      purchaseValue: existing.purchaseValue + (r.purchase_value ?? 0),
    });
  }

  return Array.from(byDate.entries()).map(([date, vals]) => ({
    date,
    spend: Math.round(vals.spend),
    roas: vals.spend > 0 ? parseFloat((vals.purchaseValue / vals.spend).toFixed(2)) : 0,
  }));
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export async function getCampaigns(clientId: string): Promise<Campaign[]> {
  const { data } = await supabase
    .from("meta_performance_daily")
    .select("campaign_id,campaign_name,spend,purchases,purchase_value,impressions,clicks,reach,frequency")
    .eq("client_id", clientId)
    .gte("date", daysAgo(30))
    .lte("date", today())
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
    .sort((a, b) => b.spend - a.spend);
}

// ─── Reach (mock until reach sync is built) ──────────────────────────────────

export async function getReachKpis(clientId: string): Promise<ReachKpis | null> {
  const { data } = await supabase
    .from("meta_reach_weekly")
    .select("*")
    .eq("client_id", clientId)
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
    // Derive format from video signal — stored object_type is unreliable (SHARE = link post, not necessarily carousel)
    format: (r.video_views_3s ?? 0) > 0 ? "video" : "static",
    // Active = actually getting spend (most reliable signal — bypasses parent campaign/adset status)
    status: (r.spend ?? 0) > 0 ? "active" : "paused",
    thumbnailUrl: r.thumbnail_url ?? "",
    hookRate: r.hook_rate ?? 0,
    holdRate: r.hold_rate ?? 0,
    ctr: r.ctr ? r.ctr * 100 : 0, // stored as decimal, display as %
    spend: r.spend ?? 0,
    roas: r.roas ?? 0,
    cpa: r.cpa ?? 0,
    impressions: r.impressions ?? 0,
  }));
}

export async function getCohorts(clientId: string): Promise<AdCohort[]> {
  const { data } = await supabase
    .from("meta_ads")
    .select(
      "cohort_date,created_date,spend,impressions,clicks,purchases,purchase_value,hook_rate,hold_rate,video_views_3s,video_views_thruplays"
    )
    .eq("client_id", clientId)
    .gt("spend", 0);

  if (!data?.length) return COHORTS[clientId] ?? [];

  // Group by cohort month (YYYY-MM)
  const groups = new Map<string, typeof data>();
  for (const ad of data) {
    const key = (ad.cohort_date ?? ad.created_date ?? "").substring(0, 7);
    if (!key || key.length < 7) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ad);
  }

  if (!groups.size) return COHORTS[clientId] ?? [];

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // newest first
    .map(([key, ads]) => {
      const totalSpend = ads.reduce((s, a) => s + (a.spend ?? 0), 0);
      const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0);
      const totalClicks = ads.reduce((s, a) => s + (a.clicks ?? 0), 0);
      const totalPurchases = ads.reduce((s, a) => s + (a.purchases ?? 0), 0);
      const totalPurchaseValue = ads.reduce((s, a) => s + (a.purchase_value ?? 0), 0);
      const totalV3s = ads.reduce((s, a) => s + (a.video_views_3s ?? 0), 0);
      const totalThruplays = ads.reduce((s, a) => s + (a.video_views_thruplays ?? 0), 0);

      const hookRate = totalImpressions > 0 ? (totalV3s / totalImpressions) * 100 : 0;
      const holdRate = totalImpressions > 0 ? (totalThruplays / totalImpressions) * 100 : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
      const roas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;

      const [year, month] = key.split("-");
      const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("no-NO", {
        month: "short",
        year: "numeric",
      });

      return {
        cohortDate: key + "-01",
        label,
        adCount: ads.length,
        weeks: [
          {
            week: 0, // W0 = lifetime aggregate (weekly breakdown requires ad-level daily data)
            spend: totalSpend,
            impressions: totalImpressions,
            hookRate,
            holdRate,
            ctr,
            cpm,
            cpa,
            roas,
          },
        ],
      };
    });
}

export async function getCreativeChurn(
  clientId: string
): Promise<CreativeChurnPoint[]> {
  // Creative churn requires ad-level daily spend data which isn't synced yet.
  // Return empty — the chart is hidden when churnData is empty.
  return [];
}
