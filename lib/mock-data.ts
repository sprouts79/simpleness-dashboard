import {
  Client,
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

// ─── Clients ────────────────────────────────────────────────────────────────

export const CLIENTS: Client[] = [
  {
    id: "myyk",
    name: "MYYK",
    slug: "myyk",
    metaAccountId: "act_431404084344569",
    status: "yellow",
    weeklySpend: 47800,
  },
  {
    id: "kokkeloren",
    name: "Kokkeløren",
    slug: "kokkeloren",
    metaAccountId: "act_220000000000001",
    status: "green",
    weeklySpend: 28400,
  },
  {
    id: "farfar",
    name: "Far-Far",
    slug: "farfar",
    metaAccountId: "act_330000000000002",
    status: "red",
    weeklySpend: 61200,
  },
];

// ─── Pulse ───────────────────────────────────────────────────────────────────

export const PULSE_DATA: PulseRow[] = [
  {
    client: CLIENTS[0],
    spend7d: 47800,
    spendDelta: 4.2,
    roas: 3.8,
    roasDelta: -9.5,
    cpa: 214,
    cpaDelta: -13.7,
    cpm: 112,
    cpmDelta: 19.1,
    netNewReachPct: 20,
    frequency: 7.8,
  },
  {
    client: CLIENTS[1],
    spend7d: 28400,
    spendDelta: 12.1,
    roas: 5.2,
    roasDelta: 8.3,
    cpa: 148,
    cpaDelta: 6.8,
    cpm: 87,
    cpmDelta: -3.4,
    netNewReachPct: 38,
    frequency: 4.2,
  },
  {
    client: CLIENTS[2],
    spend7d: 61200,
    spendDelta: -6.3,
    roas: 2.4,
    roasDelta: -18.6,
    cpa: 312,
    cpaDelta: 22.4,
    cpm: 134,
    cpmDelta: 28.7,
    netNewReachPct: 14,
    frequency: 9.1,
  },
];

// ─── Performance — MYYK ──────────────────────────────────────────────────────

export const PERFORMANCE_KPIS: Record<string, PerformanceKpis> = {
  myyk: {
    spend: 195400,
    spendDelta: 4.2,
    roas: 3.8,
    roasDelta: -9.5,
    cpa: 214,
    cpaDelta: -13.7,
    cpmn: 312,
    cpmnDelta: 19.1,
    frequency: 7.8,
    frequencyDelta: 3.1,
    ctr: 1.4,
    ctrDelta: -0.2,
    periodLabel: "Siste 7 dager",
    compareLabel: "vs forrige periode",
  },
  kokkeloren: {
    spend: 118200,
    spendDelta: 12.1,
    roas: 5.2,
    roasDelta: 8.3,
    cpa: 148,
    cpaDelta: 6.8,
    cpmn: 224,
    cpmnDelta: -3.4,
    frequency: 4.2,
    frequencyDelta: -1.2,
    ctr: 2.1,
    ctrDelta: 0.4,
    periodLabel: "Siste 7 dager",
    compareLabel: "vs forrige periode",
  },
  farfar: {
    spend: 248600,
    spendDelta: -6.3,
    roas: 2.4,
    roasDelta: -18.6,
    cpa: 312,
    cpaDelta: 22.4,
    cpmn: 418,
    cpmnDelta: 28.7,
    frequency: 9.1,
    frequencyDelta: 8.4,
    ctr: 0.9,
    ctrDelta: -0.3,
    periodLabel: "Siste 7 dager",
    compareLabel: "vs forrige periode",
  },
};

function generateSpendTrend(
  days: number,
  baseSpend: number,
  baseRoas: number
): SpendTrendPoint[] {
  const points: SpendTrendPoint[] = [];
  const today = new Date("2026-04-15");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const weekday = d.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const noise = 0.7 + Math.random() * 0.6;
    const weekendMult = isWeekend ? 1.3 : 1.0;
    const spend = Math.round(baseSpend * noise * weekendMult);
    const roasNoise = baseRoas + (Math.random() - 0.5) * 1.2;
    points.push({
      date: d.toISOString().split("T")[0],
      spend,
      roas: Math.max(1.2, parseFloat(roasNoise.toFixed(2))),
    });
  }
  return points;
}

export const SPEND_TREND: Record<string, SpendTrendPoint[]> = {
  myyk: generateSpendTrend(90, 6800, 3.8),
  kokkeloren: generateSpendTrend(90, 4100, 5.2),
  farfar: generateSpendTrend(90, 8600, 2.4),
};

export const CAMPAIGNS: Record<string, Campaign[]> = {
  myyk: [
    {
      id: "c1",
      name: "MOF — PUR — ALL — CC — 2026",
      spend: 118400,
      roas: 4.1,
      cpa: 196,
      cpm: 104,
      frequency: 6.2,
      ctr: 1.6,
      reach: 71108,
      adSets: [
        {
          id: "as1",
          name: "Broad — 25-54 — NO",
          spend: 68200,
          roas: 4.4,
          cpa: 182,
          cpm: 98,
          frequency: 5.8,
          reach: 42000,
        },
        {
          id: "as2",
          name: "Retargeting — 30d",
          spend: 50200,
          roas: 3.7,
          cpa: 214,
          cpm: 112,
          frequency: 6.8,
          reach: 29108,
        },
      ],
    },
    {
      id: "c2",
      name: "PUR — SENGETØY — VÅRKREPP",
      spend: 77000,
      roas: 3.3,
      cpa: 238,
      cpm: 124,
      frequency: 9.8,
      ctr: 1.1,
      reach: 63582,
      adSets: [
        {
          id: "as3",
          name: "Interest — Interiør — 25-44",
          spend: 47000,
          roas: 3.6,
          cpa: 218,
          cpm: 118,
          frequency: 8.4,
          reach: 38000,
        },
        {
          id: "as4",
          name: "Lookalike — Kjøpere — 2%",
          spend: 30000,
          roas: 2.8,
          cpa: 267,
          cpm: 131,
          frequency: 11.8,
          reach: 25582,
        },
      ],
    },
  ],
  kokkeloren: [
    {
      id: "c3",
      name: "PURCH — BROAD — ALWAYS ON",
      spend: 74800,
      roas: 5.8,
      cpa: 132,
      cpm: 79,
      frequency: 3.8,
      ctr: 2.4,
      reach: 89200,
    },
    {
      id: "c4",
      name: "PURCH — RETARG — 7D — SITE",
      spend: 43400,
      roas: 4.4,
      cpa: 168,
      cpm: 96,
      frequency: 4.8,
      ctr: 1.7,
      reach: 28600,
    },
  ],
  farfar: [
    {
      id: "c5",
      name: "SS26 — BROAD — KONVERTERING",
      spend: 142000,
      roas: 2.8,
      cpa: 284,
      cpm: 128,
      frequency: 8.2,
      ctr: 1.0,
      reach: 104000,
    },
    {
      id: "c6",
      name: "RETARG — 14D — ALLE SIDER",
      spend: 62000,
      roas: 1.9,
      cpa: 368,
      cpm: 144,
      frequency: 10.8,
      ctr: 0.7,
      reach: 38400,
    },
    {
      id: "c7",
      name: "TOF — AWARENESS — VIDEO",
      spend: 44600,
      roas: 2.1,
      cpa: 298,
      cpm: 122,
      frequency: 8.4,
      ctr: 0.8,
      reach: 62000,
    },
  ],
};

// ─── Reach ───────────────────────────────────────────────────────────────────

export const REACH_KPIS: Record<string, ReachKpis> = {
  myyk: {
    totalRollingReach: 959000,
    avgNetNewReach: 59000,
    avgNetNewPct: 20.0,
    avgCpmNetNew: 4584.74,
    frequency: 7.8,
    lookbackDays: 180,
  },
  kokkeloren: {
    totalRollingReach: 412000,
    avgNetNewReach: 47000,
    avgNetNewPct: 38.2,
    avgCpmNetNew: 1842.0,
    frequency: 4.2,
    lookbackDays: 180,
  },
  farfar: {
    totalRollingReach: 628000,
    avgNetNewReach: 28000,
    avgNetNewPct: 14.1,
    avgCpmNetNew: 6218.0,
    frequency: 9.1,
    lookbackDays: 180,
  },
};

export const REACH_COMPOSITION: Record<string, ReachCompositionPoint[]> = {
  myyk: [
    { month: "Apr 25", previouslyReached: 88000, netNew: 182000, netNewPct: 67 },
    { month: "Mai 25", previouslyReached: 148000, netNew: 178000, netNewPct: 55 },
    { month: "Jun 25", previouslyReached: 192000, netNew: 164000, netNewPct: 46 },
    { month: "Jul 25", previouslyReached: 218000, netNew: 142000, netNewPct: 39 },
    { month: "Aug 25", previouslyReached: 248000, netNew: 118000, netNewPct: 32 },
    { month: "Sep 25", previouslyReached: 272000, netNew: 98000, netNewPct: 26 },
    { month: "Okt 25", previouslyReached: 288000, netNew: 88000, netNewPct: 23 },
    { month: "Nov 25", previouslyReached: 302000, netNew: 82000, netNewPct: 21 },
    { month: "Des 25", previouslyReached: 318000, netNew: 74000, netNewPct: 19 },
    { month: "Jan 26", previouslyReached: 328000, netNew: 68000, netNewPct: 17 },
    { month: "Feb 26", previouslyReached: 338000, netNew: 62000, netNewPct: 15 },
    { month: "Mar 26", previouslyReached: 342000, netNew: 59000, netNewPct: 15 },
    { month: "Apr 26", previouslyReached: 349000, netNew: 48000, netNewPct: 12 },
  ],
  kokkeloren: [
    { month: "Apr 25", previouslyReached: 24000, netNew: 96000, netNewPct: 80 },
    { month: "Mai 25", previouslyReached: 62000, netNew: 88000, netNewPct: 59 },
    { month: "Jun 25", previouslyReached: 98000, netNew: 74000, netNewPct: 43 },
    { month: "Jul 25", previouslyReached: 118000, netNew: 62000, netNewPct: 34 },
    { month: "Aug 25", previouslyReached: 134000, netNew: 58000, netNewPct: 30 },
    { month: "Sep 25", previouslyReached: 148000, netNew: 54000, netNewPct: 27 },
    { month: "Okt 25", previouslyReached: 158000, netNew: 52000, netNewPct: 25 },
    { month: "Nov 25", previouslyReached: 162000, netNew: 56000, netNewPct: 26 },
    { month: "Des 25", previouslyReached: 168000, netNew: 62000, netNewPct: 27 },
    { month: "Jan 26", previouslyReached: 174000, netNew: 58000, netNewPct: 25 },
    { month: "Feb 26", previouslyReached: 182000, netNew: 52000, netNewPct: 22 },
    { month: "Mar 26", previouslyReached: 188000, netNew: 48000, netNewPct: 20 },
    { month: "Apr 26", previouslyReached: 194000, netNew: 44000, netNewPct: 18 },
  ],
  farfar: [
    { month: "Apr 25", previouslyReached: 112000, netNew: 88000, netNewPct: 44 },
    { month: "Mai 25", previouslyReached: 168000, netNew: 62000, netNewPct: 27 },
    { month: "Jun 25", previouslyReached: 214000, netNew: 48000, netNewPct: 18 },
    { month: "Jul 25", previouslyReached: 248000, netNew: 38000, netNewPct: 13 },
    { month: "Aug 25", previouslyReached: 272000, netNew: 32000, netNewPct: 11 },
    { month: "Sep 25", previouslyReached: 288000, netNew: 28000, netNewPct: 9 },
    { month: "Okt 25", previouslyReached: 298000, netNew: 24000, netNewPct: 7 },
    { month: "Nov 25", previouslyReached: 308000, netNew: 22000, netNewPct: 7 },
    { month: "Des 25", previouslyReached: 318000, netNew: 18000, netNewPct: 5 },
    { month: "Jan 26", previouslyReached: 322000, netNew: 16000, netNewPct: 5 },
    { month: "Feb 26", previouslyReached: 328000, netNew: 14000, netNewPct: 4 },
    { month: "Mar 26", previouslyReached: 334000, netNew: 12000, netNewPct: 3 },
    { month: "Apr 26", previouslyReached: 338000, netNew: 10000, netNewPct: 3 },
  ],
};

export const REACH_TABLE: Record<string, ReachMonthRow[]> = {
  myyk: [
    { month: "Apr 25", rollingReach: 270000, weeklyReach: 182000, netNew: 182000, netNewPct: 67, spend: 148200, cpm: 62, cpmNetNew: 814, frequency: 2.4 },
    { month: "Mai 25", rollingReach: 326000, weeklyReach: 178000, netNew: 116000, netNewPct: 55, spend: 162400, cpm: 78, cpmNetNew: 1400, frequency: 3.8 },
    { month: "Jun 25", rollingReach: 356000, weeklyReach: 164000, netNew: 92000, netNewPct: 46, spend: 154800, cpm: 88, cpmNetNew: 1682, frequency: 4.4 },
    { month: "Jul 25", rollingReach: 360000, weeklyReach: 142000, netNew: 74000, netNewPct: 39, spend: 118600, cpm: 94, cpmNetNew: 1602, frequency: 4.6 },
    { month: "Aug 25", rollingReach: 366000, weeklyReach: 118000, netNew: 58000, netNewPct: 32, spend: 142200, cpm: 102, cpmNetNew: 2452, frequency: 5.8 },
    { month: "Sep 25", rollingReach: 370000, weeklyReach: 98000, netNew: 48000, netNewPct: 26, spend: 168400, cpm: 108, cpmNetNew: 3508, frequency: 6.4 },
    { month: "Okt 25", rollingReach: 376000, weeklyReach: 88000, netNew: 44000, netNewPct: 23, spend: 184200, cpm: 114, cpmNetNew: 4186, frequency: 7.2 },
    { month: "Nov 25", rollingReach: 384000, weeklyReach: 82000, netNew: 42000, netNewPct: 21, spend: 198600, cpm: 118, cpmNetNew: 4729, frequency: 7.8 },
    { month: "Des 25", rollingReach: 392000, weeklyReach: 74000, netNew: 36000, netNewPct: 19, spend: 224800, cpm: 124, cpmNetNew: 6244, frequency: 8.6 },
    { month: "Jan 26", rollingReach: 396000, weeklyReach: 68000, netNew: 32000, netNewPct: 17, spend: 188200, cpm: 112, cpmNetNew: 5881, frequency: 7.4 },
    { month: "Feb 26", rollingReach: 400000, weeklyReach: 62000, netNew: 29000, netNewPct: 15, spend: 178400, cpm: 114, cpmNetNew: 6152, frequency: 7.6 },
    { month: "Mar 26", rollingReach: 401000, weeklyReach: 59000, netNew: 27000, netNewPct: 15, spend: 192400, cpm: 112, cpmNetNew: 7126, frequency: 8.1 },
    { month: "Apr 26", rollingReach: 397000, weeklyReach: 48000, netNew: 19000, netNewPct: 12, spend: 48200, cpm: 118, cpmNetNew: 2537, frequency: 8.4 },
  ],
  kokkeloren: [],
  farfar: [],
};

// ─── Creative Cohorts ─────────────────────────────────────────────────────────

const makeWeeks = (
  hookBase: number,
  holdBase: number,
  ctrBase: number,
  cpmBase: number,
  cpaBase: number,
  roasBase: number,
  spendBase: number,
  numWeeks: number
): import("./types").CohortWeekData[] => {
  return Array.from({ length: numWeeks }, (_, w) => {
    const decay = Math.pow(0.88, w);
    const spendDecay = w < 2 ? 1 + w * 0.3 : Math.pow(0.82, w - 2);
    return {
      week: w,
      weekNumber: w,
      spend: Math.round(spendBase * spendDecay * (0.85 + Math.random() * 0.3)),
      hookRate: Math.max(4, hookBase * decay * (0.88 + Math.random() * 0.24)),
      holdRate: Math.max(2, holdBase * decay * (0.88 + Math.random() * 0.24)),
      ctr: Math.max(0.3, ctrBase * decay * (0.9 + Math.random() * 0.2)),
      cpm: cpmBase * (1 + w * 0.04) * (0.92 + Math.random() * 0.16),
      cpa: cpaBase * (1 + w * 0.06) * (0.9 + Math.random() * 0.2),
      roas: Math.max(1.0, roasBase * decay * (0.9 + Math.random() * 0.2)),
      impressions: Math.round((spendBase * spendDecay * 1000) / cpmBase),
    };
  });
};

export const COHORTS: Record<string, AdCohort[]> = {
  myyk: [
    { cohortDate: "2025-09-01", label: "Uke 36", adCount: 4, weeks: makeWeeks(38, 18, 1.8, 104, 196, 4.2, 28000, 8) },
    { cohortDate: "2025-10-06", label: "Uke 41", adCount: 6, weeks: makeWeeks(42, 21, 2.0, 108, 188, 4.4, 34000, 7) },
    { cohortDate: "2025-11-03", label: "Uke 45", adCount: 5, weeks: makeWeeks(36, 16, 1.6, 112, 208, 4.0, 42000, 6) },
    { cohortDate: "2025-12-01", label: "Uke 49", adCount: 7, weeks: makeWeeks(29, 12, 1.2, 124, 242, 3.6, 48000, 5) },
    { cohortDate: "2026-01-05", label: "Uke 2", adCount: 5, weeks: makeWeeks(44, 22, 2.1, 106, 184, 4.6, 36000, 4) },
    { cohortDate: "2026-02-02", label: "Uke 6", adCount: 8, weeks: makeWeeks(48, 24, 2.4, 102, 176, 4.8, 38000, 3) },
    { cohortDate: "2026-03-02", label: "Uke 10", adCount: 6, weeks: makeWeeks(52, 26, 2.6, 98, 168, 5.1, 44000, 2) },
  ],
  kokkeloren: [
    { cohortDate: "2025-10-06", label: "Uke 41", adCount: 3, weeks: makeWeeks(56, 28, 2.8, 82, 142, 5.8, 22000, 7) },
    { cohortDate: "2025-11-03", label: "Uke 45", adCount: 5, weeks: makeWeeks(62, 31, 3.1, 78, 136, 6.1, 28000, 6) },
    { cohortDate: "2025-12-01", label: "Uke 49", adCount: 4, weeks: makeWeeks(48, 24, 2.4, 88, 158, 5.2, 32000, 5) },
    { cohortDate: "2026-01-05", label: "Uke 2", adCount: 6, weeks: makeWeeks(68, 34, 3.4, 74, 128, 6.6, 24000, 4) },
    { cohortDate: "2026-02-02", label: "Uke 6", adCount: 4, weeks: makeWeeks(72, 36, 3.6, 72, 122, 6.9, 26000, 3) },
    { cohortDate: "2026-03-02", label: "Uke 10", adCount: 7, weeks: makeWeeks(78, 39, 3.9, 68, 116, 7.2, 28000, 2) },
  ],
  farfar: [
    { cohortDate: "2025-08-04", label: "Uke 32", adCount: 8, weeks: makeWeeks(28, 12, 1.0, 128, 298, 2.8, 48000, 9) },
    { cohortDate: "2025-09-01", label: "Uke 36", adCount: 6, weeks: makeWeeks(24, 10, 0.9, 132, 318, 2.6, 52000, 8) },
    { cohortDate: "2025-10-06", label: "Uke 41", adCount: 9, weeks: makeWeeks(32, 14, 1.2, 126, 288, 2.9, 58000, 7) },
    { cohortDate: "2025-11-03", label: "Uke 45", adCount: 7, weeks: makeWeeks(26, 11, 1.0, 134, 308, 2.7, 62000, 6) },
    { cohortDate: "2025-12-01", label: "Uke 49", adCount: 5, weeks: makeWeeks(22, 9, 0.8, 142, 342, 2.4, 68000, 5) },
    { cohortDate: "2026-01-05", label: "Uke 2", adCount: 8, weeks: makeWeeks(34, 15, 1.3, 124, 278, 3.0, 54000, 4) },
    { cohortDate: "2026-02-02", label: "Uke 6", adCount: 6, weeks: makeWeeks(38, 17, 1.4, 118, 264, 3.2, 48000, 3) },
    { cohortDate: "2026-03-02", label: "Uke 10", adCount: 10, weeks: makeWeeks(42, 19, 1.6, 114, 252, 3.4, 44000, 2) },
  ],
};

// Creative Churn chart data — spend per cohort per month
export function getCreativeChurnData(clientId: string): CreativeChurnPoint[] {
  const cohorts = COHORTS[clientId] ?? [];
  const months = ["Sep 25", "Okt 25", "Nov 25", "Des 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26"];

  return months.map((month) => {
    const point: CreativeChurnPoint = { month };
    cohorts.forEach((cohort) => {
      const cohortStartMonth = cohort.label;
      const cohortMonthIdx = months.indexOf(cohortStartMonth);
      const currentMonthIdx = months.indexOf(month);
      const weekIdx = currentMonthIdx - cohortMonthIdx;
      if (weekIdx >= 0 && weekIdx < cohort.weeks.length) {
        point[cohort.label] = cohort.weeks[weekIdx].spend;
      }
    });
    return point;
  });
}

// ─── Ad Gallery ─────────────────────────────────────────────────────────────

const AD_NAMES_MYYK = [
  "UGC — Sengegavl — Strikk — V1",
  "UGC — Sengegavl — Strikk — V2",
  "Static — Produkt — Hvit — Vårpris",
  "Video — Unboxing — Kunde — 15s",
  "Carousel — Kolleksjon — SS26",
  "UGC — Sofabord — Natur — V1",
  "Static — Lifestyle — Stue — Kvadrat",
  "Video — Brand — 30s — Reels",
  "Static — Produkt — Sort — SS26",
  "UGC — Seng — Hvit — V3",
  "Carousel — Soverom — Pakke",
  "Video — Testimonial — Kunde — 20s",
];

export const ADS: Record<string, Ad[]> = {
  myyk: AD_NAMES_MYYK.map((name, i) => {
    const formats: Ad["format"][] = ["video", "static", "carousel", "video", "carousel", "video", "static", "video", "static", "video", "carousel", "video"];
    const statuses: Ad["status"][] = ["active", "active", "active", "active", "paused", "active", "paused", "active", "active", "active", "active", "active"];
    const cohortDates = ["2026-03-01", "2026-03-01", "2026-02-01", "2026-03-01", "2026-01-01", "2026-02-01", "2026-01-01", "2026-03-01", "2026-02-01", "2026-03-01", "2026-01-01", "2026-02-01"];
    const hookRates = [52, 41, 0, 38, 0, 67, 0, 44, 0, 58, 0, 31];
    const holdRates = [24, 18, 0, 16, 0, 29, 0, 21, 0, 26, 0, 14];
    return {
      id: `myyk-ad-${i + 1}`,
      name,
      cohortDate: cohortDates[i],
      format: formats[i],
      status: statuses[i],
      thumbnailUrl: "",
      hookRate: hookRates[i],
      holdRate: holdRates[i],
      ctr: parseFloat((0.8 + Math.random() * 2.2).toFixed(2)),
      cpm: Math.round(80 + Math.random() * 80),
      spend: Math.round(8000 + Math.random() * 42000),
      roas: parseFloat((2.2 + Math.random() * 3.4).toFixed(2)),
      cpa: Math.round(140 + Math.random() * 180),
      impressions: Math.round(40000 + Math.random() * 280000),
    };
  }),
  kokkeloren: [],
  farfar: [],
};
