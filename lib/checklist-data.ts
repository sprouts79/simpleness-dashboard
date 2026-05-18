// checklist-data.ts
// Alle seksjoner og sjekkpunkter for Tilstandsanalyse.
// Dette er datakilden — komponenten leser herfra.
// Rediger denne filen for å legge til, fjerne eller endre punkter.

export type Priority = "p1" | "p2" | "hygiene" | "viktig";

export type TrackingMode = "gtm" | "shopify" | "begge";

export interface CheckItem {
  id: string;
  label: string;
  note?: string; // kort kursiv forklaring — kun der det er kritisk
  priority?: Priority;
  trackingMode?: "gtm" | "shopify"; // vises kun i denne modusen
  defaultChecked?: boolean;
}

export interface SubSection {
  id: string;
  label: string;
  items: CheckItem[];
}

export interface Section {
  id: string;
  num: string;
  icon: string; // Tabler icon name, f.eks. 'ti-shield-check'
  title: string;
  subsections: SubSection[];
  channelKey?: "snap"; // brukes for å grå ut hele seksjonen per kunde
}

export const CHECKLIST: Section[] = [
  {
    id: "gdpr",
    num: "01",
    icon: "ti-shield-check",
    title: "Samtykke & GDPR",
    subsections: [
      {
        id: "gdpr-main",
        label: "",
        items: [
          { id: "gdpr-01", label: "CMP aktiv — ingen scripts fyrer før samtykke er gitt", priority: "p1" },
          { id: "gdpr-02", label: "Consent Mode v2 aktivert", priority: "p1" },
          { id: "gdpr-03", label: "CAPI sender kun for brukere som har samtykket til markedsføring", priority: "p1" },
          { id: "gdpr-04", label: "Data Processing Terms akseptert hos Meta og Google", priority: "p1" },
          { id: "gdpr-05", label: "Personvernerklæring nevner Meta, Google og Snap ved navn", priority: "p1" },
        ],
      },
    ],
  },

  {
    id: "sporing",
    num: "02",
    icon: "ti-code",
    title: "Nettsted & sporing",
    subsections: [
      {
        id: "sporing-gtm",
        label: "GTM",
        items: [
          { id: "sporing-01", label: "Installert på alle sider — inkludert ekstern kasse", trackingMode: "gtm" },
          { id: "sporing-02", label: "Ingen duplikate tags, utdaterte triggers eller gammel byrå-kode", priority: "hygiene", trackingMode: "gtm" },
        ],
      },
      {
        id: "sporing-shopify",
        label: "Shopify integrasjon",
        items: [
          { id: "sporing-03", label: "Meta-appen koblet til riktig pixel-ID", trackingMode: "shopify" },
          { id: "sporing-04", label: "Google & YouTube-appen koblet til GA4 og Google Ads", trackingMode: "shopify" },
          { id: "sporing-05", label: "Ingen duplikat pixel — ikke både app og hardkodet tag for samme kanal", priority: "p1", trackingMode: "shopify" },
        ],
      },
    ],
  },

  {
    id: "datalag",
    num: "03",
    icon: "ti-layers-difference",
    title: "Datalag",
    subsections: [
      {
        id: "datalag-main",
        label: "",
        items: [
          { id: "datalag-01", label: "Kun Google standard events — ingen kanal-spesifikke events i koden", priority: "p1" },
          {
            id: "datalag-02",
            label: "item_id sender variant-ID — ikke produkt-ID eller SKU",
            note: "variant_id i Shopify = feed `id` = content_ids i Meta",
            priority: "p1",
          },
          { id: "datalag-03", label: "Alle events fyrer: view_item, add_to_cart, begin_checkout, purchase" },
          { id: "datalag-04", label: "Purchase: én gang per ordre, riktig verdi og valuta" },
          { id: "datalag-05", label: "Manuell reconciliering: 3–5 kjøp verifisert mot Events Manager", priority: "p1" },
        ],
      },
    ],
  },

  {
    id: "feed",
    num: "04",
    icon: "ti-packages",
    title: "Produktfeed",
    subsections: [
      {
        id: "feed-struktur",
        label: "ID og struktur",
        items: [
          { id: "feed-01", label: "feed `id` = variant-ID — konsistent på tvers av alle kanaler", priority: "p1" },
          { id: "feed-02", label: "`link` peker til riktig domene", priority: "p1" },
          { id: "feed-03", label: "Én rad per variant — `id` unik, `item_group_id` felles per produkt" },
        ],
      },
      {
        id: "feed-varianter",
        label: "Varianter & bilder",
        items: [
          { id: "feed-04", label: "`color` og `size` som egne felt per variant — ikke bare i tittel", priority: "p2" },
          { id: "feed-05", label: "`image_link` variant-spesifikk — riktig farge per variant, min. 1024×1024px" },
          { id: "feed-06", label: "`additional_image_link`: min. 4 per produkt — ulike vinkler og livsstil", priority: "p2" },
        ],
      },
      {
        id: "feed-felt",
        label: "Felt",
        items: [
          { id: "feed-07", label: "`title`: merke + produktnavn + type + farge", priority: "p2" },
          { id: "feed-08", label: "`description`: ren tekst — ingen HTML", priority: "p1" },
          { id: "feed-09", label: "`gtin`/EAN satt på alle produkter", priority: "p1" },
          { id: "feed-10", label: "`gender` differensiert — ikke unisex på alt", priority: "p2" },
        ],
      },
      {
        id: "feed-video",
        label: "Video",
        items: [
          { id: "feed-11", label: "`video[0].url` satt på topp-produkter — start med 20+ SKUs", priority: "viktig" },
          { id: "feed-12", label: "Dynamic Media aktivert i Meta Commerce Manager", priority: "viktig" },
        ],
      },
      {
        id: "feed-teknisk",
        label: "Teknisk",
        items: [
          { id: "feed-13", label: "Feed oppdateres minimum daglig" },
        ],
      },
    ],
  },

  {
    id: "google",
    num: "05",
    icon: "ti-brand-google",
    title: "Google",
    subsections: [
      {
        id: "google-sporing",
        label: "Sporing",
        items: [
          { id: "google-01", label: "GA4 purchase: riktig verdi og unik ordre-ID" },
          { id: "google-02", label: "Enhanced Conversions aktivert med hashet brukerdata", priority: "p1" },
          { id: "google-03", label: "Kun én konverteringskilde — ikke dobbelt (GA4-import og direkte tag)", priority: "p2" },
        ],
      },
      {
        id: "google-mc",
        label: "Merchant Center",
        items: [
          { id: "google-04", label: "Ingen aktive avvisninger" },
          { id: "google-05", label: "Feed `id` matcher `item_id` i GA4-eventet", priority: "p1" },
        ],
      },
    ],
  },

  {
    id: "meta",
    num: "06",
    icon: "ti-brand-meta",
    title: "Meta",
    subsections: [
      {
        id: "meta-sporing",
        label: "Sporing",
        items: [
          { id: "meta-01", label: "Pixel: ViewContent, AddToCart, Purchase med variant-ID og value" },
          { id: "meta-02", label: "CAPI satt opp og aktivt", priority: "p1" },
          { id: "meta-03", label: "Deduplication: identisk event_id i pixel og CAPI" },
          { id: "meta-04", label: "EMQ sjekket i Events Manager — 5–7 normalt i NO/EU, under 5 undersøk", priority: "p2" },
        ],
      },
      {
        id: "meta-katalog",
        label: "Katalog",
        items: [
          { id: "meta-05", label: "Kun én aktiv katalog koblet til annonsekontoen", priority: "hygiene" },
          { id: "meta-06", label: "Katalog oppdateres automatisk — ingen eller få avviste produkter" },
          { id: "meta-07", label: "content_ids matcher katalog `id` — verifiser med farge+størrelse-variant", priority: "p1" },
          { id: "meta-08", label: "Product sets ryddige — slett ubrukte sets", priority: "hygiene" },
        ],
      },
      {
        id: "meta-hygiene",
        label: "Hygiene",
        items: [
          { id: "meta-09", label: "Kun én aktiv pixel — ingen gamle hardkodede eller byråpixler", priority: "p1" },
          { id: "meta-10", label: "Tilganger og domeneverifisering sjekket", priority: "hygiene" },
          { id: "meta-11", label: "Kampanjer pauset 60+ dager er arkivert", priority: "hygiene" },
        ],
      },
    ],
  },

  {
    id: "snap",
    num: "07",
    icon: "ti-ghost",
    title: "Snap",
    channelKey: "snap",
    subsections: [
      {
        id: "snap-sporing",
        label: "Sporing",
        items: [
          { id: "snap-01", label: "Pixel installert + CAPI med client_dedup_id" },
        ],
      },
      {
        id: "snap-katalog",
        label: "Katalog",
        items: [
          { id: "snap-02", label: "Katalog koblet og godkjent — ingen avviste produkter" },
          { id: "snap-03", label: "item_ids matcher feed `id`" },
        ],
      },
    ],
  },
];

// Hjelpefunksjon: hent alle item-IDer flatt
export function getAllItemIds(): string[] {
  return CHECKLIST.flatMap((section) =>
    section.subsections.flatMap((sub) => sub.items.map((item) => item.id)),
  );
}

// Hjelpefunksjon: filtrer aktive items basert på tracking-modus og kanal-config
export function getActiveItemIds(
  trackingMode: TrackingMode,
  snapActive: boolean,
): string[] {
  return CHECKLIST.flatMap((section) => {
    if (section.channelKey === "snap" && !snapActive) return [];
    return section.subsections.flatMap((sub) =>
      sub.items
        .filter((item) => {
          if (!item.trackingMode) return true;
          if (item.trackingMode === "gtm") return trackingMode === "gtm" || trackingMode === "begge";
          if (item.trackingMode === "shopify") return trackingMode === "shopify" || trackingMode === "begge";
          return true;
        })
        .map((item) => item.id),
    );
  });
}

export function getCurrentQuarter(d: Date = new Date()): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}
