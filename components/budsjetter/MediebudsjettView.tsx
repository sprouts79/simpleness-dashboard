"use client";

import clsx from "clsx";

// --------------------------------------------------------------------------
// Mediebudsjett = detaljering av total mkt-spend.
// Hver "kanal-kategori" er en kombinasjon av kanal × kampanjetype × MER-tier.
// Brand / Always-on / Salg / Search — dekker prosent-andel av total spend.
// Hardkodet for Kokkeløren — andre kunder får sin egen miks.
// --------------------------------------------------------------------------

type MerTier = "Lav" | "Medium" | "Høy" | "Høyest";

interface ChannelMix {
  id: string;
  navn: string;             // f.eks. "Brand Campaign"
  kanaler: string[];        // f.eks. ["YouTube", "Podcast", "SoMe"]
  formål: string;           // f.eks. "Awareness"
  pctOfTotal: number;       // 0..1
  merTier: MerTier;
  // Kvartals-aktivitet (visualisering): array av 4 tall (0/1) for tilstedeværelse per kvartal
  quarters: [number, number, number, number];
  beskrivelse: string;
}

interface ClientMediabudgetConfig {
  arligSpend: number;
  miks: ChannelMix[];
}

const CONFIG: Record<string, ClientMediabudgetConfig> = {
  kokkeloren: {
    arligSpend: 1_656_000,
    miks: [
      {
        id: "brand",
        navn: "Brand Campaign",
        kanaler: ["YouTube", "Podcast", "SoMe"],
        formål: "Awareness",
        pctOfTotal: 0.10,
        merTier: "Lav",
        quarters: [1, 0, 0, 1],
        beskrivelse:
          "Bygger kjennskap og demand. Bredt publikum som ikke aktivt søker kategori. Lang horisont — knytter merket til behov.",
      },
      {
        id: "ao",
        navn: "Always-on Full Funnel",
        kanaler: ["SoMe", "Google"],
        formål: "Awareness → Consideration → Conversion",
        pctOfTotal: 0.60,
        merTier: "Medium",
        quarters: [1, 1, 1, 1],
        beskrivelse:
          "Demand-motoren. Adapterer budskap, produkt og moments gjennom året. Driver mest av inkrementell vekst over tid.",
      },
      {
        id: "salg",
        navn: "Sale",
        kanaler: ["SoMe", "Google"],
        formål: "Conversion",
        pctOfTotal: 0.20,
        merTier: "Høy",
        quarters: [1, 1, 1, 1],
        beskrivelse:
          "Kortsiktig aktivering med pris/tilbud. Treffer kjøpsklare audiences i tidsavgrensa vinduer.",
      },
      {
        id: "search",
        navn: "Always-on Search & Shopping",
        kanaler: ["Google", "Chat GPT / Grok"],
        formål: "Conversion",
        pctOfTotal: 0.10,
        merTier: "Høyest",
        quarters: [1, 1, 1, 1],
        beskrivelse:
          "Fanger eksisterende intent — høy effektivitet, men typisk lav inkrementell effekt.",
      },
    ],
  },
};

function fmtNok(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "–";
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} k`;
  }
  return Math.round(n).toLocaleString("nb-NO");
}

const MER_COLORS: Record<MerTier, string> = {
  "Lav":     "bg-neutral-100 text-neutral-700 border-neutral-200",
  "Medium":  "bg-blue-50 text-blue-700 border-blue-200",
  "Høy":     "bg-amber-50 text-amber-700 border-amber-200",
  "Høyest":  "bg-[#dff7cc] text-[#3b8d0a] border-[#41bd0e]/30",
};

const PURPOSE_COLOR: Record<string, string> = {
  brand:  "bg-[#dff7cc]/70",
  ao:     "bg-[#dff7cc]/70",
  salg:   "bg-amber-200/70",
  search: "bg-[#dff7cc]/70",
};

export default function MediebudsjettView({ clientId }: { clientId: string }) {
  const cfg = CONFIG[clientId];
  if (!cfg) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 max-w-2xl">
        <p className="text-sm text-neutral-600">
          Ingen mediebudsjett-config for <span className="font-medium">{clientId}</span> ennå.
        </p>
      </div>
    );
  }

  const totalPct = cfg.miks.reduce((s, m) => s + m.pctOfTotal, 0);
  const totalSpend = cfg.miks.reduce((s, m) => s + m.pctOfTotal * cfg.arligSpend, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Mediebudsjett 2026
        </span>
        <span className="text-sm text-neutral-700">
          Total mkt-spend: <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{fmtNok(cfg.arligSpend)} kr</span>
        </span>
      </div>

      {/* Tabell — kanalmiks */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <Th align="left" w="w-44">Kategori / kanaler</Th>
              <Th align="left" w="w-44">Formål</Th>
              <Th align="left">Q1</Th>
              <Th align="left">Q2</Th>
              <Th align="left">Q3</Th>
              <Th align="left">Q4</Th>
              <Th w="w-20">Andel</Th>
              <Th w="w-32">Spend</Th>
              <Th w="w-20">MER</Th>
            </tr>
          </thead>
          <tbody>
            {cfg.miks.map((m) => {
              const spend = m.pctOfTotal * cfg.arligSpend;
              return (
                <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-neutral-900">{m.navn}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{m.kanaler.join(" · ")}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-700 align-top leading-snug">
                    {m.formål}
                  </td>
                  {m.quarters.map((q, i) => (
                    <td key={i} className="px-2 py-3 align-top">
                      {q === 1 ? (
                        <div className={clsx("rounded h-5 w-full min-w-[40px]", PURPOSE_COLOR[m.id] ?? "bg-neutral-200")} />
                      ) : (
                        <div className="h-5" />
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-neutral-900 align-top" style={{ fontFamily: "var(--font-mono)" }}>
                    {(m.pctOfTotal * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-700 align-top" style={{ fontFamily: "var(--font-mono)" }}>
                    {fmtNok(spend)} kr
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className={clsx("text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", MER_COLORS[m.merTier])}>
                      {m.merTier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-neutral-50 border-t border-neutral-200">
            <tr>
              <td className="px-4 py-2.5 font-bold text-neutral-900" colSpan={6}>Sum</td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{(totalPct * 100).toFixed(0)}%</td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{fmtNok(totalSpend)} kr</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Beskrivelser per kategori */}
      <section>
        <h3 className="section-title mb-3">Hva hver kategori gjør</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cfg.miks.map((m) => (
            <div key={m.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-sm font-semibold text-neutral-900">{m.navn}</p>
                <span className={clsx("text-[10px] font-medium px-1.5 py-0.5 rounded border", MER_COLORS[m.merTier])}>
                  MER {m.merTier}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-2">{m.kanaler.join(" · ")} — {m.formål}</p>
              <p className="text-xs text-neutral-700 leading-snug">{m.beskrivelse}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-neutral-500 max-w-2xl">
        <strong className="text-neutral-700">Brand Campaign</strong> skaper etterspørsel,{" "}
        <strong className="text-neutral-700">Always-on Full Funnel</strong> fanger og dyrker den,{" "}
        <strong className="text-neutral-700">Sale</strong> akselererer i kortvinduer, og{" "}
        <strong className="text-neutral-700">Search</strong> konverterer eksisterende intent.
      </p>
    </div>
  );
}

function Th({ children, align = "right", w }: { children: React.ReactNode; align?: "left" | "right"; w?: string }) {
  return (
    <th className={clsx(
      align === "left" ? "text-left px-4" : "text-right px-3",
      "py-2.5 text-xs font-medium text-neutral-500",
      w,
    )}>
      {children}
    </th>
  );
}
