/**
 * POST /api/sync
 * Body: { clientId: string, syncType?: "all" | "performance" | "ads" | "reach" | "cohort", months?: number, lookbackDays?: number }
 *
 * syncType="all":         performance + ads + reach (default)
 * syncType="performance": only daily campaign insights
 * syncType="ads":         only ad insights + creatives
 * syncType="reach":       only weekly reach rows
 * syncType="cohort":      only weekly ad-level data for cohort analysis (12 weeks)
 *
 * Safe to call repeatedly — idempotent.
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
  dateInTz,
} from "@/lib/meta-api";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { clientId, months, lookbackDays = 0, syncType = "all" } = await req.json();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Get client from Supabase
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, meta_account_id")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.meta_account_id) {
    return NextResponse.json(
      { error: "No meta_account_id for this client" },
      { status: 422 }
    );
  }

  const accountId = client.meta_account_id;

  const tz = await fetchAccountTimezone(accountId);
  const since = daysAgoInTz(90, tz);
  const until = dateInTz(new Date(), tz);
  const errors: string[] = [];

  let performanceSynced = 0;
  let adsSynced = 0;
  let cohortSynced = 0;

  // ── 1. Performance ───────────────────────────────────────────────────────────
  if (syncType === "all" || syncType === "performance") {
    try {
      const rows = await fetchDailyInsights(accountId, since, until, "campaign");
      const upsertRows = rows.map((r) => ({
        client_id: clientId,
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
      const { error } = await supabase
        .from("meta_performance_daily")
        .upsert(upsertRows, { onConflict: "client_id,date,campaign_id,adset_id", ignoreDuplicates: false });
      if (error) errors.push(`performance: ${error.message}`);
      else performanceSynced = upsertRows.length;
    } catch (e: any) {
      errors.push(`performance fetch: ${e.message}`);
    }
  }

  // ── 2. Ads + creatives ───────────────────────────────────────────────────────
  if (syncType === "all" || syncType === "ads") {
    try {
      const [insights, meta] = await Promise.all([
        fetchAdInsights(accountId, since, until),
        fetchAdMeta(accountId),
      ]);
      const metaMap = new Map(meta.map((m) => [m.adId, m]));
      const upsertRows = insights.map((ins) => {
        const m = metaMap.get(ins.adId);
        const createdDate = m?.createdTime ? m.createdTime.split("T")[0] : null;
        const hookRate = ins.impressions > 0 ? (ins.videoViews3s / ins.impressions) * 100 : null;
        const holdRate = ins.impressions > 0 ? (ins.videoViewsThruplays / ins.impressions) * 100 : null;
        return {
          ad_id: ins.adId,
          client_id: clientId,
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
      const { error } = await supabase
        .from("meta_ads")
        .upsert(upsertRows, { onConflict: "ad_id,client_id" });
      if (error) errors.push(`ads: ${error.message}`);
      else adsSynced = upsertRows.length;
    } catch (e: any) {
      errors.push(`ads fetch: ${e.message}`);
    }
  }

  let reachSynced = 0;
  if (syncType === "all" || syncType === "reach") try {
    const reachDays = months ? Math.ceil(months * 30.44) + 14 : 91;
    const reachSince = daysAgoInTz(reachDays, tz);
    // windowStart: fixed for all weeks. lookbackDays = extension BEFORE the display period.
    // 0 = no extension (windowStart = periodStart, first week ≈ 100% net new)
    const windowStart = daysAgoInTz(reachDays + lookbackDays, tz);
    const weeklyRows = await fetchWeeklyReachRows(accountId, reachSince, until, windowStart);

    const upsertRows = weeklyRows.map((r) => {
      const netNew = Math.max(0, r.cumulativeReach - r.prevWindowReach);
      const cpm = r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0;
      const cpmNetNew = netNew > 0 ? r.spend / (netNew / 1000) : 0;
      const pctNetNew = r.weeklyReach > 0 ? (netNew / r.weeklyReach) * 100 : 0;
      return {
        client_id: clientId,
        week_start: r.weekStart,
        weekly_reach: r.weeklyReach,
        cumulative_reach: r.cumulativeReach,
        net_new_reach: netNew,
        pct_net_new: pctNetNew,
        spend: r.spend,
        cpm,
        cpm_net_new: cpmNetNew,
        frequency: r.frequency,
        lookback_days: lookbackDays,
        synced_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from("meta_reach_weekly")
      .upsert(upsertRows, { onConflict: "client_id,week_start,lookback_days" });

    if (error) errors.push(`reach: ${error.message}`);
    else reachSynced = upsertRows.length;
  } catch (e: any) {
    errors.push(`reach fetch: ${e.message}`);
  }

  // ── 4. Cohort (weekly ad-level insights) ─────────────────────────────────────
  if (syncType === "cohort") try {
    const cohortSince = daysAgoInTz(84, tz); // 12 weeks back
    const weeklyInsights = await fetchAdWeeklyInsights(accountId, cohortSince, until);

    const upsertRows = weeklyInsights.map((ins) => {
      const hookRate = ins.impressions > 0 ? (ins.videoViews3s / ins.impressions) * 100 : null;
      const holdRate = ins.impressions > 0 ? (ins.videoViewsThruplays / ins.impressions) * 100 : null;
      return {
        ad_id: ins.adId,
        client_id: clientId,
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

    const { error } = await supabase
      .from("meta_ad_weekly")
      .upsert(upsertRows, { onConflict: "ad_id,week_start" });

    if (error) errors.push(`cohort: ${error.message}`);
    else cohortSynced = upsertRows.length;
  } catch (e: any) {
    errors.push(`cohort fetch: ${e.message}`);
  }

  return NextResponse.json({
    ok: errors.length === 0,
    performanceSynced,
    adsSynced,
    reachSynced,
    cohortSynced,
    since,
    until,
    errors,
  });
}
