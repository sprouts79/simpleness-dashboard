/**
 * Meta Marketing API client — server-only.
 * Uses System User Token. All values come back as strings from Meta; parsed here.
 */

const BASE = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.META_SYSTEM_USER_TOKEN!;
}

// Date helpers — always calculated in the ad account's timezone so they match
// what Meta Ads Manager displays. en-CA locale gives YYYY-MM-DD format.
export function dateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
}

export function daysAgoInTz(n: number, tz: string): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateInTz(d, tz);
}

export async function fetchAccountTimezone(accountId: string): Promise<string> {
  const url = `${BASE}/${accountId}?fields=timezone_name&access_token=${token()}`;
  const res = await fetch(url, { cache: "no-store" });
  const json: any = await res.json();
  return json.timezone_name ?? "UTC";
}

function getMetric(
  arr: { action_type: string; value: string }[] | undefined,
  type: string
): number {
  return parseFloat(arr?.find((a) => a.action_type === type)?.value ?? "0");
}

// Paginate through all cursor pages and return every item
async function paginate<T>(initialUrl: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = initialUrl;
  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    const json: any = await res.json();
    if (json.error) {
      throw new Error(`Meta API error: ${json.error.message} (code ${json.error.code})`);
    }
    results.push(...(json.data ?? []));
    next = json.paging?.next ?? null;
  }
  return results;
}

// ─── Performance: daily campaign/adset insights ──────────────────────────────

export interface DailyInsight {
  campaignId: string;
  campaignName: string;
  adsetId: string;   // '' when fetching at campaign level
  adsetName: string;
  date: string;      // YYYY-MM-DD
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  cpm: number;
  ctr: number;
}

export async function fetchDailyInsights(
  accountId: string,
  since: string,
  until: string,
  level: "campaign" | "adset" = "campaign"
): Promise<DailyInsight[]> {
  const fields = [
    "campaign_id",
    "campaign_name",
    ...(level === "adset" ? ["adset_id", "adset_name"] : []),
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "cpm",
    "ctr",
    "actions",
    "action_values",
  ].join(",");

  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `${BASE}/${accountId}/insights?fields=${fields}&time_range=${timeRange}&time_increment=1&level=${level}&limit=500&access_token=${token()}`;

  const rows = await paginate<any>(url);

  return rows.map((r) => ({
    campaignId: r.campaign_id ?? "",
    campaignName: r.campaign_name ?? "",
    adsetId: r.adset_id ?? "",
    adsetName: r.adset_name ?? "",
    date: r.date_start,
    spend: parseFloat(r.spend ?? "0"),
    impressions: parseInt(r.impressions ?? "0"),
    reach: parseInt(r.reach ?? "0"),
    frequency: parseFloat(r.frequency ?? "0"),
    clicks: parseInt(r.clicks ?? "0"),
    purchases: getMetric(r.actions, "purchase"),
    purchaseValue: getMetric(r.action_values, "purchase"),
    cpm: parseFloat(r.cpm ?? "0"),
    ctr: parseFloat(r.ctr ?? "0"),
  }));
}

// ─── Creative: lifetime ad-level insights ────────────────────────────────────

export interface AdInsight {
  adId: string;
  adName: string;
  adsetId: string;
  campaignId: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  videoViews3s: number;
  videoViewsThruplays: number;
  ctr: number;
  cpm: number;
}

export async function fetchAdInsights(
  accountId: string,
  since: string,
  until: string
): Promise<AdInsight[]> {
  // Split into two requests to avoid Meta's data size limit:
  // 1. Core metrics (spend, impressions, reach, clicks, purchases)
  // 2. Video metrics (thruplays, 3s views via video_view action)
  const coreFields = [
    "ad_id",
    "ad_name",
    "adset_id",
    "campaign_id",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "cpm",
    "ctr",
    "actions",
    "action_values",
  ].join(",");

  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const coreUrl = `${BASE}/${accountId}/insights?fields=${coreFields}&time_range=${timeRange}&level=ad&limit=200&access_token=${token()}`;

  const rows = await paginate<any>(coreUrl);

  // Fetch thruplays separately to avoid oversized requests
  const videoFields = "ad_id,video_thruplay_watched_actions";
  const videoUrl = `${BASE}/${accountId}/insights?fields=${videoFields}&time_range=${timeRange}&level=ad&limit=200&access_token=${token()}`;
  let videoRows: any[] = [];
  try {
    videoRows = await paginate<any>(videoUrl);
  } catch {
    // Non-fatal — thruplays will be 0
  }
  const videoMap = new Map(videoRows.map((r) => [r.ad_id, r]));

  return rows.map((r) => {
    const v = videoMap.get(r.ad_id);
    return {
      adId: r.ad_id,
      adName: r.ad_name,
      adsetId: r.adset_id ?? "",
      campaignId: r.campaign_id ?? "",
      spend: parseFloat(r.spend ?? "0"),
      impressions: parseInt(r.impressions ?? "0"),
      reach: parseInt(r.reach ?? "0"),
      clicks: parseInt(r.clicks ?? "0"),
      purchases: getMetric(r.actions, "purchase"),
      purchaseValue: getMetric(r.action_values, "purchase"),
      videoViews3s: getMetric(r.actions, "video_view"),
      videoViewsThruplays: getMetric(v?.video_thruplay_watched_actions, "video_view"),
      ctr: parseFloat(r.ctr ?? "0"),
      cpm: parseFloat(r.cpm ?? "0"),
    };
  });
}

// ─── Creative: ad metadata (name, status, created_time, format) ──────────────

export interface AdMeta {
  adId: string;
  adName: string;
  adsetId: string;
  campaignId: string;
  status: string;
  createdTime: string; // ISO
  thumbnailUrl: string;
  format: "video" | "static" | "carousel" | "story" | null;
}

export async function fetchAdMeta(accountId: string): Promise<AdMeta[]> {
  // Step 1: Fetch ads with creative IDs only (lightweight — no nested expansion)
  const fields = ["id", "name", "adset_id", "campaign_id", "status", "created_time", "creative{id}"].join(",");
  const url = `${BASE}/${accountId}/ads?fields=${fields}&limit=500&access_token=${token()}`;
  const rows = await paginate<any>(url);

  // Step 2: Batch fetch thumbnail_url + object_type per creative ID (50 at a time)
  const creativeIds = [...new Set(
    rows.map((r: any) => r.creative?.id as string | undefined).filter(Boolean)
  )] as string[];

  const creativeMap = new Map<string, { thumbnail_url?: string; object_type?: string }>();
  for (let i = 0; i < creativeIds.length; i += 50) {
    const ids = creativeIds.slice(i, i + 50).join(",");
    const res = await fetch(
      `${BASE}/?ids=${ids}&fields=thumbnail_url,object_type&thumbnail_width=500&thumbnail_height=889&access_token=${token()}`,
      { cache: "no-store" }
    );
    const json: any = await res.json();
    if (!json.error) {
      for (const [id, data] of Object.entries(json)) {
        creativeMap.set(id, data as { thumbnail_url?: string; object_type?: string });
      }
    }
  }

  return rows.map((r: any) => {
    const creative = creativeMap.get(r.creative?.id);
    const objectType = creative?.object_type ?? "";
    let format: AdMeta["format"] = null;
    if (objectType === "VIDEO") format = "video";
    else if (objectType === "SHARE") format = "carousel";
    else if (objectType === "PHOTO" || objectType === "STATUS") format = "static";

    return {
      adId: r.id,
      adName: r.name,
      adsetId: r.adset_id ?? "",
      campaignId: r.campaign_id ?? "",
      status: (r.status ?? "").toLowerCase(),
      createdTime: r.created_time ?? "",
      thumbnailUrl: creative?.thumbnail_url ?? "",
      format,
    };
  });
}

// ─── Reach: weekly rolling reach ─────────────────────────────────────────────

function subtractDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

export interface WeeklyReachRow {
  weekStart: string;
  weekEnd: string;
  weeklyReach: number;
  impressions: number;
  spend: number;
  frequency: number;
  cumulativeReach: number;  // unique reach over lookbackDays window ending at weekEnd (includes this week)
  prevWindowReach: number;  // unique reach over same window START, ending day before weekStart (excludes this week)
}

/**
 * Fetches weekly reach data using the correct Foxwell/ricky-mba methodology.
 *
 * For each week, two API calls with the SAME window start date:
 *   R_full = unique reach over [weekEnd - (lookbackDays-1), weekEnd]  — includes this week
 *   R_prev = unique reach over [weekEnd - (lookbackDays-1), weekStart - 1] — excludes this week
 *   net_new = R_full - R_prev  (always ≥ 0, always ≤ weeklyReach)
 *
 * This correctly answers: "how many of this week's viewers haven't seen the ad in the past ~90 days?"
 * The sliding-window diff (comparing two different 90d windows) produces false negatives when audiences
 * are stable because people aging out of the trailing end cancel out new entrants.
 */
export async function fetchWeeklyReachRows(
  accountId: string,
  since: string,
  until: string,
  lookbackDays = 90
): Promise<WeeklyReachRow[]> {
  // One bulk call for per-week metrics
  const fields = "reach,impressions,spend,frequency";
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `${BASE}/${accountId}/insights?fields=${fields}&time_range=${timeRange}&time_increment=7&level=account&limit=52&access_token=${token()}`;
  const rows = await paginate<any>(url);

  const result: WeeklyReachRow[] = [];

  for (const r of rows) {
    const weekStart: string = r.date_start;
    const weekEnd: string = r.date_stop;

    // Both calls share the same window start date
    const windowStart = subtractDays(weekEnd, lookbackDays - 1);

    // R_full: 90d reach including this week
    const fullData = await fetchReach(accountId, windowStart, weekEnd);

    // R_prev: same window start, ends the day before this week
    // = reach pool as it existed before this week's impressions
    const prevWindowEnd = subtractDays(weekStart, 1);
    const prevData = await fetchReach(accountId, windowStart, prevWindowEnd);

    result.push({
      weekStart,
      weekEnd,
      weeklyReach: parseInt(r.reach ?? "0"),
      impressions: parseInt(r.impressions ?? "0"),
      spend: parseFloat(r.spend ?? "0"),
      frequency: parseFloat(r.frequency ?? "0"),
      cumulativeReach: fullData.reach,
      prevWindowReach: prevData.reach,
    });
  }

  return result;
}

export interface ReachResult {
  reach: number;
  impressions: number;
  spend: number;
  frequency: number;
}

export async function fetchReach(
  accountId: string,
  since: string,
  until: string
): Promise<ReachResult> {
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `${BASE}/${accountId}/insights?fields=reach,impressions,spend,frequency&time_range=${timeRange}&level=account&access_token=${token()}`;

  const rows = await paginate<any>(url);
  if (!rows.length) return { reach: 0, impressions: 0, spend: 0, frequency: 0 };

  // Account-level comes back as one row for the period
  const r = rows[0];
  return {
    reach: parseInt(r.reach ?? "0"),
    impressions: parseInt(r.impressions ?? "0"),
    spend: parseFloat(r.spend ?? "0"),
    frequency: parseFloat(r.frequency ?? "0"),
  };
}
