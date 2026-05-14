/**
 * Klient-trygge typer + konstanter for Onboarding-modulen.
 * Importeres av både server-kode (lib/db-onboarding.ts) og klient-komponenter (Wizard.tsx).
 *
 * Hold dette fri for Node-spesifikke importer (crypto, supabase, fs).
 */

export type OnboardingPlatform = "meta" | "ga4" | "google_ads" | "shopify" | "snapchat";

export const PLATFORMS: { id: OnboardingPlatform; navn: string; required: boolean }[] = [
  { id: "meta",       navn: "Meta Business Manager", required: true  },
  { id: "ga4",        navn: "Google Analytics 4",    required: true  },
  { id: "google_ads", navn: "Google Ads",            required: true  },
  { id: "shopify",    navn: "Shopify",               required: true  },
  { id: "snapchat",   navn: "Snapchat Ads Manager",  required: false },
];

export interface OnboardingSession {
  id: string;
  token: string;
  client_id: string;
  current_step: number;
  insights_locked: boolean;
  created_at: string;
  last_active_at: string;
  completed_at: string | null;
}

export interface OnboardingAccess {
  id: number;
  session_id: string;
  platform: OnboardingPlatform;
  required: boolean;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export interface OnboardingInsights {
  id: number;
  session_id: string;
  forretningsmal: string | null;
  omsetningsmal: string | null;
  prioritet: "topplinjevekst" | "lonnsomhet" | "begge" | null;
  utfordringer: string | null;
  malgruppe: string | null;
  konkurrenter: string | null;
  referanser_anti: string | null;
  ambassadorer_kreatorer: string | null;
  prioriterte_produkter: string | null;
  snittordre_nok: number | null;
  sesongvariasjoner: string | null;
  rabatter_bundles: string | null;
  manedlig_annonsebudsjett_nok: number | null;
  kpis: string[] | null;
  slack_medlemmer: string | null;
  suksess_definisjon: string | null;
  noe_mer: string | null;

  // Salgsmål og enhetsøkonomi (ekskl. mva)
  salgsmal_fjoraret_nok: number | null;
  salgsmal_vekstmal_pct: number | null;
  salgsmal_iar_nok: number | null;
  omsetning_forste_ordre_nok: number | null;
  omsetning_6mnd_nok: number | null;
  omsetning_12mnd_nok: number | null;
  andel_nye_kunder_pct: number | null;
  varekost_pct: number | null;
  frakt_pct: number | null;
  transaksjonsgebyr_pct: number | null;
  mkt_spend_arlig_nok: number | null;
  mkt_produksjon_arlig_nok: number | null;

  // Marketing
  nyhetsbrev_liste_antall: number | null;
  sms_liste_antall: number | null;
  nyhetsbrev_frekvens: string | null;
  automatiske_eposter_aktivert: boolean | null;
  automatiske_eposter_typer: string[] | null;
  marketingsaktiviteter_fungerte: string | null;
  marketingsaktiviteter_ikke_fungerte: string | null;

  submitted_at: string | null;
  updated_at: string;
}

export type DocumentCategory = "strategy" | "budget";

export interface OnboardingDocument {
  id: number;
  session_id: string;
  filename: string;
  storage_path: string | null;
  link_url: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  category: DocumentCategory;
  uploaded_at: string;
}

/** Mapper sessions current_step + completed_at til kundens lifecycle_stage. */
export function lifecycleStageFor(session: OnboardingSession):
  | "onboarding_ikke_startet"
  | "onboarding_steg_1"
  | "onboarding_steg_2"
  | "onboarding_steg_3"
  | "onboarding_fullfort" {
  if (session.completed_at) return "onboarding_fullfort";
  if (session.current_step >= 3) return "onboarding_steg_3";
  if (session.current_step === 2) return "onboarding_steg_2";
  if (session.current_step === 1) return "onboarding_steg_1";
  return "onboarding_ikke_startet";
}
