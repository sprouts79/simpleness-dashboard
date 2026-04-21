/**
 * GET /api/cron/sync
 *
 * Called daily by Vercel Cron. Syncs performance + ads + reach for all active clients.
 * Vercel automatically passes Authorization: Bearer <CRON_SECRET> — we verify it.
 *
 * Schedule: daily at 06:00 UTC (08:00 CET / 08:00 CEST)
 * Meta data for the previous day is typically fully settled by then.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  fetchDailyInsights,
  fetchAdInsights,
  fetchAdMeta,
  fetchWeeklyReachRows,
  fetchAdWeeklyInsights,
  fetchAccountTimezone,
  daysAgoInTz,
} from "@/lib/meta-api";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all clients with a Meta account ID
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id, meta_account_id")
    .not("meta_account_id", "is", null);

  if (clientErr || !clients?.length) {
    return NextResponse.json({ error: "No clients found" }, { status: 500 });
  }

  const results: Record<string, { ok: boolean; adsSynced?: number; performanceSynced?: number; reachSynced?: number; cohortSynced?: number; error?: string }> = {};

  for (const client of clients) {
    try {
      const tz = await fetchAccountTimezone(client.meta_account_id);
      const since = daysAgoInTz(365, tz); // 12 months of performance data
      const until = daysAgoInTz(1, tz);

      // ── Performance ────────────────────────────────────────────────────────
      const perfRows = await fetchDailyInsights(client.meta_account_id, since, until, "campaign");
      const perfUpsert = perfRows.map((r) => ({
        client_id: client.id,
        date: r.date,
        campaign_id: r.campaignId || "",
        campaign_name: r.campaignName || null,
        adset_id: r.adsetId || "",
        adset_name: r.adsetName || null,
        spend: r.spend,
        impressions: r.impressions,
        reach: r.reach,
        frequency: r.frequency || null,
        clicks: r.clicks,
        purchases: r.purchases,
        purchase_value: r.purchaseValue,
        cpm: r.cpm || null,
        ctr: r.ctr ? r.ctr / 100 : null,
        cpa: r.purchases > 0 ? r.spend / r.purchases : null,
        roas: r.purchaseValue > 0 && r.spend > 0 ? r.purchaseValue / r.spend : null,
      }));
      await supabase
        .from("meta_performance_daily")
        .upsert(perfUpsert, { onConflict: "client_id,date,campaign_id,adset_id", ignoreDuplicates: false });

      // ── Ads + creatives ────────────────────────────────────────────────────
      const insights = await fetchAdInsights(client.meta_account_id, since, until);
      const adIds = insights.map((ins) => ins.adId);
      const meta = await fetchAdMeta(client.meta_account_id, adIds);
      const metaMap = new Map(meta.map((m) => [m.adId, m]));
      const adsUpsert = insights.map((ins) => {
        const m = metaMap.get(ins.adId);
        const createdDate = m?.createdTime ? m.createdTime.split("T")[0] : null;
        const hookRate = ins.impressions > 0 ? (ins.videoViews3s / ins.impressions) * 100 : null;
        const holdRate = ins.impressions > 0 ? (ins.videoViewsThruplays / ins.impressions) * 100 : null;
        return {
          ad_id: ins.adId,
          client_id: client.id,
          ad_name: ins.adName,
          adset_id: ins.adsetId || null,
          campaign_id: ins.campaignId || null,
          created_date: createdDate,
          cohort_date: createdDate,
          format: m?.format ?? (ins.videoViews3s > 0 ? "video" : "static"),
          thumbnail_url: m?.thumbnailUrl ?? null,
          status: m?.status ?? null,
          spend: ins.spend,
          impressions: ins.impressions,
          reach: ins.reach,
          clicks: ins.clicks,
          purchases: ins.purchases,
          purchase_value: ins.purchaseValue,
          video_views_3s: ins.videoViews3s,
          video_views_thruplays: ins.videoViewsThruplays,
          hook_rate: hookRate,
          hold_rate: holdRate,
          ctr: ins.ctr ? ins.ctr / 100 : null,
          cpm: ins.cpm || null,
          cpa: ins.purchases > 0 ? ins.spend / ins.purchases : null,
          roas: ins.purchaseValue > 0 && ins.spend > 0 ? ins.purchaseValue / ins.spend : null,
          refreshed_at: new Date().toISOString(),
        };
      });
      await supabase
        .from("meta_ads")
        .upsert(adsUpsert, { onConflict: "ad_id,client_id" });

      // ── Reach ──────────────────────────────────────────────────────────────
      // 6-month display period + 90-day lookback baseline before the display period
      const reachSince = daysAgoInTz(180, tz);
      const windowStart = daysAgoInTz(270, tz); // 180 + 90 = 270
      const weeklyRows = await fetchWeeklyReachRows(client.meta_account_id, reachSince, until, windowStart);
      const reachUpsert = weeklyRows.map((r) => {
        const netNew = Math.max(0, r.cumulativeReach - r.prevWindowReach);
        const cpm = r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0;
        const cpmNetNew = netNew > 0 ? r.spend / (netNew / 1000) : 0;
        const pctNetNew = r.weeklyReach > 0 ? (netNew / r.weeklyReach) * 100 : 0;
        return {
          client_id: client.id,
          week_start: r.weekStart,
          weekly_reach: r.weeklyReach,
          cumulative_reach: r.cumulativeReach,
          net_new_reach: netNew,
          pct_net_new: pctNetNew,
          spend: r.spend,
          cpm,
          cpm_net_new: cpmNetNew,
          frequency: r.frequency,
          lookback_days: 90,
          synced_at: new Date().toISOString(),
        };
      });
      await supabase
        .from("meta_reach_weekly")
        .upsert(reachUpsert, { onConflict: "client_id,week_start,lookback_days" });

      // ── Cohort (weekly ad-level insights for cohort table + top ads) ──────────
      const cohortSince = daysAgoInTz(84, tz); // 12 weeks
      const weeklyInsights = await fetchAdWeeklyInsights(client.meta_account_id, cohortSince, until);
      const cohortUpsert = weeklyInsights.map((ins) => {
        const hookRate = ins.impressions > 0 ? (ins.videoViews3s / ins.impressions) * 100 : null;
        const holdRate = ins.impressions > 0 ? (ins.videoViewsThruplays / ins.impressions) * 100 : null;
        return {
          ad_id: ins.adId,
          client_id: client.id,
          week_start: ins.weekStart,
          spend: ins.spend,
          impressions: ins.impressions,
          clicks: ins.clicks,
          purchases: ins.purchases,
          purchase_value: ins.purchaseValue,
          video_views_3s: ins.videoViews3s,
          video_views_thruplays: ins.videoViewsThruplays,
          hook_rate: hookRate,
          hold_rate: holdRate,
          ctr: ins.impressions > 0 ? ins.clicks / ins.impressions : null,
          cpm: ins.impressions > 0 ? (ins.spend / ins.impressions) * 1000 : null,
          cpa: ins.purchases > 0 ? ins.spend / ins.purchases : null,
          roas: ins.purchaseValue > 0 && ins.spend > 0 ? ins.purchaseValue / ins.spend : null,
          synced_at: new Date().toISOString(),
        };
      });
      await supabase
        .from("meta_ad_weekly")
        .upsert(cohortUpsert, { onConflict: "ad_id,week_start" });

      results[client.id] = {
        ok: true,
        performanceSynced: perfUpsert.length,
        adsSynced: adsUpsert.length,
        reachSynced: reachUpsert.length,
        cohortSynced: cohortUpsert.length,
      };
    } catch (e: any) {
      results[client.id] = { ok: false, error: e.message };
    }
  }

  return NextResponse.json({ ok: true, synced_at: new Date().toISOString(), results });
}
