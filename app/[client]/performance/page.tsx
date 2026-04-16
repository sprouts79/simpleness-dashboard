import { getPerformanceKpis, getSpendTrend, getCampaigns, getPeriodRange, getCompareRange } from "@/lib/db";
import PerformanceClient from "@/components/performance/PerformanceClient";
import { PeriodKey, CompareKey } from "@/lib/types";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "I dag",
  "7d": "Siste 7 dager",
  "30d": "Siste 30 dager",
  prev_month: "Forrige måned",
  "3m": "Siste 3 måneder",
  "6m": "Siste 6 måneder",
  "12m": "Siste 12 måneder",
};

const COMPARE_LABELS: Record<CompareKey, string> = {
  period: "vs forrige periode",
  year: "vs forrige år",
};

export default async function PerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { client: clientId } = await params;
  const sp = await searchParams;

  const period = (sp.period as PeriodKey) || "7d";
  const compare = (sp.compare as CompareKey) || "period";

  const { since, until } = getPeriodRange(period);
  const { compSince, compUntil } = getCompareRange(since, until, compare);

  const periodLabel = PERIOD_LABELS[period] ?? PERIOD_LABELS["7d"];
  const compareLabel = COMPARE_LABELS[compare] ?? COMPARE_LABELS["period"];

  const [kpis, trend, campaigns] = await Promise.all([
    getPerformanceKpis(clientId, since, until, compSince, compUntil, periodLabel, compareLabel),
    getSpendTrend(clientId, since, until),
    getCampaigns(clientId, since, until),
  ]);

  if (!kpis) {
    return (
      <div className="p-8 text-sm text-[rgba(9,10,8,0.4)]">Ingen data.</div>
    );
  }

  return (
    <PerformanceClient
      kpis={kpis}
      trend={trend}
      campaigns={campaigns}
      period={period}
      compare={compare}
    />
  );
}
