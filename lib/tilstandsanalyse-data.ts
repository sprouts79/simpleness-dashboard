// Tilstandsanalyse — items + state per kunde.
// Fase 1: statisk. Fase 2: erstattes av Supabase-tabell `audit_state` per kunde + kvartal.
// Items-listen speiler audit-runneren under Simpleness/Verktøy/Test/Audit Runner/src/items.ts.

export type ItemTab = "sporing" | "produktdata" | "feed";
export type ItemPriority = "f" | "a" | "o";
export type ItemState = null | "s-na" | "s-p1" | "s-p2" | "s-wip" | "s-ok";
export type Assignee = null | "kunde";

export interface AuditItem {
  id: string;
  tab: ItemTab;
  g: string;
  p: ItemPriority;
  t: string;
  h?: string;
}

export interface AuditItemResult {
  state: ItemState;
  note: string;
  assignee: Assignee;
}

export interface AuditState {
  kunde_slug: string;
  kvartal: string;
  sist_oppdatert: string;
  items: Record<string, AuditItemResult>;
}

export const TABS: Record<ItemTab, { title: string }> = {
  sporing: { title: "Sporing" },
  produktdata: { title: "Produktdata" },
  feed: { title: "Produktfeed" },
};

export const GROUPS: Array<{ tab: ItemTab; id: string; label: string }> = [
  { tab: "sporing", id: "datalag", label: "Datalag" },
  { tab: "sporing", id: "google", label: "Google" },
  { tab: "sporing", id: "meta", label: "Meta" },
  { tab: "sporing", id: "snap", label: "Snap" },
  { tab: "produktdata", id: "schema", label: "Strukturert data" },
  { tab: "produktdata", id: "media", label: "Bilder og video" },
  { tab: "feed", id: "req", label: "Obligatoriske felt" },
  { tab: "feed", id: "rec", label: "Anbefalte felt" },
  { tab: "feed", id: "tech", label: "Teknisk" },
];

export const ITEMS: AuditItem[] = [
  // Sporing — Datalag
  { id: "s01", tab: "sporing", g: "datalag", p: "f", t: "Standardhendelser fyrer: view_item, add_to_cart, begin_checkout, purchase" },
  { id: "s02", tab: "sporing", g: "datalag", p: "f", t: "Produkt-ID i hendelsene matcher feed-ID eksakt" },
  { id: "s03", tab: "sporing", g: "datalag", p: "f", t: "Purchase fyrer kun én gang per ordre" },
  { id: "s04", tab: "sporing", g: "datalag", p: "f", t: "GTM installert på alle sider — inkludert ekstern kasse" },
  // Sporing — Google
  { id: "s05", tab: "sporing", g: "google", p: "f", t: "GA4 mottar purchase med riktig verdi og unik ordre-ID" },
  { id: "s06", tab: "sporing", g: "google", p: "f", t: "Én kilde for Google Ads-konvertering" },
  { id: "s07", tab: "sporing", g: "google", p: "f", t: "Google Consent Mode v2 aktivt" },
  { id: "s08", tab: "sporing", g: "google", p: "a", t: "Enhanced Conversions aktivert med user-data" },
  // Sporing — Meta
  { id: "s09", tab: "sporing", g: "meta", p: "f", t: "Meta Pixel sender ViewContent, AddToCart, Purchase med content_ids og value" },
  { id: "s10", tab: "sporing", g: "meta", p: "f", t: "Conversions API (server-side) satt opp" },
  { id: "s11", tab: "sporing", g: "meta", p: "f", t: "Deduplication mellom pixel og CAPI" },
  { id: "s12", tab: "sporing", g: "meta", p: "a", t: "Event Match Quality (EMQ) over 6,0" },
  // Sporing — Snap
  { id: "s13", tab: "sporing", g: "snap", p: "f", t: "Snap Pixel installert + standard events fyrer" },
  { id: "s14", tab: "sporing", g: "snap", p: "a", t: "Snap CAPI satt opp med deduplication" },
  { id: "s15", tab: "sporing", g: "snap", p: "a", t: "Snap-katalog koblet til annonsekontoen" },
  // Produktdata — Schema
  { id: "p01", tab: "produktdata", g: "schema", p: "f", t: "Product schema på alle produktsider — pris og lagerstatus" },
  { id: "p02", tab: "produktdata", g: "schema", p: "f", t: "AggregateRating-markup — gir stjerner i Google-søk" },
  { id: "p03", tab: "produktdata", g: "schema", p: "a", t: "FAQ-markup på produkt- og FAQ-sider" },
  { id: "p04", tab: "produktdata", g: "schema", p: "a", t: "BreadcrumbList schema på alle kategori- og produktsider" },
  // Produktdata — Media
  { id: "p05", tab: "produktdata", g: "media", p: "f", t: "Minst 4 bilder per produkt: front, bak, detalj, livsstil" },
  { id: "p06", tab: "produktdata", g: "media", p: "f", t: "Konsistent bakgrunn og format på tvers av sortimentet" },
  { id: "p07", tab: "produktdata", g: "media", p: "f", t: "Hovedbilde min. 1024x1024px med ren bakgrunn" },
  { id: "p08", tab: "produktdata", g: "media", p: "f", t: "Beskrivende alt-tekster på alle produktbilder" },
  { id: "p09", tab: "produktdata", g: "media", p: "a", t: "Bildene kan swipes og zoomes på mobil" },
  { id: "p10", tab: "produktdata", g: "media", p: "a", t: "Produktvideo på nøkkelprodukter" },
  // Feed — Obligatoriske felt
  { id: "f01", tab: "feed", g: "req", p: "f", t: "id matcher item_id fra datalag eksakt" },
  { id: "f02", tab: "feed", g: "req", p: "f", t: "link peker til samme domene som pixel fyrer på" },
  { id: "f03", tab: "feed", g: "req", p: "f", t: "Én feedrad per variant — størrelse og farge som separate rader" },
  { id: "f04", tab: "feed", g: "req", p: "f", t: "title: merke + produktnavn + type + farge" },
  { id: "f05", tab: "feed", g: "req", p: "f", t: "description: ren tekst, ingen HTML eller BBcode" },
  { id: "f06", tab: "feed", g: "req", p: "f", t: "gtin/EAN satt på alle produkter" },
  { id: "f07", tab: "feed", g: "req", p: "f", t: "gender korrekt per produkt — ikke unisex på alt" },
  { id: "f08", tab: "feed", g: "req", p: "f", t: "image_link: min 1024x1024px, ren bakgrunn" },
  // Feed — Anbefalte felt
  { id: "f09", tab: "feed", g: "rec", p: "a", t: "sale_price + sale_price_effective_date" },
  { id: "f10", tab: "feed", g: "rec", p: "a", t: "product_type med konsekvent hierarki" },
  { id: "f11", tab: "feed", g: "rec", p: "a", t: "shipping og shipping_weight utfylt" },
  { id: "f12", tab: "feed", g: "rec", p: "a", t: "return_policy i feeden" },
  { id: "f13", tab: "feed", g: "rec", p: "a", t: "additional_image_link: min. 4" },
  // Feed — Teknisk
  { id: "f14", tab: "feed", g: "tech", p: "f", t: "Feed oppdateres minimum daglig" },
  { id: "f15", tab: "feed", g: "tech", p: "f", t: "Én separat feed per marked" },
  { id: "f16", tab: "feed", g: "tech", p: "f", t: "Google Merchant Center: ingen aktive avvisninger" },
  { id: "f17", tab: "feed", g: "tech", p: "a", t: "Meta-katalog koblet, godkjent og oppdateres automatisk" },
  { id: "f18", tab: "feed", g: "tech", p: "o", t: "custom_label_0–4 for budstrategi og segmentering" },
  { id: "f19", tab: "feed", g: "tech", p: "o", t: "video_link per variant" },
  { id: "f20", tab: "feed", g: "tech", p: "o", t: "product_highlight og product_detail" },
];

export const STATE_LABEL: Record<NonNullable<ItemState> | "open", string> = {
  open: "Åpen",
  "s-na": "Mangler tilgang",
  "s-p1": "Prio 1",
  "s-p2": "Prio 2",
  "s-wip": "Jobbes med",
  "s-ok": "OK",
};

// ───────────────────────────────────────────────────────────────
// Per-kunde state (Fase 1 — hardkodet, flyttes til Supabase)
// ───────────────────────────────────────────────────────────────

const ALFA_STATE: AuditState = {
  kunde_slug: "alfa",
  kvartal: "2026-Q2",
  sist_oppdatert: "2026-05-13",
  items: {
    // Sporing
    s01: { state: "s-ok", note: "view_item, add_to_cart, begin_checkout og purchase fyrer korrekt på alle relevante sider.", assignee: null },
    s02: { state: "s-p2", note: "Stikkprøve viser at item_id stort sett matcher feed-id, men noen varianter har avvik. Bør kvalitetssikres bredere.", assignee: null },
    s03: { state: "s-ok", note: "Reload av ordrebekreftelse trigger ikke nytt purchase-event.", assignee: null },
    s04: { state: "s-ok", note: "GTM lastes på alle sider, inkludert Centra-checkout.", assignee: null },
    s05: { state: "s-ok", note: "GA4 mottar purchase med korrekt verdi og transaction_id.", assignee: null },
    s06: { state: "s-p2", note: "Konvertering importeres både fra GA4 og direkte tag. Bør konsolideres til én kilde.", assignee: null },
    s07: { state: "s-ok", note: "Consent Mode v2 aktiv via CMP. Granted/denied-signaler verifisert.", assignee: null },
    s08: { state: "s-p1", note: "Enhanced Conversions er aktivert, men user-data parametre (hashet e-post) sendes ikke.", assignee: null },
    s09: { state: "s-ok", note: "Meta Pixel sender ViewContent, AddToCart og Purchase med content_ids og value.", assignee: null },
    s10: { state: "s-p1", note: "Conversions API ikke satt opp. Estimert tap 20–40% av konverteringssignaler.", assignee: "kunde" },
    s11: { state: "s-na", note: "Kan ikke verifiseres før CAPI er på plass.", assignee: null },
    s12: { state: "s-p2", note: "EMQ for Purchase: 5,1. Bør over 6,0 — sender for lite PII.", assignee: null },
    s13: { state: null, note: "", assignee: null },
    s14: { state: null, note: "", assignee: null },
    s15: { state: null, note: "", assignee: null },
    // Produktdata
    p01: { state: "s-ok", note: "Product schema satt på alle PDPer med pris og lagerstatus.", assignee: null },
    p02: { state: "s-p2", note: "AggregateRating mangler i schema selv om anmeldelser vises på siden.", assignee: "kunde" },
    p03: { state: "s-p2", note: "FAQ-markup mangler. Produktsidene har FAQ-seksjoner som ikke utnyttes.", assignee: "kunde" },
    p04: { state: "s-ok", note: "BreadcrumbList schema satt korrekt.", assignee: null },
    p05: { state: "s-ok", note: "Stikkprøver viser 5–7 bilder per produkt (front, bak, detalj, livsstil).", assignee: null },
    p06: { state: "s-p2", note: "Hovedbildet har inkonsistent bakgrunn — nye produkter har ren hvit, eldre har miljø.", assignee: "kunde" },
    p07: { state: "s-ok", note: "Alle stikkprøver over 1500×1500px med ren bakgrunn.", assignee: null },
    p08: { state: "s-p1", note: "Ca 40% av produktbildene har generiske alt-tekster eller mangler.", assignee: "kunde" },
    p09: { state: "s-ok", note: "Mobil swipe/zoom fungerer på testede enheter.", assignee: null },
    p10: { state: "s-p2", note: "Produktvideo finnes på ~10 nøkkelprodukter — bør utvides til topp 30.", assignee: "kunde" },
    // Feed
    f01: { state: "s-ok", note: "Alle 1248 produkter har id.", assignee: null },
    f02: { state: "s-p1", note: "Feed-link peker til alfaoutdoor.com, mens pixel fyrer på alfa.no. 0% katalog-match.", assignee: "kunde" },
    f03: { state: "s-ok", note: "Varianter splittet på item_group_id + unik id per variant.", assignee: null },
    f04: { state: "s-p2", note: "85% av titlene følger merke + navn + type + farge. 187 produkter har for kort eller promotering-tittel.", assignee: "kunde" },
    f05: { state: "s-p1", note: "30% av beskrivelsene inneholder BBcode/HTML. Vises rått i Meta-annonser.", assignee: "kunde" },
    f06: { state: "s-p1", note: "GTIN mangler på 42% av produktene.", assignee: "kunde" },
    f07: { state: "s-p2", note: "62% er merket unisex. Bør differensieres til male/female.", assignee: "kunde" },
    f08: { state: "s-ok", note: "Alle image_link verifisert over 1024×1024px.", assignee: null },
    f09: { state: "s-ok", note: "sale_price og effective_date korrekt satt på aktive kampanjer.", assignee: null },
    f10: { state: "s-p2", note: "product_type satt, men hierarkiet er inkonsekvent på tvers av kategorier.", assignee: "kunde" },
    f11: { state: "s-p2", note: "shipping_weight mangler på 18% av produktene.", assignee: "kunde" },
    f12: { state: "s-p1", note: "return_policy ikke satt i feeden.", assignee: "kunde" },
    f13: { state: "s-p2", note: "Snitt 2,8 additional_image_link per produkt. Bør være minst 4.", assignee: "kunde" },
    f14: { state: "s-ok", note: "Centra-feed pulles hver 3. time. Pris og lagerstatus oppdateres jevnt.", assignee: null },
    f15: { state: "s-na", note: "Kun NO-feed registrert. Hvis Alfa selger i flere markeder må hvert få egen feed.", assignee: "kunde" },
    f16: { state: "s-p2", note: "Merchant Center viser 8% avvisninger — primært pga GTIN-feltet.", assignee: "kunde" },
    f17: { state: "s-na", note: "Meta-katalog koblet, men vi har ikke API-tilgang for å verifisere oppdateringsfrekvens.", assignee: null },
    f18: { state: null, note: "", assignee: null },
    f19: { state: null, note: "", assignee: null },
    f20: { state: null, note: "", assignee: null },
  },
};

const SAMPLE_STATES: Record<string, AuditState> = {
  alfa: ALFA_STATE,
};

export function hentAuditState(kundeSlug: string): AuditState | null {
  return SAMPLE_STATES[kundeSlug] ?? null;
}
