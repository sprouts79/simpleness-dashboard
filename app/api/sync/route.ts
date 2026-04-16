/**
 * POST /api/sync
 * Body: { clientId: string }
 *
 * Fetches the last 90 days of data from Meta for the given client
 * and upserts into Supabase. Safe to call repeatedly — idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  fetchDailyInsights,
  fetchAdInsights,
  fetchAdMeta,
} from "@/lib/meta-api";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  const { clientId } = await req.json();
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
  const since = daysAgo(90);
  const until = today();
  const errors: string[] = [];

  // ── 1. Campaign-level daily insights ────────────────────────────────────────
  let performanceSynced = 0;
  try {
    const rows = await fetchDailyInsights(accountId, since, until, "campaign");

    const upsertRows = rows.map((r) => ({
      client_id: clientId,
      date: r.date,
      campaign_id: r.campaignId || null,
      campaign_name: r.campaignName || null,
      adset_id: null,
      adset_name: null,
      spend: r.spend,
      impressions: r.impressions,
      reach: r.reach,
      frequency: r.frequency || null,
      clicks: r.clicks,
      purchases: r.purchases,
      purchase_value: r.purchaseValue,
      cpm: r.cpm || null,
      ctr: r.ctr ? r.ctr / 100 : null, // Meta returns ctr as %, store as decimal
      cpa: r.purchases > 0 ? r.spend / r.purchases : null,
      roas: r.purchaseValue > 0 && r.spend > 0 ? r.purchaseValue / r.spend : null,
    }));

    const { error } = await supabase
      .from("meta_performance_daily")
      .upsert(upsertRows, {
        onConflict: "client_id,date,campaign_id,adset_id",
        ignoreDuplicates: false,
      });

    if (error) errors.push(`performance: ${error.message}`);
    else performanceSynced = upsertRows.length;
  } catch (e: any) {
    errors.push(`performance fetch: ${e.message}`);
  }

  // ── 2. Ad-level lifetime insights + metadata ─────────────────────────────────
  let adsSynced = 0;
  try {
    const [insights, meta] = await Promise.all([
      fetchAdInsights(accountId, since, until),
      fetchAdMeta(accountId),
    ]);

    // Build a map of ad metadata keyed by ad_id
    const metaMap = new Map(meta.map((m) => [m.adId, m]));

    const upsertRows = insights.map((ins) => {
      const m = metaMap.get(ins.adId);
      const createdDate = m?.createdTime
        ? m.createdTime.split("T")[0]
        : null;

      const hookRate =
        ins.impressions > 0
          ? (ins.videoViews3s / ins.impressions) * 100
          : null;
      const holdRate =
        ins.impressions > 0
          ? (ins.videoViewsThruplays / ins.impressions) * 100
          : null;

      return {
        ad_id: ins.adId,
        client_id: clientId,
        ad_name: ins.adName,
        adset_id: ins.adsetId || null,
        campaign_id: ins.campaignId || null,
        created_date: createdDate,
        cohort_date: createdDate,
        format: m?.format ?? null,
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
        roas:
          ins.purchaseValue > 0 && ins.spend > 0
            ? ins.purchaseValue / ins.spend
            : null,
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

  return NextResponse.json({
    ok: errors.length === 0,
    performanceSynced,
    adsSynced,
    since,
    until,
    errors,
  });
}
