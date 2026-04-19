/**
 * Meta Marketing API client — server-only.
 * Uses System User Token. All values come back as strings from Meta; parsed here.
 */

const BASE = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.META_SYSTEM_USER_TOKEN!;
}

// Attribution windows applied to all action/conversion metrics.
// 7d_click = 7-day click-through, 1d_view = 1-day view-through, 1d_ev = 1-day engaged view (Reels/Stories).
// Change here to update globally — no other code needs to change.
const ATTRIBUTION_WINDOWS = ["7d_click", "1d_view", "1d_ev"];
const ATTRIBUTION_PARAM = `&action_attribution_windows=${encodeURIComponent(JSON.stringify(ATTRIBUTION_WINDOWS))}`;

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

// Rate limit codes that trigger a back-off retry.
// 4 = application-level; 80004 = per-account ads management rate limit.
const RATE_LIMIT_CODES = new Set([4, 80004]);

// Fetch a single URL with up to 2 retries on rate-limit errors.
async function fetchWithRetry(url: string): Promise<any> {
  let attempts = 0;
  while (true) {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    if (json.error && RATE_LIMIT_CODES.has(json.error.code) && attempts < 2) {
      attempts++;
      await new Promise((r) => setTimeout(r, 30_000 * attempts));
      continue;
    }
    return json;
  }
}

// Paginate through all cursor pages and return every item.
// Retries up to 2 times on rate-limit errors with 30s back-off.
async function paginate<T>(initialUrl: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = initialUrl;
  while (next) {
    const json = await fetchWithRetry(next);
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
  const url = `${BASE}/${accountId}/insights?fields=${fields}&time_range=${timeRange}&time_increment=1&level=${level}&limit=500${ATTRIBUTION_PARAM}&access_token=${token()}`;

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
  const coreUrl = `${BASE}/${accountId}/insights?fields=${coreFields}&time_range=${timeRange}&level=ad&limit=200${ATTRIBUTION_PARAM}&access_token=${token()}`;

  const rows = await paginate<any>(coreUrl);

  // Fetch thruplays separately to avoid oversized requests
  const videoFields = "ad_id,video_thruplay_watched_actions";
  const videoUrl = `${BASE}/${accountId}/insights?fields=${videoFields}&time_range=${timeRange}&level=ad&limit=200${ATTRIBUTION_PARAM}&access_token=${token()}`;
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
  // Step 1: Fetch ads including archived (they may still have spend in the insight window).
  const fields = ["id", "name", "adset_id", "campaign_id", "status", "created_time", "creative"].join(",");
  const effectiveStatus = encodeURIComponent(JSON.stringify(["ACTIVE", "PAUSED", "ARCHIVED", "CAMPAIGN_PAUSED", "ADSET_PAUSED"]));
  const url = `${BASE}/${accountId}/ads?fields=${fields}&effective_status=${effectiveStatus}&limit=500&access_token=${token()}`;
  const rows = await paginate<any>(url);

  const creativeIds = [...new Set(
    rows.map((r: any) => r.creative?.id as string | undefined).filter(Boolean)
  )] as string[];

  // Step 2: Fetch creative data with asset_feed_spec to find the portrait (9:16 stories) asset.
  // Multi-format ads store placement-specific assets in asset_feed_spec, labelled
  // "portrait" for stories/reels and "default" for feed.
  // thumbnail_url is the CDN fallback (center-cropped to requested dimensions).
  const creativeMap = new Map<string, {
    thumbnail_url?: string;
    object_type?: string;
    portrait_hash?: string;   // image hash for static portrait ads
    portrait_video_id?: string; // video ID for video portrait ads
  }>();

  for (let i = 0; i < creativeIds.length; i += 50) {
    const ids = creativeIds.slice(i, i + 50).join(",");
    const json = await fetchWithRetry(
      `${BASE}/?ids=${ids}&fields=object_type,thumbnail_url,asset_feed_spec&thumbnail_width=500&thumbnail_height=889&access_token=${token()}`
    );
    if (!json.error) {
      for (const [id, data] of Object.entries(json)) {
        const d = data as any;
        let portraitHash: string | undefined;
        let portraitVideoId: string | undefined;
        // Look for portrait-labelled image asset
        for (const img of (d.asset_feed_spec?.images ?? [])) {
          const isPortrait = (img.adlabels ?? []).some(
            (l: any) => l.name === "portrait" || l.name === "stories" || l.name === "vertical"
          );
          if (isPortrait && img.hash) { portraitHash = img.hash; break; }
        }
        // Look for portrait-labelled video asset (if no portrait image found)
        if (!portraitHash) {
          for (const vid of (d.asset_feed_spec?.videos ?? [])) {
            const isPortrait = (vid.adlabels ?? []).some(
              (l: any) => l.name === "portrait" || l.name === "stories" || l.name === "vertical"
            );
            if (isPortrait && vid.video_id) { portraitVideoId = vid.video_id; break; }
          }
        }
        creativeMap.set(id, {
          thumbnail_url: d.thumbnail_url,
          object_type: d.object_type,
          portrait_hash: portraitHash,
          portrait_video_id: portraitVideoId,
        });
      }
    }
  }

  // Step 3a: Resolve portrait image hashes → native URLs via adimages endpoint.
  // Uses fetchWithRetry so rate-limit errors back off rather than silently returning empty.
  const portraitHashes = [...new Set(
    [...creativeMap.values()].map((c) => c.portrait_hash).filter(Boolean)
  )] as string[];

  const hashToUrl = new Map<string, string>();
  for (let i = 0; i < portraitHashes.length; i += 50) {
    const batch = portraitHashes.slice(i, i + 50);
    const hashParam = encodeURIComponent(JSON.stringify(batch));
    const json = await fetchWithRetry(
      `${BASE}/${accountId}/adimages?hashes=${hashParam}&fields=hash,url&access_token=${token()}`
    );
    if (!json.error && json.data) {
      for (const img of json.data) {
        if (img.hash && img.url) hashToUrl.set(img.hash, img.url);
      }
    }
  }

  // Step 3b: Resolve portrait video IDs → thumbnail picture URLs (best-effort, permission
  // may be denied by the System User Token — falls back silently to thumbnail_url).
  const portraitVideoIds = [...new Set(
    [...creativeMap.values()].map((c) => c.portrait_video_id).filter(Boolean)
  )] as string[];

  const videoToThumb = new Map<string, string>();
  for (let i = 0; i < portraitVideoIds.length; i += 50) {
    const ids = portraitVideoIds.slice(i, i + 50).join(",");
    const json = await fetchWithRetry(
      `${BASE}/?ids=${ids}&fields=picture&access_token=${token()}`
    );
    if (!json.error) {
      for (const [vid, data] of Object.entries(json)) {
        const d = data as any;
        if (d.picture) videoToThumb.set(vid, d.picture);
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

    // Priority: native portrait image → portrait video thumbnail → CDN thumbnail_url
    const portraitUrl = creative?.portrait_hash ? hashToUrl.get(creative.portrait_hash) : undefined;
    const portraitVideoThumb = creative?.portrait_video_id ? videoToThumb.get(creative.portrait_video_id) : undefined;
    const thumbnailUrl = portraitUrl || portraitVideoThumb || creative?.thumbnail_url || "";

    return {
      adId: r.id,
      adName: r.name,
      adsetId: r.adset_id ?? "",
      campaignId: r.campaign_id ?? "",
      status: (r.status ?? "").toLowerCase(),
      createdTime: r.created_time ?? "",
      thumbnailUrl,
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
 * Fetches weekly reach data using a fixed-window-start methodology.
 *
 * windowStart: fixed for ALL weeks in the period.
 *
 * Setting windowStart = since (period start, 0 extension):
 *   - First week ≈ 100% net new (no one is "previously reached" before the period)
 *   - Each week: net_new = people this week not seen since period start
 *   This is the "Monthly Rolling Reach" default — pure period-based incremental reach.
 *
 * Setting windowStart earlier (extended lookback):
 *   - First week will already have "previously reached" from before the display period
 *   - Net new = truly new vs a longer historical window
 *
 * For each week:
 *   R_full = unique reach over [windowStart, weekEnd]
 *   R_prev = unique reach over [windowStart, weekStart − 1]
 *   net_new = R_full − R_prev  (always ≥ 0)
 */
export async function fetchWeeklyReachRows(
  accountId: string,
  since: string,       // start of display period (fetch weekly metrics from here)
  until: string,
  windowStart: string, // fixed window start for all reach calculations (= since or earlier)
): Promise<WeeklyReachRow[]> {
  // One bulk call for per-week metrics
  const fields = "reach,impressions,spend,frequency";
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `${BASE}/${accountId}/insights?fields=${fields}&time_range=${timeRange}&time_increment=7&level=account&limit=52&access_token=${token()}`;
  const rows = await paginate<any>(url);

  // Process weeks in batches of 4 to avoid hitting Meta's rate limit
  // (each week needs 2 API calls; all-parallel on 12+ weeks = 24+ concurrent requests)
  const results: WeeklyReachRow[] = [];
  for (let i = 0; i < rows.length; i += 4) {
    const batch = rows.slice(i, i + 4);
    const batchResults = await Promise.all(
      batch.map(async (r) => {
        const weekStart: string = r.date_start;
        const weekEnd: string = r.date_stop;
        const prevWindowEnd = subtractDays(weekStart, 1);

        const hasPrevWindow = prevWindowEnd >= windowStart;
        const [fullData, prevData] = await Promise.all([
          fetchReach(accountId, windowStart, weekEnd),
          hasPrevWindow
            ? fetchReach(accountId, windowStart, prevWindowEnd)
            : Promise.resolve({ reach: 0, impressions: 0, spend: 0, frequency: 0 }),
        ]);

        return {
          weekStart,
          weekEnd,
          weeklyReach: parseInt(r.reach ?? "0"),
          impressions: parseInt(r.impressions ?? "0"),
          spend: parseFloat(r.spend ?? "0"),
          frequency: parseFloat(r.frequency ?? "0"),
          cumulativeReach: fullData.reach,
          prevWindowReach: prevData.reach,
        };
      })
    );
    results.push(...batchResults);
  }
  return results;
}

// ─── Creative: weekly ad-level insights for cohort analysis ──────────────────

export interface AdWeeklyInsight {
  adId: string;
  weekStart: string; // YYYY-MM-DD (date_start of the 7-day window)
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  videoViews3s: number;
  videoViewsThruplays: number;
}

export async function fetchAdWeeklyInsights(
  accountId: string,
  since: string,
  until: string
): Promise<AdWeeklyInsight[]> {
  const coreFields = [
    "ad_id",
    "spend",
    "impressions",
    "clicks",
    "actions",
    "action_values",
  ].join(",");

  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const coreUrl = `${BASE}/${accountId}/insights?fields=${coreFields}&time_range=${timeRange}&time_increment=7&level=ad&limit=500${ATTRIBUTION_PARAM}&access_token=${token()}`;
  const rows = await paginate<any>(coreUrl);

  // Fetch thruplays separately (same pattern as fetchAdInsights)
  const videoFields = "ad_id,video_thruplay_watched_actions";
  const videoUrl = `${BASE}/${accountId}/insights?fields=${videoFields}&time_range=${timeRange}&time_increment=7&level=ad&limit=500${ATTRIBUTION_PARAM}&access_token=${token()}`;
  let videoRows: any[] = [];
  try {
    videoRows = await paginate<any>(videoUrl);
  } catch {
    // Non-fatal
  }

  // Map: ad_id → week_start → row
  const videoMap = new Map<string, Map<string, any>>();
  for (const r of videoRows) {
    if (!videoMap.has(r.ad_id)) videoMap.set(r.ad_id, new Map());
    videoMap.get(r.ad_id)!.set(r.date_start, r);
  }

  return rows.map((r) => {
    const v = videoMap.get(r.ad_id)?.get(r.date_start);
    return {
      adId: r.ad_id,
      weekStart: r.date_start,
      spend: parseFloat(r.spend ?? "0"),
      impressions: parseInt(r.impressions ?? "0"),
      clicks: parseInt(r.clicks ?? "0"),
      purchases: getMetric(r.actions, "purchase"),
      purchaseValue: getMetric(r.action_values, "purchase"),
      videoViews3s: getMetric(r.actions, "video_view"),
      videoViewsThruplays: getMetric(v?.video_thruplay_watched_actions, "video_view"),
    };
  });
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
