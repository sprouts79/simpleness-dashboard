/**
 * Data layer — server-only.
 * Fetches from Supabase and merges with mock metrics where real data isn't yet available.
 * When Meta API goes live, replace the mock sections below with real queries.
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
  PERFORMANCE_KPIS,
  SPEND_TREND,
  CAMPAIGNS,
  REACH_KPIS,
  REACH_COMPOSITION,
  REACH_TABLE,
  COHORTS,
  getCreativeChurnData,
  ADS,
} from "./mock-data";

// ─── Clients (Supabase) ──────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, slug, meta_account_id, status")
    .order("name");

  if (error || !data?.length) {
    return MOCK_CLIENTS;
  }

  return data.map((row) => {
    const mock = MOCK_CLIENTS.find((c) => c.id === row.id);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      metaAccountId: row.meta_account_id ?? "",
      status: row.status as ClientStatus,
      // weeklySpend from real data once Meta API is live
      weeklySpend: mock?.weeklySpend ?? 0,
    };
  });
}

export async function getClient(slug: string): Promise<Client | undefined> {
  const clients = await getClients();
  return clients.find((c) => c.slug === slug);
}

// ─── Pulse (mock metrics, real client info) ──────────────────────────────────

export async function getPulseData(): Promise<PulseRow[]> {
  const clients = await getClients();

  return clients.map((client) => {
    const mock = MOCK_PULSE.find((p) => p.client.id === client.id);
    if (!mock) {
      return {
        client,
        spend7d: 0,
        spendDelta: 0,
        roas: 0,
        roasDelta: 0,
        cpa: 0,
        cpaDelta: 0,
        cpm: 0,
        cpmDelta: 0,
        netNewReachPct: 0,
        frequency: 0,
      };
    }
    // Use real status from DB, mock metrics until Meta API is live
    return { ...mock, client };
  });
}

// ─── Performance (mock — replace when Meta API is live) ─────────────────────

export async function getPerformanceKpis(
  clientId: string
): Promise<PerformanceKpis | null> {
  return PERFORMANCE_KPIS[clientId] ?? null;
}

export async function getSpendTrend(
  clientId: string
): Promise<SpendTrendPoint[]> {
  return SPEND_TREND[clientId] ?? [];
}

export async function getCampaigns(clientId: string): Promise<Campaign[]> {
  return CAMPAIGNS[clientId] ?? [];
}

// ─── Reach (mock — replace when Meta API is live) ────────────────────────────

export async function getReachKpis(
  clientId: string
): Promise<ReachKpis | null> {
  return REACH_KPIS[clientId] ?? null;
}

export async function getReachComposition(
  clientId: string
): Promise<ReachCompositionPoint[]> {
  return REACH_COMPOSITION[clientId] ?? [];
}

export async function getReachTable(
  clientId: string
): Promise<ReachMonthRow[]> {
  return REACH_TABLE[clientId] ?? [];
}

// ─── Creative (mock — replace when Meta API is live) ─────────────────────────

export async function getCohorts(clientId: string): Promise<AdCohort[]> {
  return COHORTS[clientId] ?? [];
}

export async function getCreativeChurn(
  clientId: string
): Promise<CreativeChurnPoint[]> {
  return getCreativeChurnData(clientId);
}

export async function getAds(clientId: string): Promise<Ad[]> {
  return ADS[clientId] ?? [];
}
