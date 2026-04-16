/**
 * Meta Marketing API client — server-only.
 * Uses System User Token. All values come back as strings from Meta; parsed here.
 */

const BASE = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.META_SYSTEM_USER_TOKEN!;
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
  const fields = [
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
    "video_thruplay_watched_actions",
  ].join(",");

  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `${BASE}/${accountId}/insights?fields=${fields}&time_range=${timeRange}&level=ad&limit=500&access_token=${token()}`;

  const rows = await paginate<any>(url);

  return rows.map((r) => ({
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
    videoViewsThruplays: getMetric(r.video_thruplay_watched_actions, "video_view"),
    ctr: parseFloat(r.ctr ?? "0"),
    cpm: parseFloat(r.cpm ?? "0"),
  }));
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
  const fields = [
    "id",
    "name",
    "adset_id",
    "campaign_id",
    "status",
    "created_time",
    "creative{thumbnail_url,object_type}",
  ].join(",");

  const url = `${BASE}/${accountId}/ads?fields=${fields}&limit=200&access_token=${token()}`;
  const rows = await paginate<any>(url);

  return rows.map((r) => {
    const objectType: string = r.creative?.object_type ?? "";
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
      thumbnailUrl: r.creative?.thumbnail_url ?? "",
      format,
    };
  });
}

// ─── Reach: weekly rolling reach ─────────────────────────────────────────────

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
