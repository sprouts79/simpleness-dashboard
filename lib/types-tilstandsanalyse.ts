/**
 * Klient-trygge typer + sjekkpunkt-katalog for Tilstandsanalyse-modulen.
 * Speiler Leveranser/Performance/Tilstandsanalyse/mockup.html.
 */

// ────────────────────────────────────────────────────────────
// State + versjon
// ────────────────────────────────────────────────────────────

export type AuditVersjon = "draft" | "under_review" | "godkjent" | "arkivert";
export type AuditItemState = "na" | "p1" | "p2" | "wip" | "avsjekk" | "ok" | null;

export const ITEM_STATE_LABEL: Record<NonNullable<AuditItemState> | "open", string> = {
  open:    "Åpen",
  na:      "Mangler tilgang",
  p1:      "Prio 1",
  p2:      "Prio 2",
  wip:     "Jobbes med",
  avsjekk: "Til avsjekk",
  ok:      "OK",
};

/** Visuelle styler — tailwind-klasser for dot + tekst */
export const ITEM_STATE_STYLE: Record<NonNullable<AuditItemState> | "open", { dot: string; bg: string; fg: string }> = {
  open:    { dot: "bg-neutral-300", bg: "bg-neutral-50",  fg: "text-neutral-500" },
  na:      { dot: "bg-neutral-400", bg: "bg-neutral-100", fg: "text-neutral-700" },
  p1:      { dot: "bg-red-500",     bg: "bg-red-50",      fg: "text-red-900" },
  p2:      { dot: "bg-yellow-500",  bg: "bg-yellow-50",   fg: "text-yellow-900" },
  wip:     { dot: "bg-blue-500",    bg: "bg-blue-50",     fg: "text-blue-900" },
  avsjekk: { dot: "bg-purple-500",  bg: "bg-purple-50",   fg: "text-purple-900" },
  ok:      { dot: "bg-green-500",   bg: "bg-green-50",    fg: "text-green-900" },
};

/**
 * Sortering for tiltaksliste i ADMIN — "Til avsjekk" øverst (action ligger på oss).
 */
export function stateSortRankAdmin(s: AuditItemState): number {
  switch (s) {
    case "avsjekk": return 1;
    case "p1":      return 2;
    case "p2":      return 3;
    case "wip":     return 4;
    case "na":      return 5;
    case null:      return 6;
    case "ok":      return 7;
  }
}

/**
 * Sortering for tiltaksliste i KUNDE-view — Prio 1 først (action ligger hos kunde).
 * "Til avsjekk" lavt fordi kunden har gjort sin del og venter på oss.
 */
export function stateSortRank(s: AuditItemState): number {
  switch (s) {
    case "p1":      return 1;
    case "p2":      return 2;
    case "wip":     return 3;
    case "na":      return 4;
    case null:      return 5;
    case "avsjekk": return 6;
    case "ok":      return 7;
  }
}

export function stateKey(s: AuditItemState): "open" | NonNullable<AuditItemState> {
  return s === null ? "open" : s;
}

// ────────────────────────────────────────────────────────────
// Prioritet (Fundament / Anbefales / Optimering)
// ────────────────────────────────────────────────────────────

export type ItemPriority = "f" | "a" | "o";

export const PRIORITY_LABEL: Record<ItemPriority, string> = {
  f: "Fundament",
  a: "Anbefales",
  o: "Optimering",
};

// ────────────────────────────────────────────────────────────
// Tabs + grupper
// ────────────────────────────────────────────────────────────

export type TabId = "sporing" | "produktdata" | "feed";

export const TABS: { id: TabId; title: string }[] = [
  { id: "sporing",     title: "Sporing"     },
  { id: "produktdata", title: "Produktdata" },
  { id: "feed",        title: "Produktfeed" },
];

export type GroupId =
  | "datalag" | "google" | "meta" | "snap"
  | "schema"  | "media"
  | "req"     | "rec"    | "tech";

export const GROUPS: { tab: TabId; id: GroupId; label: string }[] = [
  { tab: "sporing",     id: "datalag", label: "Datalag" },
  { tab: "sporing",     id: "google",  label: "Google" },
  { tab: "sporing",     id: "meta",    label: "Meta" },
  { tab: "sporing",     id: "snap",    label: "Snap" },
  { tab: "produktdata", id: "schema",  label: "Strukturert data" },
  { tab: "produktdata", id: "media",   label: "Bilder og video" },
  { tab: "feed",        id: "req",     label: "Obligatoriske felt" },
  { tab: "feed",        id: "rec",     label: "Anbefalte felt" },
  { tab: "feed",        id: "tech",    label: "Teknisk" },
];

// ────────────────────────────────────────────────────────────
// Sjekkpunkt-katalog (45 stk) — speil av mockup.html
// `t` og `h` kan inneholde <code>-tagger og rendres med dangerouslySetInnerHTML
// (innholdet er forfattet av oss, ikke bruker-input).
// ────────────────────────────────────────────────────────────

export interface Item {
  id: string;
  tab: TabId;
  group: GroupId;
  priority: ItemPriority;
  text: string;
  hint?: string;
}

export const ITEMS: Item[] = [
  // Sporing — Datalag
  { id: "s01", tab: "sporing", group: "datalag", priority: "f",
    text: "Standardhendelser fyrer: view_item, add_to_cart, begin_checkout, purchase",
    hint: "Verifiser i GTM Preview. Sjekk at events sendes med produkt-ID, pris og valuta." },
  { id: "s02", tab: "sporing", group: "datalag", priority: "f",
    text: "Produkt-ID i hendelsene matcher feed-ID eksakt",
    hint: "Sammenlign <code>item_id</code> fra datalag mot <code>g:id</code> i feeden for tre tilfeldige produkter." },
  { id: "s03", tab: "sporing", group: "datalag", priority: "f",
    text: "Purchase fyrer kun én gang per ordre (transaction_id-deduplisering)",
    hint: "Test ved å reloade ordrebekreftelsessiden — kjøpet skal ikke registreres på nytt." },
  { id: "s04", tab: "sporing", group: "datalag", priority: "f",
    text: "GTM installert på alle sider — inkludert ekstern kasse",
    hint: "Gjennomfør testkjøp med GTM Preview aktiv. Sjekk Shopify/Klarna-checkout særskilt." },

  // Sporing — Google
  { id: "s05", tab: "sporing", group: "google", priority: "f",
    text: "GA4 mottar purchase med riktig verdi og unik ordre-ID" },
  { id: "s06", tab: "sporing", group: "google", priority: "f",
    text: "Én kilde for Google Ads-konvertering — ikke både GA4-import og dedikert tag",
    hint: "Velg én — dobbelt-telling gir feil ROAS i PMax." },
  { id: "s07", tab: "sporing", group: "google", priority: "f",
    text: "Google Consent Mode v2 aktivt",
    hint: "Verifiser granted/denied-signaler i Tag Assistant. Påkrevd for annonsering i EØS." },
  { id: "s08", tab: "sporing", group: "google", priority: "a",
    text: "Enhanced Conversions aktivert med user-data (hashet e-post/telefon)" },

  // Sporing — Meta
  { id: "s09", tab: "sporing", group: "meta", priority: "f",
    text: "Meta Pixel sender ViewContent, AddToCart, Purchase med content_ids og value",
    hint: "Verifiser med Meta Pixel Helper: <code>content_ids</code>, <code>content_type: product</code>, <code>value</code>, <code>currency</code>." },
  { id: "s10", tab: "sporing", group: "meta", priority: "f",
    text: "Conversions API (server-side) satt opp",
    hint: "Via Stape.io, Elevar eller direkte integrasjon. Reduserer tap fra adblokkere/ITP." },
  { id: "s11", tab: "sporing", group: "meta", priority: "f",
    text: "Deduplication mellom pixel og CAPI (identisk event_id per kjøp)" },
  { id: "s12", tab: "sporing", group: "meta", priority: "a",
    text: "Event Match Quality (EMQ) over 6,0",
    hint: "Sjekk i Meta Events Manager. Send hashet PII for å forbedre score." },

  // Sporing — Snap
  { id: "s13", tab: "sporing", group: "snap", priority: "f",
    text: "Snap Pixel installert + standard events fyrer (VIEW_CONTENT, ADD_CART, PURCHASE)",
    hint: "Verifiser med Snap Pixel Helper. item_ids må matche Snap-katalog-ID eksakt." },
  { id: "s14", tab: "sporing", group: "snap", priority: "a",
    text: "Snap CAPI satt opp med deduplication (client_dedup_id)" },
  { id: "s15", tab: "sporing", group: "snap", priority: "a",
    text: "Snap-katalog koblet til annonsekontoen (for Dynamic Ads)" },

  // Produktdata — Strukturert data
  { id: "p01", tab: "produktdata", group: "schema", priority: "f",
    text: "Product schema på alle produktsider — pris og lagerstatus",
    hint: "Verifiser med Google Rich Results Test. Ingen valideringsfeil." },
  { id: "p02", tab: "produktdata", group: "schema", priority: "f",
    text: "AggregateRating-markup — gir stjerner i Google-søk",
    hint: "Krever at anmeldelsesappen eksporterer markup korrekt." },
  { id: "p03", tab: "produktdata", group: "schema", priority: "a",
    text: "FAQ-markup på produkt- og FAQ-sider" },
  { id: "p04", tab: "produktdata", group: "schema", priority: "a",
    text: "BreadcrumbList schema på alle kategori- og produktsider" },

  // Produktdata — Bilder og video
  { id: "p05", tab: "produktdata", group: "media", priority: "f",
    text: "Minst 4 bilder per produkt: front, bak, detalj, livsstil" },
  { id: "p06", tab: "produktdata", group: "media", priority: "f",
    text: "Konsistent bakgrunn og format på tvers av sortimentet" },
  { id: "p07", tab: "produktdata", group: "media", priority: "f",
    text: "Hovedbilde min. 1024×1024px med ren bakgrunn — ingen tekst eller logo",
    hint: "Produktet skal fylle 80–90 % av rammen." },
  { id: "p08", tab: "produktdata", group: "media", priority: "f",
    text: "Beskrivende alt-tekster på alle produktbilder",
    hint: "Format: produktnavn + farge + vinkel." },
  { id: "p09", tab: "produktdata", group: "media", priority: "a",
    text: "Bildene kan swipes og zoomes på mobil" },
  { id: "p10", tab: "produktdata", group: "media", priority: "a",
    text: "Produktvideo på nøkkelprodukter",
    hint: "Autoplay uten lyd, maks 30 sek, levert via CDN." },

  // Produktfeed — Obligatoriske felt
  { id: "f01", tab: "feed", group: "req", priority: "f",
    text: "<code>id</code> matcher item_id fra datalag eksakt",
    hint: "Rot-årsak til 0 % katalog-match. Test med tre tilfeldige produkter." },
  { id: "f02", tab: "feed", group: "req", priority: "f",
    text: "<code>link</code> peker til samme domene som pixel fyrer på",
    hint: "Pixel på <code>kunde.no</code> + feed mot <code>kunde.com</code> = 0 % match." },
  { id: "f03", tab: "feed", group: "req", priority: "f",
    text: "Én feedrad per variant — størrelse og farge som separate rader",
    hint: "Felles <code>item_group_id</code>, unik <code>id</code> per variant." },
  { id: "f04", tab: "feed", group: "req", priority: "f",
    text: "<code>title</code>: merke + produktnavn + type + farge",
    hint: "50–80 tegn for Meta, maks 150 for Google. Eks: <code>Merke Modell Dame Tursko Grønn</code>." },
  { id: "f05", tab: "feed", group: "req", priority: "f",
    text: "<code>description</code>: ren tekst, ingen HTML eller BBcode",
    hint: "Vises rått i annonser hvis ikke. 500–5000 tegn lopende prosa." },
  { id: "f06", tab: "feed", group: "req", priority: "f",
    text: "<code>gtin</code>/EAN satt på alle produkter" },
  { id: "f07", tab: "feed", group: "req", priority: "f",
    text: "<code>gender</code> korrekt per produkt — ikke <code>unisex</code> på alt",
    hint: "Hent fra kategorien i plattformen og map til <code>male</code>/<code>female</code>." },
  { id: "f08", tab: "feed", group: "req", priority: "f",
    text: "<code>image_link</code>: min 1024×1024px, ren bakgrunn, ingen overlay" },

  // Produktfeed — Anbefalte felt
  { id: "f09", tab: "feed", group: "rec", priority: "a",
    text: "<code>sale_price</code> + <code>sale_price_effective_date</code> — gir \"Salg\"-badge automatisk",
    hint: "Original i <code>price</code>, salgspris i <code>sale_price</code>, periode i <code>sale_price_effective_date</code>." },
  { id: "f10", tab: "feed", group: "rec", priority: "a",
    text: "<code>product_type</code> med konsekvent hierarki",
    hint: "Eks: <code>Herre &gt; Fjellsko</code> — likt på alle produkter og markeder." },
  { id: "f11", tab: "feed", group: "rec", priority: "a",
    text: "<code>shipping</code> og <code>shipping_weight</code> utfylt",
    hint: "Google beregner totalpris i Shopping-annonser fra dette." },
  { id: "f12", tab: "feed", group: "rec", priority: "a",
    text: "<code>return_policy</code> i feeden" },
  { id: "f13", tab: "feed", group: "rec", priority: "a",
    text: "<code>additional_image_link</code>: min. 4 (livsstil + detalj)" },

  // Produktfeed — Teknisk
  { id: "f14", tab: "feed", group: "tech", priority: "f",
    text: "Feed oppdateres minimum daglig — pris og lagerstatus stemmer alltid" },
  { id: "f15", tab: "feed", group: "tech", priority: "f",
    text: "Én separat feed per marked — domene, valuta og språk per marked",
    hint: "NO → <code>kunde.no / NOK</code> · SE → <code>kunde.se / SEK</code> · INT → <code>kunde.com/en / EUR</code>." },
  { id: "f16", tab: "feed", group: "tech", priority: "f",
    text: "Google Merchant Center: ingen aktive avvisninger",
    hint: "Vanligste årsaker: manglende GTIN, prisavvik mot landing page, ugyldig image_link." },
  { id: "f17", tab: "feed", group: "tech", priority: "a",
    text: "Meta-katalog koblet, godkjent og oppdateres automatisk" },
  { id: "f18", tab: "feed", group: "tech", priority: "o",
    text: "<code>custom_label_0–4</code> for budstrategi og segmentering",
    hint: "Sesong · Priskategori · Kampanje · Margin · Lager." },
  { id: "f19", tab: "feed", group: "tech", priority: "o",
    text: "<code>video_link</code> per variant — Advantage+ bruker automatisk video" },
  { id: "f20", tab: "feed", group: "tech", priority: "o",
    text: "<code>product_highlight</code> og <code>product_detail</code>",
    hint: "Punktliste med fordeler og strukturerte attributter (<code>Materiale: GORE-TEX</code>)." },
];

// ────────────────────────────────────────────────────────────
// Hjelpere
// ────────────────────────────────────────────────────────────

export function itemsByTab(tab: TabId): Item[] {
  return ITEMS.filter((i) => i.tab === tab);
}

export function itemsByGroup(tab: TabId, group: GroupId): Item[] {
  return ITEMS.filter((i) => i.tab === tab && i.group === group);
}

export function getItem(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

/** F.eks. "2026-Q2" basert på dato. */
export function kvartalFor(date: Date = new Date()): string {
  const m = date.getMonth() + 1;
  const q = Math.ceil(m / 3);
  return `${date.getFullYear()}-Q${q}`;
}

export function versjonLabel(v: AuditVersjon): string {
  switch (v) {
    case "draft":        return "Utkast";
    case "under_review": return "Under gjennomgang";
    case "godkjent":     return "Godkjent";
    case "arkivert":     return "Arkivert";
  }
}

// ────────────────────────────────────────────────────────────
// State-typer (DB-shape, klient-trygge)
// ────────────────────────────────────────────────────────────

export interface AuditState {
  id: string;
  client_id: string;
  versjon: AuditVersjon;
  kvartal: string;
  godkjent_av: string | null;
  godkjent_dato: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditItemRow {
  id: number;
  state_id: string;
  item_id: string;
  state: AuditItemState;
  note: string | null;
  assignee: "kunde" | null;
  auto: boolean;
  evidence: Record<string, unknown> | null;
  updated_at: string;
}
